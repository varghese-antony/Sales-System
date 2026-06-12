import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/log-error'

function decodeWords(str) {
  if (!str) return ''
  // Decode RFC 2047 encoded words like =?UTF-8?B?...?= or =?UTF-8?Q?...?=
  return str.replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return Buffer.from(text, 'base64').toString('utf8')
      } else {
        return text.replace(/_/g, ' ').replace(/=([0-9A-F]{2})/gi, (__, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        )
      }
    } catch { return text }
  })
}

function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ─── Reply Categorisation ────────────────────────────────────────────────────
// Returns one of: 'ooo' | 'unsubscribe' | 'wrong_person' | 'bounce' | 'interested'
// 'interested' is the safe default — treated as a genuine positive reply.
function categoriseReply(subject = '', bodySnippet = '', fromAddr = '') {
  const text = (subject + ' ' + bodySnippet).toLowerCase()
  const sub = subject.toLowerCase()

  // Bounce / NDR — mailer-daemon or postmaster
  if (fromAddr.includes('mailer-daemon') || fromAddr.includes('postmaster')) return 'bounce'
  if (sub.includes('delivery status notification') || sub.includes('undeliverable') || sub.includes('mail delivery failed')) return 'bounce'
  if (text.includes('550 ') || text.includes('mailbox full') || text.includes('user unknown')) return 'bounce'

  // Out of Office
  if (sub.includes('out of office') || sub.includes('out of the office') || sub.includes('automatic reply') || sub.includes('auto-reply')) return 'ooo'
  if (text.includes('i am out of office') || text.includes('i am currently out') || text.includes('i\'m out of the office')) return 'ooo'
  if (text.includes('i\'m away') || text.includes('i am away') || text.includes('currently unavailable') || text.includes('on annual leave')) return 'ooo'
  if (text.includes('will return') || text.includes('back on') || text.includes('back in the office')) return 'ooo'
  if (text.includes('on vacation') || text.includes('on holiday') || text.includes('maternity leave') || text.includes('paternity leave')) return 'ooo'

  // Remove me / Unsubscribe
  if (text.includes('remove me') || text.includes('unsubscribe') || text.includes('take me off') || text.includes('stop emailing') || text.includes('do not contact')) return 'unsubscribe'
  if (text.includes('not interested') && text.includes('stop') ) return 'unsubscribe'
  if (text.includes('please remove') || text.includes('opt out') || text.includes('opt-out')) return 'unsubscribe'

  // Wrong person / Forwarded
  if (text.includes('wrong person') || text.includes('wrong email') || text.includes('wrong contact')) return 'wrong_person'
  if (text.includes('not the right') || text.includes('you should contact') || text.includes('you should speak to')) return 'wrong_person'
  if (text.includes('i\'m not') && (text.includes('founder') || text.includes('ceo') || text.includes('decision'))) return 'wrong_person'
  if (text.includes('i don\'t handle') || text.includes('i don\'t deal with')) return 'wrong_person'

  return 'interested'
}

export async function GET() {
  const client = new ImapFlow({
    host: 'imap.hostinger.com',
    port: 993,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: false,
  })

  try {
    await client.connect()
    const lock = await client.getMailboxLock('INBOX')
    const messages = []

    try {
      // Search for messages in the last 60 days
      const since = new Date()
      since.setDate(since.getDate() - 60)

      const uids = await client.search({ since }, { uid: true })
      if (!uids.length) {
        lock.release()
        await client.logout()
        return NextResponse.json({ success: true, messages: [] })
      }

      // Take the most recent 30 only
      const recentUids = uids.slice(-30)

      for await (const msg of client.fetch(recentUids, {
        envelope: true,
        flags: true,
        bodyStructure: true,
        source: true,
      }, { uid: true })) {
        try {
          const fromAddr = msg.envelope?.from?.[0]?.address?.toLowerCase() || ''
          const fromName = decodeWords(msg.envelope?.from?.[0]?.name || '')
          const subject = decodeWords(msg.envelope?.subject || '(no subject)')
          const date = msg.envelope?.date || new Date()
          const seen = msg.flags?.has('\\Seen') || false

          // Parse body from source
          let bodyText = ''
          if (msg.source) {
            const raw = msg.source.toString()
            // Try to extract plain text between headers and boundary
            const bodyStart = raw.indexOf('\r\n\r\n')
            if (bodyStart !== -1) {
              bodyText = raw.slice(bodyStart + 4)
                .replace(/=\r\n/g, '') // quoted-printable soft line breaks
                .replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
              bodyText = stripHtml(bodyText).slice(0, 500)
            }
          }

          // Skip our own sent emails
          if (fromAddr === process.env.SMTP_USER?.toLowerCase()) continue
          // Skip no-reply type addresses
          if (fromAddr.includes('noreply') || fromAddr.includes('no-reply') || fromAddr.includes('donotreply')) continue

          const category = categoriseReply(subject, bodyText, fromAddr)

          // Skip bounces entirely — we don't want to mark the lead as replied
          if (category === 'bounce') continue

          messages.push({
            uid: msg.uid,
            from: fromAddr,
            fromName: fromName || fromAddr,
            subject,
            date: date instanceof Date ? date.toISOString() : new Date(date).toISOString(),
            seen,
            snippet: bodyText.slice(0, 300),
            category,
          })
        } catch {}
      }
    } finally {
      lock.release()
    }

    await client.logout()

    // Sort newest first
    messages.sort((a, b) => new Date(b.date) - new Date(a.date))

    // Match messages against leads in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const fromAddresses = [...new Set(messages.map(m => m.from).filter(Boolean))]
    let leadMap = {}

    if (fromAddresses.length > 0) {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, full_name, company, email')
        .in('email', fromAddresses)

      if (leads) {
        for (const lead of leads) {
          if (lead.email) leadMap[lead.email.toLowerCase()] = lead
        }
      }
    }

    // ── Category-aware sequence and lead handling ─────────────────────────────
    // Group messages by lead + category (take the first/most-recent category per lead)
    const leadCategoryMap = {} // leadId → category
    for (const msg of messages) {
      const lead = leadMap[msg.from]
      if (!lead) continue
      if (!leadCategoryMap[lead.id]) leadCategoryMap[lead.id] = msg.category
    }

    let autoClosedSequences = 0

    for (const [leadId, category] of Object.entries(leadCategoryMap)) {
      if (category === 'ooo') {
        // OOO: delay the next follow-up by 7 days (don't mark replied or complete)
        const oooDelay = new Date()
        oooDelay.setUTCDate(oooDelay.getUTCDate() + 7)
        oooDelay.setUTCHours(12, 0, 0, 0)
        const { error } = await supabase
          .from('sequences')
          .update({ next_due_at: oooDelay.toISOString() })
          .eq('lead_id', leadId)
          .eq('complete', false)
          .eq('replied', false)
        if (error) await logError('check-replies', 'ooo-delay-failed', error, { leadId })
        // Don't count OOO as "closed" — sequence is still alive
        continue
      }

      if (category === 'unsubscribe') {
        // Unsubscribe: close sequence + set lead to unsubscribed
        await supabase.from('sequences')
          .update({ replied: true, complete: true })
          .eq('lead_id', leadId).eq('complete', false)
        await supabase.from('leads')
          .update({ status: 'unsubscribed' })
          .eq('id', leadId)
        autoClosedSequences++
        continue
      }

      if (category === 'wrong_person') {
        // Wrong person: close sequence but keep lead as 'contacted' (not interested)
        await supabase.from('sequences')
          .update({ replied: true, complete: true })
          .eq('lead_id', leadId).eq('complete', false)
        // Don't change lead status — leave as 'contacted'
        autoClosedSequences++
        continue
      }

      // 'interested' (default): original behaviour — close sequence, mark interested
      const { error: seqErr } = await supabase
        .from('sequences')
        .update({ replied: true, complete: true, reply_at: new Date().toISOString() })
        .eq('lead_id', leadId)
        .eq('replied', false)
        .eq('complete', false)
      if (seqErr) await logError('check-replies', 'sequence-auto-close-failed', seqErr, { leadId })

      const { error: leadErr } = await supabase
        .from('leads')
        .update({ status: 'interested' })
        .eq('id', leadId)
        .eq('status', 'contacted')
      if (leadErr) await logError('check-replies', 'lead-status-update-failed', leadErr, { leadId })
      autoClosedSequences++
    }

    // Attach lead info + category to messages
    const enriched = messages.map(m => ({
      ...m,
      lead: leadMap[m.from] || null,
    }))

    return NextResponse.json({ success: true, messages: enriched, autoClosedSequences })

  } catch (err) {
    try { await client.logout() } catch {}
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

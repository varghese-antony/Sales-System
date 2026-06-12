import { NextResponse } from 'next/server'
import { ImapFlow } from 'imapflow'
import { createClient } from '@supabase/supabase-js'

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

          messages.push({
            uid: msg.uid,
            from: fromAddr,
            fromName: fromName || fromAddr,
            subject,
            date: date instanceof Date ? date.toISOString() : new Date(date).toISOString(),
            seen,
            snippet: bodyText.slice(0, 300),
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

    // Auto-close sequences for anyone who replied
    // Do this before returning so the UI sees the updated state immediately
    const repliedLeadIds = Object.values(leadMap).map(l => l.id)
    if (repliedLeadIds.length > 0) {
      // Only close sequences that aren't already closed — avoid redundant writes
      await supabase
        .from('sequences')
        .update({ replied: true, complete: true, reply_at: new Date().toISOString() })
        .in('lead_id', repliedLeadIds)
        .eq('replied', false)
        .eq('complete', false)

      // Also update lead status to 'interested' so it surfaces in the pipeline
      await supabase
        .from('leads')
        .update({ status: 'interested' })
        .in('id', repliedLeadIds)
        .eq('status', 'contacted') // only move forward, never overwrite 'client' etc.
    }

    // Attach lead info to messages
    const enriched = messages.map(m => ({
      ...m,
      lead: leadMap[m.from] || null,
    }))

    return NextResponse.json({ success: true, messages: enriched, autoClosedSequences: repliedLeadIds.length })

  } catch (err) {
    try { await client.logout() } catch {}
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

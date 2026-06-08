import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ImapFlow } from 'imapflow'

// Scans the Hostinger Sent folder, matches emails to leads in the DB,
// and automatically creates sequence records for any that don't have one.
// Runs on cron daily + can be triggered manually from the UI.

export async function POST(request) {
  // Allow cron (Bearer token) or direct call from UI (no auth needed — internal only)
  const auth = request.headers.get('authorization') || ''
  const isCron = auth === `Bearer ${process.env.CRON_SECRET}`
  // UI calls come without auth — that's fine, this endpoint only reads/writes our own data

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const client = new ImapFlow({
    host: 'imap.hostinger.com',
    port: 993,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: false,
  })

  let synced = 0
  let alreadyTracked = 0
  let noMatch = 0

  try {
    await client.connect()

    // Try both common Sent folder names
    const sentFolders = ['Sent', 'Sent Items', 'INBOX.Sent', 'Sent Messages']
    let opened = false
    for (const folder of sentFolders) {
      try {
        await client.mailboxOpen(folder)
        opened = true
        break
      } catch {}
    }

    if (!opened) {
      await client.logout()
      return NextResponse.json({ success: false, error: 'Could not open Sent folder' }, { status: 500 })
    }

    // Search last 90 days
    const since = new Date()
    since.setDate(since.getDate() - 90)
    const uids = await client.search({ since }, { uid: true })

    if (!uids.length) {
      await client.logout()
      return NextResponse.json({ success: true, synced: 0, alreadyTracked: 0, noMatch: 0, total: 0 })
    }

    // Fetch all sent messages — we only need envelope (To, Subject, Date)
    const sentEmails = []
    for await (const msg of client.fetch(uids, { envelope: true }, { uid: true })) {
      try {
        const toAddrs = (msg.envelope?.to || []).map(a => a.address?.toLowerCase()).filter(Boolean)
        const subject = msg.envelope?.subject || ''
        const date = msg.envelope?.date || new Date()
        const messageId = msg.envelope?.messageId || null

        for (const toEmail of toAddrs) {
          // Skip our own address and system addresses
          if (toEmail === process.env.SMTP_USER?.toLowerCase()) continue
          if (toEmail.includes('noreply') || toEmail.includes('no-reply')) continue
          sentEmails.push({ toEmail, subject, date, messageId })
        }
      } catch {}
    }

    await client.logout()

    if (!sentEmails.length) {
      return NextResponse.json({ success: true, synced: 0, alreadyTracked: 0, noMatch: 0, total: 0 })
    }

    // Load all leads with emails for matching
    const { data: leads } = await supabase
      .from('leads')
      .select('id, email, company, status')
      .not('email', 'is', null)

    const leadByEmail = {}
    for (const lead of (leads || [])) {
      if (lead.email) leadByEmail[lead.email.toLowerCase()] = lead
    }

    // Load all existing sequences to avoid duplicates
    const { data: existingSeqs } = await supabase
      .from('sequences')
      .select('lead_id, created_at')
    const seqByLeadId = {}
    for (const seq of (existingSeqs || [])) {
      seqByLeadId[seq.lead_id] = seq
    }

    // Process each sent email
    // Group by recipient — keep the earliest send date per lead
    const earliestSendByLead = {}
    for (const sent of sentEmails) {
      const lead = leadByEmail[sent.toEmail]
      if (!lead) { noMatch++; continue }

      const sentDate = new Date(sent.date)
      if (!earliestSendByLead[lead.id] || sentDate < earliestSendByLead[lead.id].date) {
        earliestSendByLead[lead.id] = {
          lead,
          date: sentDate,
          subject: sent.subject,
          messageId: sent.messageId,
        }
      }
    }

    // Create sequences for matched leads that don't have one yet
    for (const [leadId, { lead, date, subject, messageId }] of Object.entries(earliestSendByLead)) {
      if (seqByLeadId[leadId]) {
        alreadyTracked++
        continue
      }

      // next_due_at = 3 days after the original send date (not from now)
      const nextDue = new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000)
      // If next_due is in the past, make follow-up due immediately
      const nextDueFinal = nextDue < new Date() ? new Date() : nextDue

      const { error: seqErr } = await supabase.from('sequences').insert({
        lead_id: leadId,
        angle_number: 2,
        step: 1,
        last_sent_at: date.toISOString(),
        next_due_at: nextDueFinal.toISOString(),
        original_subject: subject || 'follow up',
        original_message_id: messageId,
        replied: false,
        complete: false,
      })

      if (!seqErr) {
        // Mark lead as contacted
        await supabase.from('leads').update({ status: 'contacted' }).eq('id', leadId)
        synced++
      }
    }

    return NextResponse.json({
      success: true,
      synced,          // new sequences created
      alreadyTracked,  // already had a sequence
      noMatch,         // sent emails with no matching lead in DB
      total: sentEmails.length,
      message: synced > 0
        ? `${synced} leads auto-detected from Sent folder and enrolled in follow-up sequence`
        : alreadyTracked > 0
          ? `All sent emails already tracked (${alreadyTracked} leads)`
          : 'No matching leads found in Sent folder',
    })

  } catch (err) {
    try { await client.logout() } catch {}
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

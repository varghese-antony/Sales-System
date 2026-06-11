import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// ─── Master daily runner ────────────────────────────────────────────────────
// Replaces: check-sequences, auto-send, sync-sent (all in one)
// Called by Vercel cron at 6:00 UTC every day (Mon–Fri for sends)
// Sends Varghese a summary email every morning regardless

function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

function transport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: 465, secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

// ── Step 1: send all overdue follow-ups ──────────────────────────────────────
async function sendFollowups(supabase, appUrl, cronSecret) {
  const now = new Date().toISOString()
  const { data: dueSeqs } = await supabase
    .from('sequences')
    .select('*, leads(id, full_name, first_name, email)')
    .lte('next_due_at', now)
    .eq('complete', false)
    .eq('replied', false)

  if (!dueSeqs?.length) return { sent: 0, failed: 0, details: [] }

  let sent = 0, failed = 0
  const details = []

  for (const seq of dueSeqs) {
    const lead = seq.leads
    if (!lead?.email) continue
    try {
      const res = await fetch(`${appUrl}/api/send-followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cronSecret}` },
        body: JSON.stringify({
          sequenceId: seq.id,
          leadId: lead.id,
          to: lead.email,
          firstName: lead.first_name || lead.full_name?.split(' ')[0] || 'there',
          originalSubject: seq.original_subject,
          originalMessageId: seq.original_message_id,
        }),
      })
      const result = await res.json()
      if (result.success) {
        sent++
        details.push({ name: lead.full_name, email: lead.email, step: seq.step + 1, status: 'sent' })
      } else {
        failed++
        details.push({ name: lead.full_name, email: lead.email, step: seq.step + 1, status: 'failed', error: result.error })
      }
    } catch (err) {
      failed++
      details.push({ name: lead.full_name, email: lead.email, step: seq.step + 1, status: 'failed', error: err.message })
    }
    await new Promise(r => setTimeout(r, 800))
  }

  return { sent, failed, details }
}

// ── Step 2: send new outreach emails ─────────────────────────────────────────
async function sendNewEmails(appUrl) {
  const res = await fetch(`${appUrl}/api/auto-send`, { method: 'POST' })
  const data = await res.json()
  return {
    sent: data.sent || 0,
    failed: data.failed || 0,
    results: data.results || [],
  }
}

// ── Step 3: sync sent folder ──────────────────────────────────────────────────
async function syncSent(appUrl) {
  try {
    const res = await fetch(`${appUrl}/api/sync-sent`, { method: 'POST' })
    const data = await res.json()
    return data.synced || 0
  } catch { return 0 }
}

// ── Step 4: send summary notification to Varghese ────────────────────────────
async function sendSummaryEmail({ followups, newEmails, synced, isWeekend }) {
  const mailer = transport()
  const to = process.env.SMTP_USER // send to himself

  const totalSent = followups.sent + newEmails.sent
  const totalFailed = followups.failed + newEmails.failed
  const hasIssues = totalFailed > 0 || (totalSent === 0 && !isWeekend)

  const subject = hasIssues
    ? `⚠️ Blendery Daily Run — ${totalFailed} failed, ${totalSent} sent`
    : `✅ Blendery Daily Run — ${totalSent} emails sent`

  const followupRows = followups.details.map(d =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${d.name || '—'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${d.email}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">Step ${d.step}/3</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;color:${d.status==='sent'?'#16a34a':'#dc2626'}">${d.status==='sent'?'✅ Sent':'❌ '+d.error}</td>
    </tr>`
  ).join('')

  const newEmailRows = newEmails.results.map(r =>
    `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${r.company || '—'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${r.email}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">Initial</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0;color:${r.status==='sent'?'#16a34a':'#dc2626'}">${r.status==='sent'?'✅ Sent':'❌ '+(r.error||'failed')}</td>
    </tr>`
  ).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:32px 24px;background:#f9fafb;font-family:Arial,sans-serif;font-size:14px;color:#111;">
  <div style="max-width:620px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">

    <div style="background:${hasIssues?'#dc2626':'#0f172a'};padding:24px 28px;">
      <div style="font-size:18px;font-weight:700;color:#fff;">
        ${hasIssues ? '⚠️' : '✅'} Blendery Daily Outreach Report
      </div>
      <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:4px;">
        ${new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
      </div>
    </div>

    <div style="padding:24px 28px;display:flex;gap:16px;border-bottom:1px solid #f0f0f0;">
      <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#16a34a">${followups.sent}</div>
        <div style="font-size:11px;color:#666;margin-top:4px">Follow-ups sent</div>
      </div>
      <div style="flex:1;background:#eff6ff;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#2563eb">${newEmails.sent}</div>
        <div style="font-size:11px;color:#666;margin-top:4px">New emails sent</div>
      </div>
      <div style="flex:1;background:${totalFailed>0?'#fef2f2':'#f9fafb'};border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:${totalFailed>0?'#dc2626':'#9ca3af'}">${totalFailed}</div>
        <div style="font-size:11px;color:#666;margin-top:4px">Failed</div>
      </div>
      <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:#374151">${synced}</div>
        <div style="font-size:11px;color:#666;margin-top:4px">Replies synced</div>
      </div>
    </div>

    ${followups.details.length > 0 ? `
    <div style="padding:20px 28px;border-bottom:1px solid #f0f0f0;">
      <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:12px">Follow-ups</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f9fafb">
          <th style="padding:6px 12px;text-align:left;color:#6b7280">Name</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280">Email</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280">Step</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280">Status</th>
        </tr>
        ${followupRows}
      </table>
    </div>` : ''}

    ${newEmails.results.length > 0 ? `
    <div style="padding:20px 28px;border-bottom:1px solid #f0f0f0;">
      <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:12px">New outreach</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr style="background:#f9fafb">
          <th style="padding:6px 12px;text-align:left;color:#6b7280">Company</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280">Email</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280">Type</th>
          <th style="padding:6px 12px;text-align:left;color:#6b7280">Status</th>
        </tr>
        ${newEmailRows}
      </table>
    </div>` : ''}

    ${totalSent === 0 && !isWeekend ? `
    <div style="padding:16px 28px;background:#fef3c7;border-bottom:1px solid #f0f0f0;">
      <div style="font-size:13px;font-weight:700;color:#92400e">⚠️ Nothing sent today</div>
      <div style="font-size:12px;color:#78350f;margin-top:4px">Check the system — no new emails and no follow-ups were sent.</div>
    </div>` : ''}

    <div style="padding:16px 28px;">
      <a href="https://sales-system-blendery.vercel.app/smart-outreach"
         style="display:inline-block;padding:10px 20px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:600">
        Open Smart Outreach →
      </a>
    </div>

  </div>
</body>
</html>`

  await mailer.sendMail({ from: `"Blendery System" <${process.env.SMTP_USER}>`, to, subject, html })
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sales-system-blendery.vercel.app'
  const cronSecret = process.env.CRON_SECRET
  const supabase = supabaseClient()

  const day = new Date().getDay() // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6

  // Step 1: always send overdue follow-ups (7 days a week)
  const followups = await sendFollowups(supabase, appUrl, cronSecret)

  // Step 2: new outreach only Mon–Fri
  let newEmails = { sent: 0, failed: 0, results: [] }
  if (!isWeekend) {
    newEmails = await sendNewEmails(appUrl)
  }

  // Step 3: sync sent folder replies
  const synced = await syncSent(appUrl)

  // Step 4: always send summary email to Varghese
  try {
    await sendSummaryEmail({ followups, newEmails, synced, isWeekend })
  } catch (err) {
    console.error('Summary email failed:', err.message)
  }

  return NextResponse.json({
    success: true,
    followupsSent: followups.sent,
    followupsFailed: followups.failed,
    newEmailsSent: newEmails.sent,
    synced,
    isWeekend,
  })
}

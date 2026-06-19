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

// ── Step 0: check for new replies and auto-close sequences ────────────────────
// Must run BEFORE follow-ups so we don't send a follow-up to someone who just replied.
async function checkReplies(appUrl, cronSecret) {
  try {
    const res = await fetch(`${appUrl}/api/check-replies`, {
      headers: { 'Authorization': `Bearer ${cronSecret}` },
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    return { autoClosedSequences: data.autoClosedSequences || 0, repliesFound: data.messages?.length || 0 }
  } catch { return { autoClosedSequences: 0, repliesFound: 0 } }
}

// ── Step 1: send all overdue follow-ups (batched parallel) ───────────────────
// Sends BATCH_SIZE follow-ups simultaneously, then waits BATCH_DELAY before
// the next batch. 5 parallel × 1.5s gap = ~6s per batch of 5.
// 30 overdue leads = 3 batches × 6s ≈ 18s (vs 30 × 800ms = 24s sequential).
// Vercel Hobby functions have a 60s timeout — this approach handles up to ~45 leads safely.
const FOLLOWUP_BATCH_SIZE = 5
const FOLLOWUP_BATCH_DELAY = 1500 // ms between batches

async function sendFollowups(supabase, appUrl, cronSecret) {
  const now = new Date().toISOString()
  const { data: dueSeqs } = await supabase
    .from('sequences')
    .select('*, leads(id, full_name, first_name, email)')
    .lte('next_due_at', now)
    .eq('complete', false)
    .eq('replied', false)
    .limit(50) // Hard cap: never process >50 in one cron run

  if (!dueSeqs?.length) return { sent: 0, failed: 0, details: [] }

  // Filter out sequences without a lead email before batching
  const valid = dueSeqs.filter(s => s.leads?.email)

  let sent = 0, failed = 0
  const details = []

  async function sendOne(seq) {
    const lead = seq.leads
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
        signal: AbortSignal.timeout(15000),
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
  }

  // Process in batches of FOLLOWUP_BATCH_SIZE
  for (let i = 0; i < valid.length; i += FOLLOWUP_BATCH_SIZE) {
    const batch = valid.slice(i, i + FOLLOWUP_BATCH_SIZE)
    await Promise.all(batch.map(sendOne))
    // Brief pause between batches to avoid SMTP rate limiting
    if (i + FOLLOWUP_BATCH_SIZE < valid.length) {
      await new Promise(r => setTimeout(r, FOLLOWUP_BATCH_DELAY))
    }
  }

  return { sent, failed, details }
}

// ── Step 2: send new outreach emails ─────────────────────────────────────────
// NOTE: /api/auto-send is a PROTECTED route (middleware requires Bearer CRON_SECRET).
// Must pass cronSecret in the Authorization header — without it the call gets 401
// and new outreach emails silently never send.
async function sendNewEmails(appUrl, cronSecret) {
  try {
    const res = await fetch(`${appUrl}/api/auto-send`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cronSecret}` },
      signal: AbortSignal.timeout(55000), // auto-send can take up to 50s (enrichment + sends)
    })
    const data = await res.json()
    return {
      sent: data.sent || 0,
      failed: data.failed || 0,
      results: data.results || [],
      skipped: data.skipped || false,
      reason: data.reason || null,
    }
  } catch (err) {
    console.error('sendNewEmails failed:', err.message)
    return { sent: 0, failed: 0, results: [], skipped: false, reason: err.message }
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

// ── Step 3b: purge stale cache entries from settings table ────────────────────
// Both scrape_cache and signal_cache have a 24h read TTL.
// We purge entries older than 48h (once per day) so the table stays bounded.
async function purgeScrapeCache(supabase) {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    let totalPurged = 0

    for (const prefix of ['scrape_cache:%', 'signal_cache:%']) {
      const { count } = await supabase
        .from('settings')
        .delete({ count: 'exact' })
        .like('key', prefix)
        .lt('updated_at', cutoff)
      totalPurged += (count || 0)
    }

    return totalPurged
  } catch (err) {
    console.error('Cache purge failed:', err.message)
    return 0
  }
}

// ── Step 3c: run QA health check as backup monitor ────────────────────────────
// Acts as a second monitoring layer — if UptimeRobot goes down, this daily
// email still tells Varghese about any system failures.
//
// qa-health response shape:
//   { healthy, checks (number), passed, healed, warnings, failures, results (array), timestamp }
//   results[i] = { name, status ('ok'|'warn'|'fail'|'healed'), message }
//   NOTE: no 'score' field, no 'checks' array — 'checks' is a count, 'results' is the array.
async function runQACheck(appUrl, cronSecret) {
  try {
    const res = await fetch(`${appUrl}/api/qa-health`, {
      headers: { 'Authorization': `Bearer ${cronSecret}` },
      signal: AbortSignal.timeout(30000),
    })
    const data = await res.json()
    const results = data.results || []                              // array of check objects
    const failed  = results.filter(c => c.status === 'fail')       // critical failures
    const warned  = results.filter(c => c.status === 'warn')       // warnings
    const passed  = results.filter(c => c.status === 'ok' || c.status === 'healed')
    const total   = results.length
    const score   = total > 0 ? Math.round((passed.length / total) * 100) : 0
    return {
      total,
      passed: passed.length,
      failed: [...failed, ...warned],  // show both fails and warns in the daily email
      score,
      healthy: data.healthy ?? (failed.length === 0),
    }
  } catch (err) {
    console.error('runQACheck failed:', err.message)
    return { total: 0, passed: 0, failed: [], score: 0, healthy: null }
  }
}

// ── Step 4: send summary notification to Varghese ────────────────────────────
async function sendSummaryEmail({ replies, followups, newEmails, synced, isWeekend, qa }) {
  const mailer = transport()
  // REPORT_TO = the inbox you actually check (e.g. antonyv@blendery.tech or Gmail).
  // Falls back to SMTP_USER (the Hostinger sending address) if not set — but that
  // means the report only lands in the Hostinger inbox, not wherever you read email.
  const to = process.env.REPORT_TO || process.env.SMTP_USER

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
      <div style="flex:1;background:${replies.autoClosedSequences>0?'#f0fdf4':'#f9fafb'};border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:28px;font-weight:700;color:${replies.autoClosedSequences>0?'#16a34a':'#9ca3af'}">${replies.autoClosedSequences}</div>
        <div style="font-size:11px;color:#666;margin-top:4px">Sequences closed</div>
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

    ${qa?.failed?.length > 0 ? `
    <div style="padding:16px 28px;background:#fef2f2;border-bottom:1px solid #f0f0f0;">
      <div style="font-size:13px;font-weight:700;color:#dc2626;margin-bottom:8px">🔴 QA Health: ${qa.failed.length} check${qa.failed.length>1?'s':''} failing (${qa.passed}/${qa.total} passed)</div>
      ${qa.failed.map(f => `<div style="font-size:12px;color:#7f1d1d;margin-bottom:4px;">• <b>${f.name}</b>: ${f.message || f.error || 'failed'}</div>`).join('')}
    </div>` : qa?.total > 0 ? `
    <div style="padding:12px 28px;background:#f0fdf4;border-bottom:1px solid #f0f0f0;">
      <div style="font-size:12px;color:#15803d;">✅ QA Health: all ${qa.total} checks passing (score: ${qa.score})</div>
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

  // Log run start time so QA health check can verify it fired
  await supabase.from('settings').upsert({ key: 'last_daily_run', value: new Date().toISOString(), updated_at: new Date().toISOString() })

  // Step 0: check for replies first — close sequences before sending follow-ups
  const replies = await checkReplies(appUrl, cronSecret)

  // Step 1: always send overdue follow-ups (7 days a week)
  const followups = await sendFollowups(supabase, appUrl, cronSecret)

  // Step 2: new outreach only Mon–Fri
  let newEmails = { sent: 0, failed: 0, results: [] }
  if (!isWeekend) {
    newEmails = await sendNewEmails(appUrl, cronSecret)
  }

  // Step 3: sync sent folder replies
  const synced = await syncSent(appUrl)

  // Step 3b: purge stale scrape cache (fire and forget — doesn't block summary)
  const cachesPurged = await purgeScrapeCache(supabase)

  // Step 3c: run QA health check (backup monitor — results go into summary email)
  const qa = await runQACheck(appUrl, cronSecret)

  // Step 4: always send summary email to Varghese
  try {
    await sendSummaryEmail({ replies, followups, newEmails, synced, isWeekend, qa })
  } catch (err) {
    console.error('Summary email failed:', err.message)
    // Log to DB so QA can surface it — previously this failed silently with no trace
    await supabase.from('system_errors').insert({
      source: 'daily-runner',
      type: 'summary-email-failed',
      message: err.message,
      context: JSON.stringify({ to: process.env.REPORT_TO || process.env.SMTP_USER }),
    }).catch(() => {})
  }

  return NextResponse.json({
    success: true,
    repliesFound: replies.repliesFound,
    autoClosedSequences: replies.autoClosedSequences,
    followupsSent: followups.sent,
    followupsFailed: followups.failed,
    newEmailsSent: newEmails.sent,
    synced,
    cachesPurged,
    isWeekend,
    qaScore: qa.score,
    qaFailed: qa.failed.length,
  })
}

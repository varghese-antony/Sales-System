import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'

// ─── QA Health Monitor ────────────────────────────────────────────────────────
// Called every 5 minutes by UptimeRobot (free external monitor)
// Returns 200 = all good, 500 = something broken
// Self-heals what it can. Emails Varghese with exact Claude instruction for the rest.
//
// Setup: register https://sales-system-blendery.vercel.app/api/qa-health
// on UptimeRobot → HTTP(S) monitor, 5-min interval, alert on non-200

const APP_URL = 'https://sales-system-blendery.vercel.app'
const NOTIFY_EMAIL = 'antonyv@blendery.tech'
const CHECKS = ['daily_runner', 'sequences', 'enrichment', 'smtp', 'supabase', 'lead_growth', 'email_pipeline']

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

// ── helper: get setting value ─────────────────────────────────────────────────
async function getSetting(supabase, key) {
  const { data } = await supabase.from('settings').select('value').eq('key', key).single()
  return data?.value ?? null
}

// ── helper: was alert already sent in last N minutes (avoid spam) ─────────────
async function alertSentRecently(supabase, checkName, minutes = 60) {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', `qa_alert_${checkName}`)
    .single()
  if (!data?.value) return false
  return new Date(data.value) > new Date(since)
}

async function markAlertSent(supabase, checkName) {
  await supabase.from('settings').upsert({ key: `qa_alert_${checkName}`, value: new Date().toISOString(), updated_at: new Date().toISOString() })
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 1 — Did daily-runner fire today?
// ══════════════════════════════════════════════════════════════════════════════
async function checkDailyRunner(supabase) {
  const lastRun = await getSetting(supabase, 'last_daily_run')
  if (!lastRun) return {
    name: 'daily_runner', status: 'warn',
    message: 'Daily runner has never logged a run',
    fix: null, claudeInstruction: null,
  }

  const lastRunDate = new Date(lastRun)
  const hoursAgo = (Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60)
  const today = new Date()
  const isWeekend = today.getUTCDay() === 0 || today.getUTCDay() === 6

  // On weekends, allow up to 50h gap (Fri→Mon)
  const threshold = isWeekend ? 50 : 26

  if (hoursAgo > threshold) {
    // Try to self-heal: trigger daily-runner now
    let healed = false
    try {
      const res = await fetch(`${APP_URL}/api/daily-runner`, {
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
      })
      const d = await res.json()
      healed = d.success === true
    } catch {}

    return {
      name: 'daily_runner', status: healed ? 'healed' : 'fail',
      message: `Daily runner last ran ${Math.round(hoursAgo)}h ago`,
      healed: healed ? 'Triggered daily-runner manually' : null,
      fix: healed ? null : 'Daily runner cron may be broken on Vercel',
      claudeInstruction: healed ? null : 'The daily-runner cron has not fired in over 26 hours. Check the Vercel cron logs and fix whatever is preventing /api/daily-runner from running.',
    }
  }

  return { name: 'daily_runner', status: 'ok', message: `Ran ${Math.round(hoursAgo)}h ago` }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 2 — Stuck sequences (overdue by >3h and not sent)
// ══════════════════════════════════════════════════════════════════════════════
async function checkSequences(supabase) {
  const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  const { data: stuck } = await supabase
    .from('sequences')
    .select('id, step, next_due_at, leads(full_name, email, first_name)')
    .lte('next_due_at', cutoff)
    .eq('complete', false)
    .eq('replied', false)

  if (!stuck?.length) return { name: 'sequences', status: 'ok', message: 'No stuck sequences' }

  // Self-heal: send them now
  let sent = 0, failed = 0
  for (const seq of stuck) {
    const lead = seq.leads
    if (!lead?.email) continue
    try {
      const res = await fetch(`${APP_URL}/api/send-followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
        body: JSON.stringify({
          sequenceId: seq.id, leadId: lead.id || seq.lead_id,
          to: lead.email,
          firstName: lead.first_name || lead.full_name?.split(' ')[0] || 'there',
        }),
      })
      const r = await res.json()
      r.success ? sent++ : failed++
    } catch { failed++ }
    await new Promise(r => setTimeout(r, 600))
  }

  return {
    name: 'sequences', status: failed > 0 ? 'fail' : 'healed',
    message: `${stuck.length} overdue sequences found`,
    healed: sent > 0 ? `Auto-sent ${sent} overdue follow-ups` : null,
    fix: failed > 0 ? `${failed} follow-ups failed to send` : null,
    claudeInstruction: failed > 0
      ? `${failed} follow-up emails failed to send. Check SMTP credentials and the send-followup API route for errors.`
      : null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 3 — Enrichment stuck?
// ══════════════════════════════════════════════════════════════════════════════
async function checkEnrichment(supabase) {
  const status = await getSetting(supabase, 'enrich_job_status')
  if (status !== 'running') return { name: 'enrichment', status: 'ok', message: `Enrichment status: ${status || 'idle'}` }

  const updatedRaw = await getSetting(supabase, 'enrich_updated_at')
  if (!updatedRaw) return { name: 'enrichment', status: 'ok', message: 'Enrichment running' }

  const minsStale = (Date.now() - new Date(updatedRaw).getTime()) / (1000 * 60)
  if (minsStale < 15) return { name: 'enrichment', status: 'ok', message: `Enrichment running (updated ${Math.round(minsStale)}m ago)` }

  // Self-heal: reset stuck job
  let healed = false
  try {
    const res = await fetch(`${APP_URL}/api/enrich-all-background`, { method: 'DELETE' })
    const d = await res.json()
    healed = d.success === true
  } catch {}

  return {
    name: 'enrichment', status: healed ? 'healed' : 'fail',
    message: `Enrichment stuck for ${Math.round(minsStale)} minutes`,
    healed: healed ? 'Auto-reset stuck enrichment job' : null,
    fix: healed ? null : 'Could not reset enrichment job',
    claudeInstruction: healed ? null : 'Enrichment is stuck and could not be auto-reset. Check /api/enrich-all-background DELETE endpoint.',
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 4 — SMTP reachable?
// ══════════════════════════════════════════════════════════════════════════════
async function checkSMTP() {
  try {
    const t = transport()
    await t.verify()
    return { name: 'smtp', status: 'ok', message: 'SMTP connected' }
  } catch (err) {
    return {
      name: 'smtp', status: 'fail',
      message: `SMTP connection failed: ${err.message}`,
      fix: 'SMTP credentials may be wrong or Hostinger blocked',
      claudeInstruction: `SMTP is down — cannot send any emails. Error: "${err.message}". Check SMTP_HOST, SMTP_USER, SMTP_PASS in Vercel environment variables. May need to re-enable SMTP access in Hostinger control panel.`,
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 5 — Supabase reachable?
// ══════════════════════════════════════════════════════════════════════════════
async function checkSupabase(supabase) {
  try {
    const start = Date.now()
    const { error } = await supabase.from('leads').select('id').limit(1)
    const ms = Date.now() - start
    if (error) throw new Error(error.message)
    return { name: 'supabase', status: ms > 3000 ? 'warn' : 'ok', message: `Supabase responding (${ms}ms)` }
  } catch (err) {
    return {
      name: 'supabase', status: 'fail',
      message: `Supabase unreachable: ${err.message}`,
      fix: 'Database is down — entire system non-functional',
      claudeInstruction: `Supabase is unreachable. Error: "${err.message}". Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars. Check Supabase project status at supabase.com.`,
    }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 6 — Lead discovery working? (any leads added in last 7 days)
// ══════════════════════════════════════════════════════════════════════════════
async function checkLeadGrowth(supabase) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since)

  if (count > 0) return { name: 'lead_growth', status: 'ok', message: `${count} leads added in last 7 days` }

  return {
    name: 'lead_growth', status: 'warn',
    message: 'No new leads added in 7 days',
    fix: 'Google Maps lead discovery may be failing',
    claudeInstruction: 'No new leads have been added in 7 days. The /api/cron lead discovery is not finding leads. Check the Google Maps API key (GOOGLE_MAPS_API_KEY) and the cron route for errors.',
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 7 — Email pipeline healthy? (emails sent in last 48h on weekdays)
// ══════════════════════════════════════════════════════════════════════════════
async function checkEmailPipeline(supabase) {
  const today = new Date()
  const isWeekend = today.getUTCDay() === 0 || today.getUTCDay() === 6
  if (isWeekend) return { name: 'email_pipeline', status: 'ok', message: 'Weekend — no sends expected' }

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('outreach')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('created_at', since)

  // Check how many leads need contact
  const { count: needsContact } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')
    .not('email', 'is', null)

  if (count > 0) return { name: 'email_pipeline', status: 'ok', message: `${count} emails sent in last 48h` }

  if (needsContact === 0) return { name: 'email_pipeline', status: 'ok', message: 'No leads need contact right now' }

  return {
    name: 'email_pipeline', status: 'warn',
    message: `0 emails sent in 48h — ${needsContact} leads waiting`,
    fix: 'Auto-send may not be running or all sends are failing',
    claudeInstruction: `No emails have been sent in 48 hours but ${needsContact} leads are waiting. The auto-send is not firing or is failing silently. Check the daily-runner logs and auto-send route.`,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Alert email builder
// ══════════════════════════════════════════════════════════════════════════════
async function sendAlertEmail(issues, healed, allResults) {
  const mailer = transport()

  const failCount = issues.filter(r => r.status === 'fail').length
  const warnCount = issues.filter(r => r.status === 'warn').length
  const healedCount = healed.length

  const subject = failCount > 0
    ? `🔴 Blendery QA — ${failCount} critical issue${failCount > 1 ? 's' : ''} detected`
    : `🟡 Blendery QA — ${warnCount} warning${warnCount > 1 ? 's' : ''}`

  const statusRow = (r) => {
    const icon = r.status === 'ok' ? '✅' : r.status === 'healed' ? '🔧' : r.status === 'warn' ? '🟡' : '🔴'
    const color = r.status === 'ok' ? '#16a34a' : r.status === 'healed' ? '#2563eb' : r.status === 'warn' ? '#d97706' : '#dc2626'
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:13px">${icon} ${r.name.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;color:${color}">${r.message}</td>
    </tr>`
  }

  const claudeInstructions = issues
    .filter(r => r.claudeInstruction)
    .map((r, i) => `
      <div style="margin-bottom:14px;padding:14px 16px;background:#fff3cd;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0">
        <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">
          📋 Tell Tech Head Claude:
        </div>
        <div style="font-size:13px;color:#1f2937;font-family:monospace;line-height:1.6">${r.claudeInstruction}</div>
      </div>
    `).join('')

  const healedSection = healed.length > 0 ? `
    <div style="padding:16px 20px;background:#ecfdf5;border-bottom:1px solid #d1fae5">
      <div style="font-size:13px;font-weight:700;color:#065f46;margin-bottom:8px">🔧 Auto-fixed (${healed.length})</div>
      ${healed.map(r => `<div style="font-size:12px;color:#047857;margin-bottom:4px">• ${r.healed}</div>`).join('')}
    </div>` : ''

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:24px;background:#f9fafb;font-family:Arial,sans-serif;color:#111">
<div style="max-width:620px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">

  <div style="background:${failCount > 0 ? '#dc2626' : '#d97706'};padding:20px 24px">
    <div style="font-size:17px;font-weight:700;color:#fff">${subject}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:3px">
      ${new Date().toUTCString()} · Blendery Sales System QA
    </div>
  </div>

  ${healedSection}

  <div style="padding:20px 24px;border-bottom:1px solid #f3f4f6">
    <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:12px">System Status</div>
    <table style="width:100%;border-collapse:collapse">
      ${allResults.map(statusRow).join('')}
    </table>
  </div>

  ${claudeInstructions ? `
  <div style="padding:20px 24px;border-bottom:1px solid #f3f4f6;background:#fffbeb">
    <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:12px">
      ⚡ Action needed — copy and paste into Tech Head Claude:
    </div>
    ${claudeInstructions}
  </div>` : ''}

  <div style="padding:16px 24px;display:flex;gap:10px">
    <a href="${APP_URL}/dashboard" style="display:inline-block;padding:9px 18px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600">
      Open Dashboard →
    </a>
    <a href="${APP_URL}/api/qa-health" style="display:inline-block;padding:9px 18px;background:#f3f4f6;color:#374151;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600">
      Re-run Health Check
    </a>
  </div>

</div>
</body></html>`

  await mailer.sendMail({
    from: `"Blendery QA 🤖" <${process.env.SMTP_USER}>`,
    to: NOTIFY_EMAIL,
    subject,
    html,
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// Main handler — called by UptimeRobot every 5 minutes
// ══════════════════════════════════════════════════════════════════════════════
export async function GET() {
  const supabase = supabaseClient()
  const startTime = Date.now()

  // Run all checks in parallel where possible
  const [supabaseResult, smtpResult] = await Promise.all([
    checkSupabase(supabase),
    checkSMTP(),
  ])

  // Sequential checks that depend on Supabase
  const supabaseOk = supabaseResult.status !== 'fail'
  let results = [supabaseResult, smtpResult]

  if (supabaseOk) {
    const [dailyRunner, sequences, enrichment, leadGrowth, emailPipeline] = await Promise.all([
      checkDailyRunner(supabase),
      checkSequences(supabase),
      checkEnrichment(supabase),
      checkLeadGrowth(supabase),
      checkEmailPipeline(supabase),
    ])
    results = [supabaseResult, smtpResult, dailyRunner, sequences, enrichment, leadGrowth, emailPipeline]
  }

  const issues   = results.filter(r => r.status === 'fail' || r.status === 'warn')
  const healed   = results.filter(r => r.status === 'healed')
  const critical = results.filter(r => r.status === 'fail')
  const allOk    = issues.length === 0

  // Send alert email — but throttle: only once per hour per check to avoid spam
  if (issues.length > 0 && supabaseOk) {
    const unthrottled = []
    for (const issue of issues) {
      const recent = await alertSentRecently(supabase, issue.name, 60)
      if (!recent) {
        unthrottled.push(issue)
        await markAlertSent(supabase, issue.name)
      }
    }
    if (unthrottled.length > 0 || healed.length > 0) {
      try {
        await sendAlertEmail(unthrottled, healed, results)
      } catch (err) {
        console.error('QA alert email failed:', err.message)
      }
    }
  }

  const summary = {
    healthy: allOk,
    checks: results.length,
    passed: results.filter(r => r.status === 'ok').length,
    healed: healed.length,
    warnings: results.filter(r => r.status === 'warn').length,
    failures: critical.length,
    responseTimeMs: Date.now() - startTime,
    results: results.map(r => ({ name: r.name, status: r.status, message: r.message })),
    timestamp: new Date().toISOString(),
  }

  // Return 500 for critical failures (triggers UptimeRobot alert)
  // Return 200 for ok, healed, or warn (system running, just not perfect)
  return NextResponse.json(summary, { status: critical.length > 0 ? 500 : 200 })
}

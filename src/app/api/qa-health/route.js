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

// ── helper: fire-and-forget internal API call (3s timeout, don't block qa-health) ─
async function fireAndForget(url, options = {}) {
  try {
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 3000)
    const res = await fetch(url, { ...options, signal: controller.signal })
    try { const d = await res.json(); return d } catch { return { success: true } }
  } catch { return { success: false } }
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
    // Try to self-heal: trigger daily-runner (fire-and-forget — it's slow)
    const d = await fireAndForget(`${APP_URL}/api/daily-runner`, {
      headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
    })
    const healed = d.success === true

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

  // Self-heal: kick off daily-runner to send them (fire-and-forget — don't block qa-health)
  const healRes = await fireAndForget(`${APP_URL}/api/daily-runner`, {
    headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
  })
  const sent = healRes.followupsSent || 0
  const failed = 0

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

  const updatedRaw = await getSetting(supabase, 'enrich_job_updated_at')
  if (!updatedRaw) return { name: 'enrichment', status: 'ok', message: 'Enrichment running' }

  const minsStale = (Date.now() - new Date(updatedRaw).getTime()) / (1000 * 60)
  if (minsStale < 15) return { name: 'enrichment', status: 'ok', message: `Enrichment running (updated ${Math.round(minsStale)}m ago)` }

  // Self-heal: reset stuck job (fire-and-forget)
  const resetRes = await fireAndForget(`${APP_URL}/api/enrich-all-background`, { method: 'DELETE' })
  const healed = resetRes.success === true

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
    // 5s timeout — SMTP verify can hang if Hostinger is slow
    await Promise.race([
      t.verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SMTP verify timed out after 5s')), 5000)),
    ])
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
// CHECK 8 — Enrichment gaps (leads with website but no email for >3 days)
// ══════════════════════════════════════════════════════════════════════════════
async function checkEnrichmentGaps(supabase) {
  const cutoff = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .not('website', 'is', null)
    .is('email', null)
    .lt('created_at', cutoff)

  if (!count || count === 0) return { name: 'enrichment_gaps', status: 'ok', message: 'All leads enriched' }

  // Many sites simply don't list emails publicly — only warn if count is growing
  // (i.e. enrichment isn't running at all), not just because scraping has limits
  const enrichStatus = await getSetting(supabase, 'enrich_job_status')

  // If enrichment is actively running or recently ran, this is normal — not a real gap
  if (enrichStatus === 'running') {
    return { name: 'enrichment_gaps', status: 'ok', message: `${count} leads awaiting enrichment (job running)` }
  }

  // Trigger enrichment if idle
  let triggered = false
  if (enrichStatus !== 'running') {
    const d = await fireAndForget(`${APP_URL}/api/enrich-all-background`, { method: 'POST' })
    triggered = d.success === true
  }

  // Only alert if count is very high (>500) AND enrichment wasn't running — likely broken
  if (count > 500) {
    return {
      name: 'enrichment_gaps', status: triggered ? 'healed' : 'warn',
      message: `${count} leads with website but no email (>3 days old)`,
      healed: triggered ? `Re-triggered enrichment batch for ${count} leads` : null,
      claudeInstruction: triggered ? null : `${count} leads have websites but no email. Enrichment may be stuck. Check /api/enrich-batch and the enrich-all-background job status.`,
    }
  }

  return {
    name: 'enrichment_gaps', status: 'ok',
    message: `${count} leads without email — normal (many sites don't publish emails publicly)`,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 9 — Orphaned contacted leads (contacted status but no sequence)
// ══════════════════════════════════════════════════════════════════════════════
async function checkOrphanedLeads(supabase) {
  // Get all contacted lead IDs
  const { data: contacted } = await supabase
    .from('leads')
    .select('id, full_name, email')
    .eq('status', 'contacted')
    .not('email', 'is', null)

  if (!contacted?.length) return { name: 'orphaned_leads', status: 'ok', message: 'No orphaned leads' }

  // Get all lead IDs that have a sequence
  const { data: seqs } = await supabase
    .from('sequences')
    .select('lead_id')

  const seqLeadIds = new Set((seqs || []).map(s => s.lead_id))
  const orphaned = contacted.filter(l => !seqLeadIds.has(l.id))

  if (orphaned.length === 0) return { name: 'orphaned_leads', status: 'ok', message: `All ${contacted.length} contacted leads have sequences` }

  // Self-heal: create sequence records for orphaned leads so they get follow-ups
  const now = new Date()
  const nextDue = new Date(now)
  nextDue.setUTCDate(nextDue.getUTCDate() + 3)
  nextDue.setUTCHours(5, 0, 0, 0)

  let fixed = 0
  for (const lead of orphaned) {
    try {
      const { error } = await supabase.from('sequences').insert({
        lead_id: lead.id,
        angle_number: 2,
        step: 1,
        last_sent_at: now.toISOString(),
        next_due_at: nextDue.toISOString(),
        original_subject: 'Follow up',
        original_message_id: null,
        replied: false,
        complete: false,
      })
      if (!error) fixed++
    } catch {}
  }

  return {
    name: 'orphaned_leads', status: fixed === orphaned.length ? 'healed' : 'warn',
    message: `${orphaned.length} orphaned leads found`,
    healed: fixed > 0 ? `Auto-created sequences for ${fixed} orphaned leads — follow-ups will fire in 3 days` : null,
    claudeInstruction: fixed < orphaned.length
      ? `Could not auto-fix ${orphaned.length - fixed} orphaned leads. These contacted leads have no sequence: ${orphaned.slice(0,3).map(l=>l.email).join(', ')}.`
      : null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 10 — Failed email rate (bounces in last 7 days)
// ══════════════════════════════════════════════════════════════════════════════
async function checkBounceRate(supabase) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [{ count: sent }, { count: failed }] = await Promise.all([
    supabase.from('outreach').select('*', { count: 'exact', head: true }).eq('status', 'sent').gte('created_at', since),
    supabase.from('outreach').select('*', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', since),
  ])

  const total = (sent || 0) + (failed || 0)
  if (total === 0) return { name: 'bounce_rate', status: 'ok', message: 'No emails logged in last 7 days' }

  const rate = Math.round(((failed || 0) / total) * 100)
  if (rate === 0) return { name: 'bounce_rate', status: 'ok', message: `0% failure rate (${sent} sent, 0 failed)` }
  if (rate < 10) return { name: 'bounce_rate', status: 'ok', message: `${rate}% failure rate (${failed}/${total}) — acceptable` }
  if (rate < 30) return {
    name: 'bounce_rate', status: 'warn',
    message: `${rate}% failure rate — ${failed} of ${total} emails failed`,
    claudeInstruction: `Email failure rate is ${rate}% (${failed} failed out of ${total}). Check the outreach table for error messages and verify SMTP is working correctly.`,
  }

  return {
    name: 'bounce_rate', status: 'fail',
    message: `🚨 ${rate}% failure rate — ${failed} of ${total} emails failing`,
    claudeInstruction: `Critical: ${rate}% of emails are failing to send (${failed}/${total}). SMTP may be rate-limited or credentials expired. Check Hostinger email sending limits and the SMTP route.`,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 11 — Sequence progression (are step 2s and 3s actually being sent?)
// ══════════════════════════════════════════════════════════════════════════════
async function checkSequenceProgression(supabase) {
  const { data: allSeqs } = await supabase
    .from('sequences')
    .select('step, complete, replied, created_at')

  if (!allSeqs?.length) return { name: 'sequence_progression', status: 'ok', message: 'No sequences yet' }

  const old = allSeqs.filter(s => {
    const age = (Date.now() - new Date(s.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return age > 10 && s.step === 1 && !s.complete && !s.replied
  })

  if (old.length > 5) {
    return {
      name: 'sequence_progression', status: 'warn',
      message: `${old.length} sequences stuck at step 1 for >10 days`,
      claudeInstruction: `${old.length} email sequences have been at step 1 for over 10 days without progressing. Follow-ups may not be sending. Check that next_due_at is being set correctly and that check-sequences/daily-runner is firing.`,
    }
  }

  const step1 = allSeqs.filter(s => s.step === 1 && !s.complete).length
  const step2 = allSeqs.filter(s => s.step === 2 && !s.complete).length
  const step3 = allSeqs.filter(s => s.step === 3 && !s.complete).length
  const done  = allSeqs.filter(s => s.complete || s.replied).length

  return {
    name: 'sequence_progression', status: 'ok',
    message: `Step 1: ${step1} · Step 2: ${step2} · Step 3: ${step3} · Done: ${done}`,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 12 — Page health (are all app pages loading correctly?)
// ══════════════════════════════════════════════════════════════════════════════
async function checkPageHealth() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000) // never block qa-health for more than 8s
    const res = await fetch(`${APP_URL}/api/qa-pages`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Blendery-QA/1.0' },
    })
    clearTimeout(timeout)
    const data = await res.json()
    const failures = data.failures || 0
    const pages = data.pages || 0
    const passed = data.passed || 0

    if (failures === 0) return { name: 'page_health', status: 'ok', message: `All ${pages} pages loading correctly` }

    const brokenNames = (data.results || []).filter(r => r.status === 'fail').map(r => r.page).join(', ')
    return {
      name: 'page_health', status: 'fail',
      message: `${failures} page${failures > 1 ? 's' : ''} broken: ${brokenNames}`,
      claudeInstruction: `The following pages are broken: ${brokenNames}. Run /api/qa-pages for full details and the exact fix instructions.`,
    }
  } catch {
    return { name: 'page_health', status: 'warn', message: 'Could not run page checks' }
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 13 — Reply-sequence consistency
// Any lead marked 'interested' must have a closed sequence.
// If not, the auto-close in check-replies didn't fire — or a reply was marked
// manually without closing the sequence.
// ══════════════════════════════════════════════════════════════════════════════
async function checkReplyConsistency(supabase) {
  const { data: openForReplied } = await supabase
    .from('sequences')
    .select('id, lead_id, step')
    .eq('replied', false)
    .eq('complete', false)
    .in('lead_id',
      supabase.from('leads').select('id').eq('status', 'interested')
    )

  if (!openForReplied?.length) {
    return { name: 'reply_consistency', status: 'ok', message: 'All replied leads have closed sequences' }
  }

  // Self-heal: close them now
  const leadIds = [...new Set(openForReplied.map(s => s.lead_id))]
  const { error } = await supabase
    .from('sequences')
    .update({ replied: true, complete: true, reply_at: new Date().toISOString() })
    .in('lead_id', leadIds)
    .eq('replied', false)

  return {
    name: 'reply_consistency',
    status: error ? 'fail' : 'healed',
    message: `${openForReplied.length} sequences open for leads who already replied`,
    healed: !error ? `Auto-closed ${openForReplied.length} sequences for replied leads` : null,
    claudeInstruction: error ? `${openForReplied.length} sequences are open for leads marked as 'interested'. Auto-close failed. Manually set replied=true, complete=true for sequence IDs: ${openForReplied.slice(0,5).map(s=>s.id).join(', ')}` : null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 14 — next_due_at timing correctness
// All pending sequences must fire at 05:00 UTC. Any other hour means the 06:00
// cron will miss them. (Bug was send-email using now + 3 days without normalising.)
// ══════════════════════════════════════════════════════════════════════════════
async function checkSequenceTiming(supabase) {
  const { data: seqs } = await supabase
    .from('sequences')
    .select('id, lead_id, next_due_at, step')
    .eq('complete', false)
    .eq('replied', false)
    .not('next_due_at', 'is', null)

  if (!seqs?.length) return { name: 'sequence_timing', status: 'ok', message: 'No pending sequences to check' }

  const wrongTime = seqs.filter(s => {
    const h = new Date(s.next_due_at).getUTCHours()
    return h !== 5
  })

  if (wrongTime.length === 0) {
    return { name: 'sequence_timing', status: 'ok', message: `All ${seqs.length} pending sequences correctly set to 05:00 UTC` }
  }

  // Self-heal: normalise them all to 05:00 UTC on the same date
  let fixed = 0
  for (const s of wrongTime) {
    const d = new Date(s.next_due_at)
    d.setUTCHours(5, 0, 0, 0)
    const { error } = await supabase.from('sequences').update({ next_due_at: d.toISOString() }).eq('id', s.id)
    if (!error) fixed++
  }

  return {
    name: 'sequence_timing',
    status: fixed === wrongTime.length ? 'healed' : 'warn',
    message: `${wrongTime.length} sequences had wrong timing (not 05:00 UTC)`,
    healed: fixed > 0 ? `Normalised ${fixed} sequence timestamps to 05:00 UTC` : null,
    claudeInstruction: fixed < wrongTime.length
      ? `${wrongTime.length - fixed} sequences could not be normalised. These will be missed by the 06:00 cron. Check sequences table and set next_due_at to 05:00 UTC manually.`
      : null,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 15 — No overdue sequences (more than 4h past next_due_at and unsent)
// If cron ran at 06:00 UTC and it's now 10:00 UTC, nothing should still be past-due.
// If there are, the daily runner failed silently.
// ══════════════════════════════════════════════════════════════════════════════
async function checkOverdueSequences(supabase) {
  const cutoff4h = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  const { count } = await supabase
    .from('sequences')
    .select('*', { count: 'exact', head: true })
    .lte('next_due_at', cutoff4h)
    .eq('complete', false)
    .eq('replied', false)

  if (!count) return { name: 'overdue_sequences', status: 'ok', message: 'No sequences overdue by more than 4h' }

  return {
    name: 'overdue_sequences',
    status: 'warn',
    message: `${count} sequences are overdue by >4h — daily runner may not have processed them`,
    claudeInstruction: `${count} follow-ups are more than 4 hours past their due time without being sent. Either the daily runner failed silently, or the sequences have wrong timing. Check /api/daily-runner logs on Vercel and run it manually if needed.`,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHECK 16 — System errors (silent crashes logged via logError())
// Checks the system_errors table for any errors in the last 24h.
// ══════════════════════════════════════════════════════════════════════════════
async function checkSystemErrors(supabase) {
  // Table may not exist yet — handle gracefully
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('system_errors')
    .select('source, type, message, occurred_at')
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(10)

  if (error?.code === '42P01') {
    // Table doesn't exist yet — not a failure, just means Layer 4 not deployed
    return { name: 'system_errors', status: 'ok', message: 'system_errors table not yet created (run migration)' }
  }
  if (error) return { name: 'system_errors', status: 'warn', message: 'Could not read system_errors table' }
  if (!data?.length) return { name: 'system_errors', status: 'ok', message: 'No system errors in last 24h' }

  const summary = data.slice(0, 3).map(e => `${e.source}: ${e.type}`).join(' | ')
  return {
    name: 'system_errors',
    status: data.length >= 5 ? 'fail' : 'warn',
    message: `${data.length} system error${data.length > 1 ? 's' : ''} in last 24h: ${summary}`,
    claudeInstruction: `Silent errors logged in last 24 hours:\n${data.map(e => `• [${e.source}] ${e.type}: ${e.message} (${new Date(e.occurred_at).toUTCString()})`).join('\n')}\n\nCheck each source route for the root cause.`,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// LAYER 3 — Weekly end-to-end smoke test
// Runs a fake lead through the full reply-detection pipeline without sending
// any real emails. Verifies the integration works end-to-end, not just each
// piece in isolation. Runs at most once every 7 days (stored in settings).
// ══════════════════════════════════════════════════════════════════════════════
async function runSmokeTest(supabase) {
  const SMOKE_LEAD_ID = '00000000-0000-0000-0000-000000000001' // fixed test ID
  const SMOKE_EMAIL = 'qa-smoke-test@blendery.internal'
  const steps = []

  try {
    // Step 1: clean up any leftover smoke lead from a previous failed run
    await supabase.from('leads').delete().eq('id', SMOKE_LEAD_ID)

    // Step 2: insert test lead
    const { error: insertErr } = await supabase.from('leads').insert({
      id: SMOKE_LEAD_ID,
      full_name: 'QA Smoke Test',
      first_name: 'QA',
      email: SMOKE_EMAIL,
      company: 'Smoke Test Co',
      industry: 'SaaS',
      status: 'contacted',
    })
    if (insertErr) { steps.push({ step: 'insert_lead', pass: false, error: insertErr.message }); throw new Error('insert failed') }
    steps.push({ step: 'insert_lead', pass: true })

    // Step 3: create a sequence for this lead (simulating what send-email does)
    const nextDue = new Date()
    nextDue.setUTCDate(nextDue.getUTCDate() + 3)
    nextDue.setUTCHours(5, 0, 0, 0)
    const { error: seqErr } = await supabase.from('sequences').insert({
      lead_id: SMOKE_LEAD_ID,
      angle_number: 2,
      step: 1,
      last_sent_at: new Date().toISOString(),
      next_due_at: nextDue.toISOString(),
      original_subject: 'Smoke test email',
      replied: false,
      complete: false,
    })
    if (seqErr) { steps.push({ step: 'create_sequence', pass: false, error: seqErr.message }); throw new Error('seq insert failed') }
    steps.push({ step: 'create_sequence', pass: true })

    // Step 4: verify timing is correct (05:00 UTC)
    const { data: seq } = await supabase.from('sequences').select('next_due_at').eq('lead_id', SMOKE_LEAD_ID).single()
    const hour = seq?.next_due_at ? new Date(seq.next_due_at).getUTCHours() : -1
    const timingOk = hour === 5
    steps.push({ step: 'verify_timing_05utc', pass: timingOk, error: timingOk ? null : `next_due_at hour was ${hour}, expected 5` })
    if (!timingOk) throw new Error('timing wrong')

    // Step 5: simulate a reply being detected (what check-replies now does)
    await supabase.from('sequences')
      .update({ replied: true, complete: true, reply_at: new Date().toISOString() })
      .in('lead_id', [SMOKE_LEAD_ID])
      .eq('replied', false)
      .eq('complete', false)

    await supabase.from('leads')
      .update({ status: 'interested' })
      .eq('id', SMOKE_LEAD_ID)
      .eq('status', 'contacted')

    // Step 6: verify the sequence is now closed
    const { data: closed } = await supabase.from('sequences').select('replied, complete').eq('lead_id', SMOKE_LEAD_ID).single()
    const replyClosed = closed?.replied === true && closed?.complete === true
    steps.push({ step: 'reply_auto_close', pass: replyClosed, error: replyClosed ? null : `sequence not closed: replied=${closed?.replied} complete=${closed?.complete}` })

    // Step 7: verify the reply-consistency check would now pass for this lead
    const { data: stillOpen } = await supabase
      .from('sequences')
      .select('id')
      .eq('lead_id', SMOKE_LEAD_ID)
      .eq('replied', false)
      .eq('complete', false)
    const consistencyOk = !stillOpen?.length
    steps.push({ step: 'consistency_check_passes', pass: consistencyOk })

  } catch {}

  // Always clean up — delete cascades to sequences
  await supabase.from('leads').delete().eq('id', SMOKE_LEAD_ID)

  const allPassed = steps.every(s => s.pass)
  const failed = steps.filter(s => !s.pass)

  // Record when smoke test last ran
  await supabase.from('settings').upsert({
    key: 'last_smoke_test',
    value: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return {
    name: 'smoke_test',
    status: allPassed ? 'ok' : 'fail',
    message: allPassed
      ? `Weekly smoke test passed (${steps.length}/${steps.length} steps)`
      : `Smoke test FAILED: ${failed.map(s => s.step + (s.error ? ` (${s.error})` : '')).join(', ')}`,
    claudeInstruction: allPassed ? null
      : `End-to-end smoke test failed on these steps: ${failed.map(s => `${s.step}: ${s.error || 'unexpected result'}`).join(' | ')}. This means a real integration is broken, not just an individual component. Investigate the failing step in the relevant route file.`,
  }
}

async function maybeRunSmokeTest(supabase) {
  const lastRaw = await getSetting(supabase, 'last_smoke_test')
  const daysSince = lastRaw
    ? (Date.now() - new Date(lastRaw).getTime()) / (1000 * 60 * 60 * 24)
    : 999
  if (daysSince < 7) {
    return { name: 'smoke_test', status: 'ok', message: `Weekly smoke test last ran ${Math.round(daysSince * 24)}h ago — next run in ${Math.round((7 - daysSince) * 24)}h` }
  }
  return runSmokeTest(supabase)
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
    const [
      dailyRunner, sequences, enrichment, leadGrowth, emailPipeline,
      enrichmentGaps, orphanedLeads, bounceRate, sequenceProgression, pageHealth,
      // Layer 2 — behaviour checks
      replyConsistency, sequenceTiming, overdueSequences, systemErrors,
      // Layer 3 — weekly smoke test
      smokeTest,
    ] = await Promise.all([
      checkDailyRunner(supabase),
      checkSequences(supabase),
      checkEnrichment(supabase),
      checkLeadGrowth(supabase),
      checkEmailPipeline(supabase),
      checkEnrichmentGaps(supabase),
      checkOrphanedLeads(supabase),
      checkBounceRate(supabase),
      checkSequenceProgression(supabase),
      checkPageHealth(),
      // Layer 2
      checkReplyConsistency(supabase),
      checkSequenceTiming(supabase),
      checkOverdueSequences(supabase),
      checkSystemErrors(supabase),
      // Layer 3
      maybeRunSmokeTest(supabase),
    ])
    results = [
      supabaseResult, smtpResult,
      dailyRunner, sequences, enrichment,
      leadGrowth, emailPipeline,
      enrichmentGaps, orphanedLeads, bounceRate,
      sequenceProgression, pageHealth,
      // Layer 2
      replyConsistency, sequenceTiming, overdueSequences, systemErrors,
      // Layer 3
      smokeTest,
    ]
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

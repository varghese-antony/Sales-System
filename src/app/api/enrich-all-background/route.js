import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Queue manager for background enrichment.
// Actual processing happens in /api/enrich-batch (cron every 5 min).
//
// GET  — returns current job status
// POST — queues all un-enriched leads and starts the job

function supabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

async function setSetting(supabase, key, value) {
  await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
}

// GET — return current status
export async function GET() {
  const supabase = supabaseClient()
  const { data: rows } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['enrich_job_status', 'enrich_job_done', 'enrich_job_total', 'enrich_job_found', 'enrich_job_updated_at'])

  const map = Object.fromEntries((rows || []).map(r => [r.key, r.value]))
  return NextResponse.json({
    status: map['enrich_job_status'] || 'idle',   // idle | running | done
    done: parseInt(map['enrich_job_done'] || '0'),
    total: parseInt(map['enrich_job_total'] || '0'),
    found: parseInt(map['enrich_job_found'] || '0'),
    updatedAt: map['enrich_job_updated_at'] || null,
  })
}

// POST — queue up all leads that need enrichment
export async function POST() {
  const supabase = supabaseClient()

  // If already running, just return current status
  const { data: statusRow } = await supabase
    .from('settings').select('value').eq('key', 'enrich_job_status').single()
  if (statusRow?.value === 'running') {
    const { data: rows } = await supabase
      .from('settings').select('key, value')
      .in('key', ['enrich_job_done', 'enrich_job_total', 'enrich_job_found'])
    const map = Object.fromEntries((rows || []).map(r => [r.key, r.value]))
    return NextResponse.json({
      success: true,
      alreadyRunning: true,
      message: 'Enrichment already running in background',
      done: parseInt(map['enrich_job_done'] || '0'),
      total: parseInt(map['enrich_job_total'] || '0'),
    })
  }

  // Get all leads that need enrichment
  const { data: leads } = await supabase
    .from('leads')
    .select('id')
    .is('email', null)
    .not('website', 'is', null)
    .neq('website', '')

  const ids = (leads || []).map(l => l.id)
  if (!ids.length) {
    await setSetting(supabase, 'enrich_job_status', 'idle')
    return NextResponse.json({ success: true, message: 'No leads need enrichment', total: 0 })
  }

  // Store queue as JSON in settings
  await setSetting(supabase, 'enrich_queue', JSON.stringify(ids))
  await setSetting(supabase, 'enrich_job_status', 'running')
  await setSetting(supabase, 'enrich_job_total', ids.length.toString())
  await setSetting(supabase, 'enrich_job_done', '0')
  await setSetting(supabase, 'enrich_job_found', '0')
  await setSetting(supabase, 'enrich_job_updated_at', new Date().toISOString())

  // Immediately trigger first batch (don't await — returns instantly)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://' + process.env.VERCEL_URL}/api/enrich-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.CRON_SECRET || 'internal'}` },
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    message: `Queued ${ids.length} leads for enrichment — cron will process them every 5 min`,
    total: ids.length,
  })
}

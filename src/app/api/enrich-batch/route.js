import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sleep, extractDomain, stripTags, fetchPage,
  extractEmails, extractFounderName, lookupCompaniesHouse,
} from '@/lib/enrich-utils'

// Processes a batch of leads from the enrichment queue.
// Called by cron every 5 minutes AND triggered immediately when queue starts.
// Each run processes up to 15 leads (safe within Vercel's 60s limit).
// Picks up where it left off — safe to call multiple times.

const BATCH_SIZE = 15

const SLUGS = [
  '', '/about', '/about-us', '/team', '/our-team', '/contact', '/contact-us',
  '/founder', '/ceo', '/management', '/leadership', '/crew', '/partners',
  '/people', '/staff', '/meet-the-team', '/who-we-are', '/company',
]

async function enrichOneLead(lead) {
  const domain = extractDomain(lead.website)
  if (!domain) return { email: null, name: null }

  let foundEmail = null
  let foundName = null

  for (const slug of SLUGS) {
    const html = await fetchPage(`https://${domain}${slug}`)
    if (!html) continue
    const text = stripTags(html)
    if (!foundEmail) {
      const { ownDomain, other } = extractEmails(html, domain)
      foundEmail = ownDomain[0] || other[0] || null
    }
    if (!foundName) foundName = extractFounderName(text)
    if (foundEmail && foundName) break
    await sleep(250)
  }

  // Companies House (UK leads) — shared util from @/lib/enrich-utils
  if (!foundName && lead.country?.toLowerCase().includes('united kingdom')) {
    const chName = await lookupCompaniesHouse(lead.company)
    if (chName) foundName = chName
  }

  return { email: foundEmail, name: foundName }
}

async function setSetting(supabase, key, value) {
  // settings table only has (key, value) — no updated_at column
  await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
}

// Works for both cron GET and manual POST trigger
async function processBatch(supabase) {
  // Always stamp the last run time — QA Check 22 (checkEnrichBatchRan) reads this
  // to verify the 3:00 UTC cron is actually firing. Fire-and-forget: don't block batch.
  // settings table only has (key, value) — no updated_at column.
  supabase.from('settings').upsert(
    { key: 'last_enrich_batch_run', value: new Date().toISOString() },
    { onConflict: 'key' }
  ).then(() => {}).catch(() => {})

  // Load current queue
  const { data: rows } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['enrich_queue', 'enrich_job_status', 'enrich_job_done', 'enrich_job_total', 'enrich_job_found'])

  const map = Object.fromEntries((rows || []).map(r => [r.key, r.value]))

  if (map['enrich_job_status'] !== 'running') {
    return { skipped: true, reason: 'No active enrichment job' }
  }

  let queue = []
  try { queue = JSON.parse(map['enrich_queue'] || '[]') } catch {}

  if (!queue.length) {
    // Queue empty — mark done
    await setSetting(supabase, 'enrich_job_status', 'done')
    await setSetting(supabase, 'enrich_queue', '[]')
    await setSetting(supabase, 'enrich_job_updated_at', new Date().toISOString())
    return { done: true, processed: 0 }
  }

  // Take next batch
  const batch = queue.slice(0, BATCH_SIZE)
  const remaining = queue.slice(BATCH_SIZE)

  // Load lead details for this batch
  const { data: leads } = await supabase
    .from('leads')
    .select('id, company, website, full_name, country')
    .in('id', batch)

  let found = parseInt(map['enrich_job_found'] || '0')
  let processed = 0

  for (const lead of (leads || [])) {
    try {
      const result = await enrichOneLead(lead)
      if (result.email || result.name) {
        found++
        const updates = {}
        if (result.email) updates.email = result.email
        if (result.name && !lead.full_name) {
          updates.full_name = result.name
          updates.first_name = result.name.split(' ')[0] || ''
        }
        if (Object.keys(updates).length) {
          await supabase.from('leads').update(updates).eq('id', lead.id)
        }
      }
    } catch {}
    processed++
  }

  const newDone = parseInt(map['enrich_job_done'] || '0') + processed

  // Save updated queue and progress
  await setSetting(supabase, 'enrich_queue', JSON.stringify(remaining))
  await setSetting(supabase, 'enrich_job_done', newDone.toString())
  await setSetting(supabase, 'enrich_job_found', found.toString())
  await setSetting(supabase, 'enrich_job_updated_at', new Date().toISOString())

  if (remaining.length === 0) {
    await setSetting(supabase, 'enrich_job_status', 'done')
  } else {
    // Self-chain: immediately trigger next batch so enrichment continues
    // without needing frequent crons. Each call processes 15 leads then
    // fires the next call — runs until queue is empty.
    // Must include Authorization header to pass middleware check.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    if (appUrl) {
      fetch(`${appUrl}/api/enrich-batch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET || ''}` },
      }).catch(() => {})
    }
  }

  return {
    processed,
    found,
    remaining: remaining.length,
    done: remaining.length === 0,
  }
}

// Open — called by cron, self-chaining, and UI polling trigger
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const result = await processBatch(supabase)
  return NextResponse.json({ success: true, ...result })
}

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const result = await processBatch(supabase)
  return NextResponse.json({ success: true, ...result })
}

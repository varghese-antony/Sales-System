import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Every industry where ops automation saves 10–20hrs/week:
// Manual reporting, client onboarding, tool integrations, admin overload, invoicing, scheduling, data entry
const SEARCHES = [
  // ── MARKETING AGENCIES ──────────────────────────────────────────
  { query: 'marketing agency London',            industry: 'Marketing Agency',  country: 'United Kingdom' },
  { query: 'marketing agency Manchester',        industry: 'Marketing Agency',  country: 'United Kingdom' },
  { query: 'digital marketing agency Dublin',    industry: 'Marketing Agency',  country: 'Ireland' },
  { query: 'marketing agency Sydney',            industry: 'Marketing Agency',  country: 'Australia' },
  { query: 'marketing agency Melbourne',         industry: 'Marketing Agency',  country: 'Australia' },
  { query: 'marketing agency Dubai',             industry: 'Marketing Agency',  country: 'UAE' },
  { query: 'marketing agency Singapore',         industry: 'Marketing Agency',  country: 'Singapore' },
  { query: 'marketing agency New York',          industry: 'Marketing Agency',  country: 'USA' },
  { query: 'marketing agency Los Angeles',       industry: 'Marketing Agency',  country: 'USA' },
  { query: 'marketing agency Chicago',           industry: 'Marketing Agency',  country: 'USA' },
  { query: 'marketing agency Austin',            industry: 'Marketing Agency',  country: 'USA' },
  { query: 'marketing agency Miami',             industry: 'Marketing Agency',  country: 'USA' },

  // ── CONSULTING ───────────────────────────────────────────────────
  { query: 'business consulting firm London',    industry: 'Consulting',        country: 'United Kingdom' },
  { query: 'management consulting Dublin',       industry: 'Consulting',        country: 'Ireland' },
  { query: 'business consulting Sydney',         industry: 'Consulting',        country: 'Australia' },
  { query: 'management consulting Dubai',        industry: 'Consulting',        country: 'UAE' },
  { query: 'consulting firm Singapore',          industry: 'Consulting',        country: 'Singapore' },
  { query: 'management consulting New York',     industry: 'Consulting',        country: 'USA' },
  { query: 'business consulting San Francisco',  industry: 'Consulting',        country: 'USA' },
  { query: 'consulting firm Chicago',            industry: 'Consulting',        country: 'USA' },
  { query: 'consulting firm Austin',             industry: 'Consulting',        country: 'USA' },

  // ── SaaS / TECH ──────────────────────────────────────────────────
  { query: 'SaaS company London',                industry: 'SaaS',              country: 'United Kingdom' },
  { query: 'software startup Dublin',            industry: 'SaaS',              country: 'Ireland' },
  { query: 'tech startup Sydney',                industry: 'SaaS',              country: 'Australia' },
  { query: 'software company Singapore',         industry: 'SaaS',              country: 'Singapore' },
  { query: 'SaaS startup New York',              industry: 'SaaS',              country: 'USA' },
  { query: 'SaaS company San Francisco',         industry: 'SaaS',              country: 'USA' },
  { query: 'software startup Austin',            industry: 'SaaS',              country: 'USA' },
  { query: 'tech startup Boston',                industry: 'SaaS',              country: 'USA' },
  { query: 'software company Seattle',           industry: 'SaaS',              country: 'USA' },

  // ── E-COMMERCE ───────────────────────────────────────────────────
  { query: 'ecommerce agency London',            industry: 'E-commerce',        country: 'United Kingdom' },
  { query: 'ecommerce agency Melbourne',         industry: 'E-commerce',        country: 'Australia' },
  { query: 'ecommerce company New York',         industry: 'E-commerce',        country: 'USA' },
  { query: 'ecommerce agency Los Angeles',       industry: 'E-commerce',        country: 'USA' },
  { query: 'online retail company Dubai',        industry: 'E-commerce',        country: 'UAE' },

  // ── RECRUITMENT / STAFFING ───────────────────────────────────────
  { query: 'recruitment agency London',          industry: 'Recruitment',       country: 'United Kingdom' },
  { query: 'staffing agency Dublin',             industry: 'Recruitment',       country: 'Ireland' },
  { query: 'recruitment firm Sydney',            industry: 'Recruitment',       country: 'Australia' },
  { query: 'staffing agency New York',           industry: 'Recruitment',       country: 'USA' },
  { query: 'recruitment agency Chicago',         industry: 'Recruitment',       country: 'USA' },
  { query: 'staffing firm Atlanta',              industry: 'Recruitment',       country: 'USA' },
  { query: 'recruitment agency Singapore',       industry: 'Recruitment',       country: 'Singapore' },

  // ── ACCOUNTING / BOOKKEEPING ─────────────────────────────────────
  { query: 'accounting firm London',             industry: 'Accounting',        country: 'United Kingdom' },
  { query: 'bookkeeping firm Dublin',            industry: 'Accounting',        country: 'Ireland' },
  { query: 'accounting firm Sydney',             industry: 'Accounting',        country: 'Australia' },
  { query: 'accounting firm New York',           industry: 'Accounting',        country: 'USA' },
  { query: 'bookkeeping firm Chicago',           industry: 'Accounting',        country: 'USA' },
  { query: 'accounting firm Dubai',              industry: 'Accounting',        country: 'UAE' },

  // ── PR / COMMUNICATIONS ──────────────────────────────────────────
  { query: 'PR agency London',                   industry: 'PR Agency',         country: 'United Kingdom' },
  { query: 'public relations firm New York',     industry: 'PR Agency',         country: 'USA' },
  { query: 'PR agency Los Angeles',              industry: 'PR Agency',         country: 'USA' },
  { query: 'communications agency Sydney',       industry: 'PR Agency',         country: 'Australia' },
  { query: 'PR agency Singapore',                industry: 'PR Agency',         country: 'Singapore' },

  // ── LEGAL TECH / LAW FIRMS ───────────────────────────────────────
  { query: 'legal technology firm London',       industry: 'Legal Tech SaaS',   country: 'United Kingdom' },
  { query: 'legal tech company Sydney',          industry: 'Legal Tech SaaS',   country: 'Australia' },
  { query: 'legal tech company New York',        industry: 'Legal Tech SaaS',   country: 'USA' },
  { query: 'law firm technology Chicago',        industry: 'Legal Tech SaaS',   country: 'USA' },
  { query: 'legal services firm Singapore',      industry: 'Legal Tech SaaS',   country: 'Singapore' },

  // ── PROPTECH / REAL ESTATE ───────────────────────────────────────
  { query: 'property technology company London', industry: 'PropTech SaaS',     country: 'United Kingdom' },
  { query: 'proptech startup Dubai',             industry: 'PropTech SaaS',     country: 'UAE' },
  { query: 'real estate tech company Sydney',    industry: 'PropTech SaaS',     country: 'Australia' },
  { query: 'proptech company New York',          industry: 'PropTech SaaS',     country: 'USA' },
  { query: 'real estate technology Miami',       industry: 'PropTech SaaS',     country: 'USA' },

  // ── HR TECH ──────────────────────────────────────────────────────
  { query: 'HR technology company London',       industry: 'HR Tech',           country: 'United Kingdom' },
  { query: 'human resources software New York',  industry: 'HR Tech',           country: 'USA' },
  { query: 'HR tech startup San Francisco',      industry: 'HR Tech',           country: 'USA' },
  { query: 'HR software company Sydney',         industry: 'HR Tech',           country: 'Australia' },
  { query: 'HR tech company Singapore',          industry: 'HR Tech',           country: 'Singapore' },

  // ── FINTECH / FINANCIAL SERVICES ────────────────────────────────
  { query: 'fintech startup London',             industry: 'FinTech',           country: 'United Kingdom' },
  { query: 'financial technology company Dublin',industry: 'FinTech',           country: 'Ireland' },
  { query: 'fintech company New York',           industry: 'FinTech',           country: 'USA' },
  { query: 'fintech startup San Francisco',      industry: 'FinTech',           country: 'USA' },
  { query: 'financial advisory firm Sydney',     industry: 'FinTech',           country: 'Australia' },
  { query: 'fintech company Singapore',          industry: 'FinTech',           country: 'Singapore' },
  { query: 'financial services firm Dubai',      industry: 'FinTech',           country: 'UAE' },

  // ── EDTECH / TRAINING ────────────────────────────────────────────
  { query: 'edtech company London',              industry: 'EdTech',            country: 'United Kingdom' },
  { query: 'online education company New York',  industry: 'EdTech',            country: 'USA' },
  { query: 'elearning company Sydney',           industry: 'EdTech',            country: 'Australia' },
  { query: 'training company Singapore',         industry: 'EdTech',            country: 'Singapore' },

  // ── EVENTS / HOSPITALITY ─────────────────────────────────────────
  { query: 'event management company London',    industry: 'Events',            country: 'United Kingdom' },
  { query: 'event agency Dubai',                 industry: 'Events',            country: 'UAE' },
  { query: 'events company New York',            industry: 'Events',            country: 'USA' },
  { query: 'event management Sydney',            industry: 'Events',            country: 'Australia' },

  // ── CREATIVE / DESIGN STUDIOS ────────────────────────────────────
  { query: 'creative agency London',             industry: 'Creative Agency',   country: 'United Kingdom' },
  { query: 'design studio New York',             industry: 'Creative Agency',   country: 'USA' },
  { query: 'creative agency Los Angeles',        industry: 'Creative Agency',   country: 'USA' },
  { query: 'branding agency Sydney',             industry: 'Creative Agency',   country: 'Australia' },
  { query: 'creative agency Singapore',          industry: 'Creative Agency',   country: 'Singapore' },

  // ── HEALTHCARE / MEDTECH ─────────────────────────────────────────
  { query: 'health tech company London',         industry: 'HealthTech',        country: 'United Kingdom' },
  { query: 'medical technology startup New York',industry: 'HealthTech',        country: 'USA' },
  { query: 'healthtech company San Francisco',   industry: 'HealthTech',        country: 'USA' },
  { query: 'health tech startup Sydney',         industry: 'HealthTech',        country: 'Australia' },
  { query: 'medical software company Singapore', industry: 'HealthTech',        country: 'Singapore' },

  // ── LOGISTICS / SUPPLY CHAIN ─────────────────────────────────────
  { query: 'logistics technology company London',industry: 'Logistics',         country: 'United Kingdom' },
  { query: 'supply chain software New York',     industry: 'Logistics',         country: 'USA' },
  { query: 'logistics tech company Dubai',       industry: 'Logistics',         country: 'UAE' },
  { query: 'freight tech company Singapore',     industry: 'Logistics',         country: 'Singapore' },
]

function extractDomain(url) {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch { return null }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function textSearch(query, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

async function placeDetails(placeId, apiKey) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,website,formatted_address&key=${apiKey}`
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!res.ok) return null
  const data = await res.json()
  return data.result || null
}

// GET — returns the search list so the UI can show accurate progress counts
export async function GET() {
  return NextResponse.json({ searches: SEARCHES, total: SEARCHES.length })
}

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'GOOGLE_MAPS_API_KEY not set — add it in Vercel environment variables' },
      { status: 500 }
    )
  }

  // Load existing domains for deduplication
  const { data: existingLeads } = await supabase
    .from('leads')
    .select('website')
    .not('website', 'is', null)

  const existingDomains = new Set(
    (existingLeads || []).map(l => extractDomain(l.website)).filter(Boolean)
  )

  let added = 0
  let skipped = 0
  let total = 0

  // Support single-search mode for per-search progress from the UI
  let body = {}
  try { body = await request.json() } catch {}

  const searches = body.searchIndex !== undefined
    ? [SEARCHES[body.searchIndex]]
    : SEARCHES

  for (const search of searches) {
    let results = []
    try {
      results = await textSearch(search.query, apiKey)
    } catch (err) {
      console.warn(`Text search failed for "${search.query}":`, err.message)
      continue
    }

    total += results.length

    for (const place of results) {
      await sleep(200)

      let website = place.website || null

      // Place Details call to get website if not in text search result
      if (!website && place.place_id) {
        try {
          const details = await placeDetails(place.place_id, apiKey)
          website = details?.website || null
          await sleep(200)
        } catch {}
      }

      // Skip if no website — need it for outreach and dedup
      if (!website) { skipped++; continue }

      const domain = extractDomain(website)
      if (domain && existingDomains.has(domain)) { skipped++; continue }

      const { error } = await supabase.from('leads').insert({
        company:     place.name || null,
        website,
        industry:    search.industry,
        country:     search.country,
        full_name:   null,
        first_name:  null,
        email:       null,
        linkedin_url:null,
        status:      'new',
        notes:       `Source: Google Maps — "${search.query}"`,
        source:      'google-maps',
        score:       5,
      })

      if (!error) {
        added++
        if (domain) existingDomains.add(domain)
      } else {
        skipped++
      }
    }

    await sleep(300)
  }

  return NextResponse.json({ success: true, added, skipped, total, totalSearches: SEARCHES.length })
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SEARCHES = [
  // Marketing Agencies
  { query: 'marketing agency London',         industry: 'Marketing Agency', country: 'United Kingdom' },
  { query: 'marketing agency Manchester',     industry: 'Marketing Agency', country: 'United Kingdom' },
  { query: 'digital marketing agency Dublin', industry: 'Marketing Agency', country: 'Ireland' },
  { query: 'marketing agency Sydney',         industry: 'Marketing Agency', country: 'Australia' },
  { query: 'marketing agency Dubai',          industry: 'Marketing Agency', country: 'UAE' },
  { query: 'marketing agency Singapore',      industry: 'Marketing Agency', country: 'Singapore' },

  // Consulting
  { query: 'business consulting firm London',  industry: 'Consulting', country: 'United Kingdom' },
  { query: 'management consulting Dublin',     industry: 'Consulting', country: 'Ireland' },
  { query: 'business consulting Sydney',       industry: 'Consulting', country: 'Australia' },
  { query: 'management consulting Dubai',      industry: 'Consulting', country: 'UAE' },
  { query: 'consulting firm Singapore',        industry: 'Consulting', country: 'Singapore' },

  // Legal Tech
  { query: 'legal technology firm London',   industry: 'Legal Tech SaaS', country: 'United Kingdom' },
  { query: 'legal tech company Sydney',      industry: 'Legal Tech SaaS', country: 'Australia' },
  { query: 'legal services firm Singapore',  industry: 'Legal Tech SaaS', country: 'Singapore' },

  // PropTech
  { query: 'property technology company London', industry: 'PropTech SaaS', country: 'United Kingdom' },
  { query: 'proptech startup Dubai',             industry: 'PropTech SaaS', country: 'UAE' },
  { query: 'real estate tech company Sydney',    industry: 'PropTech SaaS', country: 'Australia' },
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

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'GOOGLE_MAPS_API_KEY not set in environment' }, { status: 500 })
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

  // Support streaming progress — accept optional { searchIndex } to run a single search
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
      await sleep(300) // stay within rate limits

      let website = place.website || null

      // If no website in text search, try Place Details
      if (!website && place.place_id) {
        try {
          const details = await placeDetails(place.place_id, apiKey)
          website = details?.website || null
          await sleep(300)
        } catch {}
      }

      // Skip if no website — we need it for deduplication and outreach
      if (!website) { skipped++; continue }

      const domain = extractDomain(website)
      if (domain && existingDomains.has(domain)) { skipped++; continue }

      const { error } = await supabase.from('leads').insert({
        company: place.name || null,
        website,
        industry: search.industry,
        country: search.country,
        full_name: null,
        first_name: null,
        email: null,
        linkedin_url: null,
        status: 'new',
        notes: `Source: Google Maps — "${search.query}"`,
        source: 'google-maps',
        score: 5,
      })

      if (!error) {
        added++
        if (domain) existingDomains.add(domain)
      } else {
        skipped++
      }
    }

    await sleep(500)
  }

  return NextResponse.json({
    success: true,
    added,
    skipped,
    total,
    totalSearches: SEARCHES.length,
  })
}

// GET — returns the list of searches so the UI can show progress
export async function GET() {
  return NextResponse.json({ searches: SEARCHES })
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INDUSTRY_MAP = {
  'digital-marketing':          'Marketing Agency',
  'agencies/digital-marketing': 'Marketing Agency',
  'advertising':                'Marketing Agency',
  'it-services':                'SaaS',
  'software-development':       'SaaS',
  'business-services':          'Consulting',
  'management-consulting':      'Consulting',
  'hr/consulting':              'HR Tech',
  'legal':                      'Legal Tech SaaS',
  'real-estate':                'PropTech SaaS',
}

const COUNTRY_MAP = {
  'united-kingdom':      'United Kingdom',
  'ireland':             'Ireland',
  'australia':           'Australia',
  'united-arab-emirates':'UAE',
  'singapore':           'Singapore',
}

// Clutch URL builder
function buildUrl(industry, country, page) {
  const base = `https://clutch.co/${industry}`
  const params = new URLSearchParams({
    country: country,
    min_employees: '2',
    max_employees: '49',
    page: String(page),
  })
  return `${base}?${params.toString()}`
}

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Referer': 'https://www.google.com/',
  'Cache-Control': 'no-cache',
}

function extractDomain(url) {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch { return null }
}

// Extract company cards from a Clutch listing page
function parseListingPage(html, industry, country) {
  const companies = []

  // Each company card contains a profile link, company name, website, location
  // Pattern: find all provider list items / company sections
  // Clutch wraps each company in an <li> or <div> with class containing "provider"

  // Extract profile links (clutch internal) — format: /profile/slug
  const profilePattern = /href="(\/profile\/[a-z0-9_-]+)"/gi
  const profileMatches = []
  let pm
  while ((pm = profilePattern.exec(html)) !== null) {
    const url = 'https://clutch.co' + pm[1]
    if (!profileMatches.includes(url)) profileMatches.push(url)
  }

  // Extract company names — h3 with company_info__name class or similar
  const namePattern = /<h3[^>]*class="[^"]*company_info__name[^"]*"[^>]*>\s*([^<]+)\s*<\/h3>/gi
  const names = []
  let nm
  while ((nm = namePattern.exec(html)) !== null) {
    names.push(nm[1].trim())
  }

  // Alternative name pattern (anchor with company_name class)
  if (names.length === 0) {
    const altNamePattern = /<a[^>]*class="[^"]*company_name[^"]*"[^>]*>\s*([^<]+)\s*<\/a>/gi
    let an
    while ((an = altNamePattern.exec(html)) !== null) {
      names.push(an[1].trim())
    }
  }

  // Extract external website links — look for "Visit Website" or similar links that go to external domains
  const websitePattern = /href="(https?:\/\/(?!clutch\.co)[^"]+)"[^>]*>[^<]*(?:website|visit|Website|Visit)[^<]*</gi
  const websites = []
  let wm
  while ((wm = websitePattern.exec(html)) !== null) {
    try {
      const u = new URL(wm[1])
      // Filter out ads, tracking, etc.
      if (!u.hostname.includes('clutch') && !u.hostname.includes('google') && !u.hostname.includes('doubleclick')) {
        websites.push(wm[1].split('?')[0]) // strip query params
      }
    } catch {}
  }

  // Extract locations
  const locPattern = /<span[^>]*class="[^"]*locality[^"]*"[^>]*>([^<]+)<\/span>/gi
  const locations = []
  let lm
  while ((lm = locPattern.exec(html)) !== null) {
    locations.push(lm[1].trim())
  }

  const mappedIndustry = INDUSTRY_MAP[industry] || industry
  const mappedCountry = COUNTRY_MAP[country] || country

  const count = Math.max(names.length, profileMatches.length)
  for (let i = 0; i < count; i++) {
    if (names[i] || profileMatches[i]) {
      companies.push({
        company: names[i] || null,
        clutch_profile_url: profileMatches[i] || null,
        website: websites[i] || null,
        location: locations[i] || mappedCountry,
        industry: mappedIndustry,
        country: mappedCountry,
      })
    }
  }

  return companies
}

// Try to extract a contact name from a Clutch profile page
async function scrapeProfileContact(profileUrl) {
  try {
    const res = await fetch(profileUrl, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // Look for leadership/contact section — patterns like "CEO", "Founder", "Managing Director"
    const leadershipPattern = /(?:CEO|Founder|Co-?Founder|Managing Director|President|Owner|Director)[^<]{0,20}<[^>]+>\s*([A-Z][a-z]+ [A-Z][a-z]+)/gi
    const lm = leadershipPattern.exec(html)
    if (lm) return lm[1].trim()

    // Alternative: look for a person card
    const personPattern = /<[^>]*class="[^"]*leadership[^"]*"[^>]*>[\s\S]{0,500}?<[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/[^>]+>/i
    const pm = personPattern.exec(html)
    if (pm) return pm[1].trim()

    return null
  } catch {
    return null
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  let body = {}
  try { body = await request.json() } catch {}

  const { industry, country } = body

  if (!industry || !country) {
    return NextResponse.json({ success: false, error: 'industry and country required' }, { status: 400 })
  }

  const mappedIndustry = INDUSTRY_MAP[industry] || industry
  const mappedCountry = COUNTRY_MAP[country] || country

  // Load existing lead domains for deduplication
  const { data: existingLeads } = await supabase
    .from('leads')
    .select('website')
    .not('website', 'is', null)

  const existingDomains = new Set(
    (existingLeads || [])
      .map(l => extractDomain(l.website))
      .filter(Boolean)
  )

  let added = 0
  let skipped = 0
  let total = 0

  for (let page = 0; page < 3; page++) {
    const url = buildUrl(industry, country, page)

    let html = ''
    try {
      const res = await fetch(url, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        // Clutch is blocking — return partial results
        console.warn(`Clutch returned ${res.status} for ${url}`)
        break
      }
      html = await res.text()
    } catch (err) {
      console.warn(`Fetch failed for ${url}:`, err.message)
      break
    }

    const companies = parseListingPage(html, industry, country)
    total += companies.length

    for (const co of companies) {
      // Skip if we already have this domain
      const domain = extractDomain(co.website)
      if (domain && existingDomains.has(domain)) {
        skipped++
        continue
      }

      // Try to get contact name from profile page
      let fullName = null
      if (co.clutch_profile_url) {
        fullName = await scrapeProfileContact(co.clutch_profile_url)
        await sleep(500) // brief pause between profile fetches
      }

      const firstName = fullName ? fullName.split(' ')[0] : null

      const { error } = await supabase.from('leads').insert({
        company: co.company,
        website: co.website,
        industry: mappedIndustry,
        country: mappedCountry,
        full_name: fullName,
        first_name: firstName,
        email: null,
        linkedin_url: null,
        status: 'new',
        notes: 'Source: Clutch.co',
        source: 'clutch',
        score: 5, // default mid score, can be updated later
      })

      if (!error) {
        added++
        if (domain) existingDomains.add(domain) // prevent same-run duplicates
      }
    }

    // 2 second delay between pages (polite scraping)
    if (page < 2) await sleep(2000)
  }

  return NextResponse.json({ success: true, added, skipped, total })
}

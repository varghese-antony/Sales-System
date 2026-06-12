import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  FETCH_HEADERS, sleep, extractDomain, stripTags, fetchPage,
  extractEmails, pickBestEmail, extractFounderName, guessEmailPatterns,
} from '@/lib/enrich-utils'

// ── COMPANIES HOUSE (UK) ──────────────────────────────────────────────────────
// extractEmails, pickBestEmail, extractFounderName, guessEmailPatterns, fetchPage
// are imported from @/lib/enrich-utils — shared with enrich-batch.

async function lookupCompaniesHouse(companyName) {
  try {
    const encoded = encodeURIComponent(companyName)
    // Companies House has a free search API — requires API key but key is free
    // Fallback: use their public search page which returns JSON
    const searchUrl = `https://api.companieshouse.gov.uk/search/companies?q=${encoded}&items_per_page=1`

    // Note: Companies House API requires a free API key (COMPANIES_HOUSE_API_KEY)
    const apiKey = process.env.COMPANIES_HOUSE_API_KEY
    if (!apiKey) return null

    const res = await fetch(searchUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const company = data.items?.[0]
    if (!company) return null

    // Get company officers (directors)
    const officersUrl = `https://api.companieshouse.gov.uk/company/${company.company_number}/officers?items_per_page=10`
    const officersRes = await fetch(officersUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!officersRes.ok) return null
    const officersData = await officersRes.json()

    // Find active director/CEO/founder
    const officers = officersData.items || []
    const active = officers.filter(o =>
      !o.resigned_on &&
      (o.officer_role === 'director' || o.officer_role === 'chief-executive-officer')
    )

    if (active.length === 0) return null

    // Format: Companies House returns "SURNAME, Firstname"
    const officer = active[0]
    const raw = officer.name || ''
    const parts = raw.split(',').map(s => s.trim())
    if (parts.length >= 2) {
      const firstName = parts[1].split(' ')[0]
      const lastName = parts[0]
      return `${firstName} ${lastName}` // "John Smith"
    }
    return raw

  } catch { return null }
}

// ── GOOGLE SEARCH FALLBACK ───────────────────────────────────────────────────

async function googleSearchFounder(companyName, website) {
  try {
    const queries = [
      `"${companyName}" founder CEO site:linkedin.com`,
      `"${companyName}" founder OR CEO OR director contact`,
    ]

    for (const query of queries) {
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=5`
      const res = await fetch(url, { headers: FETCH_HEADERS, signal: AbortSignal.timeout(7000) })
      if (!res.ok) continue
      const html = await res.text()
      const text = stripTags(html)
      const name = extractFounderName(text)
      if (name) return name
      await sleep(500)
    }
  } catch {}
  return null
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { leadId } = await request.json()
  if (!leadId) return NextResponse.json({ success: false, error: 'leadId required' }, { status: 400 })

  const { data: lead, error: loadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (loadErr || !lead) {
    return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
  }

  if (!lead.website) {
    return NextResponse.json({ success: false, error: 'Lead has no website — add one first' }, { status: 400 })
  }

  const cleanBase = (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`).replace(/\/$/, '')
  const domain = extractDomain(lead.website)

  let founderName = lead.full_name || null
  let foundEmail = lead.email || null
  let emailPatterns = []
  let pagesChecked = 0
  let source = []

  // ── STEP 1: Scrape website pages ─────────────────────────────────
  const pageSlugs = [
    '', '/about', '/about-us', '/team', '/our-team', '/contact', '/contact-us',
    '/leadership', '/founders', '/people', '/who-we-are', '/management',
    '/founder', '/ceo', '/partners', '/meet-the-team', '/staff', '/crew',
  ]

  let allOwnEmails = []
  let allOtherEmails = []

  for (const slug of pageSlugs) {
    const html = await fetchPage(cleanBase + slug)
    if (!html) continue
    pagesChecked++

    const { ownDomain, other } = extractEmails(html, domain)
    allOwnEmails.push(...ownDomain)
    allOtherEmails.push(...other)

    if (!founderName) {
      const text = stripTags(html)
      founderName = extractFounderName(text)
      if (founderName) source.push('website')
    }

    // Stop early if we have everything
    if (founderName && allOwnEmails.length > 0) break
    await sleep(300)
  }

  // Pick best email from own domain
  if (!foundEmail && allOwnEmails.length > 0) {
    foundEmail = pickBestEmail([...new Set(allOwnEmails)])
    if (foundEmail) source.push('website-email')
  }

  // ── STEP 2: Companies House (UK only, free) ───────────────────────
  if (!founderName && lead.country === 'United Kingdom') {
    const chName = await lookupCompaniesHouse(lead.company)
    if (chName) {
      founderName = chName
      source.push('companies-house')
    }
  }

  // ── STEP 3: Google search for founder name ────────────────────────
  if (!founderName) {
    founderName = await googleSearchFounder(lead.company, lead.website)
    if (founderName) source.push('google')
  }

  // ── STEP 4: Generate email patterns ──────────────────────────────
  if (!foundEmail && founderName && domain) {
    emailPatterns = guessEmailPatterns(founderName, domain)
  } else if (!foundEmail && !founderName && domain) {
    // At least give generic contact patterns
    emailPatterns = [`hello@${domain}`, `info@${domain}`, `contact@${domain}`]
  }

  // ── STEP 5: Save updates ─────────────────────────────────────────
  const updates = {}

  if (founderName && !lead.full_name) {
    updates.full_name = founderName
    updates.first_name = founderName.split(' ')[0]
  }
  if (foundEmail && !lead.email) {
    updates.email = foundEmail
  }
  if (emailPatterns.length > 0 && !lead.email) {
    const existingNotes = (lead.notes || '').replace(/\nEmail patterns:.*$/s, '') // replace old patterns
    updates.notes = existingNotes + `\nEmail patterns: ${emailPatterns.join(' | ')}`
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('leads').update(updates).eq('id', leadId)
  }

  return NextResponse.json({
    success: true,
    founderName: founderName || lead.full_name || null,
    email: foundEmail || lead.email || null,
    emailPatterns,
    pagesChecked,
    source: source.join(', ') || 'none',
    updated: Object.keys(updates),
  })
}

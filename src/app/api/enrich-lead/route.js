import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function extractDomain(url) {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch { return null }
}

function stripTags(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── EMAIL EXTRACTION ─────────────────────────────────────────────────────────

function extractEmails(html, domain) {
  const found = new Set()

  // 1. mailto: links — most reliable source
  const mailtoPattern = /mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi
  let m
  while ((m = mailtoPattern.exec(html)) !== null) {
    found.add(m[1].toLowerCase())
  }

  // 2. Meta tags — some sites use <meta name="author" content="email@...">
  const metaPattern = /<meta[^>]+content=["']([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})["']/gi
  while ((m = metaPattern.exec(html)) !== null) {
    found.add(m[1].toLowerCase())
  }

  // 3. Plain text emails in the page
  const text = stripTags(html)
  const plainPattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  while ((m = plainPattern.exec(text)) !== null) {
    const email = m[0].toLowerCase()
    // Filter out false positives
    if (email.includes('.png') || email.includes('.jpg') || email.includes('.svg')) continue
    if (email.includes('@2x') || email.includes('@3x')) continue
    if (email.endsWith('.js') || email.endsWith('.css') || email.endsWith('.min')) continue
    if (email.includes('sentry') || email.includes('example.com') || email.includes('test.com')) continue
    found.add(email)
  }

  // Filter to own domain emails first, keep others as fallback
  const all = [...found]
  const ownDomain = domain ? all.filter(e => e.endsWith(`@${domain}`)) : []
  const other = all.filter(e => domain ? !e.endsWith(`@${domain}`) : true)

  return { ownDomain, other, all }
}

// Pick best email — personal over generic
function pickBestEmail(emails) {
  const generic = ['info', 'hello', 'contact', 'enquiries', 'enquiry', 'sales',
    'support', 'admin', 'mail', 'office', 'team', 'hey', 'hi', 'help',
    'press', 'media', 'privacy', 'legal', 'billing', 'no-reply', 'noreply']

  const personal = emails.filter(e => {
    const prefix = e.split('@')[0]
    return !generic.includes(prefix) && !prefix.includes('+')
  })
  const genericMatches = emails.filter(e => {
    const prefix = e.split('@')[0]
    return generic.includes(prefix)
  })

  return personal[0] || genericMatches[0] || null
}

// ── FOUNDER NAME EXTRACTION ──────────────────────────────────────────────────

function extractFounderName(text) {
  const patterns = [
    // "I'm Sarah Johnson, founder" or "I'm Sarah, founder"
    /I(?:'m|'m| am)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:the\s+)?(?:CEO|Founder|Co-?Founder|Owner|Director|Managing)/,
    // "Sarah Johnson — CEO" or "Sarah Johnson | Founder"
    /([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*[—\-–|•,]\s*(?:CEO|Founder|Co-?Founder|Managing Director|Owner|President|Principal|Director|Partner)/,
    // "CEO: Sarah Johnson" or "Founder — Sarah Johnson"
    /(?:CEO|Founder|Co-?Founder|Managing Director|Owner|President|Director|Partner)\s*[:\-–|•]?\s*([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
    // "Meet Sarah Johnson, our founder"
    /[Mm]eet\s+([A-Z][a-z]+\s[A-Z][a-z]+),?\s+(?:our\s+)?(?:CEO|Founder|Co-?Founder|Owner|Director)/,
    // "Founded by Sarah Johnson"
    /[Ff]ounded\s+by\s+([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
    // "Sarah Johnson started/built/created"
    /([A-Z][a-z]+\s[A-Z][a-z]+)\s+(?:started|built|created|launched|founded)\s+(?:this|the|our)/,
    // "says Sarah Johnson, CEO"
    /says\s+([A-Z][a-z]+\s[A-Z][a-z]+),\s*(?:CEO|Founder|Owner|Director)/,
  ]

  for (const pattern of patterns) {
    const m = text.match(pattern)
    if (m) {
      const name = m[1].trim()
      // Sanity check: proper name, not a common word
      if (name.length > 4 && name.length < 50 && /^[A-Z]/.test(name)) {
        return name
      }
    }
  }
  return null
}

// ── COMPANIES HOUSE (UK) — free, no API key needed ───────────────────────────

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

// ── EMAIL PATTERN GENERATOR ──────────────────────────────────────────────────

function guessEmailPatterns(fullName, domain) {
  if (!fullName || !domain) return []
  const parts = fullName.trim().toLowerCase().split(/\s+/)
  const f = parts[0]
  const l = parts[1] || null
  const patterns = [`${f}@${domain}`]
  if (l) {
    patterns.push(
      `${f}.${l}@${domain}`,
      `${f[0]}${l}@${domain}`,
      `${f[0]}.${l}@${domain}`,
      `${l}@${domain}`,
      `${f}${l[0]}@${domain}`,
    )
  }
  // Add generic fallbacks so Varghese has something to try
  patterns.push(`hello@${domain}`, `info@${domain}`, `contact@${domain}`)
  return [...new Set(patterns)] // deduplicate
}

// ── FETCH HELPER ─────────────────────────────────────────────────────────────

async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(7000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
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

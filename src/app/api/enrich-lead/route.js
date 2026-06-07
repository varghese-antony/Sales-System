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

// Pull all emails from raw HTML
function extractEmails(html) {
  const found = new Set()
  const pattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  let m
  while ((m = pattern.exec(html)) !== null) {
    const email = m[0].toLowerCase()
    // Skip image/asset/code false positives
    if (email.includes('.png') || email.includes('.jpg') || email.includes('.svg')) continue
    if (email.includes('@2x') || email.includes('@3x')) continue
    if (email.endsWith('.js') || email.endsWith('.css')) continue
    found.add(email)
  }
  return [...found]
}

// Try to find a founder/CEO name from HTML
function extractFounderName(html) {
  // Patterns: "CEO", "Founder", "Co-Founder", "Managing Director", "Owner", "Director"
  const titlePattern = /(?:CEO|Founder|Co-?Founder|Managing Director|Owner|President|Principal|Director)\s*[,:\-–|•]?\s*([A-Z][a-z]+(?:\s[A-Z][a-z]+){1,2})/g
  let m
  while ((m = titlePattern.exec(html)) !== null) {
    const name = m[1].trim()
    if (name.length > 3 && name.length < 50) return name
  }

  // Reverse: name then title
  const reversePattern = /([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)[,\s\-–|•]+(?:CEO|Founder|Co-?Founder|Managing Director|Owner|President)/g
  while ((m = reversePattern.exec(html)) !== null) {
    const name = m[1].trim()
    if (name.length > 3 && name.length < 50) return name
  }

  return null
}

// Strip HTML tags to plain text for cleaner regex
function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
}

// Fetch one URL and return text, null on fail
async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: AbortSignal.timeout(7000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch { return null }
}

// Generate the 6 most common business email patterns
function guessEmailPatterns(firstName, lastName, domain) {
  if (!firstName || !domain) return []
  const f = firstName.toLowerCase().trim()
  const l = lastName ? lastName.toLowerCase().trim() : null

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
  return patterns
}

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { leadId } = await request.json()
  if (!leadId) return NextResponse.json({ success: false, error: 'leadId required' }, { status: 400 })

  // Load the lead
  const { data: lead, error: loadErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (loadErr || !lead) {
    return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })
  }

  const website = lead.website
  if (!website) {
    return NextResponse.json({ success: false, error: 'Lead has no website — add one first' }, { status: 400 })
  }

  const base = website.startsWith('http') ? website.rstrip?.('/') ?? website : `https://${website}`
  const cleanBase = base.replace(/\/$/, '')
  const domain = extractDomain(website)

  const results = {
    founderName: null,
    email: null,
    emailPatterns: [],
    pagesChecked: [],
    source: null,
  }

  // ── STEP 1: Scrape key pages for emails + founder name ──────────────
  const pagesToCheck = [
    cleanBase,
    `${cleanBase}/about`,
    `${cleanBase}/about-us`,
    `${cleanBase}/team`,
    `${cleanBase}/our-team`,
    `${cleanBase}/contact`,
    `${cleanBase}/contact-us`,
    `${cleanBase}/leadership`,
    `${cleanBase}/founders`,
    `${cleanBase}/people`,
  ]

  let allEmails = []

  for (const pageUrl of pagesToCheck) {
    const html = await fetchPage(pageUrl)
    if (!html) continue

    results.pagesChecked.push(pageUrl)
    const text = stripTags(html)

    // Collect emails
    const emails = extractEmails(text)
    for (const e of emails) allEmails.push(e)

    // Try to find founder name if we don't have one yet
    if (!results.founderName) {
      results.founderName = extractFounderName(text)
    }

    // Stop early if we have both
    if (results.founderName && allEmails.length > 0) break

    await sleep(400)
  }

  // ── STEP 2: Pick the best email ─────────────────────────────────────
  // Prefer personal emails (contain a name) over generic ones
  const genericPrefixes = ['info', 'hello', 'contact', 'enquiries', 'enquiry',
    'sales', 'support', 'admin', 'mail', 'office', 'team', 'hey', 'hi']

  // Only keep emails on the company's own domain
  const ownDomainEmails = allEmails.filter(e => e.endsWith(`@${domain}`))
  const personalEmails = ownDomainEmails.filter(e => {
    const prefix = e.split('@')[0]
    return !genericPrefixes.includes(prefix)
  })
  const genericEmails = ownDomainEmails.filter(e => {
    const prefix = e.split('@')[0]
    return genericPrefixes.includes(prefix)
  })

  results.email = personalEmails[0] || genericEmails[0] || null

  // ── STEP 3: Google search for founder name if still missing ─────────
  if (!results.founderName) {
    try {
      const query = encodeURIComponent(`"${lead.company}" CEO OR Founder site:linkedin.com`)
      const googleUrl = `https://www.google.com/search?q=${query}&num=5`
      const googleHtml = await fetchPage(googleUrl)
      if (googleHtml) {
        const googleText = stripTags(googleHtml)
        results.founderName = extractFounderName(googleText)
        if (results.founderName) results.source = 'google'
      }
    } catch {}
  }

  // ── STEP 4: Generate email patterns if we have a name but no email ──
  if (!results.email && results.founderName && domain) {
    const parts = results.founderName.trim().split(/\s+/)
    const firstName = parts[0]
    const lastName = parts[1] || null
    results.emailPatterns = guessEmailPatterns(firstName, lastName, domain)
  }

  // ── STEP 5: Save back to leads table ────────────────────────────────
  const updates = {}

  if (results.founderName && !lead.full_name) {
    updates.full_name = results.founderName
    updates.first_name = results.founderName.split(' ')[0]
  }

  if (results.email && !lead.email) {
    updates.email = results.email
  }

  if (results.emailPatterns.length > 0 && !lead.email) {
    // Store patterns in notes so Varghese can pick the right one
    const existing = lead.notes || ''
    updates.notes = existing + `\nEmail patterns: ${results.emailPatterns.join(' | ')}`
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('leads').update(updates).eq('id', leadId)
  }

  return NextResponse.json({
    success: true,
    founderName: results.founderName || lead.full_name,
    email: results.email || lead.email,
    emailPatterns: results.emailPatterns,
    pagesChecked: results.pagesChecked.length,
    updated: Object.keys(updates),
  })
}

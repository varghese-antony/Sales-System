import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Background enrichment — runs entirely server-side.
// POST /api/enrich-all-background  → starts job (or returns current status if already running)
// GET  /api/enrich-all-background  → returns current job status

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

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

const SLUGS = [
  '', '/about', '/about-us', '/team', '/our-team', '/contact', '/contact-us',
  '/founder', '/ceo', '/management', '/leadership', '/crew', '/partners',
  '/people', '/staff', '/meet-the-team', '/who-we-are', '/company',
]

async function fetchPage(url, timeout = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const r = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal })
    if (!r.ok) return null
    return await r.text()
  } catch { return null } finally { clearTimeout(timer) }
}

function extractEmails(html, ownDomain) {
  const emails = []
  // mailto links first (most reliable)
  const mailtoRe = /href=["']mailto:([^"'?]+)/gi
  let m
  while ((m = mailtoRe.exec(html)) !== null) {
    const e = m[1].trim().toLowerCase()
    if (e && !e.includes('noreply') && !e.includes('no-reply') && !e.includes('example')) {
      emails.push(e)
    }
  }
  // Plain email addresses
  const plain = html.match(EMAIL_RE) || []
  for (const e of plain) {
    const el = e.toLowerCase()
    if (el.includes('noreply') || el.includes('no-reply') || el.includes('example') ||
        el.endsWith('.png') || el.endsWith('.jpg') || el.endsWith('.svg')) continue
    // Prefer emails on the same domain
    if (ownDomain && el.includes(ownDomain)) emails.unshift(el)
    else emails.push(el)
  }
  return [...new Set(emails)]
}

function extractFounderName(text) {
  const patterns = [
    /(?:CEO|Founder|Co-Founder|Director|MD|Managing Director|Owner)[,\s]+([A-Z][a-z]+ [A-Z][a-z]+)/,
    /([A-Z][a-z]+ [A-Z][a-z]+)[,\s]+(?:CEO|Founder|Co-Founder|Director)/,
    /Founded by ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /I[''']m ([A-Z][a-z]+ [A-Z][a-z]+)[,\s]+(?:founder|CEO)/i,
    /My name is ([A-Z][a-z]+ [A-Z][a-z]+)/i,
    /([A-Z][a-z]+ [A-Z][a-z]+),?\s+(?:started|created|built|launched) /i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[1]) return m[1].trim()
  }
  return null
}

function guessEmails(founderName, domain) {
  if (!domain) return []
  const parts = (founderName || '').toLowerCase().trim().split(/\s+/)
  if (parts.length < 2) return [`info@${domain}`, `hello@${domain}`, `contact@${domain}`]
  const [first, last] = parts
  const f = first[0]
  return [
    `${first}@${domain}`,
    `${first}.${last}@${domain}`,
    `${f}.${last}@${domain}`,
    `${f}${last}@${domain}`,
    `${first}${last[0]}@${domain}`,
    `info@${domain}`,
    `hello@${domain}`,
  ]
}

async function enrichOneLead(lead) {
  const domain = extractDomain(lead.website)
  let foundEmail = null
  let foundName = null

  for (const slug of SLUGS) {
    const url = `https://${domain}${slug}`
    const html = await fetchPage(url)
    if (!html) continue
    const text = stripTags(html)

    if (!foundEmail) {
      const emails = extractEmails(html, domain)
      if (emails.length) foundEmail = emails[0]
    }
    if (!foundName) {
      foundName = extractFounderName(text)
    }
    if (foundEmail && foundName) break
    await sleep(300)
  }

  // Companies House for UK leads
  if (!foundEmail && lead.country && lead.country.toLowerCase().includes('united kingdom') && process.env.COMPANIES_HOUSE_API_KEY) {
    try {
      const q = encodeURIComponent(lead.company || '')
      const r = await fetch(`https://api.company-information.service.gov.uk/search/companies?q=${q}&items_per_page=1`, {
        headers: { Authorization: 'Basic ' + Buffer.from(process.env.COMPANIES_HOUSE_API_KEY + ':').toString('base64') },
      })
      const d = await r.json()
      const co = d.items?.[0]
      if (co?.company_number) {
        const r2 = await fetch(`https://api.company-information.service.gov.uk/company/${co.company_number}/officers?items_per_page=5`, {
          headers: { Authorization: 'Basic ' + Buffer.from(process.env.COMPANIES_HOUSE_API_KEY + ':').toString('base64') },
        })
        const d2 = await r2.json()
        const officer = (d2.items || []).find(o => ['director', 'ceo', 'founder'].some(t => (o.officer_role || '').toLowerCase().includes(t)))
        if (officer?.name) {
          const parts = officer.name.split(',')
          const surname = parts[0]?.trim() || ''
          const firstname = parts[1]?.trim()?.split(' ')[0] || ''
          if (firstname && surname) foundName = `${firstname} ${surname}`
        }
      }
    } catch {}
  }

  return { email: foundEmail, name: foundName, domain }
}

// GET — return current status
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
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

// POST — start background enrichment (runs in same request but doesn't block UI via async)
export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Check if already running
  const { data: statusRow } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'enrich_job_status')
    .single()

  if (statusRow?.value === 'running') {
    return NextResponse.json({ success: false, message: 'Enrichment already running' })
  }

  // Get leads to enrich
  const { data: leads } = await supabase
    .from('leads')
    .select('id, company, email, website, full_name, country')
    .is('email', null)
    .not('website', 'is', null)
    .neq('website', '')

  const toEnrich = (leads || []).filter(l => l.website)

  if (!toEnrich.length) {
    return NextResponse.json({ success: true, message: 'No leads need enrichment', total: 0 })
  }

  // Mark as running
  async function setSetting(key, value) {
    await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() })
  }

  await setSetting('enrich_job_status', 'running')
  await setSetting('enrich_job_done', '0')
  await setSetting('enrich_job_total', toEnrich.length.toString())
  await setSetting('enrich_job_found', '0')
  await setSetting('enrich_job_updated_at', new Date().toISOString())

  // Run enrichment in the background (don't await — respond immediately)
  ;(async () => {
    let done = 0
    let found = 0
    for (const lead of toEnrich) {
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
          await supabase.from('leads').update(updates).eq('id', lead.id)
        }
      } catch {}
      done++
      // Update progress every 5 leads
      if (done % 5 === 0 || done === toEnrich.length) {
        await setSetting('enrich_job_done', done.toString())
        await setSetting('enrich_job_found', found.toString())
        await setSetting('enrich_job_updated_at', new Date().toISOString())
      }
    }
    await setSetting('enrich_job_status', 'done')
    await setSetting('enrich_job_done', done.toString())
    await setSetting('enrich_job_found', found.toString())
    await setSetting('enrich_job_updated_at', new Date().toISOString())
  })()

  return NextResponse.json({
    success: true,
    message: `Started enriching ${toEnrich.length} leads in background`,
    total: toEnrich.length,
  })
}

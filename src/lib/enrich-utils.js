// ─── Shared enrichment utilities ─────────────────────────────────────────────
// Single source of truth used by enrich-lead and enrich-batch.
// Any fix here applies to both automatically.

export const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
}

export function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

export function extractDomain(url) {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch { return null }
}

export function stripTags(html) {
  if (!html) return ''
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function fetchPage(url, timeout = 7000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    const r = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal })
    if (!r.ok) return null
    return await r.text()
  } catch { return null } finally { clearTimeout(timer) }
}

const EMAIL_GENERIC = new Set([
  'info', 'hello', 'contact', 'enquiries', 'enquiry', 'sales',
  'support', 'admin', 'mail', 'office', 'team', 'hey', 'hi', 'help',
  'press', 'media', 'privacy', 'legal', 'billing', 'no-reply', 'noreply',
])

/**
 * Extracts email addresses from HTML. Returns { ownDomain, other, all }.
 * Prefers mailto: links, then meta tags, then plain text.
 * Filters obvious false positives (.png, @2x, sentry, etc.)
 */
export function extractEmails(html, domain) {
  const found = new Set()

  // 1. mailto: links — most reliable
  const mailtoRe = /href=["']mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi
  let m
  while ((m = mailtoRe.exec(html)) !== null) {
    const e = m[1].trim().toLowerCase()
    if (e && !e.includes('noreply') && !e.includes('no-reply') && !e.includes('example')) {
      found.add(e)
    }
  }

  // 2. Meta tags
  const metaRe = /<meta[^>]+content=["']([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})["']/gi
  while ((m = metaRe.exec(html)) !== null) found.add(m[1].toLowerCase())

  // 3. Plain text scan
  const text = stripTags(html)
  const plainRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  while ((m = plainRe.exec(text)) !== null) {
    const e = m[0].toLowerCase()
    if (e.includes('.png') || e.includes('.jpg') || e.includes('.svg')) continue
    if (e.includes('@2x') || e.includes('@3x')) continue
    if (e.endsWith('.js') || e.endsWith('.css') || e.endsWith('.min')) continue
    if (e.includes('sentry') || e.includes('example.com') || e.includes('test.com')) continue
    found.add(e)
  }

  const all = [...found]
  const ownDomain = domain ? all.filter(e => e.endsWith(`@${domain}`)) : []
  const other = all.filter(e => domain ? !e.endsWith(`@${domain}`) : true)
  return { ownDomain, other, all }
}

/**
 * From a list of emails, prefer a personal address over a generic one.
 */
export function pickBestEmail(emails) {
  const personal = emails.filter(e => !EMAIL_GENERIC.has(e.split('@')[0]) && !e.split('@')[0].includes('+'))
  const generic  = emails.filter(e =>  EMAIL_GENERIC.has(e.split('@')[0]))
  return personal[0] || generic[0] || null
}

/**
 * Scans text for a founder/CEO name. Returns "Firstname Lastname" or null.
 * Uses the more comprehensive pattern set from enrich-lead.
 */
export function extractFounderName(text) {
  const patterns = [
    /I(?:'m|'m| am)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?),?\s+(?:the\s+)?(?:CEO|Founder|Co-?Founder|Owner|Director|Managing)/,
    /([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*[—\-–|•,]\s*(?:CEO|Founder|Co-?Founder|Managing Director|Owner|President|Principal|Director|Partner)/,
    /(?:CEO|Founder|Co-?Founder|Managing Director|Owner|President|Director|Partner)\s*[:\-–|•]?\s*([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
    /[Mm]eet\s+([A-Z][a-z]+\s[A-Z][a-z]+),?\s+(?:our\s+)?(?:CEO|Founder|Co-?Founder|Owner|Director)/,
    /[Ff]ounded\s+by\s+([A-Z][a-z]+\s[A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/,
    /([A-Z][a-z]+\s[A-Z][a-z]+)\s+(?:started|built|created|launched|founded)\s+(?:this|the|our)/,
    /says\s+([A-Z][a-z]+\s[A-Z][a-z]+),\s*(?:CEO|Founder|Owner|Director)/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const name = match[1].trim()
      if (name.length > 4 && name.length < 50 && /^[A-Z]/.test(name)) return name
    }
  }
  return null
}

/**
 * Generates plausible email patterns for a founder name + domain.
 * Returns an array of guesses, personal first then generic fallbacks.
 */
export function guessEmailPatterns(fullName, domain) {
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
  patterns.push(`hello@${domain}`, `info@${domain}`, `contact@${domain}`)
  return [...new Set(patterns)]
}

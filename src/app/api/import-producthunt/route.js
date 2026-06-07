import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const TOPICS = [
  { slug: 'saas',            industry: 'SaaS',    url: 'https://www.producthunt.com/topics/saas' },
  { slug: 'human-resources', industry: 'HR Tech', url: 'https://www.producthunt.com/topics/human-resources' },
  { slug: 'productivity',    industry: 'SaaS',    url: 'https://www.producthunt.com/topics/productivity' },
]

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
}

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

function parsePage(html, industry) {
  const products = []

  // ProductHunt renders product cards in JSON-LD or in structured HTML.
  // Try JSON-LD first — ProductHunt often embeds structured data in <script type="application/ld+json">
  const jsonLdMatches = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1])
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item['@type'] === 'Product' || item['@type'] === 'SoftwareApplication') {
          products.push({
            company: item.name || null,
            website: item.url || item.sameAs || null,
            makerName: null,
            industry,
          })
        }
      }
    } catch {}
  }

  // Fallback: regex over HTML for product names and links
  if (products.length === 0) {
    // Pattern: data-test="post-name" or class containing "post-name"
    const namePattern = /data-test="post-name"[^>]*>([^<]+)<\/[^>]+>/gi
    let nm
    while ((nm = namePattern.exec(html)) !== null) {
      products.push({ company: nm[1].trim(), website: null, makerName: null, industry })
    }

    // Alternative: <h3> or <h2> inside product cards
    if (products.length === 0) {
      const h3Pattern = /<h3[^>]*class="[^"]*[Tt]itle[^"]*"[^>]*>([^<]{3,80})<\/h3>/gi
      let h3m
      while ((h3m = h3Pattern.exec(html)) !== null) {
        const name = h3m[1].trim()
        if (name && !name.includes('<') && !name.includes('{')) {
          products.push({ company: name, website: null, makerName: null, industry })
        }
      }
    }
  }

  // Extract external website links — links that go outside producthunt.com
  const externalLinks = []
  const linkPattern = /href="(https?:\/\/(?!(?:www\.)?producthunt\.com)[^"]{4,100})"/gi
  let lm
  while ((lm = linkPattern.exec(html)) !== null) {
    try {
      const u = new URL(lm[1])
      if (!u.hostname.includes('twitter') && !u.hostname.includes('google') &&
          !u.hostname.includes('facebook') && !u.hostname.includes('apple')) {
        const domain = u.hostname.replace(/^www\./, '')
        if (!externalLinks.includes(domain)) externalLinks.push(domain)
      }
    } catch {}
  }

  // Attach websites to products by position
  for (let i = 0; i < products.length && i < externalLinks.length; i++) {
    if (!products[i].website) {
      products[i].website = 'https://' + externalLinks[i]
    }
  }

  // Extract maker names — look for "By [Name]" patterns or maker spans
  const makerPattern = /(?:By|by|maker|Maker)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/g
  let mm
  const makers = []
  while ((mm = makerPattern.exec(html)) !== null) {
    makers.push(mm[1].trim())
  }
  for (let i = 0; i < products.length && i < makers.length; i++) {
    if (!products[i].makerName) products[i].makerName = makers[i]
  }

  return products
}

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

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

  for (const topic of TOPICS) {
    let html = ''
    try {
      const res = await fetch(topic.url, {
        headers: FETCH_HEADERS,
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) {
        console.warn(`ProductHunt returned ${res.status} for ${topic.url}`)
        continue
      }
      html = await res.text()
    } catch (err) {
      console.warn(`Fetch failed for ${topic.url}:`, err.message)
      continue
    }

    const products = parsePage(html, topic.industry)
    total += products.length

    for (const product of products) {
      if (!product.company) { skipped++; continue }

      const domain = extractDomain(product.website)
      if (domain && existingDomains.has(domain)) { skipped++; continue }

      const firstName = product.makerName ? product.makerName.split(' ')[0] : null

      const { error } = await supabase.from('leads').insert({
        company: product.company,
        website: product.website || null,
        industry: product.industry,
        country: null, // ProductHunt is global — Varghese filters manually
        full_name: product.makerName || null,
        first_name: firstName,
        email: null,
        linkedin_url: null,
        status: 'new',
        notes: `Source: ProductHunt — ${topic.slug}`,
        source: 'producthunt',
        score: 6, // slightly higher — founders self-select by posting
      })

      if (!error) {
        added++
        if (domain) existingDomains.add(domain)
      } else {
        skipped++
      }
    }

    await sleep(2000) // polite delay between topic pages
  }

  return NextResponse.json({ success: true, added, skipped, total })
}

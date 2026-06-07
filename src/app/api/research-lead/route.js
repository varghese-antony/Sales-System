import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Decode HTML entities so scraped text is clean plain text
function decodeHtml(str) {
  if (!str) return ''
  return str
    .replace(/&#8220;/g, '"').replace(/&#8221;/g, '"')
    .replace(/&#8216;/g, "'").replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#38;/g, '&').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#160;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&[a-z]+;/gi, '')   // strip any remaining unknown entities
    .replace(/\s+/g, ' ').trim()
}

async function scrapeWebsite(domain) {
  const base = domain.startsWith('http') ? domain : `https://${domain}`
  const pages = ['', '/about', '/about-us', '/services', '/what-we-do']
  const results = []
  for (const path of pages) {
    try {
      const res = await fetch(base + path, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) continue
      const html = await res.text()
      const meta = decodeHtml(
        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{15,300})["']/i)?.[1]
        || html.match(/<meta[^>]+content=["']([^"']{15,300})["'][^>]+name=["']description["']/i)?.[1]
      )
      const h1 = [...html.matchAll(/<h1[^>]*>([^<]{5,150})<\/h1>/gi)].map(m=>decodeHtml(m[1])).filter(Boolean).slice(0,3)
      const h2 = [...html.matchAll(/<h2[^>]*>([^<]{5,100})<\/h2>/gi)].map(m=>decodeHtml(m[1])).filter(Boolean).slice(0,6)
      const paras = [...html.matchAll(/<p[^>]*>([^<]{30,300})<\/p>/gi)].map(m=>decodeHtml(m[1].replace(/<[^>]+>/g,''))).filter(Boolean).slice(0,4)
      if (meta || h1.length || paras.length) results.push({ path, meta, h1, h2, paras })
    } catch {}
  }
  return results
}

async function searchCompanySignals(companyName) {
  const signals = []
  const queries = [
    `"${companyName}" (hiring OR launched OR award OR partnership OR expanded) 2024 OR 2025`,
    `"${companyName}" site:linkedin.com`,
  ]
  for (const query of queries) {
    try {
      const res = await fetch(`https://www.google.com/search?q=${encodeURIComponent(query)}&num=5`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(5000),
      })
      const html = await res.text()
      const snippets = [...html.matchAll(/\{"[^}]*"snippet":"([^"]{40,200})"/g)]
        .map(m => m[1].replace(/\\n/g,' ').trim())
        .filter(s => s.toLowerCase().includes(companyName.toLowerCase().split(' ')[0]))
        .slice(0,2)
      signals.push(...snippets)
    } catch {}
  }
  return [...new Set(signals)].slice(0, 4)
}

const PAIN_MAP = {
  'Marketing Agency':  { pain: 'manual client reporting across 5+ platforms, proposal creation eating hours, and account managers drowning in admin', outcome: 'agencies saving 12–18 hrs/week per account manager' },
  'SaaS':             { pain: 'manual customer onboarding sequences, support ticket routing, and churn signals being missed', outcome: 'SaaS teams cutting onboarding time by 60% without adding headcount' },
  'Consulting':        { pain: 'proposal creation eating 3–5 hrs per client, manual project tracking, and billing reconciliation eating month-end', outcome: 'consultancies reclaiming 2 full days a month per consultant' },
  'E-commerce SaaS':  { pain: 'customer service volume scaling faster than the team, return backlogs, and disconnected order data', outcome: 'e-commerce ops teams handling 3x volume with the same headcount' },
  'HR Tech':          { pain: 'candidate screening delays, interview scheduling back-and-forth, and manual status updates', outcome: 'HR teams cutting time-to-hire by 40%' },
  'Legal Tech SaaS':  { pain: 'document review bottlenecks, manual client intake forms, and billing reconciliation', outcome: 'legal teams reclaiming 8+ hrs/week in admin' },
  'PropTech SaaS':    { pain: 'manual tenant onboarding, maintenance request tracking, and reporting across properties', outcome: 'property teams cutting manual admin by 50%' },
}

// 4 completely different email angles
function buildEmail(variation, { first, company, industry, country, tagline, services, pain, outcome, signals }) {
  const svc = services[0]?.toLowerCase() || industry.toLowerCase()
  const svc2 = services[1]?.toLowerCase() || ''
  const signal = signals[0]?.slice(0, 100) || ''
  const tag = tagline?.slice(0, 80) || ''

  const angles = [
    // Angle 0 — Problem-led: open with their specific pain
    {
      subject: `Quick question about ${company}'s operations, ${first}`,
      body: `Hi ${first},

I was researching ${industry} teams in ${country} and came across ${company} — ${tag ? `"${tag}"` : `impressive work`}.

I specialise in one thing: helping ${industry} founders stop losing 10–20 hours a week to ${pain}.

It's almost always invisible until someone maps it out — the manual reporting, the tool-switching, the tasks that feel necessary but could run automatically.

I recently helped a similar business with ${outcome}, without changing their existing stack or hiring anyone new.

Would you be open to a 20-minute call so I can show you exactly what that looked like — and whether something similar applies to ${company}?

Best,
Varghese`,
    },

    // Angle 1 — Curiosity/question: open with a direct question
    {
      subject: `${first}, how much time does ${company} spend on ops each week?`,
      body: `Hi ${first},

Quick question — how many hours a week does your team spend on work that isn't directly serving clients or building the product?

I ask because I work with ${industry} founders, and the answer is almost always higher than expected. Things like ${pain} quietly eat 10–20 hours a week that should be going into growth.

I came across ${company}${svc ? ` and your work on ${svc}` : ''} — you're clearly doing strong work. I'd hate for ops overhead to be the thing that slows that down.

I've helped similar businesses with ${outcome} — happy to share exactly how if it's useful.

Worth a 20-minute call this week?

Best,
Varghese`,
    },

    // Angle 2 — Social proof first: lead with the result
    {
      subject: `How a ${industry} like ${company} saved 15hrs/week — worth sharing`,
      body: `Hi ${first},

I recently helped a ${industry} founder in ${country} reclaim 15 hours a week — not by hiring, not by switching tools, just by fixing how their existing setup was connected.

The bottleneck was ${pain}. Sound familiar?

When I looked at ${company}${svc ? ` and what you're doing around ${svc}` : ''}, I saw the same pattern. The team is doing great work, but there's almost certainly time being lost to manual processes that could be automated.

${outcome} — that's the kind of result I consistently see when we fix this properly.

I'd love to spend 20 minutes showing you the exact approach. No pitch — just a practical look at your setup.

Are you free any time this week or next?

Best,
Varghese`,
    },

    // Angle 3 — Direct & short: respect their time
    {
      subject: `${company} + ops automation — 2 mins?`,
      body: `Hi ${first},

I'll keep this short.

I help ${industry} founders automate the ops work that's quietly draining their team — specifically ${pain}.

I looked at ${company}${tag ? ` — "${tag}"` : ''} — you're building something worth protecting from operational drag.

Most teams I work with find ${outcome} within 60 days. No new tools, no extra headcount.

Would a 20-minute call be worth it to find out if the same applies to you?

Best,
Varghese`,
    },
  ]

  return angles[variation % 4]
}

export async function POST(req) {
  const { lead, variation = 0 } = await req.json()
  if (!lead) return NextResponse.json({ error: 'No lead' }, { status: 400 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const domain = lead.website?.replace(/^https?:\/\//, '') || `${lead.company.toLowerCase().replace(/\s+/g,'')}.com`

  const [siteData, signals] = await Promise.all([
    scrapeWebsite(domain),
    searchCompanySignals(lead.company),
  ])

  const homepage = siteData[0] || {}
  const aboutPage = siteData.find(p => p.path.includes('about')) || {}
  const tagline = homepage.h1?.[0] || homepage.meta || ''
  const aboutText = aboutPage.paras?.[0] || aboutPage.meta || ''
  const services = [...(homepage.h2||[]), ...(aboutPage.h2||[])].filter(h=>h.length>5).slice(0,4)
  const { pain, outcome } = PAIN_MAP[lead.industry] || { pain: 'disconnected tools and manual processes', outcome: 'founders reclaiming 10–15 hrs/week' }
  const first = lead.first_name || lead.full_name?.split(' ')[0] || 'there'

  const { subject, body } = buildEmail(variation, {
    first, company: lead.company, industry: lead.industry,
    country: lead.country, tagline, services, pain, outcome, signals,
  })

  let research = `COMPANY: ${lead.company}\n`
  research += `WHAT THEY DO: ${tagline || lead.industry}\n`
  if (aboutText) research += `ABOUT: ${aboutText}\n`
  if (services.length) research += `KEY SERVICES: ${services.join(' · ')}\n`
  if (signals.length) research += `RECENT SIGNALS:\n${signals.map(s=>`  • ${s.slice(0,120)}`).join('\n')}\n`
  research += `PAIN POINT: ${pain}\n`
  research += `TYPICAL OUTCOME: ${outcome}`

  await supabase.from('leads').update({ notes: research }).eq('id', lead.id)

  return NextResponse.json({ success: true, research, subject, body, siteData, signals })
}

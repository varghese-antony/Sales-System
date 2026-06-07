import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
      const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{15,300})["']/i)?.[1]
        || html.match(/<meta[^>]+content=["']([^"']{15,300})["'][^>]+name=["']description["']/i)?.[1]
      const h1 = [...html.matchAll(/<h1[^>]*>([^<]{5,150})<\/h1>/gi)].map(m=>m[1].trim()).filter(Boolean).slice(0,3)
      const h2 = [...html.matchAll(/<h2[^>]*>([^<]{5,100})<\/h2>/gi)].map(m=>m[1].trim()).filter(Boolean).slice(0,6)
      const paras = [...html.matchAll(/<p[^>]*>([^<]{30,300})<\/p>/gi)].map(m=>m[1].replace(/<[^>]+>/g,'').trim()).filter(Boolean).slice(0,4)
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

export async function POST(req) {
  const { lead } = await req.json()
  if (!lead) return NextResponse.json({ error: 'No lead' }, { status: 400 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const domain = lead.website?.replace(/^https?:\/\//, '') || `${lead.company.toLowerCase().replace(/\s+/g,'')}.com`

  const [siteData, signals] = await Promise.all([
    scrapeWebsite(domain),
    searchCompanySignals(lead.company),
  ])

  const homepage = siteData[0] || {}
  const aboutPage = siteData.find(p => p.path.includes('about')) || {}
  const tagline = homepage.h1?.[0] || homepage.meta || `${lead.company} is a ${lead.industry} company`
  const aboutText = aboutPage.paras?.[0] || aboutPage.meta || ''
  const services = [...(homepage.h2||[]), ...(aboutPage.h2||[])].filter(h=>h.length>5).slice(0,4)
  const { pain, outcome } = PAIN_MAP[lead.industry] || { pain: 'disconnected tools and manual processes', outcome: 'founders reclaiming 10–15 hrs/week' }

  // Build research notes
  let research = `COMPANY: ${lead.company}\n`
  research += `WHAT THEY DO: ${tagline}\n`
  if (aboutText) research += `ABOUT: ${aboutText}\n`
  if (services.length) research += `KEY SERVICES: ${services.join(' · ')}\n`
  if (signals.length) research += `RECENT SIGNALS:\n${signals.map(s=>`  • ${s.slice(0,120)}`).join('\n')}\n`
  research += `PAIN POINT: ${pain}\n`
  research += `TYPICAL OUTCOME: ${outcome}`

  // Build deeply personalised email
  const first = lead.first_name || lead.full_name?.split(' ')[0] || 'there'

  // Pick the most specific opening hook
  let hook = ''
  if (signals.length > 0) {
    hook = `I came across ${lead.company} recently — ${signals[0].slice(0,100).toLowerCase()}. That caught my attention.`
  } else if (services.length > 0) {
    hook = `I was looking at ${lead.company}'s work on ${services[0].toLowerCase()} and wanted to reach out directly.`
  } else if (tagline && tagline !== `${lead.company} is a ${lead.industry} company`) {
    hook = `"${tagline.slice(0,80)}" — that line on your website caught my attention and made me want to reach out.`
  } else {
    hook = `I came across ${lead.company} while researching top ${lead.industry} teams in ${lead.country} and wanted to reach out directly.`
  }

  const serviceContext = services.length > 0
    ? `For teams delivering ${services.slice(0,2).map(s=>s.toLowerCase()).join(' and ')}`
    : `For ${lead.industry} teams at your stage`

  const subject = `Quick question about ${lead.company}'s operations, ${first}`
  const body = `Hi ${first},

${hook}

I work with ${lead.industry} founders to eliminate the operational drag that quietly slows growth. ${serviceContext}, the biggest time-sink I consistently see is ${pain}.

Most founders I speak to are spending 10–20 hours a week on work that could run automatically — time that should be going into clients, strategy, and growth.

I recently helped a similar ${lead.industry} business with ${outcome}, without replacing their existing tools or adding headcount.

I'd love 20 minutes to look at ${lead.company}'s current setup and show you exactly where the quick wins are — no pitch, just a practical look.

Would any time this week or next work for you?

Best,
Varghese`

  await supabase.from('leads').update({ notes: research }).eq('id', lead.id)

  return NextResponse.json({ success: true, research, subject, body, siteData, signals })
}

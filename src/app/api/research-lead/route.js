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
  'Marketing Agency': {
    pain: 'manual client reporting, proposal creation, and account managers rebuilding the same decks every month',
    outcome: 'an agency like yours saving 12–18 hrs/week per account manager — without touching their existing tools',
    shortPain: 'client reporting and proposal admin',
    proofStat: '14 hours a week',
    proofContext: 'an agency founder in the UK who was manually pulling data from 6 platforms for every client report',
  },
  'SaaS': {
    pain: 'manual onboarding sequences, support triage done by hand, and churn signals nobody has time to act on',
    outcome: 'SaaS teams cutting onboarding time by 60% without adding headcount',
    shortPain: 'onboarding and support ops',
    proofStat: '11 hours a week',
    proofContext: 'a SaaS founder whose team was manually sending every onboarding email and chasing trial users one by one',
  },
  'Consulting': {
    pain: 'proposals taking 3–5 hrs each, project tracking living in spreadsheets, and month-end billing eating a full day',
    outcome: 'consultancies reclaiming 2 full days a month per consultant',
    shortPain: 'proposal creation and project admin',
    proofStat: '2 days a month',
    proofContext: 'a consulting firm where every SOW was being built from scratch — same structure, different client, every time',
  },
  'E-commerce SaaS': {
    pain: 'customer service volume outpacing the team, return backlogs, and order data living in three different places',
    outcome: 'e-commerce ops teams handling 3x volume with the same headcount',
    shortPain: 'customer ops and returns management',
    proofStat: '3x support volume',
    proofContext: 'an e-commerce team handling returns and refunds manually across email, Shopify, and a spreadsheet',
  },
  'HR Tech': {
    pain: 'candidate screening done by hand, interview scheduling going back and forth for days, and status updates nobody sends',
    outcome: 'HR teams cutting time-to-hire by 40%',
    shortPain: 'screening and scheduling admin',
    proofStat: '40% faster hiring',
    proofContext: 'an HR team spending 3 hrs a day on scheduling emails that should have been automated from the start',
  },
  'Legal Tech SaaS': {
    pain: 'document review bottlenecks, client intake still done manually, and billing reconciliation eating the last week of every month',
    outcome: 'legal teams reclaiming 8+ hrs/week in admin without changing their practice management software',
    shortPain: 'intake and billing admin',
    proofStat: '8 hours a week',
    proofContext: 'a legal tech firm whose client intake process involved 4 manual steps that could all be triggered automatically',
  },
  'PropTech SaaS': {
    pain: 'tenant onboarding done manually, maintenance requests tracked in spreadsheets, and monthly reporting rebuilt from scratch',
    outcome: 'property teams cutting manual admin by 50%',
    shortPain: 'tenant ops and reporting',
    proofStat: '50% less admin',
    proofContext: 'a property team manually chasing tenants for documents that could have been collected automatically on day one',
  },
}

function detectCompanyStage(signals, aboutText, tagline) {
  const text = [signals.join(' '), aboutText, tagline].join(' ').toLowerCase()
  if (/series [b-z]|ipo|enterprise|global|thousands of|500\+|1000\+/.test(text)) return 'established'
  if (/series a|raised|just launched|growing|scaling|hiring|new office/.test(text)) return 'growing'
  return 'early'
}

// Pick 1–2 sentences from their own website copy that reveal how they describe themselves
function extractMirrorPhrase(siteData) {
  for (const page of siteData) {
    for (const para of (page.paras || [])) {
      const clean = para.trim()
      // Look for sentences that sound like positioning, not boilerplate legal/cookie text
      if (
        clean.length > 40 && clean.length < 200 &&
        !/(cookie|privacy|terms|©|all rights|subscribe)/i.test(clean)
      ) {
        return clean.split(/[.!?]/)[0].trim()
      }
    }
  }
  return null
}

// 4 genuinely different email angles — different research focus, structure, and tone
function buildEmail(variation, { first, company, industry, country, tagline, services, pain, outcome, shortPain, proofStat, proofContext, signals, mirrorPhrase, stage }) {
  const svc = services[0] || ''
  const signal = signals[0] || ''
  const hasSignal = signal.length > 20

  const angles = [
    // Angle 0 — Mirror their language back
    // Research focus: their own website copy. Opens by quoting or reflecting their positioning.
    // Tone: observant, empathetic. Makes them feel seen, not sold to.
    {
      subject: `${first} — a question about how ${company} runs behind the scenes`,
      body: `Hi ${first},

${mirrorPhrase
  ? `I was reading about ${company} — "${mirrorPhrase}." That's a strong positioning.`
  : `I came across ${company} while researching ${industry} teams in ${country}${tagline ? ` — "${tagline}"` : ''}.`
}

One thing I've noticed with founders doing work like this: the ops side rarely keeps up with the ambition. ${shortPain} tend to quietly eat time that should be going into the actual work.

I recently worked with ${proofContext}. We fixed it in a few weeks — ${proofStat} back, no new tools, no new hires.

Would it be worth 20 minutes to see if something similar applies to ${company}?

Best,
Varghese`,
    },

    // Angle 1 — Signal-led (news/hiring/launch)
    // Research focus: Google signals about what's happening at the company RIGHT NOW.
    // Tone: timely, conversational. Feels like a genuine reaction to something real.
    {
      subject: hasSignal ? `Spotted something about ${company} — quick thought` : `${company}'s growth — and the ops question that usually follows`,
      body: `Hi ${first},

${hasSignal
  ? `I noticed ${signal.slice(0, 120)} — looks like things are moving at ${company}.`
  : `I've been looking at ${industry} teams in ${country} that are building something real, and ${company} came up.`
}

In my experience, that kind of momentum is exactly when the ops cracks start showing — ${shortPain} start taking longer than they should, and the team patches it manually because there's no time to fix it properly.

I help founders like you automate that layer. ${proofStat} recovered per week is typical. No new tools, no restructuring — just the existing setup connected properly.

Worth a quick call to see if it applies here?

Best,
Varghese`,
    },

    // Angle 2 — Proof-first, then bridge
    // Research focus: their industry + company stage. Opens with a concrete result, earns the connection.
    // Tone: confident, credible. No hedging. The proof does the persuading.
    {
      subject: `How ${proofStat} came back to a ${industry} founder — relevant to ${company}?`,
      body: `Hi ${first},

I recently worked with ${proofContext}.

${proofStat} came back every week. Not by hiring, not by rebuilding their tech stack — just by connecting what they already had.

${company}${svc ? ` — particularly what you're doing around ${svc}` : ''} — is at a similar stage. The same pattern almost always exists: ${shortPain} eating time that should be going into growth.

I'd love to spend 20 minutes walking you through exactly what we did and whether the same applies to you. No pitch — just a practical look.

Free any time this week?

Best,
Varghese`,
    },

    // Angle 3 — Short & direct
    // Research focus: one specific thing from their site (service or tagline). No setup, no story.
    // Tone: respects their time completely. 6 lines max.
    {
      subject: `${company} — ops question`,
      body: `Hi ${first},

I'll be brief.

${svc ? `I saw ${company} works on ${svc}.` : `I came across ${company}.`} Founders running ${industry} businesses at your stage typically lose ${proofStat} a week to ${shortPain} — usually without realising it.

I fix that. Specifically and quickly.

Worth 20 minutes to find out if it applies here?

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
  const industryData = PAIN_MAP[lead.industry] || {
    pain: 'disconnected tools and manual processes',
    outcome: 'founders reclaiming 10–15 hrs/week',
    shortPain: 'manual ops work',
    proofStat: '10+ hours a week',
    proofContext: 'a founder whose team was doing manually what their tools could have handled automatically',
  }
  const mirrorPhrase = extractMirrorPhrase(siteData)
  const stage = detectCompanyStage(signals, aboutText, tagline)
  const first = lead.first_name || lead.full_name?.split(' ')[0] || 'there'

  const { subject, body } = buildEmail(variation, {
    first, company: lead.company, industry: lead.industry,
    country: lead.country, tagline, services, signals, mirrorPhrase, stage,
    ...industryData,
  })

  let research = `COMPANY: ${lead.company}\n`
  research += `STAGE: ${stage}\n`
  research += `WHAT THEY DO: ${tagline || lead.industry}\n`
  if (mirrorPhrase) research += `THEIR WORDS: ${mirrorPhrase}\n`
  if (aboutText) research += `ABOUT: ${aboutText}\n`
  if (services.length) research += `KEY SERVICES: ${services.join(' · ')}\n`
  if (signals.length) research += `RECENT SIGNALS:\n${signals.map(s=>`  • ${s.slice(0,120)}`).join('\n')}\n`
  research += `PAIN POINT: ${industryData.pain}\n`
  research += `TYPICAL OUTCOME: ${industryData.outcome}`

  await supabase.from('leads').update({ notes: research }).eq('id', lead.id)

  return NextResponse.json({ success: true, research, subject, body, siteData, signals })
}

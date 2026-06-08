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

// 4 email angles — each written to sound like a real person dashed this off between meetings.
// Rules baked into every angle:
//   - No em dashes. Humans in email use commas, full stops, or just start a new sentence.
//   - No "I'd love to", "I hope this finds you", "just wanted to reach out"
//   - No self-congratulating subject lines ("quick thought", "worth sharing")
//   - Sentences vary in length. Some short. Some run a bit longer because that's how people actually write.
//   - The compliment (if any) has to be specific, not "that's a strong positioning"
//   - CTA is low pressure and sounds like something a person would actually say
//   - No word "leverage", "streamline", "synergy", "ops cracks", "operational drag"
//   - Sign off is just "Varghese" — no "Best," or "Kind regards" robot sign-off
function buildEmail(variation, { first, company, industry, country, tagline, services, pain, outcome, shortPain, proofStat, proofContext, signals, mirrorPhrase, stage }) {
  const svc = services[0] || ''
  const signal = signals[0] || ''
  const hasSignal = signal.length > 20

  const angles = [
    // Angle 0 — Mirror
    // Opens by referencing something real from their site, then connects it to the problem.
    // Feels like the sender actually spent 5 minutes on their website before writing.
    {
      subject: `question for you, ${first}`,
      body: `Hi ${first},

${mirrorPhrase
  ? `I was on the ${company} website earlier and read this: "${mirrorPhrase}". Got me curious about how the team is set up behind that.`
  : `Came across ${company} while looking at ${industry} businesses in ${country}${tagline ? ` and read "${tagline}"` : ''}. Spent a few minutes on the site.`
}

The reason I'm writing is I work with founders at ${industry} businesses on one specific thing: the admin and process work that quietly takes over more time than it should. Things like ${shortPain}. It's rarely obvious how much time it's taking until someone actually maps it out.

I worked with ${proofContext} recently. Got ${proofStat} back per week for them. Same tools, same team, just set up properly.

If that sounds even vaguely relevant to where ${company} is right now, happy to show you exactly what we did on a call. 20 minutes.

Varghese`,
    },

    // Angle 1 — Signal-led
    // Hooks off something happening at the company right now (hiring, launch, news).
    // Reads like a genuine observation, not a template trigger.
    {
      subject: hasSignal ? `${company} and a thought` : `saw ${company} is growing`,
      body: `Hi ${first},

${hasSignal
  ? `I came across this recently: ${signal.slice(0, 110)}. Sounds like there's a lot moving at ${company} at the moment.`
  : `I've been looking at ${industry} teams in ${country} that are growing and ${company} kept coming up.`
}

When businesses hit that kind of pace, the stuff that worked fine at half the size starts getting messy. ${shortPain} in particular tend to take two or three times longer than they should and the team just absorbs it because there's no obvious moment to stop and fix it.

I help founders sort that layer out. ${proofStat} is what I typically see come back once we've fixed it properly. No new tools, no restructuring.

Worth a 20 minute call to see if it's the same picture at ${company}?

Varghese`,
    },

    // Angle 2 — Proof first
    // Leads with a real result from a real situation, then bridges to this person.
    // No "I'd love to", no "no pitch". Just here's what happened, does it sound familiar.
    {
      subject: `something that might be relevant to ${company}`,
      body: `Hi ${first},

I was working with ${proofContext} a few months back. The problem was ${shortPain} eating up more time than anyone had properly accounted for.

We fixed it without changing their tools or hiring anyone new. ${proofStat} came back to the team every week. They'd just never had anyone sit down and connect everything properly.

I looked at ${company}${svc ? ` and what you're doing around ${svc}` : ''} and the setup looks similar. Not identical, but the same category of problem is usually there at this stage.

If you're open to it, I can walk you through what we did in about 20 minutes and you can tell me if any of it fits. No obligation either way.

Varghese`,
    },

    // Angle 3 — Short and direct
    // 6 lines. No story, no proof, no setup. Just a direct human ask.
    // Reads like a founder who respects that the other person is also busy.
    {
      subject: `${first} at ${company}`,
      body: `Hi ${first},

${svc ? `Came across ${company} and had a look at what you're doing around ${svc}.` : `Came across ${company} and had a quick look at the site.`}

I help ${industry} founders get back the time that goes into ${shortPain}. Usually ${proofStat} a week once it's sorted. No new software, no big project.

Would it be worth a 20 minute chat to see if there's something here?

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

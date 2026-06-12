import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { scoreEmail, scorePersonalisation } from '@/lib/email-evaluator'
import { refineEmail } from '@/lib/email-rewriter'

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
    // Subject: just their first name. Nothing else. Most personal subject line possible.
    // Body: opens with something specific from their site, then asks a real question.
    // Does NOT open with "I work with..." — that's a cold email tell.
    {
      subject: `${first}`,
      body: `Hi ${first},

${mirrorPhrase
  ? `I was reading through the ${company} site earlier and came across this: "${mirrorPhrase}".`
  : `Had a look through the ${company} site earlier.${tagline ? ` "${tagline}" caught my attention.` : ''}`
}

Curious how much of your week actually goes into the work behind that versus the admin and process stuff that builds up around it. Things like ${shortPain}. Most founders I speak to don't realise how much time it's taking until someone maps it out.

I've been helping a few ${industry} businesses sort this out. The last one got ${proofStat} back without changing anything they use or hiring anyone new.

Anyway, if it's something you think about, happy to show you what that looked like. Would take about 20 minutes.

Varghese`,
    },

    // Angle 1 — Signal-led
    // Subject: references the company only, no promise, no hook word.
    // Body: opens with the signal (hiring/launch/news) as context, not as a sales trigger.
    {
      subject: `${company}`,
      body: `Hi ${first},

${hasSignal
  ? `I came across this about ${company} recently: ${signal.slice(0, 100)}. Sounds like a busy period.`
  : `I've been looking at a few ${industry} businesses in ${country} and ${company} came up a couple of times.`
}

The reason I'm writing is that when things are moving fast, the back-end stuff, ${shortPain}, tends to pile up quietly. Teams patch it as they go because there's never a good moment to stop and fix it properly.

I help founders deal with exactly that. Not a big consultancy project, just someone who comes in, looks at what's actually eating time, and fixes it. Usually ${proofStat} comes back per week.

Is that something that's on your radar at the moment?

Varghese`,
    },

    // Angle 2 — Proof first
    // Subject: reads like a normal email between two people who've spoken before.
    // Body: tells a real story first, then makes the connection. No "similar to you" framing.
    {
      subject: `thought this might be relevant`,
      body: `Hi ${first},

A few months back I was working with ${proofContext}. Nobody had really sat down and looked at where the time was going. When we did, most of it was disappearing into ${shortPain}.

We fixed it without changing their tools or bringing anyone new in. They got ${proofStat} back every week from that point.

I had a look at ${company}${svc ? ` and the work you're doing around ${svc}` : ''} and it looks like a similar picture. Could be wrong but thought it was worth asking.

If you've got 20 minutes I can walk you through what we did and you can tell me if any of it sounds familiar.

Varghese`,
    },

    // Angle 3 — Short and direct
    // Subject: their name and company, reads like a calendar invite or internal email.
    // Body: 4 sentences. No setup. Respects that they're busy.
    {
      subject: `${first} / ${company}`,
      body: `Hi ${first},

${svc ? `Had a look at ${company} and the work you do around ${svc}.` : `Had a look at ${company}.`}

I help ${industry} founders deal with the time that goes into ${shortPain}. It's usually more than people realise and it's fixable without any big changes.

Got 20 minutes to find out if it's the same story here?

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

  const raw = buildEmail(variation, {
    first, company: lead.company, industry: lead.industry,
    country: lead.country, tagline, services, signals, mirrorPhrase, stage,
    ...industryData,
  })

  // Run through the refinement agent — score, flag AI tells, rewrite if needed
  const leadData = { first, company: lead.company, industry: lead.industry, country: lead.country }
  const refined = refineEmail(raw.subject, raw.body, leadData, siteData, signals)
  const { subject, body, aiScore, personalisationScore, grade, problems, wordCount } = refined

  // Save performance record
  const supabaseClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  try {
    await supabaseClient.from('email_performance').insert({
      lead_id: lead.id,
      sequence_step: 1,
      subject,
      body,
      ai_score: aiScore,
      personalisation_score: personalisationScore,
      angle_number: variation,
      industry: lead.industry,
      country: lead.country,
    })
  } catch {} // table may not exist yet — non-blocking

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

  return NextResponse.json({
    success: true, research, subject, body, siteData, signals,
    // Score data for UI badge
    aiScore, personalisationScore, grade, problems, wordCount,
  })
}

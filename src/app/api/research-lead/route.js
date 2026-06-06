import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Industry-specific pain points Varghese solves
const PAIN_POINTS = {
  'Marketing Agency': [
    'manually pulling reports from 5+ different platforms every week',
    'spending hours on client onboarding and contract admin instead of actual strategy',
    'losing track of deliverables across multiple client accounts',
    'billing and invoicing eating up half a day each month',
  ],
  'SaaS': [
    'customer onboarding is still mostly manual and inconsistent',
    'support tickets pile up because there\'s no smart routing or auto-resolution',
    'churn goes unnoticed until it\'s too late because there\'s no proactive tracking',
    'ops and billing reconciliation done manually in spreadsheets',
  ],
  'SaaS/ERP': [
    'implementation processes are still too manual for a lean team',
    'customer success is reactive rather than proactive',
    'internal ops like invoicing and reporting take too much manual effort',
  ],
  'SaaS/CRM': [
    'sales reps waste time on data entry instead of selling',
    'follow-up sequences are inconsistent and manual',
    'reporting takes hours to compile across different data sources',
  ],
  'Consulting': [
    'proposal creation takes days when it should take hours',
    'project tracking is scattered across emails and spreadsheets',
    'billing and time-tracking is a constant headache',
    'client reporting is manual and time-consuming',
  ],
  'E-commerce SaaS': [
    'customer service volume is overwhelming the small team',
    'returns and refund processing is entirely manual',
    'cross-platform data reconciliation is done in spreadsheets',
  ],
  'Ecommerce': [
    'order management and fulfilment coordination is manual',
    'customer support tickets pile up with no smart routing',
    'inventory reconciliation across channels is a spreadsheet nightmare',
  ],
  'HR Tech': [
    'candidate screening is still mostly manual',
    'interview scheduling back-and-forth wastes hours',
    'onboarding new hires involves too many manual steps',
  ],
  'Media/Marketing': [
    'content calendar management is scattered across tools',
    'client reporting is manually assembled every month',
    'project handoffs between team members get lost',
  ],
  'SaaS/AI': [
    'internal ops don\'t match the AI-first approach they sell',
    'customer onboarding and success workflows are still manual',
    'the team is stretched thin and needs ops automation to scale',
  ],
}

const DEFAULT_PAIN_POINTS = [
  'managing operations manually across too many disconnected tools',
  'spending founder time on admin when it should go to growth',
  'reporting and client communication taking too long each week',
]

// What Varghese does — specific outcomes
const VALUE_PROPS = [
  { stat: '$60,000+', what: 'saved annually by automating their reporting and ops workflows' },
  { stat: '15 hours/week', what: 'freed up for a marketing agency by automating client onboarding' },
  { stat: '3x faster', what: 'proposal turnaround after automating their document workflows' },
  { stat: '40% reduction', what: 'in support ticket volume after implementing smart auto-routing' },
]

async function scrapeCompany(website) {
  if (!website) return { title: '', description: '', tagline: '' }
  try {
    const url = website.startsWith('http') ? website : `https://${website}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
      signal: AbortSignal.timeout(6000),
    })
    const html = await res.text()

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descMatch  = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
                    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
    const h1Match    = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)
    const ogDescMatch= html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)

    return {
      title:       (titleMatch?.[1] || '').replace(/\s+/g,' ').trim().slice(0,120),
      description: (descMatch?.[1] || ogDescMatch?.[1] || '').replace(/\s+/g,' ').trim().slice(0,300),
      tagline:     (h1Match?.[1] || '').replace(/\s+/g,' ').trim().slice(0,120),
    }
  } catch {
    return { title:'', description:'', tagline:'' }
  }
}

function buildResearch(lead, siteData) {
  const pains = PAIN_POINTS[lead.industry] || DEFAULT_PAIN_POINTS
  const topPain = pains[0]
  const secondPain = pains[1] || pains[0]

  let whatTheyDo = ''
  if (siteData.description) {
    whatTheyDo = siteData.description
  } else if (siteData.tagline) {
    whatTheyDo = siteData.tagline
  } else {
    whatTheyDo = `${lead.company} is a ${lead.industry} company based in ${lead.country}.`
  }

  const prop = VALUE_PROPS[Math.floor(Math.random() * VALUE_PROPS.length)]
  const firstName = lead.first_name || lead.full_name?.split(' ')[0] || 'there'

  const research = `COMPANY: ${lead.company}
WHAT THEY DO: ${whatTheyDo}
WEBSITE TITLE: ${siteData.title || 'N/A'}
INDUSTRY: ${lead.industry} | COUNTRY: ${lead.country}
CONTACT: ${lead.full_name} — ${lead.title}

WHY THEY'RE A GOOD FIT FOR VARGHESE:
${lead.company} is a ${lead.industry} business — exactly the kind of founder-led team Varghese specialises in. As a ${lead.title}, ${firstName} is likely spending significant time ${topPain}. Additionally, teams at this stage often struggle with ${secondPain}. These are exactly the operational bottlenecks Varghese eliminates through AI-powered process automation.

OPPORTUNITY:
Varghese has helped similar ${lead.industry} businesses save ${prop.stat} ${prop.what}. ${lead.company} is at the right size (founder-led, growing) to get maximum ROI from ops automation — before hiring more people to do manual work.

KEY PAIN POINTS TO REFERENCE IN EMAIL:
1. ${topPain}
2. ${secondPain}

PERSONALISATION HOOKS:
- They are in ${lead.country} — same target market Varghese serves
- ${lead.title} level contact — decision maker, no need to go through layers
- Industry fit: ${lead.industry} businesses have predictable ops bottlenecks Varghese has solved before`

  return { research, firstName, whatTheyDo, topPain, secondPain, prop }
}

function buildEmail(lead, { firstName, whatTheyDo, topPain, secondPain, prop }) {
  const subject = `Quick question about ${lead.company}'s operations, ${firstName}`

  const body = `Hi ${firstName},

I came across ${lead.company} and I was genuinely impressed — ${whatTheyDo.slice(0, 120)}${whatTheyDo.length > 120 ? '...' : ''}

I work with ${lead.industry} founders to eliminate the operational drag that slows growth — specifically things like ${topPain}, and ${secondPain}.

Most founders I speak to are spending 10–20 hours a week on things that could run automatically. That's time not going into strategy, sales, or product.

I recently helped a similar business save ${prop.stat} ${prop.what} — without hiring more people or switching their existing tools.

I'd love to share exactly how we did it, in a 20-minute call. No pitch, just a look at where the quick wins are for ${lead.company} specifically.

Would any time this week or next work for you?

Best,
Varghese Antony
Founder, Blendery Tech Solutions
blendery.tech`

  return { subject, body }
}

export async function POST(req) {
  const { lead } = await req.json()
  if (!lead) return NextResponse.json({ error: 'No lead provided' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // 1. Scrape company website
  const siteData = await scrapeCompany(lead.website)

  // 2. Build research notes
  const { research, firstName, whatTheyDo, topPain, secondPain, prop } =
    buildResearch(lead, siteData)

  // 3. Build personalized email
  const { subject, body } = buildEmail(lead, { firstName, whatTheyDo, topPain, secondPain, prop })

  // 4. Save to leads notes column
  await supabase.from('leads').update({ notes: research }).eq('id', lead.id)

  return NextResponse.json({ success: true, research, subject, body, siteData })
}

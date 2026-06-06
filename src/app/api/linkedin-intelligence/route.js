import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Keywords relevant to Varghese's consulting offer
const RELEVANT_KEYWORDS = ['automation', 'operations', 'efficiency', 'process', 'scale', 'growth', 'AI', 'workflow', 'tools', 'systems']

// Try to fetch LinkedIn company page and extract recent post info
async function scrapeLinkedInPosts(linkedinUrl) {
  if (!linkedinUrl) return []
  try {
    const companySlug = linkedinUrl.replace(/.*\/company\//, '').replace(/\/$/, '')
    const res = await fetch(`https://www.linkedin.com/company/${companySlug}/posts/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(6000),
    })
    const html = await res.text()
    // Extract any post-like content
    const matches = html.match(/"commentary":\{"text":"([^"]{30,300})"/g) || []
    return matches.slice(0, 3).map(m => {
      const text = m.replace(/"commentary":\{"text":"/, '').replace(/"$/, '')
      return decodeURIComponent(text.replace(/\\u([\dA-Fa-f]{4})/g, (_, p) => String.fromCharCode(parseInt(p, 16))))
    })
  } catch { return [] }
}

// Search Google for LinkedIn posts related to this company
async function searchGoogleForPosts(companyName, industry) {
  const query = `site:linkedin.com "${companyName}" (automation OR operations OR efficiency OR AI OR workflow)`
  const encoded = encodeURIComponent(query)
  try {
    const res = await fetch(`https://www.google.com/search?q=${encoded}&num=5`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(6000),
    })
    const html = await res.text()
    // Extract LinkedIn URLs from Google results
    const urlMatches = html.match(/https:\/\/www\.linkedin\.com\/[^"&\s]{10,150}/g) || []
    const unique = [...new Set(urlMatches)].filter(u =>
      u.includes('/posts/') || u.includes('/in/') || u.includes('/pulse/')
    )
    return unique.slice(0, 5)
  } catch { return [] }
}

// Generate connection request note (LinkedIn limit: 300 chars)
function buildConnectionNote(lead, whatTheyDo) {
  const first = lead.first_name || lead.full_name?.split(' ')[0] || 'there'
  const note = `Hi ${first}, I came across ${lead.company} and was impressed by what you're building in the ${lead.industry} space. I work with founders on ops automation — would love to connect and share some ideas that might be useful for your team.`
  return note.slice(0, 300)
}

// Generate LinkedIn DM (short, conversational)
function buildLinkedInDM(lead, whatTheyDo, topPain, relevantPost) {
  const first = lead.first_name || lead.full_name?.split(' ')[0] || 'there'
  const postRef = relevantPost
    ? `I saw your post about ${relevantPost.slice(0, 60)}... — that's exactly the kind of challenge I help founders solve.`
    : `I've been looking at what ${lead.company} is doing and I see a real opportunity to help.`

  return `Hi ${first},

Thanks for connecting!

${postRef}

I specialise in helping ${lead.industry} founders eliminate the ops drag that slows growth — things like ${topPain}.

I've helped similar businesses save 10–15 hours a week without adding headcount.

Would you be open to a quick 15-min call this week? Happy to share what I've seen work for companies at your stage.

Best,
Varghese`
}

const PAIN_POINTS = {
  'Marketing Agency':  'manual reporting and client onboarding overhead',
  'SaaS':             'manual customer onboarding and churn tracking',
  'Consulting':        'proposal creation and project tracking',
  'E-commerce SaaS':  'customer service volume and returns processing',
  'Ecommerce':        'order management and inventory reconciliation',
  'HR Tech':          'candidate screening and interview scheduling',
  'Media/Marketing':  'content calendar management and client reporting',
}
const DEFAULT_PAIN = 'disconnected tools and manual processes'

export async function POST(req) {
  const { lead } = await req.json()
  if (!lead) return NextResponse.json({ error: 'No lead' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const topPain = PAIN_POINTS[lead.industry] || DEFAULT_PAIN

  // 1. Search for posts (parallel)
  const companyLinkedIn = lead.linkedin_url?.includes('/company/') ? lead.linkedin_url : null
  const [linkedinPosts, googlePostLinks] = await Promise.all([
    scrapeLinkedInPosts(companyLinkedIn),
    searchGoogleForPosts(lead.company, lead.industry),
  ])

  // 2. Scrape company website for what they do
  let whatTheyDo = `${lead.company} is a ${lead.industry} company in ${lead.country}`
  if (lead.website) {
    try {
      const url = lead.website.startsWith('http') ? lead.website : `https://${lead.website}`
      const res = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0' }, signal: AbortSignal.timeout(5000) })
      const html = await res.text()
      const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{20,200})["']/i)
              || html.match(/<meta[^>]+content=["']([^"']{20,200})["'][^>]+name=["']description["']/i)
      if (desc?.[1]) whatTheyDo = desc[1].trim()
    } catch {}
  }

  const topPost = linkedinPosts[0] || ''
  const connectionNote = buildConnectionNote(lead, whatTheyDo)
  const dmMessage = buildLinkedInDM(lead, whatTheyDo, topPain, topPost)

  // 3. Build smart search URLs
  const companyName = encodeURIComponent(lead.company)
  const searchUrls = {
    companyPosts:  `https://www.linkedin.com/search/results/content/?keywords=${companyName}&origin=SWITCH_SEARCH_VERTICAL`,
    teamPosts:     `https://www.google.com/search?q=site:linkedin.com+${companyName}+(automation+OR+operations+OR+AI+OR+efficiency)`,
    founderProfile: lead.linkedin_url || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.full_name + ' ' + lead.company)}`,
  }

  return NextResponse.json({
    success: true,
    linkedinPosts,
    googlePostLinks,
    connectionNote,
    dmMessage,
    whatTheyDo,
    searchUrls,
    topPain,
  })
}

export async function PATCH(req) {
  // Update linkedin status
  const { leadId, status } = await req.json()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { error } = await supabase.from('leads').update({ linkedin_status: status }).eq('id', leadId)
  return NextResponse.json({ success: !error, error: error?.message })
}

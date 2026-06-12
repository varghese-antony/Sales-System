import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PAIN_MAP, DEFAULT_PAIN } from '@/lib/pain-map'

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

// Connection request note — LinkedIn limit is 300 chars so this has to be tight.
// Rule: no "impressed by", no "would love to connect", no "share some ideas".
// Those phrases are in every single connection request. They get ignored.
// Sound like a real person who actually looked at their profile for 2 minutes.
function buildConnectionNote(lead, whatTheyDo) {
  const first = lead.first_name || lead.full_name?.split(' ')[0] || ''
  const greeting = first ? `Hi ${first}` : 'Hi'

  // Keep it genuinely short — under 200 chars is better than padding to 300
  const note = `${greeting}, came across ${lead.company} and spent a few minutes reading about what you do. I work with ${lead.industry} founders on the ops side of things. Thought it was worth connecting.`
  return note.slice(0, 300)
}

// LinkedIn DM — sent after they accept the connection request.
// Rules:
//   - Do NOT start with "Thanks for connecting!" — every bot and salesperson says this
//   - No "I specialise in", no "ops drag", no "at your stage"
//   - If there's a real post to reference, use it. If not, keep it short and direct.
//   - No sign-off with "Best," — just the name
//   - The whole thing should read like a message you'd send a contact you met at an event
function buildLinkedInDM(lead, whatTheyDo, topPain, relevantPost) {
  const first = lead.first_name || lead.full_name?.split(' ')[0] || 'there'

  if (relevantPost && relevantPost.length > 20) {
    // If we have a real post to reference, open with that — most personal version
    return `Hi ${first},

Saw your post about ${relevantPost.slice(0, 80).trim()} and it reminded me of something I ran into with another ${lead.industry} founder a few months back.

They were losing a chunk of time every week to ${topPain}. We sorted it without changing any of their tools. Got ${lead.industry === 'Marketing Agency' ? '14 hours' : lead.industry === 'Consulting' ? '2 days a month' : '10+ hours'} back.

Wondering if any of that sounds familiar at ${lead.company}. Happy to share what we did if useful.

Varghese`
  }

  // No post available — short and direct, no filler
  return `Hi ${first},

I work with ${lead.industry} founders on a pretty specific problem: the time that quietly disappears into ${topPain} every week.

Had a look at ${lead.company} and thought it was worth asking. Is that something that takes up much of your time right now?

Varghese`
}

// PAIN_POINTS replaced by shared PAIN_MAP from @/lib/pain-map

export async function POST(req) {
  const { lead } = await req.json()
  if (!lead) return NextResponse.json({ error: 'No lead' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const painData = PAIN_MAP[lead.industry] || DEFAULT_PAIN
  const topPain = painData.shortPain || painData.pain

  // 1. Search for posts — LinkedIn blocks scraping (always returns []), so skip it.
  //    Only run the Google search which actually yields results.
  const [googlePostLinks] = await Promise.all([
    searchGoogleForPosts(lead.company, lead.industry),
  ])
  const linkedinPosts = []

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
  // Valid statuses: 'pending' | 'requested' | 'connected' | 'dm_sent' | 'replied' | 'not_found'
  const { leadId, status, note } = await req.json()
  const VALID = ['pending', 'requested', 'connected', 'dm_sent', 'replied', 'not_found']
  if (!leadId || !VALID.includes(status)) {
    return NextResponse.json({ success: false, error: 'Invalid leadId or status' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const updateData = { linkedin_status: status }
  const now = new Date().toISOString()

  if (status === 'requested') updateData.linkedin_requested_at = now
  if (status === 'dm_sent') updateData.linkedin_dm_sent_at = now
  if (status === 'replied') updateData.linkedin_replied_at = now
  // Optionally store a short note (e.g. what DM was sent)
  if (note) updateData.linkedin_note = note

  const { error } = await supabase.from('leads').update(updateData).eq('id', leadId)
  return NextResponse.json({ success: !error, error: error?.message })
}

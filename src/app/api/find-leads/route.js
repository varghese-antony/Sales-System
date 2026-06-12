import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Target companies — founder-led, 10-50 people, US/UK/Australia/UAE
// List is shuffled each run so each daily call tries a different subset.
// Already-imported companies are skipped via isDuplicate check.
// When all are imported, new ones should be added here quarterly.
const TARGET_COMPANIES = [
  // ── Marketing & Creative Agencies ──
  { domain: 'brafton.com',           name: 'Brafton',              country: 'United States', industry: 'Marketing Agency', size: '51-100' },
  { domain: 'ironpaper.com',         name: 'Ironpaper',            country: 'United States', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'directom.com',          name: 'Directom',             country: 'United States', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'growandconvert.com',    name: 'Grow and Convert',     country: 'United States', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'singlegrain.com',       name: 'Single Grain',         country: 'United States', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'webprofits.com.au',     name: 'Web Profits',          country: 'Australia',     industry: 'Marketing Agency', size: '10-50' },
  { domain: 'brightlocal.com',       name: 'BrightLocal',          country: 'United Kingdom', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'koozai.com',            name: 'Koozai',               country: 'United Kingdom', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'vericogroup.com',       name: 'Verico',               country: 'United Kingdom', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'articulate.co.uk',      name: 'Articulate Marketing', country: 'United Kingdom', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'polygon.com.au',        name: 'Polygon',              country: 'Australia',     industry: 'Marketing Agency', size: '10-50' },
  { domain: 'soap.com.au',           name: 'Soap Creative',        country: 'Australia',     industry: 'Marketing Agency', size: '10-50' },
  { domain: 'amplifieddigital.com.au', name: 'Amplified Digital',  country: 'Australia',     industry: 'Marketing Agency', size: '10-50' },
  { domain: 'digitas.com',           name: 'Digitas',              country: 'United States', industry: 'Marketing Agency', size: '51-100' },
  { domain: 'velocity.com',          name: 'Velocity',             country: 'United Kingdom', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'contentbridge.io',      name: 'Content Bridge',       country: 'United States', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'ahrefs.com',            name: 'Ahrefs',               country: 'United States', industry: 'SaaS',            size: '51-100' },
  // ── SaaS & Tech ──
  { domain: 'baremetrics.com',       name: 'Baremetrics',          country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'close.com',             name: 'Close CRM',            country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'helpscout.com',         name: 'Help Scout',           country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'groove.co',             name: 'Groove',               country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'lemlist.com',           name: 'Lemlist',              country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'hunter.io',             name: 'Hunter',               country: 'France',        industry: 'SaaS',            size: '10-50' },
  { domain: 'reply.io',              name: 'Reply.io',             country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'instantly.ai',          name: 'Instantly',            country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'apollo.io',             name: 'Apollo',               country: 'United States', industry: 'SaaS',            size: '51-100' },
  { domain: 'woodpecker.co',         name: 'Woodpecker',           country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'chargebee.com',         name: 'Chargebee',            country: 'United States', industry: 'SaaS',            size: '51-100' },
  { domain: 'churnzero.com',         name: 'ChurnZero',            country: 'United States', industry: 'SaaS',            size: '51-100' },
  { domain: 'gainsight.com',         name: 'Gainsight',            country: 'United States', industry: 'SaaS',            size: '51-100' },
  { domain: 'proposify.com',         name: 'Proposify',            country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'pandadoc.com',          name: 'PandaDoc',             country: 'United States', industry: 'SaaS',            size: '51-100' },
  { domain: 'getaccept.com',         name: 'GetAccept',            country: 'United States', industry: 'SaaS',            size: '10-50' },
  { domain: 'juro.com',              name: 'Juro',                 country: 'United Kingdom', industry: 'Legal Tech SaaS', size: '10-50' },
  { domain: 'legl.com',              name: 'Legl',                 country: 'United Kingdom', industry: 'Legal Tech SaaS', size: '10-50' },
  { domain: 'clio.com',              name: 'Clio',                 country: 'United States', industry: 'Legal Tech SaaS', size: '51-100' },
  { domain: 'hubdoc.com',            name: 'Hubdoc',               country: 'Canada',        industry: 'FinTech',         size: '10-50' },
  { domain: 'fathom.finance',        name: 'Fathom',               country: 'Australia',     industry: 'FinTech',         size: '10-50' },
  { domain: 'float.com',             name: 'Float',                country: 'United Kingdom', industry: 'FinTech',        size: '10-50' },
  { domain: 'pleo.io',               name: 'Pleo',                 country: 'United Kingdom', industry: 'FinTech',        size: '51-100' },
  { domain: 'spendesk.com',          name: 'Spendesk',             country: 'France',        industry: 'FinTech',         size: '51-100' },
  { domain: 'unleashed.com',         name: 'Unleashed Software',   country: 'Australia',     industry: 'SaaS',            size: '10-50' },
  { domain: 'tanda.co',              name: 'Tanda',                country: 'Australia',     industry: 'HR Tech',         size: '10-50' },
  { domain: 'deputy.com',            name: 'Deputy',               country: 'Australia',     industry: 'HR Tech',         size: '51-100' },
  { domain: 'workforce.com',         name: 'Workforce.com',        country: 'Australia',     industry: 'HR Tech',         size: '10-50' },
  { domain: 'zelt.app',              name: 'Zelt',                 country: 'United Kingdom', industry: 'HR Tech',        size: '10-50' },
  { domain: 'charlie.hr',            name: 'Charlie HR',           country: 'United Kingdom', industry: 'HR Tech',        size: '10-50' },
  { domain: 'humi.ca',               name: 'Humi',                 country: 'Canada',        industry: 'HR Tech',         size: '10-50' },
  { domain: 'planday.com',           name: 'Planday',              country: 'United Kingdom', industry: 'HR Tech',        size: '10-50' },
  { domain: 'homerun.co',            name: 'Homerun',              country: 'Netherlands',   industry: 'HR Tech',         size: '10-50' },
  // ── Consulting & Professional Services ──
  { domain: 'processunity.com',      name: 'ProcessUnity',         country: 'United States', industry: 'Consulting',      size: '10-50' },
  { domain: 'smartkarrot.com',       name: 'SmartKarrot',          country: 'United States', industry: 'Consulting',      size: '10-50' },
  { domain: 'operationsagency.com',  name: 'Operations Agency',    country: 'United Kingdom', industry: 'Consulting',     size: '10-50' },
  { domain: 'scaleops.io',           name: 'ScaleOps',             country: 'United States', industry: 'Consulting',      size: '10-50' },
  { domain: 'cobloom.com',           name: 'Cobloom',              country: 'United Kingdom', industry: 'Consulting',     size: '10-50' },
  { domain: 'brighthr.com',          name: 'BrightHR',             country: 'United Kingdom', industry: 'Consulting',     size: '51-100' },
  { domain: 'systemsltd.com',        name: 'Systems Ltd',          country: 'UAE',           industry: 'Consulting',      size: '51-100' },
  { domain: 'innovaccer.com',        name: 'Innovaccer',           country: 'United States', industry: 'Consulting',      size: '51-100' },
  { domain: 'sixpivot.com.au',       name: 'Six Pivot',            country: 'Australia',     industry: 'Consulting',      size: '10-50' },
  { domain: 'readify.net',           name: 'Readify',              country: 'Australia',     industry: 'Consulting',      size: '51-100' },
  { domain: 'smsltd.co.uk',          name: 'SMS Ltd',              country: 'United Kingdom', industry: 'Consulting',     size: '10-50' },
  { domain: 'digitalbridge.com',     name: 'Digital Bridge',       country: 'United Kingdom', industry: 'Consulting',     size: '10-50' },
  // ── E-commerce & Retail Tech ──
  { domain: 'recartapp.com',         name: 'Recart',               country: 'United States', industry: 'E-commerce',      size: '10-50' },
  { domain: 'gorgias.com',           name: 'Gorgias',              country: 'United States', industry: 'E-commerce',      size: '10-50' },
  { domain: 'klaviyo.com',           name: 'Klaviyo',              country: 'United States', industry: 'E-commerce',      size: '51-100' },
  { domain: 'okendo.io',             name: 'Okendo',               country: 'Australia',     industry: 'E-commerce',      size: '10-50' },
  { domain: 'brightpearl.com',       name: 'Brightpearl',          country: 'United Kingdom', industry: 'E-commerce',     size: '10-50' },
  { domain: 'linnworks.com',         name: 'Linnworks',            country: 'United Kingdom', industry: 'E-commerce',     size: '10-50' },
  { domain: 'veeqo.com',             name: 'Veeqo',                country: 'United Kingdom', industry: 'E-commerce',     size: '10-50' },
  { domain: 'mintsoft.com',          name: 'Mintsoft',             country: 'United Kingdom', industry: 'E-commerce',     size: '10-50' },
  { domain: 'skubana.com',           name: 'Skubana',              country: 'United States', industry: 'E-commerce',      size: '10-50' },
  { domain: 'tradegecko.com',        name: 'TradeGecko',           country: 'Australia',     industry: 'E-commerce',      size: '10-50' },
  // ── Recruitment & Staffing ──
  { domain: 'vincere.io',            name: 'Vincere',              country: 'United Kingdom', industry: 'Recruitment',    size: '10-50' },
  { domain: 'workable.com',          name: 'Workable',             country: 'United States', industry: 'Recruitment',     size: '51-100' },
  { domain: 'teamtailor.com',        name: 'Teamtailor',           country: 'United Kingdom', industry: 'Recruitment',    size: '10-50' },
  { domain: 'broadbean.com',         name: 'Broadbean',            country: 'United Kingdom', industry: 'Recruitment',    size: '10-50' },
  { domain: 'jobadder.com',          name: 'JobAdder',             country: 'Australia',     industry: 'Recruitment',     size: '10-50' },
  { domain: 'fasttrack.tech',        name: 'FastTrack',            country: 'Australia',     industry: 'Recruitment',     size: '10-50' },
  { domain: 'talent.com',            name: 'Talent.com',           country: 'Canada',        industry: 'Recruitment',     size: '51-100' },
  { domain: 'hirequest.com',         name: 'HireQuest',            country: 'United States', industry: 'Recruitment',     size: '51-100' },
  // ── PropTech ──
  { domain: 'landinsight.io',        name: 'LandInsight',          country: 'United Kingdom', industry: 'PropTech SaaS',  size: '10-50' },
  { domain: 'residently.com',        name: 'Residently',           country: 'United Kingdom', industry: 'PropTech SaaS',  size: '10-50' },
  { domain: 'reapit.com',            name: 'Reapit',               country: 'United Kingdom', industry: 'PropTech SaaS',  size: '51-100' },
  { domain: 'inspection.express',    name: 'Inspection Express',   country: 'Australia',     industry: 'PropTech SaaS',   size: '10-50' },
  { domain: 'agentbox.com.au',       name: 'Agentbox',             country: 'Australia',     industry: 'PropTech SaaS',   size: '10-50' },
  { domain: 'domustech.ae',          name: 'Domus Tech',           country: 'UAE',           industry: 'PropTech SaaS',   size: '10-50' },
  // ── UAE / GCC ──
  { domain: 'bayt.com',              name: 'Bayt.com',             country: 'UAE',           industry: 'Recruitment',     size: '51-100' },
  { domain: 'dubizzle.com',          name: 'Dubizzle',             country: 'UAE',           industry: 'E-commerce',      size: '51-100' },
  { domain: 'fetchr.us',             name: 'Fetchr',               country: 'UAE',           industry: 'SaaS',            size: '51-100' },
  { domain: 'mamo.ae',               name: 'Mamo Pay',             country: 'UAE',           industry: 'FinTech',         size: '10-50' },
  { domain: 'lean.finance',          name: 'Lean Technologies',    country: 'UAE',           industry: 'FinTech',         size: '10-50' },
  { domain: 'ziina.com',             name: 'Ziina',                country: 'UAE',           industry: 'FinTech',         size: '10-50' },
  { domain: 'nowpay.cash',           name: 'NowPay',               country: 'UAE',           industry: 'FinTech',         size: '10-50' },
  { domain: 'wio.io',                name: 'Wio Bank',             country: 'UAE',           industry: 'FinTech',         size: '10-50' },
  { domain: 'tarabut.com',           name: 'Tarabut Gateway',      country: 'UAE',           industry: 'FinTech',         size: '10-50' },
  { domain: 'meydan.ae',             name: 'Meydan Technology',    country: 'UAE',           industry: 'Consulting',      size: '10-50' },
]

// Shuffle array in place (Fisher-Yates)
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Max companies to process per run — keeps execution within Vercel time limits
const MAX_PER_RUN = 25

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  try {
    let saved = 0

    // Fetch ALL existing leads upfront (1 query) instead of 2 queries per company (40 queries)
    const { data: existingLeads } = await supabase
      .from('leads').select('email, full_name, company').limit(2000)
    const existingEmails = new Set((existingLeads || []).map(l => l.email?.toLowerCase()).filter(Boolean))
    const existingNames = new Set((existingLeads || []).map(l =>
      `${l.full_name?.toLowerCase()}||${l.company?.toLowerCase()}`
    ).filter(Boolean))

    const isDuplicate = ({ email, full_name, company }) => {
      if (email && existingEmails.has(email.toLowerCase())) return true
      if (full_name && company &&
        existingNames.has(`${full_name.toLowerCase()}||${company.toLowerCase()}`)) return true
      return false
    }

    // Shuffle so each daily run tries a different subset of the list.
    // Companies already in DB get skipped by isDuplicate — over many runs all are covered.
    const shuffled = shuffle([...TARGET_COMPANIES]).slice(0, MAX_PER_RUN)

    for (const company of shuffled) {
      try {
        const hunterRes = await fetch(
          `https://api.hunter.io/v2/domain-search?domain=${company.domain}&api_key=${process.env.HUNTER_API_KEY}&limit=3&type=personal`,
        )
        const hunterData = await hunterRes.json()
        const emails = hunterData.data?.emails || []

        if (emails.length > 0) {
          const senior = emails.find(e => {
            const pos = (e.position || '').toLowerCase()
            return pos.includes('founder') || pos.includes('ceo') || pos.includes('owner') || pos.includes('director') || pos.includes('head')
          }) || emails[0]

          const full_name = `${senior.first_name || ''} ${senior.last_name || ''}`.trim() || company.name
          const companyName = hunterData.data?.organization || company.name

          if (isDuplicate({ email: senior.value, full_name, company: companyName })) continue

          const score = scoreLead({ title: senior.position, industry: company.industry, country: company.country })
          const lead = {
            first_name: senior.first_name || '',
            last_name: senior.last_name || '',
            full_name,
            title: senior.position || 'Executive',
            company: companyName,
            company_size: company.size,
            industry: company.industry,
            country: company.country,
            email: senior.value,
            email_verified: (senior.confidence || 0) > 75,
            website: `https://${company.domain}`,
            source: 'hunter',
            score: score.value,
            score_reason: score.reason,
            status: 'new',
          }
          const { error } = await supabase.from('leads').insert(lead)
          if (!error) saved++
        } else {
          const full_name = `${company.name} – Founder/CEO`
          if (isDuplicate({ full_name, company: company.name })) continue

          const score = scoreLead({ title: 'CEO', industry: company.industry, country: company.country })
          const lead = {
            full_name,
            company: company.name,
            company_size: company.size,
            industry: company.industry,
            country: company.country,
            website: `https://${company.domain}`,
            source: 'curated',
            score: score.value,
            score_reason: score.reason + ' (find email manually)',
            status: 'new',
          }
          const { error } = await supabase.from('leads').insert(lead)
          if (!error) saved++
        }
      } catch (_) {}

      await new Promise(r => setTimeout(r, 200))
    }

    return NextResponse.json({ success: true, count: saved })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message })
  }
}

function scoreLead({ title = '', industry = '', country = '' }) {
  let score = 5
  let reasons = []
  const t = title.toLowerCase()
  const ind = industry.toLowerCase()

  if (t.includes('founder') || t.includes('ceo') || t.includes('owner')) { score += 2; reasons.push('Decision maker') }
  else if (t.includes('director') || t.includes('head')) { score += 1; reasons.push('Senior role') }

  if (ind.includes('agency') || ind.includes('saas') || ind.includes('software') || ind.includes('consulting')) {
    score += 2; reasons.push('Perfect industry fit')
  }

  if (['United States', 'United Kingdom', 'Australia', 'Canada'].includes(country)) {
    score += 1; reasons.push('Target region')
  }

  return { value: Math.min(score, 10), reason: reasons.join(' · ') || 'Curated target' }
}

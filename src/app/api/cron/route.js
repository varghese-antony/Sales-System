import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Vercel calls this every day at 8am UTC
// It auto-finds new leads and logs the daily run

const TARGET_COMPANIES = [
  // Marketing & Creative Agencies — US
  { domain: 'brafton.com',          name: 'Brafton',             country: 'United States', industry: 'Marketing Agency' },
  { domain: 'ironpaper.com',        name: 'Ironpaper',           country: 'United States', industry: 'Marketing Agency' },
  { domain: 'directom.com',         name: 'Directom',            country: 'United States', industry: 'Marketing Agency' },
  { domain: 'growandconvert.com',   name: 'Grow and Convert',    country: 'United States', industry: 'Marketing Agency' },
  { domain: 'singlegrain.com',      name: 'Single Grain',        country: 'United States', industry: 'Marketing Agency' },
  { domain: 'venveo.com',           name: 'Venveo',              country: 'United States', industry: 'Marketing Agency' },
  { domain: 'disruptiveadvertising.com', name: 'Disruptive Advertising', country: 'United States', industry: 'Marketing Agency' },
  { domain: 'webmechanix.com',      name: 'WebMechanix',         country: 'United States', industry: 'Marketing Agency' },
  { domain: 'lean-labs.com',        name: 'Lean Labs',           country: 'United States', industry: 'Marketing Agency' },
  { domain: 'jumpfactor.com',       name: 'Jumpfactor',          country: 'United States', industry: 'Marketing Agency' },
  // Marketing & Creative Agencies — UK
  { domain: 'brightlocal.com',      name: 'BrightLocal',         country: 'United Kingdom', industry: 'Marketing Agency' },
  { domain: 'koozai.com',           name: 'Koozai',              country: 'United Kingdom', industry: 'Marketing Agency' },
  { domain: 'impression.co.uk',     name: 'Impression',          country: 'United Kingdom', industry: 'Marketing Agency' },
  { domain: 'kota.co.uk',           name: 'Kota',                country: 'United Kingdom', industry: 'Marketing Agency' },
  { domain: 'propellernet.co.uk',   name: 'Propellernet',        country: 'United Kingdom', industry: 'Marketing Agency' },
  // Marketing & Creative Agencies — Australia
  { domain: 'webprofits.com.au',    name: 'Web Profits',         country: 'Australia', industry: 'Marketing Agency' },
  { domain: 'clearance.com.au',     name: 'Clearance',           country: 'Australia', industry: 'Marketing Agency' },
  { domain: 'uploaddigital.com.au', name: 'Upload Digital',      country: 'Australia', industry: 'Marketing Agency' },
  { domain: 'digitalagency.com.au', name: 'Digital Agency',      country: 'Australia', industry: 'Marketing Agency' },
  { domain: 'bambrick.com.au',      name: 'Bambrick',            country: 'Australia', industry: 'Marketing Agency' },
  // SaaS — US
  { domain: 'baremetrics.com',      name: 'Baremetrics',         country: 'United States', industry: 'SaaS' },
  { domain: 'close.com',            name: 'Close',               country: 'United States', industry: 'SaaS' },
  { domain: 'helpscout.com',        name: 'Help Scout',          country: 'United States', industry: 'SaaS' },
  { domain: 'groove.co',            name: 'Groove',              country: 'United States', industry: 'SaaS' },
  { domain: 'lemlist.com',          name: 'Lemlist',             country: 'United States', industry: 'SaaS' },
  { domain: 'loom.com',             name: 'Loom',                country: 'United States', industry: 'SaaS' },
  { domain: 'notion.so',            name: 'Notion',              country: 'United States', industry: 'SaaS' },
  { domain: 'coda.io',              name: 'Coda',                country: 'United States', industry: 'SaaS' },
  { domain: 'airtable.com',         name: 'Airtable',            country: 'United States', industry: 'SaaS' },
  { domain: 'clickup.com',          name: 'ClickUp',             country: 'United States', industry: 'SaaS' },
  // SaaS — UK
  { domain: 'accuranker.com',       name: 'AccuRanker',          country: 'United Kingdom', industry: 'SaaS' },
  { domain: 'cognism.com',          name: 'Cognism',             country: 'United Kingdom', industry: 'SaaS' },
  { domain: 'chargebee.com',        name: 'Chargebee',           country: 'United Kingdom', industry: 'SaaS' },
  // Consulting & Ops — US
  { domain: 'processunity.com',     name: 'ProcessUnity',        country: 'United States', industry: 'Consulting' },
  { domain: 'smartkarrot.com',      name: 'SmartKarrot',         country: 'United States', industry: 'Consulting' },
  { domain: 'scaleops.io',          name: 'ScaleOps',            country: 'United States', industry: 'Consulting' },
  { domain: 'operationshub.com',    name: 'Operations Hub',      country: 'United States', industry: 'Consulting' },
  { domain: 'scalepath.co',         name: 'ScalePath',           country: 'United States', industry: 'Consulting' },
  // Consulting — UK
  { domain: 'operationsagency.com', name: 'Operations Agency',   country: 'United Kingdom', industry: 'Consulting' },
  { domain: 'scaleup.co.uk',        name: 'ScaleUp',             country: 'United Kingdom', industry: 'Consulting' },
  // E-commerce & DTC
  { domain: 'recartapp.com',        name: 'Recart',              country: 'United States', industry: 'E-commerce SaaS' },
  { domain: 'gorgias.com',          name: 'Gorgias',             country: 'United States', industry: 'E-commerce SaaS' },
  { domain: 'privy.com',            name: 'Privy',               country: 'United States', industry: 'E-commerce SaaS' },
  { domain: 'klaviyo.com',          name: 'Klaviyo',             country: 'United States', industry: 'E-commerce SaaS' },
  // Recruitment & HR Tech
  { domain: 'workable.com',         name: 'Workable',            country: 'United States', industry: 'HR Tech' },
  { domain: 'teamtailor.com',       name: 'Teamtailor',          country: 'United States', industry: 'HR Tech' },
  // PropTech / Legal / Finance
  { domain: 'clio.com',             name: 'Clio',                country: 'United States', industry: 'Legal Tech SaaS' },
  { domain: 'buildium.com',         name: 'Buildium',            country: 'United States', industry: 'PropTech SaaS' },
]

export async function GET(request) {
  // Verify this is called by Vercel Cron (security check)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const runDate = new Date().toISOString().split('T')[0]
  let added = 0
  let skipped = 0

  for (const company of TARGET_COMPANIES) {
    try {
      const hunterRes = await fetch(
        `https://api.hunter.io/v2/domain-search?domain=${company.domain}&api_key=${process.env.HUNTER_API_KEY}&limit=3&type=personal`
      )
      const hunterData = await hunterRes.json()
      const emails = hunterData.data?.emails || []

      if (emails.length > 0) {
        const senior = emails.find(e => {
          const pos = (e.position || '').toLowerCase()
          return pos.includes('founder') || pos.includes('ceo') || pos.includes('owner') || pos.includes('director') || pos.includes('head')
        }) || emails[0]

        const score = scoreLead({ title: senior.position, industry: company.industry, country: company.country })
        const lead = {
          first_name: senior.first_name || '',
          last_name: senior.last_name || '',
          full_name: `${senior.first_name || ''} ${senior.last_name || ''}`.trim() || company.name,
          title: senior.position || 'Executive',
          company: hunterData.data?.organization || company.name,
          industry: company.industry,
          country: company.country,
          email: senior.value,
          email_verified: (senior.confidence || 0) > 75,
          website: `https://${company.domain}`,
          source: 'cron-daily',
          score: score.value,
          score_reason: score.reason,
          status: 'new',
        }
        const { error } = await supabase.from('leads').upsert(lead, { onConflict: 'email', ignoreDuplicates: true })
        if (!error) added++
        else skipped++
      }
    } catch (_) { skipped++ }

    await new Promise(r => setTimeout(r, 300))
  }

  // Log the daily run to Supabase
  await supabase.from('daily_runs').insert({
    run_date: runDate,
    leads_added: added,
    leads_skipped: skipped,
    total_companies_searched: TARGET_COMPANIES.length,
  }).select()

  return NextResponse.json({ success: true, date: runDate, added, skipped })
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

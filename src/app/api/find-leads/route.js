import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Target companies - founder-led, 10-50 people, US/UK/Australia
// These are realistic targets for Varghese's ops automation service
const TARGET_COMPANIES = [
  // Marketing & Creative Agencies
  { domain: 'brafton.com', name: 'Brafton', country: 'United States', industry: 'Marketing Agency', size: '51-100' },
  { domain: 'ironpaper.com', name: 'Ironpaper', country: 'United States', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'directom.com', name: 'Directom', country: 'United States', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'growandconvert.com', name: 'Grow and Convert', country: 'United States', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'singlegrain.com', name: 'Single Grain', country: 'United States', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'webprofits.com.au', name: 'Web Profits', country: 'Australia', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'brightlocal.com', name: 'BrightLocal', country: 'United Kingdom', industry: 'Marketing Agency', size: '10-50' },
  { domain: 'koozai.com', name: 'Koozai', country: 'United Kingdom', industry: 'Marketing Agency', size: '10-50' },
  // SaaS & Tech
  { domain: 'baremetrics.com', name: 'Baremetrics', country: 'United States', industry: 'SaaS', size: '10-50' },
  { domain: 'close.com', name: 'Close', country: 'United States', industry: 'SaaS/CRM', size: '10-50' },
  { domain: 'helpscout.com', name: 'Help Scout', country: 'United States', industry: 'SaaS', size: '10-50' },
  { domain: 'groove.co', name: 'Groove', country: 'United States', industry: 'SaaS', size: '10-50' },
  { domain: 'lemlist.com', name: 'Lemlist', country: 'United States', industry: 'SaaS', size: '10-50' },
  { domain: 'hunter.io', name: 'Hunter', country: 'France', industry: 'SaaS', size: '10-50' },
  // Consulting & Professional Services
  { domain: 'processunity.com', name: 'ProcessUnity', country: 'United States', industry: 'Consulting', size: '10-50' },
  { domain: 'smartkarrot.com', name: 'SmartKarrot', country: 'United States', industry: 'SaaS/Consulting', size: '10-50' },
  { domain: 'operationsagency.com', name: 'Operations Agency', country: 'United Kingdom', industry: 'Consulting', size: '10-50' },
  { domain: 'scaleops.io', name: 'ScaleOps', country: 'United States', industry: 'Consulting', size: '10-50' },
  // E-commerce & DTC
  { domain: 'recartapp.com', name: 'Recart', country: 'United States', industry: 'SaaS/Ecommerce', size: '10-50' },
  { domain: 'gorgias.com', name: 'Gorgias', country: 'United States', industry: 'SaaS', size: '10-50' },
]

// Check if lead already exists by email OR by name+company
async function isDuplicate(supabase, { email, full_name, company }) {
  if (email) {
    const { data } = await supabase.from('leads').select('id').eq('email', email).limit(1)
    if (data?.length) return true
  }
  const { data } = await supabase.from('leads').select('id')
    .ilike('full_name', full_name).ilike('company', company).limit(1)
  return !!data?.length
}

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  try {
    let saved = 0

    for (const company of TARGET_COMPANIES) {
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

          if (await isDuplicate(supabase, { email: senior.value, full_name, company: companyName })) continue

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
          if (await isDuplicate(supabase, { full_name, company: company.name })) continue

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

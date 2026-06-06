import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST() {
  try {
    // Search Apollo for founder-led businesses - Varghese's ideal clients
    const apolloRes = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.APOLLO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        titles: ['CEO', 'Founder', 'Co-Founder', 'Managing Director', 'Owner'],
        person_locations: ['United States', 'United Kingdom', 'Australia', 'Canada'],
        organization_num_employees_ranges: ['11,50', '51,100'],
        per_page: 10,
        page: 1,
      }),
    })

    const apolloData = await apolloRes.json()
    const people = apolloData.people || []

    if (people.length === 0) {
      return NextResponse.json({ success: false, error: 'No leads found from Apollo' })
    }

    let saved = 0
    for (const person of people) {
      // Score each lead based on fit for Varghese's service
      const score = scoreLead(person)

      const lead = {
        first_name: person.first_name,
        last_name: person.last_name,
        full_name: person.name,
        title: person.title,
        company: person.organization?.name,
        company_size: person.organization?.estimated_num_employees?.toString(),
        industry: person.organization?.industry,
        country: person.country,
        city: person.city,
        email: person.email,
        email_verified: person.email_status === 'verified',
        linkedin_url: person.linkedin_url,
        website: person.organization?.website_url,
        source: 'apollo',
        score: score.value,
        score_reason: score.reason,
        status: 'new',
      }

      // Save to Supabase (skip duplicates by email)
      if (lead.email) {
        const { error } = await supabase.from('leads').upsert(lead, { onConflict: 'email', ignoreDuplicates: true })
        if (!error) saved++
      } else {
        const { error } = await supabase.from('leads').insert(lead)
        if (!error) saved++
      }
    }

    return NextResponse.json({ success: true, count: saved })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message })
  }
}

function scoreLead(person) {
  let score = 5
  let reasons = []

  const title = (person.title || '').toLowerCase()
  const industry = (person.organization?.industry || '').toLowerCase()
  const size = person.organization?.estimated_num_employees || 0

  // Title scoring
  if (title.includes('founder') || title.includes('ceo') || title.includes('owner')) {
    score += 2; reasons.push('Decision maker')
  }

  // Company size scoring (10-50 is Varghese's sweet spot)
  if (size >= 10 && size <= 50) {
    score += 2; reasons.push('Ideal team size (10-50)')
  } else if (size >= 51 && size <= 100) {
    score += 1; reasons.push('Good team size (51-100)')
  }

  // Industry scoring (agencies and tech companies need ops help)
  if (industry.includes('marketing') || industry.includes('agency') || industry.includes('software') || industry.includes('saas')) {
    score += 1; reasons.push('High-value industry')
  }

  score = Math.min(score, 10)
  return { value: score, reason: reasons.join(', ') || 'Standard lead' }
}

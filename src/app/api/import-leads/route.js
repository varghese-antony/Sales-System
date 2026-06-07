import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function extractDomain(url) {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '').toLowerCase()
  } catch { return null }
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV split (handles quoted fields)
    const cols = []
    let current = ''
    let inQuote = false
    for (const ch of lines[i]) {
      if (ch === '"') {
        inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        cols.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    cols.push(current.trim())

    const row = {}
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] || '').replace(/^"|"$/g, '').trim()
    })
    rows.push(row)
  }
  return rows
}

// Map common CSV column names to our fields
function mapRow(row) {
  const get = (...keys) => {
    for (const k of keys) {
      const val = row[k] || row[k.toLowerCase()] || row[k.toUpperCase()]
      if (val) return val
    }
    return null
  }

  const fullName = get('full_name', 'name', 'contact', 'contact name', 'person')
  const firstName = fullName ? fullName.split(' ')[0] : get('first_name', 'firstname', 'first name')

  return {
    company:     get('company', 'company name', 'business', 'organisation', 'organization'),
    website:     get('website', 'url', 'web', 'company url', 'website url'),
    country:     get('country', 'location', 'region'),
    industry:    get('industry', 'sector', 'category', 'service'),
    full_name:   fullName,
    first_name:  firstName,
    email:       get('email', 'email address', 'contact email'),
    linkedin_url:get('linkedin', 'linkedin url', 'linkedin_url'),
    status:      'new',
    notes:       'Source: CSV Import',
    source:      'csv',
    score:       5,
  }
}

export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  let csvText = ''
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }
    csvText = await file.text()
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to read file' }, { status: 400 })
  }

  const rows = parseCSV(csvText)
  if (rows.length === 0) {
    return NextResponse.json({ success: false, error: 'No data found in CSV' }, { status: 400 })
  }

  // Load existing domains for deduplication
  const { data: existingLeads } = await supabase
    .from('leads')
    .select('website, email')

  const existingDomains = new Set(
    (existingLeads || []).map(l => extractDomain(l.website)).filter(Boolean)
  )
  const existingEmails = new Set(
    (existingLeads || []).map(l => l.email?.toLowerCase()).filter(Boolean)
  )

  let added = 0
  let skipped = 0

  for (const row of rows) {
    const lead = mapRow(row)

    // Skip if no company name
    if (!lead.company) { skipped++; continue }

    // Deduplicate by website domain or email
    const domain = extractDomain(lead.website)
    if (domain && existingDomains.has(domain)) { skipped++; continue }
    if (lead.email && existingEmails.has(lead.email.toLowerCase())) { skipped++; continue }

    const { error } = await supabase.from('leads').insert(lead)
    if (!error) {
      added++
      if (domain) existingDomains.add(domain)
      if (lead.email) existingEmails.add(lead.email.toLowerCase())
    } else {
      skipped++
    }
  }

  return NextResponse.json({ success: true, added, skipped, total: rows.length })
}

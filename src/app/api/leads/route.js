import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Leads CRUD API ────────────────────────────────────────────────────────────
// Replaces browser-side supabase.from('leads') calls in leads/page.js and
// smart-outreach/page.js. Uses service role key — anon key denied by RLS.
//
// GET  /api/leads                      — fetch all leads (with sequence status)
// PATCH /api/leads                     — update a lead (status, email, etc.)

export async function GET(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get('id')

  // Single lead fetch (for smart-outreach detail panel)
  if (leadId) {
    const [leadRes, outreachRes, seqRes] = await Promise.all([
      supabase.from('leads').select('*').eq('id', leadId).single(),
      supabase.from('outreach').select('*').eq('lead_id', leadId).order('created_at', { ascending: true }),
      supabase.from('sequences').select('*').eq('lead_id', leadId).order('created_at', { ascending: true }),
    ])
    return NextResponse.json({
      success: true,
      lead: leadRes.data,
      outreach: outreachRes.data || [],
      sequences: seqRes.data || [],
    })
  }

  // All leads list
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id,full_name,first_name,last_name,company,email,website,title,industry,country,score,score_reason,status,notes,linkedin_url,linkedin_status,linkedin_requested_at,linkedin_dm_sent_at,created_at')
    .order('score', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch sequence IDs (for "has sequence" indicator)
  const { data: seqs } = await supabase
    .from('sequences')
    .select('lead_id, step, complete, replied')

  const seqMap = {}
  for (const s of (seqs || [])) {
    if (!seqMap[s.lead_id] || s.step > seqMap[s.lead_id].step) seqMap[s.lead_id] = s
  }

  const enriched = (leads || []).map(l => ({ ...l, sequence: seqMap[l.id] || null }))
  return NextResponse.json({ success: true, leads: enriched })
}

export async function PATCH(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const body = await request.json()
  const { leadId, ...updates } = body

  if (!leadId) return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })

  // Whitelist updatable fields — never allow arbitrary column writes
  const ALLOWED = ['status', 'email', 'notes', 'score', 'title', 'linkedin_status', 'linkedin_note']
  const safeUpdates = Object.fromEntries(
    Object.entries(updates).filter(([k]) => ALLOWED.includes(k))
  )

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { error } = await supabase.from('leads').update(safeUpdates).eq('id', leadId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// POST /api/leads — insert outreach record (replaces browser-side outreach.insert)
export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { leadId, type, subject, message, status = 'draft' } = await request.json()
  if (!leadId || !type) return NextResponse.json({ error: 'Missing leadId or type' }, { status: 400 })

  const { error } = await supabase.from('outreach').insert({ lead_id: leadId, type, subject, message, status })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

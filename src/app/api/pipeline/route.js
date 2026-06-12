import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Pipeline API ──────────────────────────────────────────────────────────────
// GET  /api/pipeline         — fetch all leads with sequence/sequence data
// POST /api/pipeline/move    — move a lead to a new status

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, full_name, first_name, company, email, industry, country, status, score, created_at, notes')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach sequence info — step number + last_sent_at
  const leadIds = (leads || []).map(l => l.id)
  let seqMap = {}
  if (leadIds.length > 0) {
    const { data: seqs } = await supabase
      .from('sequences')
      .select('lead_id, step, complete, replied, last_sent_at, next_due_at')
      .in('lead_id', leadIds)

    for (const s of (seqs || [])) {
      // Only keep the most recent (highest step) sequence per lead
      if (!seqMap[s.lead_id] || s.step > seqMap[s.lead_id].step) {
        seqMap[s.lead_id] = s
      }
    }
  }

  const enriched = (leads || []).map(l => ({
    ...l,
    sequence: seqMap[l.id] || null,
  }))

  return NextResponse.json({ success: true, leads: enriched })
}

export async function POST(req) {
  const { leadId, status } = await req.json()
  const VALID = ['new', 'contacted', 'interested', 'proposal', 'client', 'unsubscribed']
  if (!leadId || !VALID.includes(status)) {
    return NextResponse.json({ error: 'Invalid leadId or status' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

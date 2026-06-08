import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mark a lead as already manually emailed — creates a sequence record
// so the follow-up cron (day 3, day 7) picks it up automatically.
export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { leadId, subject } = await request.json()
  if (!leadId) return NextResponse.json({ success: false, error: 'leadId required' }, { status: 400 })

  // Check lead exists
  const { data: lead } = await supabase
    .from('leads')
    .select('id, full_name, company, status')
    .eq('id', leadId)
    .single()

  if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 })

  // Check if already has an active sequence
  const { data: existing } = await supabase
    .from('sequences')
    .select('id')
    .eq('lead_id', leadId)
    .eq('complete', false)
    .eq('replied', false)
    .single()

  if (existing) {
    return NextResponse.json({ success: false, error: 'Already in a follow-up sequence' })
  }

  const now = new Date()
  // Set next follow-up due in 3 days from now
  const nextDue = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Create sequence at step 1 — follow-up cron will fire on day 3
  const { error: seqErr } = await supabase.from('sequences').insert({
    lead_id: leadId,
    angle_number: 2,       // assume proof-first was sent
    step: 1,
    last_sent_at: now.toISOString(),
    next_due_at: nextDue.toISOString(),
    original_subject: subject || `Follow up`,
    original_message_id: null, // no message ID since sent outside system
    replied: false,
    complete: false,
  })

  if (seqErr) return NextResponse.json({ success: false, error: seqErr.message }, { status: 500 })

  // Update lead status to contacted
  await supabase.from('leads').update({ status: 'contacted' }).eq('id', leadId)

  return NextResponse.json({
    success: true,
    message: `${lead.company} marked as emailed — follow-up will fire in 3 days`,
    nextFollowUp: nextDue.toISOString(),
  })
}

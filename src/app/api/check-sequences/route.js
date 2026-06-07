import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Called by Vercel cron daily — auto-sends overdue follow-ups
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Find all overdue active sequences
  const { data: dueSeqs, error } = await supabase
    .from('sequences')
    .select('*, leads(id, full_name, first_name, email)')
    .lte('next_due_at', new Date().toISOString())
    .eq('complete', false)
    .eq('replied', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!dueSeqs?.length) return NextResponse.json({ success: true, sent: 0, checked: 0 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sales-system-blendery.vercel.app'
  let sent = 0

  for (const seq of dueSeqs) {
    const lead = seq.leads
    if (!lead?.email) continue

    try {
      const res = await fetch(`${appUrl}/api/send-followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({
          sequenceId: seq.id,
          leadId: lead.id,
          to: lead.email,
          firstName: lead.first_name || lead.full_name?.split(' ')[0] || 'there',
          originalSubject: seq.original_subject,
          originalMessageId: seq.original_message_id,
        }),
      })
      const result = await res.json()
      if (result.success) sent++
    } catch {}

    // Delay between sends to avoid SMTP rate limits
    await new Promise(r => setTimeout(r, 800))
  }

  return NextResponse.json({ success: true, sent, checked: dueSeqs.length })
}

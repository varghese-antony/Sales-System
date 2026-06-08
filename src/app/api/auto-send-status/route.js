import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getDailyLimit(startDateStr) {
  const start = new Date(startDateStr)
  const daysSince = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince < 14) return 20
  if (daysSince < 28) return 40
  return 60
}

function getPhase(startDateStr) {
  const start = new Date(startDateStr)
  const daysSince = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince < 14) return `Warm-up (day ${daysSince + 1} of 14)`
  if (daysSince < 28) return `Building (day ${daysSince + 1} of 28)`
  return 'Full speed'
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Load settings
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['auto_send_enabled', 'auto_send_start_date'])

  const map = Object.fromEntries((settings || []).map(s => [s.key, s.value]))
  const enabled = map['auto_send_enabled'] === 'true'
  const startDate = map['auto_send_start_date'] || new Date().toISOString()
  const dailyLimit = getDailyLimit(startDate)
  const phase = getPhase(startDate)

  // Emails sent today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: sentToday } = await supabase
    .from('sequences')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())

  // Total emails sent all time
  const { count: totalSent } = await supabase
    .from('sequences')
    .select('*', { count: 'exact', head: true })

  // Queue — uncontacted leads with emails
  const { data: contactedSeqs } = await supabase
    .from('sequences')
    .select('lead_id')
  const contactedIds = new Set((contactedSeqs || []).map(s => s.lead_id))

  const { data: queueLeads } = await supabase
    .from('leads')
    .select('id')
    .eq('status', 'new')
    .not('email', 'is', null)
  const queueSize = (queueLeads || []).filter(l => !contactedIds.has(l.id)).length

  // Last send time
  const { data: lastSeq } = await supabase
    .from('sequences')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
  const lastSentAt = lastSeq?.[0]?.created_at || null

  return NextResponse.json({
    enabled,
    dailyLimit,
    sentToday: sentToday || 0,
    remaining: Math.max(0, dailyLimit - (sentToday || 0)),
    queueSize,
    totalSent: totalSent || 0,
    phase,
    lastSentAt,
  })
}

// Toggle auto-send on/off
export async function POST(request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { enabled } = await request.json()

  await supabase
    .from('settings')
    .upsert({ key: 'auto_send_enabled', value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() })

  // If turning on for the first time, set start date
  if (enabled) {
    const { data: existing } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'auto_send_start_date')
      .single()

    if (!existing?.value) {
      await supabase.from('settings').upsert({
        key: 'auto_send_start_date',
        value: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ success: true, enabled })
}

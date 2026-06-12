import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Dashboard stats API ───────────────────────────────────────────────────────
// Replaces direct browser-side supabase.from('leads') + supabase.from('daily_runs')
// calls in dashboard/page.js. Uses service role key — anon key is denied by RLS.

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const [leadsResult, runsResult, sequencesResult, errorsResult] = await Promise.all([
    supabase.from('leads').select('id, status, score, country, industry, created_at').order('score', { ascending: false }),
    supabase.from('settings').select('key, value, updated_at').in('key', ['last_daily_run']),
    supabase.from('sequences').select('id, complete, replied, step, created_at').order('created_at', { ascending: false }).limit(200),
    supabase.from('system_errors').select('id, route, message, created_at').order('created_at', { ascending: false }).limit(20),
  ])

  return NextResponse.json({
    success: true,
    leads: leadsResult.data || [],
    settings: Object.fromEntries((runsResult.data || []).map(s => [s.key, s.value])),
    sequences: sequencesResult.data || [],
    recentErrors: errorsResult.data || [],
  })
}

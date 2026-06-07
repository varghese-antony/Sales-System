import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/sequences — returns all sequences with lead info
export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { data, error } = await supabase
    .from('sequences')
    .select('*, leads(id, full_name, first_name, company, email, country, linkedin_url)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, sequences: data || [] })
}

// PATCH /api/sequences — mark a sequence as replied (removes from active)
export async function PATCH(req) {
  const { sequenceId } = await req.json()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  const { error } = await supabase
    .from('sequences')
    .update({ replied: true, reply_at: new Date().toISOString(), complete: true })
    .eq('id', sequenceId)

  return NextResponse.json({ success: !error, error: error?.message })
}

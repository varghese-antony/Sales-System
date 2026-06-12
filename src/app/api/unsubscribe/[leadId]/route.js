import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── Unsubscribe endpoint ──────────────────────────────────────────────────────
// Called when a recipient clicks the unsubscribe link at the bottom of every email.
// MUST remain public — email clients do not send auth headers.
// Uses the lead ID directly (link is inside a personal email, not guessable).
//
// On click:
//   1. Sets leads.status = 'unsubscribed'
//   2. Marks all active sequences for this lead as complete (stops follow-ups)
//   3. Returns a plain HTML confirmation page (no redirect needed)

export async function GET(request, { params }) {
  const { leadId } = await params
  if (!leadId) {
    return new NextResponse('Missing lead ID', { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // 1. Mark lead as unsubscribed
  const { error: leadErr } = await supabase
    .from('leads')
    .update({ status: 'unsubscribed' })
    .eq('id', leadId)

  if (leadErr) {
    console.error('Unsubscribe lead update failed:', leadErr.message)
  }

  // 2. Close all open sequences for this lead — stop any pending follow-ups
  const { error: seqErr } = await supabase
    .from('sequences')
    .update({ complete: true })
    .eq('lead_id', leadId)
    .eq('complete', false)

  if (seqErr) {
    console.error('Unsubscribe sequence close failed:', seqErr.message)
  }

  // 3. Return a friendly confirmation page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Unsubscribed</title>
</head>
<body style="margin:0;padding:60px 24px;background:#f9fafb;font-family:Arial,sans-serif;text-align:center;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:48px 40px;border:1px solid #e5e7eb;">
    <div style="font-size:40px;margin-bottom:16px;">✅</div>
    <h1 style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px;">You've been unsubscribed</h1>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0 0 24px;">
      You won't receive any more emails from Varghese at Blendery Tech Solutions.
      This usually takes effect immediately.
    </p>
    <p style="font-size:12px;color:#999;margin:0;">
      If you unsubscribed by mistake, reply directly to any email you received and we'll sort it out.
    </p>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

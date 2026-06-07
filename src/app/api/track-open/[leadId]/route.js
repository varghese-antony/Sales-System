import { createClient } from '@supabase/supabase-js'

// 1x1 transparent GIF — the tracking pixel
const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

export async function GET(request, { params }) {
  const { leadId } = await params

  // Log the open — only record first open, ignore repeats
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    const now = new Date().toISOString()

    // Update sequence — only if not already opened
    await supabase
      .from('sequences')
      .update({ opened_at: now })
      .eq('lead_id', leadId)
      .is('opened_at', null)
      .eq('complete', false)
      .eq('replied', false)

  } catch {}

  // Always return the pixel image — even if DB update fails
  return new Response(PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}

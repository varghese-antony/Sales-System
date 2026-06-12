import { NextResponse } from 'next/server'

// ─── API Route Protection ──────────────────────────────────────────────────────
// Protects server-to-server routes that trigger mass actions (email sends,
// bulk enrichment, cron jobs). These should never be callable anonymously.
//
// Routes protected (require Bearer CRON_SECRET):
//   /api/daily-runner    — triggers all follow-ups + new emails
//   /api/enrich-batch    — bulk lead enrichment
//   /api/auto-send       — sends initial outreach emails automatically
//   /api/sync-sent       — syncs Hostinger sent folder
//   /api/cron            — generic cron handler (if used)
//
// Routes always open (no auth required):
//   /api/track-open/*    — pixel must be public (email clients can't send tokens)
//   Everything else      — UI-facing routes called from the Next.js browser app

const PROTECTED_ROUTES = [
  '/api/daily-runner',
  '/api/enrich-batch',
  '/api/auto-send',
  '/api/sync-sent',
  '/api/cron',
]

const ALWAYS_OPEN = [
  '/api/track-open',
]

export function middleware(request) {
  const { pathname } = request.nextUrl

  // Pixel routes are always public
  if (ALWAYS_OPEN.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Check protected routes
  if (PROTECTED_ROUTES.some(p => pathname.startsWith(p))) {
    const auth = request.headers.get('authorization') || ''
    const secret = process.env.CRON_SECRET

    if (!secret || auth !== `Bearer ${secret}`) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}

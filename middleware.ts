import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Simple in-memory cache for user profiles with TTL
const profileCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function middleware(request: NextRequest) {
  // Only protect admin dashboard routes
  if (!request.nextUrl.pathname.startsWith('/admin-dashboard')) {
    return NextResponse.next()
  }

  const startTime = Date.now()
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get session using server client instead of middleware client
  const { createServerClient } = await import('@supabase/ssr')
  const supabase = createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  try {
    // Get the session
    const { data: { session } } = await supabase.auth.getSession()

    // If no session, redirect to login with redirect param
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check cache first
    const baseCacheKey = session.user.id
    let cacheKey = baseCacheKey
    let cached = profileCache.get(cacheKey)
    let profile

    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      profile = cached.data
    } else {
      // Get user profile to check admin status
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', session.user.id)
        .single()

      profile = profileData

      cacheKey = `${baseCacheKey}-${profile?.user_type ?? 'unknown'}`
      cached = profileCache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        profile = cached.data
      } else {
        profileCache.set(cacheKey, {
          data: profile,
          timestamp: Date.now()
        })
      }

      // Ensure older cache entries without role suffix are cleaned
      profileCache.delete(baseCacheKey)

      // Clean up old cache entries periodically
      if (profileCache.size > 100) {
        const cutoff = Date.now() - CACHE_TTL
        for (const [key, value] of Array.from(profileCache.entries())) {
          if (value.timestamp < cutoff) {
            profileCache.delete(key)
          }
        }
      }
    }

    const userRole = profile?.user_type

    // If not admin tier, redirect to unauthorized page with attempted URL
    if (!profile || !['admin', 'super_admin'].includes(userRole)) {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      unauthorizedUrl.searchParams.set('attempted', request.nextUrl.pathname)
      unauthorizedUrl.searchParams.set('reason', 'admin-required')
      return NextResponse.redirect(unauthorizedUrl)
    }

    // Additional protection for super-admin-only routes
    if (request.nextUrl.pathname === '/admin-dashboard/manage-customers'
      || request.nextUrl.pathname.startsWith('/admin-dashboard/manage-customers/')) {
      console.log('Manage-customers access check - User role:', userRole, 'Path:', request.nextUrl.pathname);
      if (userRole !== 'super_admin') {
        console.log('Redirecting non-super-admin from manage-customers to homepage');
        // Redirect regular admins to homepage instead of unauthorized page
        return NextResponse.redirect(new URL('/', request.url))
      }
      console.log('Super admin access granted to manage-customers');
    }

    // Add performance timing header
    const duration = Date.now() - startTime
    response.headers.set('X-Response-Time', `${duration}ms`)
    response.headers.set('X-Auth-Status', 'authorized')
    response.headers.set('X-User-Role', userRole ?? 'unknown')

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    
    // Check if it's an auth error (no session) or other error
    const errorMessage = error?.message || ''
    
    if (errorMessage.includes('session') || errorMessage.includes('auth')) {
      // Authentication error - redirect to login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // For other errors, redirect to login as fallback
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}

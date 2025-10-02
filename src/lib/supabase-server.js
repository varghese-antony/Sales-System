import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const DEFAULT_AUTH = {
  autoRefreshToken: false,
  persistSession: false,
}

// Server-side Supabase client for middleware and server components
export async function createServerSupabaseClient(cookieStore = cookies()) {
  // Try to use SSR package if available, fallback to regular client
  try {
    const { createServerClient } = await import('@supabase/ssr')

    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: DEFAULT_AUTH,
    })
  } catch (error) {
    // Fallback to regular client if SSR package is not available
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: DEFAULT_AUTH,
    })
  }
}

// Direct server client for server-side operations without cookies
export function createDirectServerClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side operations')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: DEFAULT_AUTH,
  })
}

// Client-side client (re-export for convenience)
export { createClient } from '@supabase/supabase-js'

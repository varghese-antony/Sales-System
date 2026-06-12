// ─── Silent Error Logger ──────────────────────────────────────────────────────
// Replaces bare `catch {}` in critical paths. Writes to system_errors table
// so qa-health CHECK 16 can surface them in alert emails.
//
// Usage:
//   import { logError } from '@/lib/log-error'
//   try {
//     await supabase.from('sequences').update(...)
//   } catch (err) {
//     await logError('send-email', 'sequence-update-failed', err, { leadId })
//   }
//
// If system_errors table doesn't exist yet, logError silently does nothing
// (safe to call anywhere before the migration is run).

import { createClient } from '@supabase/supabase-js'

export async function logError(source, type, err, context = {}) {
  const message = err?.message || String(err) || 'unknown error'
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    await supabase.from('system_errors').insert({
      source,
      type,
      message,
      context,
    })
  } catch {
    // Never let error logging crash the caller — swallow silently
    console.error(`[logError] ${source} / ${type}: ${message}`)
  }
}

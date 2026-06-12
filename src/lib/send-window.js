// ─── Timezone-aware send window ────────────────────────────────────────────────
// The Vercel cron (daily-runner) fires at 13:00 UTC every day.
// Effective inbox time per country when cron fires at 13:00 UTC:
//
//   United Kingdom  UTC+0   →  1:00pm  ✅ business hours
//   United States   UTC-5   →  8:00am  ✅ morning
//   Canada          UTC-5   →  8:00am  ✅ morning
//   UAE             UTC+4   →  5:00pm  ✅ end of day
//   India           UTC+5.5 →  6:30pm  ✅ end of day
//   Germany/France  UTC+1   →  2:00pm  ✅ afternoon
//   Australia AEST  UTC+10  → 11:00pm  ⚠️  late (seen next morning — acceptable)
//   Singapore       UTC+8   →  9:00pm  ⚠️  evening
//
// Note: a single daily cron cannot achieve 9am for every timezone simultaneously.
// Changing from 06:00 UTC to 13:00 UTC fixes the US problem (was 1am EST, now 8am EST)
// while keeping UK, UAE, and EU within business hours.
// Australia/Singapore are late-evening — recipients see the email first thing next morning.
// If a second cron slot is available in future, add one at 22:00 UTC for AU/SG.

const COUNTRY_UTC_OFFSETS = {
  'United Kingdom':       0,
  'Ireland':              0,
  'Portugal':             0,
  'United States':       -5,   // EST — largest US business hub
  'Canada':              -5,
  'Mexico':              -6,
  'UAE':                  4,
  'United Arab Emirates': 4,
  'Saudi Arabia':         3,
  'India':                5.5,
  'Germany':              1,
  'France':               1,
  'Netherlands':          1,
  'Belgium':              1,
  'Switzerland':          1,
  'Sweden':               1,
  'Denmark':              1,
  'Norway':               1,
  'Spain':                1,
  'Italy':                1,
  'Poland':               1,
  'Austria':              1,
  'Australia':           10,   // AEST
  'New Zealand':         12,
  'Singapore':            8,
  'Malaysia':             8,
  'Hong Kong':            8,
  'Japan':                9,
  'South Africa':         2,
  'Kenya':                3,
  'Nigeria':              1,
}

/**
 * Returns the effective local hour when the cron fires (13:00 UTC).
 * Useful for logging / summary email to show Varghese when each lead got their email.
 */
export function effectiveLocalHour(country) {
  const offset = COUNTRY_UTC_OFFSETS[country] ?? 0
  return ((13 + offset) % 24 + 24) % 24 // wrap negative to 0-23
}

/**
 * Returns a UTC ISO string for next_due_at, N days from now.
 * Set to 12:00 UTC so the 13:00 UTC daily cron reliably catches it on the right day.
 *
 * The daysAhead parameter controls the sequence gap:
 *   - Step 1 → 2: pass 3
 *   - Step 2 → 3: pass 4
 */
export function getNextDueAt(country, daysAhead = 3) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + daysAhead)
  d.setUTCHours(12, 0, 0, 0) // 12:00 UTC — 1 hour before the 13:00 UTC cron
  return d.toISOString()
}

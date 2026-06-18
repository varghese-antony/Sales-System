import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { getNextDueAt } from '@/lib/send-window'

// ── WARM-UP SCHEDULE ─────────────────────────────────────────────────────────
// Gradually increases daily send limit to build domain reputation.
// Cron fires once per day (13:00 UTC) so the daily limit IS the per-run limit.
function getDailyLimit(startDateStr) {
  const start = new Date(startDateStr)
  const daysSince = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince < 14) return 20   // Week 1–2: careful warm-up
  if (daysSince < 28) return 40   // Week 3–4: building reputation
  return 60                        // Month 2+: safe cruising speed
}

// ── EMAIL TEMPLATES ───────────────────────────────────────────────────────────
// Industry-specific, plain-text style — no hour-counts, no "20-min call" CTA.
// Subjects: short (4–6 words), pain-point specific, no numbers or action words.
// Bodies: qualitative outcome, genuine question close — reads like a person wrote it.
const TEMPLATES = {
  'Marketing Agency': {
    subject: (co) => `Billable time at ${co}`,
    body: (first, co, country) => `Hi ${first},

I work with marketing agencies in ${country} on the ops side — specifically the manual work that quietly eats into billable time: client reporting, onboarding, and tool syncing.

Worked with one agency recently where these were the same friction points. After cleaning up their workflows they said it was the most capacity they'd recovered without taking on more people.

Happy to share what that looked like if it's relevant to ${co}.

Varghese
Blendery`,
  },
  'SaaS': {
    subject: (co) => `Ops question for ${co}`,
    body: (first, co, country) => `Hi ${first},

Quick one — I help SaaS teams in ${country} clean up the ops work that quietly slows growth: onboarding flows, support handoffs, internal reporting.

For a similar team we worked with recently, tightening those up made a noticeable difference to how much time their ops function was spending on reactive admin vs. actually building.

Worth a conversation if any of that sounds familiar?

Varghese
Blendery`,
  },
  'Consulting': {
    subject: (co) => `Admin load at ${co}`,
    body: (first, co, country) => `Hi ${first},

I work with consulting firms in ${country} on the admin that quietly drains billable hours — proposal workflows, client updates, CRM entry, reporting.

One firm we worked with recently was surprised how much of it could be cleaned up without changing their team structure or switching tools.

Is that kind of thing on the list for ${co} this year?

Varghese
Blendery`,
  },
  'Recruitment': {
    subject: (co) => `Candidate ops at ${co}`,
    body: (first, co, country) => `Hi ${first},

Recruitment teams in ${country} often tell me the same thing — candidate comms, CV tracking, and onboarding admin take up far more of the week than they should.

We helped one agency tighten that up significantly using the tools they already had. The team said it changed what their week actually looked like.

Is ops efficiency something you're thinking about at ${co}?

Varghese
Blendery`,
  },
  'E-commerce': {
    subject: (co) => `Fulfilment ops at ${co}`,
    body: (first, co, country) => `Hi ${first},

I work with e-commerce businesses in ${country} to clean up the manual side of ops — order processing, inventory syncing, and fulfilment workflows.

One business we worked with recently was surprised how much of it could be sorted within their existing setup — no new software needed.

Worth a chat if any of that's on your plate?

Varghese
Blendery`,
  },
  'Legal Tech SaaS': {
    subject: (co) => `Document workflows at ${co}`,
    body: (first, co, country) => `Hi ${first},

Legal tech teams often tell me the biggest time cost isn't the work itself — it's the admin around it: document flows, compliance tracking, client updates.

We worked with a firm in ${country} recently where cleaning up those workflows made a meaningful difference to the team's week — without touching their core systems.

If any of that resonates, happy to share what that looked like.

Varghese
Blendery`,
  },
  'PropTech SaaS': {
    subject: (co) => `Data ops at ${co}`,
    body: (first, co, country) => `Hi ${first},

PropTech teams I work with in ${country} often spend more time than they'd like on manual data entry, reporting, and lead tracking.

We helped one team clean that up within their existing stack — no new tools, just better connections between the ones they already had.

Is that kind of thing relevant at ${co}?

Varghese
Blendery`,
  },
  'HR Tech': {
    subject: (co) => `Onboarding workflows at ${co}`,
    body: (first, co, country) => `Hi ${first},

HR teams in ${country} often tell me that onboarding workflows, policy tracking, and employee admin take up a disproportionate chunk of the week.

We worked with one HR tech company where tightening up those workflows made a real difference — without adding headcount or changing their core tools.

Is ops efficiency something you're thinking about at ${co}?

Varghese
Blendery`,
  },
  'FinTech': {
    subject: (co) => `Compliance ops at ${co}`,
    body: (first, co, country) => `Hi ${first},

FinTech teams in ${country} often flag the same thing — compliance reporting, KYC flows, and client ops eat more time than they should.

We worked with a similar-sized firm recently and found a lot of that could be cleaned up within their existing setup.

Worth a quick conversation if any of that sounds familiar?

Varghese
Blendery`,
  },
  'default': {
    subject: (co) => `Quick question for ${co}`,
    body: (first, co, country) => `Hi ${first},

I work with businesses in ${country} on the ops side — specifically the manual, repetitive work that takes up more of the week than it should.

We've helped a number of similar businesses clean that up without switching tools — just better use of what they already have.

Is that kind of thing on your radar at ${co}?

Varghese
Blendery`,
  },
}

function getTemplate(industry) {
  return TEMPLATES[industry] || TEMPLATES['default']
}

// ── SMTP TRANSPORT ────────────────────────────────────────────────────────────
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

// Save sent email to Hostinger Sent folder
async function saveToSent(rawMessage) {
  const client = new ImapFlow({
    host: 'imap.hostinger.com',
    port: 993,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: false,
  })
  try {
    await client.connect()
    await client.append('Sent', rawMessage, ['\\Seen'])
    await client.logout()
  } catch { try { await client.logout() } catch {} }
}

// Logo only shown on follow-ups (step 2+). Cold step-1 emails are plain-text
// style — no images. Images on cold emails raise spam scores significantly.
const LOGO = `<img src="https://sales-system-blendery.vercel.app/blendery-logo.png" width="100" style="margin-bottom:8px;" alt="Blendery"/>`

// showLogo: false for initial cold email (step 1), true for follow-ups (step 2+)
function buildHtml(bodyText, leadId, showLogo = false) {
  const lines = bodyText.split('\n').map(l => l.trim() ? `<p style="margin:0 0 12px 0;color:#1a1a1a;font-size:14px;line-height:1.6;">${l}</p>` : '<br/>').join('')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sales-system-blendery.vercel.app'
  const pixel = `<img src="${appUrl}/api/track-open/${leadId}" width="1" height="1" style="display:none;" />`
  const unsubscribeUrl = `${appUrl}/api/unsubscribe/${leadId}`
  return `<div style="font-family:Arial,sans-serif;max-width:560px;">
    ${lines}
    <br/>
    ${showLogo ? LOGO : ''}
    <p style="margin:20px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#aaa;line-height:1.6;">
      Blendery Tech Solutions &middot; 26th Floor, Amber Gem Tower, UAE<br/>
      <a href="${unsubscribeUrl}" style="color:#aaa;text-decoration:underline;">Unsubscribe</a> from future emails.
    </p>
    ${pixel}
  </div>`
}

// ── QUICK ENRICH — find email for a lead on the fly ──────────────────────────
// Lightweight version: only checks mailto links and plain emails on key pages
async function quickEnrich(lead, supabase) {
  const base = (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`).replace(/\/$/, '')
  const domain = (() => {
    try { return new URL(base).hostname.replace(/^www\./, '') } catch { return null }
  })()
  if (!domain) return null

  const genericPrefixes = ['info','hello','contact','enquiries','sales','support','admin','mail','office','team']
  const pages = [base, `${base}/contact`, `${base}/about`, `${base}/contact-us`, `${base}/about-us`]

  let bestEmail = null

  for (const url of pages) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible)', 'Accept': 'text/html' },
        signal: AbortSignal.timeout(5000),
      })
      if (!res.ok) continue
      const html = await res.text()

      // mailto links first
      const mailtoMatches = [...html.matchAll(/mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi)]
      for (const m of mailtoMatches) {
        const email = m[1].toLowerCase()
        if (!email.endsWith(`@${domain}`)) continue
        const prefix = email.split('@')[0]
        if (!genericPrefixes.includes(prefix)) { bestEmail = email; break }
        if (!bestEmail) bestEmail = email // keep generic as fallback
      }
      if (bestEmail && !genericPrefixes.includes(bestEmail.split('@')[0])) break

      // Plain text emails
      const text = html.replace(/<[^>]+>/g, ' ')
      const matches = [...text.matchAll(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g)]
      for (const m of matches) {
        const email = m[0].toLowerCase()
        if (!email.endsWith(`@${domain}`)) continue
        if (email.includes('.png') || email.includes('.js')) continue
        const prefix = email.split('@')[0]
        if (!genericPrefixes.includes(prefix)) { bestEmail = email; break }
        if (!bestEmail) bestEmail = email
      }
      if (bestEmail && !genericPrefixes.includes(bestEmail.split('@')[0])) break
    } catch {}
    await new Promise(r => setTimeout(r, 300))
  }

  // Save the found email back to the lead in Supabase
  if (bestEmail) {
    await supabase.from('leads').update({ email: bestEmail }).eq('id', lead.id)
  }

  return bestEmail || null
}

// ── MAIN HANDLER ─────────────────────────────────────────────────────────────
export async function POST(request) {
  // Allow Vercel cron (with or without CRON_SECRET set) and manual UI triggers
  // This is an internal-only endpoint — no sensitive data exposed, just sends emails
  // to leads already in our own DB using our own SMTP credentials

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // ── Check if auto-send is enabled ──────────────────────────────────
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['auto_send_enabled', 'auto_send_start_date'])

  const settingsMap = Object.fromEntries((settings || []).map(s => [s.key, s.value]))
  if (settingsMap['auto_send_enabled'] !== 'true') {
    return NextResponse.json({ success: true, skipped: true, reason: 'Auto-send is disabled' })
  }

  const startDate = settingsMap['auto_send_start_date'] || new Date().toISOString()
  const dailyLimit = getDailyLimit(startDate)

  // ── Count emails sent today ─────────────────────────────────────────
  // Count initial outreach emails sent since midnight UTC today.
  // follow-up sequences are excluded (step > 1) — cap only governs new contacts.
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const { count: sentToday } = await supabase
    .from('sequences')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
    .eq('step', 1)

  const toSendThisRun = Math.max(0, dailyLimit - (sentToday || 0))

  if (toSendThisRun <= 0) {
    return NextResponse.json({ success: true, skipped: true, reason: `Daily limit of ${dailyLimit} already reached`, sentToday })
  }

  // ── Pick leads to email ─────────────────────────────────────────────
  const { data: contactedSeqs } = await supabase
    .from('sequences')
    .select('lead_id')

  const contactedIds = new Set((contactedSeqs || []).map(s => s.lead_id))

  // Fetch all uncontacted new leads (with OR without email — we'll try to enrich no-email ones)
  const { data: allLeads } = await supabase
    .from('leads')
    .select('id, full_name, first_name, company, email, industry, country, website, notes')
    .eq('status', 'new')
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })

  const uncontacted = (allLeads || []).filter(l => !contactedIds.has(l.id))

  // Split into: ready (have email) and enrichable (no email but have website)
  const ready = uncontacted.filter(l => l.email)
  const needsEnrich = uncontacted.filter(l => !l.email && l.website)

  // Fill batch: prefer leads already with emails, then try enrichable ones
  // Fetch up to toSendThisRun * 3 enrichable leads so we have enough candidates
  // (enrichment only succeeds ~50% of the time)
  const enrichCandidates = needsEnrich.slice(0, toSendThisRun * 3)

  // Try to enrich leads missing emails on the fly
  const enriched = []
  for (const lead of enrichCandidates) {
    if (ready.length + enriched.length >= toSendThisRun) break
    try {
      const email = await quickEnrich(lead, supabase)
      if (email) {
        enriched.push({ ...lead, email })
      }
    } catch {}
    await new Promise(r => setTimeout(r, 500))
  }

  const batch = [...ready, ...enriched].slice(0, toSendThisRun)

  if (batch.length === 0) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: 'No leads ready — add emails manually or run Enrich All',
      readyCount: ready.length,
      enrichableCount: needsEnrich.length,
    })
  }

  // ── Send emails ─────────────────────────────────────────────────────
  const transport = createTransport()
  let sent = 0
  let failed = 0
  const results = []

  // Pre-load recent outreach sends to guard against race condition:
  // if manual trigger + cron fire at the same time, both could pick the same
  // leads before either has written to the sequences table. Checking outreach
  // here gives a second layer of protection — if an email was sent in the
  // last 24h for this lead, we skip it.
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentOutreach } = await supabase
    .from('outreach')
    .select('lead_id')
    .gte('created_at', twentyFourHoursAgo)
    .eq('status', 'sent')

  const recentlySentIds = new Set((recentOutreach || []).map(o => o.lead_id))

  for (const lead of batch) {
    // Skip if we already sent to this lead in the last 24h (race condition guard)
    if (recentlySentIds.has(lead.id)) {
      results.push({ company: lead.company, email: lead.email, status: 'skipped', reason: 'already sent in last 24h' })
      continue
    }

    try {
      // ── First-name quality gate ────────────────────────────────────────────
      // If first_name is a real human name → use it.
      // If first_name is bad BUT the email is a known generic inbox (info@, hello@, etc.)
      //   → fall back to "{Company} team" so the email still reads naturally.
      // If first_name is bad AND email is not a generic inbox → skip entirely,
      //   because we can't address the email without looking spammy.
      const BAD_FIRST_NAMES = new Set([
        '','there','the','a','an','and','or','of','in','at','for','with',
        'ltd','llc','inc','co','corp','pty','group','agency','digital','media',
        'solutions','tech','technologies','consulting','services','global',
        'international','studio','studios','design','creative','marketing',
        'management','new','old','one','two','three','four','five','six',
        'seven','eight','nine','ten','first','second','third',
      ])
      const GENERIC_PREFIXES = new Set([
        'info','hello','contact','enquiries','enquire','sales','support','admin',
        'mail','office','team','hi','hey','help','welcome','reception','ops',
        'operations','hr','jobs','careers','media','press','pr','legal',
        'finance','billing','accounts','general','newbusiness','clientimpact',
        'collective','hoot','speaktosleek','talktous','dispatch','faculty',
        'future','events','secretariat','charities','lainfo','moscowoffice',
        'vietnam','london','melbourne','salesteam','email','newbusiness',
        'techsupport','tech','service','services','enquiry','inquiry',
        'clientservices','customerservice','customersupport','noreply',
      ])
      const rawFirst = (lead.first_name || '').trim()
      const emailPrefix = (lead.email || '').split('@')[0].toLowerCase().replace(/[^a-z]/g, '')
      const firstIsBad = !rawFirst || BAD_FIRST_NAMES.has(rawFirst.toLowerCase()) || rawFirst.split(' ').length > 2

      let first
      if (!firstIsBad) {
        first = rawFirst
      } else if (GENERIC_PREFIXES.has(emailPrefix)) {
        // Generic inbox — address the company team instead of a person
        const co_short = (lead.company || 'your company').replace(/\s*(ltd|llc|inc|pty|co|corp|group|digital|media|agency|solutions|tech|technologies|consulting|services|global|international|studio|studios|design|creative|marketing|management|plc|limited|pty ltd)\.?$/i, '').trim()
        first = `${co_short} team`
      } else {
        results.push({ company: lead.company, email: lead.email, status: 'skipped', reason: `bad first_name: "${rawFirst || 'empty'}" — fix in leads table` })
        continue
      }
      const co = lead.company || 'your company'
      const country = lead.country || 'your region'
      const tmpl = getTemplate(lead.industry)

      const subject = tmpl.subject(co)
      const bodyText = tmpl.body(first, co, country)
      const html = buildHtml(bodyText, lead.id, false) // no logo on cold step-1

      const info = await transport.sendMail({
        from: `Varghese Antony <${process.env.SMTP_USER}>`,
        to: lead.email,
        subject,
        text: bodyText,
        html,
      })

      const messageId = info.messageId
      const now = new Date()

      // Create sequence record
      await supabase.from('sequences').insert({
        lead_id: lead.id,
        angle_number: 2,
        step: 1,
        last_sent_at: now.toISOString(),
        next_due_at: getNextDueAt(lead.country, 3),
        original_subject: subject,
        original_message_id: messageId,
        replied: false,
        complete: false,
      })

      // Update lead status
      await supabase.from('leads').update({ status: 'contacted' }).eq('id', lead.id)

      // Write to outreach table so QA Check 7 (email_pipeline) can monitor auto-send
      // Previously only manual smart-outreach sends wrote here — this was a monitoring gap.
      supabase.from('outreach').insert({
        lead_id: lead.id,
        type: 'email',
        subject,
        message: bodyText,
        status: 'sent',
      }).then(() => {}).catch(() => {})

      // Write to email_performance so QA Check 19 shows real data.
      // Awaited so errors surface in system_errors rather than being swallowed.
      const { error: perfErr } = await supabase.from('email_performance').insert({
        lead_id: lead.id,
        sequence_step: 1,
        subject,
        body: bodyText,
        ai_score: null,
        personalisation_score: null,
        angle_number: 2,
        industry: lead.industry || null,
        country: lead.country || null,
        sent_at: now.toISOString(),
        opened: false,
        replied: false,
      })
      if (perfErr) {
        await supabase.from('system_errors').insert({
          source: 'auto-send',
          type: 'email-performance-insert-failed',
          message: perfErr.message,
          context: JSON.stringify({ lead_id: lead.id, code: perfErr.code, details: perfErr.details }),
        }).catch(() => {})
      }

      // Save to Sent folder (best effort)
      try {
        const raw = Buffer.from(
          `From: Varghese Antony <${process.env.SMTP_USER}>\r\n` +
          `To: ${lead.email}\r\n` +
          `Subject: ${subject}\r\n` +
          `Content-Type: text/html\r\n\r\n` +
          html
        )
        await saveToSent(raw)
      } catch {}

      sent++
      results.push({ company: co, email: lead.email, status: 'sent' })

      // Random 3–9s gap between sends — looks human, avoids burst patterns
      await new Promise(r => setTimeout(r, 3000 + Math.floor(Math.random() * 6000)))

    } catch (err) {
      failed++
      results.push({ company: lead.company, email: lead.email, status: 'failed', error: err.message })
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    sentToday: (sentToday || 0) + sent,
    dailyLimit,
    queueRemaining: uncontacted.length - batch.length,
    results,
  })
}

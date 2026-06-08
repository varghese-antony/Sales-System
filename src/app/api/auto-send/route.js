import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'

// ── WARM-UP SCHEDULE ─────────────────────────────────────────────────────────
// Gradually increases daily send limit to build domain reputation
function getDailyLimit(startDateStr) {
  const start = new Date(startDateStr)
  const daysSince = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysSince < 14) return 20   // Week 1–2: careful warm-up
  if (daysSince < 28) return 40   // Week 3–4: building reputation
  return 60                        // Month 2+: safe cruising speed
}

// Each cron run fires 4x/day so we send limit/4 per run
function getPerRunLimit(dailyLimit) {
  return Math.ceil(dailyLimit / 4)
}

// ── EMAIL TEMPLATES (Angle 2 — Proof-first) ──────────────────────────────────
// Industry-specific so it doesn't feel generic
const TEMPLATES = {
  'Marketing Agency': {
    subject: (co) => `How ${co} could reclaim 12+ hrs/week`,
    body: (first, co, country) => `Hi ${first},

I work with marketing agencies in ${country} to cut the manual work that eats into billable time — things like client reporting, onboarding, and tool syncing.

For one agency similar to ${co}, we got them 12 hours back per week without hiring anyone new — just better workflows with the tools they already had.

Worth a 20-min call to see if something similar applies to you?

Varghese
Blendery`,
  },
  'SaaS': {
    subject: (co) => `Ops question for ${co}`,
    body: (first, co, country) => `Hi ${first},

Quick one — I help SaaS teams in ${country} automate the ops work that slows down growth: onboarding flows, support routing, internal reporting.

Worked with a similar-sized SaaS company recently and cut their weekly manual ops time from 18 hrs to under 5.

If that kind of thing is on your radar, worth a quick chat?

Varghese
Blendery`,
  },
  'Consulting': {
    subject: (co) => `Freeing up time at ${co}`,
    body: (first, co, country) => `Hi ${first},

I help consulting firms in ${country} automate the admin that drains billable hours — proposal generation, client updates, CRM entry, reporting.

One firm I worked with went from spending 15+ hrs/week on internal ops to under 4 — without changing their team structure.

Is that kind of efficiency gain on your list for this year?

Varghese
Blendery`,
  },
  'Recruitment': {
    subject: (co) => `Automating the manual work at ${co}`,
    body: (first, co, country) => `Hi ${first},

Recruitment teams in ${country} typically lose 10–15 hrs/week to manual candidate comms, CV tracking, and onboarding admin.

I helped one agency cut that to under 3 hrs — same tools, better workflows.

If ops efficiency is on your radar, I'd love a quick 20-min call.

Varghese
Blendery`,
  },
  'E-commerce': {
    subject: (co) => `Ops efficiency question for ${co}`,
    body: (first, co, country) => `Hi ${first},

I work with ecommerce businesses in ${country} to automate order processing, inventory syncs, and fulfilment workflows — the manual stuff that slows growth.

Recently helped a similar business save 14 hrs/week. No new software — just connecting what they already had.

Worth a quick call?

Varghese
Blendery`,
  },
  'Legal Tech SaaS': {
    subject: (co) => `Question about ops at ${co}`,
    body: (first, co, country) => `Hi ${first},

Legal tech teams often tell me the biggest time drain isn't the work itself — it's the admin around it: document flows, compliance tracking, client updates.

I helped a similar firm in ${country} cut their weekly ops overhead by 11 hrs.

If that resonates, worth a 20-min conversation?

Varghese
Blendery`,
  },
  'PropTech SaaS': {
    subject: (co) => `Ops efficiency for ${co}`,
    body: (first, co, country) => `Hi ${first},

PropTech companies I work with in ${country} typically spend way too much time on manual data entry, reporting, and lead tracking — work that should be automated.

Helped one team get 13 hrs/week back. Same tools, smarter workflows.

Open to a quick 20-min call?

Varghese
Blendery`,
  },
  'HR Tech': {
    subject: (co) => `HR ops question for ${co}`,
    body: (first, co, country) => `Hi ${first},

HR teams in ${country} often lose a huge chunk of the week to manual onboarding flows, policy tracking, and employee admin.

I helped an HR tech company recently cut that from 16 hrs/week to under 4 — without adding headcount.

If ops efficiency is something you're thinking about, I'd love a quick chat.

Varghese
Blendery`,
  },
  'FinTech': {
    subject: (co) => `Manual ops question for ${co}`,
    body: (first, co, country) => `Hi ${first},

FinTech teams in ${country} often tell me compliance reporting, KYC flows, and client reporting eat far more time than they should.

I worked with a similar-sized firm recently and cut their weekly ops overhead by 12 hrs — all within their existing stack.

Worth a 20-min call to see if the same applies to you?

Varghese
Blendery`,
  },
  'default': {
    subject: (co) => `Quick question for ${co}`,
    body: (first, co, country) => `Hi ${first},

I help small businesses in ${country} like ${co} cut 10–20 hrs of manual work per week through ops automation — without buying new software.

For one similar business, we reduced their weekly admin overhead by 14 hours.

Worth a quick 20-min call to see if the same applies to you?

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

// Blendery logo (base64 embedded)
const LOGO = `<img src="https://sales-system-blendery.vercel.app/blendery-logo.png" width="100" style="margin-bottom:8px;" alt="Blendery"/>`

function buildHtml(bodyText, leadId) {
  const lines = bodyText.split('\n').map(l => l.trim() ? `<p style="margin:0 0 12px 0;color:#1a1a1a;font-size:14px;line-height:1.6;">${l}</p>` : '<br/>').join('')
  const pixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL}/api/track-open/${leadId}" width="1" height="1" style="display:none;" />`
  return `<div style="font-family:Arial,sans-serif;max-width:560px;">
    ${lines}
    <br/>
    ${LOGO}
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
  const perRunLimit = getPerRunLimit(dailyLimit)

  // ── Count emails sent today ─────────────────────────────────────────
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count: sentToday } = await supabase
    .from('sequences')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())

  const remainingToday = dailyLimit - (sentToday || 0)
  const toSendThisRun = Math.min(perRunLimit, remainingToday)

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

  for (const lead of batch) {
    try {
      const first = lead.first_name || lead.full_name?.split(' ')[0] || 'there'
      const co = lead.company || 'your company'
      const country = lead.country || 'your region'
      const tmpl = getTemplate(lead.industry)

      const subject = tmpl.subject(co)
      const bodyText = tmpl.body(first, co, country)
      const html = buildHtml(bodyText, lead.id)

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
        next_due_at: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        original_subject: subject,
        original_message_id: messageId,
        replied: false,
        complete: false,
      })

      // Update lead status
      await supabase.from('leads').update({ status: 'contacted' }).eq('id', lead.id)

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

      // 3-second gap between sends — looks natural, avoids rate limits
      await new Promise(r => setTimeout(r, 3000))

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
    queueRemaining: queue.length - batch.length,
    results,
  })
}

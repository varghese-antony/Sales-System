# Sales System — Project Memory

## What This Is
A CRM/Sales system for a solo consultant to find, track, and manage clients.
Built and owned by **Varghese Antony** — solo ops automation consultant, brand: **Blendery**.

## Tech Stack
- **Frontend:** Next.js 15.5.7 (App Router, `'use client'` components)
- **Database:** Supabase (PostgreSQL)
- **Code Storage:** GitHub → varghese-antony/Sales-System
- **Language:** JavaScript
- **Deployment:** Vercel → https://sales-system-blendery.vercel.app
- **Styling:** Inline styles ONLY — no Tailwind, no CSS modules

## Connections
- **Supabase URL:** https://qgfxbmeppypyzpbyvfgr.supabase.co
- **Keys:** stored in .env.local (never commit this file)
- **Email:** antonyv@blendery.tech via Hostinger SMTP (smtp.hostinger.com:465)

## Project Location
/Users/anthony/Downloads/lighting /sales system

---

## 🧠 MARKETING HEAD BRIEF
*Read this fully before touching any email, content, or outreach logic.*

### Who Varghese Is
- Solo consultant — no team, no agency, just him
- Sells **ops automation** to small/mid businesses
- Helps founders stop losing 10–20 hrs/week to manual work
- Does NOT use jargon like "digital transformation" or "synergy"
- Voice: direct, warm, slightly informal — like a smart friend, not a salesman

### Who He's Selling To
- **Founders/CEOs** of small businesses (5–50 people)
- Industries targeted: Marketing Agencies, SaaS, Consulting firms, E-commerce, HR Tech, Legal Tech, PropTech
- Countries: UK, Ireland, Australia, UAE, Singapore (English-speaking, timezone-aware)
- Pain they feel: drowning in manual tasks, tools that don't talk to each other, admin eating their growth time
- They are **busy and skeptical** — generic emails go straight to trash
- They respond to: specificity, proof, curiosity, brevity

### What Makes a Good Email (Marketing Rules)
1. **Never sound like a template** — if the name/company could be swapped out and it reads identically, it's too generic
2. **Open with THEM, not you** — first line must reference something real about their company
3. **One clear idea per email** — not a list of services, one sharp point
4. **Short** — 100–150 words max for cold email. No fluff.
5. **Subject line = curiosity or specificity** — never "Quick question" as the only hook
6. **No buzzwords:** "synergy", "leverage", "streamline", "digital transformation", "cutting-edge" are banned
7. **CTA = one low-friction ask** — "worth a 20-min call?" not "please review my proposal"
8. **Proof beats claims** — "saved a similar agency 14hrs/week" beats "I help businesses save time"

### Current Email Engine (What Exists — Needs Improvement)
- **File:** `/src/app/api/research-lead/route.js`
- Scrapes company website (homepage, /about, /services) for tagline, H1, H2, paragraphs
- Google-searches for company signals (hiring, launches, awards)
- Has a `PAIN_MAP` — industry → pain point + outcome (currently too generic, same pain for all SaaS etc.)
- Has 4 email "angles" (variation 0–3): Problem-led, Curiosity, Social proof, Short & direct
- **Problem:** all 4 angles use the same scraped data assembled the same way — feels like variations of one template, not genuinely different approaches
- **Fix needed:** each angle should have its own research focus, its own tone, its own structural logic

### The LinkedIn Intelligence Module
- **File:** `/src/app/api/linkedin-intelligence/route.js`
- Tries to scrape LinkedIn posts (usually blocked by LinkedIn wall)
- Generates a connection note + DM message
- **Opportunity:** DM messages are also generic — same improvement needed as emails

### Outreach Flow (Smart Outreach Page)
- **File:** `/src/app/smart-outreach/page.js`
- 4-step flow: Research → Posts → Connect → Email+DM
- Left panel: All Leads / Pending Connections toggle
- Connect step: opens LinkedIn profile directly (free plan — no Premium, can't send personalised notes)
- Regenerate button: cycles through 4 variations (v1/4 → v4/4), increments `variation` state
- Email sent via `/api/send-email/route.js` — Hostinger SMTP + saves to IMAP Sent folder
- Signature: Blendery logo (base64 embedded), Varghese Antony, antonyv@blendery.tech

### Supabase Tables
- **leads** — company, full_name, first_name, email, website, industry, country, linkedin_url, status, notes, linkedin_status, linkedin_requested_at
- **outreach** — lead_id, type (email/dm/call), subject, body, sent_at
- **prospects** — (early stage, not yet built out)

### What the Marketing Head Should Build
In priority order:
1. **Rewrite the email engine** — genuine personalisation per lead, not template-filling
   - Use scraped website copy/language to mirror their own words back
   - Detect company stage (early, growing, established) from signals
   - Different email structures for different industries, not just different pain points
2. **Smarter subject lines** — test different types, make them feel hand-written
3. **Follow-up sequence** — day 3 follow-up if no reply (auto-send via cron)
4. **DM personalisation** — same depth as email, for LinkedIn DMs post-connection
5. **Content strategy** — what Varghese should post on LinkedIn to warm up leads before outreach

---

## What's Been Built (Tech)
- [x] GitHub remote → Sales-System repo
- [x] Supabase connected and tested
- [x] Environment file (.env.local) created and secured
- [x] Smart Outreach page — 4-step LinkedIn + email flow
- [x] Pending Connections tracker — days since sent, 7-day flag, accept/switch buttons
- [x] Email sending — Hostinger SMTP with branded signature
- [x] Emails saved to Hostinger Sent folder via IMAP
- [x] Deep research — website scraping + Google signals
- [x] 4-angle email regeneration system
- [x] HTML entity decoding (no more &#8220; in emails)
- [x] "Not Useful" discard button for bad leads

## What's In Progress / Next
- [ ] Rewrite email engine with genuine personalisation (Marketing Head task)
- [ ] Auto follow-up sequence (day 3 no-reply trigger)
- [ ] Rotating company list — 500 companies, 50/day for daily cron
- [ ] Pipeline board — visual stages
- [ ] Dashboard — activity summary

## Rules
- Always use .env.local for keys — never hardcode
- Vercel env vars for all secrets (SMTP_HOST, SMTP_USER, SMTP_PASS, SUPABASE_SERVICE_ROLE_KEY)
- Always push code to GitHub after each feature is done
- Keep explanations simple for non-technical owner
- Inline styles only — no Tailwind
- Supabase client always instantiated INSIDE handler functions, never at module level
- Minimize token usage — read CLAUDE.md first, ask only what's needed

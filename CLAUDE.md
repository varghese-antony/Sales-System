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
- [x] Rewrite email engine with genuine personalisation (done — see research-lead/route.js)
- [x] Outreach sequence tracker + UI (done — sequences table, badges, overview tab)
- [x] Auto follow-up sequence (day 3 / day 7 cron — vercel.json, check-sequences/route.js)
- [x] Reply inbox checker (check-replies/route.js — matches incoming emails to leads)
- [x] CRON_SECRET + NEXT_PUBLIC_APP_URL set in Vercel env vars
- [ ] **Clutch.co lead scraper + importer** ← TECH HEAD: read full brief below
- [ ] Pipeline board — visual stages
- [ ] Dashboard — activity summary

---

## 🛠 TECH HEAD BRIEF — Outreach Sequence Tracker

### The Problem to Solve
Varghese sends cold emails to leads. He needs to know:
1. Which angle (0–3) was sent to each person
2. When it was sent
3. Whether they replied
4. What to send next and when
5. See all of this at a glance in the UI — no mental tracking, no spreadsheets

### Email Angle Reference (set by Marketing Head — do not change logic)
- **Angle 0** — Mirror (reflects their own website words back)
- **Angle 1** — Signal-led (hooks off a news/hiring/launch signal)
- **Angle 2** — Proof-first (leads with a concrete result) ← always the first send
- **Angle 3** — Short & direct (6 lines, no setup)

### Sequence Rules
- Every new lead: always start with **Angle 2**
- If no reply after 3 days: send **Follow-up 1** (bump in same thread — see template below)
- If no reply after 7 days: send **Follow-up 2** (final bump — see template below)
- After 2 follow-ups with no reply: mark lead as **Sequence Complete** — no more contact
- If they reply at any point: mark as **Replied** and remove from auto-sequence

### Follow-up Templates (do not make these fancy — they must look hand-typed)

**Follow-up 1 (day 3):**
```
Subject: [same as original — reply in thread]
Body:
Hi [first],

Just bumping this up in case it got buried.

Still worth a quick chat if the timing's right.

Varghese
```

**Follow-up 2 (day 7):**
```
Subject: [same as original — reply in thread]
Body:
Hi [first],

Last nudge from me — I know the inbox gets busy.

If ops automation ever becomes a priority, I'm easy to find.

Varghese
```

### Database Changes Needed

**Add columns to `outreach` table:**
```sql
ALTER TABLE outreach ADD COLUMN angle_number INTEGER; -- 0, 1, 2, or 3
ALTER TABLE outreach ADD COLUMN sequence_step INTEGER DEFAULT 1; -- 1 = first email, 2 = follow-up 1, 3 = follow-up 2
ALTER TABLE outreach ADD COLUMN replied BOOLEAN DEFAULT FALSE;
ALTER TABLE outreach ADD COLUMN reply_received_at TIMESTAMP;
ALTER TABLE outreach ADD COLUMN next_follow_up_at TIMESTAMP; -- when to send the next step
ALTER TABLE outreach ADD COLUMN sequence_complete BOOLEAN DEFAULT FALSE;
```

**Or create a new `sequences` table if cleaner:**
```sql
CREATE TABLE sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  angle_number INTEGER,          -- which angle was used (0–3)
  step INTEGER DEFAULT 1,        -- current step (1, 2, 3)
  last_sent_at TIMESTAMP,        -- when last email/followup was sent
  next_due_at TIMESTAMP,         -- when next step should fire
  replied BOOLEAN DEFAULT FALSE,
  reply_at TIMESTAMP,
  complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```
Use whichever is cleaner — Marketing Head doesn't mind, just needs the data.

### API Changes Needed

**When an email is sent (`/api/send-email/route.js`):**
- Record the `angle_number` (passed from front end — currently the `variation` state)
- Set `step = 1`, `last_sent_at = now()`, `next_due_at = now() + 3 days`
- Create a sequence record for this lead

**New endpoint: `/api/send-followup/route.js`**
- Accepts `lead_id`, `step` (2 or 3)
- Sends the correct follow-up template (above) via same Hostinger SMTP
- Must send as a **reply in thread** — use same subject line with "Re:" prefix and include `In-Reply-To` header matching the original email's Message-ID
- Updates sequence: increments step, updates `last_sent_at`, sets `next_due_at` (+4 days for step 2→3), or marks `complete` if step was 3

**New endpoint: `/api/check-sequences/route.js`** (for cron)
- Queries all sequences where `next_due_at <= now()` and `complete = false` and `replied = false`
- For each: auto-sends the follow-up and updates the record
- Called by a daily Vercel cron job

### UI Changes Needed (Smart Outreach Page)

**In the lead list (left panel), add a sequence status badge next to each lead:**
- 🟡 Sent — awaiting reply (step 1, within 3 days)
- 🔴 Follow-up due (step 1, past 3 days — needs follow-up 1)
- 🟠 Follow-up 2 due (step 2, past 7 days — needs follow-up 2)
- 🟢 Replied
- ⚫ Complete (no reply after both follow-ups)
- No badge = not yet contacted

**In the email step (step 4 of the flow), show:**
- If lead has no sequence: show normal email compose + "Send (Angle 2)" button
- If lead is at step 1 and follow-up is due: show follow-up 1 pre-filled, "Send Follow-up 1" button
- If lead is at step 2 and follow-up is due: show follow-up 2 pre-filled, "Send Follow-up 2" button
- If sequence complete: show "Sequence complete — no further contact" message

**New tab or section: "Sequence Overview"**
A simple table showing all leads in active sequences:

| Name | Company | Angle | Step | Sent | Next Due | Status |
|------|---------|-------|------|------|----------|--------|
| Sarah | Acme | Proof-first | 1/3 | 2 days ago | Tomorrow | 🟡 Waiting |
| James | Bloom | Proof-first | 2/3 | 4 days ago | Overdue | 🔴 Due |

Columns: Name, Company, Angle name (not number), Step (e.g. "1 of 3"), Days since last send, Next due date, Status badge.
Clicking a row opens that lead in the Smart Outreach flow.

---

## 🛠 TECH HEAD BRIEF — Lead Sourcing (Google Maps + ProductHunt)

### Why Two Sources
Clutch.co was the original plan but it renders with JavaScript — server-side fetching returns an empty shell. We're replacing it with two genuinely free, automatable sources:

- **Google Maps API** → Marketing Agencies, Consulting, Legal Tech, PropTech (businesses with physical presence)
- **ProductHunt** → SaaS, HR Tech (founders list their own products, static HTML, no auth needed)

Both auto-import into the `leads` table. Varghese clicks one button, leads appear.

---

### SOURCE 1 — Google Maps API

#### Setup
- API: Google Places API (Text Search endpoint)
- Free tier: 28,500 calls/month — more than enough
- Key: add `GOOGLE_MAPS_API_KEY` to `.env.local` and Vercel env vars
- Varghese gets a free key from console.cloud.google.com → Enable "Places API"

#### API Endpoint to use
```
GET https://maps.googleapis.com/maps/api/place/textsearch/json
  ?query=marketing+agency+London
  &key=YOUR_KEY
```
Returns: `name`, `formatted_address`, `website` (sometimes), `place_id`

For website (not always in Text Search), follow up with Place Details:
```
GET https://maps.googleapis.com/maps/api/place/details/json
  ?place_id=PLACE_ID
  &fields=name,website,formatted_address
  &key=YOUR_KEY
```

#### Search Queries to Run (hardcoded)
```js
const SEARCHES = [
  // Marketing Agencies
  { query: 'marketing agency London',         industry: 'Marketing Agency', country: 'United Kingdom' },
  { query: 'marketing agency Manchester',     industry: 'Marketing Agency', country: 'United Kingdom' },
  { query: 'digital marketing agency Dublin', industry: 'Marketing Agency', country: 'Ireland' },
  { query: 'marketing agency Sydney',         industry: 'Marketing Agency', country: 'Australia' },
  { query: 'marketing agency Dubai',          industry: 'Marketing Agency', country: 'UAE' },
  { query: 'marketing agency Singapore',      industry: 'Marketing Agency', country: 'Singapore' },

  // Consulting
  { query: 'business consulting firm London',    industry: 'Consulting', country: 'United Kingdom' },
  { query: 'management consulting Dublin',       industry: 'Consulting', country: 'Ireland' },
  { query: 'business consulting Sydney',         industry: 'Consulting', country: 'Australia' },
  { query: 'management consulting Dubai',        industry: 'Consulting', country: 'UAE' },
  { query: 'consulting firm Singapore',          industry: 'Consulting', country: 'Singapore' },

  // Legal Tech
  { query: 'legal technology firm London',    industry: 'Legal Tech SaaS', country: 'United Kingdom' },
  { query: 'legal tech company Sydney',       industry: 'Legal Tech SaaS', country: 'Australia' },
  { query: 'legal services firm Singapore',   industry: 'Legal Tech SaaS', country: 'Singapore' },

  // PropTech
  { query: 'property technology company London',  industry: 'PropTech SaaS', country: 'United Kingdom' },
  { query: 'proptech startup Dubai',              industry: 'PropTech SaaS', country: 'UAE' },
  { query: 'real estate tech company Sydney',     industry: 'PropTech SaaS', country: 'Australia' },
]
```

#### New API Route: `/api/import-google-maps/route.js`
- POST endpoint — no body needed, runs all SEARCHES above in sequence
- For each search: call Text Search → get up to 20 results → for each result call Place Details to get website
- Skip results with no website
- Deduplicate against existing leads by website domain
- Insert new leads into `leads` table
- Add 500ms delay between API calls to stay within rate limits
- Return `{ added, skipped, total }`

**Fields to populate:**
```
company     → place name from Google
website     → from Place Details
industry    → from SEARCHES config
country     → from SEARCHES config
full_name   → leave blank (Google won't have this)
first_name  → leave blank
email       → leave blank
status      → 'new'
notes       → 'Source: Google Maps'
```

---

### SOURCE 2 — ProductHunt

#### Why it works
ProductHunt pages are server-rendered HTML — `fetch()` + regex works fine. No auth needed for browsing. Founders post their own products, so company + founder name + website are all present.

#### Pages to scrape
```
https://www.producthunt.com/topics/saas          (SaaS products)
https://www.producthunt.com/topics/human-resources (HR Tech)
https://www.producthunt.com/topics/productivity   (cross-industry)
```

Each product card contains:
- Product/company name
- Tagline
- Website link (sometimes direct, sometimes via product page)
- Maker name (the founder who posted it)
- Maker profile link (leads to their Twitter/LinkedIn)

#### New API Route: `/api/import-producthunt/route.js`
- POST endpoint
- Fetches each topic page above
- Regex-extracts product cards: name, tagline, website, maker name
- Maps topic to industry:
  ```js
  'saas'             → 'SaaS'
  'human-resources'  → 'HR Tech'
  'productivity'     → 'SaaS'
  ```
- Country → leave blank (ProductHunt is global — Varghese can filter/delete non-target countries manually)
- Deduplicates by website domain
- Inserts into `leads` table
- Return `{ added, skipped, total }`

**Fields to populate:**
```
company     → product/company name
website     → product website
industry    → mapped from topic
country     → leave blank
full_name   → maker name if found
first_name  → first word of maker name
email       → leave blank
status      → 'new'
notes       → 'Source: ProductHunt'
```

#### Regex approach for ProductHunt
Same pattern as `research-lead/route.js`. Example:
```js
const res = await fetch('https://www.producthunt.com/topics/saas', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-GB,en;q=0.9',
  },
  signal: AbortSignal.timeout(8000),
})
const html = await res.text()
// parse with regex
```

---

### UI Changes — Leads Page

Replace the old "Import from Clutch" button with two new buttons:

**Button 1: "Import via Google Maps"**
- Calls `/api/import-google-maps`
- Progress: "Searching marketing agencies in London... (3/18)"
- Done toast: "32 new leads added, 8 skipped"

**Button 2: "Import from ProductHunt"**
- Calls `/api/import-producthunt`
- Progress: "Scraping SaaS products..."
- Done toast: "21 new leads added, 4 skipped"

Both buttons disabled while running. Simple inline style spinner. No modals.

Also add a **CSV Import** button as a manual fallback:
- File input (accepts .csv)
- Calls `/api/import-csv/route.js`
- Expected CSV columns: `Company, Website, Country, Industry, Full Name, Email` (all except Company optional)
- Parses, deduplicates by domain, inserts into leads
- Useful when Varghese finds companies manually anywhere

---

### What NOT to Build
- Do not find emails automatically — Varghese adds these manually via Skrapp.io (150 free/month)
- Do not add these to the cron job yet — manual trigger only
- Do not build country filtering on ProductHunt — Varghese handles that manually
- Inline styles only — no Tailwind
- Supabase client inside handler functions only — never at module level

### What NOT to Build
- Do not build reply detection automatically (no email parsing) — Varghese will manually mark a lead as "Replied" via a button
- Do not build angle selection UI — angle 2 is always first, this is fixed
- Do not add email preview modal — the existing compose view is enough
- Inline styles only — no Tailwind, no CSS modules

## Rules
- **ALWAYS read LOCKS.md before editing any file** — if another session has a lock on it, stop and warn the user before touching it. Write your own lock when you start, remove it when you push.
- Always use .env.local for keys — never hardcode
- Vercel env vars for all secrets (SMTP_HOST, SMTP_USER, SMTP_PASS, SUPABASE_SERVICE_ROLE_KEY)
- Always push code to GitHub after each feature is done
- Keep explanations simple for non-technical owner
- Inline styles only — no Tailwind
- Supabase client always instantiated INSIDE handler functions, never at module level
- Minimize token usage — read CLAUDE.md first, ask only what's needed

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
- [ ] **Email Refinement Agent** ← TECH HEAD: highest priority — read full brief below
- [ ] **Demo mode** ← TECH HEAD: read full brief below
- [ ] Pipeline board — visual stages
- [ ] Dashboard — activity summary

---

## 🛠 TECH HEAD BRIEF — Email Refinement Agent

### The Problem
Every email generated by the system still sounds like it was written by AI. The reader feels it immediately and ignores it. The goal of this agent is to make every single email — cold email and follow-up — read like a real person wrote it specifically for that one recipient. No templates. No AI tells. No two emails that feel the same.

This is not a one-time rewrite. This is a self-evaluating agent that:
1. Scores every email before it's shown to Varghese
2. Rewrites anything that fails
3. Tracks which emails get opened and replied to
4. Gets better over time based on real results

---

### Step 1 — Build the AI-Tell Detector

**New file: `/src/lib/email-evaluator.js`**

A function `scoreEmail(subject, body)` that returns a score 0–100 and a list of specific problems found.

**Penalise these AI patterns (each one docks points):**

```js
const AI_PHRASES = [
  // Hollow openers
  "i hope this finds you",
  "i wanted to reach out",
  "just wanted to touch base",
  "i came across your",
  "i recently came across",
  "i stumbled upon",

  // Salesy reassurances
  "no pitch",
  "no obligation",
  "no commitment",
  "happy to chat",
  "would love to",
  "i'd love to",
  "i would love to",
  "feel free to",

  // AI-favourite transitions
  "here's the thing",
  "here's what i mean",
  "here's the truth",
  "at the end of the day",
  "the bottom line is",
  "long story short",
  "to be honest",
  "i'll be brief",
  "i'll keep this short",
  "let me be direct",

  // Overly polished closers
  "worth a quick call",
  "worth a 20-minute call",
  "worth a 20 minute call",
  "would you be open to",
  "are you available for",
  "do you have 20 minutes",
  "looking forward to hearing",
  "please let me know",
  "don't hesitate to",

  // Buzzwords
  "streamline",
  "leverage",
  "synergy",
  "digital transformation",
  "cutting-edge",
  "game-changer",
  "revolutionize",
  "paradigm",
  "holistic",
  "robust solution",
  "best-in-class",
  "thought leader",
  "move the needle",
  "deep dive",
  "circle back",
  "bandwidth",
  "pain points", // too overused
  "ops drag",
  "operational drag",
]

// Em dash in email body = automatic -20 points
// More than 2 uses of "I" in one sentence = -10 points
// All 4 paragraphs the same length = -15 points (too structured)
// Subject line contains a number + "hrs" or "hours" = -20 points (spam trigger)
// Subject line longer than 8 words = -10 points
// Email body longer than 180 words = -10 points
// Ends with "Best," or "Kind regards," = -15 points
```

**Score breakdown:**
- 85–100: Pass — show to Varghese as-is
- 65–84: Warning — show with highlighted problems, offer to rewrite
- Below 65: Fail — auto-rewrite before showing

---

### Step 2 — Build the Personalisation Scorer

Same file. Function `scorePersonalisation(body, leadData, siteData, signals)`.

Checks how much of the scraped data actually made it into the email:

```js
// +20 if body contains a word or phrase from their actual website copy (mirrorPhrase)
// +20 if body references their specific service (from scraped H2s)
// +15 if body references a Google signal (hiring, launch, news)
// +15 if body uses their actual tagline or H1
// +10 if body contains their company name more than once (feels specific)
// +10 if body contains their country or city
// -20 if body could apply to ANY company in that industry (too generic)
// -30 if company name only appears once — in the greeting
```

**Minimum personalisation score to pass: 60**

If below 60 — the email is too generic. Must rewrite with more scraped data injected.

---

### Step 3 — The Rewrite Loop

**New file: `/src/lib/email-rewriter.js`**

Function `refineEmail(subject, body, problems, leadData, siteData, signals)` that:

1. Takes the list of problems from the evaluator
2. Fixes each one systematically:

**For AI phrases:** Replace with human alternatives from this bank:
```js
const HUMAN_ALTERNATIVES = {
  "would love to": ["happy to", "can", "glad to"],
  "worth a quick call": ["got 20 minutes?", "want to see it?", "would a call make sense?"],
  "i came across": ["i was looking at", "i had a look at", "i found"],
  "no pitch": "", // just delete it — humans don't say this
  "here's the thing": "", // delete — just start the sentence
  "i'll keep this short": "", // delete — just be short
  "pain points": ["the stuff that eats time", "what's taking too long", "the work that piles up"],
  "streamline": ["fix", "sort out", "speed up"],
  "leverage": ["use", "get more from"],
}
```

**For em dashes:** Replace `—` with `, ` or `. ` or just rewrite the sentence.

**For length:** If over 180 words, identify the least specific sentence in each paragraph and remove it.

**For subject lines:** If subject contains a promise or number:
- Remove the number
- Replace with something that sounds personal: just their name, just their company, or a plain observation

**Rewrite loop:**
```js
async function refineEmail(email, leadData, siteData, signals, maxIterations = 3) {
  let current = email
  for (let i = 0; i < maxIterations; i++) {
    const aiScore = scoreEmail(current.subject, current.body)
    const personalScore = scorePersonalisation(current.body, leadData, siteData, signals)
    if (aiScore >= 85 && personalScore >= 60) break // passes — stop
    current = rewriteEmail(current, leadData, siteData, signals)
  }
  return current
}
```

---

### Step 4 — Follow-up Humanisation

The follow-ups in `send-followup/route.js` are 2 lines which is correct length. But they're identical every time — the same 2 lines go to every person. That's an automation tell.

**Fix:** Create a bank of 8 follow-up variations for each step. Pick one randomly per send. They should all be the same length and tone — just slightly different words so no two people get the same message.

**Step 2 follow-up bank (day 3 — bump):**
```js
const FOLLOWUP_2_BANK = [
  (first) => `Hi ${first},\n\nJust bringing this back up in case it got lost.\n\nVarghese`,
  (first) => `Hi ${first},\n\nFlagging this again in case the timing's better now.\n\nVarghese`,
  (first) => `Hi ${first},\n\nDropping this back to the top — thought it was worth a second look.\n\nVarghese`,
  (first) => `Hi ${first},\n\nJust checking this didn't get buried.\n\nVarghese`,
  (first) => `Hi ${first},\n\nBringing this back up — happy to answer any questions if you had a look.\n\nVarghese`,
]
```

**Step 3 follow-up bank (day 7 — final):**
```js
const FOLLOWUP_3_BANK = [
  (first) => `Hi ${first},\n\nI'll leave it here. If the timing ever makes sense, you know where to find me.\n\nVarghese`,
  (first) => `Hi ${first},\n\nLast one from me. If it's ever relevant, I'm easy to find.\n\nVarghese`,
  (first) => `Hi ${first},\n\nStopping here — but if things change, feel free to come back to this.\n\nVarghese`,
  (first) => `Hi ${first},\n\nI'll get out of your inbox after this. If it ever becomes relevant, you've got my details.\n\nVarghese`,
]
```

Pick randomly: `bank[Math.floor(Math.random() * bank.length)](first)`

---

### Step 5 — Performance Tracking (Self-Improvement)

**New Supabase table:**
```sql
CREATE TABLE email_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  sequence_step INTEGER,
  subject TEXT,
  body TEXT,
  ai_score INTEGER,
  personalisation_score INTEGER,
  angle_number INTEGER,
  industry TEXT,
  country TEXT,
  opened BOOLEAN DEFAULT FALSE,
  replied BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP DEFAULT NOW()
);
```

**When an email is sent:** save it to `email_performance` with its scores.
**When opened (via tracking pixel):** update `opened = true`
**When Varghese marks replied:** update `replied = true`

This table will show over time which scores, angles, and structures actually get replies. The marketing head will review this data monthly and adjust the generation rules.

---

### Step 6 — UI Changes

**In the Smart Outreach email compose step:**

After research runs and email is generated:
- Run it through the evaluator automatically
- Show a small score badge next to the email: `Human score: 91/100` (green) or `72/100` (yellow)
- If yellow or red, show a "Refine" button that runs the rewrite loop
- Show which specific phrases were flagged (small list below the email)
- After refine, show the new score

This gives Varghese visibility into why an email might feel off — and one click to fix it.

---

### Integration Point

In `research-lead/route.js`, after `buildEmail()` is called:
```js
import { refineEmail } from '@/lib/email-rewriter'
import { scoreEmail, scorePersonalisation } from '@/lib/email-evaluator'

// After buildEmail():
const refined = await refineEmail(
  { subject, body },
  { first, company, industry, country },
  siteData,
  signals
)
// Return refined.subject and refined.body instead of originals
// Also return the scores so the UI can display them
```

---

### What NOT to Build
- Do not call any external AI API (OpenAI, Claude etc) — this must run entirely on pattern matching and rule-based rewrites. No API costs.
- Do not build a training model — the improvement comes from the marketing head reading the performance data and updating the rules manually
- Do not show the score to the email recipient — internal only
- Inline styles only — no Tailwind
- Supabase client inside handler functions only

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

### What NOT to Build (Lead Sourcing)
- Do not find emails automatically — Varghese adds these manually via Skrapp.io (150 free/month)
- Do not add these to the cron job yet — manual trigger only
- Do not build country filtering on ProductHunt — Varghese handles that manually
- Inline styles only — no Tailwind
- Supabase client inside handler functions only — never at module level

## 🛠 TECH HEAD BRIEF — Demo Mode (Blur)

### Why
Varghese wants to post screen recordings of the system on LinkedIn. Real data has names, companies and emails in it. Solution: a toggle that blurs sensitive fields. A blur looks authentic — it tells viewers "real data, just protected." More trustworthy than fake names.

### What to Build

**1. Demo Mode toggle button**
- Add to the top nav — small button labelled "Demo Mode"
- When ON: sensitive fields get blurred across the whole app
- When OFF: everything shows normally
- State in React only — never saved to Supabase

**2. Fields to blur** — apply `filter: blur(6px)` + `userSelect: none`
- Full name / first name
- Company name
- Email address
- Website URL
- LinkedIn URL

**3. Fields to NOT blur**
- Industry, Country, Status badges, Step numbers, Dates, Buttons

**4. How to implement**
Create `src/contexts/DemoModeContext.js`:
```js
import { createContext, useContext, useState } from 'react'
const DemoModeContext = createContext({ demoMode: false, toggleDemoMode: () => {} })
export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(false)
  return (
    <DemoModeContext.Provider value={{ demoMode, toggleDemoMode: () => setDemoMode(d => !d) }}>
      {children}
    </DemoModeContext.Provider>
  )
}
export const useDemoMode = () => useContext(DemoModeContext)
```

Wrap app in `layout.js` with `<DemoModeProvider>`.

In every component that shows lead data:
```js
const { demoMode } = useDemoMode()
const blur = demoMode ? { filter:'blur(6px)', userSelect:'none', pointerEvents:'none' } : {}
// then:
<span style={blur}>{lead.full_name}</span>
<span style={blur}>{lead.company}</span>
<span style={blur}>{lead.email}</span>
```

**5. Banner when demo is ON**
- Small bar at top of page: "Demo mode on — sensitive data is blurred"
- Subtle dark background, small text, not intrusive
- Toggle button turns teal when active

**6. Pages to update**
- `smart-outreach/page.js` — lead list + all 4 steps
- `leads/page.js` — all name/company/email fields
- Sequence Overview table

### What NOT to Build (Demo Mode)
- Do not replace data with fake names — blur only
- Do not persist demo mode state to database
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

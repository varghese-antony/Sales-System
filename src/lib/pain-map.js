// ─── Shared Pain Map ─────────────────────────────────────────────────────────
// Single source of truth for industry pain points used across:
//   - research-lead (full detail for email angles)
//   - linkedin-intelligence (shortPain for DM/connection note)
// Any change here updates both routes automatically.

export const PAIN_MAP = {
  'Marketing Agency': {
    pain: 'manual client reporting, proposal creation, and account managers rebuilding the same decks every month',
    outcome: 'an agency like yours saving 12–18 hrs/week per account manager — without touching their existing tools',
    shortPain: 'client reporting and proposal admin',
    proofStat: '14 hours a week',
    proofContext: 'an agency founder in the UK who was manually pulling data from 6 platforms for every client report',
  },
  'SaaS': {
    pain: 'manual onboarding sequences, support triage done by hand, and churn signals nobody has time to act on',
    outcome: 'SaaS teams cutting onboarding time by 60% without adding headcount',
    shortPain: 'onboarding and support ops',
    proofStat: '11 hours a week',
    proofContext: 'a SaaS founder whose team was manually sending every onboarding email and chasing trial users one by one',
  },
  'Consulting': {
    pain: 'proposals taking 3–5 hrs each, project tracking living in spreadsheets, and month-end billing eating a full day',
    outcome: 'consultancies reclaiming 2 full days a month per consultant',
    shortPain: 'proposal creation and project admin',
    proofStat: '2 days a month',
    proofContext: 'a consulting firm where every SOW was being built from scratch — same structure, different client, every time',
  },
  'E-commerce SaaS': {
    pain: 'customer service volume outpacing the team, return backlogs, and order data living in three different places',
    outcome: 'e-commerce ops teams handling 3x volume with the same headcount',
    shortPain: 'customer ops and returns management',
    proofStat: '3x support volume',
    proofContext: 'an e-commerce team handling returns and refunds manually across email, Shopify, and a spreadsheet',
  },
  'Ecommerce': {
    pain: 'customer service volume outpacing the team, return backlogs, and order data living in three different places',
    outcome: 'e-commerce ops teams handling 3x volume with the same headcount',
    shortPain: 'order management and inventory reconciliation',
    proofStat: '3x support volume',
    proofContext: 'an e-commerce team handling returns and refunds manually across email, Shopify, and a spreadsheet',
  },
  'HR Tech': {
    pain: 'candidate screening done by hand, interview scheduling going back and forth for days, and status updates nobody sends',
    outcome: 'HR teams cutting time-to-hire by 40%',
    shortPain: 'candidate screening and interview scheduling',
    proofStat: '40% faster hiring',
    proofContext: 'an HR team spending 3 hrs a day on scheduling emails that should have been automated from the start',
  },
  'Legal Tech SaaS': {
    pain: 'document review bottlenecks, client intake still done manually, and billing reconciliation eating the last week of every month',
    outcome: 'legal teams reclaiming 8+ hrs/week in admin without changing their practice management software',
    shortPain: 'client intake and billing admin',
    proofStat: '8 hours a week',
    proofContext: 'a legal tech firm whose client intake process involved 4 manual steps that could all be triggered automatically',
  },
  'PropTech SaaS': {
    pain: 'tenant onboarding done manually, maintenance requests tracked in spreadsheets, and monthly reporting rebuilt from scratch',
    outcome: 'property teams cutting manual admin by 50%',
    shortPain: 'tenant ops and reporting',
    proofStat: '50% less admin',
    proofContext: 'a property team manually chasing tenants for documents that could have been collected automatically on day one',
  },
  'Media/Marketing': {
    pain: 'content calendar management and client reporting done manually across too many platforms',
    outcome: 'media teams saving 10+ hrs/week on reporting and content ops',
    shortPain: 'content calendar management and client reporting',
    proofStat: '10 hours a week',
    proofContext: 'a media team manually compiling monthly reports from 5 different analytics tools',
  },
}

export const DEFAULT_PAIN = {
  pain: 'disconnected tools and manual processes',
  outcome: 'founders reclaiming 10–15 hrs/week',
  shortPain: 'manual ops work',
  proofStat: '10+ hours a week',
  proofContext: 'a founder whose team was doing manually what their tools could have handled automatically',
}

-- ============================================
-- SALES SYSTEM - DATABASE SCHEMA
-- Blendery Tech Solutions
-- ============================================

-- 1. LEADS TABLE
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  title TEXT,
  company TEXT,
  company_size TEXT,
  industry TEXT,
  country TEXT,
  city TEXT,
  email TEXT,
  email_verified BOOLEAN DEFAULT false,
  linkedin_url TEXT,
  website TEXT,
  source TEXT,
  score INTEGER DEFAULT 0,
  score_reason TEXT,
  status TEXT DEFAULT 'new',
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. OUTREACH TABLE
CREATE TABLE IF NOT EXISTS outreach (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'email',
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'draft',
  sent_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PIPELINE TABLE
CREATE TABLE IF NOT EXISTS pipeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  stage TEXT DEFAULT 'new',
  value NUMERIC,
  notes TEXT,
  moved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. EMAIL TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  subject TEXT,
  body TEXT,
  type TEXT DEFAULT 'outreach',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_outreach_lead_id ON outreach(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stage ON pipeline(stage);

-- ROW LEVEL SECURITY
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON leads FOR ALL USING (true);
CREATE POLICY "Allow all" ON outreach FOR ALL USING (true);
CREATE POLICY "Allow all" ON pipeline FOR ALL USING (true);
CREATE POLICY "Allow all" ON email_templates FOR ALL USING (true);

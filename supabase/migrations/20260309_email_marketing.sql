-- Email Marketing System tables

-- 1. Provider contact list
CREATE TABLE IF NOT EXISTS email_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  organisation TEXT,
  regulator TEXT CHECK (regulator IN ('ciw', 'cqc')),
  provider_type TEXT,
  region TEXT,
  registration_number TEXT,
  data_source TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained')),
  unsubscribed_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_email_contacts_email ON email_contacts(email);
CREATE INDEX IF NOT EXISTS idx_email_contacts_status ON email_contacts(status);
CREATE INDEX IF NOT EXISTS idx_email_contacts_regulator ON email_contacts(regulator);
CREATE INDEX IF NOT EXISTS idx_email_contacts_tags ON email_contacts USING GIN (tags);

-- 2. Campaign definitions
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  plain_text TEXT,
  from_name TEXT DEFAULT 'CareCallAI',
  from_email TEXT DEFAULT 'hello@carecallai.co.uk',
  reply_to TEXT,
  target_regulator TEXT,
  target_provider_type TEXT,
  target_tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INT DEFAULT 0,
  total_sent INT DEFAULT 0,
  total_opened INT DEFAULT 0,
  total_clicked INT DEFAULT 0,
  total_bounced INT DEFAULT 0,
  total_unsubscribed INT DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Per-recipient send tracking
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES email_contacts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_sends_campaign ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_contact ON email_sends(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);

-- 4. Reusable HTML templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. GDPR unsubscribe audit trail
CREATE TABLE IF NOT EXISTS email_unsubscribes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  campaign_id UUID REFERENCES email_campaigns(id),
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_unsubscribes_email ON email_unsubscribes(email);

-- RLS (permissive for service role access)
ALTER TABLE email_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_email_contacts ON email_contacts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_email_campaigns ON email_campaigns FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_email_sends ON email_sends FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_email_templates ON email_templates FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_email_unsubscribes ON email_unsubscribes FOR ALL USING (true) WITH CHECK (true);

-- Create payroll_settings table
CREATE TABLE IF NOT EXISTS payroll_settings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID REFERENCES organizations(id),
  currency                TEXT DEFAULT 'GBP',
  currency_symbol         TEXT DEFAULT '£',
  tax_id                  TEXT,
  ni_number               TEXT,
  payroll_reference       TEXT,
  company_name            TEXT,
  auto_generate_wage_slips BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for payroll_settings
ALTER TABLE payroll_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payroll_settings_auth_all" ON payroll_settings
  FOR ALL USING (auth.uid() IS NOT NULL);

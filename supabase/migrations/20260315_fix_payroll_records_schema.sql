-- Fix payroll_records schema to match GeneratePayroll.jsx code
-- The original table had basic_pay/overtime_pay/deductions(NUMERIC)/hours_worked
-- but the new payroll system needs proper columns.

-- Add missing columns
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS period_start DATE;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS period_end DATE;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS regular_hours NUMERIC DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS overtime_rate NUMERIC DEFAULT 0;
ALTER TABLE payroll_records ADD COLUMN IF NOT EXISTS gross_pay NUMERIC DEFAULT 0;

-- Convert deductions from NUMERIC to JSONB
-- First rename the old numeric column, then create new JSONB column
ALTER TABLE payroll_records RENAME COLUMN deductions TO deductions_total_legacy;
ALTER TABLE payroll_records ADD COLUMN deductions JSONB DEFAULT '{}';

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

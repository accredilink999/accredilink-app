-- Add start_time and end_time columns to shift_types if they don't exist
ALTER TABLE shift_types ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE shift_types ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE shift_types ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#14b8a6';

-- Ensure RLS is enabled with proper auth policy for shift_types and base_shift_templates
-- These tables were missing from the original schema RLS setup
ALTER TABLE shift_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shift_types_auth_all" ON shift_types;
CREATE POLICY "shift_types_auth_all" ON shift_types FOR ALL USING (auth.uid() IS NOT NULL);

ALTER TABLE base_shift_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "base_shift_templates_auth_all" ON base_shift_templates;
CREATE POLICY "base_shift_templates_auth_all" ON base_shift_templates FOR ALL USING (auth.uid() IS NOT NULL);

ALTER TABLE shift_claim_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shift_claim_requests_auth_all" ON shift_claim_requests;
CREATE POLICY "shift_claim_requests_auth_all" ON shift_claim_requests FOR ALL USING (auth.uid() IS NOT NULL);

ALTER TABLE call_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "call_types_auth_all" ON call_types;
CREATE POLICY "call_types_auth_all" ON call_types FOR ALL USING (auth.uid() IS NOT NULL);

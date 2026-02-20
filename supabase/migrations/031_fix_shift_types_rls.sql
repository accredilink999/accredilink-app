-- Fix missing RLS policies for tables created outside the original schema
-- shift_types, base_shift_templates, shift_claim_requests, call_types
-- were not in the original RLS setup loop, so writes were silently blocked

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

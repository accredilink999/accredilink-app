-- ============================================================================
-- Revert strict org-based RLS policies to permissive auth-based policies.
-- The org isolation was premature — only one tenant exists currently.
-- Re-apply org-based RLS later when multi-tenant is needed.
-- ============================================================================

-- service_users
DROP POLICY IF EXISTS "service_users_org" ON service_users;
DROP POLICY IF EXISTS "service_users_auth_all" ON service_users;
CREATE POLICY "service_users_auth_all" ON service_users FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- shifts
DROP POLICY IF EXISTS "shifts_org" ON shifts;
DROP POLICY IF EXISTS "shifts_auth_all" ON shifts;
CREATE POLICY "shifts_auth_all" ON shifts FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- shift_calls
DROP POLICY IF EXISTS "shift_calls_org" ON shift_calls;
DROP POLICY IF EXISTS "shift_calls_auth_all" ON shift_calls;
CREATE POLICY "shift_calls_auth_all" ON shift_calls FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- shift_patterns
DROP POLICY IF EXISTS "shift_patterns_org" ON shift_patterns;
DROP POLICY IF EXISTS "shift_patterns_auth_all" ON shift_patterns;
CREATE POLICY "shift_patterns_auth_all" ON shift_patterns FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- shift_types
DROP POLICY IF EXISTS "shift_types_org" ON shift_types;
DROP POLICY IF EXISTS "shift_types_auth_all" ON shift_types;
CREATE POLICY "shift_types_auth_all" ON shift_types FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- care_logs
DROP POLICY IF EXISTS "care_logs_org" ON care_logs;
DROP POLICY IF EXISTS "care_logs_auth_all" ON care_logs;
CREATE POLICY "care_logs_auth_all" ON care_logs FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- healthcare_logs
DROP POLICY IF EXISTS "healthcare_logs_org" ON healthcare_logs;
DROP POLICY IF EXISTS "healthcare_logs_auth_all" ON healthcare_logs;
CREATE POLICY "healthcare_logs_auth_all" ON healthcare_logs FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- rota_areas
DROP POLICY IF EXISTS "rota_areas_org" ON rota_areas;
DROP POLICY IF EXISTS "rota_areas_auth_all" ON rota_areas;
CREATE POLICY "rota_areas_auth_all" ON rota_areas FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- invoices
DROP POLICY IF EXISTS "invoices_org" ON invoices;
DROP POLICY IF EXISTS "invoices_auth_all" ON invoices;
CREATE POLICY "invoices_auth_all" ON invoices FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- invoicing_settings
DROP POLICY IF EXISTS "invoicing_settings_org" ON invoicing_settings;
DROP POLICY IF EXISTS "invoicing_settings_auth_all" ON invoicing_settings;
CREATE POLICY "invoicing_settings_auth_all" ON invoicing_settings FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- clients
DROP POLICY IF EXISTS "clients_org" ON clients;
DROP POLICY IF EXISTS "clients_auth_all" ON clients;
CREATE POLICY "clients_auth_all" ON clients FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- recurring_invoices
DROP POLICY IF EXISTS "recurring_invoices_org" ON recurring_invoices;
DROP POLICY IF EXISTS "recurring_invoices_auth_all" ON recurring_invoices;
CREATE POLICY "recurring_invoices_auth_all" ON recurring_invoices FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- payments
DROP POLICY IF EXISTS "payments_org" ON payments;
DROP POLICY IF EXISTS "payments_auth_all" ON payments;
CREATE POLICY "payments_auth_all" ON payments FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- messages
DROP POLICY IF EXISTS "messages_org" ON messages;
DROP POLICY IF EXISTS "messages_auth_all" ON messages;
CREATE POLICY "messages_auth_all" ON messages FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- conversations
DROP POLICY IF EXISTS "conversations_org" ON conversations;
DROP POLICY IF EXISTS "conversations_auth_all" ON conversations;
CREATE POLICY "conversations_auth_all" ON conversations FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- users
DROP POLICY IF EXISTS "users_org" ON users;
DROP POLICY IF EXISTS "users_auth_all" ON users;
CREATE POLICY "users_auth_all" ON users FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

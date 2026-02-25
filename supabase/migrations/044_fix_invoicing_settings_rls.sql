-- Drop old RLS policies on invoicing_settings that may be missing WITH CHECK
DROP POLICY IF EXISTS "invoicing_settings_auth_all" ON invoicing_settings;
DROP POLICY IF EXISTS "auth_all" ON invoicing_settings;
DROP POLICY IF EXISTS "Allow all for authenticated" ON invoicing_settings;

-- Create proper policy with both USING and WITH CHECK
CREATE POLICY "invoicing_settings_full_access" ON invoicing_settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also fix invoices, payments, clients, recurring_invoices while we're at it
DROP POLICY IF EXISTS "invoices_auth_all" ON invoices;
DROP POLICY IF EXISTS "auth_all" ON invoices;
CREATE POLICY "invoices_full_access" ON invoices
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "payments_auth_all" ON payments;
DROP POLICY IF EXISTS "auth_all" ON payments;
CREATE POLICY "payments_full_access" ON payments
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all" ON clients;
CREATE POLICY "clients_full_access" ON clients
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "auth_all" ON recurring_invoices;
CREATE POLICY "recurring_invoices_full_access" ON recurring_invoices
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

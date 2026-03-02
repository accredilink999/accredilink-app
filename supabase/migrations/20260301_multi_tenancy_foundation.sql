-- ============================================================================
-- Multi-Tenancy Foundation
-- Creates organizations + membership tables, adds organization_id to core
-- tables, backfills existing data, and updates RLS for org isolation.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- Step 1: Organizations table
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  plan text DEFAULT 'trial',
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  stripe_customer_id text,
  stripe_subscription_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- Step 2: Organization members (links users to orgs)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',  -- owner, admin, member, viewer
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- ────────────────────────────────────────────────────────────────────────────
-- Step 3: Helper function — get current user's org_id (used in RLS)
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_org_id() RETURNS uuid AS $$
  SELECT organization_id FROM organization_members
  WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 4: RLS on organizations & organization_members
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member_read" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "org_member_update" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_members_read" ON organization_members
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "org_members_manage" ON organization_members
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Allow any authenticated user to INSERT into organizations (for new signup org creation)
CREATE POLICY "org_create" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow any authenticated user to INSERT themselves into organization_members
CREATE POLICY "org_members_self_insert" ON organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────────
-- Step 5: Add organization_id to core tables (first batch — 15 tables)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE service_users ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE shift_patterns ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE shift_types ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE care_logs ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE healthcare_logs ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE rota_areas ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Also add to users table for quick lookups
ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- ────────────────────────────────────────────────────────────────────────────
-- Step 6: Create default org & backfill existing data
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO organizations (id, name, slug, plan, trial_ends_at, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Accredilink CRT',
  'accredilink-crt',
  'professional',
  now() + interval '1 year',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Assign all existing auth.users to the default org
INSERT INTO organization_members (organization_id, user_id, role)
SELECT '00000000-0000-0000-0000-000000000001', id, 'member'
FROM auth.users
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Backfill organization_id on all existing rows in the first batch
UPDATE service_users SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE shifts SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE shift_calls SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE shift_patterns SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE shift_types SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE care_logs SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE healthcare_logs SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE rota_areas SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE invoicing_settings SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE clients SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE recurring_invoices SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE payments SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE messages SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE conversations SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;
UPDATE users SET organization_id = '00000000-0000-0000-0000-000000000001' WHERE organization_id IS NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- Step 7: Update RLS policies for org isolation on core tables
-- Drop old permissive policies and create org-scoped ones.
-- ────────────────────────────────────────────────────────────────────────────

-- service_users
DROP POLICY IF EXISTS "service_users_auth_all" ON service_users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON service_users;
CREATE POLICY "service_users_org" ON service_users FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- shifts
DROP POLICY IF EXISTS "shifts_auth_all" ON shifts;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON shifts;
CREATE POLICY "shifts_org" ON shifts FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- shift_calls
DROP POLICY IF EXISTS "shift_calls_auth_all" ON shift_calls;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON shift_calls;
CREATE POLICY "shift_calls_org" ON shift_calls FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- shift_patterns
DROP POLICY IF EXISTS "shift_patterns_auth_all" ON shift_patterns;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON shift_patterns;
CREATE POLICY "shift_patterns_org" ON shift_patterns FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- shift_types
DROP POLICY IF EXISTS "shift_types_auth_all" ON shift_types;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON shift_types;
CREATE POLICY "shift_types_org" ON shift_types FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- care_logs
DROP POLICY IF EXISTS "care_logs_auth_all" ON care_logs;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON care_logs;
CREATE POLICY "care_logs_org" ON care_logs FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- healthcare_logs
DROP POLICY IF EXISTS "healthcare_logs_auth_all" ON healthcare_logs;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON healthcare_logs;
CREATE POLICY "healthcare_logs_org" ON healthcare_logs FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- rota_areas
DROP POLICY IF EXISTS "rota_areas_auth_all" ON rota_areas;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON rota_areas;
CREATE POLICY "rota_areas_org" ON rota_areas FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- invoices (has invoices_auth_all from 001 + invoices_full_access from 044)
DROP POLICY IF EXISTS "invoices_auth_all" ON invoices;
DROP POLICY IF EXISTS "invoices_full_access" ON invoices;
CREATE POLICY "invoices_org" ON invoices FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- invoicing_settings (RLS was DISABLED in 048 — re-enable it)
ALTER TABLE invoicing_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "invoicing_settings_auth_all" ON invoicing_settings;
DROP POLICY IF EXISTS "invoicing_settings_full_access" ON invoicing_settings;
CREATE POLICY "invoicing_settings_org" ON invoicing_settings FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- clients (has auth_all from 043 + clients_full_access from 044)
DROP POLICY IF EXISTS "clients_auth_all" ON clients;
DROP POLICY IF EXISTS "auth_all" ON clients;
DROP POLICY IF EXISTS "clients_full_access" ON clients;
CREATE POLICY "clients_org" ON clients FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- recurring_invoices (has auth_all from 043 + recurring_invoices_full_access from 044)
DROP POLICY IF EXISTS "recurring_invoices_auth_all" ON recurring_invoices;
DROP POLICY IF EXISTS "auth_all" ON recurring_invoices;
DROP POLICY IF EXISTS "recurring_invoices_full_access" ON recurring_invoices;
CREATE POLICY "recurring_invoices_org" ON recurring_invoices FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- payments (has payments_auth_all from 001 + payments_full_access from 044)
DROP POLICY IF EXISTS "payments_auth_all" ON payments;
DROP POLICY IF EXISTS "payments_full_access" ON payments;
CREATE POLICY "payments_org" ON payments FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- messages
DROP POLICY IF EXISTS "messages_auth_all" ON messages;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON messages;
CREATE POLICY "messages_org" ON messages FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- conversations
DROP POLICY IF EXISTS "conversations_auth_all" ON conversations;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON conversations;
CREATE POLICY "conversations_org" ON conversations FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- users
DROP POLICY IF EXISTS "users_auth_all" ON users;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON users;
CREATE POLICY "users_org" ON users FOR ALL
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- ────────────────────────────────────────────────────────────────────────────
-- Step 8: Create indexes for performance
-- ────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_service_users_org ON service_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_shifts_org ON shifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_shift_calls_org ON shift_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_org ON care_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_logs_org ON healthcare_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);

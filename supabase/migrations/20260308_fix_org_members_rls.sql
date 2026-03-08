-- Fix infinite recursion: organization_members cannot use auth_org_id()
-- because auth_org_id() queries organization_members itself.
-- Use direct auth.uid() check instead.

-- Drop all existing policies on organization_members
DROP POLICY IF EXISTS "organization_members_org_isolation" ON organization_members;
DROP POLICY IF EXISTS "org_members_read" ON organization_members;
DROP POLICY IF EXISTS "org_members_manage" ON organization_members;
DROP POLICY IF EXISTS "org_members_self_insert" ON organization_members;
DROP POLICY IF EXISTS "org_members_own" ON organization_members;

-- Users can see their own memberships
CREATE POLICY "org_members_own" ON organization_members
  FOR SELECT USING (user_id = auth.uid());

-- Users can insert themselves (for joining via invite code)
CREATE POLICY "org_members_self_insert" ON organization_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Owners/admins can manage members in their org
CREATE POLICY "org_members_manage" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

-- Also fix organizations table — don't use auth_org_id(), use direct membership check
DROP POLICY IF EXISTS "organizations_org_isolation" ON organizations;
DROP POLICY IF EXISTS "org_member_read" ON organizations;
DROP POLICY IF EXISTS "org_member_update" ON organizations;
DROP POLICY IF EXISTS "org_create" ON organizations;

-- Users can see orgs they belong to
CREATE POLICY "org_member_read" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Owners/admins can update their org
CREATE POLICY "org_member_update" ON organizations
  FOR UPDATE USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Any authenticated user can create an org (for signup)
CREATE POLICY "org_create" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Also fix profiles — should NOT use org isolation, just self-access
DROP POLICY IF EXISTS "profiles_org_isolation" ON profiles;
DROP POLICY IF EXISTS "profiles_self" ON profiles;

CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow service role (triggers) to insert profiles for new users
DROP POLICY IF EXISTS "profiles_insert_any" ON profiles;
CREATE POLICY "profiles_insert_any" ON profiles
  FOR INSERT WITH CHECK (true);

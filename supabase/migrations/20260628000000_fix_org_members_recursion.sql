-- Fix infinite recursion in organization_members RLS policies.
-- The original policies queried organization_members from within
-- organization_members policies, causing a recursive loop.
-- Solution: a SECURITY DEFINER function that reads the table without
-- triggering RLS, used as the basis for all membership checks.

CREATE OR REPLACE FUNCTION get_my_org_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;

-- Drop the recursive policies
DROP POLICY IF EXISTS "org_members_read"   ON organization_members;
DROP POLICY IF EXISTS "org_members_manage" ON organization_members;
DROP POLICY IF EXISTS "org_member_read"    ON organizations;
DROP POLICY IF EXISTS "org_member_update"  ON organizations;

-- Recreate using the non-recursive function
CREATE POLICY "org_members_read" ON organization_members
  FOR SELECT USING (
    organization_id IN (SELECT get_my_org_ids())
  );

CREATE POLICY "org_members_manage" ON organization_members
  FOR ALL USING (
    organization_id IN (SELECT get_my_org_ids())
  ) WITH CHECK (
    organization_id IN (SELECT get_my_org_ids())
  );

CREATE POLICY "org_member_read" ON organizations
  FOR SELECT USING (
    id IN (SELECT get_my_org_ids())
  );

CREATE POLICY "org_member_update" ON organizations
  FOR UPDATE USING (
    id IN (SELECT get_my_org_ids())
  );

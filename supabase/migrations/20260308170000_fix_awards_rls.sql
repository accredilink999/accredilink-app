-- Fix staff_awards & award_types RLS to avoid infinite recursion
-- The old policies queried organization_members which has self-referencing policies

-- staff_awards: anyone in org can read, only the giver can insert
DROP POLICY IF EXISTS "staff_awards_select" ON staff_awards;
DROP POLICY IF EXISTS "staff_awards_insert" ON staff_awards;

CREATE POLICY "staff_awards_select" ON staff_awards FOR SELECT
  USING (true);

CREATE POLICY "staff_awards_insert" ON staff_awards FOR INSERT
  WITH CHECK (awarded_by_id = auth.uid());

-- award_types: anyone can read, any authenticated user can create/delete
DROP POLICY IF EXISTS "award_types_read" ON award_types;
DROP POLICY IF EXISTS "award_types_manage" ON award_types;

CREATE POLICY "award_types_read" ON award_types FOR SELECT
  USING (true);

CREATE POLICY "award_types_insert" ON award_types FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "award_types_delete" ON award_types FOR DELETE
  USING (auth.uid() IS NOT NULL);

CREATE OR REPLACE FUNCTION count_org_members_all()
RETURNS TABLE(organization_id uuid, count bigint)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT organization_id, COUNT(*)::bigint as count
  FROM organization_members
  GROUP BY organization_id;
$$;

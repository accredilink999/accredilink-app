-- Add invite_code to organizations for staff self-signup
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

-- Generate a random 8-char invite code for the default org
UPDATE organizations
SET invite_code = upper(substring(md5(random()::text) from 1 for 8))
WHERE invite_code IS NULL;

-- Allow anyone authenticated to read org by invite_code (for joining)
CREATE OR REPLACE FUNCTION find_org_by_invite_code(code text)
RETURNS TABLE(id uuid, name text, slug text) AS $$
  SELECT id, name, slug FROM organizations
  WHERE invite_code = upper(code) AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

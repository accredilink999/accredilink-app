-- Fix handle_new_user trigger to create orgs on signup
-- and fix trial period to 7 days
-- Ensure invite_code column exists (may not have been applied yet)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS invite_code text UNIQUE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _company text;
  _invite text;
  _org_id uuid;
  _slug text;
  _invite_code text;
BEGIN
  -- Always create profile (safe — ON CONFLICT DO NOTHING)
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  _company := NEW.raw_user_meta_data->>'company_name';
  _invite  := upper(trim(COALESCE(NEW.raw_user_meta_data->>'invite_code', '')));

  -- OWNER signup: create a new organization
  IF _company IS NOT NULL AND _company <> '' THEN
    BEGIN
      _slug := lower(regexp_replace(_company, '[^a-zA-Z0-9]+', '-', 'g'));
      _slug := _slug || '-' || substr(md5(random()::text), 1, 6);
      _invite_code := upper(substr(md5(random()::text), 1, 8));

      INSERT INTO organizations (name, slug, invite_code, plan, trial_ends_at, is_active)
      VALUES (_company, _slug, _invite_code, 'trial', now() + interval '7 days', true)
      RETURNING id INTO _org_id;

      INSERT INTO organization_members (organization_id, user_id, role)
      VALUES (_org_id, NEW.id, 'owner');
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user org creation failed: %', SQLERRM;
    END;

  -- STAFF signup: join existing org via invite code
  ELSIF _invite <> '' THEN
    BEGIN
      SELECT id INTO _org_id FROM organizations
      WHERE invite_code = _invite AND is_active = true
      LIMIT 1;

      IF _org_id IS NOT NULL THEN
        INSERT INTO organization_members (organization_id, user_id, role)
        VALUES (_org_id, NEW.id, 'member')
        ON CONFLICT (organization_id, user_id) DO NOTHING;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'handle_new_user staff join failed: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix trial period default to 7 days
ALTER TABLE organizations ALTER COLUMN trial_ends_at SET DEFAULT (now() + interval '7 days');

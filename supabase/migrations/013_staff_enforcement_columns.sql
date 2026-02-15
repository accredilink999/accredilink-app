-- ============================================================
-- 013: Staff enforcement & onboarding columns
-- ============================================================

-- profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enforce_gps BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enforce_camera BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS enforce_notifications BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;

-- users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS enforce_gps BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS enforce_camera BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS enforce_notifications BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS area_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS page_access JSONB DEFAULT '{}';

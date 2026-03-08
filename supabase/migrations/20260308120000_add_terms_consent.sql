-- Add terms consent tracking columns to profiles
-- Required by Apple App Store (5.1.1) and Google Play for GDPR audit trail

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version TEXT;

-- Backfill all existing users so they are NOT blocked by the consent gate
-- Only new users (signing up after this migration) will see the consent screen
UPDATE profiles
SET terms_accepted_at = NOW(), terms_version = '2026-03'
WHERE terms_accepted_at IS NULL;

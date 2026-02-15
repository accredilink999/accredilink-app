-- 006_care_teams_extended.sql — Add named team group columns to care_teams
-- The original table was a staff-to-client junction table.
-- The app uses care_teams as named groups with member arrays.

ALTER TABLE care_teams ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE care_teams ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE care_teams ADD COLUMN IF NOT EXISTS member_ids UUID[] DEFAULT '{}';
ALTER TABLE care_teams ADD COLUMN IF NOT EXISTS member_names TEXT[] DEFAULT '{}';

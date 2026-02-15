-- Add staff_name column to locations table
-- The app sends staff_name when creating GPS location records
ALTER TABLE locations ADD COLUMN IF NOT EXISTS staff_name TEXT;

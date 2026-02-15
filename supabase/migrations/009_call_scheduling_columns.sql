-- 009_call_scheduling_columns.sql
-- Add missing columns to shift_calls and client_calls
-- that the frontend code already references.

-- ============================================================
-- shift_calls: check-in/check-out and scheduling columns
-- ============================================================
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS scheduled_time TEXT;
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS service_user_address TEXT;
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS clock_in_time TIMESTAMPTZ;
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS clock_out_time TIMESTAMPTZ;
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS drove_to_call BOOLEAN;
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS checkin_latitude NUMERIC;
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS checkin_longitude NUMERIC;

-- ============================================================
-- client_calls: scheduling and denormalized display columns
-- ============================================================
ALTER TABLE client_calls ADD COLUMN IF NOT EXISTS scheduled_time TEXT;
ALTER TABLE client_calls ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE client_calls ADD COLUMN IF NOT EXISTS service_user_name TEXT;
ALTER TABLE client_calls ADD COLUMN IF NOT EXISTS service_user_address TEXT;
ALTER TABLE client_calls ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- ============================================================
-- Backfill: copy existing data into new columns where synonyms exist
-- ============================================================
UPDATE shift_calls SET scheduled_time = call_time WHERE scheduled_time IS NULL AND call_time IS NOT NULL;
UPDATE client_calls SET scheduled_time = call_time WHERE scheduled_time IS NULL AND call_time IS NOT NULL;
UPDATE client_calls SET duration_minutes = duration WHERE duration_minutes IS NULL AND duration IS NOT NULL;

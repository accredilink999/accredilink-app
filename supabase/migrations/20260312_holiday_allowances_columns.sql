-- Add missing columns to holiday_allowances table
ALTER TABLE holiday_allowances ADD COLUMN IF NOT EXISTS total_hours NUMERIC DEFAULT 0;
ALTER TABLE holiday_allowances ADD COLUMN IF NOT EXISTS pending_days NUMERIC DEFAULT 0;

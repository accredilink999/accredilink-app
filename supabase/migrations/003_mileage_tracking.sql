-- 003_mileage_tracking.sql — GPS mileage tracking columns

-- Add drive/GPS columns to shift_calls for persisting "Did you drive?" answers
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS drove_to_call BOOLEAN DEFAULT NULL;
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS checkin_latitude NUMERIC;
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS checkin_longitude NUMERIC;

-- Add weekly grouping columns to expenses for Sun-Sat claim periods
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS week_start_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS week_end_date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_due_date DATE;

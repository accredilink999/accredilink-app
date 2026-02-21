-- 037_expenses_add_missing_columns.sql
-- Add 'date' and 'mileage_distance' columns used by edge functions and frontend
-- The original schema used 'expense_date' and 'mileage'; newer code uses 'date' and 'mileage_distance'

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS mileage_distance NUMERIC DEFAULT 0;

-- Also add approved_by, approved_at, rejection_reason, reviewed_by, reviewed_by_name
-- used by the approval workflow
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reviewed_by_name TEXT;

-- Add paired_shift_id and paired_staff_name columns to shifts table
-- The code expects these columns but only paired_staff_id existed in the original schema

ALTER TABLE shifts ADD COLUMN IF NOT EXISTS paired_shift_id UUID REFERENCES shifts(id);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS paired_staff_name TEXT;

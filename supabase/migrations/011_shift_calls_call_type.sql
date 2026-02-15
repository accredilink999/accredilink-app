-- 011_shift_calls_call_type.sql
-- Add call_type column so each ShiftCall can represent a single call type
-- (e.g. "Meal", "Medication") rather than bundling multiple types into one record.

ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS call_type TEXT;

-- Add start_date column to shift_patterns
ALTER TABLE shift_patterns ADD COLUMN IF NOT EXISTS start_date TEXT;

-- Add repeat_count column to shift_patterns
ALTER TABLE shift_patterns ADD COLUMN IF NOT EXISTS repeat_count INTEGER DEFAULT 1;

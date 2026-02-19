-- 024_shifts_add_pattern_id.sql
-- Track which shift pattern created/assigned each shift, so deleting
-- a pattern can revert its shifts back to blank.

ALTER TABLE shifts ADD COLUMN IF NOT EXISTS shift_pattern_id UUID REFERENCES shift_patterns(id) ON DELETE SET NULL;

-- Add shift_id to sitting_logs so logs can be linked to a specific shift
ALTER TABLE sitting_logs ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL;

-- Index for fast lookup by shift
CREATE INDEX IF NOT EXISTS idx_sitting_logs_shift_id ON sitting_logs(shift_id);

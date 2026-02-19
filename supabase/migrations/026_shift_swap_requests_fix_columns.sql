-- Add missing columns to shift_swap_requests that the app code expects
-- The original schema used target_staff_id/target_staff_name but the app
-- was written to use swap_with_id/swap_with_name + extra fields.

ALTER TABLE shift_swap_requests
  ADD COLUMN IF NOT EXISTS swap_with_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS swap_with_name TEXT,
  ADD COLUMN IF NOT EXISTS shift_date TEXT,
  ADD COLUMN IF NOT EXISTS shift_name TEXT,
  ADD COLUMN IF NOT EXISTS reason TEXT;

-- Copy any existing data from old columns to new ones
UPDATE shift_swap_requests
SET swap_with_id = target_staff_id,
    swap_with_name = target_staff_name
WHERE swap_with_id IS NULL AND target_staff_id IS NOT NULL;

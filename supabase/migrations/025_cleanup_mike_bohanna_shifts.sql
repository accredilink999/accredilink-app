-- 025_cleanup_mike_bohanna_shifts.sql
-- Revert all shifts created by Mike Bohanna's pattern back to blank (available).
-- Also delete any shift_calls associated with those shifts.

-- 1. Delete shift_calls for Mike Bohanna's shifts
DELETE FROM shift_calls
WHERE shift_id IN (
  SELECT id FROM shifts
  WHERE staff_name ILIKE '%bohann%'
     OR staff_name ILIKE '%mike b%'
);

-- 2. Revert Mike Bohanna's shifts to blank (available to claim)
UPDATE shifts
SET staff_id = NULL,
    staff_name = NULL,
    shift_pattern_id = NULL,
    status = 'available'
WHERE staff_name ILIKE '%bohann%'
   OR staff_name ILIKE '%mike b%';

-- 3. Delete any orphaned shift_patterns for Mike Bohanna
DELETE FROM shift_patterns
WHERE staff_name ILIKE '%bohann%'
   OR staff_name ILIKE '%mike b%';

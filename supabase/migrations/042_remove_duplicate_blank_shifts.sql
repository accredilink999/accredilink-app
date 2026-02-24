-- 042_remove_duplicate_blank_shifts.sql
-- Remove duplicate blank shifts that were incorrectly created by migration 041.
-- These are blank (staff_id IS NULL) base shifts in the Feb 24 - May 31 range
-- that exist alongside already-assigned shifts for the same slot.
-- The correct behavior: patterns fill blank shifts, so when a slot is filled
-- the blank becomes the assigned shift (not a separate record).

DELETE FROM shifts
WHERE staff_id IS NULL
  AND is_base_shift = true
  AND date >= '2026-02-24'
  AND date <= '2026-05-31';

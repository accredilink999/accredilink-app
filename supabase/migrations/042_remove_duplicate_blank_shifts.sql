-- 042_remove_duplicate_blank_shifts.sql
-- Clean up blank shift duplicates:
-- 1. Remove blanks where an assigned shift already exists for the same slot
-- 2. Deduplicate remaining blanks (keep one per slot)

-- Step 1: Clear pairing refs pointing to blanks we'll delete
UPDATE shifts SET paired_shift_id = NULL, paired_staff_name = NULL
WHERE paired_shift_id IN (
  SELECT blank.id
  FROM shifts blank
  JOIN shifts assigned
    ON  assigned.date         = blank.date
    AND assigned.shift_name   = blank.shift_name
    AND assigned.start_time   = blank.start_time
    AND assigned.end_time     = blank.end_time
    AND assigned.rota_area_id = blank.rota_area_id
    AND assigned.staff_id IS NOT NULL
  WHERE blank.staff_id IS NULL
    AND blank.is_base_shift = true
);

-- Step 2: Delete blanks sitting alongside assigned shifts
DELETE FROM shifts
WHERE id IN (
  SELECT blank.id
  FROM shifts blank
  JOIN shifts assigned
    ON  assigned.date         = blank.date
    AND assigned.shift_name   = blank.shift_name
    AND assigned.start_time   = blank.start_time
    AND assigned.end_time     = blank.end_time
    AND assigned.rota_area_id = blank.rota_area_id
    AND assigned.staff_id IS NOT NULL
  WHERE blank.staff_id IS NULL
    AND blank.is_base_shift = true
);

-- Step 3: Clear pairing refs pointing to duplicate blanks
UPDATE shifts SET paired_shift_id = NULL, paired_staff_name = NULL
WHERE paired_shift_id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY date, shift_name, start_time, end_time, rota_area_id
        ORDER BY created_at
      ) AS rn
    FROM shifts
    WHERE staff_id IS NULL
      AND is_base_shift = true
  ) dupes
  WHERE rn > 1
);

-- Step 4: Delete duplicate blanks (keep oldest per slot)
DELETE FROM shifts
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY date, shift_name, start_time, end_time, rota_area_id
        ORDER BY created_at
      ) AS rn
    FROM shifts
    WHERE staff_id IS NULL
      AND is_base_shift = true
  ) dupes
  WHERE rn > 1
);

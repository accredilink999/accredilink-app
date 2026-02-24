-- 040_recover_orphaned_shift_areas.sql
-- Recover area assignments for shifts that lost their area (e.g. had 'default').
-- Strategy: use shift_pattern's rota_area_id if available.

-- 1. Recover from shift_pattern (most reliable — patterns always have an area)
UPDATE shifts s
SET rota_area_id = sp.rota_area_id,
    area_id = sp.rota_area_id::uuid
FROM shift_patterns sp
WHERE s.shift_pattern_id = sp.id
  AND s.area_id IS NULL
  AND s.rota_area_id IS NULL
  AND sp.rota_area_id IS NOT NULL;

-- 2. For remaining orphans with no pattern, try to infer from nearby shifts
-- by the same staff member on the same date
UPDATE shifts orphan
SET rota_area_id = neighbor.rota_area_id,
    area_id = neighbor.area_id
FROM shifts neighbor
WHERE orphan.area_id IS NULL
  AND orphan.rota_area_id IS NULL
  AND orphan.staff_id IS NOT NULL
  AND neighbor.staff_id = orphan.staff_id
  AND neighbor.date = orphan.date
  AND neighbor.area_id IS NOT NULL
  AND neighbor.id != orphan.id;

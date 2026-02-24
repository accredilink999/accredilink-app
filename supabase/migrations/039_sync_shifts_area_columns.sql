-- 039_sync_shifts_area_columns.sql
-- The shifts table has area_id (UUID, original) and rota_area_id (TEXT, added later).
-- Different code paths wrote to one or the other. This migration syncs them.

-- First, clean up invalid rota_area_id values (e.g. 'default')
UPDATE shifts
SET rota_area_id = NULL
WHERE rota_area_id IS NOT NULL
  AND rota_area_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Copy rota_area_id → area_id where area_id is NULL but rota_area_id is a valid UUID
UPDATE shifts
SET area_id = rota_area_id::uuid
WHERE area_id IS NULL AND rota_area_id IS NOT NULL;

-- Copy area_id → rota_area_id where rota_area_id is NULL but area_id is set
UPDATE shifts
SET rota_area_id = area_id::text
WHERE rota_area_id IS NULL AND area_id IS NOT NULL;

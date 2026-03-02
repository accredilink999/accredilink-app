-- Backfill missing shift_calls for service users whose call times
-- start within a shift but were excluded because call+duration > shift end.

WITH missing_calls AS (
  SELECT
    s.id AS shift_id,
    su.id AS service_user_id,
    su.full_name AS service_user_name,
    COALESCE(su.address, '') AS service_user_address,
    ct->>'time' AS scheduled_time,
    ct->>'time' AS call_time,
    s.date AS call_date,
    COALESCE(ct->>'type', 'visit') AS call_type,
    COALESCE((ct->>'duration')::int, 30) AS duration_minutes
  FROM shifts s
  CROSS JOIN service_users su
  CROSS JOIN LATERAL jsonb_array_elements(su.call_times::jsonb) AS ct
  WHERE s.date >= CURRENT_DATE
    AND s.staff_id IS NOT NULL
    AND su.call_times IS NOT NULL
    AND jsonb_array_length(su.call_times::jsonb) > 0
    -- Match area: service_users.area_id vs shifts.rota_area_id or shifts.area_id
    AND (
      su.area_id::text = COALESCE(s.rota_area_id, s.area_id::text)
      OR su.area_id IS NULL
    )
    -- Call STARTS within shift window
    AND (
      EXTRACT(HOUR FROM (ct->>'time')::time) * 60 + EXTRACT(MINUTE FROM (ct->>'time')::time)
    ) >= (
      EXTRACT(HOUR FROM s.start_time::time) * 60 + EXTRACT(MINUTE FROM s.start_time::time)
    )
    AND (
      EXTRACT(HOUR FROM (ct->>'time')::time) * 60 + EXTRACT(MINUTE FROM (ct->>'time')::time)
    ) < (
      EXTRACT(HOUR FROM s.end_time::time) * 60 + EXTRACT(MINUTE FROM s.end_time::time)
    )
    -- Call END exceeds shift end (these are the ones that were previously missed)
    AND (
      EXTRACT(HOUR FROM (ct->>'time')::time) * 60 + EXTRACT(MINUTE FROM (ct->>'time')::time)
      + COALESCE((ct->>'duration')::int, 30)
    ) > (
      EXTRACT(HOUR FROM s.end_time::time) * 60 + EXTRACT(MINUTE FROM s.end_time::time)
    )
    -- Not already on this shift
    AND NOT EXISTS (
      SELECT 1 FROM shift_calls sc
      WHERE sc.shift_id = s.id
        AND sc.service_user_id = su.id
        AND LEFT(COALESCE(sc.scheduled_time, sc.call_time), 5) = LEFT(ct->>'time', 5)
    )
)
INSERT INTO shift_calls (
  shift_id, service_user_id, service_user_name, service_user_address,
  scheduled_time, call_time, call_date, call_type, duration_minutes, status
)
SELECT
  shift_id, service_user_id, service_user_name, service_user_address,
  scheduled_time, call_time, call_date, call_type, duration_minutes, 'pending'
FROM missing_calls;

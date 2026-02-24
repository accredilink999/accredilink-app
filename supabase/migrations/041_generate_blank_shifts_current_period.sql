-- 041_generate_blank_shifts_current_period.sql
-- Generate blank (available-to-claim) shifts for the period Feb 24 - May 31 2026.
-- These were consumed when staff patterns were deployed and never re-generated.
-- Only creates shifts where a blank doesn't already exist for the same slot.

-- Helper: generate dates
DO $$
DECLARE
  d DATE;
  dow INT;  -- 0=Sun, 1=Mon, ..., 6=Sat
  denbigh_id UUID := 'c279d172-c442-451c-92aa-30c5df534325';
  llangollen_id UUID := 'e5b426ca-170a-46c0-9507-e1c5c5237c6b';
BEGIN
  FOR d IN SELECT generate_series('2026-02-24'::date, '2026-05-31'::date, '1 day'::interval)::date
  LOOP
    dow := EXTRACT(DOW FROM d);  -- 0=Sun, 1=Mon, ..., 6=Sat

    -- ── Denbigh Team ──

    -- Denbigh Early x2 (07:30-13:30, all 7 days)
    INSERT INTO shifts (date, start_time, end_time, shift_name, rota_area_id, area_id, status, is_base_shift, staff_id, staff_name)
    SELECT d, '07:30', '13:30', 'Early Denbigh', denbigh_id, denbigh_id, 'scheduled', true, NULL, NULL
    FROM generate_series(1, 2) AS slot
    WHERE NOT EXISTS (
      SELECT 1 FROM shifts s
      WHERE s.date = d AND s.shift_name = 'Early Denbigh'
        AND s.start_time = '07:30' AND s.end_time = '13:30'
        AND s.staff_id IS NULL
        AND (s.rota_area_id = denbigh_id::text OR s.area_id = denbigh_id)
      OFFSET slot - 1 LIMIT 1
    );

    -- Denbigh Late x2 (15:15-21:15, all 7 days)
    INSERT INTO shifts (date, start_time, end_time, shift_name, rota_area_id, area_id, status, is_base_shift, staff_id, staff_name)
    SELECT d, '15:15', '21:15', 'Late Denbigh', denbigh_id, denbigh_id, 'scheduled', true, NULL, NULL
    FROM generate_series(1, 2) AS slot
    WHERE NOT EXISTS (
      SELECT 1 FROM shifts s
      WHERE s.date = d AND s.shift_name = 'Late Denbigh'
        AND s.start_time = '15:15' AND s.end_time = '21:15'
        AND s.staff_id IS NULL
        AND (s.rota_area_id = denbigh_id::text OR s.area_id = denbigh_id)
      OFFSET slot - 1 LIMIT 1
    );

    -- Sit In E x1 (08:30-14:30, all 7 days)
    INSERT INTO shifts (date, start_time, end_time, shift_name, rota_area_id, area_id, status, is_base_shift, staff_id, staff_name)
    SELECT d, '08:30', '14:30', 'Sit In E', denbigh_id, denbigh_id, 'scheduled', true, NULL, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM shifts s
      WHERE s.date = d AND s.shift_name = 'Sit In E'
        AND s.start_time = '08:30' AND s.end_time = '14:30'
        AND s.staff_id IS NULL
        AND (s.rota_area_id = denbigh_id::text OR s.area_id = denbigh_id)
    );

    -- Sit In L x1 (14:30-20:30, all 7 days)
    INSERT INTO shifts (date, start_time, end_time, shift_name, rota_area_id, area_id, status, is_base_shift, staff_id, staff_name)
    SELECT d, '14:30', '20:30', 'Sit In L', denbigh_id, denbigh_id, 'scheduled', true, NULL, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM shifts s
      WHERE s.date = d AND s.shift_name = 'Sit In L'
        AND s.start_time = '14:30' AND s.end_time = '20:30'
        AND s.staff_id IS NULL
        AND (s.rota_area_id = denbigh_id::text OR s.area_id = denbigh_id)
    );

    -- ── Llangollen Team ──

    -- Llangollen Early x1 (07:00-14:00, all 7 days)
    INSERT INTO shifts (date, start_time, end_time, shift_name, rota_area_id, area_id, status, is_base_shift, staff_id, staff_name)
    SELECT d, '07:00', '14:00', 'Llangollen early', llangollen_id, llangollen_id, 'scheduled', true, NULL, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM shifts s
      WHERE s.date = d AND s.shift_name = 'Llangollen early'
        AND s.start_time = '07:00' AND s.end_time = '14:00'
        AND s.staff_id IS NULL
        AND (s.rota_area_id = llangollen_id::text OR s.area_id = llangollen_id)
    );

    -- Llangollen Late x1 (17:00-23:00, all 7 days)
    INSERT INTO shifts (date, start_time, end_time, shift_name, rota_area_id, area_id, status, is_base_shift, staff_id, staff_name)
    SELECT d, '17:00', '23:00', 'Llangollen late', llangollen_id, llangollen_id, 'scheduled', true, NULL, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM shifts s
      WHERE s.date = d AND s.shift_name = 'Llangollen late'
        AND s.start_time = '17:00' AND s.end_time = '23:00'
        AND s.staff_id IS NULL
        AND (s.rota_area_id = llangollen_id::text OR s.area_id = llangollen_id)
    );

    -- David Social x1 (14:00-16:00, Mon/Tue/Thu/Fri only)
    IF dow IN (1, 2, 4, 5) THEN
      INSERT INTO shifts (date, start_time, end_time, shift_name, rota_area_id, area_id, status, is_base_shift, staff_id, staff_name)
      SELECT d, '14:00', '16:00', 'David social', llangollen_id, llangollen_id, 'scheduled', true, NULL, NULL
      WHERE NOT EXISTS (
        SELECT 1 FROM shifts s
        WHERE s.date = d AND s.shift_name = 'David social'
          AND s.start_time = '14:00' AND s.end_time = '16:00'
          AND s.staff_id IS NULL
          AND (s.rota_area_id = llangollen_id::text OR s.area_id = llangollen_id)
      );
    END IF;

  END LOOP;
END;
$$;

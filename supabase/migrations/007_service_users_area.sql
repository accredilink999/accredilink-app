-- 007_service_users_area.sql — Add area_id to service_users so clients can be assigned to rota areas

ALTER TABLE service_users ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES rota_areas(id);

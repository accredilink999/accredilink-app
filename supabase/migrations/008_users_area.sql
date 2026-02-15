-- 008_users_area.sql — Add area_id to users so staff can be assigned to rota areas

ALTER TABLE users ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES rota_areas(id);

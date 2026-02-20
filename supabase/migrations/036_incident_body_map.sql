ALTER TABLE incidents ADD COLUMN IF NOT EXISTS body_map_markers JSONB DEFAULT '[]';

-- Add body_map_markers JSONB column for interactive body map
-- Stores array of markers: [{x, y, side, note}] with normalized 0-1 coordinates
ALTER TABLE care_logs ADD COLUMN IF NOT EXISTS body_map_markers JSONB DEFAULT '[]';

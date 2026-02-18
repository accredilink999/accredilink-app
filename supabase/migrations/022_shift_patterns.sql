-- 022_shift_patterns.sql
-- Create shift_patterns table for storing reusable rota patterns.

CREATE TABLE IF NOT EXISTS shift_patterns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name    TEXT NOT NULL,
  staff_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  staff_name      TEXT,
  pattern_type    TEXT NOT NULL DEFAULT 'weekly',
  rota_area_id    UUID REFERENCES rota_areas(id) ON DELETE SET NULL,
  rota_area_name  TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  shifts          JSONB DEFAULT '[]'::jsonb,
  days_of_week    JSONB DEFAULT '[]'::jsonb,
  start_time      TEXT,
  end_time        TEXT,
  call_templates  JSONB DEFAULT '[]'::jsonb,
  repeat_count    INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shift_patterns ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "shift_patterns_auth_all" ON shift_patterns
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shift_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shift_patterns_updated_at
  BEFORE UPDATE ON shift_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_shift_patterns_updated_at();

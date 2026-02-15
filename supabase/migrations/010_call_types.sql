-- 010_call_types.sql — Dynamic call type options manageable by admin

CREATE TABLE IF NOT EXISTS call_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  color TEXT DEFAULT '#0d9488',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE call_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_types_all" ON call_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed defaults
INSERT INTO call_types (name, sort_order) VALUES
  ('Visit', 0),
  ('Check In', 1),
  ('Personal Care', 2),
  ('Medication', 3),
  ('Wellness Check', 4),
  ('Meal', 5),
  ('Drinks', 6);

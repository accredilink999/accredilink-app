-- Create client_feedback table
CREATE TABLE IF NOT EXISTS client_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  reviewer_name TEXT,
  reviewer_email TEXT,
  reviewer_relationship TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  source TEXT DEFAULT 'internal',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  organization_id TEXT
);

-- Enable RLS
ALTER TABLE client_feedback ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write
CREATE POLICY "Allow authenticated read" ON client_feedback
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON client_feedback
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON client_feedback
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON client_feedback
  FOR DELETE TO authenticated USING (true);

-- Allow service_role full access
CREATE POLICY "Allow service_role all" ON client_feedback
  FOR ALL TO service_role USING (true) WITH CHECK (true);

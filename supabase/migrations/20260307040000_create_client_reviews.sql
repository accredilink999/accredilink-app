-- Client reviews linked to service users for inspection evidence
CREATE TABLE IF NOT EXISTS client_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_user_id UUID REFERENCES service_users(id) ON DELETE CASCADE,
  service_user_name TEXT,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  relationship TEXT,
  relationship_label TEXT,
  rating NUMERIC(2,1),
  comment TEXT,
  review_date TIMESTAMPTZ,
  source TEXT DEFAULT 'homecare.co.uk',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'declined')),
  homecare_review_id TEXT,
  invited_by TEXT,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  organization_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_reviews_service_user ON client_reviews(service_user_id);
CREATE INDEX IF NOT EXISTS idx_client_reviews_status ON client_reviews(status);
CREATE INDEX IF NOT EXISTS idx_client_reviews_email ON client_reviews(reviewer_email);

-- RLS
ALTER TABLE client_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON client_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert" ON client_reviews
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON client_reviews
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete" ON client_reviews
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow service_role all" ON client_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);

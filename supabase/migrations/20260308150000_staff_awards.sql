-- Staff Awards table
CREATE TABLE IF NOT EXISTS staff_awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id),
  recipient_name TEXT NOT NULL,
  awarded_by_id UUID REFERENCES auth.users(id),
  awarded_by_name TEXT,
  award_type TEXT NOT NULL DEFAULT 'star',
  title TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE staff_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_awards_select" ON staff_awards FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "staff_awards_insert" ON staff_awards FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE INDEX idx_staff_awards_recipient ON staff_awards(recipient_id, created_at DESC);
CREATE INDEX idx_staff_awards_org ON staff_awards(organization_id, created_at DESC);

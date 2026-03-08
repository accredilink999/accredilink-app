-- Custom award types per organisation
CREATE TABLE IF NOT EXISTS award_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '⭐',
  color TEXT NOT NULL DEFAULT 'amber',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE award_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "award_types_read" ON award_types
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "award_types_manage" ON award_types
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_award_types_org ON award_types(organization_id);

-- Add icon/color columns to staff_awards for visual display
ALTER TABLE staff_awards ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '⭐';
ALTER TABLE staff_awards ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'amber';

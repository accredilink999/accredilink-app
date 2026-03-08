-- Organisation photo gallery table
CREATE TABLE IF NOT EXISTS org_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  folder TEXT,
  description TEXT,
  storage_path TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE org_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_photos_select" ON org_photos FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org_photos_insert" ON org_photos FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org_photos_delete" ON org_photos FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  ));

-- Index for fast queries
CREATE INDEX idx_org_photos_org ON org_photos(organization_id);
CREATE INDEX idx_org_photos_folder ON org_photos(organization_id, folder);

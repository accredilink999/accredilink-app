-- Enhance archives table for full soft-delete + retention support
ALTER TABLE archives ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS deleted_by_name TEXT;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS is_restored BOOLEAN DEFAULT false;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS restored_at TIMESTAMPTZ;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS keep_until TIMESTAMPTZ;
ALTER TABLE archives ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Index for auto-delete cron (find expired items quickly)
CREATE INDEX IF NOT EXISTS idx_archives_keep_until ON archives(keep_until) WHERE keep_until IS NOT NULL AND is_restored = false;
CREATE INDEX IF NOT EXISTS idx_archives_org ON archives(organization_id);

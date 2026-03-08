-- Add missing columns to medication_records
ALTER TABLE medication_records ADD COLUMN IF NOT EXISTS is_prn BOOLEAN DEFAULT false;
ALTER TABLE medication_records ADD COLUMN IF NOT EXISTS is_pill_pouch BOOLEAN DEFAULT false;
ALTER TABLE medication_records ADD COLUMN IF NOT EXISTS when_given TEXT[] DEFAULT '{}';

-- Add missing columns to work_calendar_events for extra form fields
ALTER TABLE work_calendar_events ADD COLUMN IF NOT EXISTS assigned_names TEXT[];
ALTER TABLE work_calendar_events ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE work_calendar_events ADD COLUMN IF NOT EXISTS color_code TEXT DEFAULT '#3b82f6';
ALTER TABLE work_calendar_events ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN DEFAULT false;
ALTER TABLE work_calendar_events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled';

-- Add hold fields to service_users if not present
ALTER TABLE service_users ADD COLUMN IF NOT EXISTS hold_type TEXT;
ALTER TABLE service_users ADD COLUMN IF NOT EXISTS hold_remaining_calls INTEGER;

-- Create archived_mar_charts table
CREATE TABLE IF NOT EXISTS archived_mar_charts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id   UUID,
  service_user_name TEXT,
  week_start_date   DATE NOT NULL,
  week_end_date     DATE NOT NULL,
  file_uri          TEXT,
  medications       JSONB,
  administrations   JSONB,
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  organization_id   UUID REFERENCES organizations(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on archived_mar_charts
ALTER TABLE archived_mar_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "archived_mar_charts_auth_all" ON archived_mar_charts
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Org isolation RLS for archived_mar_charts
CREATE POLICY "archived_mar_charts_org_isolation" ON archived_mar_charts
  FOR ALL USING (
    organization_id IS NULL
    OR organization_id = (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() LIMIT 1
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_archived_mar_charts_org ON archived_mar_charts(organization_id);
CREATE INDEX IF NOT EXISTS idx_archived_mar_charts_su ON archived_mar_charts(service_user_id);

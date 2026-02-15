-- Create sitting_logs table for sitting log entries and daily reports
CREATE TABLE IF NOT EXISTS sitting_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id UUID REFERENCES service_users(id) ON DELETE CASCADE,
  service_user_name TEXT,
  visit_type TEXT NOT NULL DEFAULT 'food_drink',
  visitor_name TEXT,
  visit_date TIMESTAMPTZ,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  recorded_by_name TEXT,
  is_daily_report BOOLEAN DEFAULT FALSE,
  report_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE sitting_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read sitting logs
CREATE POLICY "sitting_logs_select" ON sitting_logs
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert sitting logs
CREATE POLICY "sitting_logs_insert" ON sitting_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow all authenticated users to update sitting logs
CREATE POLICY "sitting_logs_update" ON sitting_logs
  FOR UPDATE TO authenticated USING (true);

-- Allow all authenticated users to delete sitting logs
CREATE POLICY "sitting_logs_delete" ON sitting_logs
  FOR DELETE TO authenticated USING (true);

-- Index for fast lookups by service user
CREATE INDEX idx_sitting_logs_service_user ON sitting_logs(service_user_id);
CREATE INDEX idx_sitting_logs_visit_date ON sitting_logs(visit_date);
CREATE INDEX idx_sitting_logs_report_date ON sitting_logs(report_date) WHERE is_daily_report = TRUE;

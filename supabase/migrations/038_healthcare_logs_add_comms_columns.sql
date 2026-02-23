-- Add columns to healthcare_logs so it supports the communication log fields
-- used by HealthcareLogManager (same field names as sitting_logs).
ALTER TABLE healthcare_logs ADD COLUMN IF NOT EXISTS visit_type TEXT;
ALTER TABLE healthcare_logs ADD COLUMN IF NOT EXISTS visitor_name TEXT;
ALTER TABLE healthcare_logs ADD COLUMN IF NOT EXISTS visit_date TIMESTAMPTZ;
ALTER TABLE healthcare_logs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE healthcare_logs ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id);
ALTER TABLE healthcare_logs ADD COLUMN IF NOT EXISTS recorded_by_name TEXT;
ALTER TABLE healthcare_logs ADD COLUMN IF NOT EXISTS is_daily_report BOOLEAN DEFAULT FALSE;
ALTER TABLE healthcare_logs ADD COLUMN IF NOT EXISTS report_date DATE;

-- Index for fast lookups by service user and visit_date
CREATE INDEX IF NOT EXISTS idx_healthcare_logs_service_user ON healthcare_logs(service_user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_logs_visit_date ON healthcare_logs(visit_date);
CREATE INDEX IF NOT EXISTS idx_healthcare_logs_report_date ON healthcare_logs(report_date) WHERE is_daily_report = TRUE;

-- Add custom_fields JSONB column for form-builder custom sections
ALTER TABLE care_logs ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Dedicated table for care log form configurations
-- Supports global, team-specific, and client-specific forms
CREATE TABLE IF NOT EXISTS care_log_form_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Default',
  scope TEXT NOT NULL DEFAULT 'global',        -- 'global', 'team', 'clients'
  scope_ids JSONB DEFAULT '[]',                -- array of team IDs or client UUIDs
  config JSONB NOT NULL DEFAULT '{}',          -- { version, sections: [...] }
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE care_log_form_configs ENABLE ROW LEVEL SECURITY;

-- Everyone can read form configs
CREATE POLICY "care_log_form_configs_select" ON care_log_form_configs
  FOR SELECT USING (true);

-- Only admins can manage form configs
CREATE POLICY "care_log_form_configs_admin" ON care_log_form_configs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Migrate existing config from system_settings if present
INSERT INTO care_log_form_configs (name, scope, scope_ids, config, is_default)
SELECT
  'Default',
  'global',
  '[]'::JSONB,
  setting_value,
  TRUE
FROM system_settings
WHERE setting_key = 'care_log_form_config'
ON CONFLICT DO NOTHING;

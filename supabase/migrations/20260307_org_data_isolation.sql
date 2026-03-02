-- ============================================================
-- Organization-based data isolation
-- Adds organization_id to ALL data tables, backfills existing
-- data, and creates RLS policies that restrict access by org.
-- ============================================================

-- Helper function: returns the current user's organization_id
CREATE OR REPLACE FUNCTION auth_org_id() RETURNS uuid AS $$
  SELECT om.organization_id
  FROM organization_members om
  WHERE om.user_id = auth.uid()
  LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ────────────────────────────────────────────────────────
-- Step 1: Add organization_id to all data tables
-- ────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users',
    'rota_areas',
    'rota_permissions',
    'service_users',
    'shifts',
    'shift_calls',
    'shift_types',
    'shift_patterns',
    'client_calls',
    'care_logs',
    'healthcare_logs',
    'sitting_logs',
    'notifications',
    'notification_settings',
    'messages',
    'conversations',
    'chat_messages',
    'invoices',
    'invoicing_settings',
    'leave_requests',
    'expenses',
    'pay_periods',
    'payroll_records',
    'shift_swap_requests',
    'shift_claim_requests',
    'base_shift_templates',
    'trainings',
    'courses',
    'modules',
    'lessons',
    'course_assignments',
    'course_completions',
    'training_certificates',
    'training_matrix_records',
    'training_matrix_items',
    'documents',
    'document_requirements',
    'hr_documents',
    'medication_administrations',
    'medication_records',
    'assessments',
    'sickness_records',
    'incidents',
    'audit_logs',
    'system_settings',
    'care_log_form_configs',
    'locations',
    'assets',
    'care_teams',
    'forms',
    'form_submissions',
    'archives',
    'work_calendar_events',
    'shared_files',
    'payments',
    'clients',
    'holiday_allowances',
    'recurring_invoices',
    'call_types',
    'announcement_acknowledgements',
    'compliance_reports',
    'safeguarding_reports',
    'supervision_records',
    'meetings',
    'meeting_participants',
    'clinical_observations',
    'wound_records',
    'falls_records',
    'repositioning_records',
    'continence_records'
  ]
  LOOP
    -- Only add column if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id)', t);
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────
-- Step 2: Backfill all existing data with Accredilink org
-- ────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
  accredilink_id uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users',
    'rota_areas',
    'rota_permissions',
    'service_users',
    'shifts',
    'shift_calls',
    'shift_types',
    'shift_patterns',
    'client_calls',
    'care_logs',
    'healthcare_logs',
    'sitting_logs',
    'notifications',
    'notification_settings',
    'messages',
    'conversations',
    'chat_messages',
    'invoices',
    'invoicing_settings',
    'leave_requests',
    'expenses',
    'pay_periods',
    'payroll_records',
    'shift_swap_requests',
    'shift_claim_requests',
    'base_shift_templates',
    'trainings',
    'courses',
    'modules',
    'lessons',
    'course_assignments',
    'course_completions',
    'training_certificates',
    'training_matrix_records',
    'training_matrix_items',
    'documents',
    'document_requirements',
    'hr_documents',
    'medication_administrations',
    'medication_records',
    'assessments',
    'sickness_records',
    'incidents',
    'audit_logs',
    'system_settings',
    'care_log_form_configs',
    'locations',
    'assets',
    'care_teams',
    'forms',
    'form_submissions',
    'archives',
    'work_calendar_events',
    'shared_files',
    'payments',
    'clients',
    'holiday_allowances',
    'recurring_invoices',
    'call_types',
    'announcement_acknowledgements',
    'compliance_reports',
    'safeguarding_reports',
    'supervision_records',
    'meetings',
    'meeting_participants',
    'clinical_observations',
    'wound_records',
    'falls_records',
    'repositioning_records',
    'continence_records'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'organization_id'
    ) THEN
      EXECUTE format('UPDATE %I SET organization_id = $1 WHERE organization_id IS NULL', t) USING accredilink_id;
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────
-- Step 3: Create org-isolated RLS policies
-- Drop old permissive policies, create new org-filtered ones
-- ────────────────────────────────────────────────────────
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users',
    'rota_areas',
    'rota_permissions',
    'service_users',
    'shifts',
    'shift_calls',
    'shift_types',
    'shift_patterns',
    'client_calls',
    'care_logs',
    'healthcare_logs',
    'sitting_logs',
    'notifications',
    'notification_settings',
    'messages',
    'conversations',
    'chat_messages',
    'invoices',
    'invoicing_settings',
    'leave_requests',
    'expenses',
    'pay_periods',
    'payroll_records',
    'shift_swap_requests',
    'shift_claim_requests',
    'base_shift_templates',
    'trainings',
    'courses',
    'modules',
    'lessons',
    'course_assignments',
    'course_completions',
    'training_certificates',
    'training_matrix_records',
    'training_matrix_items',
    'documents',
    'document_requirements',
    'hr_documents',
    'medication_administrations',
    'medication_records',
    'assessments',
    'sickness_records',
    'incidents',
    'audit_logs',
    'system_settings',
    'care_log_form_configs',
    'locations',
    'assets',
    'care_teams',
    'forms',
    'form_submissions',
    'archives',
    'work_calendar_events',
    'shared_files',
    'payments',
    'clients',
    'holiday_allowances',
    'recurring_invoices',
    'call_types',
    'announcement_acknowledgements',
    'compliance_reports',
    'safeguarding_reports',
    'supervision_records',
    'meetings',
    'meeting_participants',
    'clinical_observations',
    'wound_records',
    'falls_records',
    'repositioning_records',
    'continence_records'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t)
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'organization_id')
    THEN
      -- Enable RLS
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

      -- Drop old permissive policies
      EXECUTE format('DROP POLICY IF EXISTS "%s_auth_all" ON %I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_auth" ON %I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_org" ON %I', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "%s_org_isolation" ON %I', t, t);

      -- Create org-isolated policy
      EXECUTE format(
        'CREATE POLICY "%s_org_isolation" ON %I FOR ALL USING (organization_id = auth_org_id()) WITH CHECK (organization_id = auth_org_id())',
        t, t
      );
    END IF;
  END LOOP;
END;
$$;

-- ────────────────────────────────────────────────────────
-- Step 4: Index organization_id on high-traffic tables
-- ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_service_users_org ON service_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_shifts_org ON shifts(organization_id);
CREATE INDEX IF NOT EXISTS idx_shift_calls_org ON shift_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_care_logs_org ON care_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_medication_records_org ON medication_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_medication_admins_org ON medication_administrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_logs_org ON healthcare_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_org ON incidents(organization_id);

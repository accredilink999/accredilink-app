-- ============================================================
-- 001_schema.sql — Full Care Call AI schema (49 tables + RLS)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id                        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                     TEXT,
  full_name                 TEXT,
  staff_full_name           TEXT,
  gps_map_name              TEXT,
  role                      TEXT DEFAULT 'staff',
  job_title                 TEXT,
  phone                     TEXT,
  address                   TEXT,
  date_of_birth             DATE,
  start_date                DATE,
  employment_type           TEXT DEFAULT 'full_time',
  contract_hours            NUMERIC DEFAULT 0,
  hourly_rate               NUMERIC DEFAULT 0,
  avatar_url                TEXT,
  company_name              TEXT,
  company_logo_url          TEXT,
  firebase_messaging_token  TEXT,
  apns_device_token         TEXT,
  push_subscription         TEXT,
  biometric_token           TEXT,
  biometric_salt            TEXT,
  notification_preferences  JSONB DEFAULT '{}',
  is_active                 BOOLEAN DEFAULT TRUE,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER & ACCESS
-- ============================================================
CREATE TABLE users (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                     TEXT UNIQUE,
  full_name                 TEXT,
  gps_map_name              TEXT,
  role                      TEXT DEFAULT 'staff',
  job_title                 TEXT,
  phone                     TEXT,
  address                   TEXT,
  date_of_birth             DATE,
  start_date                DATE,
  employment_type           TEXT,
  contract_hours            NUMERIC DEFAULT 0,
  hourly_rate               NUMERIC DEFAULT 0,
  avatar_url                TEXT,
  firebase_messaging_token  TEXT,
  apns_device_token         TEXT,
  push_subscription         TEXT,
  is_active                 BOOLEAN DEFAULT TRUE,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rota_areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#3b82f6',
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rota_permissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id         UUID REFERENCES profiles(id) ON DELETE CASCADE,
  area_id          UUID REFERENCES rota_areas(id) ON DELETE CASCADE,
  permission_level TEXT DEFAULT 'view',
  can_view         BOOLEAN DEFAULT TRUE,
  can_edit         BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SERVICE DELIVERY
-- ============================================================
CREATE TABLE service_users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name        TEXT,
  last_name         TEXT,
  full_name         TEXT,
  date_of_birth     DATE,
  address           TEXT,
  phone             TEXT,
  emergency_contact TEXT,
  nhs_number        TEXT,
  care_level        TEXT,
  status            TEXT DEFAULT 'active',
  team_id           UUID,
  assigned_staff    TEXT[],
  care_plan         TEXT,
  call_times        JSONB DEFAULT '[]',
  notes             TEXT,
  avatar_url        TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shifts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id          UUID REFERENCES profiles(id),
  staff_name        TEXT,
  service_user_id   UUID REFERENCES service_users(id),
  area_id           UUID REFERENCES rota_areas(id),
  date              DATE,
  start_time        TEXT,
  end_time          TEXT,
  status            TEXT DEFAULT 'scheduled',
  clock_in_time     TIMESTAMPTZ,
  clock_out_time    TIMESTAMPTZ,
  clock_in_lat      NUMERIC,
  clock_in_lng      NUMERIC,
  clock_out_lat     NUMERIC,
  clock_out_lng     NUMERIC,
  notes             TEXT,
  pay_rate          NUMERIC,
  is_overnight      BOOLEAN DEFAULT FALSE,
  is_double_handed  BOOLEAN DEFAULT FALSE,
  shift_type        TEXT DEFAULT 'care',
  recurrence        TEXT,
  paired_staff_id   UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shift_calls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id        UUID REFERENCES shifts(id) ON DELETE CASCADE,
  staff_id        UUID REFERENCES profiles(id),
  staff_name      TEXT,
  service_user_id UUID REFERENCES service_users(id),
  service_user_name TEXT,
  call_time       TEXT,
  call_end_time   TEXT,
  call_date       DATE,
  call_type       TEXT DEFAULT 'check_in',
  status          TEXT DEFAULT 'scheduled',
  care_log_id     UUID,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE client_calls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id UUID REFERENCES service_users(id),
  staff_id        UUID REFERENCES profiles(id),
  date            DATE,
  call_time       TEXT,
  duration        INTEGER,
  call_type       TEXT,
  outcome         TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE care_logs (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id                UUID REFERENCES shifts(id),
  shift_call_id           UUID REFERENCES shift_calls(id),
  service_user_id         UUID REFERENCES service_users(id),
  service_user_name       TEXT,
  staff_id                UUID REFERENCES profiles(id),
  staff_name              TEXT,
  visit_date              DATE,
  visit_time              TEXT,
  mood                    TEXT,
  food_intake             TEXT,
  fluid_intake            TEXT,
  personal_care_provided  BOOLEAN DEFAULT FALSE,
  health_observations     TEXT,
  notes                   TEXT,
  status                  TEXT DEFAULT 'pending',
  submitted_at            TIMESTAMPTZ,
  log_type                TEXT DEFAULT 'general',
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE healthcare_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id   UUID REFERENCES service_users(id),
  service_user_name TEXT,
  staff_id          UUID REFERENCES profiles(id),
  staff_name        TEXT,
  log_date          DATE,
  log_time          TEXT,
  log_type          TEXT,
  description       TEXT,
  severity          TEXT,
  action_taken      TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id          UUID REFERENCES profiles(id),
  recipient_name        TEXT,
  recipient_email       TEXT,
  type                  TEXT,
  notification_type     TEXT,
  title                 TEXT NOT NULL,
  message               TEXT NOT NULL,
  priority              TEXT DEFAULT 'normal',
  related_entity_type   TEXT,
  related_entity_id     UUID,
  action_url            TEXT,
  is_read               BOOLEAN DEFAULT FALSE,
  is_dismissed          BOOLEAN DEFAULT FALSE,
  read_at               TIMESTAMPTZ,
  metadata              JSONB,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type   TEXT UNIQUE,
  enabled_globally    BOOLEAN DEFAULT TRUE,
  allow_user_override BOOLEAN DEFAULT TRUE,
  mandatory           BOOLEAN DEFAULT FALSE,
  priority_override   TEXT,
  default_sound_id    UUID,
  email_enabled       BOOLEAN DEFAULT TRUE,
  push_enabled        BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  notification_types   JSONB DEFAULT '{}',
  delivery_methods     JSONB DEFAULT '{"push": true, "email": true, "in_app": true}',
  quiet_hours_enabled  BOOLEAN DEFAULT FALSE,
  quiet_hours_start    TEXT DEFAULT '22:00',
  quiet_hours_end      TEXT DEFAULT '07:00',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_sounds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  file_url    TEXT,
  description TEXT,
  is_default  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_credentials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service     TEXT,
  credentials JSONB,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE push_notification_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id   UUID REFERENCES notifications(id),
  recipient_id      UUID REFERENCES profiles(id),
  platform          TEXT,
  status            TEXT DEFAULT 'sent',
  response          JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID REFERENCES profiles(id),
  sender_name     TEXT,
  recipient_id    UUID REFERENCES profiles(id),
  subject         TEXT,
  body            TEXT,
  message_type    TEXT DEFAULT 'message',
  is_read         BOOLEAN DEFAULT FALSE,
  is_archived     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids   UUID[],
  participant_names TEXT[],
  title             TEXT,
  conversation_type TEXT DEFAULT 'direct',
  last_message      TEXT,
  last_message_at   TIMESTAMPTZ,
  unread_counts     JSONB DEFAULT '{}',
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID REFERENCES profiles(id),
  sender_name      TEXT,
  content          TEXT,
  message_type     TEXT DEFAULT 'text',
  file_url         TEXT,
  voice_url        TEXT,
  is_deleted       BOOLEAN DEFAULT FALSE,
  read_by          UUID[],
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINANCIAL
-- ============================================================
CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    TEXT UNIQUE,
  service_user_id   UUID REFERENCES service_users(id),
  client_name       TEXT,
  client_email      TEXT,
  client_address    TEXT,
  invoice_date      DATE,
  due_date          DATE,
  status            TEXT DEFAULT 'draft',
  line_items        JSONB DEFAULT '[]',
  subtotal          NUMERIC DEFAULT 0,
  tax_rate          NUMERIC DEFAULT 0,
  tax_amount        NUMERIC DEFAULT 0,
  discount_amount   NUMERIC DEFAULT 0,
  total_amount      NUMERIC DEFAULT 0,
  notes             TEXT,
  repeating_days    INTEGER[],
  day_items         JSONB,
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoicing_settings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     TEXT,
  company_address  TEXT,
  company_city     TEXT,
  company_postcode TEXT,
  company_phone    TEXT,
  company_email    TEXT,
  logo_url         TEXT,
  brand_color      TEXT DEFAULT '#0f766e',
  bank_details     TEXT,
  vat_number       TEXT,
  payment_terms    TEXT DEFAULT 'Net 30',
  default_tax_rate NUMERIC DEFAULT 0,
  currency         TEXT DEFAULT 'GBP',
  is_configured    BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leave_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID REFERENCES profiles(id),
  staff_name      TEXT,
  leave_type      TEXT,
  start_date      DATE,
  end_date        DATE,
  days_requested  NUMERIC,
  reason          TEXT,
  status          TEXT DEFAULT 'pending',
  reviewed_by     UUID REFERENCES profiles(id),
  reviewer_name   TEXT,
  review_notes    TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID REFERENCES profiles(id),
  staff_name      TEXT,
  shift_id        UUID REFERENCES shifts(id),
  expense_type    TEXT,
  description     TEXT,
  amount          NUMERIC DEFAULT 0,
  mileage         NUMERIC DEFAULT 0,
  mileage_rate    NUMERIC DEFAULT 0.45,
  from_location   TEXT,
  to_location     TEXT,
  receipt_url     TEXT,
  status          TEXT DEFAULT 'pending',
  expense_date    DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pay_periods (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date  DATE,
  end_date    DATE,
  status      TEXT DEFAULT 'open',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payroll_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID REFERENCES profiles(id),
  staff_name      TEXT,
  pay_period_id   UUID REFERENCES pay_periods(id),
  basic_pay       NUMERIC DEFAULT 0,
  overtime_pay    NUMERIC DEFAULT 0,
  deductions      NUMERIC DEFAULT 0,
  net_pay         NUMERIC DEFAULT 0,
  hours_worked    NUMERIC DEFAULT 0,
  status          TEXT DEFAULT 'draft',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shift_swap_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id        UUID REFERENCES profiles(id),
  requester_name      TEXT,
  target_staff_id     UUID REFERENCES profiles(id),
  target_staff_name   TEXT,
  requester_shift_id  UUID REFERENCES shifts(id),
  target_shift_id     UUID REFERENCES shifts(id),
  status              TEXT DEFAULT 'pending',
  notes               TEXT,
  reviewed_by         UUID REFERENCES profiles(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAINING & COMPLIANCE
-- ============================================================
CREATE TABLE trainings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  training_type   TEXT,
  provider        TEXT,
  duration_hours  NUMERIC,
  expiry_months   INTEGER,
  is_mandatory    BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE courses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  content         JSONB DEFAULT '[]',
  category        TEXT,
  duration_hours  NUMERIC,
  pass_mark       INTEGER DEFAULT 80,
  is_active       BOOLEAN DEFAULT TRUE,
  thumbnail_url   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id     UUID REFERENCES courses(id),
  staff_id      UUID REFERENCES profiles(id),
  staff_name    TEXT,
  assigned_by   UUID REFERENCES profiles(id),
  due_date      DATE,
  status        TEXT DEFAULT 'assigned',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE course_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       UUID REFERENCES courses(id),
  staff_id        UUID REFERENCES profiles(id),
  staff_name      TEXT,
  score           INTEGER,
  passed          BOOLEAN DEFAULT FALSE,
  completed_at    TIMESTAMPTZ DEFAULT NOW(),
  certificate_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_certificates (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id           UUID REFERENCES profiles(id),
  staff_name         TEXT,
  training_id        UUID REFERENCES trainings(id),
  training_name      TEXT,
  certificate_number TEXT,
  issued_date        DATE,
  expiry_date        DATE,
  file_url           TEXT,
  status             TEXT DEFAULT 'valid',
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_matrix_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID REFERENCES profiles(id),
  staff_name      TEXT,
  training_id     UUID REFERENCES trainings(id),
  training_name   TEXT,
  completed_date  DATE,
  expiry_date     DATE,
  status          TEXT DEFAULT 'not_completed',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE training_matrix_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID REFERENCES trainings(id),
  role        TEXT,
  required    BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  file_url        TEXT,
  file_type       TEXT,
  file_size       INTEGER,
  category        TEXT,
  tags            TEXT[],
  uploaded_by     UUID REFERENCES profiles(id),
  service_user_id UUID REFERENCES service_users(id),
  is_public       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE document_requirements (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                  TEXT NOT NULL,
  description            TEXT,
  category               TEXT,
  applies_to             TEXT DEFAULT 'staff',
  is_mandatory           BOOLEAN DEFAULT FALSE,
  renewal_period_months  INTEGER,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hr_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id        UUID REFERENCES profiles(id),
  staff_name      TEXT,
  requirement_id  UUID REFERENCES document_requirements(id),
  title           TEXT,
  file_url        TEXT,
  issue_date      DATE,
  expiry_date     DATE,
  status          TEXT DEFAULT 'valid',
  notes           TEXT,
  uploaded_by     UUID REFERENCES profiles(id),
  viewable_by_staff BOOLEAN DEFAULT TRUE,
  is_confidential   BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HEALTHCARE
-- ============================================================
CREATE TABLE medication_administrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id UUID REFERENCES service_users(id),
  service_user_name TEXT,
  staff_id        UUID REFERENCES profiles(id),
  staff_name      TEXT,
  medication_id   UUID,
  administered_at TIMESTAMPTZ,
  dose            TEXT,
  route           TEXT,
  outcome         TEXT DEFAULT 'administered',
  notes           TEXT,
  witnessed_by    UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE medication_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id UUID REFERENCES service_users(id),
  medication_name TEXT NOT NULL,
  dosage          TEXT,
  frequency       TEXT,
  route           TEXT,
  start_date      DATE,
  end_date        DATE,
  prescriber      TEXT,
  notes           TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id  UUID REFERENCES service_users(id),
  staff_id         UUID REFERENCES profiles(id),
  assessment_type  TEXT,
  assessment_date  DATE,
  score            INTEGER,
  findings         TEXT,
  recommendations  TEXT,
  next_review_date DATE,
  status           TEXT DEFAULT 'draft',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sickness_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id            UUID REFERENCES profiles(id),
  staff_name          TEXT,
  start_date          DATE,
  end_date            DATE,
  reason              TEXT,
  fit_note_url        TEXT,
  return_to_work_date DATE,
  bradford_score      NUMERIC DEFAULT 0,
  status              TEXT DEFAULT 'active',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ADMIN
-- ============================================================
CREATE TABLE incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT,
  description     TEXT,
  incident_type   TEXT,
  severity        TEXT DEFAULT 'low',
  status          TEXT DEFAULT 'open',
  reported_by     UUID REFERENCES profiles(id),
  reporter_name   TEXT,
  service_user_id UUID REFERENCES service_users(id),
  location        TEXT,
  incident_date   TIMESTAMPTZ,
  witnesses       TEXT[],
  action_taken    TEXT,
  follow_up       TEXT,
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  user_name   TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE system_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key   TEXT UNIQUE NOT NULL,
  setting_value JSONB,
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  latitude    NUMERIC,
  longitude   NUMERIC,
  accuracy    NUMERIC,
  timestamp   TIMESTAMPTZ DEFAULT NOW(),
  context     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  asset_type      TEXT,
  serial_number   TEXT,
  assigned_to     UUID REFERENCES profiles(id),
  purchase_date   DATE,
  value           NUMERIC,
  status          TEXT DEFAULT 'active',
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE care_teams (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id UUID REFERENCES service_users(id),
  staff_id        UUID REFERENCES profiles(id),
  staff_name      TEXT,
  role            TEXT DEFAULT 'carer',
  is_primary      BOOLEAN DEFAULT FALSE,
  start_date      DATE,
  end_date        DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE announcement_acknowledgements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id   UUID,
  user_id           UUID REFERENCES profiles(id),
  user_name         TEXT,
  acknowledged_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE forms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  fields      JSONB DEFAULT '[]',
  category    TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE form_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id         UUID REFERENCES forms(id),
  submitted_by    UUID REFERENCES profiles(id),
  submitter_name  TEXT,
  service_user_id UUID REFERENCES service_users(id),
  data            JSONB DEFAULT '{}',
  status          TEXT DEFAULT 'submitted',
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE archives (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     TEXT,
  entity_id       UUID,
  data            JSONB,
  archived_by     UUID REFERENCES profiles(id),
  archive_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE work_calendar_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  start_datetime  TIMESTAMPTZ,
  end_datetime    TIMESTAMPTZ,
  event_type      TEXT DEFAULT 'meeting',
  attendees       UUID[],
  location        TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shared_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT,
  description TEXT,
  file_url    TEXT,
  file_type   TEXT,
  shared_by   UUID REFERENCES profiles(id),
  shared_with UUID[],
  is_public   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id                UUID REFERENCES invoices(id),
  amount                    NUMERIC NOT NULL,
  payment_method            TEXT DEFAULT 'bank_transfer',
  payment_date              DATE,
  reference                 TEXT,
  stripe_payment_intent_id  TEXT,
  status                    TEXT DEFAULT 'pending',
  notes                     TEXT,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE holiday_allowances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID REFERENCES profiles(id),
  staff_name    TEXT,
  year          INTEGER,
  total_days    NUMERIC DEFAULT 28,
  used_days     NUMERIC DEFAULT 0,
  carried_over  NUMERIC DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_staff_id ON shifts(staff_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_care_logs_service_user ON care_logs(service_user_id);
CREATE INDEX idx_care_logs_staff ON care_logs(staff_id);
CREATE INDEX idx_care_logs_status ON care_logs(status);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id, created_at);
CREATE INDEX idx_shift_calls_shift ON shift_calls(shift_id);
CREATE INDEX idx_shift_calls_staff ON shift_calls(staff_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX idx_hr_documents_staff ON hr_documents(staff_id);
CREATE INDEX idx_training_certs_staff ON training_certificates(staff_id, expiry_date);

-- ============================================================
-- AUTO updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
  trig_tables TEXT[] := ARRAY[
    'profiles','users','rota_areas','rota_permissions',
    'service_users','shifts','shift_calls','client_calls',
    'care_logs','healthcare_logs',
    'notifications','notification_settings','notification_preferences',
    'notification_sounds','notification_credentials',
    'messages','conversations','chat_messages',
    'invoices','invoicing_settings','leave_requests','expenses',
    'pay_periods','payroll_records','shift_swap_requests',
    'trainings','courses','course_assignments',
    'training_certificates','training_matrix_records',
    'documents','document_requirements','hr_documents',
    'medication_administrations','medication_records',
    'assessments','sickness_records',
    'incidents','system_settings','assets',
    'care_teams','forms','form_submissions',
    'work_calendar_events','shared_files','payments','holiday_allowances'
  ];
BEGIN
  FOREACH tbl IN ARRAY trig_tables LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
  all_tables TEXT[] := ARRAY[
    'profiles','users','rota_areas','rota_permissions',
    'service_users','shifts','shift_calls','client_calls',
    'care_logs','healthcare_logs',
    'notifications','notification_settings','notification_preferences',
    'notification_sounds','notification_credentials','push_notification_logs',
    'messages','conversations','chat_messages',
    'invoices','invoicing_settings','leave_requests','expenses',
    'pay_periods','payroll_records','shift_swap_requests',
    'trainings','courses','course_assignments','course_completions',
    'training_certificates','training_matrix_records','training_matrix_items',
    'documents','document_requirements','hr_documents',
    'medication_administrations','medication_records','assessments','sickness_records',
    'incidents','audit_logs','system_settings','locations','assets',
    'care_teams','announcement_acknowledgements','forms','form_submissions',
    'archives','work_calendar_events','shared_files','payments','holiday_allowances'
  ];
BEGIN
  FOREACH tbl IN ARRAY all_tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END;
$$;

-- Profiles: all authenticated users can read; only own row for write
CREATE POLICY "profiles_select_auth" ON profiles FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Notifications: each user sees only their own
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = recipient_id);

-- Notification preferences: own row only
CREATE POLICY "notif_prefs_own" ON notification_preferences FOR ALL USING (auth.uid() = user_id);

-- Push notification logs: own rows
CREATE POLICY "push_logs_own_select" ON push_notification_logs FOR SELECT USING (auth.uid() = recipient_id);
CREATE POLICY "push_logs_insert" ON push_notification_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Locations: own rows
CREATE POLICY "locations_own" ON locations FOR ALL USING (auth.uid() = user_id);

-- Audit logs: read all (admins see all), insert authenticated
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- All other operational tables: any authenticated user (tighten per-table as needed)
DO $$
DECLARE
  tbl TEXT;
  open_tables TEXT[] := ARRAY[
    'users','rota_areas','rota_permissions',
    'service_users','shifts','shift_calls','client_calls',
    'care_logs','healthcare_logs',
    'notification_settings','notification_sounds','notification_credentials',
    'messages','conversations','chat_messages',
    'invoices','invoicing_settings','leave_requests','expenses',
    'pay_periods','payroll_records','shift_swap_requests',
    'trainings','courses','course_assignments','course_completions',
    'training_certificates','training_matrix_records','training_matrix_items',
    'documents','document_requirements','hr_documents',
    'medication_administrations','medication_records','assessments','sickness_records',
    'incidents','system_settings','assets',
    'care_teams','announcement_acknowledgements','forms','form_submissions',
    'archives','work_calendar_events','shared_files','payments','holiday_allowances'
  ];
BEGIN
  FOREACH tbl IN ARRAY open_tables LOOP
    EXECUTE format(
      'CREATE POLICY "%s_auth_all" ON %I FOR ALL USING (auth.uid() IS NOT NULL)',
      tbl, tbl
    );
  END LOOP;
END;
$$;

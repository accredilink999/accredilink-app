-- ============================================================
-- Clinical Tables for CareCallAI
-- Observations, wounds, falls, repositioning, continence
-- ============================================================

-- Clinical observations (vital signs: weight, BP, temp, pulse, O2 sats)
CREATE TABLE IF NOT EXISTS clinical_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id uuid NOT NULL REFERENCES service_users(id) ON DELETE CASCADE,
  observation_type text NOT NULL,
  value_numeric decimal,
  value_text text,
  unit text,
  notes text,
  staff_id uuid,
  staff_name text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Extend existing assessments table with structured scoring
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessment_data jsonb DEFAULT '{}';
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS risk_level text;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS service_user_name text;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS staff_name text;

-- Wound records
CREATE TABLE IF NOT EXISTS wound_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id uuid NOT NULL REFERENCES service_users(id) ON DELETE CASCADE,
  wound_type text NOT NULL,
  location_body text NOT NULL,
  body_map_x decimal,
  body_map_y decimal,
  grade text,
  length_cm decimal,
  width_cm decimal,
  depth_cm text,
  wound_bed text,
  exudate text,
  surrounding_skin text,
  pain_level int,
  treatment text,
  dressing_type text,
  next_dressing_date date,
  photo_urls text[] DEFAULT '{}',
  status text DEFAULT 'active',
  staff_id uuid,
  staff_name text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  healed_at timestamptz
);

-- Falls records
CREATE TABLE IF NOT EXISTS falls_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id uuid NOT NULL REFERENCES service_users(id) ON DELETE CASCADE,
  fall_date date NOT NULL,
  fall_time time,
  location text,
  witnessed boolean DEFAULT false,
  witness_name text,
  description text,
  injuries text,
  injury_details text,
  contributing_factors text[] DEFAULT '{}',
  immediate_action text,
  medical_attention boolean DEFAULT false,
  medical_details text,
  ambulance_called boolean DEFAULT false,
  family_notified boolean DEFAULT false,
  gp_notified boolean DEFAULT false,
  follow_up_actions text,
  risk_assessment_updated boolean DEFAULT false,
  staff_id uuid,
  staff_name text,
  created_at timestamptz DEFAULT now()
);

-- Repositioning records
CREATE TABLE IF NOT EXISTS repositioning_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id uuid NOT NULL REFERENCES service_users(id) ON DELETE CASCADE,
  position text NOT NULL,
  skin_check text,
  comfort_level text,
  notes text,
  staff_id uuid,
  staff_name text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Continence records
CREATE TABLE IF NOT EXISTS continence_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_user_id uuid NOT NULL REFERENCES service_users(id) ON DELETE CASCADE,
  record_type text NOT NULL,
  pad_status text,
  bowel_type text,
  output_amount text,
  skin_condition text,
  pad_changed boolean DEFAULT false,
  personal_care_given boolean DEFAULT false,
  notes text,
  staff_id uuid,
  staff_name text,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE clinical_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wound_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE falls_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositioning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE continence_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinical_observations_auth" ON clinical_observations;
CREATE POLICY "clinical_observations_auth" ON clinical_observations FOR ALL USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "wound_records_auth" ON wound_records;
CREATE POLICY "wound_records_auth" ON wound_records FOR ALL USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "falls_records_auth" ON falls_records;
CREATE POLICY "falls_records_auth" ON falls_records FOR ALL USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "repositioning_records_auth" ON repositioning_records;
CREATE POLICY "repositioning_records_auth" ON repositioning_records FOR ALL USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "continence_records_auth" ON continence_records;
CREATE POLICY "continence_records_auth" ON continence_records FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clinical_obs_su ON clinical_observations(service_user_id, observation_type);
CREATE INDEX IF NOT EXISTS idx_clinical_obs_date ON clinical_observations(recorded_at);
CREATE INDEX IF NOT EXISTS idx_wound_records_su ON wound_records(service_user_id);
CREATE INDEX IF NOT EXISTS idx_falls_records_su ON falls_records(service_user_id);
CREATE INDEX IF NOT EXISTS idx_falls_records_date ON falls_records(fall_date);
CREATE INDEX IF NOT EXISTS idx_repositioning_su ON repositioning_records(service_user_id);
CREATE INDEX IF NOT EXISTS idx_continence_su ON continence_records(service_user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_su ON assessments(service_user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(assessment_type);

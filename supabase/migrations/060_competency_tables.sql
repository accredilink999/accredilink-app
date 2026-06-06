-- Competency assessment system
-- Supports probationary checklists, skills assessments, and appraisals

CREATE TABLE IF NOT EXISTS competency_frameworks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID,
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT DEFAULT 'probation',
  region           TEXT DEFAULT 'Wales',
  sections         JSONB NOT NULL DEFAULT '[]',
  observation_areas JSONB DEFAULT '[]',
  final_review_items JSONB DEFAULT '[]',
  is_system        BOOLEAN DEFAULT false,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competency_assessments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID,
  framework_id     UUID REFERENCES competency_frameworks(id),
  staff_id         UUID NOT NULL,
  staff_name       TEXT,
  mentor_id        UUID NOT NULL,
  mentor_name      TEXT,
  status           TEXT DEFAULT 'in_progress',
  responses        JSONB DEFAULT '{}',
  mentor_signature TEXT,
  staff_signature  TEXT,
  mentor_signed_at TIMESTAMPTZ,
  staff_signed_at  TIMESTAMPTZ,
  review_date      DATE,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE competency_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competency_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "frameworks_read" ON competency_frameworks
  FOR SELECT TO authenticated USING (
    is_system = true OR organization_id IS NULL OR
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "frameworks_service" ON competency_frameworks
  FOR ALL TO service_role USING (true);

CREATE POLICY "assessments_all" ON competency_assessments
  FOR ALL TO authenticated USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    OR staff_id = auth.uid()
    OR mentor_id = auth.uid()
  );

CREATE POLICY "assessments_service" ON competency_assessments
  FOR ALL TO service_role USING (true);

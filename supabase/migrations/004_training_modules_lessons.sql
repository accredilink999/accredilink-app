-- 004_training_modules_lessons.sql — Course modules and lessons tables

CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  content_type TEXT DEFAULT 'text',
  video_url TEXT,
  document_url TEXT,
  order_index INTEGER DEFAULT 0,
  has_assessment BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additional columns for courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty_level TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 80;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS expiry_days INTEGER;

-- Additional columns for course_completions table
ALTER TABLE course_completions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'not_started';
ALTER TABLE course_completions ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0;
ALTER TABLE course_completions ADD COLUMN IF NOT EXISTS completed_date TIMESTAMPTZ;

-- RLS policies
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules_all" ON public.modules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "lessons_all" ON public.lessons FOR ALL TO authenticated USING (true) WITH CHECK (true);

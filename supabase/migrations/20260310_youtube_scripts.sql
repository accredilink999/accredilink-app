-- YouTube Scripts table for CareCallAI YouTube channel content pipeline
CREATE TABLE IF NOT EXISTS youtube_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Script metadata
  title TEXT NOT NULL,
  video_type TEXT NOT NULL DEFAULT 'compliance_tutorial',
  topic_category TEXT NOT NULL DEFAULT 'compliance',
  target_audience TEXT DEFAULT 'all',
  tone TEXT DEFAULT 'professional',
  target_duration INTEGER DEFAULT 360,

  -- SEO metadata
  youtube_title TEXT,
  youtube_description TEXT,
  tags TEXT[] DEFAULT '{}',
  thumbnail_text TEXT,

  -- Script sections
  hook TEXT,
  sections JSONB DEFAULT '[]',
  cta TEXT,
  outro TEXT,
  full_script TEXT,

  -- Metrics
  estimated_duration INTEGER,
  word_count INTEGER,

  -- Management
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generating_video', 'video_ready', 'published')),
  notes TEXT,
  heygen_video_id TEXT,
  video_url TEXT,
  youtube_url TEXT,
  published_at TIMESTAMPTZ,

  -- Audit
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_youtube_scripts_status ON youtube_scripts(status);
CREATE INDEX IF NOT EXISTS idx_youtube_scripts_video_type ON youtube_scripts(video_type);
CREATE INDEX IF NOT EXISTS idx_youtube_scripts_created_at ON youtube_scripts(created_at DESC);

ALTER TABLE youtube_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY allow_all_youtube_scripts ON youtube_scripts FOR ALL USING (true) WITH CHECK (true);

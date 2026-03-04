CREATE TABLE social_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL CHECK (brand IN ('accredilink', 'carecallai')),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'x', 'linkedin', 'blog')),
  title TEXT,
  content TEXT NOT NULL,
  hashtags TEXT,
  media_url TEXT,
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all ON social_posts FOR ALL USING (true) WITH CHECK (true);

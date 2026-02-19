-- ============================================================
-- 027: Meetings & Video Conferencing tables
-- ============================================================

CREATE TABLE meetings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  description       TEXT,
  scheduled_at      TIMESTAMPTZ NOT NULL,
  duration_minutes  INTEGER DEFAULT 60,
  created_by        UUID REFERENCES profiles(id),
  created_by_name   TEXT,
  status            TEXT DEFAULT 'scheduled',  -- scheduled | active | completed | cancelled
  meeting_type      TEXT DEFAULT 'video',      -- video | audio_only
  daily_room_name   TEXT,
  daily_room_url    TEXT,
  recording_enabled BOOLEAN DEFAULT FALSE,
  recording_url     TEXT,
  recording_id      TEXT,
  transcript_text   TEXT,
  minutes_text      TEXT,
  agenda            TEXT,
  notes             TEXT,
  whiteboard_data   JSONB,
  ended_at          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meeting_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      UUID REFERENCES meetings(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  user_name       TEXT NOT NULL,
  user_email      TEXT,
  role            TEXT DEFAULT 'participant',  -- organizer | participant
  status          TEXT DEFAULT 'invited',      -- invited | accepted | declined | joined | left
  invited_at      TIMESTAMPTZ DEFAULT NOW(),
  responded_at    TIMESTAMPTZ,
  joined_at       TIMESTAMPTZ,
  left_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);
CREATE INDEX idx_meetings_created_by ON meetings(created_by);
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_user_id ON meeting_participants(user_id);

-- Enable RLS
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- Open authenticated policies (matching existing pattern)
CREATE POLICY "meetings_auth_all" ON meetings FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "meeting_participants_auth_all" ON meeting_participants FOR ALL USING (auth.uid() IS NOT NULL);

-- Enable Realtime for live meeting status updates
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE meeting_participants;

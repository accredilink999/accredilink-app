-- AI Conversations table
-- Stores agent conversation history for AIAssistant and AIAdminAssistant pages

CREATE TABLE ai_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name  TEXT NOT NULL,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metadata    JSONB DEFAULT '{}',
  messages    JSONB DEFAULT '[]',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_conversations_user_agent ON ai_conversations(user_id, agent_name);

-- Auto-update updated_at on row change
CREATE TRIGGER set_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: users can only read/write their own conversations
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own AI conversations"
  ON ai_conversations
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime for live message updates
ALTER PUBLICATION supabase_realtime ADD TABLE ai_conversations;

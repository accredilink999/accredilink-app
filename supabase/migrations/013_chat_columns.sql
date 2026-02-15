-- ============================================================
-- 013: Add missing columns for chat system
-- ============================================================

-- Add missing columns to chat_messages
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS emoji_reactions JSONB;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_photo_url TEXT;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES chat_messages(id);
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS forwarded_from UUID;

-- Add missing columns to conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_by UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS pinned_by UUID[] DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_muted_by UUID[] DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS group_photo_url TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS description TEXT;

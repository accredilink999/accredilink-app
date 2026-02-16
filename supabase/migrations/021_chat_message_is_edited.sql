-- Add is_edited column to chat_messages for edit message feature
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

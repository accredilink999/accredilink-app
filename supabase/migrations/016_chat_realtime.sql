-- Enable Supabase Realtime for chat tables
-- This is required for postgres_changes subscriptions to work

-- Add chat_messages to the realtime publication so INSERT/UPDATE/DELETE events broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Add conversations to the realtime publication so unread counts and last_message update in real-time
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;

-- Set REPLICA IDENTITY FULL on chat_messages so UPDATE events include full row data
-- (without this, UPDATE payloads may only contain the primary key)
ALTER TABLE chat_messages REPLICA IDENTITY FULL;

-- Set REPLICA IDENTITY FULL on conversations for the same reason
ALTER TABLE conversations REPLICA IDENTITY FULL;

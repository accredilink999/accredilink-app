-- Add photo capture and extra notes to care_logs
ALTER TABLE care_logs
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS photo_notes TEXT;

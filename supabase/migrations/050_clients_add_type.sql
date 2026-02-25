ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'invoice';

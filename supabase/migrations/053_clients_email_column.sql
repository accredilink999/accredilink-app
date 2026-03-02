ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_type text DEFAULT 'invoice';

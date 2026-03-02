ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_address text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_city text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_postcode text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_phone text;

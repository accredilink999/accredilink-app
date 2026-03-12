-- Add tax_code and ni_category columns to users table for payroll
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_code TEXT DEFAULT '1257L';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ni_category TEXT DEFAULT 'A';
ALTER TABLE users ADD COLUMN IF NOT EXISTS pay_type TEXT DEFAULT 'hourly';

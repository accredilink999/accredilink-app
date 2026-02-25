-- Add columns that InvoiceManager expects but don't exist yet
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'fixed';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_due numeric DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency text DEFAULT 'GBP';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_address text;

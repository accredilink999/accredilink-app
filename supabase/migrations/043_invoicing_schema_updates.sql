-- Add missing columns to invoicing_settings
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS company_website text;
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS bank_account_name text;
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS bank_account_number text;
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS bank_sort_code text;
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS bank_iban text;
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS invoice_prefix text DEFAULT 'INV';
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS invoice_notes text;
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS next_invoice_number integer DEFAULT 1001;
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS call_types jsonb DEFAULT '["Early Call","Morning Call","Lunch Call","Tea Call","Bed Call","Social Care Call"]';
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS hours_options jsonb;
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS hourly_rates jsonb;

-- Add missing columns to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS period_start date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS period_end date;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_invoice_id uuid;

-- Add missing columns to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_name text;

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  client_email text,
  client_phone text,
  billing_address text,
  billing_city text,
  billing_postcode text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "auth_all" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create recurring_invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid,
  client_name text,
  frequency text DEFAULT 'monthly',
  next_date date,
  line_items jsonb DEFAULT '[]',
  total_amount numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "auth_all" ON recurring_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

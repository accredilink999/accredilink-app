-- 054_invoicing_full_schema_sync.sql
-- Sync all invoicing tables to match what the frontend code expects.
-- Only touches: recurring_invoices, invoices, invoicing_settings, payments

-- ============================================================
-- recurring_invoices — missing ~13 columns
-- ============================================================
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS tax_amount numeric DEFAULT 0;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS currency text DEFAULT 'GBP';
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'Net 30';
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS day_of_month integer;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS day_of_week integer;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS invoice_period_days integer;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS auto_send boolean DEFAULT false;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS next_invoice_date date;

-- ============================================================
-- invoices — missing sent_date, viewed_date, payment_terms
-- ============================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_date timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS viewed_date timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms text DEFAULT 'Net 30';

-- ============================================================
-- invoicing_settings — ensure tax_rate alias works
-- (code reads both settings.tax_rate and settings.default_tax_rate)
-- ============================================================
-- default_tax_rate already exists in 001_schema; no action needed

-- ============================================================
-- payments — client_id and client_name already added in 043
-- Verify they exist (idempotent)
-- ============================================================
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_id uuid;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_name text;

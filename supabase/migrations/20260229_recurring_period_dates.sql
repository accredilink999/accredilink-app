ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS period_from date;
ALTER TABLE recurring_invoices ADD COLUMN IF NOT EXISTS period_to date;

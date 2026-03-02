ALTER TABLE invoices ADD COLUMN IF NOT EXISTS period_from date; ALTER TABLE invoices ADD COLUMN IF NOT EXISTS period_to date;

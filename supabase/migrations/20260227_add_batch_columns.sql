ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS next_batch_number integer DEFAULT 1;
ALTER TABLE invoicing_settings ADD COLUMN IF NOT EXISTS batch_prefix text DEFAULT 'BATCH-';

-- Set invoice starting number to 2000
UPDATE invoicing_settings SET next_invoice_number = 2000 WHERE next_invoice_number < 2000 OR next_invoice_number IS NULL;

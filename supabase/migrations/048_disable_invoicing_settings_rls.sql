-- Disable RLS on invoicing_settings entirely — it's a single shared config row
ALTER TABLE invoicing_settings DISABLE ROW LEVEL SECURITY;

-- Also check: make sure the row is there
DO $$
DECLARE
  cnt integer;
BEGIN
  SELECT count(*) INTO cnt FROM invoicing_settings WHERE is_configured = true;
  RAISE NOTICE 'Configured settings rows: %', cnt;
END $$;

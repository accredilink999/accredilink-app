-- 056_drop_all_base44_not_null.sql
-- Base44 created tables with different column names that have NOT NULL constraints.
-- Our code uses different column names (e.g. client_name instead of name).
-- Drop NOT NULL on ALL non-PK columns across invoicing tables so nothing blocks inserts.

-- ============================================================
-- clients — base44 had "name" NOT NULL, we use "client_name"
-- ============================================================
ALTER TABLE clients ALTER COLUMN name DROP NOT NULL;
-- Drop NOT NULL on any other base44 columns that might exist
DO $$ BEGIN ALTER TABLE clients ALTER COLUMN email DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- ============================================================
-- invoices — ensure no unexpected NOT NULL columns
-- ============================================================
DO $$ BEGIN ALTER TABLE invoices ALTER COLUMN invoice_number DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE invoices ALTER COLUMN name DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE invoices ALTER COLUMN title DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- ============================================================
-- recurring_invoices — ensure no unexpected NOT NULL columns
-- ============================================================
DO $$ BEGIN ALTER TABLE recurring_invoices ALTER COLUMN name DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE recurring_invoices ALTER COLUMN title DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- ============================================================
-- invoicing_settings — ensure no unexpected NOT NULL columns
-- ============================================================
DO $$ BEGIN ALTER TABLE invoicing_settings ALTER COLUMN name DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE invoicing_settings ALTER COLUMN title DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;

-- ============================================================
-- payments — ensure no unexpected NOT NULL columns
-- ============================================================
DO $$ BEGIN ALTER TABLE payments ALTER COLUMN amount DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; END $$;

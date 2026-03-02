-- The original base44 clients table had a "name" column with NOT NULL.
-- Our code uses "client_name" instead. Drop the NOT NULL on "name" so it doesn't block inserts.
ALTER TABLE clients ALTER COLUMN name DROP NOT NULL;

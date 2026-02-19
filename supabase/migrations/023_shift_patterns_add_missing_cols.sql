-- 023_shift_patterns_add_missing_cols.sql
-- Add columns that were missing from the original shift_patterns table.
-- Migration 022 used CREATE TABLE IF NOT EXISTS, which was a no-op because
-- the table already existed with fewer columns.

ALTER TABLE shift_patterns ADD COLUMN IF NOT EXISTS rota_area_name TEXT;
ALTER TABLE shift_patterns ADD COLUMN IF NOT EXISTS days_of_week JSONB DEFAULT '[]'::jsonb;
ALTER TABLE shift_patterns ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE shift_patterns ADD COLUMN IF NOT EXISTS end_time TEXT;
ALTER TABLE shift_patterns ADD COLUMN IF NOT EXISTS call_templates JSONB DEFAULT '[]'::jsonb;

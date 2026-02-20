-- Add missing columns to medication_records that the MARChart component uses
ALTER TABLE medication_records ADD COLUMN IF NOT EXISTS times_per_day INTEGER DEFAULT 1;
ALTER TABLE medication_records ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE medication_records ADD COLUMN IF NOT EXISTS service_user_name TEXT;

-- Add missing columns to medication_administrations that the MARChart component uses
ALTER TABLE medication_administrations ADD COLUMN IF NOT EXISTS medication_record_id UUID;
ALTER TABLE medication_administrations ADD COLUMN IF NOT EXISTS medication_name TEXT;
ALTER TABLE medication_administrations ADD COLUMN IF NOT EXISTS instance INTEGER DEFAULT 0;

-- Add credits/acknowledgements field to courses
-- Legal requirement to acknowledge content providers at course completion

ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits JSONB DEFAULT '[]'::jsonb;

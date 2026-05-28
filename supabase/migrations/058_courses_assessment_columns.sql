-- 058_courses_assessment_columns.sql — Add assessment fields to courses table

ALTER TABLE courses ADD COLUMN IF NOT EXISTS assessment_title TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS assessment_questions JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS assessment_passing_score INTEGER DEFAULT 70;

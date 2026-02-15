-- 017_fix_shift_calls_rls.sql
-- Ensure shift_calls has a permissive RLS policy for all authenticated users.
-- Drop and recreate to fix any conflicting policies.

-- Drop existing policies on shift_calls
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'shift_calls' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON shift_calls', pol.policyname);
  END LOOP;
END;
$$;

-- Recreate a single permissive policy for all operations
CREATE POLICY "shift_calls_auth_all" ON shift_calls
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Also fix care_logs FK to use SET NULL on delete (so deleting a shift_call doesn't fail)
-- First drop the existing constraint, then recreate with ON DELETE SET NULL
DO $$
BEGIN
  -- Find and drop FK constraints from care_logs to shift_calls
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'care_logs'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name IN (
        SELECT constraint_name FROM information_schema.key_column_usage
        WHERE table_name = 'care_logs' AND column_name = 'shift_call_id'
      )
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE care_logs DROP CONSTRAINT ' || constraint_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'care_logs' AND column_name = 'shift_call_id'
      LIMIT 1
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL; -- ignore if constraint doesn't exist
END;
$$;

-- Re-add with ON DELETE SET NULL
ALTER TABLE care_logs
  ADD CONSTRAINT care_logs_shift_call_id_fkey
  FOREIGN KEY (shift_call_id) REFERENCES shift_calls(id) ON DELETE SET NULL;

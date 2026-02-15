-- 012_shift_call_tasks.sql
-- Add tasks checklist support to shift calls and default tasks to call types.

-- Per-call task checklist: [{text: "Prepare meal", completed: false}, ...]
ALTER TABLE shift_calls ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]'::jsonb;

-- Default tasks per call type, auto-seeded onto new ShiftCalls
ALTER TABLE call_types ADD COLUMN IF NOT EXISTS default_tasks JSONB DEFAULT '[]'::jsonb;

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const results: string[] = [];

  // Add total_hours column if missing
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE holiday_allowances ADD COLUMN IF NOT EXISTS total_hours NUMERIC DEFAULT 0;"
  }).maybeSingle();

  if (e1) {
    // Try direct approach — the rpc may not exist
    // Use a workaround: insert a test row and check which columns exist
    const { data: cols } = await supabase
      .from('holiday_allowances')
      .select('*')
      .limit(0);

    results.push(`Columns check done. RPC error: ${e1.message}`);
  } else {
    results.push('Added total_hours column');
  }

  // Add pending_days column if missing
  const { error: e2 } = await supabase.rpc('exec_sql', {
    sql: "ALTER TABLE holiday_allowances ADD COLUMN IF NOT EXISTS pending_days NUMERIC DEFAULT 0;"
  }).maybeSingle();

  if (e2) {
    results.push(`pending_days: ${e2.message}`);
  } else {
    results.push('Added pending_days column');
  }

  // Check current table structure by reading a row
  const { data: sample, error: e3 } = await supabase
    .from('holiday_allowances')
    .select('*')
    .limit(1);

  const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : [];

  return new Response(JSON.stringify({
    results,
    existingColumns: columns,
    sampleRow: sample?.[0] || null,
  }, null, 2));
});

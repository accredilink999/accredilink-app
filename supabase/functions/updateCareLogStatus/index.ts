import { createClient } from 'npm:@supabase/supabase-js@2';


const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
Deno.serve(async (req) => {
  try {
      if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }
  const authHeader = req.headers.get('Authorization') || ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = currentUser;

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all pending and submitted care logs
    const allLogs = await (async () => { const { data, error } = await supabaseAdmin.from('care_logs').select('*'); if (error) throw error; return data || [] })();
    const submittedLogs = await (async () => { const { data, error } = await supabaseAdmin.from('care_logs').select('*'); if (error) throw error; return data || [] })();
    
    const logsToCheck = [...allLogs, ...submittedLogs];
    const now = new Date();
    let overdueCount = 0;

    for (const log of logsToCheck) {
      if (log.status !== 'pending') continue;

      // Calculate if overdue (1 hour after shift end time)
      const [endHours, endMins] = log.shift_end_time.split(':').map(Number);
      const shiftEndDate = new Date(log.visit_date);
      shiftEndDate.setHours(endHours, endMins, 0);
      const overdueTime = new Date(shiftEndDate.getTime() + 60 * 60 * 1000); // 1 hour after shift end

      if (now > overdueTime) {
        await (async () => { const { data, error } = await supabaseAdmin.from('care_logs').update({ status: 'overdue' }).eq('id', log.id).select().single(); if (error) throw error; return data })();
        overdueCount++;
      }
    }

    return Response.json({ 
      success: true, 
      message: `Updated ${overdueCount} overdue care logs` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

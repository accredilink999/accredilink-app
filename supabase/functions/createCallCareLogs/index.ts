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
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get all service users with call times
    const serviceUsers = await supabase.entities.ServiceUser.list();
    
    let logsCreated = 0;

    for (const serviceUser of serviceUsers) {
      if (!serviceUser.call_times || serviceUser.call_times.length === 0) continue;

      const today = new Date().toISOString().split('T')[0];

      // For each scheduled call time
      for (const callTime of serviceUser.call_times) {
        // Check if a care log already exists for this call today
        const existingLogs = await (async () => { const { data, error } = await supabase.from('care_logs').select('*'); if (error) throw error; return data || [] })();

        if (existingLogs.length === 0) {
          // Create a pending care log for this call
          await (async () => { const { data, error } = await supabase.from('care_logs').insert({
            service_user_id: serviceUser.id,
            service_user_name: serviceUser.full_name,
            shift_id: '', // Not shift-based anymore
            staff_id: '', // Will be filled when staff completes it
            staff_name: '',
            visit_date: today,
            visit_time: callTime.time,
            status: 'pending',
            branch: serviceUser.branch,
            shift_end_time: callTime.time, // Used for overdue calculation
          }).select().single(); if (error) throw error; return data })();

          logsCreated++;
        }
      }
    }

    return Response.json({ 
      success: true, 
      message: `Created ${logsCreated} new pending care logs` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

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
    const body = await req.json();
    const { event, data } = body;
    
    // Only process create and update events
    if (event.type !== 'create' && event.type !== 'update') {
      return Response.json({ success: true });
    }

    const serviceUser = data;
    if (!serviceUser?.call_times || serviceUser.call_times.length === 0) {
      return Response.json({ success: true });
    }

    // Get all shifts that haven't been completed or cancelled
    const allShifts = await (async () => { const { data, error } = await supabaseAdmin.from('shifts').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const relevantShifts = allShifts.filter(shift => {
      const shiftDate = new Date(shift.date);
      shiftDate.setHours(0, 0, 0, 0);
      return shiftDate >= today && 
             ['scheduled', 'in_progress'].includes(shift.status);
    });

    // For each call time in the service user's call times
    for (const callTime of serviceUser.call_times) {
      for (const shift of relevantShifts) {
        // Check if shift time window covers the call time
        const [callHour, callMin] = callTime.time.split(':').map(Number);
        const [shiftStartHour, shiftStartMin] = shift.start_time.split(':').map(Number);
        const [shiftEndHour, shiftEndMin] = shift.end_time.split(':').map(Number);
        
        const callTotalMins = callHour * 60 + callMin;
        const shiftStartMins = shiftStartHour * 60 + shiftStartMin;
        const shiftEndMins = shiftEndHour * 60 + shiftEndMin;
        
        const isTimeInWindow = callTotalMins >= shiftStartMins && callTotalMins < shiftEndMins;
        
        if (isTimeInWindow && shift.date === serviceUser.call_dates) {
          // Check if this call already exists
          const existingCalls = await (async () => { const { data, error } = await supabaseAdmin.from('shift_calls').select('*'); if (error) throw error; return data || [] })();

          if (existingCalls.length === 0) {
            // Create new ShiftCall
            await (async () => { const { data, error } = await supabaseAdmin.from('shift_calls').insert({
              shift_id: shift.id,
              service_user_id: serviceUser.id,
              service_user_name: serviceUser.full_name,
              service_user_address: serviceUser.address,
              date: shift.date,
              scheduled_time: callTime.time,
              duration_minutes: parseInt(callTime.duration) || 30,
              status: 'pending',
              branch: shift.branch
            }).select().single(); if (error) throw error; return data })();
          } else {
            // Update existing ShiftCall
            await (async () => { const { data, error } = await supabaseAdmin.from('shift_calls').update({
              service_user_name: serviceUser.full_name,
              service_user_address: serviceUser.address,
              duration_minutes: parseInt(callTime.duration) || 30
            }).eq('id', existingCalls[0].id).select().single(); if (error) throw error; return data })();
          }
        }
      }
    }

    return Response.json({ success: true, processed: true });
  } catch (error) {
    console.error('Error syncing calls:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

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
    const { careLogId, shiftId, serviceUserId, shiftCallId } = await req.json();

    if (!careLogId || !shiftId || !serviceUserId || !shiftCallId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the original shift call to get its timing
    const originalCall = await (async () => { const { data, error } = await supabase.from('shift_calls').select('*').eq('id', shiftCallId).single(); if (error) return null; return data })();
    if (!originalCall) {
      return Response.json({ success: true }); // Call not found, continue anyway
    }

    // Get the original shift to find paired shift
    const shift = await (async () => { const { data, error } = await supabase.from('shifts').select('*').eq('id', shiftId).single(); if (error) return null; return data })();
    if (!shift) {
      return Response.json({ success: true }); // Shift not found, continue anyway
    }

    // If there's a paired shift
    if (shift.paired_shift_id) {
      // Get the paired shift
      const pairedShift = await (async () => { const { data, error } = await supabase.from('shifts').select('*').eq('id', shift.paired_shift_id).single(); if (error) return null; return data })();

      if (pairedShift) {
        // Find the matching client call in the paired shift (same service user AND same timing)
        const pairedShiftCalls = await (async () => { const { data, error } = await supabase.from('shift_calls').select('*'); if (error) throw error; return data || [] })();

        // Match by start and end time to find the exact same call
        const matchingCall = pairedShiftCalls.find(call => 
          call.start_time === originalCall.start_time && 
          call.end_time === originalCall.end_time
        );

        if (matchingCall) {
          // Mark only the matching paired shift's call as completed
          await (async () => { const { data, error } = await supabase.from('shift_calls').update({
            status: 'completed',
            clock_out_time: new Date().toISOString()
          }).eq('id', matchingCall.id).select().single(); if (error) throw error; return data })();
        }
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

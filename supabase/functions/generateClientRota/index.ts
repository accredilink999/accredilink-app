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

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceUserId, serviceUserName, callTimes, teamId, recurrence } = await req.json();

    if (!serviceUserId || !teamId || !callTimes || !Array.isArray(callTimes)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Calculate end date based on recurrence
    const today = new Date();
    let endDate = new Date();

    const recurrenceDays = {
      'day': 1,
      'week': 7,
      'month': 30,
      'year': 365,
      'ongoing': 365, // Default to 1 year for ongoing, can be extended manually
    };

    endDate.setDate(endDate.getDate() + (recurrenceDays[recurrence] || 30));

    // Generate shifts for each call time for each day in the period
    const shifts = [];
    let currentDate = new Date(today);

    while (currentDate <= endDate) {
      for (const callTime of callTimes) {
        const shiftData = {
          staff_id: '', // Will be assigned by team staff
          staff_name: '',
          service_user_id: serviceUserId,
          service_user_name: serviceUserName,
          date: currentDate.toISOString().split('T')[0],
          start_time: callTime.time,
          end_time: calculateEndTime(callTime.time, callTime.duration),
          status: 'scheduled',
          tasks: callTime.notes ? [{ task: callTime.notes, completed: false }] : [],
          care_notes: `${callTime.type} call scheduled`,
          rota_area_id: teamId, // Store team ID here for filtering
        };

        shifts.push(shiftData);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create all shifts in bulk
    const createdShifts = await (async () => { const { data, error } = await supabaseAdmin.from('shifts').insert(shifts).select(); if (error) throw error; return data || [] })();

    console.log('Created shifts:', createdShifts.length, 'with data:', JSON.stringify(createdShifts.slice(0, 2)));

    // Create corresponding care logs for each shift (only when staff is assigned)
    const careLogs = createdShifts
      .filter(shift => shift.staff_id) // Only create logs for assigned staff
      .map(shift => ({
        service_user_id: serviceUserId,
        service_user_name: serviceUserName,
        visit_date: shift.date,
        visit_time: shift.start_time,
        staff_id: shift.staff_id,
        shift_id: shift.id,
        status: 'pending',
        notes: shift.care_notes,
      }));

    console.log('Care logs to create:', careLogs.length);

    if (careLogs.length > 0) {
      await (async () => { const { data, error } = await supabaseAdmin.from('healthcare_logs').insert(careLogs).select(); if (error) throw error; return data })();
    }

    // Update service user with team assignment (safe update)
    try {
      await (async () => { const { data, error } = await supabaseAdmin.from('service_users').update({
        team_id: teamId
      }).eq('id', serviceUserId).select().single(); if (error) throw error; return data })();
    } catch (updateError) {
      console.error('Warning: Could not update service user team:', updateError.message);
    }

    // Log audit entry
    await (async () => { const { data, error } = await supabaseAdmin.from('audit_logs').insert({
      action: 'create',
      entity_type: 'Shift',
      entity_id: serviceUserId,
      entity_name: serviceUserName,
      user_id: user.id,
      user_name: user.full_name,
      details: `Generated ${createdShifts.length} recurring shifts (${recurrence}) with care logs for client and assigned to team`
    }).select().single(); if (error) throw error; return data })();

    return Response.json({
      success: true,
      shiftsCreated: createdShifts.length,
      endDate: endDate.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error generating client rota:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calculateEndTime(startTime, durationMinutes) {
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  date.setMinutes(date.getMinutes() + (durationMinutes || 60));

  const endHours = String(date.getHours()).padStart(2, '0');
  const endMinutes = String(date.getMinutes()).padStart(2, '0');
  return `${endHours}:${endMinutes}`;
}

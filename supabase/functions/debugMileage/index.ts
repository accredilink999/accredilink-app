import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const body = await req.json()
    const { staffName, clientName } = body

    // --- CLIENT/SERVICE USER DEBUG MODE ---
    if (clientName) {
      // Find service user in service_users table
      const { data: serviceUsers } = await supabaseAdmin
        .from('service_users')
        .select('id, full_name, address, latitude, longitude, status')
        .ilike('full_name', `%${clientName}%`)
        .limit(5)

      // Find ALL shift_calls for this client name (recent)
      const { data: clientCalls } = await supabaseAdmin
        .from('shift_calls')
        .select('id, shift_id, service_user_id, service_user_name, service_user_address, checkin_latitude, checkin_longitude, drove_to_call, clock_in_time, clock_out_time, status, call_date, scheduled_time')
        .ilike('service_user_name', `%${clientName}%`)
        .order('call_date', { ascending: false })
        .limit(50)

      // Get the shifts these calls belong to (to see staff names)
      const callShiftIds = [...new Set((clientCalls || []).map(c => c.shift_id).filter(Boolean))]
      let callShifts: any[] = []
      if (callShiftIds.length > 0) {
        const { data: shifts } = await supabaseAdmin
          .from('shifts')
          .select('id, staff_name, staff_id, date')
          .in('id', callShiftIds)
        callShifts = shifts || []
      }
      const shiftMap: Record<string, any> = {}
      for (const s of callShifts) shiftMap[s.id] = s

      // Check historical GPS data for this client's service_user_id
      const suIds = [...new Set((serviceUsers || []).map(s => s.id))]
      let historicalGPS: any[] = []
      if (suIds.length > 0) {
        const { data: gps } = await supabaseAdmin
          .from('shift_calls')
          .select('service_user_id, checkin_latitude, checkin_longitude')
          .in('service_user_id', suIds)
          .not('checkin_latitude', 'is', null)
          .not('checkin_longitude', 'is', null)
          .limit(50)
        historicalGPS = gps || []
      }

      // Check locations table
      let locationEntries: any[] = []
      if (suIds.length > 0) {
        const { data: locs } = await supabaseAdmin
          .from('locations')
          .select('service_user_id, latitude, longitude')
          .in('service_user_id', suIds)
          .limit(10)
        locationEntries = locs || []
      }

      // Name matching check: does the shift_call service_user_name EXACTLY match service_users.full_name?
      const callNames = [...new Set((clientCalls || []).map(c => c.service_user_name).filter(Boolean))]
      const suNames = (serviceUsers || []).map(s => s.full_name)
      const nameMatches: Record<string, boolean> = {}
      for (const cn of callNames) {
        nameMatches[cn] = suNames.some(sn => sn?.toLowerCase().trim() === cn?.toLowerCase().trim())
      }

      return jsonResponse({
        searchTerm: clientName,
        serviceUsers: serviceUsers || [],
        callNames,
        nameMatchesToServiceUsers: nameMatches,
        recentCalls: (clientCalls || []).map(c => ({
          ...c,
          staffName: shiftMap[c.shift_id]?.staff_name || 'unknown',
          shiftDate: shiftMap[c.shift_id]?.date || null,
          hasGPS: !!(c.checkin_latitude && c.checkin_longitude),
          hasServiceUserId: !!c.service_user_id,
        })),
        historicalGPSCount: historicalGPS.length,
        locationTableEntries: locationEntries.length,
        summary: {
          serviceUsersFound: (serviceUsers || []).length,
          hasAddress: (serviceUsers || []).some(s => s.address),
          hasCoordinates: (serviceUsers || []).some(s => s.latitude && s.longitude),
          totalCalls: (clientCalls || []).length,
          callsWithGPS: (clientCalls || []).filter(c => c.checkin_latitude && c.checkin_longitude).length,
          callsWithServiceUserId: (clientCalls || []).filter(c => c.service_user_id).length,
          callsDroveTrue: (clientCalls || []).filter(c => c.drove_to_call === true).length,
          callsDroveFalse: (clientCalls || []).filter(c => c.drove_to_call === false).length,
          callsDroveNull: (clientCalls || []).filter(c => c.drove_to_call === null).length,
          historicalGPSPoints: historicalGPS.length,
          locationTableEntries: locationEntries.length,
          allNamesMATCH: Object.values(nameMatches).every(v => v),
        }
      })
    }

    // --- STAFF DEBUG MODE (original) ---
    const { data: shifts } = await supabaseAdmin
      .from('shifts')
      .select('id, staff_name, staff_id, date')
      .ilike('staff_name', `%${staffName || 'dylan'}%`)
      .gte('date', '2026-02-15')
      .order('date', { ascending: false })
      .limit(10)

    if (!shifts || shifts.length === 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, staff_full_name, full_name')
        .or(`staff_full_name.ilike.%${staffName || 'dylan'}%,full_name.ilike.%${staffName || 'dylan'}%`)
        .limit(5)

      return jsonResponse({
        message: 'No shifts found for this staff name',
        searchTerm: staffName || 'dylan',
        profileMatches: profiles,
      })
    }

    const shiftIds = shifts.map(s => s.id)
    const { data: calls } = await supabaseAdmin
      .from('shift_calls')
      .select('id, shift_id, service_user_id, service_user_name, service_user_address, checkin_latitude, checkin_longitude, drove_to_call, clock_in_time, status')
      .in('shift_id', shiftIds)
      .order('clock_in_time', { ascending: true })

    const { data: expenses } = await supabaseAdmin
      .from('expenses')
      .select('id, shift_id, staff_name, amount, mileage, mileage_distance, date, expense_type')
      .in('shift_id', shiftIds)
      .eq('expense_type', 'mileage')

    const suIds = [...new Set((calls || []).map(c => c.service_user_id).filter(Boolean))]
    const { data: serviceUsers } = await supabaseAdmin
      .from('service_users')
      .select('id, full_name, address, latitude, longitude')
      .in('id', suIds.length > 0 ? suIds : ['none'])

    return jsonResponse({
      shifts,
      calls: (calls || []).map(c => ({
        ...c,
        hasGPS: !!(c.checkin_latitude && c.checkin_longitude),
      })),
      existingExpenses: expenses,
      serviceUsers,
      summary: {
        totalShifts: shifts?.length || 0,
        totalCalls: calls?.length || 0,
        callsWithGPS: (calls || []).filter(c => c.checkin_latitude && c.checkin_longitude).length,
        callsDroveTrue: (calls || []).filter(c => c.drove_to_call === true).length,
        callsDroveFalse: (calls || []).filter(c => c.drove_to_call === false).length,
        callsDroveNull: (calls || []).filter(c => c.drove_to_call === null).length,
        serviceUsersWithCoords: (serviceUsers || []).filter(s => s.latitude && s.longitude).length,
        serviceUsersWithAddress: (serviceUsers || []).filter(s => s.address).length,
        existingMileageExpenses: expenses?.length || 0,
      }
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
})

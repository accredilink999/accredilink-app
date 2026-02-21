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

    const { staffName } = await req.json()

    // Find shifts for this staff member in the last 7 days
    const { data: shifts } = await supabaseAdmin
      .from('shifts')
      .select('id, staff_name, staff_id, date')
      .ilike('staff_name', `%${staffName || 'dylan'}%`)
      .gte('date', '2026-02-15')
      .order('date', { ascending: false })
      .limit(10)

    if (!shifts || shifts.length === 0) {
      // Try profiles table
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

    // Get shift_calls for these shifts
    const shiftIds = shifts.map(s => s.id)
    const { data: calls } = await supabaseAdmin
      .from('shift_calls')
      .select('id, shift_id, service_user_id, service_user_name, service_user_address, checkin_latitude, checkin_longitude, drove_to_call, clock_in_time, status')
      .in('shift_id', shiftIds)
      .order('clock_in_time', { ascending: true })

    // Check existing expenses
    const { data: expenses } = await supabaseAdmin
      .from('expenses')
      .select('id, shift_id, staff_name, amount, mileage, mileage_distance, date, expense_type')
      .in('shift_id', shiftIds)
      .eq('expense_type', 'mileage')

    // Check service user locations
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

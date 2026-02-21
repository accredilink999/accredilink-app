import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getSundayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function getFollowingThursday(weekStart: Date): Date {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 11)
  d.setHours(0, 0, 0, 0)
  return d
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

    // Verify admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, job_title')
      .eq('id', user.id)
      .single()
    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(profile?.job_title)
    if (!isAdmin) return jsonResponse({ error: 'Admin access required' }, 403)

    // Get configured rate
    const { data: rateSetting } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'mileage_rate_ppm')
      .limit(1)
      .single()
    const ratePpm = rateSetting?.setting_value ? parseInt(rateSetting.setting_value, 10) : 45
    const ratePerMile = ratePpm / 100

    // Get all shift_calls where drove_to_call = true
    const { data: droveCalls, error: callsErr } = await supabaseAdmin
      .from('shift_calls')
      .select('id, shift_id, service_user_id, service_user_name, checkin_latitude, checkin_longitude, clock_in_time, created_at')
      .eq('drove_to_call', true)
      .order('clock_in_time', { ascending: true })

    if (callsErr) throw callsErr
    if (!droveCalls || droveCalls.length === 0) {
      return jsonResponse({ success: true, message: 'No drove_to_call records found', created: 0 })
    }

    // Group by shift_id
    const byShift: Record<string, any[]> = {}
    for (const call of droveCalls) {
      if (!call.shift_id) continue
      if (!byShift[call.shift_id]) byShift[call.shift_id] = []
      byShift[call.shift_id].push(call)
    }

    // Get existing expense shift_ids to skip duplicates
    const { data: existingExpenses } = await supabaseAdmin
      .from('expenses')
      .select('shift_id')
      .eq('expense_type', 'mileage')
      .not('shift_id', 'is', null)

    const existingShiftIds = new Set((existingExpenses || []).map(e => e.shift_id))

    // Get service_user locations for fallback GPS
    const serviceUserIds = [...new Set(droveCalls.map(c => c.service_user_id).filter(Boolean))]
    let locationMap: Record<string, { latitude: number, longitude: number }> = {}
    if (serviceUserIds.length > 0) {
      const { data: locations } = await supabaseAdmin
        .from('locations')
        .select('service_user_id, latitude, longitude')
        .in('service_user_id', serviceUserIds)
        .order('created_at', { ascending: false })

      for (const loc of (locations || [])) {
        if (loc.service_user_id && loc.latitude && loc.longitude && !locationMap[loc.service_user_id]) {
          locationMap[loc.service_user_id] = { latitude: loc.latitude, longitude: loc.longitude }
        }
      }
    }

    // Get shift details for dates and staff
    const shiftIds = Object.keys(byShift)
    const { data: shifts } = await supabaseAdmin
      .from('shifts')
      .select('id, date, staff_id, staff_name')
      .in('id', shiftIds)

    const shiftMap: Record<string, any> = {}
    for (const s of (shifts || [])) {
      shiftMap[s.id] = s
    }

    // Get staff names from profiles
    const staffIds = [...new Set((shifts || []).map(s => s.staff_id).filter(Boolean))]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, staff_full_name, full_name')
      .in('id', staffIds)

    const profileMap: Record<string, any> = {}
    for (const p of (profiles || [])) {
      profileMap[p.id] = p
    }

    let created = 0
    let skipped = 0
    const errors: string[] = []

    for (const [shiftId, calls] of Object.entries(byShift)) {
      // Skip if expense already exists
      if (existingShiftIds.has(shiftId)) {
        skipped++
        continue
      }

      const shift = shiftMap[shiftId]
      if (!shift) continue

      // Resolve GPS: use checkin_latitude/longitude, fallback to service_user location
      const resolved = calls
        .map(c => {
          const lat = c.checkin_latitude || locationMap[c.service_user_id]?.latitude
          const lng = c.checkin_longitude || locationMap[c.service_user_id]?.longitude
          return lat && lng ? { ...c, lat: Number(lat), lng: Number(lng) } : null
        })
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(a.clock_in_time || a.created_at).getTime() - new Date(b.clock_in_time || b.created_at).getTime())

      if (resolved.length < 2) continue

      // Calculate total miles
      let totalMiles = 0
      for (let i = 0; i < resolved.length - 1; i++) {
        totalMiles += haversineMiles(
          resolved[i]!.lat, resolved[i]!.lng,
          resolved[i + 1]!.lat, resolved[i + 1]!.lng
        )
      }

      if (totalMiles <= 0.1) continue

      totalMiles = Math.round(totalMiles * 100) / 100
      const amount = Math.round(totalMiles * ratePerMile * 100) / 100

      const expenseDate = shift.date || new Date().toISOString().split('T')[0]
      const shiftDate = new Date(expenseDate)
      const weekStart = getSundayOfWeek(shiftDate)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const paymentDue = getFollowingThursday(weekStart)

      const staffProfile = profileMap[shift.staff_id]
      const staffName = staffProfile?.staff_full_name || staffProfile?.full_name || shift.staff_name || 'Unknown'

      const { error: insertErr } = await supabaseAdmin.from('expenses').insert({
        staff_id: shift.staff_id,
        staff_name: staffName,
        shift_id: shiftId,
        expense_type: 'mileage',
        amount,
        date: expenseDate,
        expense_date: expenseDate,
        description: `Auto mileage: ${totalMiles} miles @ ${ratePpm}p/mile`,
        mileage: totalMiles,
        mileage_distance: totalMiles,
        mileage_rate: ratePerMile,
        week_start_date: weekStart.toISOString().split('T')[0],
        week_end_date: weekEnd.toISOString().split('T')[0],
        payment_due_date: paymentDue.toISOString().split('T')[0],
        status: 'pending'
      })

      if (insertErr) {
        errors.push(`Shift ${shiftId}: ${insertErr.message}`)
      } else {
        created++
      }
    }

    return jsonResponse({
      success: true,
      message: `Created ${created} mileage expenses, skipped ${skipped} (already exist)`,
      created,
      skipped,
      totalShifts: Object.keys(byShift).length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
})

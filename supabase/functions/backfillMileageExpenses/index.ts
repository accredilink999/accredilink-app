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

// Postcode → coords cache
const postcodeCoords: Record<string, { latitude: number, longitude: number }> = {}

async function bulkLookupPostcodes(postcodes: string[]): Promise<void> {
  const toFetch = [...new Set(postcodes.map(p => p.trim().toUpperCase()))].filter(p => p && !(p in postcodeCoords))
  for (let i = 0; i < toFetch.length; i += 100) {
    const batch = toFetch.slice(i, i + 100)
    try {
      const res = await fetch('https://api.postcodes.io/postcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: batch }),
      })
      if (!res.ok) continue
      const data = await res.json()
      if (data.status === 200 && data.result) {
        for (const r of data.result) {
          if (r.result && r.result.latitude && r.result.longitude) {
            postcodeCoords[r.query.toUpperCase()] = {
              latitude: r.result.latitude,
              longitude: r.result.longitude,
            }
          }
        }
      }
    } catch { /* continue */ }
  }
}

// Week runs Friday to Thursday
function getFridayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = (day + 2) % 7
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getPaymentThursday(weekStartFriday: Date): Date {
  const d = new Date(weekStartFriday)
  d.setDate(d.getDate() + 6)
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

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekStart = getFridayOfWeek(today)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    // Get configured mileage rate
    const { data: rateSetting } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'mileage_rate_ppm')
      .limit(1)
      .single()
    const ratePpm = rateSetting?.setting_value ? parseInt(rateSetting.setting_value, 10) : 45
    const ratePerMile = ratePpm / 100

    // ========================================
    // STEP 1: Get service user postcodes
    // ========================================
    const { data: allServiceUsers } = await supabaseAdmin
      .from('service_users')
      .select('id, full_name, postcode')

    const postcodeById: Record<string, string> = {}
    const nameById: Record<string, string> = {}
    const postcodeByName: Record<string, string> = {}
    for (const su of (allServiceUsers || [])) {
      const pc = (su.postcode || '').trim().toUpperCase()
      if (su.full_name) nameById[su.id] = su.full_name
      if (pc) {
        postcodeById[su.id] = pc
        if (su.full_name) postcodeByName[su.full_name.toLowerCase().trim()] = pc
      }
    }

    const uniquePostcodes = [...new Set(Object.values(postcodeById))]
    await bulkLookupPostcodes(uniquePostcodes)

    // ========================================
    // STEP 2: Get THIS WEEK's shifts (Sunday to today)
    // ========================================
    const { data: weekShifts, error: shiftsErr } = await supabaseAdmin
      .from('shifts')
      .select('id, date, staff_id, staff_name')
      .gte('date', weekStartStr)
      .lte('date', todayStr)
      .limit(500)

    if (shiftsErr) throw shiftsErr
    if (!weekShifts || weekShifts.length === 0) {
      return jsonResponse({ success: true, message: 'No shifts found for this week', created: 0, weekRange: `${weekStartStr} to ${todayStr}` })
    }

    const shiftMap: Record<string, any> = {}
    for (const s of weekShifts) shiftMap[s.id] = s
    const shiftIds = weekShifts.map(s => s.id)

    // ========================================
    // STEP 3: Get ALL shift_calls for this week's shifts
    // ========================================
    let allCalls: any[] = []
    for (let i = 0; i < shiftIds.length; i += 100) {
      const { data: batch } = await supabaseAdmin
        .from('shift_calls')
        .select('id, shift_id, service_user_id, service_user_name, scheduled_time, clock_in_time, drove_to_call')
        .in('shift_id', shiftIds.slice(i, i + 100))
        .limit(2000)
      if (batch) allCalls = allCalls.concat(batch)
    }

    // Only include calls where staff said "Yes I drove" (not false, not null for backcompat)
    const eligibleCalls = allCalls.filter(c => c.drove_to_call !== false)

    // Attach postcode + coords to each call
    for (const call of eligibleCalls) {
      const pc = (call.service_user_id && postcodeById[call.service_user_id])
        ? postcodeById[call.service_user_id]
        : (call.service_user_name && postcodeByName[call.service_user_name.toLowerCase().trim()])
          ? postcodeByName[call.service_user_name.toLowerCase().trim()]
          : null
      if (pc) {
        call._postcode = pc
        const coords = postcodeCoords[pc.toUpperCase()]
        if (coords) {
          call._lat = coords.latitude
          call._lng = coords.longitude
        }
      }
      // Resolve display name
      call._clientName = call.service_user_name
        || (call.service_user_id && nameById[call.service_user_id])
        || call._postcode
        || '?'
    }

    // ========================================
    // STEP 4: Group calls by STAFF + DATE (not by shift)
    // ========================================
    // Each call belongs to a shift, and each shift has a staff_id + date
    const byStaffDate: Record<string, { staffId: string, date: string, calls: any[] }> = {}
    for (const call of eligibleCalls) {
      const shift = shiftMap[call.shift_id]
      if (!shift) continue
      const key = `${shift.staff_id}__${shift.date}`
      if (!byStaffDate[key]) {
        byStaffDate[key] = { staffId: shift.staff_id, date: shift.date, calls: [] }
      }
      byStaffDate[key].calls.push(call)
    }

    // Get staff names
    const staffIds = [...new Set(weekShifts.map(s => s.staff_id).filter(Boolean))]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, staff_full_name, full_name')
      .in('id', staffIds.length > 0 ? staffIds : ['none'])
    const profileMap: Record<string, any> = {}
    for (const p of (profiles || [])) profileMap[p.id] = p

    // Delete ALL old mileage expenses for this week (cleans up per-shift duplicates)
    // Then we recreate fresh per-staff per-date expenses below
    const { data: oldExpenses } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('expense_type', 'mileage')
      .gte('date', weekStartStr)
      .lte('date', todayStr)
    let deleted = 0
    if (oldExpenses && oldExpenses.length > 0) {
      const oldIds = oldExpenses.map(e => e.id)
      for (let i = 0; i < oldIds.length; i += 100) {
        await supabaseAdmin
          .from('expenses')
          .delete()
          .in('id', oldIds.slice(i, i + 100))
      }
      deleted = oldIds.length
    }

    // ========================================
    // STEP 5: Calculate mileage per STAFF per DAY
    // ========================================
    let created = 0
    const errors: string[] = []
    const dailyDetails: any[] = []

    for (const [key, group] of Object.entries(byStaffDate)) {
      const { staffId, date: shiftDate, calls } = group

      // Sort ALL calls for this staff member on this day by time
      const sorted = calls
        .filter(c => c._lat && c._lng)
        .sort((a, b) => {
          const tA = a.clock_in_time || a.scheduled_time || ''
          const tB = b.clock_in_time || b.scheduled_time || ''
          return String(tA).localeCompare(String(tB))
        })

      if (sorted.length < 2) continue

      // Calculate consecutive distances across ALL this person's calls today
      let totalMiles = 0
      const legs: string[] = []

      // First call = starting point, 0 miles
      await supabaseAdmin
        .from('shift_calls')
        .update({ call_mileage: 0 })
        .eq('id', sorted[0].id)

      for (let i = 0; i < sorted.length - 1; i++) {
        const dist = haversineMiles(sorted[i]._lat, sorted[i]._lng, sorted[i + 1]._lat, sorted[i + 1]._lng)
        const legRounded = Math.round(dist * 100) / 100
        totalMiles += dist

        legs.push(`${sorted[i]._clientName} → ${sorted[i + 1]._clientName}: ${legRounded}mi`)

        // Store per-call mileage on destination call
        await supabaseAdmin
          .from('shift_calls')
          .update({ call_mileage: legRounded })
          .eq('id', sorted[i + 1].id)
      }

      totalMiles = Math.round(totalMiles * 100) / 100
      const amount = Math.round(totalMiles * ratePerMile * 100) / 100

      const staffProfile = profileMap[staffId]
      const staffName = staffProfile?.staff_full_name || staffProfile?.full_name || 'Unknown'

      dailyDetails.push({
        staff: staffName,
        staffId,
        date: shiftDate,
        totalCalls: calls.length,
        resolvedCalls: sorted.length,
        miles: totalMiles,
        amount,
        legs,
      })

      // Skip creating £0 expenses
      if (totalMiles <= 0) continue

      const dateObj = new Date(shiftDate)
      const wStart = getFridayOfWeek(dateObj)
      const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 6)
      const paymentDue = getPaymentThursday(wStart)
      const desc = `Mileage: ${totalMiles} mi @ ${ratePpm}p/mi\n${legs.join('\n')}`

      const { error: insertErr } = await supabaseAdmin.from('expenses').insert({
        staff_id: staffId,
        staff_name: staffName,
        expense_type: 'mileage',
        amount,
        date: shiftDate,
        expense_date: shiftDate,
        description: desc,
        mileage: totalMiles,
        mileage_distance: totalMiles,
        mileage_rate: ratePerMile,
        week_start_date: wStart.toISOString().split('T')[0],
        week_end_date: wEnd.toISOString().split('T')[0],
        payment_due_date: paymentDue.toISOString().split('T')[0],
        status: 'pending',
      })
      if (insertErr) errors.push(`Insert ${key}: ${insertErr.message}`)
      else created++
    }

    return jsonResponse({
      success: true,
      message: `Deleted ${deleted} old, created ${created} new mileage expenses. (Per-staff per-day)`,
      weekRange: `${weekStartStr} to ${todayStr}`,
      deleted,
      created,
      totalShifts: weekShifts.length,
      totalCalls: allCalls.length,
      eligibleCalls: eligibleCalls.length,
      staffDays: Object.keys(byStaffDate).length,
      dailyDetails,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
})

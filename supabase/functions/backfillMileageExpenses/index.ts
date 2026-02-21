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

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const weekStart = getSundayOfWeek(today)
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
    const postcodeByName: Record<string, string> = {}
    for (const su of (allServiceUsers || [])) {
      const pc = (su.postcode || '').trim().toUpperCase()
      if (pc) {
        postcodeById[su.id] = pc
        if (su.full_name) postcodeByName[su.full_name.toLowerCase().trim()] = pc
      }
    }

    const uniquePostcodes = [...new Set(Object.values(postcodeById))]
    await bulkLookupPostcodes(uniquePostcodes)

    const postcodeResults: Record<string, string> = {}
    for (const pc of uniquePostcodes) {
      postcodeResults[pc] = postcodeCoords[pc] ? 'ok' : 'failed'
    }

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
    // STEP 3: Get shift_calls for this week's shifts only
    // ========================================
    let allCalls: any[] = []
    for (let i = 0; i < shiftIds.length; i += 100) {
      const { data: batch } = await supabaseAdmin
        .from('shift_calls')
        .select('id, shift_id, service_user_id, service_user_name, scheduled_time, clock_in_time, drove_to_call')
        .in('shift_id', shiftIds.slice(i, i + 100))
        .order('scheduled_time', { ascending: true })
        .limit(1000)
      if (batch) allCalls = allCalls.concat(batch)
    }

    // All calls included — only exclude those where staff said "No I didn't drive"
    const eligibleCalls = allCalls.filter(c => c.drove_to_call !== false)

    // Attach postcode to each call from service_users
    for (const call of eligibleCalls) {
      if (call.service_user_id && postcodeById[call.service_user_id]) {
        call._postcode = postcodeById[call.service_user_id]
      } else if (call.service_user_name && postcodeByName[call.service_user_name.toLowerCase().trim()]) {
        call._postcode = postcodeByName[call.service_user_name.toLowerCase().trim()]
      }
    }

    // Group by shift
    const byShift: Record<string, any[]> = {}
    for (const call of eligibleCalls) {
      if (!byShift[call.shift_id]) byShift[call.shift_id] = []
      byShift[call.shift_id].push(call)
    }

    // Get existing mileage expenses for this week's shifts
    let existingExpenses: any[] = []
    for (let i = 0; i < shiftIds.length; i += 100) {
      const { data: eBatch } = await supabaseAdmin
        .from('expenses')
        .select('id, shift_id')
        .eq('expense_type', 'mileage')
        .in('shift_id', shiftIds.slice(i, i + 100))
      if (eBatch) existingExpenses = existingExpenses.concat(eBatch)
    }
    const existingExpenseMap: Record<string, string> = {}
    for (const e of existingExpenses) {
      if (e.shift_id) existingExpenseMap[e.shift_id] = e.id
    }

    // Get staff names
    const staffIds = [...new Set(weekShifts.map(s => s.staff_id).filter(Boolean))]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, staff_full_name, full_name')
      .in('id', staffIds.length > 0 ? staffIds : ['none'])
    const profileMap: Record<string, any> = {}
    for (const p of (profiles || [])) profileMap[p.id] = p

    // ========================================
    // STEP 4: Calculate mileage per shift
    // ========================================
    let created = 0, updated = 0, noPostcode = 0, tooShort = 0, onlyOneCall = 0
    const errors: string[] = []
    const shiftDetails: any[] = []

    for (const [shiftId, calls] of Object.entries(byShift)) {
      const shift = shiftMap[shiftId]
      if (!shift) continue

      // Resolve coordinates from postcodes
      const resolved = calls
        .map(c => {
          const pc = c._postcode
          if (!pc) return null
          const coords = postcodeCoords[pc.toUpperCase()]
          if (!coords) return null
          return { ...c, lat: coords.latitude, lng: coords.longitude, postcode: pc }
        })
        .filter(Boolean)
        .sort((a: any, b: any) => {
          const tA = a.scheduled_time || a.clock_in_time || ''
          const tB = b.scheduled_time || b.clock_in_time || ''
          return String(tA).localeCompare(String(tB))
        })

      if (resolved.length < 2) {
        if (resolved.length === 1) onlyOneCall++
        else noPostcode++
        continue
      }

      // Calculate total miles between consecutive calls and store per-call mileage
      let totalMiles = 0
      const legs: string[] = []
      for (let i = 0; i < resolved.length - 1; i++) {
        const dist = haversineMiles(resolved[i]!.lat, resolved[i]!.lng, resolved[i + 1]!.lat, resolved[i + 1]!.lng)
        totalMiles += dist
        legs.push(`${resolved[i]!.postcode} → ${resolved[i + 1]!.postcode}: ${dist.toFixed(2)}mi`)
        // Store individual leg mileage on the destination call
        const legRounded = Math.round(dist * 100) / 100
        if (legRounded > 0) {
          await supabaseAdmin
            .from('shift_calls')
            .update({ call_mileage: legRounded })
            .eq('id', resolved[i + 1]!.id)
        }
      }

      if (totalMiles <= 0.1) { tooShort++; continue }

      totalMiles = Math.round(totalMiles * 100) / 100
      const amount = Math.round(totalMiles * ratePerMile * 100) / 100
      const expenseDate = shift.date || todayStr
      const shiftDate = new Date(expenseDate)
      const wStart = getSundayOfWeek(shiftDate)
      const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 6)
      const paymentDue = getFollowingThursday(wStart)
      const staffProfile = profileMap[shift.staff_id]
      const staffName = staffProfile?.staff_full_name || staffProfile?.full_name || shift.staff_name || 'Unknown'

      shiftDetails.push({
        shiftId,
        date: shift.date,
        staff: staffName,
        calls: resolved.length,
        miles: totalMiles,
        amount,
        legs,
      })

      const existingId = existingExpenseMap[shiftId]
      if (existingId) {
        const { error: updateErr } = await supabaseAdmin
          .from('expenses')
          .update({
            amount,
            description: `Auto mileage: ${totalMiles} miles @ ${ratePpm}p/mile`,
            mileage: totalMiles,
            mileage_distance: totalMiles,
            mileage_rate: ratePerMile,
          })
          .eq('id', existingId)
        if (updateErr) errors.push(`Update ${shiftId}: ${updateErr.message}`)
        else updated++
      } else {
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
          week_start_date: wStart.toISOString().split('T')[0],
          week_end_date: wEnd.toISOString().split('T')[0],
          payment_due_date: paymentDue.toISOString().split('T')[0],
          status: 'pending'
        })
        if (insertErr) errors.push(`Insert ${shiftId}: ${insertErr.message}`)
        else created++
      }
    }

    return jsonResponse({
      success: true,
      message: `Created ${created}, updated ${updated} mileage expenses.`,
      weekRange: `${weekStartStr} to ${todayStr}`,
      created,
      updated,
      noPostcode,
      onlyOneCall,
      tooShort,
      totalShiftsThisWeek: weekShifts.length,
      totalCallsThisWeek: allCalls.length,
      eligibleCalls: eligibleCalls.length,
      callsWithPostcode: eligibleCalls.filter(c => c._postcode).length,
      postcodeResults,
      shiftDetails,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
})

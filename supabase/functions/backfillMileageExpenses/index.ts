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

// Geocode cache: address → coords (persists for the lifetime of the function invocation)
const geocodeCache: Record<string, { latitude: number, longitude: number } | null> = {}

async function geocodeAddress(address: string): Promise<{ latitude: number, longitude: number } | null> {
  if (!address || address.trim().length < 3) return null
  const key = address.trim().toLowerCase()
  if (key in geocodeCache) return geocodeCache[key]

  const clean = address.replace(/,\s*$/, '').trim()
  const variants = [clean]
  const parts = clean.split(/,\s*/)
  for (let i = 1; i < parts.length; i++) {
    variants.push(parts.slice(i).join(', '))
  }
  const postcodeMatch = clean.match(/[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}/i)
  if (postcodeMatch) variants.push(postcodeMatch[0])

  for (const query of variants) {
    if (query.length < 3) continue
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=gb`
      const res = await fetch(url, { headers: { 'User-Agent': 'AccredilinkApp/1.0' } })
      if (!res.ok) continue
      const results = await res.json()
      if (results && results.length > 0) {
        const coords = { latitude: parseFloat(results[0].lat), longitude: parseFloat(results[0].lon) }
        geocodeCache[key] = coords
        return coords
      }
    } catch { /* continue */ }
    await new Promise(r => setTimeout(r, 1000))
  }
  geocodeCache[key] = null
  return null
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

    const todayStr = new Date().toISOString().split('T')[0]

    // Clean up future-dated mileage expenses
    const { data: futureExpenses } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('expense_type', 'mileage')
      .gt('date', todayStr)
    if (futureExpenses && futureExpenses.length > 0) {
      for (let i = 0; i < futureExpenses.length; i += 100) {
        await supabaseAdmin.from('expenses').delete().in('id', futureExpenses.slice(i, i + 100).map(e => e.id))
      }
    }

    // Get configured mileage rate
    const { data: rateSetting } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'mileage_rate_ppm')
      .limit(1)
      .single()
    const ratePpm = rateSetting?.setting_value ? parseInt(rateSetting.setting_value, 10) : 45
    const ratePerMile = ratePpm / 100

    // Get all shift_calls with an address that have actually been actioned
    const { data: allCalls, error: callsErr } = await supabaseAdmin
      .from('shift_calls')
      .select('id, shift_id, service_user_name, service_user_address, clock_in_time, drove_to_call, created_at')
      .not('shift_id', 'is', null)
      .not('service_user_address', 'is', null)
      .order('clock_in_time', { ascending: true })

    if (callsErr) throw callsErr
    if (!allCalls || allCalls.length === 0) {
      return jsonResponse({ success: true, message: 'No shift_calls found', created: 0 })
    }

    // Only include calls that actually happened
    const eligibleCalls = allCalls.filter(c => {
      if (c.drove_to_call === false) return false
      if (c.drove_to_call === true) return true
      if (c.clock_in_time) return true
      return false
    })

    // Group by shift_id
    const byShift: Record<string, any[]> = {}
    for (const call of eligibleCalls) {
      if (!byShift[call.shift_id]) byShift[call.shift_id] = []
      byShift[call.shift_id].push(call)
    }

    // Get existing mileage expenses
    const { data: existingExpenses } = await supabaseAdmin
      .from('expenses')
      .select('id, shift_id')
      .eq('expense_type', 'mileage')
      .not('shift_id', 'is', null)
    const existingExpenseMap: Record<string, string> = {}
    for (const e of (existingExpenses || [])) {
      if (e.shift_id) existingExpenseMap[e.shift_id] = e.id
    }

    // Pre-geocode all unique addresses (this is the only resolution strategy needed)
    const uniqueAddresses = [...new Set(eligibleCalls.map(c => c.service_user_address).filter(Boolean))]
    let geocoded = 0
    let geocodeFailed = 0
    for (const addr of uniqueAddresses) {
      const coords = await geocodeAddress(addr)
      if (coords) geocoded++
      else geocodeFailed++
    }

    // Get shift details
    const shiftIds = Object.keys(byShift)
    let allShifts: any[] = []
    for (let i = 0; i < shiftIds.length; i += 100) {
      const { data: shifts } = await supabaseAdmin
        .from('shifts')
        .select('id, date, staff_id, staff_name')
        .in('id', shiftIds.slice(i, i + 100))
      if (shifts) allShifts = allShifts.concat(shifts)
    }
    const shiftMap: Record<string, any> = {}
    for (const s of allShifts) shiftMap[s.id] = s

    // Get staff names
    const staffIds = [...new Set(allShifts.map(s => s.staff_id).filter(Boolean))]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, staff_full_name, full_name')
      .in('id', staffIds.length > 0 ? staffIds : ['none'])
    const profileMap: Record<string, any> = {}
    for (const p of (profiles || [])) profileMap[p.id] = p

    let created = 0, updated = 0, noAddress = 0, tooShort = 0
    const errors: string[] = []

    for (const [shiftId, calls] of Object.entries(byShift)) {
      const shift = shiftMap[shiftId]
      if (!shift) continue
      if (shift.date && shift.date > todayStr) continue

      // Resolve each call's coordinates from its address
      const resolved = calls
        .map(c => {
          if (!c.service_user_address) return null
          const coords = geocodeCache[c.service_user_address.trim().toLowerCase()]
          if (!coords) return null
          return { ...c, lat: coords.latitude, lng: coords.longitude }
        })
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(a.clock_in_time || a.created_at).getTime() - new Date(b.clock_in_time || b.created_at).getTime())

      if (resolved.length < 2) {
        noAddress++
        continue
      }

      // Calculate total miles between consecutive calls
      let totalMiles = 0
      for (let i = 0; i < resolved.length - 1; i++) {
        totalMiles += haversineMiles(resolved[i]!.lat, resolved[i]!.lng, resolved[i + 1]!.lat, resolved[i + 1]!.lng)
      }

      if (totalMiles <= 0.1) { tooShort++; continue }

      totalMiles = Math.round(totalMiles * 100) / 100
      const amount = Math.round(totalMiles * ratePerMile * 100) / 100
      const expenseDate = shift.date || todayStr
      const shiftDate = new Date(expenseDate)
      const weekStart = getSundayOfWeek(shiftDate)
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6)
      const paymentDue = getFollowingThursday(weekStart)
      const staffProfile = profileMap[shift.staff_id]
      const staffName = staffProfile?.staff_full_name || staffProfile?.full_name || shift.staff_name || 'Unknown'

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
          week_start_date: weekStart.toISOString().split('T')[0],
          week_end_date: weekEnd.toISOString().split('T')[0],
          payment_due_date: paymentDue.toISOString().split('T')[0],
          status: 'pending'
        })
        if (insertErr) errors.push(`Insert ${shiftId}: ${insertErr.message}`)
        else created++
      }
    }

    return jsonResponse({
      success: true,
      message: `Created ${created}, updated ${updated} mileage expenses. ${noAddress} insufficient address data, ${tooShort} too short.`,
      created,
      updated,
      noAddress,
      tooShort,
      totalShifts: Object.keys(byShift).length,
      totalCalls: eligibleCalls.length,
      uniqueAddresses: uniqueAddresses.length,
      geocoded,
      geocodeFailed,
      futureExpensesCleaned: futureExpenses?.length || 0,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
})

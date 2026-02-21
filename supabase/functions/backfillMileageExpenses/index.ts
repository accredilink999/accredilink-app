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

/**
 * Geocode an address string via OpenStreetMap Nominatim.
 * Tries progressively simpler queries (drops leading parts like house names).
 */
async function geocodeAddress(address: string): Promise<{ latitude: number, longitude: number } | null> {
  if (!address || address.trim().length < 5) return null

  const clean = address.replace(/,\s*$/, '').trim()
  const parts = clean.split(/,\s*/)
  const variants = [clean]
  for (let i = 1; i < parts.length; i++) {
    variants.push(parts.slice(i).join(', '))
  }
  const postcodeMatch = clean.match(/[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}/i)
  if (postcodeMatch) {
    variants.push(postcodeMatch[0])
  }

  for (let vi = 0; vi < variants.length; vi++) {
    const query = variants[vi]
    if (query.length < 3) continue
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'AccredilinkApp/1.0' },
      })
      if (!res.ok) continue
      const results = await res.json()
      if (results && results.length > 0) {
        return {
          latitude: parseFloat(results[0].lat),
          longitude: parseFloat(results[0].lon),
        }
      }
    } catch {
      // continue to next variant
    }
    // Rate limit: 1 req/sec for Nominatim
    if (vi < variants.length - 1) {
      await new Promise(r => setTimeout(r, 1100))
    }
  }
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

    // Get configured rate
    const { data: rateSetting } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'mileage_rate_ppm')
      .limit(1)
      .single()
    const ratePpm = rateSetting?.setting_value ? parseInt(rateSetting.setting_value, 10) : 45
    const ratePerMile = ratePpm / 100

    // Get ALL shift_calls that have a shift_id (not just drove_to_call = true)
    // We include calls where drove_to_call is true OR null (legacy calls before feature existed)
    // We exclude calls where drove_to_call is explicitly false
    const { data: allCalls, error: callsErr } = await supabaseAdmin
      .from('shift_calls')
      .select('id, shift_id, service_user_id, service_user_name, service_user_address, checkin_latitude, checkin_longitude, clock_in_time, clock_out_time, drove_to_call, status, created_at')
      .not('shift_id', 'is', null)
      .order('clock_in_time', { ascending: true })

    if (callsErr) throw callsErr
    if (!allCalls || allCalls.length === 0) {
      return jsonResponse({ success: true, message: 'No shift_calls found', created: 0 })
    }

    // Filter: include drove_to_call = true or null (not false)
    const eligibleCalls = allCalls.filter(c =>
      c.drove_to_call === true || c.drove_to_call === null || c.drove_to_call === undefined
    )

    // Group by shift_id
    const byShift: Record<string, any[]> = {}
    for (const call of eligibleCalls) {
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

    // Build GPS fallback from locations table
    const serviceUserIds = [...new Set(eligibleCalls.map(c => c.service_user_id).filter(Boolean))]
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

      // Also try service_users table for any missing locations (stored latitude/longitude)
      const missingIds = serviceUserIds.filter(id => !locationMap[id])
      if (missingIds.length > 0) {
        const { data: serviceUsers } = await supabaseAdmin
          .from('service_users')
          .select('id, latitude, longitude')
          .in('id', missingIds)

        for (const su of (serviceUsers || [])) {
          if (su.id && su.latitude && su.longitude && !locationMap[su.id]) {
            locationMap[su.id] = { latitude: Number(su.latitude), longitude: Number(su.longitude) }
          }
        }
      }

      // Final fallback: geocode service_user_address via Nominatim for any still-missing IDs
      const stillMissing = serviceUserIds.filter(id => !locationMap[id])
      if (stillMissing.length > 0) {
        // Build address map from shift_calls data
        const addressMap: Record<string, string> = {}
        for (const call of eligibleCalls) {
          if (call.service_user_id && call.service_user_address && !addressMap[call.service_user_id]) {
            addressMap[call.service_user_id] = call.service_user_address
          }
        }

        // Also try service_users.address for any still missing
        const idsNeedingAddress = stillMissing.filter(id => !addressMap[id])
        if (idsNeedingAddress.length > 0) {
          const { data: suAddrs } = await supabaseAdmin
            .from('service_users')
            .select('id, address')
            .in('id', idsNeedingAddress)
          for (const su of (suAddrs || [])) {
            if (su.id && su.address && !addressMap[su.id]) {
              addressMap[su.id] = su.address
            }
          }
        }

        // Geocode unique addresses (deduplicate to save API calls)
        const uniqueAddresses: Record<string, { latitude: number, longitude: number } | null> = {}
        for (const id of stillMissing) {
          const addr = addressMap[id]
          if (!addr) continue

          // Check if we already geocoded this exact address
          if (addr in uniqueAddresses) {
            if (uniqueAddresses[addr]) {
              locationMap[id] = uniqueAddresses[addr]!
            }
            continue
          }

          const coords = await geocodeAddress(addr)
          uniqueAddresses[addr] = coords
          if (coords) {
            locationMap[id] = coords
          }
          // Rate limit between geocoding calls
          await new Promise(r => setTimeout(r, 1100))
        }
      }
    }

    // Get shift details for dates and staff
    const shiftIds = Object.keys(byShift)
    // Supabase .in() has a limit, batch if needed
    let allShifts: any[] = []
    for (let i = 0; i < shiftIds.length; i += 100) {
      const batch = shiftIds.slice(i, i + 100)
      const { data: shifts } = await supabaseAdmin
        .from('shifts')
        .select('id, date, staff_id, staff_name')
        .in('id', batch)
      if (shifts) allShifts = allShifts.concat(shifts)
    }

    const shiftMap: Record<string, any> = {}
    for (const s of allShifts) {
      shiftMap[s.id] = s
    }

    // Get staff names from profiles
    const staffIds = [...new Set(allShifts.map(s => s.staff_id).filter(Boolean))]
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, staff_full_name, full_name')
      .in('id', staffIds)

    const profileMap: Record<string, any> = {}
    for (const p of (profiles || [])) {
      profileMap[p.id] = p
    }

    // Count how many IDs were resolved via geocoding
    const geocodedCount = Object.keys(locationMap).length

    let created = 0
    let skipped = 0
    let noGps = 0
    let tooShort = 0
    const errors: string[] = []

    for (const [shiftId, calls] of Object.entries(byShift)) {
      // Skip if expense already exists
      if (existingShiftIds.has(shiftId)) {
        skipped++
        continue
      }

      const shift = shiftMap[shiftId]
      if (!shift) continue

      // Resolve GPS: checkin coords → locations table → service_users table → Nominatim
      const resolved = calls
        .map(c => {
          let lat = c.checkin_latitude ? Number(c.checkin_latitude) : null
          let lng = c.checkin_longitude ? Number(c.checkin_longitude) : null

          // Fallback to locations/service_users table / geocoded address
          if (!lat || !lng) {
            const cached = locationMap[c.service_user_id]
            if (cached) {
              lat = Number(cached.latitude)
              lng = Number(cached.longitude)
            }
          }

          return lat && lng && !isNaN(lat) && !isNaN(lng)
            ? { ...c, lat, lng }
            : null
        })
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(a.clock_in_time || a.created_at).getTime() - new Date(b.clock_in_time || b.created_at).getTime())

      if (resolved.length < 2) {
        noGps++
        continue
      }

      // Calculate total miles
      let totalMiles = 0
      for (let i = 0; i < resolved.length - 1; i++) {
        totalMiles += haversineMiles(
          resolved[i]!.lat, resolved[i]!.lng,
          resolved[i + 1]!.lat, resolved[i + 1]!.lng
        )
      }

      if (totalMiles <= 0.1) {
        tooShort++
        continue
      }

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
      message: `Created ${created} mileage expenses, skipped ${skipped} existing, ${noGps} insufficient GPS, ${tooShort} too short`,
      created,
      skipped,
      noGps,
      tooShort,
      totalShifts: Object.keys(byShift).length,
      totalCalls: eligibleCalls.length,
      geocodedLocations: geocodedCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
})

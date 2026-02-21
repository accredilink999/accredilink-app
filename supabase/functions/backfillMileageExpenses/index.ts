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
 * Tries full address first, then postcode only.
 */
async function geocodeAddress(address: string): Promise<{ latitude: number, longitude: number } | null> {
  if (!address || address.trim().length < 3) return null

  const clean = address.replace(/,\s*$/, '').trim()
  // Try full address first, then just the postcode
  const variants = [clean]
  const postcodeMatch = clean.match(/[A-Z]{1,2}\d{1,2}\s*\d[A-Z]{2}/i)
  if (postcodeMatch) variants.push(postcodeMatch[0])

  for (const query of variants) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=gb`
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
      // continue
    }
    await new Promise(r => setTimeout(r, 1000))
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

    // Clean up: delete any mileage expenses for future dates (incorrectly created by previous runs)
    const todayCleanup = new Date().toISOString().split('T')[0]
    const { data: futureExpenses } = await supabaseAdmin
      .from('expenses')
      .select('id, date')
      .eq('expense_type', 'mileage')
      .gt('date', todayCleanup)
    if (futureExpenses && futureExpenses.length > 0) {
      const futureIds = futureExpenses.map(e => e.id)
      for (let i = 0; i < futureIds.length; i += 100) {
        const batch = futureIds.slice(i, i + 100)
        await supabaseAdmin.from('expenses').delete().in('id', batch)
      }
      console.log(`Cleaned up ${futureExpenses.length} future-dated mileage expenses`)
    }

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

    // Filter: only calls that have actually happened (checked in OR drove_to_call answered)
    // Exclude calls where drove_to_call is explicitly false
    // Exclude future/unactioned calls (no clock_in_time and drove_to_call still null)
    const todayStr = new Date().toISOString().split('T')[0]
    const eligibleCalls = allCalls.filter(c => {
      if (c.drove_to_call === false) return false // explicitly didn't drive
      if (c.drove_to_call === true) return true // confirmed drove
      // For null drove_to_call (legacy): only include if they actually checked in
      if (c.clock_in_time) return true
      return false // skip unactioned calls (future scheduled)
    })

    // Group by shift_id
    const byShift: Record<string, any[]> = {}
    for (const call of eligibleCalls) {
      if (!byShift[call.shift_id]) byShift[call.shift_id] = []
      byShift[call.shift_id].push(call)
    }

    // Get existing mileage expenses to update or skip
    const { data: existingExpenses } = await supabaseAdmin
      .from('expenses')
      .select('id, shift_id')
      .eq('expense_type', 'mileage')
      .not('shift_id', 'is', null)

    const existingExpenseMap: Record<string, string> = {}
    for (const e of (existingExpenses || [])) {
      if (e.shift_id) existingExpenseMap[e.shift_id] = e.id
    }

    // Build GPS fallback for service users — multiple strategies
    const serviceUserIds = [...new Set(eligibleCalls.map(c => c.service_user_id).filter(Boolean))]
    let locationMap: Record<string, { latitude: number, longitude: number }> = {}
    if (serviceUserIds.length > 0) {
      // Strategy 1: Median of ALL historical checkin GPS for each service user
      // (same approach as client-side gpsCache.js — robust to outliers)
      const gpsGrouped: Record<string, { lats: number[], lngs: number[] }> = {}
      for (const call of allCalls) {
        if (call.service_user_id && call.checkin_latitude && call.checkin_longitude) {
          const lat = Number(call.checkin_latitude)
          const lng = Number(call.checkin_longitude)
          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            if (!gpsGrouped[call.service_user_id]) gpsGrouped[call.service_user_id] = { lats: [], lngs: [] }
            gpsGrouped[call.service_user_id].lats.push(lat)
            gpsGrouped[call.service_user_id].lngs.push(lng)
          }
        }
      }
      for (const [id, coords] of Object.entries(gpsGrouped)) {
        const sortedLats = [...coords.lats].sort((a, b) => a - b)
        const sortedLngs = [...coords.lngs].sort((a, b) => a - b)
        const midLat = Math.floor(sortedLats.length / 2)
        const midLng = Math.floor(sortedLngs.length / 2)
        locationMap[id] = {
          latitude: sortedLats.length % 2 === 0 ? (sortedLats[midLat - 1] + sortedLats[midLat]) / 2 : sortedLats[midLat],
          longitude: sortedLngs.length % 2 === 0 ? (sortedLngs[midLng - 1] + sortedLngs[midLng]) / 2 : sortedLngs[midLng],
        }
      }

      // Strategy 2: locations table
      const missing2 = serviceUserIds.filter(id => !locationMap[id])
      if (missing2.length > 0) {
        const { data: locations } = await supabaseAdmin
          .from('locations')
          .select('service_user_id, latitude, longitude')
          .in('service_user_id', missing2)
          .order('created_at', { ascending: false })

        for (const loc of (locations || [])) {
          if (loc.service_user_id && loc.latitude && loc.longitude && !locationMap[loc.service_user_id]) {
            locationMap[loc.service_user_id] = { latitude: loc.latitude, longitude: loc.longitude }
          }
        }
      }

      // Strategy 3: service_users table lat/lng
      const missing3 = serviceUserIds.filter(id => !locationMap[id])
      if (missing3.length > 0) {
        const { data: serviceUsers } = await supabaseAdmin
          .from('service_users')
          .select('id, latitude, longitude')
          .in('id', missing3)

        for (const su of (serviceUsers || [])) {
          if (su.id && su.latitude && su.longitude && !locationMap[su.id]) {
            locationMap[su.id] = { latitude: Number(su.latitude), longitude: Number(su.longitude) }
          }
        }
      }

      // Strategy 4: Geocode ALL missing service_user addresses via Nominatim
      // Also saves coordinates back to service_users table so they persist
      const missing4 = serviceUserIds.filter(id => !locationMap[id])
      if (missing4.length > 0) {
        // Get ALL addresses for missing IDs from service_users table
        const { data: suWithAddrs } = await supabaseAdmin
          .from('service_users')
          .select('id, address')
          .in('id', missing4)

        // Also check shift_calls for addresses
        const addressMap: Record<string, string> = {}
        for (const su of (suWithAddrs || [])) {
          if (su.id && su.address) addressMap[su.id] = su.address
        }
        for (const call of eligibleCalls) {
          if (call.service_user_id && call.service_user_address && !addressMap[call.service_user_id]) {
            addressMap[call.service_user_id] = call.service_user_address
          }
        }

        // Geocode unique addresses (deduplicate to save API calls)
        const uniqueAddresses: Record<string, { latitude: number, longitude: number } | null> = {}
        for (const id of missing4) {
          const addr = addressMap[id]
          if (!addr) continue

          if (addr in uniqueAddresses) {
            if (uniqueAddresses[addr]) {
              locationMap[id] = uniqueAddresses[addr]!
              // Save to service_users for next time
              await supabaseAdmin.from('service_users').update({
                latitude: uniqueAddresses[addr]!.latitude,
                longitude: uniqueAddresses[addr]!.longitude,
              }).eq('id', id)
            }
            continue
          }

          const coords = await geocodeAddress(addr)
          uniqueAddresses[addr] = coords
          if (coords) {
            locationMap[id] = coords
            // Save to service_users so next run picks them up from Strategy 3
            await supabaseAdmin.from('service_users').update({
              latitude: coords.latitude,
              longitude: coords.longitude,
            }).eq('id', id)
          }
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

    // Build name-based fallback for calls without service_user_id
    // Maps service_user_name → coordinates from locationMap or service_users table
    const nameLocationMap: Record<string, { latitude: number, longitude: number }> = {}

    // First: populate from existing locationMap using call data to link names to IDs
    for (const call of allCalls) {
      if (call.service_user_name && call.service_user_id && locationMap[call.service_user_id]) {
        const key = call.service_user_name.toLowerCase().trim()
        if (!nameLocationMap[key]) {
          nameLocationMap[key] = locationMap[call.service_user_id]
        }
      }
    }

    // Second: look up any remaining names from service_users table
    const callsWithoutSuId = eligibleCalls.filter(c => !c.service_user_id && c.service_user_name)
    const unmatchedNames = [...new Set(callsWithoutSuId
      .map(c => c.service_user_name)
      .filter(n => n && !nameLocationMap[n.toLowerCase().trim()])
    )]
    if (unmatchedNames.length > 0) {
      // Query service_users by name for each unmatched name
      for (const name of unmatchedNames) {
        const { data: match } = await supabaseAdmin
          .from('service_users')
          .select('id, address, latitude, longitude')
          .ilike('full_name', name)
          .limit(1)
        if (match?.[0]) {
          const su = match[0]
          let coords: { latitude: number, longitude: number } | null = null
          if (su.latitude && su.longitude) {
            coords = { latitude: Number(su.latitude), longitude: Number(su.longitude) }
          } else if (su.address) {
            coords = await geocodeAddress(su.address)
            if (coords) {
              // Save back to service_users
              await supabaseAdmin.from('service_users').update({
                latitude: coords.latitude,
                longitude: coords.longitude,
              }).eq('id', su.id)
            }
          }
          if (coords) {
            nameLocationMap[name.toLowerCase().trim()] = coords
          }
        }
      }
    }

    // Count how many IDs were resolved via geocoding
    const geocodedCount = Object.keys(locationMap).length

    let created = 0
    let updated = 0
    let noGps = 0
    let tooShort = 0
    const errors: string[] = []

    for (const [shiftId, calls] of Object.entries(byShift)) {
      const shift = shiftMap[shiftId]
      if (!shift) continue
      // Skip future shifts — only process shifts that have already occurred
      if (shift.date && shift.date > todayStr) continue

      // Resolve GPS: checkin coords → locationMap by ID → nameLocationMap by name
      const resolved = calls
        .map(c => {
          let lat = c.checkin_latitude ? Number(c.checkin_latitude) : null
          let lng = c.checkin_longitude ? Number(c.checkin_longitude) : null

          // Fallback to locationMap by service_user_id
          if ((!lat || !lng) && c.service_user_id) {
            const cached = locationMap[c.service_user_id]
            if (cached) {
              lat = Number(cached.latitude)
              lng = Number(cached.longitude)
            }
          }

          // Fallback to nameLocationMap by service_user_name (for calls without service_user_id)
          if ((!lat || !lng) && c.service_user_name) {
            const byName = nameLocationMap[c.service_user_name.toLowerCase().trim()]
            if (byName) {
              lat = Number(byName.latitude)
              lng = Number(byName.longitude)
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

      const existingId = existingExpenseMap[shiftId]
      if (existingId) {
        // Update existing expense with recalculated mileage
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

        if (updateErr) {
          errors.push(`Shift ${shiftId} update: ${updateErr.message}`)
        } else {
          updated++
        }
      } else {
        // Create new expense
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
    }

    return jsonResponse({
      success: true,
      message: `Created ${created}, updated ${updated} mileage expenses. ${noGps} insufficient GPS, ${tooShort} too short`,
      created,
      updated,
      noGps,
      tooShort,
      totalShifts: Object.keys(byShift).length,
      totalCalls: eligibleCalls.length,
      resolvedLocations: geocodedCount,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
})

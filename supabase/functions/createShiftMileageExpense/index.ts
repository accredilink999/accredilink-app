import { createClient } from 'npm:@supabase/supabase-js@2';

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

function getSundayOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function getFollowingThursday(weekStart: Date): Date {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + 11) // Sunday + 11 = following Thursday
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

    const { shiftId, totalMiles } = await req.json();

    if (!shiftId || !totalMiles || totalMiles <= 0) {
      return jsonResponse({ error: 'Missing or invalid shiftId/totalMiles' }, 400)
    }

    // Check if expense already exists for this shift — update if so, create if not
    const { data: existing } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('shift_id', shiftId)
      .eq('expense_type', 'mileage')
      .limit(1)

    // Get the shift date for proper weekly grouping
    const { data: shift } = await supabaseAdmin
      .from('shifts')
      .select('date')
      .eq('id', shiftId)
      .single()

    const expenseDate = shift?.date || new Date().toISOString().split('T')[0]
    const shiftDate = new Date(expenseDate)
    const weekStart = getSundayOfWeek(shiftDate)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const paymentDue = getFollowingThursday(weekStart)

    // Read configured mileage rate from system_settings (pence per mile)
    const { data: rateSetting } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'mileage_rate_ppm')
      .limit(1)
      .single()
    const ratePpm = rateSetting?.setting_value ? parseInt(rateSetting.setting_value, 10) : 45
    const ratePerMile = ratePpm / 100 // convert pence to pounds
    const amount = Math.round(totalMiles * ratePerMile * 100) / 100

    // Get staff name from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('staff_full_name, full_name')
      .eq('id', user.id)
      .single()

    const staffName = profile?.staff_full_name || profile?.full_name || user.email

    if (existing && existing.length > 0) {
      // Update existing expense with new running total
      const { data: expense, error: updateError } = await supabaseAdmin
        .from('expenses')
        .update({
          amount,
          description: `Auto mileage: ${totalMiles} miles @ ${ratePpm}p/mile`,
          mileage: totalMiles,
          mileage_distance: totalMiles,
          mileage_rate: ratePerMile,
        })
        .eq('id', existing[0].id)
        .select()
        .single();

      if (updateError) {
        console.error('Update error:', updateError);
        return jsonResponse({ error: updateError.message }, 500)
      }
      return jsonResponse({ success: true, updated: true, expense })
    }

    // Create new expense
    const { data: expense, error: insertError } = await supabaseAdmin.from('expenses').insert({
      staff_id: user.id,
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
    }).select().single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return jsonResponse({ error: insertError.message }, 500)
    }

    return jsonResponse({ success: true, expense })
  } catch (error) {
    return jsonResponse({ error: error.message }, 500)
  }
});

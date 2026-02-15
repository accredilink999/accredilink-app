import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

    const { shiftId, totalMiles } = await req.json();

    if (!shiftId || !totalMiles || totalMiles <= 0) {
      return Response.json({ error: 'Missing or invalid shiftId/totalMiles' }, { status: 400 });
    }

    // Prevent duplicate expense for same shift
    const { data: existing } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('shift_id', shiftId)
      .eq('expense_type', 'mileage')
      .limit(1)

    if (existing && existing.length > 0) {
      return Response.json({ success: false, message: 'Mileage expense already exists for this shift' })
    }

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

    const amount = Math.round(totalMiles * 0.45 * 100) / 100

    // Get staff name from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('staff_full_name, full_name')
      .eq('id', user.id)
      .single()

    const staffName = profile?.staff_full_name || profile?.full_name || user.email

    const expense = await (async () => { const { data, error } = await supabaseAdmin.from('expenses').insert({
      staff_id: user.id,
      staff_name: staffName,
      shift_id: shiftId,
      expense_type: 'mileage',
      amount,
      date: expenseDate,
      description: `Auto mileage: ${totalMiles} miles @ £0.45/mile`,
      mileage_distance: totalMiles,
      mileage_rate: 0.45,
      week_start_date: weekStart.toISOString().split('T')[0],
      week_end_date: weekEnd.toISOString().split('T')[0],
      payment_due_date: paymentDue.toISOString().split('T')[0],
      status: 'pending'
    }).select().single(); if (error) throw error; return data })();

    return Response.json({ success: true, expense });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

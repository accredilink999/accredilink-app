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
  d.setDate(d.getDate() + 11)
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

    // Verify admin access
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, job_title')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin' || ['admin', 'manager', 'supervisor'].includes(profile?.job_title)
    if (!isAdmin) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Calculate last week's Sunday-Saturday range
    const today = new Date()
    const thisSunday = getSundayOfWeek(today)
    const lastSunday = new Date(thisSunday)
    lastSunday.setDate(thisSunday.getDate() - 7)
    const lastSaturday = new Date(lastSunday)
    lastSaturday.setDate(lastSunday.getDate() + 6)

    const weekStartStr = lastSunday.toISOString().split('T')[0]
    const weekEndStr = lastSaturday.toISOString().split('T')[0]
    const paymentDue = getFollowingThursday(lastSunday)

    // Get all individual mileage expenses for the week
    const { data: weekExpenses, error: fetchError } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .eq('expense_type', 'mileage')
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)

    if (fetchError) throw fetchError

    // Group by staff_id
    const byStaff: Record<string, any[]> = {}
    for (const exp of (weekExpenses || [])) {
      if (!exp.staff_id) continue
      if (!byStaff[exp.staff_id]) byStaff[exp.staff_id] = []
      byStaff[exp.staff_id].push(exp)
    }

    const results: any[] = []

    for (const [staffId, expenses] of Object.entries(byStaff)) {
      const totalMiles = expenses.reduce((sum: number, e: any) => sum + (e.mileage_distance || e.mileage || 0), 0)
      const totalAmount = Math.round(totalMiles * 0.45 * 100) / 100

      if (totalAmount <= 0) continue

      // Check if weekly summary already exists for this staff + week
      const { data: existing } = await supabaseAdmin
        .from('expenses')
        .select('id')
        .eq('staff_id', staffId)
        .eq('expense_type', 'weekly_mileage')
        .eq('week_start_date', weekStartStr)
        .limit(1)

      if (existing && existing.length > 0) continue

      const staffName = expenses[0].staff_name

      try {
        const { data: weeklyExpense, error: insertError } = await supabaseAdmin
          .from('expenses')
          .insert({
            staff_id: staffId,
            staff_name: staffName,
            expense_type: 'weekly_mileage',
            amount: totalAmount,
            date: weekEndStr,
            description: `Weekly Mileage: ${weekStartStr} to ${weekEndStr} (${totalMiles.toFixed(1)} miles)`,
            mileage_distance: totalMiles,
            mileage_rate: 0.45,
            week_start_date: weekStartStr,
            week_end_date: weekEndStr,
            payment_due_date: paymentDue.toISOString().split('T')[0],
            status: 'pending'
          })
          .select()
          .single()

        if (insertError) {
          console.error(`Error creating weekly expense for ${staffId}:`, insertError)
        } else {
          results.push(weeklyExpense)
        }
      } catch (err) {
        console.error(`Error creating expense for ${staffId}:`, err)
      }
    }

    return Response.json({
      success: true,
      message: `Created ${results.length} weekly mileage summaries`,
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      summaries: results
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

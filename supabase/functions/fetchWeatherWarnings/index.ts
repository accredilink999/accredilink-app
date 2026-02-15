import { createClient } from 'npm:@supabase/supabase-js@2';


const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch weather alerts for UK (using London coords as default, can be customized)
    const latitude = 51.5074;
    const longitude = -0.1278;

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Europe/London&alerts=true`
    );

    const weatherData = await weatherResponse.json();

    if (!weatherData.alerts || weatherData.alerts.length === 0) {
      // No alerts - clear any existing weather warnings
      const existingWarnings = await (async () => { const { data, error } = await supabaseAdmin.from('messages').select('*'); if (error) throw error; return data || [] })();

      for (const warning of existingWarnings) {
        const endTime = new Date(warning.warning_end || warning.created_date).getTime();
        if (endTime < Date.now()) {
          await supabaseAdmin.from('messages').delete().eq('id', warning.id);
        }
      }

      return Response.json({ success: true, message: 'No active weather warnings' });
    }

    // Process alerts
    for (const alert of weatherData.alerts) {
      const existingAlert = await (async () => { const { data, error } = await supabaseAdmin.from('messages').select('*'); if (error) throw error; return data || [] })();

      if (existingAlert.length === 0) {
        // Create new weather warning message
        await (async () => { const { data, error } = await supabaseAdmin.from('messages').insert({
          type: 'weather_warning',
          title: alert.headline,
          content: alert.description,
          priority: 'urgent',
          warning_start: alert.onset,
          warning_end: alert.expires,
          sender_id: user.id,
          sender_name: 'Weather System',
          read_by: []
        }).select().single(); if (error) throw error; return data })();
      }
    }

    return Response.json({
      success: true,
      alerts_created: weatherData.alerts.length,
      message: `${weatherData.alerts.length} weather warning(s) processed`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

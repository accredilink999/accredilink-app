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

    const { firebaseConfig, vapidKey } = await req.json();

    if (!firebaseConfig) {
      return Response.json({ error: 'Firebase config is required' }, { status: 400 });
    }

    // Save Firebase config
    const existingConfig = await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').select('*'); if (error) throw error; return data || [] })();

    if (existingConfig.length > 0) {
      await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').update({
        setting_value: JSON.stringify(firebaseConfig)
      }).eq('id', existingConfig[0].id).select().single(); if (error) throw error; return data })();
    } else {
      await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').insert({
        setting_key: 'firebase_config',
        setting_value: JSON.stringify(firebaseConfig),
        description: 'Firebase web configuration for push notifications'
      }).select().single(); if (error) throw error; return data })();
    }

    // Save VAPID key if provided
    if (vapidKey) {
      const existingVapid = await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').select('*'); if (error) throw error; return data || [] })();

      if (existingVapid.length > 0) {
        await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').update({
          setting_value: vapidKey
        }).eq('id', existingVapid[0].id).select().single(); if (error) throw error; return data })();
      } else {
        await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').insert({
          setting_key: 'firebase_vapid_key',
          setting_value: vapidKey,
          description: 'Firebase VAPID key for web push notifications'
        }).select().single(); if (error) throw error; return data })();
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Firebase configuration saved successfully' 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

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

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, subscription } = await req.json();

    if (action === 'subscribe') {
      // Save the push subscription
      const existing = await (async () => { const { data, error } = await supabase.from('notification_credentials').select('*'); if (error) throw error; return data || [] })();

      if (existing.length > 0) {
        await (async () => { const { data, error } = await supabase.from('notification_credentials').update({
          endpoint: subscription.endpoint,
          keys: JSON.stringify(subscription.keys),
          is_active: true
        }).eq('id', existing[0].id).select().single(); if (error) throw error; return data })();
      } else {
        await (async () => { const { data, error } = await supabase.from('notification_credentials').insert({
          user_id: user.id,
          platform: 'web',
          endpoint: subscription.endpoint,
          keys: JSON.stringify(subscription.keys),
          is_active: true
        }).select().single(); if (error) throw error; return data })();
      }

      return Response.json({ success: true, message: 'Push notifications enabled' });
    } else if (action === 'unsubscribe') {
      const existing = await (async () => { const { data, error } = await supabase.from('notification_credentials').select('*'); if (error) throw error; return data || [] })();

      for (const cred of existing) {
        await (async () => { const { data, error } = await supabase.from('notification_credentials').update({
          is_active: false
        }).eq('id', cred.id).select().single(); if (error) throw error; return data })();
      }

      return Response.json({ success: true, message: 'Push notifications disabled' });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Subscription error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

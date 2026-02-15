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
    
    // This endpoint can be called from service worker without auth
    const { notification_id } = await req.json();

    if (!notification_id) {
      return Response.json({ error: 'notification_id required' }, { status: 400 });
    }

    // Update push notification log if it exists
    const logs = await (async () => { const { data, error } = await supabaseAdmin.from('push_notification_logs').select('*'); if (error) throw error; return data || [] })();

    if (logs.length > 0) {
      for (const log of logs) {
        if (log.status !== 'opened') {
          await (async () => { const { data, error } = await supabaseAdmin.from('push_notification_logs').update({
            status: 'opened',
            opened_at: new Date().toISOString()
          }).eq('id', log.id).select().single(); if (error) throw error; return data })();
        }
      }
    }

    // Update the notification itself
    try {
      const notification = await (async () => { const { data, error } = await supabaseAdmin.from('notifications').select('*').eq('id', notification_id).single(); if (error) throw error; return data })();
      if (notification && !notification.is_read) {
        await (async () => { const { data, error } = await supabaseAdmin.from('notifications').update({
          is_read: true,
          read_at: new Date().toISOString()
        }).eq('id', notification_id).select().single(); if (error) throw error; return data })();
      }
    } catch (err) {
      console.log('Notification not found or already read:', err);
    }

    return Response.json({ success: true, message: 'Notification marked as opened' });

  } catch (error) {
    console.error('Error marking notification as opened:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

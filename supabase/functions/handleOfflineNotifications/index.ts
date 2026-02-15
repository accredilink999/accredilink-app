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

    const body = await req.json();
    const { pending_notifications = [] } = body;

    // Replay stored notifications for offline users
    if (pending_notifications && pending_notifications.length > 0) {
      // Create notification records for each pending notification
      for (const notification of pending_notifications) {
        try {
          await (async () => { const { data, error } = await supabase.from('notifications').insert({
            recipient_id: user.id,
            type: notification.type,
            title: notification.data?.title || notification.type,
            description: notification.data?.description || '',
            is_read: false,
            is_dismissed: false,
            priority: notification.data?.priority || 'normal',
            created_at: new Date(notification.timestamp).toISOString()
          }).select().single(); if (error) throw error; return data })();
        } catch (error) {
          console.error('Failed to create notification:', error);
        }
      }
    }

    return Response.json({ 
      success: true, 
      message: 'Offline notifications processed',
      count: pending_notifications.length 
    });
  } catch (error) {
    console.error('Error handling offline notifications:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

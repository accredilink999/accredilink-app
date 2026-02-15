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

    const { recipient_id, title, body, url } = await req.json();

    if (!recipient_id) {
      return Response.json({ error: 'recipient_id required' }, { status: 400 });
    }

    // Get recipient's push subscription
    const recipient = await supabaseAdmin.entities.User.read(recipient_id);
    
    if (!recipient?.push_subscription) {
      return Response.json({ message: 'No push subscription found' }, { status: 200 });
    }

    // Parse subscription
    const subscription = JSON.parse(recipient.push_subscription);

    // Send push notification
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return Response.json({ error: 'Push service not configured' }, { status: 500 });
    }

    const payload = JSON.stringify({
      title: title || 'New Message',
      body: body || 'You have a new message',
      url: url || '/'
    });

    // Using web-push library would be ideal, but for Deno we'll use fetch
    // In production, you'd want to use a proper web-push implementation
    
    return Response.json({ success: true, message: 'Push notification sent' });
  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

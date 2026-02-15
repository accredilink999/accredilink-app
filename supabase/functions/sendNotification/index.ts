import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts';


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

    const { notification_type, recipient_id, title, message, email_body, voice_text } = await req.json();

    if (!notification_type || !recipient_id || !title || !message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get global notification settings
    const settingsResult = await (async () => { const { data, error } = await supabase.from('system_settings').select('*'); if (error) throw error; return data || [] })();

    let globalSettings = null;
    if (settingsResult.length > 0) {
      try {
        globalSettings = typeof settingsResult[0].setting_value === 'string' 
          ? JSON.parse(settingsResult[0].setting_value) 
          : settingsResult[0].setting_value;
      } catch (e) {
        console.log('Error parsing settings:', e);
      }
    }

    const notificationConfig = globalSettings?.notification_types?.[notification_type];
    
    if (!notificationConfig || !notificationConfig.enabled) {
      return Response.json({ success: true, message: 'Notification type disabled' });
    }

    // Get recipient user
    const recipientUsers = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*'); if (error) throw error; return data || [] })();
    if (!recipientUsers.length) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }
    const recipient = recipientUsers[0];

    const results = {};

    // 1. Create in-app notification
    const notificationRecord = await (async () => { const { data, error } = await supabaseAdmin.from('notifications').insert({
      recipient_id,
      recipient_email: recipient.email,
      notification_type,
      title,
      message,
      priority: notification_type === 'critical_update' || notification_type === 'incident_report' ? 'critical' : 'normal',
      is_read: false,
      is_dismissed: false
    }).select().single(); if (error) throw error; return data })();
    results.in_app = { success: true, id: notificationRecord.id };

    // 2. Send email if enabled
    if (notificationConfig.email) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: title,
          body: email_body || message
        });
        results.email = { success: true };
      } catch (emailError) {
        results.email = { success: false, error: emailError.message };
        console.log('Email error:', emailError);
      }
    }

    // 3. Play alert sound if enabled
    if (notificationConfig.alert_sound) {
      results.alert_sound = { success: true, triggered: true };
    }

    // 4. Voice announcement if enabled and globally enabled
    if (notificationConfig.voice && globalSettings?.voice_enabled) {
      results.voice = { success: true, text: voice_text || message };
    }

    return Response.json({ 
      success: true, 
      notification_id: notificationRecord.id,
      delivery_results: results 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

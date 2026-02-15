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

    // Only admins can extract/configure Firebase
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Get the FIREBASE_ADMIN_KEY from environment
    const adminKeyJson = Deno.env.get('FIREBASE_ADMIN_KEY');
    if (!adminKeyJson) {
      return Response.json({ error: 'FIREBASE_ADMIN_KEY not set' }, { status: 400 });
    }

    const adminKey = JSON.parse(adminKeyJson);

    // Extract public Firebase config from admin key
    const publicConfig = {
      apiKey: adminKey.api_key || '',
      projectId: adminKey.project_id || '',
      senderId: adminKey.sender_id || '',
      appId: adminKey.app_id || '',
      messagingSenderId: adminKey.messaging_sender_id || adminKey.sender_id || '',
    };

    // Get VAPID key from environment or generate placeholder
    const vapidKey = Deno.env.get('FIREBASE_VAPID_KEY') || '';

    // Save to SystemSettings
    const settingsToSave = [
      {
        setting_key: 'firebase_api_key',
        setting_value: publicConfig.apiKey,
        description: 'Firebase API Key'
      },
      {
        setting_key: 'firebase_project_id',
        setting_value: publicConfig.projectId,
        description: 'Firebase Project ID'
      },
      {
        setting_key: 'firebase_sender_id',
        setting_value: publicConfig.messagingSenderId,
        description: 'Firebase Messaging Sender ID'
      },
      {
        setting_key: 'firebase_vapid_key',
        setting_value: vapidKey,
        description: 'Firebase VAPID Key for web push'
      },
      {
        setting_key: 'firebase_configured',
        setting_value: 'true',
        description: 'Firebase is configured'
      }
    ];

    // Try to update or create each setting
    for (const setting of settingsToSave) {
      try {
        // Check if setting exists
        const existing = await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').select('*'); if (error) throw error; return data || [] })();
        if (existing.length > 0) {
          // Update
          await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').update({
            setting_value: setting.setting_value,
            description: setting.description
          }).eq('id', existing[0].id).select().single(); if (error) throw error; return data })();
        } else {
          // Create
          await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').insert(setting).select().single(); if (error) throw error; return data })();
        }
      } catch (e) {
        console.error(`Error saving ${setting.setting_key}:`, e.message);
      }
    }

    return Response.json({
      success: true,
      message: 'Firebase configuration extracted and saved',
      config: {
        apiKey: publicConfig.apiKey,
        projectId: publicConfig.projectId,
        messagingSenderId: publicConfig.messagingSenderId,
        vapidKeySet: !!vapidKey
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

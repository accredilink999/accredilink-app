/**
 * sendTestAndroidPushNotification
 *
 * Admin-only test function: sends a test push notification to a specific device token.
 * Uses the sendFirebasePushNotification function under the hood.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { deviceToken, recipientId } = await req.json();

    if (!deviceToken && !recipientId) {
      return Response.json({
        error: 'Provide deviceToken (direct FCM token) or recipientId (user ID to look up)',
      }, { status: 400 });
    }

    // Send test notification via sendFirebasePushNotification
    const { data: result, error: invokeError } = await supabaseAdmin.functions.invoke(
      'sendFirebasePushNotification',
      {
        body: {
          ...(deviceToken ? { token: deviceToken } : {}),
          ...(recipientId ? { recipient_id: recipientId } : {}),
          title: 'Test Notification',
          message: 'This is a test push notification from Accredilink!',
          priority: 'high',
          data: {
            type: 'test',
            timestamp: new Date().toISOString(),
          },
        },
      },
    );

    if (invokeError) {
      return Response.json({
        success: false,
        error: `Failed to invoke sendFirebasePushNotification: ${invokeError.message}`,
      }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: 'Test notification sent!',
      details: result,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
});

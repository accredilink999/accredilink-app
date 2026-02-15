import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Call another edge function using raw fetch (avoids "Invalid JWT" from supabase.functions.invoke) */
async function callEdgeFunction(name: string, body: Record<string, unknown>) {
  const resp = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${name} returned ${resp.status}: ${text}`);
  }
  return resp.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const {
      recipient_id,
      recipient_ids,
      type,
      title,
      message,
      priority,
      action_url,
      related_entity_type,
      related_entity_id,
      metadata,
      send_push,
    } = await req.json();

    if (!type || !title || !message) {
      return jsonResponse({ error: 'type, title, and message required' }, 400);
    }

    if (!recipient_id && !recipient_ids) {
      return jsonResponse({ error: 'recipient_id or recipient_ids required' }, 400);
    }

    // Get system notification settings
    const { data: notificationSettings } = await supabaseAdmin
      .from('notification_settings')
      .select('*');
    const settings = (notificationSettings || [])[0];

    // Check if this notification type is enabled globally
    if (settings && !settings.enabled_globally) {
      return jsonResponse({
        success: false,
        message: 'This notification type is disabled globally',
      });
    }

    // Determine recipients
    const recipients = recipient_ids || [recipient_id];
    const createdNotifications: unknown[] = [];
    const failedRecipients: unknown[] = [];

    for (const recId of recipients) {
      try {
        // Get recipient details
        const { data: recipient, error: recipientError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('id', recId)
          .single();
        if (recipientError) throw recipientError;

        // Check user preferences (unless it's a mandatory notification)
        if (settings && settings.allow_user_override && !settings.mandatory) {
          const { data: userPrefs } = await supabaseAdmin
            .from('notification_preferences')
            .select('*');
          const prefs = (userPrefs || [])[0];

          if (prefs && prefs.notification_types && prefs.notification_types[type] === false) {
            console.log(`User ${recId} has disabled ${type} notifications`);
            continue;
          }

          // Check quiet hours
          if (prefs?.quiet_hours_enabled) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            if (currentTime >= prefs.quiet_hours_start && currentTime <= prefs.quiet_hours_end) {
              console.log(`User ${recId} is in quiet hours`);
              if (priority !== 'critical' && !settings?.mandatory) {
                continue;
              }
            }
          }
        }

        const finalPriority = settings?.priority_override || priority || 'normal';

        // Create notification
        const { data: notification, error: insertError } = await supabaseAdmin
          .from('notifications')
          .insert({
            recipient_id: recId,
            recipient_name: recipient.full_name,
            type,
            title,
            message,
            priority: finalPriority,
            related_entity_type,
            related_entity_id,
            action_url,
            is_read: false,
            is_dismissed: false,
            metadata: metadata ? JSON.stringify(metadata) : null,
          })
          .select()
          .single();
        if (insertError) throw insertError;

        createdNotifications.push(notification);

        // Send push notification if requested and user has push enabled
        if (send_push !== false) {
          const { data: userPrefs } = await supabaseAdmin
            .from('notification_preferences')
            .select('*')
            .eq('user_id', recId);
          const prefs = (userPrefs || [])[0];

          // Default to sending push unless user explicitly opted out
          const pushEnabled = !prefs || prefs.delivery_methods?.push !== false;

          // Check if user has any FCM tokens (multi-device or single)
          const hasFcmTokens = (Array.isArray(recipient.fcm_tokens) && recipient.fcm_tokens.length > 0)
            || recipient.firebase_messaging_token;

          // Firebase push — sendFirebasePushNotification handles multi-token lookup
          if ((pushEnabled || settings?.mandatory) && hasFcmTokens) {
            try {
              await callEdgeFunction('sendFirebasePushNotification', {
                recipient_id: recId,
                title,
                message,
                notification_type: type,
                priority: finalPriority,
                action_url,
                data: {
                  notification_id: notification.id,
                  type,
                  ...(metadata || {}),
                },
              });
            } catch (pushError) {
              console.error('Failed to send push notification:', pushError);
            }
          }

          // APNS push (iOS)
          let apnsToken = recipient.apns_device_token;
          if (!apnsToken) {
            const { data: userRow2 } = await supabaseAdmin
              .from('users')
              .select('apns_device_token')
              .eq('id', recId)
              .single();
            apnsToken = userRow2?.apns_device_token;
          }
          if ((pushEnabled || settings?.mandatory) && apnsToken) {
            try {
              await callEdgeFunction('sendAPNSPushNotification', {
                recipient_id: recId,
                title,
                message,
                notification_type: type,
                priority: finalPriority,
                action_url,
                data: {
                  notification_id: notification.id,
                  type,
                  ...(metadata || {}),
                },
              });
            } catch (apnsError) {
              console.error('Failed to send APNS notification:', apnsError);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to create notification for ${recId}:`, error);
        failedRecipients.push({ recipient_id: recId, error: (error as Error).message });
      }
    }

    return jsonResponse({
      success: true,
      notifications_created: createdNotifications.length,
      failed: failedRecipients.length,
      notifications: createdNotifications,
      failures: failedRecipients,
    });
  } catch (error) {
    console.error('Create notification error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

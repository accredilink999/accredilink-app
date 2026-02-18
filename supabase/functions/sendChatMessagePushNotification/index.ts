/**
 * sendChatMessagePushNotification
 *
 * Triggered when a new chat message is created.
 * Sends push notifications to all conversation participants except the sender.
 */

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { event, data } = await req.json();

    // Only process new messages
    if (event?.type !== 'create') {
      return jsonResponse({ success: true });
    }

    const message = data;
    if (!message?.conversation_id) {
      return jsonResponse({ success: true });
    }

    // Get conversation to find participants
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('participants, participant_names, is_muted_by')
      .eq('id', message.conversation_id)
      .single();

    if (!conversation?.participants?.length) {
      return jsonResponse({ success: true });
    }

    // Use sender_name from the message payload (already set by the client).
    // Fall back to a users table lookup only if missing.
    let senderName = message.sender_name;
    if (!senderName) {
      const { data: sender } = await supabaseAdmin
        .from('users')
        .select('staff_full_name, full_name')
        .eq('id', message.sender_id)
        .single();
      senderName = sender?.staff_full_name || sender?.full_name || 'Someone';
    }

    // Recipients = all participants except sender
    const recipientIds = conversation.participants.filter(
      (id: string) => id !== message.sender_id,
    );

    if (recipientIds.length === 0) {
      return jsonResponse({ success: true });
    }

    // Filter out muted users
    const mutedBy = conversation.is_muted_by || [];
    const activeRecipients = recipientIds.filter((id: string) => !mutedBy.includes(id));

    if (activeRecipients.length === 0) {
      return jsonResponse({ success: true });
    }

    // Send push via direct fetch (not supabase.functions.invoke) for full error visibility
    const pushBody = {
      recipient_ids: activeRecipients,
      title: `Message from ${senderName}`,
      message: message.content?.substring(0, 100) || 'New message',
      priority: 'high',
      data: {
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        type: 'chat_message',
        action: 'open_chat',
      },
      action_url: `/Chat`,
    };

    const pushHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'apikey': supabaseAnonKey,
    };

    // Send to BOTH Firebase (Android/Web) and APNS (iOS) in parallel
    const [fcmResp, apnsResp] = await Promise.allSettled([
      fetch(`${supabaseUrl}/functions/v1/sendFirebasePushNotification`, {
        method: 'POST',
        headers: pushHeaders,
        body: JSON.stringify(pushBody),
      }),
      fetch(`${supabaseUrl}/functions/v1/sendAPNSPushNotification`, {
        method: 'POST',
        headers: pushHeaders,
        body: JSON.stringify(pushBody),
      }),
    ]);

    // Parse FCM result
    let fcmData: unknown = null;
    if (fcmResp.status === 'fulfilled') {
      try { fcmData = await fcmResp.value.json(); } catch { fcmData = await fcmResp.value.text(); }
      if (!fcmResp.value.ok) {
        console.error(`[Chat Push] FCM returned ${fcmResp.value.status}:`, JSON.stringify(fcmData));
      } else {
        console.log('[Chat Push] FCM result:', JSON.stringify(fcmData));
      }
    } else {
      console.error('[Chat Push] FCM call failed:', fcmResp.reason);
    }

    // Parse APNS result
    let apnsData: unknown = null;
    if (apnsResp.status === 'fulfilled') {
      try { apnsData = await apnsResp.value.json(); } catch { apnsData = await apnsResp.value.text(); }
      if (!apnsResp.value.ok) {
        console.error(`[Chat Push] APNS returned ${apnsResp.value.status}:`, JSON.stringify(apnsData));
      } else {
        console.log('[Chat Push] APNS result:', JSON.stringify(apnsData));
      }
    } else {
      console.error('[Chat Push] APNS call failed:', apnsResp.reason);
    }

    return jsonResponse({
      success: true,
      recipients: activeRecipients.length,
      fcm: fcmData,
      apns: apnsData,
    });
  } catch (error) {
    console.error('sendChatMessagePushNotification error:', error);
    return jsonResponse({ success: true }); // Don't fail automation
  }
});

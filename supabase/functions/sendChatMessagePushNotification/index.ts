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

    const pushResp = await fetch(`${supabaseUrl}/functions/v1/sendFirebasePushNotification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify(pushBody),
    });

    let pushData: unknown;
    try { pushData = await pushResp.json(); } catch { pushData = await pushResp.text(); }

    if (!pushResp.ok) {
      console.error(`[Chat Push] sendFirebasePushNotification returned ${pushResp.status}:`, JSON.stringify(pushData));
      return jsonResponse({ success: false, status: pushResp.status, pushError: pushData, recipients: activeRecipients.length });
    }

    console.log('[Chat Push] Push result:', JSON.stringify(pushData));

    return jsonResponse({
      success: true,
      recipients: activeRecipients.length,
      push: pushData,
    });
  } catch (error) {
    console.error('sendChatMessagePushNotification error:', error);
    return jsonResponse({ success: true }); // Don't fail automation
  }
});

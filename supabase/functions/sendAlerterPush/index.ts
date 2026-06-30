/**
 * sendAlerterPush
 *
 * Called by PagerPanel after a successful insert to pager_messages.
 * Looks up all matching users and sends them a Firebase push notification
 * with a deep link that opens the alerter slide-in panel.
 *
 * Body: { organization_id, message, recipient_mode, recipient_id, recipient_area_id }
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl         = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { organization_id, message, recipient_mode, recipient_id, recipient_area_id, sent_by } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find recipient user IDs
    let recipientIds: string[] = [];

    if (recipient_mode === 'global') {
      // All active users in the org
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', organization_id)
        .eq('is_active', true);
      recipientIds = (data || []).map((u: any) => u.id);

    } else if (recipient_mode === 'area' && recipient_area_id) {
      // Users whose area matches
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', organization_id)
        .or(`rota_area_id.eq.${recipient_area_id},area_id.eq.${recipient_area_id}`)
        .eq('is_active', true);
      recipientIds = (data || []).map((u: any) => u.id);

    } else if (recipient_mode === 'individual' && recipient_id) {
      recipientIds = [recipient_id];
    }

    // Exclude the sender
    recipientIds = recipientIds.filter(id => id !== sent_by);

    if (recipientIds.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call the existing Firebase push function
    const { data: pushResult, error: pushError } = await supabase.functions.invoke(
      'sendFirebasePushNotification',
      {
        body: {
          recipient_ids:      recipientIds,
          title:              'Incoming CareCall AI Alert',
          message:            message,
          priority:           'high',
          notification_type:  'alerter',
          action_url:         '/?alerter=open',
          data: {
            url:  '/?alerter=open',
            type: 'alerter',
          },
        },
      }
    );

    if (pushError) throw pushError;

    return new Response(JSON.stringify({ ok: true, sent: recipientIds.length, pushResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    console.error('[sendAlerterPush]', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

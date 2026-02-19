import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY')!;

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

    if (!DAILY_API_KEY) {
      return jsonResponse({ error: 'DAILY_API_KEY not configured' }, 500);
    }

    const { meeting_id, room_name, user_name, is_owner = false } = await req.json();

    if (!meeting_id || !room_name) {
      return jsonResponse({ error: 'meeting_id and room_name are required' }, 400);
    }

    // Verify user is a participant of this meeting
    const { data: participant } = await supabaseAdmin
      .from('meeting_participants')
      .select('id, role')
      .eq('meeting_id', meeting_id)
      .eq('user_id', user.id)
      .maybeSingle();

    // Also check if user is the meeting creator
    const { data: meeting } = await supabaseAdmin
      .from('meetings')
      .select('created_by')
      .eq('id', meeting_id)
      .single();

    const isCreator = meeting?.created_by === user.id;
    const isParticipant = !!participant;

    if (!isParticipant && !isCreator) {
      return jsonResponse({ error: 'You are not a participant of this meeting' }, 403);
    }

    // Calculate token expiry (24 hours from now)
    const expiry = Math.floor(Date.now() / 1000) + 86400;

    // Generate meeting token
    const tokenRes = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: room_name,
          is_owner: isCreator || is_owner,
          user_name: user_name || 'Participant',
          user_id: user.id,
          exp: expiry,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Daily.co token error:', errText);
      return jsonResponse({ error: `Failed to create token: ${tokenRes.status}` }, 500);
    }

    const tokenData = await tokenRes.json();

    return jsonResponse({ token: tokenData.token });
  } catch (err) {
    console.error('getDailyToken error:', err);
    return jsonResponse({ error: err.message || 'Internal error' }, 500);
  }
});

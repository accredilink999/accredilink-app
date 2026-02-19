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

    const { meeting_id, title, enable_recording, duration_minutes = 60 } = await req.json();

    if (!meeting_id || !title) {
      return jsonResponse({ error: 'meeting_id and title are required' }, 400);
    }

    // Generate a URL-safe room name from the title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const roomName = `${slug}-${Date.now().toString(36)}`;

    // Calculate expiry: duration + 30 min buffer from now
    const expirySeconds = Math.floor(Date.now() / 1000) + (duration_minutes + 30) * 60;

    // Create Daily.co room
    const roomRes = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
        properties: {
          exp: expirySeconds,
          max_participants: 50,
          enable_chat: true,
          enable_screenshare: true,
          enable_recording: enable_recording ? 'cloud' : undefined,
          enable_prejoin_ui: true,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });

    if (!roomRes.ok) {
      const errText = await roomRes.text();
      console.error('Daily.co room creation error:', errText);
      return jsonResponse({ error: `Failed to create room: ${roomRes.status}` }, 500);
    }

    const roomData = await roomRes.json();
    const roomUrl = roomData.url;

    // Update the meeting record with room details
    const { error: updateError } = await supabaseAdmin
      .from('meetings')
      .update({
        daily_room_name: roomName,
        daily_room_url: roomUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meeting_id);

    if (updateError) {
      console.error('Failed to update meeting:', updateError);
    }

    return jsonResponse({
      room_url: roomUrl,
      room_name: roomName,
    });
  } catch (err) {
    console.error('createDailyRoom error:', err);
    return jsonResponse({ error: err.message || 'Internal error' }, 500);
  }
});

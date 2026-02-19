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

    const { room_name, meeting_id } = await req.json();

    if (!room_name) {
      return jsonResponse({ error: 'room_name is required' }, 400);
    }

    // Delete the Daily.co room
    const deleteRes = await fetch(`https://api.daily.co/v1/rooms/${room_name}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!deleteRes.ok && deleteRes.status !== 404) {
      const errText = await deleteRes.text();
      console.error('Daily.co room deletion error:', errText);
      return jsonResponse({ error: `Failed to delete room: ${deleteRes.status}` }, 500);
    }

    // Update meeting status if meeting_id provided
    if (meeting_id) {
      await supabaseAdmin
        .from('meetings')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', meeting_id);
    }

    return jsonResponse({ success: true });
  } catch (err) {
    console.error('deleteDailyRoom error:', err);
    return jsonResponse({ error: err.message || 'Internal error' }, 500);
  }
});

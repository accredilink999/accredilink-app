import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { firebaseToken, platform } = await req.json();

    if (!firebaseToken) {
      return jsonResponse({ error: 'firebaseToken is required' }, 400);
    }

    // Load existing fcm_tokens array
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('fcm_tokens')
      .eq('id', user.id)
      .single();

    const existingTokens: Array<{ token: string; platform: string; updated_at: string }> =
      Array.isArray(profile?.fcm_tokens) ? profile.fcm_tokens : [];

    // Remove any existing entry with the same token (to update it)
    const filtered = existingTokens.filter((t) => t.token !== firebaseToken);

    // Add the new/updated token entry
    filtered.push({
      token: firebaseToken,
      platform: platform || 'unknown',
      updated_at: new Date().toISOString(),
    });

    // Keep only the last 10 tokens (prevent unbounded growth) and remove tokens older than 60 days
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const cleanedTokens = filtered
      .filter((t) => t.updated_at > sixtyDaysAgo)
      .slice(-10);

    // Save to profiles — both fcm_tokens array and firebase_messaging_token (latest, for backwards compat)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        fcm_tokens: cleanedTokens,
        firebase_messaging_token: firebaseToken,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to save FCM tokens to profiles:', updateError);
      return jsonResponse({ error: 'Failed to save token' }, 500);
    }

    // Also update the users table
    await supabaseAdmin
      .from('users')
      .update({
        fcm_tokens: cleanedTokens,
        firebase_messaging_token: firebaseToken,
      })
      .eq('id', user.id)
      .then(() => {})
      .catch(() => {});

    console.log(`[FCM] Saved token for user ${user.id} (platform: ${platform || 'unknown'}, total tokens: ${cleanedTokens.length})`);

    return jsonResponse({
      success: true,
      message: 'Firebase token saved successfully',
      totalDevices: cleanedTokens.length,
    });
  } catch (error) {
    console.error('manageFirebaseSubscription error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
});

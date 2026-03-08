import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const {
      name,
      email,
      relationship,
      relationship_label,
      service_user_id,
      service_user_name,
      invited_by,
    } = await req.json();

    if (!name || !email) {
      return jsonResponse({ error: 'name and email are required' }, 400);
    }

    const apiKey = Deno.env.get('HOMECARE_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'HOMECARE_API_KEY not configured' }, 500);
    }

    // Send invitation via homecare.co.uk API
    const res = await fetch('https://api.homecare.co.uk/index.cfm/reviews/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        API_key: apiKey,
        name,
        email,
        relationship: relationship || '',
      }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!res.ok) {
      return jsonResponse({ error: data.error || data.message || `API returned ${res.status}` }, res.status);
    }

    // Store pending review in client_reviews table if service_user_id provided
    if (service_user_id) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const sb = createClient(supabaseUrl, supabaseKey);

      await sb.from('client_reviews').insert({
        service_user_id,
        service_user_name: service_user_name || null,
        reviewer_name: name,
        reviewer_email: email,
        relationship: relationship || null,
        relationship_label: relationship_label || null,
        status: 'pending',
        invited_by: invited_by || null,
        invited_at: new Date().toISOString(),
      });
    }

    return jsonResponse({ success: true, data });
  } catch (err) {
    console.error('sendReviewInvite error:', err);
    return jsonResponse({ error: err.message || 'Failed to send review invitation' }, 500);
  }
});

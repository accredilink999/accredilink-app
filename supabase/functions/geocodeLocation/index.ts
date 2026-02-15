import { createClient } from 'npm:@supabase/supabase-js@2';


const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
Deno.serve(async (req) => {
  try {
      if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }
  const authHeader = req.headers.get('Authorization') || ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = currentUser;

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { location } = await req.json();

    if (!location) {
      return Response.json({ error: 'Location is required' }, { status: 400 });
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'AccrediCare-Weather-App/1.0'
        }
      }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      return Response.json({ error: 'Location not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      displayName: data[0].display_name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

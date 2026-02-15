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

    // Get all locations (using service role for scheduled automation)
    const allLocations = await (async () => { const { data, error } = await supabaseAdmin.from('locations').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();

    // Remove locations older than 1.5 minutes (90 seconds)
    const now = new Date().getTime();
    const maxAgeMs = 90 * 1000;
    const toDelete = allLocations.filter(loc => {
      const locTime = new Date(loc.timestamp).getTime();
      return now - locTime > maxAgeMs;
    });

    // Delete stale records in smaller batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < toDelete.length; i += batchSize) {
      const batch = toDelete.slice(i, i + batchSize);
      await Promise.all(batch.map(loc => supabaseAdmin.entities.Location.delete(loc.id)));
      // Delay between batches to respect rate limits
      if (i + batchSize < toDelete.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return Response.json({
      success: true,
      deletedCount: toDelete.length,
      message: `Cleaned ${toDelete.length} stale location records`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

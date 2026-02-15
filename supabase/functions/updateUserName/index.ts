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

    // Check admin permissions
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all users
    const allUsers = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    
    const updates = [];
    for (const u of allUsers) {
      // Use gps_map_name as the full_name if it exists
      const newFullName = u.gps_map_name || u.staff_full_name || u.full_name;
      if (newFullName && newFullName !== u.full_name) {
        await (async () => { const { data, error } = await supabaseAdmin.from('profiles').update({
          full_name: newFullName
        }).eq('id', u.id).select().single(); if (error) throw error; return data })();
        updates.push({ email: u.email, newName: newFullName });
      }
    }

    return Response.json({ 
      success: true, 
      message: `Updated ${updates.length} users`,
      updated: updates
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

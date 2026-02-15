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
      // Try to find actual name in data fields
      let newName = null;
      
      if (u.data?.staff_full_name && u.data.staff_full_name.trim() !== '') {
        newName = u.data.staff_full_name.trim();
      } else if (u.data?.gps_map_name && u.data.gps_map_name.trim() !== '') {
        newName = u.data.gps_map_name.trim();
      } else {
        // Extract name from email as fallback
        newName = u.email.split('@')[0].replace(/[._]/g, ' ');
        newName = newName.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
      }
      
      // Always update to ensure consistency
      if (newName && u.full_name !== newName) {
        await (async () => { const { data, error } = await supabaseAdmin.from('profiles').update({
          full_name: newName
        }).eq('id', u.id).select().single(); if (error) throw error; return data })();
        
        updates.push({
          id: u.id,
          email: u.email,
          old: u.full_name,
          new: newName
        });
      }
    }

    return Response.json({ 
      success: true, 
      message: `Fixed ${updates.length} user names`,
      updates: updates
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

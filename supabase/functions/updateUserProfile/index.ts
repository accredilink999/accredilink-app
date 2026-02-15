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

    const { full_name, ...otherData } = await req.json();

    // Update full_name using service role (built-in field)
    if (full_name !== undefined && full_name.trim() !== '') {
      await (async () => { const { data, error } = await supabaseAdmin.from('profiles').update({
        full_name: full_name.trim()
      }).eq('id', user.id).select().single(); if (error) throw error; return data })();
      
      // Also update staff_full_name in data for consistency
      await supabase.auth.updateMe({ staff_full_name: full_name.trim() });
    }

    // Update other data fields
    if (Object.keys(otherData).length > 0) {
      await supabase.auth.updateMe(otherData);
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

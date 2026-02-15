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
    const { email, biometric_token } = await req.json();

    if (!email || !biometric_token) {
      return Response.json({ error: 'Email and biometric token required' }, { status: 400 });
    }

    // Get user by email using service role
    const users = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*'); if (error) throw error; return data || [] })();
    
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const user = users[0];

    // Validate biometric token matches stored token
    if (user.biometric_token !== biometric_token) {
      return Response.json({ error: 'Invalid biometric token' }, { status: 401 });
    }

    // Return success with user info
    return Response.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        staff_full_name: user.staff_full_name,
        role: user.role,
        job_title: user.job_title
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

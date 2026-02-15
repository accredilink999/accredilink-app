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

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const specials = '!@#$%&*';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  pw += specials[Math.floor(Math.random() * specials.length)];
  pw += Math.floor(Math.random() * 10);
  return pw;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) {
      return jsonResponse({ error: 'No Authorization header' }, 401);
    }

    // Verify caller is authenticated
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Verify caller is admin
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, job_title')
      .eq('id', userData.user.id)
      .single();

    const isAdmin = callerProfile?.role === 'admin' ||
      ['admin', 'manager', 'supervisor'].includes(callerProfile?.job_title);

    if (!isAdmin) {
      return jsonResponse({ error: 'Only admins can reset staff passwords' }, 403);
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return jsonResponse({ error: 'user_id is required' }, 400);
    }

    // Generate new temp password
    const newPassword = generatePassword();

    // Reset password via admin API
    const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: newPassword,
    });

    if (resetError) {
      return jsonResponse({ error: 'Failed to reset password: ' + resetError.message }, 500);
    }

    // Set force_password_change on both tables
    await supabaseAdmin.from('profiles').update({ force_password_change: true }).eq('id', user_id);
    await supabaseAdmin.from('users').update({ force_password_change: true }).eq('id', user_id);

    // Get user's email and name
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('email, full_name, staff_full_name')
      .eq('id', user_id)
      .single();

    return jsonResponse({
      success: true,
      temp_password: newPassword,
      email: userRecord?.email,
      full_name: userRecord?.staff_full_name || userRecord?.full_name,
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
});

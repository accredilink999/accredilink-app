import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Verify caller
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get caller's organization
    const { data: membership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', currentUser.id)
      .limit(1)
      .maybeSingle();

    if (!membership?.organization_id) {
      return new Response(JSON.stringify({ staffList: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orgId = membership.organization_id;

    // Get all members of this organization
    const { data: members } = await supabaseAdmin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId);

    const memberIds = (members || []).map(m => m.user_id);

    if (memberIds.length === 0) {
      return new Response(JSON.stringify({ staffList: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get profiles for org members only
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, staff_full_name')
      .in('id', memberIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const staffList = (profiles || []).map(u => ({
      id: u.id,
      name: u.staff_full_name || u.full_name,
    }));

    return new Response(JSON.stringify({ staffList }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

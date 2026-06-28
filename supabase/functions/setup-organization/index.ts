import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Create admin client (bypasses RLS)
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    // Verify the caller's identity from their JWT
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return json({ error: 'Missing authorization token' }, 401);
    }

    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) {
      return json({ error: 'Invalid or expired token' }, 401);
    }

    // Check if user already has an organization
    const { data: existingMembership } = await admin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (existingMembership) {
      // User already has an org — return it
      const { data: org } = await admin
        .from('organizations')
        .select('*')
        .eq('id', existingMembership.organization_id)
        .single();

      return json({ organizationId: existingMembership.organization_id, org, existing: true });
    }

    // Get company name from user metadata or request body
    let companyName: string | null = null;
    try {
      const body = await req.json();
      companyName = body.companyName || null;
    } catch {
      // No body — use metadata
    }
    companyName = companyName || user.user_metadata?.company_name || null;

    if (!companyName) {
      return json({ error: 'No company name found. Please sign up again with a company name.' }, 400);
    }

    // Generate unique slug and invite code
    const slugBase = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const slug = `${slugBase}-${randomSuffix}`;

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let inviteCode = '';
    for (let i = 0; i < 8; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Create the organization (using service role — bypasses RLS)
    const { data: org, error: orgErr } = await admin
      .from('organizations')
      .insert({
        name: companyName,
        slug,
        invite_code: inviteCode,
        plan: 'pending',
        is_active: false,
      })
      .select()
      .single();

    if (orgErr) {
      console.error('Org creation error:', orgErr);
      return json({ error: `Failed to create organization: ${orgErr.message}` }, 500);
    }

    // Add user as owner
    const { error: memErr } = await admin
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memErr) {
      console.error('Membership creation error:', memErr);
      // Clean up the org we just created
      await admin.from('organizations').delete().eq('id', org.id);
      return json({ error: `Failed to create membership: ${memErr.message}` }, 500);
    }

    // Ensure profile exists with super_admin role for org owner
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    await admin
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        role: 'super_admin',
        job_title: 'admin',
        onboarding_complete: true,
      }, { onConflict: 'id' });

    // Ensure user record exists with super_admin role and org_id
    await admin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        full_name: fullName,
        staff_full_name: fullName,
        role: 'super_admin',
        job_title: 'admin',
        organization_id: org.id,
        is_active: true,
      }, { onConflict: 'id' });

    return json({
      organizationId: org.id,
      org,
      existing: false,
      inviteCode,
    });

  } catch (err) {
    console.error('setup-organization error:', err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});

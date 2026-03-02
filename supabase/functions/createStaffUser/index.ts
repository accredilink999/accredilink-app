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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Step tracker for diagnostics
  const steps: string[] = [];

  try {
    steps.push('1-start');

    const authHeader = req.headers.get('Authorization') || '';
    steps.push(`2-auth-header:${authHeader ? 'present(' + authHeader.substring(0, 20) + '...)' : 'MISSING'}`);

    if (!authHeader) {
      return jsonResponse({ error: 'No Authorization header provided', steps }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    steps.push('3-clients-created');

    // Verify caller is authenticated
    const { data: userData, error: authError } = await supabase.auth.getUser();
    steps.push(`4-getUser:${authError ? 'ERROR:' + authError.message : 'ok:' + userData?.user?.id}`);

    if (authError || !userData?.user) {
      return jsonResponse({
        error: 'Unauthorized — please log in again',
        detail: authError?.message || 'No user returned',
        steps,
      }, 401);
    }

    const currentUser = userData.user;

    // Verify caller is admin
    const { data: callerProfile, error: profileLookupError } = await supabaseAdmin
      .from('profiles')
      .select('role, job_title')
      .eq('id', currentUser.id)
      .single();

    steps.push(`5-profile-lookup:${profileLookupError ? 'ERROR:' + profileLookupError.message : 'role=' + callerProfile?.role + ',job=' + callerProfile?.job_title}`);

    const isAdmin = callerProfile?.role === 'admin' ||
      ['admin', 'manager', 'supervisor'].includes(callerProfile?.job_title);

    if (!isAdmin) {
      return jsonResponse({
        error: 'Only admins can create staff accounts',
        detail: `role=${callerProfile?.role}, job_title=${callerProfile?.job_title}`,
        steps,
      }, 403);
    }

    steps.push('6-admin-verified');

    // Parse body
    let body;
    try {
      body = await req.json();
    } catch (parseErr) {
      return jsonResponse({ error: 'Invalid JSON body: ' + parseErr.message, steps }, 400);
    }

    const {
      email,
      password,
      full_name,
      job_title,
      role = 'user',
      area_id = null,
      enforce_gps = false,
      enforce_camera = false,
      enforce_notifications = false,
    } = body;

    steps.push(`7-body-parsed:email=${email},name=${full_name}`);

    if (!email || !password || !full_name) {
      return jsonResponse({ error: 'email, password, and full_name are required', steps }, 400);
    }

    // Create auth user
    steps.push('8-creating-auth-user');
    const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      steps.push('9-create-FAILED:' + createError.message);
      return jsonResponse({ error: createError.message, steps }, 400);
    }

    const newUserId = authData.user.id;
    steps.push('9-user-created:' + newUserId);

    const warnings: string[] = [];

    // Wait for handle_new_user trigger
    await new Promise((resolve) => setTimeout(resolve, 1500));
    steps.push('10-waited-for-trigger');

    // Update profiles
    const profileData: Record<string, unknown> = {
      full_name,
      staff_full_name: full_name,
      role,
      job_title: job_title || null,
      is_active: true,
      enforce_gps,
      enforce_camera,
      enforce_notifications,
      force_password_change: true,
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(profileData)
      .eq('id', newUserId);

    if (profileError) {
      warnings.push('profiles: ' + profileError.message);
      steps.push('11-profile-update-FAILED:' + profileError.message);
      // Fallback
      const { error: profileBaseError } = await supabaseAdmin
        .from('profiles')
        .update({ full_name, role, job_title: job_title || null, is_active: true })
        .eq('id', newUserId);
      if (profileBaseError) {
        warnings.push('profiles-base: ' + profileBaseError.message);
      }
    } else {
      steps.push('11-profile-updated');
    }

    // Upsert users table
    const usersData: Record<string, unknown> = {
      id: newUserId,
      email,
      full_name,
      staff_full_name: full_name,
      role,
      job_title: job_title || null,
      area_id: area_id || null,
      enforce_gps,
      enforce_camera,
      enforce_notifications,
      force_password_change: true,
      employment_status: 'active',
      is_active: true,
    };

    const { error: usersError } = await supabaseAdmin
      .from('users')
      .upsert(usersData, { onConflict: 'id' });

    if (usersError) {
      warnings.push('users: ' + usersError.message);
      steps.push('12-users-upsert-FAILED:' + usersError.message);
      // Fallback
      const { error: usersBaseError } = await supabaseAdmin
        .from('users')
        .upsert({ id: newUserId, email, full_name, role, job_title: job_title || null, is_active: true }, { onConflict: 'id' });
      if (usersBaseError) {
        warnings.push('users-base: ' + usersBaseError.message);
      }
    } else {
      steps.push('12-users-upserted');
    }

    // Auto-add to admin's organization
    steps.push('13-org-membership');
    const { data: adminOrg } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', currentUser.id)
      .limit(1)
      .single();

    if (adminOrg?.organization_id) {
      const { error: orgMemErr } = await supabaseAdmin
        .from('organization_members')
        .upsert({
          organization_id: adminOrg.organization_id,
          user_id: newUserId,
          role: 'member',
        }, { onConflict: 'organization_id,user_id' });

      if (orgMemErr) {
        warnings.push('org_member: ' + orgMemErr.message);
        steps.push('14-org-member-FAILED:' + orgMemErr.message);
      } else {
        steps.push('14-org-member-added:' + adminOrg.organization_id);
      }

      // Also set organization_id on users row
      await supabaseAdmin
        .from('users')
        .update({ organization_id: adminOrg.organization_id })
        .eq('id', newUserId);
    } else {
      warnings.push('Admin has no organization — staff not added to any org');
      steps.push('14-no-admin-org');
    }

    steps.push('15-done');

    return jsonResponse({
      success: true,
      user_id: newUserId,
      email,
      steps,
      ...(warnings.length > 0 ? { warnings } : {}),
    });
  } catch (error) {
    steps.push('CATCH:' + error.message);
    return jsonResponse({ error: error.message, steps }, 500);
  }
});

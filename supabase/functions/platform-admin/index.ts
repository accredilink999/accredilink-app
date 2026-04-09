import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const platformAdminEmails = (Deno.env.get('PLATFORM_ADMIN_EMAILS') || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);

const platformAdminSecret = Deno.env.get('PLATFORM_ADMIN_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-secret',
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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Auth method 1: Shared secret from website proxy
  const adminSecret = req.headers.get('x-admin-secret') || '';
  const isSecretAuth = platformAdminSecret && adminSecret === platformAdminSecret;

  // Auth method 2: Supabase user token + email check
  if (!isSecretAuth) {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);

    if (authErr || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const email = user.email?.toLowerCase() || '';
    if (!platformAdminEmails.includes(email)) {
      return json({ error: 'Forbidden — not a platform admin' }, 403);
    }
  }

  const { action, ...params } = await req.json();

  try {
    switch (action) {
      // ─── List all organizations with member counts and owner emails ───
      case 'list-orgs': {
        const { data: orgs, error } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get member counts per org
        const { data: counts } = await supabase
          .rpc('count_org_members_all');

        const countMap: Record<string, number> = {};
        (counts || []).forEach((c: { organization_id: string; count: number }) => {
          countMap[c.organization_id] = c.count;
        });

        // Get owners for each org so we can display their email on the row
        const orgIds = (orgs || []).map(o => o.id);
        const { data: owners } = await supabase
          .from('organization_members')
          .select('organization_id, user_id, role')
          .in('organization_id', orgIds)
          .eq('role', 'owner');

        // Map of org_id → owner user_id
        const ownerMap: Record<string, string> = {};
        (owners || []).forEach(o => { ownerMap[o.organization_id] = o.user_id; });

        // Fetch profile data from public users table for those owners
        const ownerUserIds = (owners || []).map(o => o.user_id);
        const { data: ownerProfiles } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', ownerUserIds);

        const profileMap: Record<string, { email: string | null; full_name: string | null }> = {};
        (ownerProfiles || []).forEach(p => {
          profileMap[p.id] = { email: p.email, full_name: p.full_name };
        });

        // Fall back to auth.users for any owner missing email in the public users table
        for (const userId of ownerUserIds) {
          if (!profileMap[userId] || !profileMap[userId].email) {
            try {
              const { data: authData } = await supabase.auth.admin.getUserById(userId);
              const authUser = authData?.user;
              if (authUser) {
                profileMap[userId] = {
                  email: authUser.email || profileMap[userId]?.email || null,
                  full_name: authUser.user_metadata?.full_name || profileMap[userId]?.full_name || null,
                };
              }
            } catch (e) {
              console.error(`[platform-admin] Failed to fetch auth user ${userId}:`, e);
            }
          }
        }

        const result = (orgs || []).map(org => {
          const ownerId = ownerMap[org.id];
          const ownerProfile = ownerId ? profileMap[ownerId] : null;
          return {
            ...org,
            member_count: countMap[org.id] || 0,
            owner_email: ownerProfile?.email || null,
            owner_name: ownerProfile?.full_name || null,
          };
        });

        return json({ orgs: result });
      }

      // ─── Get members of a specific org ───
      case 'list-org-members': {
        const { organizationId } = params;
        if (!organizationId) return json({ error: 'Missing organizationId' }, 400);

        // Get members
        const { data: members, error } = await supabase
          .from('organization_members')
          .select('id, role, created_at, user_id')
          .eq('organization_id', organizationId);

        if (error) throw error;

        // Fetch profile data from public users table (may be missing for trial signups)
        const userIds = (members || []).map(m => m.user_id);
        const { data: profiles } = await supabase
          .from('users')
          .select('id, full_name, email, role, is_active, last_sign_in_at')
          .in('id', userIds);

        const profileMap: Record<string, any> = {};
        (profiles || []).forEach(p => { profileMap[p.id] = p; });

        // Fall back to auth.users for any member missing or without an email.
        // Trial signups often only exist in auth.users until full onboarding.
        for (const m of (members || [])) {
          if (!profileMap[m.user_id] || !profileMap[m.user_id].email) {
            try {
              const { data: authData } = await supabase.auth.admin.getUserById(m.user_id);
              const authUser = authData?.user;
              if (authUser) {
                profileMap[m.user_id] = {
                  id: m.user_id,
                  email: authUser.email || profileMap[m.user_id]?.email || null,
                  full_name: authUser.user_metadata?.full_name
                    || profileMap[m.user_id]?.full_name
                    || null,
                  role: profileMap[m.user_id]?.role || null,
                  is_active: profileMap[m.user_id]?.is_active ?? true,
                  last_sign_in_at: authUser.last_sign_in_at || profileMap[m.user_id]?.last_sign_in_at || null,
                };
              }
            } catch (e) {
              console.error(`[platform-admin] Failed to fetch auth user ${m.user_id}:`, e);
            }
          }
        }

        const result = (members || []).map(m => ({
          ...m,
          profile: profileMap[m.user_id] || null,
        }));

        return json({ members: result });
      }

      // ─── Toggle org active status (killswitch) ───
      case 'toggle-org-active': {
        const { organizationId, isActive } = params;
        if (!organizationId) return json({ error: 'Missing organizationId' }, 400);

        const { error } = await supabase
          .from('organizations')
          .update({
            is_active: isActive,
            plan: isActive ? undefined : 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', organizationId);

        if (error) throw error;
        return json({ success: true, isActive });
      }

      // ─── Update org plan manually ───
      case 'update-org-plan': {
        const { organizationId, plan, isActive, trialEndsAt } = params;
        if (!organizationId) return json({ error: 'Missing organizationId' }, 400);

        const updates: Record<string, any> = { updated_at: new Date().toISOString() };
        if (plan !== undefined) updates.plan = plan;
        if (isActive !== undefined) updates.is_active = isActive;
        if (trialEndsAt !== undefined) updates.trial_ends_at = trialEndsAt;

        const { error } = await supabase
          .from('organizations')
          .update(updates)
          .eq('id', organizationId);

        if (error) throw error;
        return json({ success: true });
      }

      // ─── Delete organization and all its users ───
      case 'delete-org': {
        const { organizationId } = params;
        if (!organizationId) return json({ error: 'Missing organizationId' }, 400);

        // Get all member user_ids before deleting
        const { data: members } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', organizationId);

        // Remove members, then org
        await supabase
          .from('organization_members')
          .delete()
          .eq('organization_id', organizationId);

        const { error } = await supabase
          .from('organizations')
          .delete()
          .eq('id', organizationId);

        if (error) throw error;

        // Delete auth users for this org
        const deleted: string[] = [];
        for (const m of (members || [])) {
          // Check if user is in any other org
          const { data: otherOrgs } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', m.user_id)
            .limit(1);

          if (!otherOrgs?.length) {
            const { error: delErr } = await supabase.auth.admin.deleteUser(m.user_id);
            if (!delErr) deleted.push(m.user_id);
          }
        }

        return json({ success: true, deletedUsers: deleted.length });
      }

      // ─── Delete a single user from auth + org ───
      case 'delete-user': {
        const { userId } = params;
        if (!userId) return json({ error: 'Missing userId' }, 400);

        // Remove from org memberships
        await supabase
          .from('organization_members')
          .delete()
          .eq('user_id', userId);

        // Delete from auth
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;

        return json({ success: true });
      }

      // ─── Platform stats ───
      case 'stats': {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('plan, is_active, trial_ends_at');

        const stats = {
          total: orgs?.length || 0,
          active: orgs?.filter(o => o.is_active).length || 0,
          trial: orgs?.filter(o => o.plan === 'trial').length || 0,
          paid: orgs?.filter(o => o.is_active && o.plan && !['trial', 'cancelled'].includes(o.plan)).length || 0,
          cancelled: orgs?.filter(o => o.plan === 'cancelled' || !o.is_active).length || 0,
        };

        return json({ stats });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error(`Platform admin error (${action}):`, err);
    return json({ error: err.message || 'Internal error' }, 500);
  }
});

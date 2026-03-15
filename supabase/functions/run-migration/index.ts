import { createClient } from 'npm:@supabase/supabase-js@2';
import postgres from 'https://deno.land/x/postgresjs@v3.4.5/mod.js';

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

  const dbUrl = Deno.env.get('SUPABASE_DB_URL')!;
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  let sql: ReturnType<typeof postgres> | null = null;

  try {
    const body = await req.json();
    const { action } = body;

    sql = postgres(dbUrl, { max: 1 });

    if (action === 'diagnose') {
      // List all policies on organizations
      const orgPolicies = await sql`
        SELECT policyname, cmd, permissive, qual, with_check
        FROM pg_policies WHERE tablename = 'organizations'
      `;

      // List all policies on organization_members
      const memPolicies = await sql`
        SELECT policyname, cmd, permissive, qual, with_check
        FROM pg_policies WHERE tablename = 'organization_members'
      `;

      // List all policies on profiles
      const profilePolicies = await sql`
        SELECT policyname, cmd, permissive, qual, with_check
        FROM pg_policies WHERE tablename = 'profiles'
      `;

      // Check trigger
      const trigger = await sql`
        SELECT proname, prosecdef
        FROM pg_proc WHERE proname = 'handle_new_user'
      `;

      // Check if RLS is enabled
      const rlsStatus = await sql`
        SELECT relname, relrowsecurity, relforcerowsecurity
        FROM pg_class
        WHERE relname IN ('organizations', 'organization_members', 'profiles')
      `;

      await sql.end();
      return json({
        org_policies: orgPolicies,
        member_policies: memPolicies,
        profile_policies: profilePolicies,
        trigger: trigger,
        rls_status: rlsStatus,
      });
    }

    if (action === 'fix-org-rls') {
      // Drop all existing policies on organizations
      await sql`DROP POLICY IF EXISTS "organizations_org_isolation" ON organizations`;
      await sql`DROP POLICY IF EXISTS "org_member_read" ON organizations`;
      await sql`DROP POLICY IF EXISTS "org_member_update" ON organizations`;
      await sql`DROP POLICY IF EXISTS "org_create" ON organizations`;

      // Ensure RLS is enabled
      await sql`ALTER TABLE organizations ENABLE ROW LEVEL SECURITY`;

      // Create clean policies
      // Users can see orgs they belong to
      await sql`
        CREATE POLICY "org_member_read" ON organizations
        FOR SELECT USING (
          id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        )
      `;

      // Owners/admins can update their org
      await sql`
        CREATE POLICY "org_member_update" ON organizations
        FOR UPDATE USING (
          id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
      `;

      // Any authenticated user can create an org (for signup)
      await sql`
        CREATE POLICY "org_create" ON organizations
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)
      `;

      // Any authenticated user can delete their own org (for cleanup)
      await sql`
        CREATE POLICY "org_delete" ON organizations
        FOR DELETE USING (
          id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role = 'owner')
        )
      `;

      await sql.end();
      return json({ success: true, message: 'Organizations RLS policies fixed' });
    }

    if (action === 'fix-members-rls') {
      // Drop all existing policies on organization_members
      await sql`DROP POLICY IF EXISTS "organization_members_org_isolation" ON organization_members`;
      await sql`DROP POLICY IF EXISTS "org_members_read" ON organization_members`;
      await sql`DROP POLICY IF EXISTS "org_members_manage" ON organization_members`;
      await sql`DROP POLICY IF EXISTS "org_members_self_insert" ON organization_members`;
      await sql`DROP POLICY IF EXISTS "org_members_own" ON organization_members`;

      // Ensure RLS is enabled
      await sql`ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY`;

      // Users can see their own memberships
      await sql`
        CREATE POLICY "org_members_own" ON organization_members
        FOR SELECT USING (user_id = auth.uid())
      `;

      // Users can insert themselves (via invite code)
      await sql`
        CREATE POLICY "org_members_self_insert" ON organization_members
        FOR INSERT WITH CHECK (user_id = auth.uid())
      `;

      await sql.end();
      return json({ success: true, message: 'Organization members RLS policies fixed' });
    }

    if (action === 'fix-all') {
      // ─── Fix organizations ───
      await sql`DROP POLICY IF EXISTS "organizations_org_isolation" ON organizations`;
      await sql`DROP POLICY IF EXISTS "org_member_read" ON organizations`;
      await sql`DROP POLICY IF EXISTS "org_member_update" ON organizations`;
      await sql`DROP POLICY IF EXISTS "org_create" ON organizations`;
      await sql`DROP POLICY IF EXISTS "org_delete" ON organizations`;
      await sql`ALTER TABLE organizations ENABLE ROW LEVEL SECURITY`;

      await sql`
        CREATE POLICY "org_member_read" ON organizations
        FOR SELECT USING (
          id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
        )
      `;
      await sql`
        CREATE POLICY "org_member_update" ON organizations
        FOR UPDATE USING (
          id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
        )
      `;
      await sql`
        CREATE POLICY "org_create" ON organizations
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)
      `;

      // ─── Fix organization_members ───
      await sql`DROP POLICY IF EXISTS "organization_members_org_isolation" ON organization_members`;
      await sql`DROP POLICY IF EXISTS "org_members_read" ON organization_members`;
      await sql`DROP POLICY IF EXISTS "org_members_manage" ON organization_members`;
      await sql`DROP POLICY IF EXISTS "org_members_self_insert" ON organization_members`;
      await sql`DROP POLICY IF EXISTS "org_members_own" ON organization_members`;
      await sql`ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY`;

      await sql`
        CREATE POLICY "org_members_own" ON organization_members
        FOR SELECT USING (user_id = auth.uid())
      `;
      await sql`
        CREATE POLICY "org_members_self_insert" ON organization_members
        FOR INSERT WITH CHECK (user_id = auth.uid())
      `;

      // ─── Fix profiles ───
      await sql`DROP POLICY IF EXISTS "profiles_org_isolation" ON profiles`;
      await sql`DROP POLICY IF EXISTS "profiles_self" ON profiles`;
      await sql`DROP POLICY IF EXISTS "profiles_insert_any" ON profiles`;
      await sql`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`;

      await sql`
        CREATE POLICY "profiles_self" ON profiles
        FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid())
      `;
      await sql`
        CREATE POLICY "profiles_insert_any" ON profiles
        FOR INSERT WITH CHECK (true)
      `;

      await sql.end();
      return json({ success: true, message: 'All auth-related RLS policies fixed' });
    }

    if (action === 'delete-test-user') {
      const targetEmail = body.email || 'accredilinktaskforce@gmail.com';
      const supabase = createClient(supabaseUrl, serviceKey);

      // Find user by email in auth
      const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers();
      if (listErr) throw listErr;

      const testUser = users.find((u: any) => u.email === targetEmail);
      if (!testUser) {
        await sql.end();
        return json({ message: `No user found with email ${targetEmail}` });
      }

      // Clean up using direct SQL to bypass RLS
      // Delete user-referenced records first (locations FK → profiles)
      try { await sql`DELETE FROM locations WHERE user_id = ${testUser.id}`; } catch {}
      try { await sql`DELETE FROM care_logs WHERE created_by = ${testUser.id}`; } catch {}
      await sql`DELETE FROM organization_members WHERE user_id = ${testUser.id}`;
      try { await sql`DELETE FROM profiles WHERE id = ${testUser.id}`; } catch {}
      try { await sql`DELETE FROM users WHERE id = ${testUser.id}`; } catch {}

      // Find and clean up orphaned orgs they created
      const orphanOrgs = await sql`
        SELECT o.id FROM organizations o
        WHERE NOT EXISTS (
          SELECT 1 FROM organization_members om WHERE om.organization_id = o.id
        )
        AND o.id != '00000000-0000-0000-0000-000000000001'
      `;

      for (const org of orphanOrgs) {
        // Delete all dependent records before removing the org (no CASCADE on these FKs)
        const depTables = [
          'locations', 'shifts', 'shift_calls', 'shift_patterns', 'shift_types',
          'care_logs', 'healthcare_logs', 'rota_areas', 'service_users',
          'invoices', 'invoicing_settings', 'clients', 'recurring_invoices',
          'payments', 'messages', 'conversations', 'payroll_records',
          'payroll_settings', 'meal_prep_logs',
        ];
        for (const t of depTables) {
          await sql.unsafe(`DELETE FROM ${t} WHERE organization_id = $1`, [org.id]).catch(() => {});
        }
        await sql`DELETE FROM organizations WHERE id = ${org.id}`;
      }

      // Delete from auth
      const { error: delErr } = await supabase.auth.admin.deleteUser(testUser.id);

      await sql.end();
      return json({
        success: true,
        deletedUserId: testUser.id,
        orphanOrgsDeleted: orphanOrgs.length,
        authDeleteError: delErr?.message || null,
      });
    }

    if (action === 'run-sql') {
      const query = body.query;
      if (!query) throw new Error('Missing query parameter');
      const result = await sql.unsafe(query);
      await sql.end();
      return json({ success: true, data: result });
    }

    await sql.end();
    return json({ error: 'Unknown action. Use: diagnose, fix-all, fix-org-rls, fix-members-rls, delete-test-user, run-sql' }, 400);

  } catch (err) {
    if (sql) await sql.end().catch(() => {});
    return json({ error: err.message }, 500);
  }
});

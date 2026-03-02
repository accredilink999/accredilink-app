/**
 * Shared organization context helper for edge functions.
 * Use this in every edge function that accesses org-scoped data.
 *
 * Usage:
 *   const orgId = await getUserOrgId(supabaseAdmin, userId);
 *   if (!orgId) return error('No organization');
 *   // Then filter all queries: .eq('organization_id', orgId)
 */
import { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export async function getUserOrgId(
  adminClient: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await adminClient
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  return data?.organization_id || null;
}

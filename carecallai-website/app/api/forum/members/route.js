import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'

/**
 * Auto-provision forum profiles for all org admins/owners who don't have one yet.
 */
async function autoProvisionAdmins() {
  try {
    // Get all org admins/owners
    const { data: orgMembers } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .in('role', ['owner', 'admin'])

    if (!orgMembers?.length) return

    // Get all profile admins too
    const { data: profileAdmins } = await supabase
      .from('profiles')
      .select('id, role, full_name, photo_url')
      .in('role', ['super_admin', 'admin'])

    // Combine unique user IDs
    const adminIds = new Set()
    orgMembers.forEach(m => adminIds.add(m.user_id))
    profileAdmins?.forEach(p => adminIds.add(p.id))

    // Check which ones already have forum profiles
    const { data: existingProfiles } = await supabase
      .from('forum_profiles')
      .select('id')
      .in('id', Array.from(adminIds))

    const existingIds = new Set((existingProfiles || []).map(p => p.id))
    const needsProvisioning = Array.from(adminIds).filter(id => !existingIds.has(id))

    if (!needsProvisioning.length) return

    // Get auth user emails for username generation
    for (const userId of needsProvisioning) {
      try {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
        if (!authUser) continue

        const profile = profileAdmins?.find(p => p.id === userId)
        const isFounder = userId === FOUNDER_ID

        // Generate unique username from email
        let baseUsername = (authUser.email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20)
        if (!baseUsername || baseUsername.length < 3) baseUsername = 'user'

        let username = baseUsername
        let attempt = 0
        while (true) {
          const { data: existing } = await supabase.from('forum_profiles').select('id').eq('username', username).single()
          if (!existing) break
          attempt++
          username = `${baseUsername}-${attempt}`
          if (attempt > 20) break
        }

        const forumRole = isFounder ? 'founder' : 'admin'
        const displayName = profile?.full_name || authUser.email?.split('@')[0] || username

        await supabase.from('forum_profiles').insert({
          id: userId,
          username,
          display_name: displayName,
          avatar_url: profile?.photo_url || null,
          forum_role: forumRole,
          accepted_terms: true,
          terms_accepted_at: new Date().toISOString(),
        })
      } catch (innerErr) {
        console.error(`[Forum] Failed to provision profile for ${userId}:`, innerErr.message)
      }
    }
  } catch (outerErr) {
    console.error('[Forum] autoProvisionAdmins error:', outerErr.message)
  }
}

export async function GET() {
  try {
    // Auto-provision any org admins who don't have forum profiles yet
    await autoProvisionAdmins()

    const { data: members, error } = await supabase
      .from('forum_profiles')
      .select('id, username, display_name, avatar_url, bio, forum_role, thread_count, post_count, reputation, created_at, last_seen_at')
      .eq('is_banned', false)
      .order('created_at', { ascending: true })

    if (error) return json({ error: error.message }, 500)

    // Sort: founder first, then admins, then by name
    const roleOrder = { founder: 0, admin: 1, moderator: 2, user: 3 }
    const sorted = (members || []).sort((a, b) => {
      const ra = roleOrder[a.forum_role] ?? 9
      const rb = roleOrder[b.forum_role] ?? 9
      if (ra !== rb) return ra - rb
      return (a.display_name || '').localeCompare(b.display_name || '')
    })

    return json({ members: sorted })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

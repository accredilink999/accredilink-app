import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'

/**
 * Auto-provision forum profiles for all org admins/owners who don't have one yet.
 * They get 'user' role on the forum — only the founder can promote to admin/mod.
 */
async function autoProvisionAdmins() {
  try {
    // Load excluded users (previously deleted from forum)
    const { data: excludedRow } = await supabase.from('forum_settings').select('value').eq('key', 'excluded_users').single()
    const excludedIds = new Set(excludedRow?.value || [])

    const { data: orgMembers } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .in('role', ['owner', 'admin'])

    if (!orgMembers?.length) return

    const { data: profileAdmins } = await supabase
      .from('profiles')
      .select('id, role, full_name, photo_url')
      .in('role', ['super_admin', 'admin'])

    const adminIds = new Set()
    orgMembers.forEach(m => adminIds.add(m.user_id))
    profileAdmins?.forEach(p => adminIds.add(p.id))

    // Remove excluded (deleted) users
    excludedIds.forEach(id => adminIds.delete(id))

    const { data: existingProfiles } = await supabase
      .from('forum_profiles')
      .select('id')
      .in('id', Array.from(adminIds))

    const existingIds = new Set((existingProfiles || []).map(p => p.id))
    const needsProvisioning = Array.from(adminIds).filter(id => !existingIds.has(id))

    if (!needsProvisioning.length) return

    for (const userId of needsProvisioning) {
      try {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)
        if (!authUser) continue

        const profile = profileAdmins?.find(p => p.id === userId)
        const isFounder = userId === FOUNDER_ID

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

        // App admins get 'user' role on forum — only founder can promote
        const forumRole = isFounder ? 'founder' : 'user'
        const displayName = profile?.full_name || authUser.email?.split('@')[0] || username

        await supabase.from('forum_profiles').insert({
          id: userId,
          username,
          display_name: displayName,
          avatar_url: profile?.photo_url || null,
          forum_role: forumRole,
          accepted_terms: true,
          terms_accepted_at: new Date().toISOString(),
          profile_customized: false,
        })
      } catch (innerErr) {
        console.error(`[Forum] Failed to provision profile for ${userId}:`, innerErr.message)
      }
    }
  } catch (outerErr) {
    console.error('[Forum] autoProvisionAdmins error:', outerErr.message)
  }
}

export async function GET(req) {
  try {
    await autoProvisionAdmins()

    // Check viewer's role via optional token
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    let viewerRole = 'user'

    if (token) {
      const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { data: { user } } = await anonClient.auth.getUser(token)
      if (user) {
        const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
        if (fp) viewerRole = fp.forum_role
      }
    }

    // Quick search mode for @mention autocomplete
    const q = searchParams.get('q')
    if (q && q.length >= 1) {
      const { data: results } = await supabase
        .from('forum_profiles')
        .select('id, username, display_name, avatar_url, forum_role')
        .ilike('username', `${q}%`)
        .eq('is_banned', false)
        .limit(10)
      return json({ members: results || [] })
    }

    // Mods/admins/founder see all members including banned; regular users don't see banned
    const canSeeAll = ['founder', 'admin', 'moderator'].includes(viewerRole)
    let query = supabase
      .from('forum_profiles')
      .select('id, username, display_name, avatar_url, bio, forum_role, is_banned, thread_count, post_count, reputation, created_at, last_seen_at, profile_customized')
      .order('created_at', { ascending: true })
    if (!canSeeAll) query = query.eq('is_banned', false)

    const { data: members, error } = await query

    if (error) return json({ error: error.message }, 500)

    // Mask uncustomized members for regular users — founder/mods/admins see real names
    const canSeeRealNames = ['founder', 'admin', 'moderator'].includes(viewerRole)
    let memberNum = 0
    const processed = (members || []).map(m => {
      if (!canSeeRealNames && !m.profile_customized && m.forum_role === 'user') {
        memberNum++
        return {
          ...m,
          display_name: `Member ${memberNum}`,
          username: `member-${memberNum}`,
          avatar_url: null,
          bio: null,
          profile_customized: m.profile_customized,
        }
      }
      return m
    })

    // Sort: founder first, then admins, mods, users
    const roleOrder = { founder: 0, admin: 1, moderator: 2, user: 3 }
    const sorted = processed.sort((a, b) => {
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

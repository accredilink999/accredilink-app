import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

const FOUNDER_ID = '873293fe-b638-4b48-b899-ceb5bae519fb'

/**
 * Auto-provision a forum profile for admin/owner users on first login.
 * Generates a unique username from their email prefix or name.
 */
async function autoProvisionAdmin(supabase, { userId, email, fullName, photoUrl, profileRole, orgRole }) {
  // Determine if they qualify for auto-provisioning
  const isFounder = userId === FOUNDER_ID
  const isAdmin = profileRole === 'super_admin' || profileRole === 'admin' || orgRole === 'owner' || orgRole === 'admin'
  if (!isFounder && !isAdmin) return null

  // Generate username from email prefix
  let baseUsername = (email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20)
  if (!baseUsername || baseUsername.length < 3) baseUsername = 'user'

  // Ensure uniqueness — try base, then base-1, base-2, etc.
  let username = baseUsername
  let attempt = 0
  while (true) {
    const { data: existing } = await supabase.from('forum_profiles').select('id').eq('username', username).single()
    if (!existing) break
    attempt++
    username = `${baseUsername}-${attempt}`
    if (attempt > 20) return null // safety
  }

  const forumRole = isFounder ? 'founder' : 'admin'
  const displayName = fullName || username

  const { data: forumProfile, error } = await supabase.from('forum_profiles').insert({
    id: userId,
    username,
    display_name: displayName,
    avatar_url: photoUrl || null,
    forum_role: forumRole,
    accepted_terms: true,
    terms_accepted_at: new Date().toISOString(),
  }).select().single()

  if (error) return null
  return forumProfile
}

// POST: login or get current user profile
export async function POST(req) {
  try {
    const body = await req.json()
    const { action } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'login') {
      const { email, password } = body
      if (!email || !password) return json({ error: 'Email and password required' }, 400)

      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { data, error } = await anonClient.auth.signInWithPassword({ email, password })
      if (error) return json({ error: error.message }, 401)

      // Get profile role + org role
      const userId = data.user.id
      const { data: profile } = await supabase.from('profiles').select('role, full_name, photo_url').eq('id', userId).single()
      const { data: orgMember } = await supabase.from('organization_members').select('role, organization_id').eq('user_id', userId).limit(1).single()

      // Admin-only forum — reject regular staff
      const isFounder = userId === FOUNDER_ID
      const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || orgMember?.role === 'owner' || orgMember?.role === 'admin'
      if (!isFounder && !isAdmin) {
        return json({ error: 'The forum is only available to organisation administrators.' }, 403)
      }

      // Auto-create forum profile for admins
      let { data: forumProfile } = await supabase.from('forum_profiles').select('*').eq('id', userId).single()

      if (!forumProfile) {
        forumProfile = await autoProvisionAdmin(supabase, {
          userId,
          email: data.user.email,
          fullName: profile?.full_name,
          photoUrl: profile?.photo_url,
          profileRole: profile?.role,
          orgRole: orgMember?.role,
        })
      } else {
        // Auto-correct forum_role if it doesn't match (e.g. founder was set as admin)
        const correctRole = isFounder ? 'founder' : (isAdmin ? 'admin' : forumProfile.forum_role)
        if (forumProfile.forum_role !== correctRole || (isFounder && forumProfile.username !== 'carecallai-founder')) {
          const updates = { forum_role: correctRole }
          if (isFounder) {
            updates.username = 'carecallai-founder'
            updates.display_name = 'CareCallAI Founder'
            updates.bio = 'Founder & Creator of CareCallAI. Building the future of intelligent care management — one feature at a time. Passionate about empowering care professionals with technology that actually works.'
          }
          await supabase.from('forum_profiles').update(updates).eq('id', userId)
          Object.assign(forumProfile, updates)
        }
      }

      return json({
        success: true,
        session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token },
        user: { id: userId, email: data.user.email, full_name: profile?.full_name, photo_url: profile?.photo_url },
        profile: forumProfile,
        profileRole: profile?.role || 'user',
        orgRole: orgMember?.role || 'member',
        forumProfile,
        needsSetup: false,
      })
    }

    if (action === 'get-profile') {
      const token = body.token
      if (!token) return json({ error: 'Token required' }, 401)

      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { data: { user }, error } = await anonClient.auth.getUser(token)
      if (error || !user) return json({ error: 'Invalid token' }, 401)

      const { data: profile } = await supabase.from('profiles').select('role, full_name, photo_url').eq('id', user.id).single()
      const { data: orgMember } = await supabase.from('organization_members').select('role').eq('user_id', user.id).limit(1).single()
      let { data: forumProfile } = await supabase.from('forum_profiles').select('*').eq('id', user.id).single()

      // Auto-create for admins who don't have a forum profile yet
      if (!forumProfile) {
        forumProfile = await autoProvisionAdmin(supabase, {
          userId: user.id,
          email: user.email,
          fullName: profile?.full_name,
          photoUrl: profile?.photo_url,
          profileRole: profile?.role,
          orgRole: orgMember?.role,
        })
      }

      // Auto-correct forum_role + update last_seen
      if (forumProfile) {
        const isFounder = user.id === FOUNDER_ID
        const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || orgMember?.role === 'owner' || orgMember?.role === 'admin'
        const correctRole = isFounder ? 'founder' : (isAdmin ? 'admin' : forumProfile.forum_role)
        const updates = { last_seen_at: new Date().toISOString() }
        if (forumProfile.forum_role !== correctRole || (isFounder && forumProfile.username !== 'carecallai-founder')) {
          updates.forum_role = correctRole
          if (isFounder) {
            updates.username = 'carecallai-founder'
            updates.display_name = 'CareCallAI Founder'
            updates.bio = 'Founder & Creator of CareCallAI. Building the future of intelligent care management — one feature at a time. Passionate about empowering care professionals with technology that actually works.'
          }
          Object.assign(forumProfile, updates)
        }
        await supabase.from('forum_profiles').update(updates).eq('id', user.id)
      }

      return json({
        user: { id: user.id, email: user.email, full_name: profile?.full_name, photo_url: profile?.photo_url },
        profile: forumProfile,
        profileRole: profile?.role || 'user',
        orgRole: orgMember?.role || 'member',
        forumProfile,
        needsSetup: !forumProfile,
      })
    }

    if (action === 'setup-profile') {
      const { token, username, displayName } = body
      if (!token || !username) return json({ error: 'Token and username required' }, 400)

      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { data: { user }, error } = await anonClient.auth.getUser(token)
      if (error || !user) return json({ error: 'Invalid token' }, 401)

      // Check username uniqueness
      const { data: existing } = await supabase.from('forum_profiles').select('id').eq('username', username.toLowerCase()).single()
      if (existing) return json({ error: 'Username already taken' }, 409)

      // Determine forum role
      const { data: profile } = await supabase.from('profiles').select('role, full_name, photo_url').eq('id', user.id).single()
      const { data: orgMember } = await supabase.from('organization_members').select('role').eq('user_id', user.id).limit(1).single()

      let forumRole = 'user'
      if (user.id === FOUNDER_ID) forumRole = 'founder'
      else if (profile?.role === 'super_admin' || profile?.role === 'admin' || orgMember?.role === 'owner' || orgMember?.role === 'admin') forumRole = 'admin'

      const { data: forumProfile, error: insertErr } = await supabase.from('forum_profiles').insert({
        id: user.id,
        username: username.toLowerCase(),
        display_name: displayName || profile?.full_name || username,
        avatar_url: profile?.photo_url || null,
        forum_role: forumRole,
        accepted_terms: true,
        terms_accepted_at: new Date().toISOString(),
      }).select().single()

      if (insertErr) return json({ error: insertErr.message }, 500)
      return json({ success: true, profile: forumProfile, forumProfile })
    }

    if (action === 'get-public-profile') {
      const { username } = body
      if (!username) return json({ error: 'Username required' }, 400)

      const { data: forumProfile } = await supabase.from('forum_profiles')
        .select('id, username, display_name, avatar_url, bio, forum_role, post_count, thread_count, reputation, created_at, last_seen_at')
        .eq('username', username.toLowerCase())
        .single()

      if (!forumProfile) return json({ error: 'User not found' }, 404)
      return json({ profile: forumProfile })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'

/**
 * Auto-provision a forum profile for admin/owner users on first login.
 * App admins get 'user' forum role — only founder can promote.
 */
async function autoProvisionAdmin(supabase, { userId, email, fullName, photoUrl, profileRole, orgRole }) {
  const isFounder = userId === FOUNDER_ID
  const isAdmin = profileRole === 'super_admin' || profileRole === 'admin' || orgRole === 'owner' || orgRole === 'admin'
  if (!isFounder && !isAdmin) return null

  let baseUsername = (email || '').split('@')[0].toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20)
  if (!baseUsername || baseUsername.length < 3) baseUsername = 'user'

  let username = baseUsername
  let attempt = 0
  while (true) {
    const { data: existing } = await supabase.from('forum_profiles').select('id').eq('username', username).single()
    if (!existing) break
    attempt++
    username = `${baseUsername}-${attempt}`
    if (attempt > 20) return null
  }

  // App admins get 'user' forum role, only founder gets 'founder'
  const forumRole = isFounder ? 'founder' : 'user'
  const displayName = fullName || username

  const { data: forumProfile, error } = await supabase.from('forum_profiles').insert({
    id: userId,
    username,
    display_name: displayName,
    avatar_url: photoUrl || null,
    forum_role: forumRole,
    accepted_terms: true,
    terms_accepted_at: new Date().toISOString(),
    profile_customized: false,
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

      const userId = data.user.id
      const { data: profile } = await supabase.from('profiles').select('role, full_name, photo_url').eq('id', userId).single()
      const { data: orgMember } = await supabase.from('organization_members').select('role, organization_id').eq('user_id', userId).limit(1).single()

      // Admin-only forum
      const isFounder = userId === FOUNDER_ID
      const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin' || orgMember?.role === 'owner' || orgMember?.role === 'admin'
      if (!isFounder && !isAdmin) {
        return json({ error: 'The forum is only available to organisation administrators.' }, 403)
      }

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
        // Auto-correct founder role only (don't overwrite display_name)
        if (isFounder && forumProfile.forum_role !== 'founder') {
          const updates = {
            forum_role: 'founder',
            profile_customized: true,
          }
          await supabase.from('forum_profiles').update(updates).eq('id', userId)
          Object.assign(forumProfile, updates)
        }
      }

      // Check if first login (needs username setup)
      const needsSetup = forumProfile && !forumProfile.profile_customized && forumProfile.forum_role !== 'founder'

      return json({
        success: true,
        session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token },
        user: { id: userId, email: data.user.email, full_name: profile?.full_name, photo_url: profile?.photo_url },
        profile: forumProfile,
        profileRole: profile?.role || 'user',
        orgRole: orgMember?.role || 'member',
        forumProfile,
        needsSetup,
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

      if (forumProfile) {
        const isFounder = user.id === FOUNDER_ID
        const updates = { last_seen_at: new Date().toISOString() }
        // Only auto-correct founder role (don't overwrite display_name)
        if (isFounder && forumProfile.forum_role !== 'founder') {
          updates.forum_role = 'founder'
          updates.profile_customized = true
          Object.assign(forumProfile, updates)
        }
        await supabase.from('forum_profiles').update(updates).eq('id', user.id)
      }

      const needsSetup = forumProfile && !forumProfile.profile_customized && forumProfile.forum_role !== 'founder'

      return json({
        user: { id: user.id, email: user.email, full_name: profile?.full_name, photo_url: profile?.photo_url },
        profile: forumProfile,
        profileRole: profile?.role || 'user',
        orgRole: orgMember?.role || 'member',
        forumProfile,
        needsSetup,
      })
    }

    if (action === 'setup-profile') {
      const { token, username, displayName } = body
      if (!token || !username) return json({ error: 'Token and username required' }, 400)

      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { data: { user }, error } = await anonClient.auth.getUser(token)
      if (error || !user) return json({ error: 'Invalid token' }, 401)

      const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30)
      if (cleanUsername.length < 3) return json({ error: 'Username must be at least 3 characters' }, 400)

      // Check if user already has a forum profile (update it) or needs a new one
      let { data: existingProfile } = await supabase.from('forum_profiles').select('id').eq('id', user.id).single()

      // Check username uniqueness (exclude own profile)
      const { data: taken } = await supabase.from('forum_profiles').select('id').eq('username', cleanUsername).neq('id', user.id).single()
      if (taken) return json({ error: 'Username already taken' }, 409)

      const { data: appProfile } = await supabase.from('profiles').select('role, full_name, photo_url').eq('id', user.id).single()

      if (existingProfile) {
        // Update existing profile with chosen username
        const { data: forumProfile, error: updateErr } = await supabase.from('forum_profiles').update({
          username: cleanUsername,
          display_name: displayName || appProfile?.full_name || cleanUsername,
          profile_customized: true,
        }).eq('id', user.id).select().single()

        if (updateErr) return json({ error: updateErr.message }, 500)
        return json({ success: true, profile: forumProfile, forumProfile })
      } else {
        // Create new profile
        let forumRole = 'user'
        if (user.id === FOUNDER_ID) forumRole = 'founder'

        const { data: forumProfile, error: insertErr } = await supabase.from('forum_profiles').insert({
          id: user.id,
          username: cleanUsername,
          display_name: displayName || appProfile?.full_name || cleanUsername,
          avatar_url: appProfile?.photo_url || null,
          forum_role: forumRole,
          accepted_terms: true,
          terms_accepted_at: new Date().toISOString(),
          profile_customized: true,
        }).select().single()

        if (insertErr) return json({ error: insertErr.message }, 500)
        return json({ success: true, profile: forumProfile, forumProfile })
      }
    }

    if (action === 'get-public-profile') {
      const { username } = body
      if (!username) return json({ error: 'Username required' }, 400)

      const { data: forumProfile } = await supabase.from('forum_profiles')
        .select('id, username, display_name, avatar_url, bio, forum_role, post_count, thread_count, reputation, created_at, last_seen_at, profile_customized')
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

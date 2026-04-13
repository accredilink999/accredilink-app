import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { notifyModAction } from '@/lib/forumEmail'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

// GET: admin dashboard stats
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
    if (!['founder', 'admin', 'moderator'].includes(fp?.forum_role)) {
      return json({ error: 'Not authorized' }, 403)
    }

    // Get stats
    const [
      { count: userCount },
      { count: threadCount },
      { count: replyCount },
      { data: bannedUsers },
      { data: recentUsers },
      { data: categories },
    ] = await Promise.all([
      supabase.from('forum_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
      supabase.from('forum_replies').select('*', { count: 'exact', head: true }),
      supabase.from('forum_profiles').select('id, username, display_name, forum_role, is_banned, ban_reason, created_at').eq('is_banned', true),
      supabase.from('forum_profiles').select('id, username, display_name, forum_role, is_banned, post_count, thread_count, created_at, last_seen_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('forum_categories').select('*').order('sort_order'),
    ])

    // Get permissions settings
    const { data: permSettings } = await supabase.from('forum_settings').select('value').eq('key', 'role_permissions').single()
    const permissions = permSettings?.value || null

    // Get all users for roles tab
    const { data: allUsers } = await supabase
      .from('forum_profiles')
      .select('id, username, display_name, avatar_url, forum_role, is_banned, post_count, thread_count, reputation, created_at, last_seen_at')
      .order('forum_role', { ascending: true })
      .order('created_at', { ascending: false })

    // Get all org admins/owners across orgs (for invite tab)
    let allOrgAdmins = []
    if (fp?.forum_role === 'founder') {
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id, role, organization_id')
        .in('role', ['owner', 'admin'])

      if (orgMembers?.length) {
        const userIds = orgMembers.map(m => m.user_id)
        // Get profiles for these users
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name, role')
          .in('id', userIds)

        // Get forum profiles to check who has joined
        const { data: forumProfiles } = await supabase
          .from('forum_profiles')
          .select('id, username')
          .in('id', userIds)

        const profileMap = {}
        ;(profiles || []).forEach(p => { profileMap[p.id] = p })
        const forumMap = {}
        ;(forumProfiles || []).forEach(f => { forumMap[f.id] = f })

        // Get org names
        const orgIds = [...new Set(orgMembers.map(m => m.organization_id))]
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, name')
          .in('id', orgIds)
        const orgMap = {}
        ;(orgs || []).forEach(o => { orgMap[o.id] = o.name })

        allOrgAdmins = orgMembers.map(m => ({
          user_id: m.user_id,
          org_role: m.role,
          org_name: orgMap[m.organization_id] || 'Unknown',
          email: profileMap[m.user_id]?.email || '',
          full_name: profileMap[m.user_id]?.full_name || '',
          has_forum_profile: !!forumMap[m.user_id],
          forum_username: forumMap[m.user_id]?.username || null,
        }))
      }
    }

    return json({
      stats: { users: userCount || 0, threads: threadCount || 0, replies: replyCount || 0 },
      bannedUsers: bannedUsers || [],
      recentUsers: recentUsers || [],
      categories: categories || [],
      allOrgAdmins,
      allUsers: allUsers || [],
      permissions,
    })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: admin actions
export async function POST(req) {
  try {
    const body = await req.json()
    const { token, action, userId, reason, categoryId, categoryData, role } = body
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
    const isMod = ['founder', 'admin', 'moderator'].includes(fp?.forum_role)
    const isAdmin = ['founder', 'admin'].includes(fp?.forum_role)
    const isFounder = fp?.forum_role === 'founder'

    if (!isMod) return json({ error: 'Not authorized' }, 403)

    switch (action) {
      case 'ban': {
        if (!userId) return json({ error: 'userId required' }, 400)
        // Can't ban higher roles
        const { data: target } = await supabase.from('forum_profiles').select('forum_role').eq('id', userId).single()
        if (target?.forum_role === 'founder') return json({ error: 'Cannot ban the founder' }, 403)
        if (target?.forum_role === 'admin' && !isFounder) return json({ error: 'Only founder can ban admins' }, 403)
        await supabase.from('forum_profiles').update({ is_banned: true, ban_reason: reason || 'Banned by moderator' }).eq('id', userId)
        notifyModAction(supabase, { userId, action: 'ban', reason: reason || 'Banned by moderator' }).catch(() => {})
        return json({ success: true })
      }

      case 'unban': {
        if (!userId) return json({ error: 'userId required' }, 400)
        await supabase.from('forum_profiles').update({ is_banned: false, ban_reason: null }).eq('id', userId)
        notifyModAction(supabase, { userId, action: 'unban' }).catch(() => {})
        return json({ success: true })
      }

      case 'set-role': {
        if (!isAdmin) return json({ error: 'Only admins can set roles' }, 403)
        if (!userId || !role) return json({ error: 'userId and role required' }, 400)
        if (role === 'founder') return json({ error: 'Cannot assign founder role' }, 403)
        if (role === 'admin' && !isFounder) return json({ error: 'Only founder can assign admin' }, 403)
        await supabase.from('forum_profiles').update({ forum_role: role }).eq('id', userId)
        return json({ success: true })
      }

      case 'update-category': {
        const { data: permRow2 } = await supabase.from('forum_settings').select('value').eq('key', 'role_permissions').single()
        const perms2 = permRow2?.value || {}
        const canManage = isFounder || isAdmin || !!(perms2[fp?.forum_role]?.manage_categories)
        if (!canManage) return json({ error: 'Not authorized to manage categories' }, 403)
        if (!categoryId || !categoryData) return json({ error: 'Missing fields' }, 400)
        await supabase.from('forum_categories').update(categoryData).eq('id', categoryId)
        return json({ success: true })
      }

      case 'create-category': {
        // Check stored permissions — founder/admin always can, mods need create_categories permission
        const { data: permRow } = await supabase.from('forum_settings').select('value').eq('key', 'role_permissions').single()
        const perms = permRow?.value || {}
        const canCreate = isFounder || isAdmin || (perms[fp?.forum_role]?.create_categories === true)
        if (!canCreate) return json({ error: 'You do not have permission to create categories' }, 403)
        if (!categoryData?.name || !categoryData?.slug) return json({ error: 'Name and slug required' }, 400)
        const { error: insertErr } = await supabase.from('forum_categories').insert(categoryData)
        if (insertErr) return json({ error: insertErr.message }, 500)
        return json({ success: true })
      }

      case 'delete-category': {
        if (!isFounder) return json({ error: 'Only founder can delete categories' }, 403)
        if (!categoryId) return json({ error: 'categoryId required' }, 400)
        await supabase.from('forum_categories').delete().eq('id', categoryId)
        return json({ success: true })
      }

      case 'invite-to-forum': {
        if (!isFounder) return json({ error: 'Only founder can send invites' }, 403)
        const { email, name } = body
        if (!email) return json({ error: 'Email required' }, 400)

        // Send invite email via Supabase edge function
        try {
          const emailBody = `
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:30px">
              <div style="text-align:center;margin-bottom:30px">
                <h1 style="color:#0d9488;font-size:24px;margin:0">CareCall<span style="color:#334155">AI</span> Forum</h1>
                <p style="color:#64748b;font-size:14px;margin-top:5px">Community for Care Professionals</p>
              </div>
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:24px">
                <h2 style="color:#1e293b;font-size:18px;margin:0 0 12px 0">Hi ${name || 'there'},</h2>
                <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px 0">
                  You're invited to join the <strong>CareCallAI Community Forum</strong> — an exclusive space for care sector administrators to share insights, get support, and connect with fellow professionals.
                </p>
                <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0">
                  As an organisation admin, you have full access. Simply log in with your existing CareCall AI credentials.
                </p>
                <div style="text-align:center;margin:24px 0">
                  <a href="https://carecallai.co.uk/forum" style="background:linear-gradient(135deg,#14b8a6,#0d9488);color:white;text-decoration:none;padding:12px 32px;border-radius:12px;font-weight:600;font-size:14px;display:inline-block">
                    Join the Forum
                  </a>
                </div>
                <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
                  Use your existing CareCall AI email and password to sign in
                </p>
              </div>
              <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:20px">
                CareCall AI — Smart Care Management
              </p>
            </div>
          `

          const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              to: email,
              subject: 'You\'re invited to the CareCallAI Community Forum',
              html: emailBody,
            }),
          })

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            return json({ error: errData.error || 'Failed to send email' }, 500)
          }
        } catch (emailErr) {
          return json({ error: 'Failed to send invite: ' + emailErr.message }, 500)
        }

        return json({ success: true })
      }

      case 'update-permissions': {
        if (!isFounder) return json({ error: 'Only founder can update permissions' }, 403)
        const { permissions: newPerms } = body
        if (!newPerms) return json({ error: 'permissions object required' }, 400)
        const { error: permErr } = await supabase.from('forum_settings')
          .upsert({ key: 'role_permissions', value: newPerms, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        if (permErr) return json({ error: permErr.message }, 500)
        return json({ success: true })
      }

      case 'fix-founder': {
        if (!isFounder) return json({ error: 'Only founder' }, 403)
        const { username: newUsername, display_name, bio: newBio } = body
        const updates = { forum_role: 'founder' }
        if (newUsername) updates.username = newUsername.toLowerCase()
        if (display_name) updates.display_name = display_name
        if (newBio) updates.bio = newBio
        await supabase.from('forum_profiles').update(updates).eq('id', user.id)
        return json({ success: true })
      }

      default:
        return json({ error: 'Unknown action' }, 400)
    }
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

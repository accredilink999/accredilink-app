import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { notifyModAction, forumInviteHtml } from '@/lib/forumEmail'


export const dynamic = 'force-dynamic'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://x.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'x')
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
      { data: onlineUsers },
    ] = await Promise.all([
      supabase.from('forum_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
      supabase.from('forum_replies').select('*', { count: 'exact', head: true }),
      supabase.from('forum_profiles').select('id, username, display_name, forum_role, is_banned, ban_reason, created_at').eq('is_banned', true),
      supabase.from('forum_profiles').select('id, username, display_name, forum_role, is_banned, post_count, thread_count, created_at, last_seen_at').order('created_at', { ascending: false }).limit(20),
      supabase.from('forum_categories').select('*').order('sort_order'),
      supabase.from('forum_profiles').select('id, username, display_name, forum_role, last_seen_at').gte('last_seen_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
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

    // Get invited emails tracking
    const { data: invitedRow } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
    const invitedEmails = invitedRow?.value || []

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
          was_invited: invitedEmails.includes(profileMap[m.user_id]?.email),
        }))
      }
    }

    return json({
      stats: { users: userCount || 0, threads: threadCount || 0, replies: replyCount || 0, online: onlineUsers?.length || 0 },
      onlineUsers: onlineUsers || [],
      bannedUsers: bannedUsers || [],
      recentUsers: recentUsers || [],
      categories: categories || [],
      allOrgAdmins,
      allUsers: allUsers || [],
      permissions,
      invitedEmails,
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

      case 'warn': {
        if (!isMod) return json({ error: 'Not authorized' }, 403)
        if (!userId) return json({ error: 'userId required' }, 400)
        const { message } = body
        const warnMsg = message || 'You have received an official warning from the forum moderators. Please review our community guidelines.'
        // Send warning as a notification
        await supabase.from('forum_notifications').insert({
          user_id: userId,
          type: 'mod_action',
          actor_id: user.id,
          message: `⚠️ Warning: ${warnMsg}`,
          is_read: false,
        })
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

      case 'send-direct-invite': {
        if (!isFounder) return json({ error: 'Only founder can send invites' }, 403)
        const { email: directEmail, name: directName } = body
        if (!directEmail) return json({ error: 'Email required' }, 400)

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify({ to: directEmail, subject: 'Join the CareCallAI Community Forum — Your Account is Ready', html: forumInviteHtml(directName) }),
          })
          if (!res.ok) { const e = await res.json().catch(() => ({})); return json({ error: e.error || 'Failed to send' }, 500) }

          // Track this email as invited
          const { data: invR } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
          const invL = invR?.value || []
          if (!invL.includes(directEmail)) {
            invL.push(directEmail)
            await supabase.from('forum_settings').upsert({ key: 'forum_invited_emails', value: invL, updated_at: new Date().toISOString() }, { onConflict: 'key' })
          }
        } catch (e) { return json({ error: 'Failed: ' + e.message }, 500) }
        return json({ success: true })
      }

      case 'send-bulk-invite': {
        if (!isFounder) return json({ error: 'Only founder can send invites' }, 403)
        const { emails: bulkEmails } = body
        if (!bulkEmails?.length) return json({ error: 'No emails provided' }, 400)
        let sent = 0, failed = 0
        const { data: invR3 } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
        const bulkInvList = invR3?.value || []
        for (const item of bulkEmails) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
              body: JSON.stringify({ to: item.email, subject: 'Join the CareCallAI Community Forum — Your Account is Ready', html: forumInviteHtml(item.name) }),
            })
            if (res.ok) { sent++; if (!bulkInvList.includes(item.email)) bulkInvList.push(item.email) } else { failed++ }
          } catch { failed++ }
        }
        if (sent > 0) {
          await supabase.from('forum_settings').upsert({ key: 'forum_invited_emails', value: bulkInvList, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        }
        return json({ success: true, sent, failed })
      }

      case 'invite-to-forum': {
        if (!isFounder) return json({ error: 'Only founder can send invites' }, 403)
        const { email, name } = body
        if (!email) return json({ error: 'Email required' }, 400)

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
            body: JSON.stringify({
              to: email,
              subject: 'Join the CareCallAI Community Forum — Your Account is Ready',
              html: forumInviteHtml(name),
            }),
          })
          if (!res.ok) { const e = await res.json().catch(() => ({})); return json({ error: e.error || 'Failed to send email' }, 500) }

          // Track this email as invited
          const { data: invRow } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
          const invList = invRow?.value || []
          if (!invList.includes(email)) {
            invList.push(email)
            await supabase.from('forum_settings').upsert({ key: 'forum_invited_emails', value: invList, updated_at: new Date().toISOString() }, { onConflict: 'key' })
          }
        } catch (emailErr) {
          return json({ error: 'Failed to send invite: ' + emailErr.message }, 500)
        }

        return json({ success: true })
      }

      case 'send-forum-invite-all': {
        if (!isFounder) return json({ error: 'Only founder can send invites' }, 403)

        // Get org admins
        const { data: orgMems } = await supabase.from('organization_members').select('user_id, role').in('role', ['owner', 'admin'])
        if (!orgMems?.length) return json({ success: true, sent: 0, skipped: 0, failed: 0 })

        const uids = orgMems.map(m => m.user_id)
        const { data: profs } = await supabase.from('profiles').select('id, email, full_name').in('id', uids)
        const { data: fProfs } = await supabase.from('forum_profiles').select('id').in('id', uids)
        const forumIds = new Set((fProfs || []).map(f => f.id))

        // Get already-invited list
        const { data: invRow2 } = await supabase.from('forum_settings').select('value').eq('key', 'forum_invited_emails').single()
        const alreadyInvited = new Set(invRow2?.value || [])

        // Build send list — skip those who joined or were already invited
        const profMap = {}
        ;(profs || []).forEach(p => { profMap[p.id] = p })
        const toSend = []
        const seen = new Set()
        for (const m of orgMems) {
          const p = profMap[m.user_id]
          if (!p?.email || seen.has(p.email)) continue
          seen.add(p.email)
          if (forumIds.has(m.user_id)) continue // already joined
          if (alreadyInvited.has(p.email)) continue // already invited
          toSend.push({ email: p.email, name: p.full_name || '' })
        }

        let sent = 0, failed = 0
        const newInvited = [...alreadyInvited]
        for (const item of toSend) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-campaign-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
              body: JSON.stringify({ to: item.email, subject: 'Join the CareCallAI Community Forum — Your Account is Ready', html: forumInviteHtml(item.name) }),
            })
            if (res.ok) { sent++; newInvited.push(item.email) } else { failed++ }
          } catch { failed++ }
        }

        // Save updated invited list
        if (sent > 0) {
          await supabase.from('forum_settings').upsert({ key: 'forum_invited_emails', value: newInvited, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        }

        return json({ success: true, sent, failed, skipped: orgMems.length - toSend.length - (orgMems.length - Object.keys(profMap).length) })
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

      case 'delete-member': {
        if (!isFounder) return json({ error: 'Only founder can delete members' }, 403)
        if (!userId) return json({ error: 'userId required' }, 400)
        // Cannot delete yourself
        if (userId === user.id) return json({ error: 'Cannot delete your own profile' }, 400)
        // Delete their replies, threads, likes, notifications, then profile
        await supabase.from('forum_likes').delete().eq('user_id', userId)
        await supabase.from('forum_notifications').delete().eq('user_id', userId)
        await supabase.from('forum_notifications').delete().eq('actor_id', userId)
        await supabase.from('forum_replies').delete().eq('author_id', userId)
        await supabase.from('forum_threads').delete().eq('author_id', userId)
        await supabase.from('forum_profiles').delete().eq('id', userId)
        // Add to exclusion list so auto-provisioning doesn't re-create them
        const { data: exRow } = await supabase.from('forum_settings').select('value').eq('key', 'excluded_users').single()
        const excluded = exRow?.value || []
        if (!excluded.includes(userId)) {
          excluded.push(userId)
          await supabase.from('forum_settings').upsert({ key: 'excluded_users', value: excluded, updated_at: new Date().toISOString() }, { onConflict: 'key' })
        }
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

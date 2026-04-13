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

    return json({
      stats: { users: userCount || 0, threads: threadCount || 0, replies: replyCount || 0 },
      bannedUsers: bannedUsers || [],
      recentUsers: recentUsers || [],
      categories: categories || [],
    })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: admin actions
export async function POST(req) {
  try {
    const { token, action, userId, reason, categoryId, categoryData, role } = await req.json()
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
        if (!isAdmin) return json({ error: 'Only admins can manage categories' }, 403)
        if (!categoryId || !categoryData) return json({ error: 'Missing fields' }, 400)
        await supabase.from('forum_categories').update(categoryData).eq('id', categoryId)
        return json({ success: true })
      }

      case 'create-category': {
        if (!isAdmin) return json({ error: 'Only admins can create categories' }, 403)
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

      default:
        return json({ error: 'Unknown action' }, 400)
    }
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'


export const dynamic = 'force-dynamic'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

// GET: fetch user notifications
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: notifications } = await supabase
      .from('forum_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Manually join forum_profiles for actors
    const actorIds = [...new Set((notifications || []).map(n => n.actor_id).filter(Boolean))]
    let profileMap = {}
    if (actorIds.length > 0) {
      const { data: profiles } = await supabase.from('forum_profiles').select('id, username, avatar_url').in('id', actorIds)
      ;(profiles || []).forEach(p => { profileMap[p.id] = p })
    }
    const enriched = (notifications || []).map(n => ({ ...n, forum_profiles: profileMap[n.actor_id] || null }))

    const unreadCount = enriched.filter(n => !n.is_read).length

    return json({ notifications: enriched, unreadCount })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// PATCH: mark notifications as read
export async function PATCH(req) {
  try {
    const { token, notificationIds, markAll } = await req.json()
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    if (markAll) {
      await supabase.from('forum_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    } else if (notificationIds?.length) {
      await supabase.from('forum_notifications').update({ is_read: true }).in('id', notificationIds).eq('user_id', user.id)
    }

    return json({ success: true })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

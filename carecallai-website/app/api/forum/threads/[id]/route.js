import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function json(data, status = 200) { return NextResponse.json(data, { status }) }

// GET thread by slug or ID
export async function GET(req, { params }) {
  const { id } = await params
  // Try UUID first, then slug
  const isUUID = /^[0-9a-f]{8}-/.test(id)
  let query = supabase.from('forum_threads')
    .select('*, forum_categories(id, name, slug)')

  if (isUUID) query = query.eq('id', id)
  else query = query.eq('slug', id)

  const { data: thread, error } = await query.single()
  if (error || !thread) return json({ error: 'Thread not found' }, 404)

  // Increment view count (fire-and-forget)
  supabase.from('forum_threads').update({ view_count: (thread.view_count || 0) + 1 }).eq('id', thread.id).then(() => {})

  // Get replies
  const { data: replies } = await supabase
    .from('forum_replies')
    .select('*')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })

  // Manually join forum_profiles for thread author + reply authors (no FK constraint)
  const allAuthorIds = [thread.author_id, ...(replies || []).map(r => r.author_id)].filter(Boolean)
  const uniqueIds = [...new Set(allAuthorIds)]
  let profileMap = {}
  if (uniqueIds.length > 0) {
    const { data: profiles } = await supabase
      .from('forum_profiles')
      .select('id, username, display_name, avatar_url, forum_role, post_count')
      .in('id', uniqueIds)
    ;(profiles || []).forEach(p => { profileMap[p.id] = p })
  }

  thread.forum_profiles = profileMap[thread.author_id] || null
  const enrichedReplies = (replies || []).map(r => ({
    ...r,
    forum_profiles: profileMap[r.author_id] || null,
  }))

  return json({ thread, replies: enrichedReplies })
}

const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'

// PATCH: update thread (edit, pin, lock, feature, delete)
export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { token, action: modAction, ...updates } = body

    if (!token) return json({ error: 'Unauthorized — no token' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized — token expired. Please log out and log back in. (' + (authErr?.message || 'no user') + ')' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
    const role = fp?.forum_role || 'user'
    // Check founder by BOTH role AND user ID
    const isFounder = role === 'founder' || user.id === FOUNDER_ID

    // Load stored permissions
    const { data: permRow } = await supabase.from('forum_settings').select('value').eq('key', 'role_permissions').single()
    const perms = permRow?.value || {}
    const hasPerm = (key) => isFounder || !!(perms[role]?.[key])

    const { data: thread } = await supabase.from('forum_threads').select('author_id').eq('id', id).single()
    if (!thread) return json({ error: 'Thread not found' }, 404)

    // Mod actions — check specific permissions
    if (modAction === 'pin' || modAction === 'unpin') {
      if (!hasPerm('pin_threads')) return json({ error: 'Not authorized' }, 403)
      await supabase.from('forum_threads').update({ is_pinned: modAction === 'pin' }).eq('id', id)
      return json({ success: true })
    }
    if (modAction === 'lock' || modAction === 'unlock') {
      if (!hasPerm('lock_threads')) return json({ error: 'Not authorized' }, 403)
      await supabase.from('forum_threads').update({ is_locked: modAction === 'lock' }).eq('id', id)
      return json({ success: true })
    }
    if (modAction === 'delete') {
      if (!hasPerm('delete_threads') && thread.author_id !== user.id) return json({ error: 'Not authorized' }, 403)
      await supabase.from('forum_threads').delete().eq('id', id)
      return json({ success: true })
    }
    if (modAction === 'bump') {
      if (!hasPerm('bump_threads')) return json({ error: 'Not authorized' }, 403)
      await supabase.from('forum_threads').update({ last_reply_at: new Date().toISOString() }).eq('id', id)
      return json({ success: true })
    }
    if (modAction === 'move') {
      if (!hasPerm('move_threads')) return json({ error: 'Not authorized' }, 403)
      const { categoryId: newCatId } = body
      if (!newCatId) return json({ error: 'categoryId required' }, 400)
      await supabase.from('forum_threads').update({ category_id: newCatId }).eq('id', id)
      return json({ success: true })
    }

    // Author edit — or mod with edit_any_post permission
    if (thread.author_id !== user.id && !hasPerm('edit_any_post')) return json({ error: 'Not authorized' }, 403)
    const allowedFields = {}
    if (updates.title) allowedFields.title = updates.title
    if (updates.content) allowedFields.content = updates.content
    if (updates.tags) allowedFields.tags = updates.tags
    allowedFields.updated_at = new Date().toISOString()

    await supabase.from('forum_threads').update(allowedFields).eq('id', id)
    return json({ success: true })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

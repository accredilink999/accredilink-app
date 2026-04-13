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
    .select('*, forum_categories(id, name, slug), forum_profiles!forum_threads_author_id_fkey(username, display_name, avatar_url, forum_role)')

  if (isUUID) query = query.eq('id', id)
  else query = query.eq('slug', id)

  const { data: thread, error } = await query.single()
  if (error || !thread) return json({ error: 'Thread not found' }, 404)

  // Increment view count (fire-and-forget)
  supabase.from('forum_threads').update({ view_count: (thread.view_count || 0) + 1 }).eq('id', thread.id).then(() => {})

  // Get replies with authors (include post_count for star ranking)
  const { data: replies } = await supabase
    .from('forum_replies')
    .select('*, forum_profiles!forum_replies_author_id_fkey(username, display_name, avatar_url, forum_role, post_count)')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })

  return json({ thread, replies: replies || [] })
}

// PATCH: update thread (edit, pin, lock, feature, delete)
export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { token, action: modAction, ...updates } = body

    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
    const isMod = ['founder', 'admin', 'moderator'].includes(fp?.forum_role)

    const { data: thread } = await supabase.from('forum_threads').select('author_id').eq('id', id).single()
    if (!thread) return json({ error: 'Thread not found' }, 404)

    // Mod actions
    if (modAction === 'pin' || modAction === 'unpin') {
      if (!isMod) return json({ error: 'Not authorized' }, 403)
      await supabase.from('forum_threads').update({ is_pinned: modAction === 'pin' }).eq('id', id)
      return json({ success: true })
    }
    if (modAction === 'lock' || modAction === 'unlock') {
      if (!isMod) return json({ error: 'Not authorized' }, 403)
      await supabase.from('forum_threads').update({ is_locked: modAction === 'lock' }).eq('id', id)
      return json({ success: true })
    }
    if (modAction === 'delete') {
      if (!isMod && thread.author_id !== user.id) return json({ error: 'Not authorized' }, 403)
      await supabase.from('forum_threads').delete().eq('id', id)
      return json({ success: true })
    }
    if (modAction === 'bump') {
      if (!isMod) return json({ error: 'Not authorized' }, 403)
      await supabase.from('forum_threads').update({ last_reply_at: new Date().toISOString() }).eq('id', id)
      return json({ success: true })
    }
    if (modAction === 'move') {
      if (!isMod) return json({ error: 'Not authorized' }, 403)
      const { categoryId: newCatId } = body
      if (!newCatId) return json({ error: 'categoryId required' }, 400)
      await supabase.from('forum_threads').update({ category_id: newCatId }).eq('id', id)
      return json({ success: true })
    }

    // Author edit
    if (thread.author_id !== user.id && !isMod) return json({ error: 'Not authorized' }, 403)
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

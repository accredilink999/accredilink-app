import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { notifyReply, notifyMention, notifySubscriber } from '@/lib/forumEmail'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

// POST: create reply
export async function POST(req) {
  try {
    const { token, threadId, parentId, content } = await req.json()
    if (!token || !threadId || !content) return json({ error: 'Missing fields' }, 400)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('is_banned, forum_role, username').eq('id', user.id).single()
    if (!fp) return json({ error: 'Complete forum setup first' }, 403)
    if (fp.is_banned) return json({ error: 'You are banned' }, 403)

    // Check thread not locked — use stored permissions
    const { data: thread } = await supabase.from('forum_threads').select('is_locked, author_id, title').eq('id', threadId).single()
    if (!thread) return json({ error: 'Thread not found' }, 404)
    if (thread.is_locked) {
      const { data: permRow } = await supabase.from('forum_settings').select('value').eq('key', 'role_permissions').single()
      const perms = permRow?.value || {}
      const canPost = fp.forum_role === 'founder' || !!(perms[fp.forum_role]?.post_in_locked)
      if (!canPost) return json({ error: 'Thread is locked' }, 403)
    }

    const { data: reply, error: insertErr } = await supabase.from('forum_replies').insert({
      thread_id: threadId,
      parent_id: parentId || null,
      author_id: user.id,
      content,
    }).select('*').single()

    // Manually attach forum_profiles (no FK constraint)
    if (reply) {
      const { data: authorProfile } = await supabase
        .from('forum_profiles')
        .select('username, display_name, avatar_url, forum_role')
        .eq('id', user.id).single()
      reply.forum_profiles = authorProfile || null
    }

    if (insertErr) return json({ error: insertErr.message }, 500)

    // Update thread reply count + last reply
    const { data: t } = await supabase.from('forum_threads').select('reply_count').eq('id', threadId).single()
    await supabase.from('forum_threads').update({
      reply_count: (t?.reply_count || 0) + 1,
      last_reply_at: new Date().toISOString(),
      last_reply_by: user.id,
    }).eq('id', threadId)

    // Update user post count
    const { data: p } = await supabase.from('forum_profiles').select('post_count').eq('id', user.id).single()
    await supabase.from('forum_profiles').update({ post_count: (p?.post_count || 0) + 1 }).eq('id', user.id)

    // Update category post count
    const { data: threadFull } = await supabase.from('forum_threads').select('category_id').eq('id', threadId).single()
    if (threadFull) {
      const { data: c } = await supabase.from('forum_categories').select('post_count').eq('id', threadFull.category_id).single()
      await supabase.from('forum_categories').update({ post_count: (c?.post_count || 0) + 1 }).eq('id', threadFull.category_id)
    }

    // Create notification for thread author (if not replying to own thread)
    if (thread.author_id !== user.id) {
      await supabase.from('forum_notifications').insert({
        user_id: thread.author_id,
        type: 'reply',
        thread_id: threadId,
        reply_id: reply.id,
        actor_id: user.id,
        message: `${fp.username} replied to "${thread.title}"`,
      })

      // Send email notification (fire-and-forget)
      notifyReply(supabase, {
        threadAuthorId: thread.author_id,
        threadTitle: thread.title,
        threadId,
        replyAuthor: fp.username,
        replyContent: content,
      }).catch(() => {})
    }

    // Notify thread subscribers (except author and reply author)
    try {
      const { data: subs } = await supabase
        .from('forum_subscriptions')
        .select('user_id')
        .eq('thread_id', threadId)
      const subscriberIds = (subs || [])
        .map(s => s.user_id)
        .filter(id => id !== user.id && id !== thread.author_id)
      for (const subId of subscriberIds) {
        await supabase.from('forum_notifications').insert({
          user_id: subId, type: 'reply', thread_id: threadId, reply_id: reply.id,
          actor_id: user.id, message: `${fp.username} replied to "${thread.title}"`,
        })
        notifySubscriber(supabase, {
          userId: subId, threadTitle: thread.title, threadId,
          replyAuthor: fp.username, replyContent: content,
        }).catch(() => {})
      }
    } catch {}

    // Detect @mentions and notify
    try {
      const mentionRegex = /@([a-z0-9_-]+)/gi
      const mentions = [...content.matchAll(mentionRegex)].map(m => m[1].toLowerCase())
      const uniqueMentions = [...new Set(mentions)]
      for (const username of uniqueMentions) {
        if (username === fp.username) continue // skip self-mention
        const { data: mentioned } = await supabase
          .from('forum_profiles').select('id').eq('username', username).maybeSingle()
        if (mentioned && mentioned.id !== user.id && mentioned.id !== thread.author_id) {
          await supabase.from('forum_notifications').insert({
            user_id: mentioned.id, type: 'mention', thread_id: threadId, reply_id: reply.id,
            actor_id: user.id, message: `${fp.username} mentioned you in "${thread.title}"`,
          })
          notifyMention(supabase, {
            userId: mentioned.id, actorName: fp.username,
            threadTitle: thread.title, threadId, content,
          }).catch(() => {})
        }
      }
    } catch {}

    return json({ success: true, reply })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// PATCH: edit or delete reply
export async function PATCH(req) {
  try {
    const { token, replyId, content, action: modAction } = await req.json()
    if (!token || !replyId) return json({ error: 'Missing fields' }, 400)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
    const role = fp?.forum_role || 'user'
    const isFounderUser = role === 'founder'

    // Load stored permissions
    const { data: permRow } = await supabase.from('forum_settings').select('value').eq('key', 'role_permissions').single()
    const perms = permRow?.value || {}
    const hasPerm = (key) => isFounderUser || !!(perms[role]?.[key])

    const { data: reply } = await supabase.from('forum_replies').select('author_id, thread_id').eq('id', replyId).single()
    if (!reply) return json({ error: 'Reply not found' }, 404)

    if (modAction === 'delete') {
      if (!hasPerm('delete_any_reply') && reply.author_id !== user.id) return json({ error: 'Not authorized' }, 403)
      await supabase.from('forum_replies').delete().eq('id', replyId)
      // Decrement reply count
      const { data: t } = await supabase.from('forum_threads').select('reply_count').eq('id', reply.thread_id).single()
      await supabase.from('forum_threads').update({ reply_count: Math.max(0, (t?.reply_count || 1) - 1) }).eq('id', reply.thread_id)
      return json({ success: true })
    }

    if (modAction === 'solution') {
      if (!hasPerm('mark_solution') && reply.author_id !== user.id) return json({ error: 'Not authorized' }, 403)
      // Unmark all others, mark this one
      await supabase.from('forum_replies').update({ is_solution: false }).eq('thread_id', reply.thread_id)
      await supabase.from('forum_replies').update({ is_solution: true }).eq('id', replyId)
      return json({ success: true })
    }

    // Edit content — author or mod with edit_any_post
    if (reply.author_id !== user.id && !hasPerm('edit_any_post')) return json({ error: 'Not authorized' }, 403)
    if (!content) return json({ error: 'Content required' }, 400)
    await supabase.from('forum_replies').update({ content, updated_at: new Date().toISOString() }).eq('id', replyId)
    return json({ success: true })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

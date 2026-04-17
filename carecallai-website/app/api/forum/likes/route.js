import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { notifyLike } from '@/lib/forumEmail'


export const dynamic = 'force-dynamic'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

// POST: toggle like on thread or reply
export async function POST(req) {
  try {
    const { token, threadId, replyId } = await req.json()
    if (!token) return json({ error: 'Unauthorized' }, 401)
    if (!threadId && !replyId) return json({ error: 'Must specify threadId or replyId' }, 400)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('is_banned').eq('id', user.id).single()
    if (!fp) return json({ error: 'Complete forum setup first' }, 403)
    if (fp.is_banned) return json({ error: 'You are banned' }, 403)

    // Check if already liked
    let query = supabase.from('forum_likes').select('id')
    if (threadId) query = query.eq('thread_id', threadId).is('reply_id', null)
    else query = query.eq('reply_id', replyId).is('thread_id', null)
    query = query.eq('user_id', user.id)

    const { data: existing } = await query.single()

    if (existing) {
      // Unlike
      await supabase.from('forum_likes').delete().eq('id', existing.id)
      // Decrement count
      if (threadId) {
        const { data: t } = await supabase.from('forum_threads').select('like_count').eq('id', threadId).single()
        await supabase.from('forum_threads').update({ like_count: Math.max(0, (t?.like_count || 1) - 1) }).eq('id', threadId)
      } else {
        const { data: r } = await supabase.from('forum_replies').select('like_count').eq('id', replyId).single()
        await supabase.from('forum_replies').update({ like_count: Math.max(0, (r?.like_count || 1) - 1) }).eq('id', replyId)
      }
      return json({ success: true, liked: false })
    } else {
      // Like
      await supabase.from('forum_likes').insert({
        user_id: user.id,
        thread_id: threadId || null,
        reply_id: replyId || null,
      })
      // Increment count
      if (threadId) {
        const { data: t } = await supabase.from('forum_threads').select('like_count').eq('id', threadId).single()
        await supabase.from('forum_threads').update({ like_count: (t?.like_count || 0) + 1 }).eq('id', threadId)
      } else {
        const { data: r } = await supabase.from('forum_replies').select('like_count').eq('id', replyId).single()
        await supabase.from('forum_replies').update({ like_count: (r?.like_count || 0) + 1 }).eq('id', replyId)
      }

      // Notification for like
      if (threadId) {
        const { data: thread } = await supabase.from('forum_threads').select('author_id, title').eq('id', threadId).single()
        if (thread && thread.author_id !== user.id) {
          const { data: actor } = await supabase.from('forum_profiles').select('username').eq('id', user.id).single()
          await supabase.from('forum_notifications').insert({
            user_id: thread.author_id,
            type: 'like',
            thread_id: threadId,
            actor_id: user.id,
            message: `${actor?.username || 'Someone'} liked your thread "${thread.title}"`,
          })

          // Send email notification (fire-and-forget)
          notifyLike(supabase, {
            userId: thread.author_id,
            actorName: actor?.username || 'Someone',
            threadTitle: thread.title,
            threadId,
          }).catch(() => {})
        }
      }

      return json({ success: true, liked: true })
    }
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// GET: check if user liked specific items
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const threadId = searchParams.get('threadId')

    if (!token || !threadId) return json({ error: 'Missing params' }, 400)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    // Get all user likes for this thread (thread + replies)
    const { data: likes } = await supabase.from('forum_likes')
      .select('thread_id, reply_id')
      .eq('user_id', user.id)
      .or(`thread_id.eq.${threadId},reply_id.not.is.null`)

    // Filter reply likes to those belonging to this thread
    const { data: threadReplies } = await supabase.from('forum_replies')
      .select('id')
      .eq('thread_id', threadId)

    const replyIds = new Set((threadReplies || []).map(r => r.id))

    const likedThreadId = likes?.some(l => l.thread_id === threadId && !l.reply_id) || false
    const likedReplyIds = (likes || [])
      .filter(l => l.reply_id && replyIds.has(l.reply_id))
      .map(l => l.reply_id)

    return json({ likedThread: likedThreadId, likedReplies: likedReplyIds })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'


export const dynamic = 'force-dynamic'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://x.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'x')
function json(data, status = 200) { return NextResponse.json(data, { status }) }

// GET: get reactions for a thread or reply
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const threadId = searchParams.get('threadId')
    const replyIds = searchParams.get('replyIds') // comma-separated
    const userId = searchParams.get('userId')

    if (threadId) {
      // Get all reactions for a thread and its replies
      const { data: threadReactions } = await supabase
        .from('forum_reactions')
        .select('id, user_id, thread_id, reply_id, emoji')
        .eq('thread_id', threadId)
        .is('reply_id', null)

      let replyReactions = []
      if (replyIds) {
        const ids = replyIds.split(',').filter(Boolean)
        if (ids.length) {
          const { data } = await supabase
            .from('forum_reactions')
            .select('id, user_id, thread_id, reply_id, emoji')
            .in('reply_id', ids)
          replyReactions = data || []
        }
      }

      return json({ threadReactions: threadReactions || [], replyReactions })
    }

    return json({ threadReactions: [], replyReactions: [] })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: toggle a reaction
export async function POST(req) {
  try {
    const body = await req.json()
    const { token, threadId, replyId, emoji } = body
    if (!token || !emoji) return json({ error: 'Missing fields' }, 400)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    // Check existing
    let query = supabase.from('forum_reactions').select('id').eq('user_id', user.id).eq('emoji', emoji)
    if (replyId) query = query.eq('reply_id', replyId)
    else if (threadId) query = query.eq('thread_id', threadId).is('reply_id', null)
    else return json({ error: 'threadId or replyId required' }, 400)

    const { data: existing } = await query.maybeSingle()

    if (existing) {
      // Remove reaction
      await supabase.from('forum_reactions').delete().eq('id', existing.id)
      return json({ action: 'removed' })
    } else {
      // Add reaction
      const insert = { user_id: user.id, emoji }
      if (replyId) insert.reply_id = replyId
      else insert.thread_id = threadId
      await supabase.from('forum_reactions').insert(insert)
      return json({ action: 'added' })
    }
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

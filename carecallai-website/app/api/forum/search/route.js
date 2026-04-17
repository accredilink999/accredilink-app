import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'


export const dynamic = 'force-dynamic'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim()
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20

    if (!q || q.length < 2) return json({ error: 'Query too short' }, 400)

    const offset = (page - 1) * limit
    const searchTerm = `%${q}%`

    // Search threads
    const { data: threads } = await supabase
      .from('forum_threads')
      .select('id, title, slug, content, created_at, reply_count, view_count, like_count, category_id, author_id, forum_categories(name, slug)')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Search replies
    const { data: replies } = await supabase
      .from('forum_replies')
      .select('id, content, created_at, thread_id, author_id')
      .ilike('content', searchTerm)
      .order('created_at', { ascending: false })
      .range(0, 9)

    // Get thread info for replies
    const replyThreadIds = [...new Set((replies || []).map(r => r.thread_id).filter(Boolean))]
    let threadMap = {}
    if (replyThreadIds.length > 0) {
      const { data: replyThreads } = await supabase.from('forum_threads').select('id, title, slug').in('id', replyThreadIds)
      ;(replyThreads || []).forEach(t => { threadMap[t.id] = t })
    }

    // Manually join forum_profiles for all authors
    const allAuthorIds = [
      ...(threads || []).map(t => t.author_id),
      ...(replies || []).map(r => r.author_id),
    ].filter(Boolean)
    const uniqueIds = [...new Set(allAuthorIds)]
    let profileMap = {}
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase.from('forum_profiles').select('id, username, display_name, avatar_url, forum_role').in('id', uniqueIds)
      ;(profiles || []).forEach(p => { profileMap[p.id] = p })
    }

    // Combine results
    const results = [
      ...(threads || []).map(t => ({ ...t, forum_profiles: profileMap[t.author_id] || null, type: 'thread' })),
      ...(replies || []).map(r => ({ ...r, forum_threads: threadMap[r.thread_id] || null, forum_profiles: profileMap[r.author_id] || null, type: 'reply' })),
    ]

    return json({ results, query: q, page })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

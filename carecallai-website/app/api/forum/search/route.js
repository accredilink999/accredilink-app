import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
    const { data: threads, error: tErr } = await supabase
      .from('forum_threads')
      .select('id, title, slug, content, created_at, reply_count, view_count, like_count, category_id, forum_categories(name, slug), forum_profiles!forum_threads_author_id_fkey(username, display_name, avatar_url, forum_role)')
      .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Search replies
    const { data: replies, error: rErr } = await supabase
      .from('forum_replies')
      .select('id, content, created_at, thread_id, forum_threads!forum_replies_thread_id_fkey(title, slug), forum_profiles!forum_replies_author_id_fkey(username, display_name, avatar_url, forum_role)')
      .ilike('content', searchTerm)
      .order('created_at', { ascending: false })
      .range(0, 9)

    // Combine results
    const results = [
      ...(threads || []).map(t => ({ ...t, type: 'thread' })),
      ...(replies || []).map(r => ({ ...r, type: 'reply' })),
    ]

    return json({ results, query: q, page })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

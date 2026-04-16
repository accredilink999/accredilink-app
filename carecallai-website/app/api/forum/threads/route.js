import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

// GET: list threads (with ?category=slug&sort=newest|popular|unanswered&page=1)
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const categorySlug = searchParams.get('category')
  const authorId = searchParams.get('authorId')
  const sort = searchParams.get('sort') || 'newest'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  let query = supabase
    .from('forum_threads')
    .select('*, forum_categories!inner(slug, name), forum_profiles!forum_threads_author_id_fkey(username, display_name, avatar_url, forum_role, post_count)', { count: 'exact' })

  if (categorySlug) {
    query = query.eq('forum_categories.slug', categorySlug)
  }

  if (authorId) {
    query = query.eq('author_id', authorId)
  }

  // Pinned first, then sort
  if (sort === 'popular') {
    query = query.order('is_pinned', { ascending: false }).order('like_count', { ascending: false })
  } else if (sort === 'unanswered') {
    query = query.eq('reply_count', 0).order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
  } else {
    query = query.order('is_pinned', { ascending: false }).order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return json({ error: error.message }, 500)

  return json({ threads: data, total: count, page, totalPages: Math.ceil((count || 0) / limit) })
}

// POST: create thread
export async function POST(req) {
  try {
    const body = await req.json()
    const { token, categoryId, categorySlug, title, content, tags } = body
    if (!token || (!categoryId && !categorySlug) || !title || !content) return json({ error: 'Missing fields' }, 400)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    // Check forum profile
    const { data: fp } = await supabase.from('forum_profiles').select('is_banned, forum_role').eq('id', user.id).single()
    if (!fp) return json({ error: 'Complete forum setup first' }, 403)
    if (fp.is_banned) return json({ error: 'You are banned from the forum' }, 403)

    // Resolve category - accept slug or ID
    let catQuery = supabase.from('forum_categories').select('id, is_locked, slug')
    if (categoryId) catQuery = catQuery.eq('id', categoryId)
    else catQuery = catQuery.eq('slug', categorySlug)
    const { data: cat } = await catQuery.single()
    if (!cat) return json({ error: 'Category not found' }, 404)
    const resolvedCategoryId = cat.id
    if (cat?.is_locked && !['founder', 'admin', 'moderator'].includes(fp.forum_role)) {
      return json({ error: 'This category is locked' }, 403)
    }

    // Create slug
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) + '-' + Date.now().toString(36)

    const { data: thread, error: insertErr } = await supabase.from('forum_threads').insert({
      category_id: resolvedCategoryId,
      author_id: user.id,
      title,
      slug,
      content,
      tags: tags || [],
    }).select().single()

    if (insertErr) return json({ error: insertErr.message }, 500)

    // Update category thread count
    try {
      const { data: c } = await supabase.from('forum_categories').select('thread_count').eq('id', resolvedCategoryId).single()
      if (c) await supabase.from('forum_categories').update({ thread_count: (c.thread_count || 0) + 1 }).eq('id', resolvedCategoryId)
    } catch {}

    // Update user thread count
    try {
      const { data: p } = await supabase.from('forum_profiles').select('thread_count').eq('id', user.id).single()
      if (p) await supabase.from('forum_profiles').update({ thread_count: (p.thread_count || 0) + 1 }).eq('id', user.id)
    } catch {}

    return json({ success: true, thread, categorySlug: cat?.slug })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

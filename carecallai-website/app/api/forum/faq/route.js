import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

const FOUNDER_ID = '1f5d9e8a-ab4b-4c00-813a-8af23f79fb82'
const FAQ_CATEGORY_SLUG = 'customer-faq'

// GET: fetch the FAQ thread + approved replies
export async function GET() {
  try {
    // Find or ensure the FAQ category exists
    let { data: cat } = await supabase.from('forum_categories').select('id').eq('slug', FAQ_CATEGORY_SLUG).single()

    if (!cat) {
      // Auto-create the customer FAQ category
      const { data: newCat } = await supabase.from('forum_categories').insert({
        name: 'Customer FAQ',
        slug: FAQ_CATEGORY_SLUG,
        description: 'Frequently asked questions from potential customers',
        icon: 'help-circle',
        sort_order: 99,
        is_locked: true, // Only founder/mods can create threads here
      }).select().single()
      cat = newCat
    }

    if (!cat) return json({ thread: null, replies: [] })

    // Get the pinned FAQ thread (or the first thread in this category)
    const { data: thread } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('category_id', cat.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (!thread) return json({ thread: null, replies: [] })

    // Get approved replies (hide unapproved customer questions)
    const { data: replies } = await supabase
      .from('forum_replies')
      .select('*, forum_profiles(username, display_name, avatar_url, forum_role)')
      .eq('thread_id', thread.id)
      .order('created_at', { ascending: true })

    // Filter: show all admin/mod/founder replies, only show approved customer questions
    const filteredReplies = (replies || []).filter(r => {
      const role = r.forum_profiles?.forum_role
      if (['founder', 'admin', 'moderator'].includes(role)) return true
      // Customer questions: only show if approved (not hidden)
      return !r.is_hidden
    })

    return json({ thread, replies: filteredReplies })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: customer submits a question (no auth required)
export async function POST(req) {
  try {
    const { name, email, question, token, reply } = await req.json()

    // If token is provided, this is an admin/mod replying
    if (token && reply) {
      const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
      if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

      // Check role — only founder and moderators can reply in FAQ
      const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
      if (!fp) return json({ error: 'No forum profile' }, 403)
      const isFounderOrMod = user.id === FOUNDER_ID || fp.forum_role === 'founder' || fp.forum_role === 'moderator'
      if (!isFounderOrMod) return json({ error: 'Only the founder and moderators can reply in the Customer FAQ section.' }, 403)

      // Get FAQ thread
      const { data: cat } = await supabase.from('forum_categories').select('id').eq('slug', FAQ_CATEGORY_SLUG).single()
      if (!cat) return json({ error: 'FAQ category not found' }, 404)

      const { data: thread } = await supabase.from('forum_threads')
        .select('id')
        .eq('category_id', cat.id)
        .order('is_pinned', { ascending: false })
        .limit(1)
        .single()

      if (!thread) return json({ error: 'FAQ thread not found' }, 404)

      const { data: newReply, error: replyErr } = await supabase.from('forum_replies').insert({
        thread_id: thread.id,
        author_id: user.id,
        content: reply,
      }).select('*, forum_profiles(username, display_name, avatar_url, forum_role)').single()

      if (replyErr) return json({ error: replyErr.message }, 500)

      // Update thread reply count
      await supabase.from('forum_threads').update({
        reply_count: (await supabase.from('forum_replies').select('id', { count: 'exact' }).eq('thread_id', thread.id)).count || 0,
        last_reply_at: new Date().toISOString(),
        last_reply_by: user.id,
      }).eq('id', thread.id)

      return json({ success: true, reply: newReply })
    }

    // Public customer question submission
    if (!name || !email || !question) return json({ error: 'Name, email, and question are required' }, 400)

    // Get FAQ thread
    const { data: cat } = await supabase.from('forum_categories').select('id').eq('slug', FAQ_CATEGORY_SLUG).single()
    if (!cat) return json({ error: 'FAQ not set up yet' }, 404)

    const { data: thread } = await supabase.from('forum_threads')
      .select('id')
      .eq('category_id', cat.id)
      .order('is_pinned', { ascending: false })
      .limit(1)
      .single()

    if (!thread) return json({ error: 'FAQ thread not found' }, 404)

    // Create reply as a customer question (using founder as author, marked as customer)
    const customerContent = `**Question from ${name}** (${email}):\n\n${question}`

    const { data: newReply, error: replyErr } = await supabase.from('forum_replies').insert({
      thread_id: thread.id,
      author_id: FOUNDER_ID, // Attributed to founder account for DB FK
      content: customerContent,
      is_customer_question: true,
      is_hidden: false, // Set to true if you want moderation before display
    }).select().single()

    if (replyErr) return json({ error: replyErr.message }, 500)

    // Send notification to founder
    await supabase.from('forum_notifications').insert({
      user_id: FOUNDER_ID,
      type: 'reply',
      thread_id: thread.id,
      reply_id: newReply.id,
      message: `New customer question from ${name}: "${question.slice(0, 80)}..."`,
    })

    return json({ success: true })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

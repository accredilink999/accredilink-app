import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'


export const dynamic = 'force-dynamic'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

// GET: list reports (admin only)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const status = searchParams.get('status') || 'pending'
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
    if (!['founder', 'admin', 'moderator'].includes(fp?.forum_role)) return json({ error: 'Not authorized' }, 403)

    let query = supabase.from('forum_reports').select('*').order('created_at', { ascending: false })
    if (status !== 'all') query = query.eq('status', status)

    const { data: reports } = await query.limit(50)

    // Enrich with reporter info and content preview
    const enriched = []
    for (const r of (reports || [])) {
      const { data: reporter } = await supabase.from('forum_profiles').select('username, display_name').eq('id', r.reporter_id).single()
      let contentPreview = ''
      if (r.reply_id) {
        const { data: reply } = await supabase.from('forum_replies').select('content, thread_id').eq('id', r.reply_id).single()
        contentPreview = reply?.content?.slice(0, 200) || '[deleted]'
      } else if (r.thread_id) {
        const { data: thread } = await supabase.from('forum_threads').select('title, content').eq('id', r.thread_id).single()
        contentPreview = thread ? `${thread.title}: ${thread.content?.slice(0, 150)}` : '[deleted]'
      }
      enriched.push({ ...r, reporter_name: reporter?.display_name || reporter?.username || 'Unknown', content_preview: contentPreview })
    }

    return json({ reports: enriched })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: create report
export async function POST(req) {
  try {
    const body = await req.json()
    const { token, threadId, replyId, reason, details } = body
    if (!token || !reason) return json({ error: 'Missing fields' }, 400)
    if (!threadId && !replyId) return json({ error: 'threadId or replyId required' }, 400)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    await supabase.from('forum_reports').insert({
      reporter_id: user.id,
      thread_id: threadId || null,
      reply_id: replyId || null,
      reason,
      details: details || null,
    })

    return json({ success: true })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// PATCH: resolve report (admin)
export async function PATCH(req) {
  try {
    const body = await req.json()
    const { token, reportId, action: resolveAction } = body
    if (!token || !reportId) return json({ error: 'Missing fields' }, 400)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('forum_role').eq('id', user.id).single()
    if (!['founder', 'admin', 'moderator'].includes(fp?.forum_role)) return json({ error: 'Not authorized' }, 403)

    const { data: report } = await supabase.from('forum_reports').select('*').eq('id', reportId).single()
    if (!report) return json({ error: 'Report not found' }, 404)

    // Handle action
    if (resolveAction === 'delete-content') {
      if (report.reply_id) {
        await supabase.from('forum_replies').delete().eq('id', report.reply_id)
      } else if (report.thread_id) {
        await supabase.from('forum_threads').delete().eq('id', report.thread_id)
      }
    }

    await supabase.from('forum_reports').update({
      status: 'resolved',
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', reportId)

    return json({ success: true })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

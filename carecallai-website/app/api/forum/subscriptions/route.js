import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
function json(data, status = 200) { return NextResponse.json(data, { status }) }

// GET: check subscription status
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const threadId = searchParams.get('threadId')
    if (!token || !threadId) return json({ subscribed: false })

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ subscribed: false })

    const { data } = await supabase
      .from('forum_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('thread_id', threadId)
      .maybeSingle()

    return json({ subscribed: !!data })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: toggle subscription
export async function POST(req) {
  try {
    const body = await req.json()
    const { token, threadId } = body
    if (!token || !threadId) return json({ error: 'Missing fields' }, 400)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: existing } = await supabase
      .from('forum_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('thread_id', threadId)
      .maybeSingle()

    if (existing) {
      await supabase.from('forum_subscriptions').delete().eq('id', existing.id)
      return json({ subscribed: false })
    } else {
      await supabase.from('forum_subscriptions').insert({ user_id: user.id, thread_id: threadId })
      return json({ subscribed: true })
    }
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

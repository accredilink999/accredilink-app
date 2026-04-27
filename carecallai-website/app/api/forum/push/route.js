import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://x.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'x')
function json(data, status = 200) { return NextResponse.json(data, { status }) }

// POST: subscribe or unsubscribe push notifications
export async function POST(req) {
  try {
    const { token, action, subscription } = await req.json()
    if (!token) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    if (action === 'subscribe') {
      if (!subscription) return json({ error: 'Missing subscription' }, 400)

      const endpoint = subscription.endpoint || ''

      // Remove existing subscription for this user+endpoint, then insert fresh
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id).eq('endpoint', endpoint)

      const { error } = await supabase
        .from('push_subscriptions')
        .insert({ user_id: user.id, endpoint, subscription, updated_at: new Date().toISOString() })

      // If insert fails (endpoint column may not exist), try without it
      if (error) {
        await supabase.from('push_subscriptions').delete().eq('user_id', user.id)
        const { error: err2 } = await supabase
          .from('push_subscriptions')
          .insert({ user_id: user.id, subscription, updated_at: new Date().toISOString() })
        if (err2) return json({ error: err2.message }, 500)
      }

      return json({ success: true })
    }

    if (action === 'unsubscribe') {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)

      return json({ success: true })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// GET: check subscription status
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    if (!token) return json({ subscribed: false })

    const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    const { data: { user } } = await anonClient.auth.getUser(token)
    if (!user) return json({ subscribed: false })

    const { data } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    return json({ subscribed: data && data.length > 0 })
  } catch {
    return json({ subscribed: false })
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToUser } from '@/lib/pushNotifications'

export const dynamic = 'force-dynamic'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://x.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'x')
function json(data, status = 200) { return NextResponse.json(data, { status }) }

async function getUser(token) {
  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const { data: { user }, error } = await anonClient.auth.getUser(token)
  if (error || !user) return null
  return user
}

// GET: list conversations or messages in a conversation
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const conversationWith = searchParams.get('with')

    if (!token) return json({ error: 'Unauthorized' }, 401)
    const user = await getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    if (conversationWith) {
      // Get messages in a conversation with specific user
      const { data: otherUser } = await supabase.from('forum_profiles').select('id').eq('username', conversationWith).single()
      if (!otherUser) return json({ error: 'User not found' }, 404)

      const { data: rawMessages } = await supabase
        .from('forum_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${user.id})`)
        .is('parent_id', null)
        .order('created_at', { ascending: true })

      // Manually join sender profiles
      const senderIds = [...new Set((rawMessages || []).map(m => m.sender_id).filter(Boolean))]
      let senderMap = {}
      if (senderIds.length > 0) {
        const { data: profiles } = await supabase.from('forum_profiles').select('id, username, display_name, avatar_url, forum_role').in('id', senderIds)
        ;(profiles || []).forEach(p => { senderMap[p.id] = p })
      }
      const messages = (rawMessages || []).map(m => ({ ...m, sender: senderMap[m.sender_id] || null }))

      // Mark received messages as read
      await supabase.from('forum_messages')
        .update({ is_read: true })
        .eq('recipient_id', user.id)
        .eq('sender_id', otherUser.id)
        .eq('is_read', false)

      return json({ messages: messages || [] })
    }

    // List conversations (latest message per user)
    const { data: sent } = await supabase
      .from('forum_messages')
      .select('*')
      .eq('sender_id', user.id)
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    const { data: received } = await supabase
      .from('forum_messages')
      .select('*')
      .eq('recipient_id', user.id)
      .is('parent_id', null)
      .order('created_at', { ascending: false })

    // Manually join profiles for all participants
    const allUserIds = [...new Set([
      ...(sent || []).map(m => m.recipient_id),
      ...(received || []).map(m => m.sender_id),
    ].filter(Boolean))]
    let msgProfileMap = {}
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase.from('forum_profiles').select('id, username, display_name, avatar_url, forum_role').in('id', allUserIds)
      ;(profiles || []).forEach(p => { msgProfileMap[p.id] = p })
    }
    // Attach profiles
    ;(sent || []).forEach(m => { m.recipient = msgProfileMap[m.recipient_id] || null })
    ;(received || []).forEach(m => { m.sender = msgProfileMap[m.sender_id] || null })

    // Build conversation list
    const convos = {}
    for (const msg of [...(sent || []), ...(received || [])]) {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id
      const otherProfile = msg.sender_id === user.id ? msg.recipient : msg.sender
      if (!convos[otherId] || new Date(msg.created_at) > new Date(convos[otherId].lastMessage.created_at)) {
        convos[otherId] = {
          userId: otherId,
          profile: otherProfile,
          lastMessage: msg,
          unread: msg.recipient_id === user.id && !msg.is_read,
        }
      }
    }

    // Count unread per conversation
    for (const key of Object.keys(convos)) {
      const { count } = await supabase
        .from('forum_messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', key)
        .eq('recipient_id', user.id)
        .eq('is_read', false)
      convos[key].unreadCount = count || 0
    }

    const conversations = Object.values(convos).sort((a, b) =>
      new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at)
    )

    return json({ conversations })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

// POST: send a message
export async function POST(req) {
  try {
    const { token, recipientUsername, content, subject } = await req.json()
    if (!token || !recipientUsername || !content) return json({ error: 'Missing fields' }, 400)

    const user = await getUser(token)
    if (!user) return json({ error: 'Unauthorized' }, 401)

    const { data: fp } = await supabase.from('forum_profiles').select('is_banned').eq('id', user.id).single()
    if (!fp) return json({ error: 'No forum profile' }, 403)
    if (fp.is_banned) return json({ error: 'You are banned' }, 403)

    const { data: recipient } = await supabase.from('forum_profiles').select('id, notify_pms').eq('username', recipientUsername.toLowerCase()).single()
    if (!recipient) return json({ error: 'Recipient not found' }, 404)
    if (recipient.id === user.id) return json({ error: 'Cannot message yourself' }, 400)

    const { data: message, error: msgErr } = await supabase.from('forum_messages').insert({
      sender_id: user.id,
      recipient_id: recipient.id,
      subject: subject || null,
      content,
    }).select().single()

    if (msgErr) return json({ error: msgErr.message }, 500)

    // Create notification
    const { data: senderProfile } = await supabase.from('forum_profiles').select('username').eq('id', user.id).single()
    await supabase.from('forum_notifications').insert({
      user_id: recipient.id,
      type: 'pm',
      actor_id: user.id,
      message: `${senderProfile?.username || 'Someone'} sent you a private message`,
    })

    // Push notification for PM
    sendPushToUser(recipient.id, {
      title: 'New Message',
      body: `${senderProfile?.username || 'Someone'} sent you a private message`,
      url: `/forum/messages?with=${senderProfile?.username}`,
      tag: `pm-${message.id}`,
    }).catch(() => {})

    return json({ success: true, message })
  } catch (err) {
    return json({ error: err.message }, 500)
  }
}

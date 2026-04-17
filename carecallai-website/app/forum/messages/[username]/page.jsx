'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import UserBadge from '@/components/forum/UserBadge'
import { timeAgo } from '@/lib/forumAuth'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ConversationPage({ params }) {
  const { username } = use(params)
  const { user, profile, token, loading, logout } = useForum()
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!loading && !user) { router.push('/forum/login'); return }
    if (token) fetchMessages()
  }, [loading, user, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/forum/messages?token=${token}&with=${username}`)
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch {} finally { setLoadingMsgs(false) }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/forum/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, recipientUsername: username, content: newMessage.trim() }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages(prev => [...prev, { ...data.message, sender: { username: profile?.username, display_name: profile?.display_name, avatar_url: profile?.avatar_url, forum_role: profile?.forum_role } }])
        setNewMessage('')
      }
    } catch {} finally { setSending(false) }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen  flex flex-col">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />

      <div className="max-w-3xl mx-auto px-4 py-4 w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link href="/forum/messages" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Link>
          <h1 className="font-bold text-white">Conversation with @{username}</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 overflow-y-auto mb-4" style={{ maxHeight: 'calc(100vh - 280px)', minHeight: '300px' }}>
          {loadingMsgs ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-3 border-teal-500 border-t-transparent rounded-full"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(msg => {
                const isMine = msg.sender_id === user?.id
                const sender = msg.sender || {}
                return (
                  <div key={msg.id} className={`flex gap-3 ${isMine ? 'flex-row-reverse' : ''}`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
                      {sender.avatar_url ? (
                        <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (sender.display_name || sender.username || '?')[0].toUpperCase()
                      )}
                    </div>
                    <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMine ? 'bg-teal-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-800 rounded-bl-md'}`}>
                        {msg.content}
                      </div>
                      <p className={`text-[10px] text-slate-400 mt-1 ${isMine ? 'text-right' : ''}`}>
                        {timeAgo(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Compose */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  )
}

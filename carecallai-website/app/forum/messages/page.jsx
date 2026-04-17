'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import { timeAgo } from '@/lib/forumAuth'
import { Inbox, Mail, PenSquare, Circle } from 'lucide-react'
import Link from 'next/link'

export default function MessagesPage() {
  const { user, profile, token, loading, logout } = useForum()
  const router = useRouter()
  const [conversations, setConversations] = useState([])
  const [loadingConvos, setLoadingConvos] = useState(true)

  useEffect(() => {
    if (!loading && !user) { router.push('/forum/login'); return }
    if (token) fetchConversations()
  }, [loading, user, token])

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/forum/messages?token=${token}`)
      const data = await res.json()
      if (data.conversations) setConversations(data.conversations)
    } catch {} finally { setLoadingConvos(false) }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Inbox className="w-6 h-6 text-teal-400" />
            Messages
          </h1>
          <Link
            href="/forum/messages/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
          >
            <PenSquare className="w-4 h-4" /> New Message
          </Link>
        </div>

        {loadingConvos ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No messages yet</p>
            <p className="text-sm text-slate-400 mt-1">Start a conversation with a fellow admin</p>
            <Link href="/forum/messages/new" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-50 text-teal-700 text-sm font-medium rounded-lg hover:bg-teal-100">
              <PenSquare className="w-4 h-4" /> Compose Message
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(convo => {
              const p = convo.profile || {}
              const isUnread = convo.unreadCount > 0
              return (
                <Link key={convo.userId} href={`/forum/messages/${p.username}`}>
                  <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${isUnread ? 'bg-teal-50/50 border-teal-200' : 'bg-white border-slate-200'}`}>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
                      {p.avatar_url ? (
                        <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (p.display_name || p.username || '?')[0].toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${isUnread ? 'text-slate-900' : 'text-slate-700'}`}>
                          {p.display_name || p.username}
                        </span>
                        {isUnread && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded-full">
                            {convo.unreadCount} new
                          </span>
                        )}
                      </div>
                      <p className={`text-sm truncate mt-0.5 ${isUnread ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                        {convo.lastMessage.content?.slice(0, 80)}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {timeAgo(convo.lastMessage.created_at)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

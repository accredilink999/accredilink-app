'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import UserBadge from '@/components/forum/UserBadge'
import StarRank from '@/components/forum/StarRank'
import { timeAgo } from '@/lib/forumAuth'
import { Users, Search, MessageSquare, Heart, Mail } from 'lucide-react'
import Link from 'next/link'

export default function MembersPage() {
  const { user, profile, token, loading, logout } = useForum()
  const router = useRouter()
  const [members, setMembers] = useState([])
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!loading && !user) { router.push('/forum/login'); return }
    if (user) fetchMembers()
  }, [loading, user])

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/forum/members')
      const data = await res.json()
      if (data.members) setMembers(data.members)
    } catch {} finally { setLoadingMembers(false) }
  }

  const filtered = search
    ? members.filter(m =>
        (m.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.username || '').toLowerCase().includes(search.toLowerCase())
      )
    : members

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-400" />
            Members ({members.length})
          </h1>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-9 pr-4 py-2 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30"
            />
          </div>
        </div>

        {loadingMembers ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map(member => (
              <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <Link href={`/forum/profile/${member.username}`}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-sm flex-shrink-0">
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (member.display_name || member.username || '?')[0].toUpperCase()
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/forum/profile/${member.username}`} className="font-semibold text-slate-900 hover:text-teal-700 transition-colors">
                        {member.display_name || member.username}
                      </Link>
                      <UserBadge username={member.username} role={member.forum_role} showName={false} showStars={false} linkToProfile={false} size="xs" />
                    </div>
                    <p className="text-xs text-slate-500">@{member.username}</p>
                    <StarRank role={member.forum_role} postCount={member.post_count || 0} />
                    {member.bio && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{member.bio}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <MessageSquare className="w-3 h-3" /> {member.thread_count || 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Heart className="w-3 h-3" /> {member.reputation || 0}
                      </span>
                      <span className="text-xs text-slate-400">
                        Joined {timeAgo(member.created_at)}
                      </span>
                    </div>
                  </div>
                  {user?.id !== member.id && (
                    <Link
                      href={`/forum/messages/new?to=${member.username}`}
                      className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex-shrink-0"
                      title="Send message"
                    >
                      <Mail className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-white/[0.06] rounded-2xl border border-white/10">
                <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No members found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

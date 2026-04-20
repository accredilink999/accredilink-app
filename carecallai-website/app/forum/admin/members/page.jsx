'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import StarRank from '@/components/forum/StarRank'
import { canModerate, isFounder as isFounderFn, timeAgo, getRoleBadge } from '@/lib/forumAuth'
import { Users, Search, MessageSquare, Heart, Mail, Shield, Trash2, Ban, ChevronDown, AlertTriangle, UserCheck, MoreVertical, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminMembers() {
  const { user, profile, token } = useForum()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const isFounder = profile?.forum_role === 'founder' || isFounderFn(user?.id)
  const isAdmin = isFounder || profile?.forum_role === 'admin'

  useEffect(() => {
    if (token) fetchMembers()
  }, [token])

  const fetchMembers = async () => {
    try {
      const url = token ? `/api/forum/members?token=${token}` : '/api/forum/members'
      const res = await fetch(url)
      const data = await res.json()
      if (data.members) setMembers(data.members)
    } catch {} finally { setLoading(false) }
  }

  const handleAction = async (action, memberId, extra = {}) => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action, userId: memberId, ...extra }),
      })
      const data = await res.json()
      if (data.error) alert(data.error)
      else { setSelectedMember(null); fetchMembers() }
    } catch { alert('Action failed') }
    finally { setActionLoading(false) }
  }

  const handleBan = (memberId) => {
    const reason = prompt('Ban reason:')
    if (!reason) return
    handleAction('ban', memberId, { reason })
  }

  const handleWarn = (memberId) => {
    const message = prompt('Warning message to send:')
    if (!message) return
    handleAction('warn', memberId, { message })
  }

  const handleDelete = (memberId, name) => {
    if (!confirm(`Permanently remove ${name} from the forum? This deletes all their posts and cannot be undone.`)) return
    handleAction('delete-member', memberId)
  }

  const filtered = search
    ? members.filter(m =>
        (m.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.username || '').toLowerCase().includes(search.toLowerCase())
      )
    : members

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          Members ({members.length})
        </h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map(member => {
          const isMe = user?.id === member.id
          const isSelected = selectedMember === member.id
          const badge = getRoleBadge(member.forum_role)
          const isBanned = member.is_banned
          const roleGradient = isBanned ? 'from-red-400 to-red-600'
            : member.forum_role === 'founder' ? 'from-amber-400 to-amber-600'
            : member.forum_role === 'admin' ? 'from-teal-400 to-teal-600'
            : member.forum_role === 'moderator' ? 'from-purple-400 to-purple-600'
            : 'from-slate-400 to-slate-500'

          return (
            <div key={member.id}>
              <div className={`bg-white/[0.06] backdrop-blur rounded-2xl border p-5 transition-all ${isSelected ? 'border-teal-500/50 bg-white/[0.1] ring-1 ring-teal-500/20' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.08]'} ${isBanned ? 'opacity-60' : ''}`}>
                <div className="flex items-start gap-4">
                  <Link href={`/forum/profile/${member.username}`}>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${roleGradient} flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-sm flex-shrink-0`}>
                      {member.avatar_url ? (
                        <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (member.display_name || member.username || '?')[0].toUpperCase()
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/forum/profile/${member.username}`} className="font-semibold text-white hover:text-teal-400 transition-colors">
                        {member.display_name || member.username}
                      </Link>
                      {badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badge.color}`}>
                          {badge.label}
                        </span>
                      )}
                      {isBanned && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-500/20 text-red-400 border border-red-500/30">
                          Banned
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">@{member.username}</p>
                    <StarRank role={member.forum_role} postCount={member.post_count || 0} />
                    {member.bio && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{member.bio}</p>}
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

                  {!isMe && (
                    <button
                      onClick={() => setSelectedMember(prev => prev === member.id ? null : member.id)}
                      className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isSelected ? 'bg-teal-500/20 text-teal-400' : 'text-slate-400 hover:text-teal-400 hover:bg-white/[0.08]'}`}
                      title="Manage member"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wider font-semibold">Manage {member.display_name || member.username}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/forum/messages/new?to=${member.username}`} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-teal-500/20 text-teal-400 rounded-lg hover:bg-teal-500/30 transition-colors font-medium">
                        <Mail className="w-3.5 h-3.5" /> Message
                      </Link>
                      {member.forum_role !== 'founder' && (
                        <button onClick={() => handleWarn(member.id)} disabled={actionLoading} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors disabled:opacity-50 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" /> Warn
                        </button>
                      )}
                      {isAdmin && member.forum_role === 'user' && (
                        <button onClick={() => handleAction('set-role', member.id, { role: 'moderator' })} disabled={actionLoading} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50 font-medium">
                          <Shield className="w-3.5 h-3.5" /> Make Moderator
                        </button>
                      )}
                      {isFounder && member.forum_role !== 'founder' && member.forum_role !== 'admin' && (
                        <button onClick={() => handleAction('set-role', member.id, { role: 'admin' })} disabled={actionLoading} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-teal-500/20 text-teal-300 rounded-lg hover:bg-teal-500/30 transition-colors disabled:opacity-50 font-medium">
                          <Shield className="w-3.5 h-3.5" /> Make Admin
                        </button>
                      )}
                      {member.forum_role !== 'user' && member.forum_role !== 'founder' && (isFounder || (isAdmin && member.forum_role === 'moderator')) && (
                        <button onClick={() => handleAction('set-role', member.id, { role: 'user' })} disabled={actionLoading} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-slate-500/20 text-slate-400 rounded-lg hover:bg-slate-500/30 transition-colors disabled:opacity-50 font-medium">
                          <ChevronDown className="w-3.5 h-3.5" /> Demote
                        </button>
                      )}
                      {member.forum_role !== 'founder' && (
                        isBanned ? (
                          <button onClick={() => handleAction('unban', member.id)} disabled={actionLoading} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 font-medium">
                            <UserCheck className="w-3.5 h-3.5" /> Unban
                          </button>
                        ) : (
                          <button onClick={() => handleBan(member.id)} disabled={actionLoading} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors disabled:opacity-50 font-medium">
                            <Ban className="w-3.5 h-3.5" /> Ban
                          </button>
                        )
                      )}
                      {isFounder && member.forum_role !== 'founder' && (
                        <button onClick={() => handleDelete(member.id, member.display_name || member.username)} disabled={actionLoading} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 font-medium">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white/[0.06] rounded-2xl border border-white/10">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No members found</p>
          </div>
        )}
      </div>
    </div>
  )
}

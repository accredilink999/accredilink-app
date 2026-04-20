'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import StarRank from '@/components/forum/StarRank'
import { isFounder as isFounderFn, getRoleBadge, timeAgo } from '@/lib/forumAuth'
import { Shield, Search, ChevronDown, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminRoles() {
  const { user, profile, token } = useForum()
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const isFounder = profile?.forum_role === 'founder' || isFounderFn(user?.id)
  const isAdmin = isFounder || profile?.forum_role === 'admin'

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/forum/admin?token=${token}`)
      const data = await res.json()
      if (!data.error) setAllUsers(data.allUsers || data.recentUsers || [])
    } catch {} finally { setLoading(false) }
  }

  const handleSetRole = async (userId, role) => {
    await fetch('/api/forum/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'set-role', userId, role }),
    })
    fetchData()
  }

  const handleBan = async (userId, ban) => {
    const reason = ban ? prompt('Ban reason:') : null
    if (ban && !reason) return
    await fetch('/api/forum/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: ban ? 'ban' : 'unban', userId, reason }),
    })
    fetchData()
  }

  const filtered = allUsers.filter(u => {
    if (!search) return true
    const q = search.toLowerCase()
    return (u.username || '').toLowerCase().includes(q) || (u.display_name || '').toLowerCase().includes(q)
  })

  const roleOrder = { founder: 0, admin: 1, moderator: 2, user: 3 }
  const sorted = [...filtered].sort((a, b) => (roleOrder[a.forum_role] || 3) - (roleOrder[b.forum_role] || 3))

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Shield className="w-5 h-5 text-teal-400" />
          <h2 className="font-semibold text-white text-lg">User Roles</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">Promote or demote users. Founder can assign admin roles. Admins can assign moderator roles.</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members..." className="w-full pl-10 pr-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
        </div>

        <div className="space-y-2">
          {sorted.map(u => {
            const badge = getRoleBadge(u.forum_role)
            const canChangeRole = isFounder && u.forum_role !== 'founder'
            const canAdminChange = isAdmin && !isFounder && u.forum_role === 'user'

            return (
              <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-white/[0.04] rounded-xl hover:bg-white/[0.06] transition-colors">
                <Link href={`/forum/profile/${u.username}`} className="flex items-center gap-3 min-w-0 flex-1 group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 group-hover:ring-2 group-hover:ring-teal-400/40 transition-all">
                    {(u.display_name || u.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors">{u.display_name || u.username}</span>
                      {badge && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badge.color}`}>{badge.label}</span>}
                      {u.is_banned && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">Banned</span>}
                      <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">@{u.username}</span>
                      <StarRank role={u.forum_role} postCount={u.post_count || 0} />
                    </div>
                    <span className="text-[10px] text-slate-500">{u.post_count || 0} posts &middot; {u.thread_count || 0} threads &middot; Joined {timeAgo(u.created_at)}</span>
                  </div>
                </Link>

                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {(canChangeRole || canAdminChange) && (
                    <div className="relative">
                      <select value={u.forum_role} onChange={(e) => handleSetRole(u.id, e.target.value)} className="appearance-none text-xs bg-white/[0.08] border border-white/20 text-white rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer">
                        <option value="user" className="bg-slate-800">User</option>
                        <option value="moderator" className="bg-slate-800">Moderator</option>
                        {isFounder && <option value="admin" className="bg-slate-800">Admin</option>}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  )}
                  {u.forum_role !== 'founder' && (
                    <button onClick={() => handleBan(u.id, !u.is_banned)} className={`text-xs px-2.5 py-2 rounded-lg font-medium transition-colors ${u.is_banned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}>
                      {u.is_banned ? 'Unban' : 'Ban'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

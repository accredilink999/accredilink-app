'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import StarRank from '@/components/forum/StarRank'
import { getRoleBadge, timeAgo } from '@/lib/forumAuth'
import { Users, MessageSquare, BarChart3, ExternalLink, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { token } = useForum()
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) fetchAdmin()
  }, [token])

  const fetchAdmin = async () => {
    try {
      const res = await fetch(`/api/forum/admin?token=${token}`)
      const data = await res.json()
      if (!data.error) setAdminData(data)
    } catch {} finally { setLoading(false) }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
      </div>
    )
  }

  if (!adminData) return null

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 text-center">
          <Users className="w-6 h-6 text-teal-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{adminData.stats?.users || 0}</p>
          <p className="text-sm text-slate-400">Members</p>
        </div>
        <div className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 text-center">
          <MessageSquare className="w-6 h-6 text-teal-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{adminData.stats?.threads || 0}</p>
          <p className="text-sm text-slate-400">Threads</p>
        </div>
        <div className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 text-center">
          <BarChart3 className="w-6 h-6 text-teal-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{adminData.stats?.replies || 0}</p>
          <p className="text-sm text-slate-400">Replies</p>
        </div>
        <div className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 text-center">
          <Users className="w-6 h-6 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{adminData.bannedUsers?.length || 0}</p>
          <p className="text-sm text-slate-400">Banned</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link href="/forum/admin/members" className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 hover:bg-white/[0.1] hover:border-teal-500/30 transition-all group">
          <Users className="w-5 h-5 text-blue-400 mb-2 group-hover:text-teal-400 transition-colors" />
          <p className="text-sm font-medium text-white">Manage Members</p>
          <p className="text-xs text-slate-500 mt-0.5">{adminData.stats?.users || 0} total</p>
        </Link>
        <Link href="/forum/admin/threads" className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 hover:bg-white/[0.1] hover:border-teal-500/30 transition-all group">
          <MessageSquare className="w-5 h-5 text-purple-400 mb-2 group-hover:text-teal-400 transition-colors" />
          <p className="text-sm font-medium text-white">Moderate Threads</p>
          <p className="text-xs text-slate-500 mt-0.5">{adminData.stats?.threads || 0} total</p>
        </Link>
        <Link href="/forum/admin/reports" className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 hover:bg-white/[0.1] hover:border-teal-500/30 transition-all group">
          <BarChart3 className="w-5 h-5 text-amber-400 mb-2 group-hover:text-teal-400 transition-colors" />
          <p className="text-sm font-medium text-white">Content Reports</p>
          <p className="text-xs text-slate-500 mt-0.5">Review flagged content</p>
        </Link>
      </div>

      {/* Recent Members */}
      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-white">Recent Members</h2>
          <Link href="/forum/admin/members" className="text-xs text-teal-400 hover:text-teal-300 font-medium">View all</Link>
        </div>
        <div className="divide-y divide-white/5">
          {(adminData.recentUsers || []).map(u => (
            <Link key={u.id} href={`/forum/profile/${u.username}`} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.06] transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 group-hover:ring-2 group-hover:ring-teal-400/40 transition-all">
                  {(u.display_name || u.username || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white group-hover:text-teal-300 transition-colors">{u.display_name || u.username}</span>
                    {getRoleBadge(u.forum_role) && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${getRoleBadge(u.forum_role).color}`}>
                        {getRoleBadge(u.forum_role).label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400">@{u.username}</span>
                    <span className="text-xs text-slate-500">&middot; {u.post_count || 0} posts &middot; {timeAgo(u.created_at)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StarRank role={u.forum_role} postCount={u.post_count || 0} />
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

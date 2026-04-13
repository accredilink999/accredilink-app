'use client'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import UserBadge from '@/components/forum/UserBadge'
import { canModerate, timeAgo } from '@/lib/forumAuth'
import { useRouter } from 'next/navigation'
import { Users, MessageSquare, BarChart3, Shield, Ban, UserCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ForumAdmin() {
  const { user, profile, token, loading, logout } = useForum()
  const router = useRouter()
  const [adminData, setAdminData] = useState(null)
  const [loadingAdmin, setLoadingAdmin] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (!loading && (!profile || !canModerate(profile.forum_role))) {
      router.push('/forum')
      return
    }
    if (token) fetchAdmin()
  }, [loading, profile, token])

  const fetchAdmin = async () => {
    try {
      const res = await fetch(`/api/forum/admin?token=${token}`)
      const data = await res.json()
      if (!data.error) setAdminData(data)
    } catch {} finally { setLoadingAdmin(false) }
  }

  const handleBan = async (userId, ban) => {
    const reason = ban ? prompt('Ban reason:') : null
    if (ban && !reason) return
    await fetch('/api/forum/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: ban ? 'ban' : 'unban', userId, reason }),
    })
    fetchAdmin()
  }

  const handleSetRole = async (userId, role) => {
    await fetch('/api/forum/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'set-role', userId, role }),
    })
    fetchAdmin()
  }

  if (loading || loadingAdmin) {
    return (
      <>
        <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
        <div className="max-w-5xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      </>
    )
  }

  if (!adminData) return null

  return (
    <>
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/forum" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to forum
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">Forum Admin</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <Users className="w-6 h-6 text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{adminData.stats.users}</p>
            <p className="text-sm text-slate-500">Members</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <MessageSquare className="w-6 h-6 text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{adminData.stats.threads}</p>
            <p className="text-sm text-slate-500">Threads</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <BarChart3 className="w-6 h-6 text-teal-600 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-900">{adminData.stats.replies}</p>
            <p className="text-sm text-slate-500">Replies</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 mb-4">
          {['overview', 'users', 'banned'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {(tab === 'overview' || tab === 'users') && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-sm text-slate-900">{tab === 'overview' ? 'Recent Members' : 'All Members'}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(adminData.recentUsers || []).map(u => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <UserBadge username={u.username} displayName={u.display_name} role={u.forum_role} size="sm" />
                    <div className="text-xs text-slate-400">
                      {u.post_count || 0} posts &middot; Joined {timeAgo(u.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {profile?.forum_role === 'founder' && u.forum_role !== 'founder' && (
                      <select
                        value={u.forum_role}
                        onChange={(e) => handleSetRole(u.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    {u.forum_role !== 'founder' && (
                      <button
                        onClick={() => handleBan(u.id, !u.is_banned)}
                        className={`text-xs px-2 py-1 rounded ${u.is_banned ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                      >
                        {u.is_banned ? 'Unban' : 'Ban'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banned tab */}
        {tab === 'banned' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="font-semibold text-sm text-slate-900">Banned Users</h2>
            </div>
            {adminData.bannedUsers.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No banned users</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {adminData.bannedUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="font-medium text-slate-900">{u.display_name || u.username}</span>
                      <p className="text-xs text-red-500 mt-0.5">Reason: {u.ban_reason}</p>
                    </div>
                    <button
                      onClick={() => handleBan(u.id, false)}
                      className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                    >
                      <UserCheck className="w-3.5 h-3.5 inline mr-1" /> Unban
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

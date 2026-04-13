'use client'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import UserBadge from '@/components/forum/UserBadge'
import StarRank from '@/components/forum/StarRank'
import { canModerate, timeAgo } from '@/lib/forumAuth'
import { useRouter } from 'next/navigation'
import { Users, MessageSquare, BarChart3, Ban, UserCheck, ArrowLeft, Mail, CheckCircle, Loader2, Send, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function ForumAdmin() {
  const { user, profile, token, loading, logout } = useForum()
  const router = useRouter()
  const [adminData, setAdminData] = useState(null)
  const [loadingAdmin, setLoadingAdmin] = useState(true)
  const [tab, setTab] = useState('overview')
  const [inviting, setInviting] = useState(null)
  const [invited, setInvited] = useState([])

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

  const handleInvite = async (email, name) => {
    setInviting(email)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'invite-to-forum', email, name }),
      })
      const data = await res.json()
      if (data.success) {
        setInvited(prev => [...prev, email])
      } else {
        alert(data.error || 'Failed to send invite')
      }
    } catch {
      alert('Failed to send invite')
    } finally {
      setInviting(null)
    }
  }

  if (loading || loadingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
        <div className="max-w-5xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!adminData) return null

  const isFounder = profile?.forum_role === 'founder'
  const allTabs = ['overview', 'users', 'banned']
  if (isFounder) allTabs.push('invite')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link href="/forum" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-teal-400 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to forum
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6">Forum Admin</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 text-center">
            <Users className="w-6 h-6 text-teal-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{adminData.stats.users}</p>
            <p className="text-sm text-slate-400">Members</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 text-center">
            <MessageSquare className="w-6 h-6 text-teal-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{adminData.stats.threads}</p>
            <p className="text-sm text-slate-400">Threads</p>
          </div>
          <div className="bg-white/[0.06] backdrop-blur rounded-xl border border-white/10 p-4 text-center">
            <BarChart3 className="w-6 h-6 text-teal-400 mx-auto mb-1" />
            <p className="text-2xl font-bold text-white">{adminData.stats.replies}</p>
            <p className="text-sm text-slate-400">Replies</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-xl p-1 border border-white/10">
          {allTabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-1 ${tab === t ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.04]'}`}
            >
              {t === 'invite' ? 'Invite Admins' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Users tab */}
        {(tab === 'overview' || tab === 'users') && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <h2 className="font-semibold text-sm text-slate-900">{tab === 'overview' ? 'Recent Members' : 'All Members'}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(adminData.recentUsers || []).map(u => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <UserBadge username={u.username} displayName={u.display_name} role={u.forum_role} postCount={u.post_count || 0} size="sm" />
                    <div className="text-xs text-slate-400">
                      {u.post_count || 0} posts &middot; Joined {timeAgo(u.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isFounder && u.forum_role !== 'founder' && (
                      <select
                        value={u.forum_role}
                        onChange={(e) => handleSetRole(u.id, e.target.value)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                    {u.forum_role !== 'founder' && (
                      <button
                        onClick={() => handleBan(u.id, !u.is_banned)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg ${u.is_banned ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
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
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
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

        {/* Invite tab - all org admins across all organizations */}
        {tab === 'invite' && isFounder && (
          <div className="space-y-4">
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-white">Invite Organisation Admins</h2>
                  <p className="text-xs text-slate-400">Send forum invite emails to admins and owners across all organisations</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="font-semibold text-sm text-slate-900">
                  Organisation Admins ({(adminData.allOrgAdmins || []).length})
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-500" /> Joined</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> Not joined</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {(adminData.allOrgAdmins || []).length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No organisation admins found</p>
                ) : (
                  (adminData.allOrgAdmins || []).map((admin, i) => (
                    <div key={admin.user_id + '-' + i} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-slate-900">{admin.full_name || 'Unnamed'}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${admin.org_role === 'owner' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                            {admin.org_role}
                          </span>
                          {admin.has_forum_profile && (
                            <span className="flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                              <CheckCircle className="w-3 h-3" /> Joined
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{admin.email}</p>
                        <p className="text-[10px] text-slate-400">{admin.org_name}</p>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        {admin.has_forum_profile ? (
                          <span className="text-xs text-green-600 font-medium px-3 py-1.5 bg-green-50 rounded-lg">
                            @{admin.forum_username}
                          </span>
                        ) : invited.includes(admin.email) ? (
                          <span className="flex items-center gap-1 text-xs text-teal-600 font-medium px-3 py-1.5 bg-teal-50 rounded-lg">
                            <CheckCircle className="w-3.5 h-3.5" /> Invited
                          </span>
                        ) : (
                          <button
                            onClick={() => handleInvite(admin.email, admin.full_name)}
                            disabled={inviting === admin.email}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
                          >
                            {inviting === admin.email ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Invite
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

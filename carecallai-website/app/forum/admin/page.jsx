'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import StarRank from '@/components/forum/StarRank'
import { canModerate, isFounder as isFounderFn, timeAgo, PERMISSION_LABELS, DEFAULT_PERMISSIONS, getRoleBadge, slugify } from '@/lib/forumAuth'
import { useRouter } from 'next/navigation'
import { Users, MessageSquare, BarChart3, Ban, UserCheck, ArrowLeft, Mail, CheckCircle, Loader2, Send, UserPlus, Shield, ChevronDown, FolderPlus, Save, Search, Flag, AlertTriangle, Trash2, Eye, Pin, Lock, Unlock, ArrowUpCircle, Edit, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function ForumAdmin() {
  const { user, profile, token, loading, logout } = useForum()
  const router = useRouter()
  const [adminData, setAdminData] = useState(null)
  const [loadingAdmin, setLoadingAdmin] = useState(true)
  const [tab, setTab] = useState('overview')
  const [inviting, setInviting] = useState(null)
  const [invited, setInvited] = useState([])
  // Permissions state
  const [permissions, setPermissions] = useState(null)
  const [permsDirty, setPermsDirty] = useState(false)
  const [savingPerms, setSavingPerms] = useState(false)
  // Roles search
  const [roleSearch, setRoleSearch] = useState('')
  // Create category
  const [newCatName, setNewCatName] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [newCatIcon, setNewCatIcon] = useState('MessageSquare')
  const [newCatColor, setNewCatColor] = useState('text-teal-500')
  const [creatingCat, setCreatingCat] = useState(false)
  // Edit category
  const [editingCat, setEditingCat] = useState(null)
  const [editCatName, setEditCatName] = useState('')
  const [editCatDesc, setEditCatDesc] = useState('')
  const [savingCat, setSavingCat] = useState(false)
  // Direct email invite
  const [directEmail, setDirectEmail] = useState('')
  const [directName, setDirectName] = useState('')
  const [directMessage, setDirectMessage] = useState('The CareCallAI Community Forum is where you can get support for the app, connect with other care professionals, share best practices, and book demos.\n\nJoin us today!')
  const [sendingDirect, setSendingDirect] = useState(false)
  const [directSent, setDirectSent] = useState([])
  const [bulkEmails, setBulkEmails] = useState('')
  const [sendingBulk, setSendingBulk] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  // Reports
  const [reports, setReports] = useState([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [reportFilter, setReportFilter] = useState('pending')

  // Thread management state
  const [threads, setThreads] = useState([])
  const [loadingThreads, setLoadingThreads] = useState(false)
  const [threadPage, setThreadPage] = useState(1)
  const [threadTotal, setThreadTotal] = useState(0)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/forum/login')
      return
    }
    // Allow founder by user ID even if profile didn't load
    if (!loading && user && !isFounderFn(user.id) && (!profile || !canModerate(profile.forum_role))) {
      router.push('/forum')
      return
    }
    if (token) fetchAdmin()
  }, [loading, user, profile, token])

  const fetchAdmin = async () => {
    try {
      const res = await fetch(`/api/forum/admin?token=${token}`)
      const data = await res.json()
      if (!data.error) {
        setAdminData(data)
        setPermissions(data.permissions || DEFAULT_PERMISSIONS)
      }
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

  const handleTogglePerm = (role, key) => {
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev[role]?.[key] }
    }))
    setPermsDirty(true)
  }

  const handleSavePerms = async () => {
    setSavingPerms(true)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'update-permissions', permissions }),
      })
      const data = await res.json()
      if (data.success) setPermsDirty(false)
      else alert(data.error || 'Failed to save')
    } catch { alert('Failed to save permissions') }
    finally { setSavingPerms(false) }
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    setCreatingCat(true)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'create-category',
          categoryData: {
            name: newCatName.trim(),
            description: newCatDesc.trim() || null,
            slug: slugify(newCatName.trim()),
            icon: newCatIcon,
            color: newCatColor,
            sort_order: (adminData?.categories?.length || 0) + 1,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        setNewCatName('')
        setNewCatDesc('')
        fetchAdmin()
      } else {
        alert(data.error || 'Failed to create category')
      }
    } catch { alert('Failed to create category') }
    finally { setCreatingCat(false) }
  }

  const handleSendDirectInvite = async () => {
    if (!directEmail.trim()) return
    setSendingDirect(true)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'send-direct-invite', email: directEmail.trim(), name: directName.trim(), message: directMessage }),
      })
      const data = await res.json()
      if (data.success) {
        setDirectSent(prev => [...prev, directEmail.trim()])
        setDirectEmail('')
        setDirectName('')
      } else alert(data.error || 'Failed to send')
    } catch { alert('Failed to send invite') }
    finally { setSendingDirect(false) }
  }

  const handleSendBulkInvite = async () => {
    const emails = bulkEmails.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
      const parts = line.split(',')
      return { email: parts[0]?.trim(), name: parts[1]?.trim() || '' }
    }).filter(e => e.email.includes('@'))
    if (!emails.length) return alert('No valid emails found')
    setSendingBulk(true)
    setBulkResult(null)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'send-bulk-invite', emails, message: directMessage }),
      })
      const data = await res.json()
      setBulkResult(data)
    } catch { alert('Failed to send') }
    finally { setSendingBulk(false) }
  }

  const fetchReports = async (status = 'pending') => {
    setLoadingReports(true)
    try {
      const res = await fetch(`/api/forum/reports?token=${token}&status=${status}`)
      const data = await res.json()
      setReports(data.reports || [])
    } catch {} finally { setLoadingReports(false) }
  }

  const handleResolveReport = async (reportId, action) => {
    try {
      await fetch('/api/forum/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reportId, action }),
      })
      fetchReports(reportFilter)
    } catch { alert('Failed to resolve report') }
  }

  const handleDeleteCategory = async (catId, catName) => {
    if (!confirm(`Delete category "${catName}"? All threads in this category will also be deleted. This cannot be undone.`)) return
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'delete-category', categoryId: catId }),
      })
      const data = await res.json()
      if (data.success) fetchAdmin()
      else alert(data.error || 'Failed to delete')
    } catch { alert('Failed to delete category') }
  }

  const fetchThreads = async (page = 1) => {
    setLoadingThreads(true)
    try {
      const res = await fetch(`/api/forum/threads?sort=newest&page=${page}&limit=20`)
      const data = await res.json()
      setThreads(data.threads || [])
      setThreadTotal(data.total || 0)
      setThreadPage(page)
    } catch {} finally { setLoadingThreads(false) }
  }

  const handleThreadAction = async (threadId, action) => {
    if (action === 'delete' && !confirm('Delete this thread and all its replies?')) return
    try {
      const res = await fetch(`/api/forum/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Action failed'); return }
      fetchThreads(threadPage)
    } catch (err) { alert('Failed: ' + err.message) }
  }

  const handleEditCategory = (cat) => {
    setEditingCat(cat.id)
    setEditCatName(cat.name)
    setEditCatDesc(cat.description || '')
  }

  const handleSaveCategory = async (catId) => {
    setSavingCat(true)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'update-category', categoryId: catId, categoryData: { name: editCatName, description: editCatDesc } }),
      })
      const data = await res.json()
      if (data.success) {
        setEditingCat(null)
        fetchAdmin()
      } else alert(data.error || 'Failed to save')
    } catch { alert('Failed to save category') }
    finally { setSavingCat(false) }
  }

  if (loading || loadingAdmin) {
    return (
      <div className="min-h-screen ">
        <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
        <div className="max-w-5xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!adminData) return null

  const isFounder = profile?.forum_role === 'founder' || isFounderFn(user?.id)
  const isAdmin = isFounder || ['admin'].includes(profile?.forum_role)
  const allTabs = ['overview', 'threads', 'roles', 'permissions', 'banned', 'categories', 'reports']
  if (isFounder) allTabs.push('invite', 'email-invite')

  const tabLabels = {
    overview: 'Overview',
    threads: 'Threads',
    roles: 'Roles',
    permissions: 'Permissions',
    banned: 'Banned',
    categories: 'Categories',
    reports: 'Reports',
    invite: 'Invite Admins',
    'email-invite': 'Email Invite',
  }

  const iconOptions = [
    'MessageSquare', 'HelpCircle', 'Bug', 'Lightbulb', 'Coffee',
    'Shield', 'BookOpen', 'Heart', 'Star', 'Zap', 'Award',
    'Megaphone', 'FileText', 'Settings', 'Users', 'Globe',
  ]

  const colorOptions = [
    { value: 'text-teal-500', label: 'Teal' },
    { value: 'text-blue-500', label: 'Blue' },
    { value: 'text-purple-500', label: 'Purple' },
    { value: 'text-amber-500', label: 'Amber' },
    { value: 'text-red-500', label: 'Red' },
    { value: 'text-green-500', label: 'Green' },
    { value: 'text-pink-500', label: 'Pink' },
    { value: 'text-orange-500', label: 'Orange' },
  ]

  // Filter users for roles tab
  const filteredUsers = (adminData.allUsers || adminData.recentUsers || []).filter(u => {
    if (!roleSearch) return true
    const q = roleSearch.toLowerCase()
    return (u.username || '').toLowerCase().includes(q) || (u.display_name || '').toLowerCase().includes(q)
  })

  // Sort: founder first, then admin, moderator, user
  const roleOrder = { founder: 0, admin: 1, moderator: 2, user: 3 }
  const sortedUsers = [...filteredUsers].sort((a, b) => (roleOrder[a.forum_role] || 3) - (roleOrder[b.forum_role] || 3))

  return (
    <div className="min-h-screen ">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <Link href="/forum" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-teal-400 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to forum
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Shield className="w-7 h-7 text-teal-400" />
          Forum Admin
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
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
        <div className="flex gap-1 mb-4 bg-white/[0.04] rounded-xl p-1 border border-white/10 overflow-x-auto">
          {allTabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${tab === t ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.04]'}`}
            >
              {tabLabels[t]}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="font-semibold text-sm text-white">Recent Members</h2>
            </div>
            <div className="divide-y divide-white/5">
              {(adminData.recentUsers || []).map(u => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(u.display_name || u.username || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{u.display_name || u.username}</span>
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
                  <StarRank role={u.forum_role} postCount={u.post_count || 0} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Threads tab */}
        {tab === 'threads' && (
          <div className="space-y-4">
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-teal-400" />
                  <h2 className="font-semibold text-white">Thread Management</h2>
                </div>
                {!threads.length && !loadingThreads && (
                  <button onClick={() => fetchThreads(1)} className="text-sm px-4 py-2 bg-teal-500/20 text-teal-300 rounded-lg hover:bg-teal-500/30 transition-colors">
                    Load Threads
                  </button>
                )}
              </div>

              {loadingThreads && (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>
              )}

              {threads.length > 0 && (
                <div className="space-y-2">
                  {threads.map(thread => (
                    <div key={thread.id} className="bg-white/[0.04] rounded-xl border border-white/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-white truncate">{thread.title}</span>
                            {thread.is_pinned && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Pinned</span>}
                            {thread.is_locked && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">Locked</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span>by {thread.forum_profiles?.display_name || thread.forum_profiles?.username || 'Unknown'}</span>
                            <span>&middot;</span>
                            <span>{thread.forum_categories?.name || 'Uncategorised'}</span>
                            <span>&middot;</span>
                            <span>{timeAgo(thread.created_at)}</span>
                            <span>&middot;</span>
                            <span>{thread.reply_count || 0} replies</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <a href={`/forum/${thread.forum_categories?.slug || 'thread'}/${thread.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors" title="View thread">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => handleThreadAction(thread.id, thread.is_pinned ? 'unpin' : 'pin')} className={`p-1.5 rounded-lg transition-colors ${thread.is_pinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'}`} title={thread.is_pinned ? 'Unpin' : 'Pin'}>
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleThreadAction(thread.id, thread.is_locked ? 'unlock' : 'lock')} className={`p-1.5 rounded-lg transition-colors ${thread.is_locked ? 'text-slate-300 bg-slate-500/10' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-500/10'}`} title={thread.is_locked ? 'Unlock' : 'Lock'}>
                            {thread.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleThreadAction(thread.id, 'bump')} className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors" title="Bump to top">
                            <ArrowUpCircle className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleThreadAction(thread.id, 'delete')} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-xs text-slate-400">{threadTotal} total threads</span>
                    <div className="flex gap-2">
                      {threadPage > 1 && (
                        <button onClick={() => fetchThreads(threadPage - 1)} className="text-xs px-3 py-1.5 bg-white/[0.06] text-slate-300 rounded-lg hover:bg-white/[0.1]">Previous</button>
                      )}
                      {threads.length === 20 && (
                        <button onClick={() => fetchThreads(threadPage + 1)} className="text-xs px-3 py-1.5 bg-white/[0.06] text-slate-300 rounded-lg hover:bg-white/[0.1]">Next</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Roles tab */}
        {tab === 'roles' && (
          <div className="space-y-4">
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-5 h-5 text-teal-400" />
                <h2 className="font-semibold text-white">User Roles</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">Promote or demote users. Founder can assign admin roles. Admins can assign moderator roles.</p>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Search members..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <div className="space-y-2">
                {sortedUsers.map(u => {
                  const badge = getRoleBadge(u.forum_role)
                  const canChangeRole = isFounder && u.forum_role !== 'founder'
                  const canAdminChange = isAdmin && !isFounder && u.forum_role === 'user'

                  return (
                    <div key={u.id} className="flex items-center justify-between px-4 py-3 bg-white/[0.04] rounded-xl hover:bg-white/[0.06] transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {(u.display_name || u.username || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-white">{u.display_name || u.username}</span>
                            {badge && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badge.color}`}>
                                {badge.label}
                              </span>
                            )}
                            {u.is_banned && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 border border-red-200">Banned</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-400">@{u.username}</span>
                            <StarRank role={u.forum_role} postCount={u.post_count || 0} />
                          </div>
                          <span className="text-[10px] text-slate-500">{u.post_count || 0} posts &middot; {u.thread_count || 0} threads &middot; Joined {timeAgo(u.created_at)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        {(canChangeRole || canAdminChange) && (
                          <div className="relative">
                            <select
                              value={u.forum_role}
                              onChange={(e) => handleSetRole(u.id, e.target.value)}
                              className="appearance-none text-xs bg-white/[0.08] border border-white/20 text-white rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/30 cursor-pointer"
                            >
                              <option value="user" className="bg-slate-800">User</option>
                              <option value="moderator" className="bg-slate-800">Moderator</option>
                              {isFounder && <option value="admin" className="bg-slate-800">Admin</option>}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                          </div>
                        )}
                        {u.forum_role !== 'founder' && (
                          <button
                            onClick={() => handleBan(u.id, !u.is_banned)}
                            className={`text-xs px-2.5 py-2 rounded-lg font-medium transition-colors ${u.is_banned ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                          >
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
        )}

        {/* Permissions tab */}
        {tab === 'permissions' && (
          <div className="space-y-4">
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-400" />
                  <h2 className="font-semibold text-white">Role Permissions</h2>
                </div>
                {isFounder && permsDirty && (
                  <button
                    onClick={handleSavePerms}
                    disabled={savingPerms}
                    className="flex items-center gap-1.5 text-xs px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {savingPerms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                )}
              </div>

              {!isFounder && (
                <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
                  <p className="text-xs text-amber-400">Only the founder can modify permissions. You can view the current settings.</p>
                </div>
              )}

              {/* Permission matrix */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Permission</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-purple-400 uppercase tracking-wider w-28">
                        <span className="flex items-center justify-center gap-1">Moderator</span>
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider w-28">
                        <span className="flex items-center justify-center gap-1">Admin</span>
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-amber-400 uppercase tracking-wider w-28">Founder</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(PERMISSION_LABELS).map(([key, { label, desc }]) => (
                      <tr key={key} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <p className="text-sm text-white font-medium">{label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                        </td>
                        <td className="text-center px-4 py-3">
                          <button
                            onClick={() => isFounder && handleTogglePerm('moderator', key)}
                            disabled={!isFounder}
                            className={`w-9 h-5 rounded-full transition-colors relative ${permissions?.moderator?.[key] ? 'bg-purple-500' : 'bg-slate-600'} ${isFounder ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${permissions?.moderator?.[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                        <td className="text-center px-4 py-3">
                          <button
                            onClick={() => isFounder && handleTogglePerm('admin', key)}
                            disabled={!isFounder}
                            className={`w-9 h-5 rounded-full transition-colors relative ${permissions?.admin?.[key] ? 'bg-teal-500' : 'bg-slate-600'} ${isFounder ? 'cursor-pointer' : 'cursor-default opacity-80'}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${permissions?.admin?.[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="w-9 h-5 rounded-full bg-amber-500 relative mx-auto">
                            <span className="absolute top-0.5 translate-x-4 w-4 h-4 rounded-full bg-white shadow" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {isFounder && (
                <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
                  <p className="text-xs text-slate-500">Founder always has all permissions (cannot be changed). Toggle switches to enable or disable permissions for moderators and admins.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories tab */}
        {tab === 'categories' && (
          <div className="space-y-4">
            {/* Create new category */}
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <FolderPlus className="w-5 h-5 text-teal-400" />
                <h2 className="font-semibold text-white">Create New Category</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Category name..."
                    className="w-full px-3 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                </div>
                <select
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  className="px-3 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon} className="bg-slate-800">{icon}</option>
                  ))}
                </select>
                <select
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  className="px-3 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                >
                  {colorOptions.map(c => (
                    <option key={c.value} value={c.value} className="bg-slate-800">{c.label}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
                placeholder="Category description (optional)..."
                className="w-full mt-3 px-3 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <button
                onClick={handleCreateCategory}
                disabled={creatingCat || !newCatName.trim()}
                className="mt-3 flex items-center gap-1.5 text-sm px-4 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {creatingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                Create Category
              </button>
            </div>

            {/* Existing categories */}
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <h2 className="font-semibold text-sm text-white">Existing Categories ({adminData.categories?.length || 0})</h2>
              </div>
              <div className="divide-y divide-white/5">
                {(adminData.categories || []).map(cat => (
                  <div key={cat.id} className="px-4 py-3 hover:bg-white/[0.03]">
                    {editingCat === cat.id ? (
                      <div className="space-y-2">
                        <input
                          value={editCatName}
                          onChange={(e) => setEditCatName(e.target.value)}
                          className="w-full px-3 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                          placeholder="Category name"
                        />
                        <input
                          value={editCatDesc}
                          onChange={(e) => setEditCatDesc(e.target.value)}
                          className="w-full px-3 py-2 bg-white/[0.06] border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                          placeholder="Description"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveCategory(cat.id)}
                            disabled={savingCat}
                            className="text-xs px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600 disabled:opacity-50"
                          >
                            {savingCat ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingCat(null)} className="text-xs px-3 py-1.5 text-slate-400 hover:text-white">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center ${cat.color || 'text-teal-400'}`}>
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{cat.name}</p>
                            <p className="text-[11px] text-slate-500">{cat.description || 'No description'} &middot; {cat.thread_count || 0} threads</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">/{cat.slug}</span>
                          <button onClick={() => handleEditCategory(cat)} className="text-xs px-2.5 py-1.5 text-teal-400 hover:text-teal-300 hover:bg-teal-500/10 rounded-lg transition-colors">
                            Edit
                          </button>
                          {isFounder && (
                            <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="text-xs px-2.5 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Banned tab */}
        {tab === 'banned' && (
          <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10">
              <h2 className="font-semibold text-sm text-white flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" /> Banned Users
              </h2>
            </div>
            {adminData.bannedUsers.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No banned users</p>
            ) : (
              <div className="divide-y divide-white/5">
                {adminData.bannedUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <span className="font-medium text-white">{u.display_name || u.username}</span>
                      <p className="text-xs text-red-400 mt-0.5">Reason: {u.ban_reason}</p>
                    </div>
                    <button
                      onClick={() => handleBan(u.id, false)}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Unban
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reports tab */}
        {tab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Flag className="w-5 h-5 text-amber-400" />
                  <h2 className="font-semibold text-white">Content Reports</h2>
                </div>
                <div className="flex gap-1">
                  {['pending', 'resolved', 'all'].map(f => (
                    <button
                      key={f}
                      onClick={() => { setReportFilter(f); fetchReports(f) }}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${reportFilter === f ? 'bg-teal-500/20 text-teal-300 font-medium' : 'text-slate-400 hover:bg-white/[0.06]'}`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {!reports.length && !loadingReports && (
                <button onClick={() => fetchReports(reportFilter)} className="w-full py-3 text-sm text-teal-400 hover:text-teal-300 font-medium">
                  Load Reports
                </button>
              )}

              {loadingReports && (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>
              )}

              {reports.length > 0 && (
                <div className="space-y-3">
                  {reports.map(report => (
                    <div key={report.id} className="bg-white/[0.04] rounded-xl border border-white/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-300">{report.reason}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${report.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
                              {report.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">Reported by: {report.reporter_name} &middot; {timeAgo(report.created_at)}</p>
                          {report.details && <p className="text-xs text-slate-300 mb-2 italic">"{report.details}"</p>}
                          {report.content_preview && (
                            <div className="text-xs text-slate-400 bg-white/[0.04] rounded-lg p-3 border border-white/5">
                              <Eye className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                              {report.content_preview}
                            </div>
                          )}
                        </div>
                        {report.status === 'pending' && (
                          <div className="flex gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleResolveReport(report.id, 'dismiss')}
                              className="text-xs px-3 py-1.5 bg-slate-500/20 text-slate-300 rounded-lg hover:bg-slate-500/30 transition-colors"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleResolveReport(report.id, 'delete-content')}
                              className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete Content
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {reports.length === 0 && !loadingReports && reportFilter === 'pending' && (
                <p className="text-center text-sm text-slate-400 py-4">No pending reports</p>
              )}
            </div>
          </div>
        )}

        {/* Email Invite tab */}
        {tab === 'email-invite' && isFounder && (
          <div className="space-y-4">
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-5 h-5 text-teal-400" />
                <div>
                  <h2 className="font-semibold text-white">Direct Email Invite</h2>
                  <p className="text-xs text-slate-400">Send an invite email to anyone — they don't need to be an existing user</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <input
                  type="email"
                  value={directEmail}
                  onChange={(e) => setDirectEmail(e.target.value)}
                  placeholder="Email address *"
                  className="px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
                <input
                  type="text"
                  value={directName}
                  onChange={(e) => setDirectName(e.target.value)}
                  placeholder="Name (optional)"
                  className="px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                />
              </div>

              <textarea
                value={directMessage}
                onChange={(e) => setDirectMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-y mb-3"
                placeholder="Custom message..."
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendDirectInvite}
                  disabled={sendingDirect || !directEmail.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {sendingDirect ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Invite
                </button>
                {directSent.length > 0 && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {directSent.length} sent
                  </span>
                )}
              </div>
            </div>

            {/* Bulk invite */}
            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-5 h-5 text-teal-400" />
                <div>
                  <h2 className="font-semibold text-white">Bulk Email Invite</h2>
                  <p className="text-xs text-slate-400">One email per line. Format: email, name (name is optional)</p>
                </div>
              </div>

              <textarea
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-y font-mono mb-3"
                placeholder={"john@example.com, John Smith\njane@example.com, Jane Doe\nuser@company.com"}
              />

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSendBulkInvite}
                  disabled={sendingBulk || !bulkEmails.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {sendingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send All
                </button>
                {bulkResult && (
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> {bulkResult.sent || 0} sent, {bulkResult.failed || 0} failed
                  </span>
                )}
              </div>
            </div>

            {/* Sent history */}
            {directSent.length > 0 && (
              <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-2">Recently Sent</h3>
                <div className="space-y-1">
                  {directSent.map((email, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle className="w-3 h-3 text-green-400" /> {email}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Invite tab */}
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

            <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <h2 className="font-semibold text-sm text-white">
                  Organisation Admins ({(adminData.allOrgAdmins || []).length})
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Joined</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> Not joined</span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {(adminData.allOrgAdmins || []).length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-slate-400">No organisation admins found</p>
                ) : (
                  (adminData.allOrgAdmins || []).map((admin, i) => (
                    <div key={admin.user_id + '-' + i} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03]">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-white">{admin.full_name || 'Unnamed'}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${admin.org_role === 'owner' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-teal-500/20 text-teal-400 border-teal-500/30'}`}>
                            {admin.org_role}
                          </span>
                          {admin.has_forum_profile && (
                            <span className="flex items-center gap-0.5 text-[10px] text-green-400 font-medium">
                              <CheckCircle className="w-3 h-3" /> Joined
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{admin.email}</p>
                        <p className="text-[10px] text-slate-500">{admin.org_name}</p>
                      </div>
                      <div className="flex-shrink-0 ml-3">
                        {admin.has_forum_profile ? (
                          <span className="text-xs text-green-400 font-medium px-3 py-1.5 bg-green-500/20 rounded-lg">
                            @{admin.forum_username}
                          </span>
                        ) : invited.includes(admin.email) ? (
                          <span className="flex items-center gap-1 text-xs text-teal-400 font-medium px-3 py-1.5 bg-teal-500/20 rounded-lg">
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

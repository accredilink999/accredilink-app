'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import { isFounder as isFounderFn } from '@/lib/forumAuth'
import { useRouter } from 'next/navigation'
import { Mail, Users, UserPlus, Send, CheckCircle, Loader2, Zap } from 'lucide-react'

export default function AdminInvites() {
  const { user, profile, token } = useForum()
  const router = useRouter()
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(null)
  const [sessionInvited, setSessionInvited] = useState([])
  // Direct email
  const [directEmail, setDirectEmail] = useState('')
  const [directName, setDirectName] = useState('')
  const [sendingDirect, setSendingDirect] = useState(false)
  const [directSent, setDirectSent] = useState([])
  // Bulk
  const [bulkEmails, setBulkEmails] = useState('')
  const [sendingBulk, setSendingBulk] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  // Invite All
  const [sendingAll, setSendingAll] = useState(false)
  const [inviteAllResult, setInviteAllResult] = useState(null)

  const isFounder = profile?.forum_role === 'founder' || isFounderFn(user?.id)

  useEffect(() => {
    if (!isFounder && !loading) { router.push('/forum/admin'); return }
    if (token) fetchData()
  }, [token, isFounder, loading])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/forum/admin?token=${token}`)
      const data = await res.json()
      if (!data.error) setAdminData(data)
    } catch {} finally { setLoading(false) }
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
      if (data.success) setSessionInvited(prev => [...prev, email])
      else alert(data.error || 'Failed to send invite')
    } catch { alert('Failed to send invite') }
    finally { setInviting(null) }
  }

  const handleSendDirect = async () => {
    if (!directEmail.trim()) return
    setSendingDirect(true)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'send-direct-invite', email: directEmail.trim(), name: directName.trim() }),
      })
      const data = await res.json()
      if (data.success) { setDirectSent(prev => [...prev, directEmail.trim()]); setDirectEmail(''); setDirectName('') }
      else alert(data.error || 'Failed to send')
    } catch { alert('Failed to send invite') }
    finally { setSendingDirect(false) }
  }

  const handleSendBulk = async () => {
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
        body: JSON.stringify({ token, action: 'send-bulk-invite', emails }),
      })
      const data = await res.json()
      setBulkResult(data)
    } catch { alert('Failed to send') }
    finally { setSendingBulk(false) }
  }

  const handleInviteAll = async () => {
    if (!confirm('Send forum invite emails to all uninvited organisation admins?')) return
    setSendingAll(true)
    setInviteAllResult(null)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'send-forum-invite-all' }),
      })
      const data = await res.json()
      setInviteAllResult(data)
      if (data.success) fetchData() // refresh to update statuses
    } catch { alert('Failed to send invites') }
    finally { setSendingAll(false) }
  }

  // Derived counts
  const orgAdmins = adminData?.allOrgAdmins || []
  const joinedCount = orgAdmins.filter(a => a.has_forum_profile).length
  const invitedCount = orgAdmins.filter(a => !a.has_forum_profile && (a.was_invited || sessionInvited.includes(a.email))).length
  const uninvitedCount = orgAdmins.filter(a => !a.has_forum_profile && !a.was_invited && !sessionInvited.includes(a.email)).length

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
  }

  if (!isFounder) return null

  return (
    <div className="space-y-4">
      {/* Invite All Uninvited — top banner */}
      {orgAdmins.length > 0 && (
        <div className="bg-gradient-to-r from-teal-500/10 to-cyan-500/10 backdrop-blur rounded-2xl border border-teal-500/20 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold text-white text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-400" /> Invite All Organisation Admins
              </h2>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {joinedCount} joined</span>
                <span className="text-teal-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {invitedCount} invited</span>
                <span className="text-slate-400 flex items-center gap-1"><UserPlus className="w-3 h-3" /> {uninvitedCount} not invited</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {inviteAllResult && (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {inviteAllResult.sent || 0} sent{inviteAllResult.failed ? `, ${inviteAllResult.failed} failed` : ''}
                </span>
              )}
              <button
                onClick={handleInviteAll}
                disabled={sendingAll || uninvitedCount === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/20"
              >
                {sendingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sendingAll ? 'Sending...' : uninvitedCount === 0 ? 'All Invited' : `Invite ${uninvitedCount} Uninvited`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Email Invite */}
      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-teal-400" />
          <div>
            <h2 className="font-semibold text-white text-lg">Direct Email Invite</h2>
            <p className="text-xs text-slate-400">Send an invite email to anyone — they don't need to be an existing user</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input type="email" value={directEmail} onChange={(e) => setDirectEmail(e.target.value)} placeholder="Email address *" className="px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
          <input type="text" value={directName} onChange={(e) => setDirectName(e.target.value)} placeholder="Name (optional)" className="px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSendDirect} disabled={sendingDirect || !directEmail.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm">
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

      {/* Bulk Email Invite */}
      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-teal-400" />
          <div>
            <h2 className="font-semibold text-white">Bulk Email Invite</h2>
            <p className="text-xs text-slate-400">One email per line. Format: email, name (name is optional)</p>
          </div>
        </div>
        <textarea value={bulkEmails} onChange={(e) => setBulkEmails(e.target.value)} rows={6} className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-y font-mono mb-3" placeholder={"john@example.com, John Smith\njane@example.com, Jane Doe\nuser@company.com"} />
        <div className="flex items-center gap-3">
          <button onClick={handleSendBulk} disabled={sendingBulk || !bulkEmails.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm">
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

      {/* Org Admins List with Status */}
      {orgAdmins.length > 0 && (
        <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-400" />
              <h2 className="font-semibold text-white">Organisation Admins ({orgAdmins.length})</h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400" /> Joined</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400" /> Invited</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500" /> Not invited</span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {orgAdmins.map((admin, i) => {
              const isJoined = admin.has_forum_profile
              const isInvited = !isJoined && (admin.was_invited || sessionInvited.includes(admin.email))

              return (
                <div key={admin.user_id + '-' + i} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.03]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-white">{admin.full_name || 'Unnamed'}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${admin.org_role === 'owner' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-teal-500/20 text-teal-400 border-teal-500/30'}`}>
                        {admin.org_role}
                      </span>
                      {isJoined && (
                        <span className="flex items-center gap-0.5 text-[10px] text-green-400 font-medium">
                          <CheckCircle className="w-3 h-3" /> Joined
                        </span>
                      )}
                      {isInvited && (
                        <span className="flex items-center gap-0.5 text-[10px] text-teal-400 font-medium">
                          <Mail className="w-3 h-3" /> Invited
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{admin.email}</p>
                    <p className="text-[10px] text-slate-500">{admin.org_name}</p>
                  </div>
                  <div className="flex-shrink-0 ml-3 flex items-center gap-2">
                    {isJoined && (
                      <span className="text-xs text-green-400 font-medium px-3 py-1.5 bg-green-500/20 rounded-lg">@{admin.forum_username}</span>
                    )}
                    {sessionInvited.includes(admin.email) || (isInvited && !isJoined) ? (
                      <span className="flex items-center gap-1 text-xs text-teal-400 font-medium px-3 py-1.5 bg-teal-500/20 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" /> Invite Sent
                      </span>
                    ) : (
                      <button onClick={() => handleInvite(admin.email, admin.full_name)} disabled={inviting === admin.email} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm">
                        {inviting === admin.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {isJoined ? 'Send Email' : 'Invite'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sent history */}
      {directSent.length > 0 && (
        <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-4">
          <h3 className="text-sm font-medium text-slate-300 mb-2">Recently Sent This Session</h3>
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
  )
}

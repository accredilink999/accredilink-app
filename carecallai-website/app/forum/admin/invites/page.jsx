'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import { isFounder as isFounderFn } from '@/lib/forumAuth'
import { useRouter } from 'next/navigation'
import { Mail, Users, UserPlus, Send, CheckCircle, Loader2 } from 'lucide-react'

export default function AdminInvites() {
  const { user, profile, token } = useForum()
  const router = useRouter()
  const [adminData, setAdminData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(null)
  const [invited, setInvited] = useState([])
  // Direct email
  const [directEmail, setDirectEmail] = useState('')
  const [directName, setDirectName] = useState('')
  const [directMessage, setDirectMessage] = useState('The CareCallAI Community Forum is where you can get support for the app, connect with other care professionals, share best practices, and book demos.\n\nJoin us today!')
  const [sendingDirect, setSendingDirect] = useState(false)
  const [directSent, setDirectSent] = useState([])
  // Bulk
  const [bulkEmails, setBulkEmails] = useState('')
  const [sendingBulk, setSendingBulk] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)

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
      if (data.success) setInvited(prev => [...prev, email])
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
        body: JSON.stringify({ token, action: 'send-direct-invite', email: directEmail.trim(), name: directName.trim(), message: directMessage }),
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
        body: JSON.stringify({ token, action: 'send-bulk-invite', emails, message: directMessage }),
      })
      const data = await res.json()
      setBulkResult(data)
    } catch { alert('Failed to send') }
    finally { setSendingBulk(false) }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
  }

  if (!isFounder) return null

  return (
    <div className="space-y-4">
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
        <textarea value={directMessage} onChange={(e) => setDirectMessage(e.target.value)} rows={4} className="w-full px-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-y mb-3" placeholder="Custom message..." />
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

      {/* Invite Org Admins */}
      {adminData?.allOrgAdmins && (
        <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-400" />
              <h2 className="font-semibold text-white">Organisation Admins ({adminData.allOrgAdmins.length})</h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Joined</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-500" /> Not joined</span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {adminData.allOrgAdmins.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">No organisation admins found</p>
            ) : (
              adminData.allOrgAdmins.map((admin, i) => (
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
                      <span className="text-xs text-green-400 font-medium px-3 py-1.5 bg-green-500/20 rounded-lg">@{admin.forum_username}</span>
                    ) : invited.includes(admin.email) ? (
                      <span className="flex items-center gap-1 text-xs text-teal-400 font-medium px-3 py-1.5 bg-teal-500/20 rounded-lg">
                        <CheckCircle className="w-3.5 h-3.5" /> Invited
                      </span>
                    ) : (
                      <button onClick={() => handleInvite(admin.email, admin.full_name)} disabled={inviting === admin.email} className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm">
                        {inviting === admin.email ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Invite
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
  )
}

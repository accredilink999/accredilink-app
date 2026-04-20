'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import { Ban, UserCheck, Loader2 } from 'lucide-react'

export default function AdminBanned() {
  const { token } = useForum()
  const [bannedUsers, setBannedUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/forum/admin?token=${token}`)
      const data = await res.json()
      if (!data.error) setBannedUsers(data.bannedUsers || [])
    } catch {} finally { setLoading(false) }
  }

  const handleUnban = async (userId) => {
    await fetch('/api/forum/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'unban', userId }),
    })
    fetchData()
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
  }

  return (
    <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <h2 className="font-semibold text-lg text-white flex items-center gap-2">
          <Ban className="w-5 h-5 text-red-400" /> Banned Users ({bannedUsers.length})
        </h2>
      </div>
      {bannedUsers.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-400">No banned users</p>
      ) : (
        <div className="divide-y divide-white/5">
          {bannedUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="font-medium text-white">{u.display_name || u.username}</span>
                <p className="text-xs text-slate-400 mt-0.5">@{u.username}</p>
                <p className="text-xs text-red-400 mt-0.5">Reason: {u.ban_reason || 'No reason given'}</p>
              </div>
              <button onClick={() => handleUnban(u.id)} className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                <UserCheck className="w-3.5 h-3.5" /> Unban
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

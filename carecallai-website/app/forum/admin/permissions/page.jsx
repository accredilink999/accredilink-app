'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import { isFounder as isFounderFn, PERMISSION_LABELS, DEFAULT_PERMISSIONS } from '@/lib/forumAuth'
import { Shield, Save, Loader2 } from 'lucide-react'

export default function AdminPermissions() {
  const { user, profile, token } = useForum()
  const [permissions, setPermissions] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const isFounder = profile?.forum_role === 'founder' || isFounderFn(user?.id)

  useEffect(() => {
    if (token) fetchData()
  }, [token])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/forum/admin?token=${token}`)
      const data = await res.json()
      if (!data.error) setPermissions(data.permissions || DEFAULT_PERMISSIONS)
    } catch {} finally { setLoading(false) }
  }

  const handleToggle = (role, key) => {
    setPermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev[role]?.[key] }
    }))
    setDirty(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/forum/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'update-permissions', permissions }),
      })
      const data = await res.json()
      if (data.success) setDirty(false)
      else alert(data.error || 'Failed to save')
    } catch { alert('Failed to save permissions') }
    finally { setSaving(false) }
  }

  if (loading || !permissions) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-400" />
            <h2 className="font-semibold text-white text-lg">Role Permissions</h2>
          </div>
          {isFounder && dirty && (
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 text-xs px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Changes
            </button>
          )}
        </div>

        {!isFounder && (
          <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
            <p className="text-xs text-amber-400">Only the founder can modify permissions. You can view the current settings.</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider">Permission</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-purple-400 uppercase tracking-wider w-28">Moderator</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-teal-400 uppercase tracking-wider w-28">Admin</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-amber-400 uppercase tracking-wider w-28">Founder</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(PERMISSION_LABELS).map(([key, { label, desc }]) => (
                <tr key={key} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-medium">{label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{desc}</p>
                  </td>
                  <td className="text-center px-4 py-3">
                    <button onClick={() => isFounder && handleToggle('moderator', key)} disabled={!isFounder} className={`w-9 h-5 rounded-full transition-colors relative ${permissions?.moderator?.[key] ? 'bg-purple-500' : 'bg-slate-600'} ${isFounder ? 'cursor-pointer' : 'cursor-default opacity-80'}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${permissions?.moderator?.[key] ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </td>
                  <td className="text-center px-4 py-3">
                    <button onClick={() => isFounder && handleToggle('admin', key)} disabled={!isFounder} className={`w-9 h-5 rounded-full transition-colors relative ${permissions?.admin?.[key] ? 'bg-teal-500' : 'bg-slate-600'} ${isFounder ? 'cursor-pointer' : 'cursor-default opacity-80'}`}>
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
            <p className="text-xs text-slate-400">Founder always has all permissions (cannot be changed). Toggle switches to enable or disable permissions for moderators and admins.</p>
          </div>
        )}
      </div>
    </div>
  )
}

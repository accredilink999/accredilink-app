'use client'
import { useState } from 'react'
import { useForum } from '@/lib/forumContext'
import { User, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function UsernameSetupModal() {
  const { token, user, refreshProfile, setNeedsSetup } = useForum()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [stayLoggedIn, setStayLoggedIn] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (cleanUsername.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    setError('')
    setSaving(true)
    try {
      const res = await fetch('/api/forum/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup-profile',
          token,
          username: cleanUsername,
          displayName: displayName.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }

      // Save stay-logged-in preference
      try {
        if (stayLoggedIn) {
          localStorage.setItem('forum-remember', '1')
        } else {
          localStorage.removeItem('forum-remember')
        }
      } catch {}

      setNeedsSetup(false)
      await refreshProfile()
    } catch {
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Welcome to the Forum!</h2>
          <p className="text-sm text-slate-400 mt-1">
            Choose a username to get started. This is how other members will see you.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username *</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. jane-smith"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-colors"
            />
            {cleanUsername && (
              <p className="text-xs text-slate-500 mt-1">
                Your username will be: <span className="text-teal-400">@{cleanUsername}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Display Name <span className="text-slate-500">(optional)</span></label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name as shown to others"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-colors"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500/50"
            />
            <span className="text-sm text-slate-400">Stay logged in</span>
          </label>

          <button
            type="submit"
            disabled={saving || cleanUsername.length < 3}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/20"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Join the Forum'}
          </button>

          <p className="text-[11px] text-slate-500 text-center">
            Your identity is protected until you choose a username. You can change it later in settings.
          </p>
        </form>
      </div>
    </div>
  )
}

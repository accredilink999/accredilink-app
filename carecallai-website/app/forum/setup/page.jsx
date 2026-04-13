'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import { UserPlus, AlertCircle, Check } from 'lucide-react'

export default function ForumSetup() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { token, refreshProfile } = useForum()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!acceptedTerms) { setError('You must accept the terms'); return }
    if (!username.trim()) { setError('Username is required'); return }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) { setError('Username can only contain letters, numbers, _ and -'); return }

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/forum/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setup-profile',
          token,
          username: username.trim().toLowerCase(),
          displayName: displayName.trim() || username.trim(),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await refreshProfile()
      router.push('/forum')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">CC</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Set Up Your Profile</h1>
          <p className="text-slate-500 mt-2">Choose a username for the community forum</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. john_doe"
                maxLength={30}
              />
              <p className="text-xs text-slate-400 mt-1">Letters, numbers, _ and - only. Minimum 3 characters.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. John Doe"
                maxLength={50}
              />
              <p className="text-xs text-slate-400 mt-1">How your name appears on posts (optional)</p>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <label htmlFor="terms" className="text-sm text-slate-600">
                I agree to the forum rules: be respectful, no spam, no sharing confidential client information, and follow CareCall AI&apos;s terms of service.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !acceptedTerms}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'Creating...' : 'Create Profile'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

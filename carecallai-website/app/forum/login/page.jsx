'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import { LogIn, AlertCircle, ShieldAlert } from 'lucide-react'

export default function ForumLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isAccessDenied, setIsAccessDenied] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useForum()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsAccessDenied(false)
    setLoading(true)
    try {
      await login(email, password)
      router.push('/forum')
    } catch (err) {
      const msg = err.message || 'Invalid email or password'
      if (msg.toLowerCase().includes('only available to') || msg.toLowerCase().includes('administrator')) {
        setIsAccessDenied(true)
      }
      setError(msg)
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
          <h1 className="text-2xl font-bold text-slate-900">CareCall AI Support Forum</h1>
          <p className="text-slate-500 mt-2">Sign in with your CareCall AI admin account</p>
        </div>

        {/* Admin-only notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Organisation Admins Only</p>
              <p className="text-xs text-amber-700 mt-1">
                This forum is exclusively for CareCall AI organisation administrators and owners.
                Regular staff accounts do not have access. If you believe you should have access,
                please ask your organisation admin to upgrade your role.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {error && (
            <div className={`flex items-start gap-2 p-3 mb-4 rounded-lg text-sm ${isAccessDenied ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-red-50 text-red-700'}`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {isAccessDenied && (
                  <p className="text-xs mt-1 text-red-600">
                    Only organisation admins and owners can access the forum. Contact your organisation administrator if you need access.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="Your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Use the same email and password from your CareCall AI app.
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-sm text-teal-600 hover:text-teal-700">Back to CareCall AI</a>
        </div>
      </div>
    </div>
  )
}

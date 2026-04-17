'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import { LogIn, AlertCircle, ShieldAlert, Loader2, MessageSquare, Users, Shield } from 'lucide-react'

export default function ForumLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isAccessDenied, setIsAccessDenied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoLogging, setAutoLogging] = useState(true)
  const router = useRouter()
  const { user, profile, loading: contextLoading, login } = useForum()

  useEffect(() => {
    if (!contextLoading && user && profile) {
      router.push('/forum')
      return
    }
    if (!contextLoading) {
      setAutoLogging(false)
      try {
        const saved = localStorage.getItem('forum-saved-email')
        if (saved) setEmail(saved)
      } catch {}
    }
  }, [contextLoading, user, profile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsAccessDenied(false)
    setLoading(true)
    try {
      await login(email, password, rememberMe)
      try {
        if (rememberMe) {
          localStorage.setItem('forum-saved-email', email)
        } else {
          localStorage.removeItem('forum-saved-email')
        }
      } catch {}
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

  if (autoLogging) {
    return (
      <div className="min-h-screen  flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Checking login status...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen  flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-teal-500/30 mx-auto">
              <img src="/logo-icon.png" alt="CareCall AI" className="w-16 h-16 rounded-xl" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-500 rounded-lg flex items-center justify-center shadow-lg">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">
            CareCall<span className="text-teal-400">AI</span> <span className="text-slate-300 font-normal">Forum</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xs mx-auto">
            The exclusive community hub for care sector administrators
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex items-center justify-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-full">
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs text-slate-300">Peer Support</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-full">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs text-slate-300">CIW & CQC Compliance</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 backdrop-blur border border-slate-700/50 rounded-full">
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs text-slate-300">Best Practices</span>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-white/[0.07] backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
          {/* Admin-only notice */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-5">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200/90 leading-relaxed">
                <span className="font-semibold text-amber-300">Admin access only.</span> This forum is exclusively for organisation administrators and owners. Regular staff accounts cannot access the forum.
              </p>
            </div>
          </div>

          {error && (
            <div className={`flex items-start gap-2 p-3 mb-4 rounded-xl text-sm ${isAccessDenied ? 'bg-red-500/15 border border-red-500/20 text-red-300' : 'bg-red-500/10 text-red-300'}`}>
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {isAccessDenied && (
                  <p className="text-xs mt-1 text-red-400/80">
                    Contact your organisation administrator to get your role upgraded.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-colors"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-colors"
                placeholder="Your password"
              />
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500/50"
              />
              <span className="text-sm text-slate-400">Stay logged in</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-teal-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Signing in...' : 'Sign In to Forum'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-white/5 text-center">
            <p className="text-xs text-slate-500">
              Use the same credentials from your CareCall AI app
            </p>
          </div>
        </div>

        <div className="text-center mt-5 space-y-2">
          <div>
            <a href="/forum/faq" className="text-sm text-amber-400 hover:text-amber-300 transition-colors font-medium">
              Not an admin? View our Customer FAQ
            </a>
          </div>
          <div>
            <a href="/" className="text-sm text-teal-400 hover:text-teal-300 transition-colors">Back to CareCall AI</a>
          </div>
        </div>
      </div>
    </div>
  )
}

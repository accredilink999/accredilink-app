import { useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { initOrg } from '@/lib/orgContext'
import { Building2, ArrowRight, Loader2, KeyRound, LogOut } from 'lucide-react'

export default function OrgSetup({ onComplete }) {
  const [mode, setMode] = useState('create') // 'create' = new org (default for signups), 'join' = invite code
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [foundOrg, setFoundOrg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const isDark = document.documentElement.classList.contains('dark')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const generateSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length))
    return code
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const slug = generateSlug(name.trim())
      const inviteCodeVal = generateInviteCode()

      const { data: orgId, error: orgErr } = await supabase
        .rpc('create_organization_for_user', {
          org_name: name.trim(),
          org_slug: slug,
          org_invite_code: inviteCodeVal,
        })

      if (orgErr) throw orgErr
      await initOrg()
      onComplete?.()
    } catch (err) {
      setError(err.message || 'Failed to create organisation')
    } finally {
      setLoading(false)
    }
  }

  const handleLookupCode = async () => {
    if (!inviteCode.trim()) return
    setLoading(true)
    setError(null)
    setFoundOrg(null)

    try {
      const { data, error: rpcErr } = await supabase
        .rpc('find_org_by_invite_code', { code: inviteCode.trim().toUpperCase() })

      if (rpcErr) throw rpcErr
      if (!data || data.length === 0) {
        setError('Invalid invite code. Please check with your manager.')
        return
      }

      setFoundOrg(data[0])
    } catch (err) {
      setError(err.message || 'Failed to look up invite code')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!foundOrg) return
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: memErr } = await supabase
        .from('organization_members')
        .insert({ organization_id: foundOrg.id, user_id: user.id, role: 'member' })

      if (memErr) {
        if (memErr.code === '23505') {
          // Already a member — that's fine
        } else {
          throw memErr
        }
      }

      await supabase.from('users').update({ organization_id: foundOrg.id }).eq('id', user.id)
      await initOrg()
      onComplete?.()
    } catch (err) {
      setError(err.message || 'Failed to join organisation')
    } finally {
      setLoading(false)
    }
  }

  // Join with invite code
  if (mode === 'join') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white mb-4">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Join Your Team</h1>
            <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Enter the invite code your manager gave you.
            </p>
          </div>

          <div className={`rounded-xl shadow-sm border p-6 space-y-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setFoundOrg(null); setError(null) }}
                placeholder="e.g. A1B2C3D4"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-center text-lg tracking-widest font-mono uppercase ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'border-slate-300'}`}
                maxLength={12}
                autoFocus
              />
            </div>

            {error && (
              <p className={`text-sm px-3 py-2 rounded-lg ${isDark ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-50'}`}>{error}</p>
            )}

            {foundOrg && (
              <div className={`border rounded-lg p-3 ${isDark ? 'bg-teal-900/30 border-teal-700' : 'bg-teal-50 border-teal-200'}`}>
                <p className={`text-sm font-medium ${isDark ? 'text-teal-400' : 'text-teal-800'}`}>Organisation found:</p>
                <p className={`text-lg font-bold ${isDark ? 'text-teal-300' : 'text-teal-900'}`}>{foundOrg.name}</p>
              </div>
            )}

            {!foundOrg ? (
              <button
                onClick={handleLookupCode}
                disabled={loading || !inviteCode.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Look Up Code'}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    Join {foundOrg.name}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => { setMode('create'); setError(null); setFoundOrg(null); setInviteCode('') }}
              className={`w-full text-sm ${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
            >
              &larr; Create a new organisation instead
            </button>

            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center gap-2 text-sm pt-2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Create new org
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Your Organisation</h1>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Set up your care company on CareCall AI.
          </p>
        </div>

        <form onSubmit={handleCreate} className={`rounded-xl shadow-sm border p-6 space-y-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              Organisation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunrise Domiciliary Care"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'border-slate-300'}`}
              required
              autoFocus
            />
            {name.trim() && (
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                URL: carecall.ai/{generateSlug(name.trim())}
              </p>
            )}
          </div>

          {error && (
            <p className={`text-sm px-3 py-2 rounded-lg ${isDark ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-50'}`}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            30-day free trial. No credit card required.
          </p>

          <p className={`text-xs text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Have an invite code from your manager?{' '}
            <button
              type="button"
              onClick={() => { setMode('join'); setError(null) }}
              className="text-teal-600 font-medium hover:underline"
            >
              Join your team
            </button>
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 text-sm pt-2 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}

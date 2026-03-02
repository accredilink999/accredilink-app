import { useState } from 'react'
import { supabase } from '@/api/supabaseClient'
import { initOrg } from '@/lib/orgContext'
import { Building2, ArrowRight, Loader2, KeyRound } from 'lucide-react'

export default function OrgSetup({ onComplete }) {
  const [mode, setMode] = useState('create') // 'create' = new org (default for signups), 'join' = invite code
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [foundOrg, setFoundOrg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generateSlug = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const slug = generateSlug(name.trim())

      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert({ name: name.trim(), slug, plan: 'trial' })
        .select()
        .single()

      if (orgErr) throw orgErr

      const { error: memErr } = await supabase
        .from('organization_members')
        .insert({ organization_id: org.id, user_id: user.id, role: 'owner' })

      if (memErr) throw memErr

      await supabase.from('users').update({ organization_id: org.id }).eq('id', user.id)
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white mb-4">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Join Your Team</h1>
            <p className="text-slate-500 mt-2">
              Enter the invite code your manager gave you.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => { setInviteCode(e.target.value.toUpperCase()); setFoundOrg(null); setError(null) }}
                placeholder="e.g. A1B2C3D4"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-center text-lg tracking-widest font-mono uppercase"
                maxLength={12}
                autoFocus
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {foundOrg && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <p className="text-sm font-medium text-teal-800">Organisation found:</p>
                <p className="text-lg font-bold text-teal-900">{foundOrg.name}</p>
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
              className="w-full text-sm text-slate-500 hover:text-slate-700"
            >
              &larr; Create a new organisation instead
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 2b: Create new org
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Your Organisation</h1>
          <p className="text-slate-500 mt-2">
            Set up your care company on CareCall AI.
          </p>
        </div>

        <form onSubmit={handleCreate} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Organisation Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunrise Domiciliary Care"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              required
              autoFocus
            />
            {name.trim() && (
              <p className="text-xs text-slate-400 mt-1">
                URL: carecall.ai/{generateSlug(name.trim())}
              </p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
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

          <p className="text-xs text-center text-slate-400">
            14-day free trial. No credit card required.
          </p>

          <p className="text-xs text-center text-slate-400">
            Have an invite code from your manager?{' '}
            <button
              type="button"
              onClick={() => { setMode('join'); setError(null) }}
              className="text-teal-600 font-medium hover:underline"
            >
              Join your team
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

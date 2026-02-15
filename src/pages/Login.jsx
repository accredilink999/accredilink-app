import { useState, useEffect } from 'react'
import { supabase } from '@/api/supabaseClient'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import { isBiometricEnabled, authenticateBiometric, getStoredCredential, getBiometricRefreshToken, storeBiometricRefreshToken } from '@/utils/biometric'

export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [biometricReady, setBiometricReady] = useState(false)

  // Force password change state
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Hide splash screen when login page is ready
  useEffect(() => {
    if (window.hideSplash) window.hideSplash();
  }, []);

  // Show biometric button if credential exists on this device (session or not)
  useEffect(() => {
    if (isBiometricEnabled()) {
      setBiometricReady(true);
    }
  }, []);

  const handleBiometricLogin = async () => {
    setError('');
    setStatus('Verifying...');
    try {
      await authenticateBiometric();
      // Biometric passed — try to use existing session (may auto-refresh)
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const { data: { user: authUser }, error: userErr } = await supabase.auth.getUser();
        if (authUser && !userErr) {
          // Keep biometric refresh token current
          storeBiometricRefreshToken(session.refresh_token);
          setStatus('Redirecting...');
          window.location.replace('/');
          return;
        }
      }
      // No active session — try stored biometric refresh token
      const storedRefresh = getBiometricRefreshToken();
      if (storedRefresh) {
        setStatus('Restoring session...');
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession({
          refresh_token: storedRefresh,
        });
        if (refreshData?.session && !refreshErr) {
          // Store the new refresh token for next time
          storeBiometricRefreshToken(refreshData.session.refresh_token);
          setStatus('Redirecting...');
          window.location.replace('/');
          return;
        }
      }
      // Nothing worked — prompt for password
      setError('Session expired — please sign in with your password to reconnect');
      setBiometricReady(false);
      setStatus('');
    } catch (err) {
      setError('Biometric failed — use password instead');
      setStatus('');
    }
  };

  // If there's already a valid session, redirect straight away
  // Skip redirect if biometric is ready (let them use biometric first)
  useEffect(() => {
    if (biometricReady) return; // don't auto-redirect, let them biometric unlock
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        // Verify the session is actually valid by calling getUser
        supabase.auth.getUser().then(({ data: { user }, error }) => {
          if (user && !error) {
            window.location.replace('/')
          }
        })
      }
    })
  }, [biometricReady])

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!email || !password) return
    setStatus('Authenticating...')
    setError('')
    setSuccessMsg('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message || 'Invalid credentials')
        setStatus('')
        return
      }

      if (data?.session) {
        // Store refresh token for biometric re-login
        if (isBiometricEnabled()) {
          storeBiometricRefreshToken(data.session.refresh_token);
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('force_password_change')
          .eq('id', data.user.id)
          .single()

        if (profile?.force_password_change) {
          setMustChangePassword(true)
          setStatus('')
          return
        }

        setStatus('Redirecting...')
        window.location.replace('/')
        return
      }

      setError('Unexpected response — please try again')
      setStatus('')
    } catch (err) {
      setError(err.message || 'Network error — check your connection')
      setStatus('')
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!email || !password || !fullName) return
    setStatus('Creating account...')
    setError('')
    setSuccessMsg('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setStatus('')
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      })

      if (signUpError) {
        setError(signUpError.message || 'Failed to create account')
        setStatus('')
        return
      }

      // If email confirmation is required, show success message
      if (data?.user && !data?.session) {
        setSuccessMsg('Account created! Check your email to confirm, then sign in.')
        setStatus('')
        setMode('signin')
        setPassword('')
        return
      }

      // If auto-confirmed (email_confirm disabled), sign in directly
      if (data?.session) {
        setStatus('Redirecting...')
        window.location.replace('/')
        return
      }

      setSuccessMsg('Account created! You can now sign in.')
      setStatus('')
      setMode('signin')
      setPassword('')
    } catch (err) {
      setError(err.message || 'Network error — check your connection')
      setStatus('')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setStatus('Updating password...')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
        setStatus('')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ force_password_change: false })
          .eq('id', user.id)
      }

      setStatus('Redirecting...')
      window.location.replace('/')
    } catch (err) {
      setError(err.message || 'Failed to update password')
      setStatus('')
    }
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError('')
    setSuccessMsg('')
    setStatus('')
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #cbd5e1', fontSize: 16, outline: 'none',
    boxSizing: 'border-box',
  }

  const subtitle = mustChangePassword
    ? 'Please set a new password'
    : mode === 'signin'
      ? 'Sign in to your account'
      : 'Create a new account'

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      background: '#f8fafc',
      padding: '24px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'fixed',
      inset: 0,
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      <div style={{ flex: '0 0 auto' }} />
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: 32,
        margin: 'auto 0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo.png" alt="Accredilink" style={{
            width: 80, height: 'auto', marginBottom: 12, borderRadius: 12,
          }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', margin: '8px 0 4px' }}>
            Care Call AI
          </h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>{subtitle}</p>
        </div>

        {/* Sign In / Sign Up toggle — always visible */}
        {!mustChangePassword && (
          <div style={{
            display: 'flex', borderRadius: 8, overflow: 'hidden',
            border: '2px solid #0d9488', marginBottom: 20,
          }}>
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); setStatus(''); }}
              style={{
                flex: 1, padding: '10px 0', fontSize: 15, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: mode === 'signin' ? '#0d9488' : '#fff',
                color: mode === 'signin' ? '#fff' : '#0d9488',
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); setStatus(''); }}
              style={{
                flex: 1, padding: '10px 0', fontSize: 15, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: mode === 'signup' ? '#0d9488' : '#fff',
                color: mode === 'signup' ? '#fff' : '#0d9488',
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, color: '#dc2626', fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, color: '#166534', fontSize: 14,
          }}>
            {successMsg}
          </div>
        )}

        {/* Biometric quick login */}
        {biometricReady && !mustChangePassword && mode === 'signin' && (() => {
          const stored = getStoredCredential();
          return (
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                Welcome back{stored?.userName ? `, ${stored.userName.split(' ')[0]}` : ''}
              </p>
              <button
                onClick={handleBiometricLogin}
                disabled={!!status}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 10,
                  background: status ? '#94a3b8' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                  color: '#fff', fontSize: 16, fontWeight: 600,
                  border: 'none', cursor: status ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  marginBottom: 8,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/>
                  <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"/>
                  <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                  <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                  <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                  <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                  <path d="M2 16h.01"/>
                  <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                  <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/>
                </svg>
                {status || 'Sign in with Biometrics'}
              </button>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0',
              }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: 12, color: '#94a3b8' }}>or use password</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>
            </div>
          );
        })()}

        {mustChangePassword ? (
          <form onSubmit={handleChangePassword}>
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
              padding: '10px 14px', marginBottom: 16, color: '#92400e', fontSize: 13,
            }}>
              Your temporary password must be changed before continuing.
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="new-password" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
                New Password
              </label>
              <input
                id="new-password"
                name="new_password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="confirm-password" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={!!status}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 8,
                background: status ? '#94a3b8' : '#0d9488', color: '#fff',
                fontSize: 16, fontWeight: 600, border: 'none', cursor: status ? 'wait' : 'pointer',
              }}
            >
              {status || 'Set New Password'}
            </button>
          </form>
        ) : mode === 'signin' ? (
          <form onSubmit={handleSignIn}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="signin-email" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
                Email
              </label>
              <input
                id="signin-email"
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                lang="en-GB"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="signin-password" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
                Password
              </label>
              <input
                id="signin-password"
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                lang="en-GB"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={!!status}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 8,
                background: status ? '#94a3b8' : '#0d9488', color: '#fff',
                fontSize: 16, fontWeight: 600, border: 'none', cursor: status ? 'wait' : 'pointer',
              }}
            >
              {status || 'Sign in'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#64748b' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={switchMode}
                style={{
                  background: 'none', border: 'none', color: '#0d9488',
                  fontWeight: 600, cursor: 'pointer', fontSize: 14, padding: 0,
                }}
              >
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignUp}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="signup-name" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
                Full Name
              </label>
              <input
                id="signup-name"
                name="full_name"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Your full name"
                required
                autoComplete="name"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label htmlFor="signup-email" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
                Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                lang="en-GB"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label htmlFor="signup-password" style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#334155', marginBottom: 6 }}>
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
                lang="en-GB"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={!!status}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 8,
                background: status ? '#94a3b8' : '#0d9488', color: '#fff',
                fontSize: 16, fontWeight: 600, border: 'none', cursor: status ? 'wait' : 'pointer',
              }}
            >
              {status || 'Create Account'}
            </button>

            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#64748b' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={switchMode}
                style={{
                  background: 'none', border: 'none', color: '#0d9488',
                  fontWeight: 600, cursor: 'pointer', fontSize: 14, padding: 0,
                }}
              >
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
      <PWAInstallPrompt />
    </div>
  )
}

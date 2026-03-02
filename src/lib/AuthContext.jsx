import React, { createContext, useState, useContext, useEffect } from 'react'
import { supabase } from '@/api/supabaseClient'
import { isBiometricEnabled } from '@/utils/biometric'
import { clearAllDrafts } from '@/hooks/useFormPersistence'
import { initOrg, resetOrg } from '@/lib/orgContext'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  // Kept for API compat with pages that reference these
  const [isLoadingPublicSettings] = useState(false)
  const [authError, setAuthError] = useState(null)
  const [appPublicSettings] = useState(null)

  useEffect(() => {
    let mounted = true
    let initialised = false

    // Safety timeout — never show loading for more than 8 seconds
    const safetyTimeout = setTimeout(() => {
      if (mounted && !initialised) {
        console.warn('Auth loading timeout — forcing redirect to login')
        setIsLoadingAuth(false)
      }
    }, 8000)

    // Use onAuthStateChange as the single source of truth.
    // It emits INITIAL_SESSION on registration (after init completes),
    // then SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED for subsequent changes.
    //
    // IMPORTANT: This callback must NOT be async and must NOT await loadProfile.
    // Supabase's _notifyAllSubscribers awaits every callback via Promise.all.
    // If we await loadProfile here, loadProfile calls supabase.from() which
    // internally calls getSession() which awaits initializePromise — creating
    // a circular deadlock that hangs the entire auth system.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return
        initialised = true
        if (_event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true)
        }
        if (session?.user) {
          loadProfile(session.user) // fire-and-forget — no await!
        } else {
          setUser(null)
          setIsAuthenticated(false)
          setIsLoadingAuth(false)
        }
      }
    )

    return () => {
      mounted = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (authUser) => {
    setIsLoadingAuth(true)
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      // PGRST116 = no rows — first login, profile not yet created by trigger
      if (error && error.code !== 'PGRST116') {
        console.error('Profile load error:', error)
      }

      // Initialize org context (fire-and-forget, non-blocking)
      initOrg().catch(() => {})

      setUser({
        id: authUser.id,
        email: authUser.email,
        ...profile,
      })
      setIsAuthenticated(true)
    } catch (err) {
      console.error('loadProfile error:', err)
      setAuthError({ type: 'unknown', message: err.message })
    } finally {
      setIsLoadingAuth(false)
    }
  }

  const logout = async (shouldRedirect = true) => {
    try {
      const scope = isBiometricEnabled() ? 'local' : 'global';
      await supabase.auth.signOut({ scope })
    } catch (e) {
      console.error('signOut error (continuing):', e)
    }
    // Clear org context
    resetOrg()
    // Clear any saved form drafts
    clearAllDrafts()
    // Clear any cached Supabase tokens from localStorage
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith('sb-') && (key.endsWith('-auth-token') || key.endsWith('auth-token-code-verifier'))) {
        localStorage.removeItem(key)
      }
    }
    setUser(null)
    setIsAuthenticated(false)
    if (shouldRedirect) {
      window.location.href = '/login'
    }
  }

  const navigateToLogin = () => {
    window.location.href = '/login'
  }

  // Allows pages to refresh the user object (e.g. after profile update)
  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) await loadProfile(authUser)
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      isPasswordRecovery,
      clearPasswordRecovery: () => setIsPasswordRecovery(false),
      logout,
      navigateToLogin,
      refreshUser,
      checkAppState: refreshUser, // compat alias used by some pages
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

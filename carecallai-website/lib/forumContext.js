'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getForumClient } from './forumAuth'

const ForumContext = createContext(null)

export function ForumProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [needsSetup, setNeedsSetup] = useState(false)

  const fetchProfile = useCallback(async (accessToken) => {
    try {
      const res = await fetch('/api/forum/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-profile', token: accessToken }),
      })
      const data = await res.json()
      if (data.user) setUser(prev => prev || { id: data.user.id, email: data.user.email })
      const fp = data.profile || data.forumProfile
      if (fp) {
        setProfile(fp)
        setNeedsSetup(!!data.needsSetup)
        return fp
      }
      return null
    } catch {
      return null
    }
  }, [])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/forum/categories')
      const data = await res.json()
      if (data.categories) setCategories(data.categories)
    } catch {}
  }, [])

  useEffect(() => {
    const init = async () => {
      const client = getForumClient()
      if (!client) { setLoading(false); return }

      let { data: { session } } = await client.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        setToken(session.access_token)
        const fp = await fetchProfile(session.access_token)
        // If profile fetch failed (possibly expired token), try refreshing the session
        if (!fp && session.refresh_token) {
          try {
            const { data: refreshed } = await client.auth.refreshSession()
            if (refreshed?.session) {
              session = refreshed.session
              setUser(session.user)
              setToken(session.access_token)
              await fetchProfile(session.access_token)
            }
          } catch {}
        }
      }

      const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user)
          setToken(session.access_token)
          await fetchProfile(session.access_token)
        } else {
          setUser(null)
          setProfile(null)
          setToken(null)
        }
      })

      fetchCategories()
      setLoading(false)

      return () => subscription?.unsubscribe()
    }

    init()
  }, [fetchProfile, fetchCategories])

  const login = async (email, password, rememberMe = true) => {
    // Use the forum API which checks admin status server-side
    const res = await fetch('/api/forum/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', email, password }),
    })
    const data = await res.json()
    if (!res.ok || data.error) throw new Error(data.error || 'Login failed')

    const accessToken = data.session?.access_token
    const refreshToken = data.session?.refresh_token
    if (!accessToken) throw new Error('No session returned from server')

    // Set session on the client for persistence
    const client = getForumClient()
    if (client) {
      await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    }

    // Save remember-me preference
    try {
      if (rememberMe) {
        localStorage.setItem('forum-remember', '1')
      } else {
        localStorage.removeItem('forum-remember')
        // For non-remember, session will only last this browser tab via state
      }
    } catch {}

    setUser(data.user)
    setToken(accessToken)
    const fp = data.profile || data.forumProfile
    if (fp) setProfile(fp)
    setNeedsSetup(!!data.needsSetup)
    return { user: data.user, profile: fp, needsSetup: !!data.needsSetup }
  }

  const logout = async () => {
    const client = getForumClient()
    if (client) await client.auth.signOut()
    setUser(null)
    setProfile(null)
    setToken(null)
    try {
      localStorage.removeItem('forum-remember')
      localStorage.removeItem('forum-saved-email')
    } catch {}
  }

  const refreshProfile = async () => {
    if (token) await fetchProfile(token)
  }

  return (
    <ForumContext.Provider value={{ user, profile, token, loading, categories, needsSetup, setNeedsSetup, login, logout, refreshProfile, fetchCategories }}>
      {children}
    </ForumContext.Provider>
  )
}

export function useForum() {
  const ctx = useContext(ForumContext)
  if (!ctx) throw new Error('useForum must be used within ForumProvider')
  return ctx
}

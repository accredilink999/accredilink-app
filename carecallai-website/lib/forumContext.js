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

  const fetchProfile = useCallback(async (accessToken) => {
    try {
      const res = await fetch('/api/forum/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-profile', token: accessToken }),
      })
      const data = await res.json()
      if (data.profile) {
        setProfile(data.profile)
        return data.profile
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

      const { data: { session } } = await client.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        setToken(session.access_token)
        await fetchProfile(session.access_token)
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

  const login = async (email, password) => {
    const client = getForumClient()
    if (!client) throw new Error('Forum client not available')
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error) throw error
    setUser(data.user)
    setToken(data.session.access_token)
    const prof = await fetchProfile(data.session.access_token)
    return { user: data.user, profile: prof }
  }

  const logout = async () => {
    const client = getForumClient()
    if (client) await client.auth.signOut()
    setUser(null)
    setProfile(null)
    setToken(null)
  }

  const refreshProfile = async () => {
    if (token) await fetchProfile(token)
  }

  return (
    <ForumContext.Provider value={{ user, profile, token, loading, categories, login, logout, refreshProfile, fetchCategories }}>
      {children}
    </ForumContext.Provider>
  )
}

export function useForum() {
  const ctx = useContext(ForumContext)
  if (!ctx) throw new Error('useForum must be used within ForumProvider')
  return ctx
}

'use client'
import { useState, useEffect } from 'react'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import ForumSidebar from '@/components/forum/ForumSidebar'
import CategoryCard from '@/components/forum/CategoryCard'
import ThreadCard from '@/components/forum/ThreadCard'
import { Flame, Clock, MessageSquare } from 'lucide-react'

export default function ForumHome() {
  const { user, profile, token, loading, categories, logout } = useForum()
  const [recentThreads, setRecentThreads] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingThreads, setLoadingThreads] = useState(true)

  useEffect(() => {
    fetchRecentThreads()
    fetchStats()
  }, [])

  const fetchRecentThreads = async () => {
    try {
      const res = await fetch('/api/forum/threads?sort=newest&limit=5')
      const data = await res.json()
      if (data.threads) setRecentThreads(data.threads)
    } catch {} finally { setLoadingThreads(false) }
  }

  const fetchStats = async () => {
    try {
      const [threadRes, catRes] = await Promise.all([
        fetch('/api/forum/threads?limit=0'),
        fetch('/api/forum/categories'),
      ])
      const threadData = await threadRes.json()
      const catData = await catRes.json()
      setStats({
        threads: threadData.total || 0,
        replies: 0,
        users: 0,
        categories: catData.categories?.length || 0,
      })
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <>
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-2xl p-6 sm:p-8 mb-8 text-white">
          <h1 className="text-2xl sm:text-3xl font-bold">CareCall AI Community</h1>
          <p className="text-teal-100 mt-2 text-sm sm:text-base">
            Connect with fellow care professionals, share best practices, get help, and shape the future of CareCall AI.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <ForumSidebar categories={categories} stats={stats} profile={profile} />

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Categories */}
            <h2 className="font-semibold text-lg text-slate-900 mb-4">Categories</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {categories.map(cat => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>

            {/* Recent Threads */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg text-slate-900">Recent Threads</h2>
            </div>
            <div className="space-y-2">
              {loadingThreads ? (
                <div className="text-center py-8 text-slate-400">Loading...</div>
              ) : recentThreads.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No threads yet. Be the first to start a conversation!</p>
                </div>
              ) : (
                recentThreads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} showCategory />
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import ForumSidebar from '@/components/forum/ForumSidebar'
import CategoryCard from '@/components/forum/CategoryCard'
import ThreadCard from '@/components/forum/ThreadCard'
import { MessageSquare, TrendingUp, Users, Layers } from 'lucide-react'

export default function ForumHome() {
  const { user, profile, token, loading, categories, logout } = useForum()
  const router = useRouter()
  const [recentThreads, setRecentThreads] = useState([])
  const [stats, setStats] = useState(null)
  const [loadingThreads, setLoadingThreads] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/forum/login')
      return
    }
    if (user) {
      fetchRecentThreads()
      fetchStats()
    }
  }, [loading, user])

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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14 relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-500/20">
              <img src="/logo-icon.png" alt="CareCall AI" className="w-10 h-10 rounded-lg" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                CareCall<span className="text-teal-400">AI</span> Community
              </h1>
              <p className="text-teal-200/70 text-sm mt-0.5">Connect, share, and grow with fellow care professionals</p>
            </div>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="flex items-center gap-6 mt-6 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.07] backdrop-blur rounded-xl border border-white/10">
                <Layers className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium text-white">{stats.categories}</span>
                <span className="text-xs text-slate-400">Categories</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.07] backdrop-blur rounded-xl border border-white/10">
                <MessageSquare className="w-4 h-4 text-teal-400" />
                <span className="text-sm font-medium text-white">{stats.threads}</span>
                <span className="text-xs text-slate-400">Threads</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.07] backdrop-blur rounded-xl border border-white/10">
                <Users className="w-4 h-4 text-teal-400" />
                <span className="text-xs text-slate-400">Admin-only community</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <ForumSidebar categories={categories} stats={stats} profile={profile} />

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Categories */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-teal-600" />
                Browse Categories
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {categories.map(cat => (
                <CategoryCard key={cat.id} category={cat} />
              ))}
            </div>

            {/* Recent Threads */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                Recent Threads
              </h2>
            </div>
            <div className="space-y-3">
              {loadingThreads ? (
                <div className="text-center py-8 text-slate-400">Loading...</div>
              ) : recentThreads.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">No threads yet</p>
                  <p className="text-sm text-slate-400 mt-1">Be the first to start a conversation!</p>
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
    </div>
  )
}

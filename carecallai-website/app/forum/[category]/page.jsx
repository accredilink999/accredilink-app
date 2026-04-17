'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import ForumSidebar from '@/components/forum/ForumSidebar'
import ThreadCard from '@/components/forum/ThreadCard'
import Pagination from '@/components/forum/Pagination'
import { Plus, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'

export default function CategoryPage({ params }) {
  const { category: categorySlug } = use(params)
  const { user, profile, token, loading, categories, logout } = useForum()
  const router = useRouter()
  const [threads, setThreads] = useState([])
  const [loadingThreads, setLoadingThreads] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sort, setSort] = useState('newest')

  const category = categories.find(c => c.slug === categorySlug)

  useEffect(() => {
    if (!loading && !user) { router.push('/forum/login'); return }
    if (user) fetchThreads()
  }, [loading, user, categorySlug, page, sort])

  const fetchThreads = async () => {
    setLoadingThreads(true)
    try {
      const res = await fetch(`/api/forum/threads?category=${categorySlug}&sort=${sort}&page=${page}`)
      const data = await res.json()
      setThreads(data.threads || [])
      setTotalPages(data.totalPages || 1)
    } catch {} finally { setLoadingThreads(false) }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <ForumSidebar categories={categories} profile={profile} />

          <main className="flex-1 min-w-0">
            {/* Category header */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{category?.name || categorySlug}</h1>
                  <p className="text-sm text-slate-500 mt-0.5">{category?.description}</p>
                </div>
                {profile && !category?.is_locked && (
                  <Link
                    href={`/forum/new?category=${categorySlug}`}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> New Thread
                  </Link>
                )}
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpDown className="w-4 h-4 text-slate-500" />
              {['newest', 'popular', 'unanswered'].map(s => (
                <button
                  key={s}
                  onClick={() => { setSort(s); setPage(1) }}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${sort === s ? 'bg-teal-500/20 text-teal-300 font-medium border border-teal-500/30' : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-300'}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Threads */}
            <div className="space-y-2">
              {loadingThreads ? (
                <div className="text-center py-8 text-slate-400">Loading threads...</div>
              ) : threads.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.06] rounded-2xl border border-white/10">
                  <p className="text-slate-400">No threads in this category yet.</p>
                  {profile && (
                    <Link href={`/forum/new?category=${categorySlug}`} className="text-teal-400 hover:text-teal-300 text-sm font-medium mt-2 inline-block">
                      Start the first thread
                    </Link>
                  )}
                </div>
              ) : (
                threads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} />
                ))
              )}
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </main>
        </div>
      </div>
    </div>
  )
}

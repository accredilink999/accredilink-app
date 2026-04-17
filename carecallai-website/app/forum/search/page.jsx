'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import ThreadCard from '@/components/forum/ThreadCard'
import { Search, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { timeAgo } from '@/lib/forumAuth'

function SearchContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const { user, profile, token, loading, logout } = useForum()
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState(q)

  useEffect(() => {
    if (q) performSearch(q)
  }, [q])

  const performSearch = async (query) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/forum/search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setResults(data.results || [])
    } catch {} finally { setSearching(false) }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.history.pushState({}, '', `/forum/search?q=${encodeURIComponent(searchQuery.trim())}`)
      performSearch(searchQuery.trim())
    }
  }

  return (
    <div className="min-h-screen ">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-white mb-4">Search Forum</h1>

        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search threads and replies..."
              className="w-full pl-12 pr-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30"
              autoFocus
            />
          </div>
        </form>

        {searching ? (
          <div className="text-center py-8 text-slate-400">Searching...</div>
        ) : results.length === 0 && q ? (
          <div className="text-center py-12 bg-white/[0.06] rounded-2xl border border-white/10">
            <Search className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">No results found for &ldquo;{q}&rdquo;</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(result => (
              result.type === 'thread' ? (
                <ThreadCard key={result.id} thread={result} showCategory />
              ) : (
                <Link key={result.id} href={`/forum/thread/${result.thread_id}`}>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-teal-300 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply in: <strong className="text-slate-600">{result.forum_threads?.title}</strong></span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{result.content?.slice(0, 200)}</p>
                    <p className="text-xs text-slate-400 mt-1">{result.forum_profiles?.username} &middot; {timeAgo(result.created_at)}</p>
                  </div>
                </Link>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen  flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div></div>}>
      <SearchContent />
    </Suspense>
  )
}

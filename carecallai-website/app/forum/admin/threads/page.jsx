'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { useForum } from '@/lib/forumContext'
import { timeAgo } from '@/lib/forumAuth'
import { MessageSquare, Loader2, Pin, Lock, Unlock, ArrowUpCircle, Trash2, ExternalLink } from 'lucide-react'

export default function AdminThreads() {
  const { token } = useForum()
  const [threads, setThreads] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const fetchThreads = async (p = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/forum/threads?sort=newest&page=${p}&limit=20`)
      const data = await res.json()
      setThreads(data.threads || [])
      setTotal(data.total || 0)
      setPage(p)
      setLoaded(true)
    } catch {} finally { setLoading(false) }
  }

  const handleAction = async (threadId, action) => {
    if (action === 'delete' && !confirm('Delete this thread and all its replies?')) return
    try {
      const res = await fetch(`/api/forum/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Action failed'); return }
      fetchThreads(page)
    } catch (err) { alert('Failed: ' + err.message) }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-teal-400" />
            <h2 className="font-semibold text-white text-lg">Thread Management</h2>
          </div>
          {!loaded && (
            <button onClick={() => fetchThreads(1)} className="text-sm px-4 py-2 bg-teal-500/20 text-teal-300 rounded-lg hover:bg-teal-500/30 transition-colors">
              Load Threads
            </button>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-teal-400 animate-spin" /></div>
        )}

        {threads.length > 0 && (
          <div className="space-y-2">
            {threads.map(thread => (
              <div key={thread.id} className="bg-white/[0.04] rounded-xl border border-white/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-white truncate">{thread.title}</span>
                      {thread.is_pinned && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Pinned</span>}
                      {thread.is_locked && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-500/20 text-slate-400 border border-slate-500/30">Locked</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>by {thread.forum_profiles?.display_name || thread.forum_profiles?.username || 'Unknown'}</span>
                      <span>&middot;</span>
                      <span>{thread.forum_categories?.name || 'Uncategorised'}</span>
                      <span>&middot;</span>
                      <span>{timeAgo(thread.created_at)}</span>
                      <span>&middot;</span>
                      <span>{thread.reply_count || 0} replies</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={`/forum/${thread.forum_categories?.slug || 'thread'}/${thread.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors" title="View thread">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => handleAction(thread.id, thread.is_pinned ? 'unpin' : 'pin')} className={`p-1.5 rounded-lg transition-colors ${thread.is_pinned ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10'}`} title={thread.is_pinned ? 'Unpin' : 'Pin'}>
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleAction(thread.id, thread.is_locked ? 'unlock' : 'lock')} className={`p-1.5 rounded-lg transition-colors ${thread.is_locked ? 'text-slate-300 bg-slate-500/10' : 'text-slate-400 hover:text-slate-300 hover:bg-slate-500/10'}`} title={thread.is_locked ? 'Unlock' : 'Lock'}>
                      {thread.is_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => handleAction(thread.id, 'bump')} className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 rounded-lg transition-colors" title="Bump to top">
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleAction(thread.id, 'delete')} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-slate-400">{total} total threads</span>
              <div className="flex gap-2">
                {page > 1 && (
                  <button onClick={() => fetchThreads(page - 1)} className="text-xs px-3 py-1.5 bg-white/[0.06] text-slate-300 rounded-lg hover:bg-white/[0.1]">Previous</button>
                )}
                {threads.length === 20 && (
                  <button onClick={() => fetchThreads(page + 1)} className="text-xs px-3 py-1.5 bg-white/[0.06] text-slate-300 rounded-lg hover:bg-white/[0.1]">Next</button>
                )}
              </div>
            </div>
          </div>
        )}

        {loaded && threads.length === 0 && !loading && (
          <p className="text-center text-sm text-slate-400 py-8">No threads found</p>
        )}
      </div>
    </div>
  )
}

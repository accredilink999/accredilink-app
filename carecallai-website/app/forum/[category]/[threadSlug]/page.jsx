'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, use } from 'react'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import UserBadge from '@/components/forum/UserBadge'
import ReplyCard from '@/components/forum/ReplyCard'
import ReplyEditor from '@/components/forum/ReplyEditor'
import LikeButton from '@/components/forum/LikeButton'
import RichContent from '@/components/forum/RichContent'
import ReactionBar from '@/components/forum/ReactionBar'
import { timeAgo, canModerate, isFounder } from '@/lib/forumAuth'
import StarRank from '@/components/forum/StarRank'
import { Pin, Lock, Unlock, Trash2, Edit, Eye, MessageSquare, MoreHorizontal, ArrowUpCircle, FolderInput, Bell, BellOff, Flag } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ThreadPage({ params }) {
  const { category, threadSlug } = use(params)
  const { user, profile, token, loading, logout, categories, getFreshToken } = useForum()
  const router = useRouter()
  const [thread, setThread] = useState(null)
  const [replies, setReplies] = useState([])
  const [likedThread, setLikedThread] = useState(false)
  const [likedReplies, setLikedReplies] = useState([])
  const [replyingTo, setReplyingTo] = useState(null)
  const [showModMenu, setShowModMenu] = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [loadingThread, setLoadingThread] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [threadReactions, setThreadReactions] = useState([])
  const [replyReactions, setReplyReactions] = useState({})
  const [subscribed, setSubscribed] = useState(false)
  const [togglingSubscription, setTogglingSubscription] = useState(false)
  const [showReportThread, setShowReportThread] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reportingThread, setReportingThread] = useState(false)

  useEffect(() => {
    if (!loading && !user) { router.push('/forum/login'); return }
    if (user) fetchThread()
  }, [loading, user, threadSlug])

  useEffect(() => {
    if (thread && token) {
      fetchLikes()
      fetchReactions()
      fetchSubscription()
    }
  }, [thread, token])

  const fetchThread = async () => {
    setLoadingThread(true)
    try {
      const res = await fetch(`/api/forum/threads/${threadSlug}`)
      const data = await res.json()
      if (data.thread) {
        setThread(data.thread)
        setReplies(data.replies || [])
        setEditTitle(data.thread.title)
        setEditContent(data.thread.content)
      }
    } catch {} finally { setLoadingThread(false) }
  }

  const fetchLikes = async () => {
    if (!thread || !token) return
    try {
      const res = await fetch(`/api/forum/likes?token=${token}&threadId=${thread.id}`)
      const data = await res.json()
      setLikedThread(data.likedThread || false)
      setLikedReplies(data.likedReplies || [])
    } catch {}
  }

  const fetchReactions = async () => {
    if (!thread) return
    try {
      const replyIds = replies.map(r => r.id).join(',')
      const res = await fetch(`/api/forum/reactions?threadId=${thread.id}&replyIds=${replyIds}`)
      const data = await res.json()
      setThreadReactions(data.threadReactions || [])
      const grouped = {}
      ;(data.replyReactions || []).forEach(r => {
        if (!grouped[r.reply_id]) grouped[r.reply_id] = []
        grouped[r.reply_id].push(r)
      })
      setReplyReactions(grouped)
    } catch {}
  }

  const fetchSubscription = async () => {
    if (!thread || !token) return
    try {
      const res = await fetch(`/api/forum/subscriptions?token=${token}&threadId=${thread.id}`)
      const data = await res.json()
      setSubscribed(data.subscribed || false)
    } catch {}
  }

  const handleToggleSubscription = async () => {
    if (!token || togglingSubscription) return
    setTogglingSubscription(true)
    try {
      const res = await fetch('/api/forum/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, threadId: thread.id }),
      })
      const data = await res.json()
      setSubscribed(data.subscribed)
    } catch {} finally { setTogglingSubscription(false) }
  }

  const handleReportThread = async () => {
    if (!reportReason || !token) return
    setReportingThread(true)
    try {
      await fetch('/api/forum/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, threadId: thread.id, reason: reportReason, details: reportDetails }),
      })
      setShowReportThread(false)
      setReportReason('')
      setReportDetails('')
      alert('Report submitted. Thank you.')
    } catch {} finally { setReportingThread(false) }
  }

  const handleLikeThread = async () => {
    if (!token) return router.push('/forum/login')
    await fetch('/api/forum/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, threadId: thread.id }),
    })
    setLikedThread(!likedThread)
    setThread(prev => ({ ...prev, like_count: (prev.like_count || 0) + (likedThread ? -1 : 1) }))
  }

  const handleLikeReply = async (replyId) => {
    if (!token) return router.push('/forum/login')
    await fetch('/api/forum/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, replyId }),
    })
    const wasLiked = likedReplies.includes(replyId)
    setLikedReplies(prev => wasLiked ? prev.filter(id => id !== replyId) : [...prev, replyId])
    setReplies(prev => prev.map(r => r.id === replyId ? { ...r, like_count: (r.like_count || 0) + (wasLiked ? -1 : 1) } : r))
  }

  const handlePostReply = async (content, parentId) => {
    if (!token) return router.push('/forum/login')
    const res = await fetch('/api/forum/replies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, threadId: thread.id, parentId, content }),
    })
    const data = await res.json()
    if (data.reply) {
      setReplies(prev => [...prev, data.reply])
      setThread(prev => ({ ...prev, reply_count: (prev.reply_count || 0) + 1 }))
      setReplyingTo(null)
    }
  }

  const handleEditReply = async (replyId, content) => {
    await fetch('/api/forum/replies', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, replyId, content }) })
    setReplies(prev => prev.map(r => r.id === replyId ? { ...r, content, updated_at: new Date().toISOString() } : r))
  }

  const handleDeleteReply = async (replyId) => {
    if (!confirm('Delete this reply?')) return
    await fetch('/api/forum/replies', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, replyId, action: 'delete' }) })
    setReplies(prev => prev.filter(r => r.id !== replyId))
    setThread(prev => ({ ...prev, reply_count: Math.max(0, (prev.reply_count || 1) - 1) }))
  }

  const handleMarkSolution = async (replyId) => {
    await fetch('/api/forum/replies', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, replyId, action: 'solution' }) })
    setReplies(prev => prev.map(r => ({ ...r, is_solution: r.id === replyId })))
  }

  const handleModAction = async (action, extra = {}) => {
    setShowModMenu(false)
    if (action === 'delete' && !confirm('Delete this entire thread?')) return
    try {
      const freshToken = await getFreshToken()
      const res = await fetch(`/api/forum/threads/${thread.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: freshToken, action, ...extra }) })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Action failed. Please try logging out and back in.'); return }
      if (action === 'delete') { router.push(`/forum/${category}`) } else { fetchThread() }
    } catch (err) {
      alert('Action failed: ' + err.message)
    }
  }

  const handleMoveThread = async (newCatId) => {
    setShowMoveModal(false)
    await handleModAction('move', { categoryId: newCatId })
    const newCat = categories?.find(c => c.id === newCatId)
    if (newCat) router.push(`/forum/${newCat.slug}/${thread.slug}`)
  }

  const handleSaveEdit = async () => {
    try {
      const freshToken = await getFreshToken()
      const res = await fetch(`/api/forum/threads/${thread.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: freshToken, title: editTitle, content: editContent }) })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Save failed. Please try logging out and back in.'); return }
      setThread(prev => ({ ...prev, title: editTitle, content: editContent, updated_at: new Date().toISOString() }))
      setEditing(false)
    } catch (err) {
      alert('Save failed: ' + err.message)
    }
  }

  if (loading || loadingThread) {
    return (
      <div className="min-h-screen ">
        <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
        <div className="max-w-6xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="min-h-screen ">
        <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <p className="text-slate-400">Thread not found</p>
          <Link href="/forum" className="text-teal-400 hover:text-teal-300 text-sm mt-2 inline-block">Back to forum</Link>
        </div>
      </div>
    )
  }

  const author = thread.forum_profiles || {}
  const isMod = canModerate(profile?.forum_role) || isFounder(user?.id)
  const isOwner = user?.id === thread.author_id

  return (
    <div className="min-h-screen ">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
          <Link href="/forum" className="hover:text-teal-400">Forum</Link>
          <span className="text-slate-600">/</span>
          <Link href={`/forum/${category}`} className="hover:text-teal-400">{thread.forum_categories?.name || category}</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 truncate">{thread.title}</span>
        </div>

        {/* Thread */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-4 shadow-lg">
          <div className="flex items-start gap-4">
            {/* Author sidebar */}
            <div className="hidden sm:flex flex-col items-center flex-shrink-0 w-20 pt-1">
              {author.avatar_url ? (
                <img src={author.avatar_url} alt="" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {(author.display_name || author.username || '?')[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 text-center mt-1.5 leading-tight w-full">{author.display_name || author.username || 'User'}</span>
              {author.forum_role && author.forum_role !== 'user' && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded mt-1 ${author.forum_role === 'founder' ? 'bg-amber-100 text-amber-700' : author.forum_role === 'admin' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                  {author.forum_role === 'founder' ? 'Founder' : author.forum_role === 'admin' ? 'Admin' : 'Mod'}
                </span>
              )}
              <StarRank role={author.forum_role} postCount={author.post_count || 0} />
            </div>

            {/* Content area */}
            <div className="flex-1 min-w-0">
              {/* Title row + mod button */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {thread.is_pinned && <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium"><Pin className="w-3 h-3" /> Pinned</span>}
                    {thread.is_locked && <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium"><Lock className="w-3 h-3" /> Locked</span>}
                  </div>

                  {editing ? (
                    <div className="space-y-3">
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit} className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700">Save</button>
                        <button onClick={() => setEditing(false)} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{thread.title}</h1>
                      {/* Mobile author info (hidden on desktop where sidebar shows) */}
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <UserBadge username={author.username} displayName={author.display_name} avatarUrl={author.avatar_url} role={author.forum_role} postCount={author.post_count || 0} size="sm" />
                        <span className="text-xs text-slate-400">{timeAgo(thread.created_at)}</span>
                        {thread.updated_at && thread.updated_at !== thread.created_at && <span className="text-xs text-slate-400 italic">(edited)</span>}
                      </div>
                      <div className="mt-4"><RichContent content={thread.content} /></div>
                    </>
                  )}
                </div>

                {/* Mod actions button */}
                {(isMod || isOwner) && !editing && (
                  <div className="relative flex-shrink-0">
                    <button onClick={() => setShowModMenu(!showModMenu)} className="p-2 hover:bg-slate-100 rounded-lg">
                      <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </button>
                    {showModMenu && (
                      <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-10 min-w-[180px]">
                        {(isOwner || isMod) && <button onClick={() => { setEditing(true); setShowModMenu(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</button>}
                        {isMod && (
                          <>
                            <button onClick={() => handleModAction(thread.is_pinned ? 'unpin' : 'pin')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"><Pin className="w-4 h-4" /> {thread.is_pinned ? 'Unpin' : 'Pin'}</button>
                            <button onClick={() => handleModAction(thread.is_locked ? 'unlock' : 'lock')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">{thread.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}{thread.is_locked ? 'Unlock' : 'Lock'}</button>
                            <button onClick={() => handleModAction('bump')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"><ArrowUpCircle className="w-4 h-4" /> Bump to Top</button>
                            <button onClick={() => { setShowMoveModal(true); setShowModMenu(false) }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"><FolderInput className="w-4 h-4" /> Move Thread</button>
                          </>
                        )}
                        {(isOwner || isMod) && <button onClick={() => handleModAction('delete')} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              {thread.tags?.length > 0 && (
                <div className="flex gap-1.5 mt-4 flex-wrap">
                  {thread.tags.map(tag => <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">{tag}</span>)}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 flex-wrap">
                <LikeButton liked={likedThread} count={thread.like_count || 0} onClick={handleLikeThread} />
                <div className="flex items-center gap-1.5 text-xs text-slate-400"><MessageSquare className="w-3.5 h-3.5" /> {thread.reply_count || 0} replies</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400"><Eye className="w-3.5 h-3.5" /> {thread.view_count || 0} views</div>
                {token && (
                  <button onClick={handleToggleSubscription} disabled={togglingSubscription} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${subscribed ? 'bg-teal-50 text-teal-600 font-medium' : 'text-slate-400 hover:bg-slate-100'}`}>
                    {subscribed ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                    {subscribed ? 'Watching' : 'Watch'}
                  </button>
                )}
                {token && !isOwner && (
                  <button onClick={() => setShowReportThread(true)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-amber-500 px-2.5 py-1 rounded-full hover:bg-amber-50 transition-colors">
                    <Flag className="w-3.5 h-3.5" /> Report
                  </button>
                )}
              </div>

              {/* Thread reactions */}
              <ReactionBar threadId={thread.id} reactions={threadReactions} userId={user?.id} token={token} />
            </div>
          </div>
        </div>

        {/* Move thread modal */}
        {showMoveModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowMoveModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-slate-900 mb-4">Move Thread to Category</h3>
              <div className="space-y-2">
                {(categories || []).filter(c => c.id !== thread.category_id).map(cat => (
                  <button key={cat.id} onClick={() => handleMoveThread(cat.id)} className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-colors text-sm font-medium text-slate-700">{cat.name}</button>
                ))}
              </div>
              <button onClick={() => setShowMoveModal(false)} className="mt-4 w-full px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
            </div>
          </div>
        )}

        {/* Report thread modal */}
        {showReportThread && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowReportThread(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="font-bold text-slate-900 mb-1">Report This Thread</h3>
              <p className="text-xs text-slate-500 mb-4">Help keep our community safe.</p>
              <div className="space-y-2 mb-4">
                {['Spam', 'Inappropriate content', 'Off-topic', 'Harassment', 'Other'].map(r => (
                  <button key={r} onClick={() => setReportReason(r)} className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${reportReason === r ? 'border-teal-400 bg-teal-50 text-teal-700 font-medium' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}>{r}</button>
                ))}
              </div>
              <textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Additional details (optional)..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none h-20" />
              <div className="flex gap-2">
                <button onClick={handleReportThread} disabled={!reportReason || reportingThread} className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors">{reportingThread ? 'Submitting...' : 'Submit Report'}</button>
                <button onClick={() => setShowReportThread(false)} className="px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Replies */}
        <div className="space-y-3 mb-4">
          <h2 className="font-semibold text-white">{replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}</h2>
          {replies.map(reply => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              currentUser={profile ? { ...profile, id: user?.id } : isFounder(user?.id) ? { id: user?.id, forum_role: 'founder' } : null}
              onLike={handleLikeReply}
              onEdit={handleEditReply}
              onDelete={handleDeleteReply}
              onSolution={handleMarkSolution}
              onReply={setReplyingTo}
              isLiked={likedReplies.includes(reply.id)}
              reactions={replyReactions[reply.id] || []}
              userId={user?.id}
              token={token}
            />
          ))}
        </div>

        {/* Reply editor */}
        {(profile || isFounder(user?.id)) && !thread.is_locked ? (
          <ReplyEditor onSubmit={handlePostReply} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} />
        ) : thread.is_locked ? (
          <div className="bg-slate-800/50 rounded-xl p-4 text-center text-sm text-slate-400 border border-white/10">
            <Lock className="w-5 h-5 mx-auto mb-1 text-slate-500" />
            This thread is locked. No new replies can be posted.
          </div>
        ) : (
          <div className="bg-white/[0.06] rounded-xl border border-white/10 p-4 text-center">
            <p className="text-sm text-slate-400"><Link href="/forum/login" className="text-teal-400 hover:text-teal-300 font-medium">Sign in</Link> to reply to this thread.</p>
          </div>
        )}
      </div>
    </div>
  )
}

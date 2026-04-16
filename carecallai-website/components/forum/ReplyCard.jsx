'use client'
import { useState } from 'react'
import { Heart, CheckCircle, Edit, Trash2, MoreHorizontal, Reply, Flag } from 'lucide-react'
import UserBadge from './UserBadge'
import RichContent from './RichContent'
import ReactionBar from './ReactionBar'
import { timeAgo, canModerate } from '@/lib/forumAuth'

export default function ReplyCard({ reply, currentUser, onLike, onEdit, onDelete, onSolution, onReply, isLiked, reactions = [], userId, token }) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(reply.content)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')
  const [reporting, setReporting] = useState(false)
  const author = reply.forum_profiles || {}
  const isOwner = currentUser?.id === reply.author_id
  const isMod = canModerate(currentUser?.forum_role)

  const handleSaveEdit = () => {
    onEdit?.(reply.id, editContent)
    setEditing(false)
  }

  const handleReport = async () => {
    if (!reportReason || !token) return
    setReporting(true)
    try {
      await fetch('/api/forum/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, replyId: reply.id, reason: reportReason, details: reportDetails }),
      })
      setShowReportModal(false)
      setReportReason('')
      setReportDetails('')
      alert('Report submitted. Thank you.')
    } catch {} finally { setReporting(false) }
  }

  return (
    <div className={`bg-white rounded-xl border p-5 ${reply.is_solution ? 'border-green-300 bg-green-50/50 shadow-green-100/50 shadow-md' : 'border-slate-200'}`}>
      {reply.is_solution && (
        <div className="flex items-center gap-1.5 text-green-700 text-sm font-semibold mb-3">
          <CheckCircle className="w-4 h-4" />
          Accepted Solution
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <UserBadge
          username={author.username}
          displayName={author.display_name}
          avatarUrl={author.avatar_url}
          role={author.forum_role}
          postCount={author.post_count || 0}
          size="sm"
        />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{timeAgo(reply.created_at)}</span>
          {reply.updated_at && reply.updated_at !== reply.created_at && (
            <span className="italic">(edited)</span>
          )}
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-slate-100 rounded">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-10 min-w-[140px]">
                {(isOwner || isMod) && (
                  <button onClick={() => { setEditing(true); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                {isMod && (
                  <button onClick={() => { onSolution?.(reply.id); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5" /> Mark Solution
                  </button>
                )}
                {!isOwner && token && (
                  <button onClick={() => { setShowReportModal(true); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-amber-50 text-amber-600 flex items-center gap-2">
                    <Flag className="w-3.5 h-3.5" /> Report
                  </button>
                )}
                {(isOwner || isMod) && (
                  <button onClick={() => { onDelete?.(reply.id); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full border border-slate-300 rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700">Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <RichContent content={reply.content} />
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
        <button
          onClick={() => onLike?.(reply.id)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ${isLiked ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-100'}`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          {reply.like_count || 0}
        </button>
        <button
          onClick={() => onReply?.(reply)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 px-2.5 py-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <Reply className="w-3.5 h-3.5" /> Reply
        </button>
      </div>

      {/* Emoji reactions */}
      <ReactionBar
        replyId={reply.id}
        reactions={reactions}
        userId={userId}
        token={token}
      />

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 mb-1">Report This Reply</h3>
            <p className="text-xs text-slate-500 mb-4">Help keep our community safe. Choose a reason for reporting.</p>
            <div className="space-y-2 mb-4">
              {['Spam', 'Inappropriate content', 'Off-topic', 'Harassment', 'Other'].map(r => (
                <button
                  key={r}
                  onClick={() => setReportReason(r)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${reportReason === r ? 'border-teal-400 bg-teal-50 text-teal-700 font-medium' : 'border-slate-200 hover:border-slate-300 text-slate-700'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Additional details (optional)..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 resize-none h-20"
            />
            <div className="flex gap-2">
              <button
                onClick={handleReport}
                disabled={!reportReason || reporting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button onClick={() => setShowReportModal(false)} className="px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-100 rounded-xl">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

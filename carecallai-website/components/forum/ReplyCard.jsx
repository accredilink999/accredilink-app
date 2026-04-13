'use client'
import { useState } from 'react'
import { Heart, CheckCircle, Edit, Trash2, MoreHorizontal, Reply } from 'lucide-react'
import UserBadge from './UserBadge'
import { timeAgo, canModerate } from '@/lib/forumAuth'

export default function ReplyCard({ reply, currentUser, onLike, onEdit, onDelete, onSolution, onReply, isLiked }) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(reply.content)
  const author = reply.forum_profiles || {}
  const isOwner = currentUser?.id === reply.author_id
  const isMod = canModerate(currentUser?.forum_role)

  const handleSaveEdit = () => {
    onEdit?.(reply.id, editContent)
    setEditing(false)
  }

  return (
    <div className={`bg-white rounded-lg border p-4 ${reply.is_solution ? 'border-green-300 bg-green-50/50' : 'border-slate-200'}`}>
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
          size="sm"
        />
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{timeAgo(reply.created_at)}</span>
          {reply.updated_at && reply.updated_at !== reply.created_at && (
            <span className="italic">(edited)</span>
          )}
          {(isOwner || isMod) && (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="p-1 hover:bg-slate-100 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10 min-w-[140px]">
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
                  {(isOwner || isMod) && (
                    <button onClick={() => { onDelete?.(reply.id); setShowMenu(false) }} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
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
        <div className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {reply.content}
        </div>
      )}

      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100">
        <button
          onClick={() => onLike?.(reply.id)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors ${isLiked ? 'bg-red-50 text-red-600' : 'text-slate-400 hover:bg-slate-100'}`}
        >
          <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
          {reply.like_count || 0}
        </button>
        <button
          onClick={() => onReply?.(reply)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 px-2 py-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <Reply className="w-3.5 h-3.5" /> Reply
        </button>
      </div>
    </div>
  )
}

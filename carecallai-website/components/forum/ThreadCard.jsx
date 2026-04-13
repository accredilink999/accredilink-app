'use client'
import Link from 'next/link'
import { MessageSquare, Eye, Heart, Pin, Lock, CheckCircle } from 'lucide-react'
import UserBadge from './UserBadge'
import { timeAgo } from '@/lib/forumAuth'

export default function ThreadCard({ thread, showCategory = false }) {
  const author = thread.forum_profiles || {}
  const category = thread.forum_categories || {}

  return (
    <Link href={`/forum/${category.slug || 'thread'}/${thread.slug}`}>
      <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-teal-300 hover:shadow-sm transition-all group">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {thread.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
              {thread.is_locked && <Lock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
              <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors truncate">
                {thread.title}
              </h3>
            </div>

            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {thread.content?.replace(/[#*_`>\[\]]/g, '').slice(0, 150)}
            </p>

            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <UserBadge
                username={author.username}
                displayName={author.display_name}
                avatarUrl={author.avatar_url}
                role={author.forum_role}
                size="xs"
                showName={true}
              />
              <span className="text-xs text-slate-400">{timeAgo(thread.created_at)}</span>
              {showCategory && category.name && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{category.name}</span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 text-xs text-slate-400 flex-shrink-0">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              {thread.reply_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {thread.view_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              {thread.like_count || 0}
            </span>
          </div>
        </div>

        {thread.tags?.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {thread.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

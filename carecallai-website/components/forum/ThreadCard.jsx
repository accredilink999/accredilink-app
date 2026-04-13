'use client'
import Link from 'next/link'
import { MessageSquare, Eye, Heart, Pin, Lock } from 'lucide-react'
import UserBadge from './UserBadge'
import { timeAgo } from '@/lib/forumAuth'

export default function ThreadCard({ thread, showCategory = false }) {
  const author = thread.forum_profiles || {}
  const category = thread.forum_categories || {}

  return (
    <Link href={`/forum/${category.slug || 'thread'}/${thread.slug}`}>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 hover:border-teal-300 hover:shadow-md transition-all group">
        <div className="flex items-start gap-3">
          {/* Author avatar */}
          <div className="hidden sm:block flex-shrink-0">
            {author.avatar_url ? (
              <img src={author.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                {(author.display_name || author.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {thread.is_pinned && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                  <Pin className="w-3 h-3" /> Pinned
                </span>
              )}
              {thread.is_locked && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
              {showCategory && category.name && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">{category.name}</span>
              )}
            </div>

            <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-1">
              {thread.title}
            </h3>

            <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
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

              {/* Stats inline on mobile */}
              <div className="flex items-center gap-3 ml-auto">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {thread.reply_count || 0}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Heart className="w-3.5 h-3.5" />
                  {thread.like_count || 0}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400 hidden sm:flex">
                  <Eye className="w-3.5 h-3.5" />
                  {thread.view_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {thread.tags?.length > 0 && (
          <div className="flex gap-1.5 mt-3 flex-wrap ml-0 sm:ml-[52px]">
            {thread.tags.map(tag => (
              <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

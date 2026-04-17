'use client'
import Link from 'next/link'
import { MessageSquare, Eye, Heart, Pin, Lock, Flame } from 'lucide-react'
import UserBadge from './UserBadge'
import StarRank from './StarRank'
import { timeAgo } from '@/lib/forumAuth'

function isHotTopic(thread) {
  const replies = thread.reply_count || 0
  const views = thread.view_count || 0
  const likes = thread.like_count || 0
  // Hot if: 5+ replies, or 50+ views, or 10+ likes, or active in last 24h with 3+ replies
  if (replies >= 10 || views >= 100 || likes >= 10) return true
  if (replies >= 5) {
    const lastReply = thread.last_reply_at ? new Date(thread.last_reply_at) : null
    if (lastReply && (Date.now() - lastReply.getTime()) < 24 * 60 * 60 * 1000) return true
  }
  return false
}

export default function ThreadCard({ thread, showCategory = false }) {
  const author = thread.forum_profiles || {}
  const category = thread.forum_categories || {}
  const hot = isHotTopic(thread)

  return (
    <Link href={`/forum/${category.slug || 'thread'}/${thread.slug}`}>
      <div className={`relative bg-white rounded-2xl border p-4 sm:p-5 hover:shadow-md transition-all group overflow-hidden ${hot ? 'border-orange-300 hover:border-orange-400' : 'border-slate-200 hover:border-teal-300'}`}>
        {/* Fire overlay for hot topics */}
        {hot && (
          <div className="absolute top-0 right-0 pointer-events-none">
            <div className="relative">
              <div className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-bl from-orange-500/15 via-red-500/8 to-transparent rounded-bl-full" />
              <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-orange-500/30">
                <Flame className="w-3 h-3" fill="currentColor" /> HOT
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Author avatar */}
          <div className="hidden sm:flex flex-col items-center flex-shrink-0 gap-1 w-20">
            {author.avatar_url ? (
              <img src={author.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${hot ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-teal-400 to-teal-600'}`}>
                {(author.display_name || author.username || '?')[0].toUpperCase()}
              </div>
            )}
            <span className="text-[10px] font-semibold text-slate-700 text-center leading-tight w-full">{author.display_name || author.username || 'User'}</span>
            {author.forum_role && author.forum_role !== 'user' && (
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${author.forum_role === 'founder' ? 'bg-amber-100 text-amber-700' : author.forum_role === 'admin' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                {author.forum_role === 'founder' ? 'Founder' : author.forum_role === 'admin' ? 'Admin' : 'Mod'}
              </span>
            )}
            <StarRank role={author.forum_role} postCount={author.post_count || 0} />
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

            <h3 className={`font-semibold transition-colors line-clamp-1 ${hot ? 'text-slate-900 group-hover:text-orange-600' : 'text-slate-900 group-hover:text-teal-700'}`}>
              {thread.title}
            </h3>

            <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-3">
              {thread.content?.replace(/[#*_`>\[\]]/g, '').replace(/\n{2,}/g, ' ').slice(0, 300)}
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

              {/* Stats inline */}
              <div className="flex items-center gap-3 ml-auto">
                <span className={`flex items-center gap-1 text-xs ${hot && (thread.reply_count || 0) >= 5 ? 'text-orange-500 font-semibold' : 'text-slate-400'}`}>
                  {hot && (thread.reply_count || 0) >= 5 ? <Flame className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
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

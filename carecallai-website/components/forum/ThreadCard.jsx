'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Eye, Heart, Pin, Lock, Flame, ChevronDown, ChevronUp, Loader2, ExternalLink } from 'lucide-react'
import UserBadge from './UserBadge'
import StarRank from './StarRank'
import { timeAgo } from '@/lib/forumAuth'

function isHotTopic(thread) {
  const replies = thread.reply_count || 0
  const views = thread.view_count || 0
  const likes = thread.like_count || 0
  if (replies >= 10 || views >= 100 || likes >= 10) return true
  if (replies >= 5) {
    const lastReply = thread.last_reply_at ? new Date(thread.last_reply_at) : null
    if (lastReply && (Date.now() - lastReply.getTime()) < 24 * 60 * 60 * 1000) return true
  }
  return false
}

function renderMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/^### (.*$)/gm, '<h4 class="font-semibold text-slate-800 mt-4 mb-2 text-base">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="font-bold text-slate-800 mt-4 mb-2 text-lg">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 class="font-bold text-slate-900 mt-4 mb-2 text-xl">$1</h2>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-teal-300 pl-4 text-slate-500 italic my-3 text-base">$1</blockquote>')
    .replace(/\n/g, '<br/>')
}

export default function ThreadCard({ thread, showCategory = false }) {
  const author = thread.forum_profiles || {}
  const category = thread.forum_categories || {}
  const hot = isHotTopic(thread)
  const [expanded, setExpanded] = useState(false)
  const [preview, setPreview] = useState(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  const togglePreview = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (expanded) {
      setExpanded(false)
      return
    }

    if (preview) {
      setExpanded(true)
      return
    }

    setLoadingPreview(true)
    try {
      const res = await fetch(`/api/forum/threads/${thread.slug}`)
      const data = await res.json()
      if (data.thread) {
        setPreview(data)
        setExpanded(true)
      }
    } catch {}
    finally { setLoadingPreview(false) }
  }

  const threadUrl = `/forum/${category.slug || 'thread'}/${thread.slug}`

  return (
    <div className={`relative bg-white rounded-2xl border transition-all overflow-hidden ${hot ? 'border-orange-300' : expanded ? 'border-teal-300 shadow-lg' : 'border-slate-200 hover:border-teal-300 hover:shadow-sm'}`}>
      {/* Fire overlay for hot topics */}
      {hot && (
        <div className="absolute top-0 right-0 pointer-events-none z-10">
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-24 h-24 bg-gradient-to-bl from-orange-500/15 via-red-500/8 to-transparent rounded-bl-full" />
            <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm shadow-orange-500/30">
              <Flame className="w-3.5 h-3.5" fill="currentColor" /> HOT
            </div>
          </div>
        </div>
      )}

      {/* Main card — clickable to navigate */}
      <Link href={threadUrl} className="block p-5 sm:p-6 group">
        <div className="flex items-start gap-4">
          {/* Author avatar — bigger */}
          <div className="hidden sm:flex flex-col items-center flex-shrink-0 gap-1.5 w-24">
            {author.avatar_url ? (
              <img src={author.avatar_url} alt="" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
            ) : (
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg ${hot ? 'bg-gradient-to-br from-orange-400 to-red-500' : 'bg-gradient-to-br from-teal-400 to-teal-600'} shadow-sm`}>
                {(author.display_name || author.username || '?')[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-700 text-center leading-tight w-full">{author.display_name || author.username || 'User'}</span>
            {author.forum_role && author.forum_role !== 'user' && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${author.forum_role === 'founder' ? 'bg-amber-100 text-amber-700' : author.forum_role === 'admin' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                {author.forum_role === 'founder' ? 'Founder' : author.forum_role === 'admin' ? 'Admin' : 'Mod'}
              </span>
            )}
            <StarRank role={author.forum_role} postCount={author.post_count || 0} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {thread.is_pinned && (
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Pin className="w-3.5 h-3.5" /> Pinned
                </span>
              )}
              {thread.is_locked && (
                <span className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  <Lock className="w-3.5 h-3.5" /> Locked
                </span>
              )}
              {showCategory && category.name && (
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">{category.name}</span>
              )}
            </div>

            {/* Title — bigger */}
            <h3 className={`text-lg sm:text-xl font-bold transition-colors line-clamp-2 leading-snug ${hot ? 'text-slate-900 group-hover:text-orange-600' : 'text-slate-900 group-hover:text-teal-700'}`}>
              {thread.title}
            </h3>

            {/* Content preview — more lines, bigger text */}
            {!expanded && (
              <p className="text-base text-slate-500 mt-2 leading-relaxed line-clamp-4">
                {thread.content?.replace(/[#*_`>\[\]]/g, '').replace(/\n{2,}/g, ' ').slice(0, 500)}
              </p>
            )}

            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <UserBadge
                username={author.username}
                displayName={author.display_name}
                avatarUrl={author.avatar_url}
                role={author.forum_role}
                size="xs"
                showName={true}
              />
              <span className="text-sm text-slate-400">{timeAgo(thread.created_at)}</span>

              {/* Stats inline — bigger */}
              <div className="flex items-center gap-4 ml-auto">
                <span className={`flex items-center gap-1.5 text-sm ${hot && (thread.reply_count || 0) >= 5 ? 'text-orange-500 font-semibold' : 'text-slate-400'}`}>
                  {hot && (thread.reply_count || 0) >= 5 ? <Flame className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  {thread.reply_count || 0}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Heart className="w-4 h-4" />
                  {thread.like_count || 0}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-slate-400 hidden sm:flex">
                  <Eye className="w-4 h-4" />
                  {thread.view_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {thread.tags?.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap ml-0 sm:ml-[112px]">
            {thread.tags.map(tag => (
              <span key={tag} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Expand/Collapse button — bigger */}
      <div className="border-t border-slate-100 px-5 py-2.5 flex items-center justify-between">
        <button
          onClick={togglePreview}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-teal-600 transition-colors py-1"
        >
          {loadingPreview ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
          ) : expanded ? (
            <><ChevronUp className="w-4 h-4" /> Collapse</>
          ) : (
            <><ChevronDown className="w-4 h-4" /> Preview thread</>
          )}
        </button>
        <Link
          href={threadUrl}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-teal-600 transition-colors py-1"
        >
          Open full thread <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Expanded preview — bigger content */}
      {expanded && preview && (
        <div className="border-t-2 border-teal-200 bg-slate-50/80">
          {/* Thread content */}
          <div className="px-6 sm:px-8 py-6">
            <div
              className="prose prose-slate max-w-none text-base text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(preview.thread?.content || thread.content) }}
            />
          </div>

          {/* Replies */}
          {preview.replies?.length > 0 && (
            <div className="border-t border-slate-200/60">
              <div className="px-6 sm:px-8 py-3 bg-slate-100/60">
                <span className="text-sm font-semibold text-slate-500">
                  {preview.replies.length} {preview.replies.length === 1 ? 'Reply' : 'Replies'}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {preview.replies.slice(0, 5).map(reply => {
                  const replyAuthor = reply.forum_profiles || {}
                  return (
                    <div key={reply.id} className="px-6 sm:px-8 py-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        {replyAuthor.avatar_url ? (
                          <img src={replyAuthor.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-xs font-bold">
                            {(replyAuthor.display_name || replyAuthor.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-slate-700">{replyAuthor.display_name || replyAuthor.username || 'User'}</span>
                        {replyAuthor.forum_role && replyAuthor.forum_role !== 'user' && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${replyAuthor.forum_role === 'founder' ? 'bg-amber-100 text-amber-700' : replyAuthor.forum_role === 'admin' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                            {replyAuthor.forum_role === 'founder' ? 'Founder' : replyAuthor.forum_role === 'admin' ? 'Admin' : 'Mod'}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{timeAgo(reply.created_at)}</span>
                      </div>
                      <div
                        className="text-base text-slate-600 leading-relaxed ml-10"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.content) }}
                      />
                    </div>
                  )
                })}
                {preview.replies.length > 5 && (
                  <div className="px-6 sm:px-8 py-4 text-center">
                    <Link
                      href={threadUrl}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                      View all {preview.replies.length} replies →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

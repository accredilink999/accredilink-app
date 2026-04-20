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
    .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-xs">$1</code>')
    .replace(/^### (.*$)/gm, '<h4 class="font-semibold text-slate-800 mt-3 mb-1">$1</h4>')
    .replace(/^## (.*$)/gm, '<h3 class="font-bold text-slate-800 mt-3 mb-1">$1</h3>')
    .replace(/^# (.*$)/gm, '<h2 class="font-bold text-slate-900 mt-3 mb-1 text-lg">$1</h2>')
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-3 border-teal-300 pl-3 text-slate-500 italic my-2">$1</blockquote>')
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
    <div className={`relative bg-white rounded-2xl border transition-all overflow-hidden ${hot ? 'border-orange-300' : expanded ? 'border-teal-300 shadow-md' : 'border-slate-200 hover:border-teal-300'}`}>
      {/* Fire overlay for hot topics */}
      {hot && (
        <div className="absolute top-0 right-0 pointer-events-none z-10">
          <div className="relative">
            <div className="absolute -top-1 -right-1 w-20 h-20 bg-gradient-to-bl from-orange-500/15 via-red-500/8 to-transparent rounded-bl-full" />
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm shadow-orange-500/30">
              <Flame className="w-3 h-3" fill="currentColor" /> HOT
            </div>
          </div>
        </div>
      )}

      {/* Main card — clickable to navigate */}
      <Link href={threadUrl} className="block p-4 sm:p-5 group">
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

            {!expanded && (
              <p className="text-sm text-slate-500 mt-1 leading-relaxed line-clamp-3">
                {thread.content?.replace(/[#*_`>\[\]]/g, '').replace(/\n{2,}/g, ' ').slice(0, 300)}
              </p>
            )}

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
      </Link>

      {/* Expand/Collapse button */}
      <div className="border-t border-slate-100 px-4 py-1.5 flex items-center justify-between">
        <button
          onClick={togglePreview}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-teal-600 transition-colors py-1"
        >
          {loadingPreview ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</>
          ) : expanded ? (
            <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
          ) : (
            <><ChevronDown className="w-3.5 h-3.5" /> Preview thread</>
          )}
        </button>
        <Link
          href={threadUrl}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors py-1"
        >
          Open full thread <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Expanded preview */}
      {expanded && preview && (
        <div className="border-t border-teal-200 bg-slate-50/80">
          {/* Thread content */}
          <div className="px-5 py-4">
            <div
              className="prose prose-sm prose-slate max-w-none text-sm text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(preview.thread?.content || thread.content) }}
            />
          </div>

          {/* Replies */}
          {preview.replies?.length > 0 && (
            <div className="border-t border-slate-200/60">
              <div className="px-5 py-2 bg-slate-100/60">
                <span className="text-xs font-semibold text-slate-500">
                  {preview.replies.length} {preview.replies.length === 1 ? 'Reply' : 'Replies'}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {preview.replies.slice(0, 5).map(reply => {
                  const replyAuthor = reply.forum_profiles || {}
                  return (
                    <div key={reply.id} className="px-5 py-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        {replyAuthor.avatar_url ? (
                          <img src={replyAuthor.avatar_url} alt="" className="w-6 h-6 rounded-lg object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-[9px] font-bold">
                            {(replyAuthor.display_name || replyAuthor.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-slate-700">{replyAuthor.display_name || replyAuthor.username || 'User'}</span>
                        {replyAuthor.forum_role && replyAuthor.forum_role !== 'user' && (
                          <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${replyAuthor.forum_role === 'founder' ? 'bg-amber-100 text-amber-700' : replyAuthor.forum_role === 'admin' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>
                            {replyAuthor.forum_role === 'founder' ? 'Founder' : replyAuthor.forum_role === 'admin' ? 'Admin' : 'Mod'}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">{timeAgo(reply.created_at)}</span>
                      </div>
                      <div
                        className="text-sm text-slate-600 leading-relaxed ml-8"
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(reply.content) }}
                      />
                    </div>
                  )
                })}
                {preview.replies.length > 5 && (
                  <div className="px-5 py-3 text-center">
                    <Link
                      href={threadUrl}
                      className="text-xs font-medium text-teal-600 hover:text-teal-700"
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

'use client'
import { useState } from 'react'
import { SmilePlus } from 'lucide-react'

const EMOJIS = [
  { emoji: '👍', label: 'thumbsup' },
  { emoji: '❤️', label: 'heart' },
  { emoji: '😂', label: 'laugh' },
  { emoji: '🤔', label: 'thinking' },
  { emoji: '👏', label: 'clap' },
  { emoji: '🚀', label: 'rocket' },
]

export default function ReactionBar({ threadId, replyId, reactions = [], userId, token }) {
  const [showPicker, setShowPicker] = useState(false)
  const [localReactions, setLocalReactions] = useState(reactions)
  const [toggling, setToggling] = useState(false)

  // Group reactions by emoji
  const grouped = {}
  localReactions.forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, count: 0, userReacted: false }
    grouped[r.emoji].count++
    if (r.user_id === userId) grouped[r.emoji].userReacted = true
  })

  const handleToggle = async (emoji) => {
    if (toggling || !token) return
    setToggling(true)
    setShowPicker(false)

    try {
      const res = await fetch('/api/forum/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, threadId, replyId, emoji }),
      })
      const data = await res.json()

      if (data.action === 'added') {
        setLocalReactions(prev => [...prev, { emoji, user_id: userId, thread_id: threadId, reply_id: replyId }])
      } else if (data.action === 'removed') {
        setLocalReactions(prev => prev.filter(r => !(r.emoji === emoji && r.user_id === userId)))
      }
    } catch {}
    setToggling(false)
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
      {Object.values(grouped).map(g => (
        <button
          key={g.emoji}
          onClick={() => handleToggle(g.emoji)}
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
            g.userReacted
              ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
              : 'bg-white/[0.04] border-white/10 text-slate-400 hover:bg-white/[0.08]'
          }`}
        >
          <span>{g.emoji}</span>
          <span className="font-medium">{g.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1.5 rounded-full text-slate-500 hover:text-teal-400 hover:bg-white/[0.06] transition-colors"
          title="Add reaction"
        >
          <SmilePlus className="w-4 h-4" />
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 bg-slate-800 border border-white/20 rounded-xl p-1.5 flex gap-0.5 shadow-xl z-20">
            {EMOJIS.map(e => (
              <button
                key={e.label}
                onClick={() => handleToggle(e.emoji)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-lg transition-colors"
                title={e.label}
              >
                {e.emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

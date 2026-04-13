'use client'
import { useState } from 'react'
import { Send, X } from 'lucide-react'

export default function ReplyEditor({ onSubmit, replyingTo, onCancelReply, placeholder = 'Write a reply...' }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(content, replyingTo?.id)
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-4">
      {replyingTo && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600">
          <span>Replying to <strong>{replyingTo.forum_profiles?.username || 'user'}</strong></span>
          <button type="button" onClick={onCancelReply} className="ml-auto text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y min-h-[100px]"
      />
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-slate-400">Markdown supported</p>
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Posting...' : 'Post Reply'}
        </button>
      </div>
    </form>
  )
}

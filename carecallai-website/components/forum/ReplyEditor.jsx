'use client'
import { useState, useRef, useCallback } from 'react'
import { Send, X, Bold, Italic, Code, Quote, Image, Paperclip, Link, Loader2 } from 'lucide-react'
import { useForum } from '@/lib/forumContext'

export default function ReplyEditor({ onSubmit, replyingTo, onCancelReply, placeholder = 'Write a reply...' }) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const { token } = useForum()

  // @mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionResults, setMentionResults] = useState([])
  const [mentionIdx, setMentionIdx] = useState(0)
  const [mentionPos, setMentionPos] = useState(null)
  const mentionTimeout = useRef(null)

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

  const insertAtCursor = (before, after = '') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    const newText = content.slice(0, start) + before + selected + after + content.slice(end)
    setContent(newText)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = ta.selectionEnd = start + before.length + selected.length + after.length
    }, 0)
  }

  const handleFormat = (type) => {
    switch (type) {
      case 'bold': insertAtCursor('**', '**'); break
      case 'italic': insertAtCursor('*', '*'); break
      case 'code': insertAtCursor('`', '`'); break
      case 'quote': insertAtCursor('> '); break
      case 'link':
        const url = prompt('Enter URL:')
        if (url) insertAtCursor(`[`, `](${url})`)
        break
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    if (file.size > 10 * 1024 * 1024) { alert('File must be under 10MB'); return }

    setUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const res = await fetch('/api/forum/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            file: reader.result,
            fileName: file.name,
            fileType: file.type,
          }),
        })
        const data = await res.json()
        if (data.markdown) {
          const ta = textareaRef.current
          const pos = ta ? ta.selectionStart : content.length
          setContent(prev => prev.slice(0, pos) + '\n' + data.markdown + '\n' + prev.slice(pos))
        } else if (data.error) {
          alert(data.error)
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Detect @mention typing
  const handleContentChange = useCallback((e) => {
    const val = e.target.value
    setContent(val)

    const ta = e.target
    const cursor = ta.selectionStart
    const textBefore = val.slice(0, cursor)
    const atMatch = textBefore.match(/@([a-z0-9_-]*)$/i)

    if (atMatch) {
      const query = atMatch[1]
      setMentionPos(cursor - query.length - 1)
      setMentionQuery(query)
      setMentionIdx(0)

      if (mentionTimeout.current) clearTimeout(mentionTimeout.current)
      if (query.length >= 1) {
        mentionTimeout.current = setTimeout(async () => {
          try {
            const res = await fetch(`/api/forum/members?q=${encodeURIComponent(query)}`)
            const data = await res.json()
            setMentionResults(data.members || [])
          } catch { setMentionResults([]) }
        }, 200)
      } else {
        setMentionResults([])
      }
    } else {
      setMentionQuery(null)
      setMentionResults([])
    }
  }, [])

  const insertMention = (username) => {
    if (mentionPos === null) return
    const before = content.slice(0, mentionPos)
    const after = content.slice(textareaRef.current?.selectionStart || content.length)
    const newContent = before + '@' + username + ' ' + after
    setContent(newContent)
    setMentionQuery(null)
    setMentionResults([])
    setTimeout(() => {
      const ta = textareaRef.current
      if (ta) {
        const pos = (before + '@' + username + ' ').length
        ta.focus()
        ta.selectionStart = ta.selectionEnd = pos
      }
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (mentionResults.length > 0 && mentionQuery !== null) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIdx(i => Math.min(i + 1, mentionResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIdx(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(mentionResults[mentionIdx].username)
      } else if (e.key === 'Escape') {
        setMentionQuery(null)
        setMentionResults([])
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 border-b border-teal-100 text-sm text-teal-700">
          <span>Replying to <strong>{replyingTo.forum_profiles?.username || 'user'}</strong></span>
          <button type="button" onClick={onCancelReply} className="ml-auto text-teal-400 hover:text-teal-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formatting toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
        <button type="button" onClick={() => handleFormat('bold')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors" title="Bold">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => handleFormat('italic')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors" title="Italic">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => handleFormat('code')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors" title="Code">
          <Code className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => handleFormat('quote')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors" title="Quote">
          <Quote className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => handleFormat('link')} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors" title="Link">
          <Link className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-slate-200 mx-1" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
          title="Upload image"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Image className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={() => { fileInputRef.current?.setAttribute('accept', '*/*'); fileInputRef.current?.click() }}
          disabled={uploading}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded transition-colors"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={4}
          className="w-full p-4 text-sm focus:outline-none resize-y min-h-[100px] border-0"
        />

        {/* @mention autocomplete dropdown */}
        {mentionQuery !== null && mentionResults.length > 0 && (
          <div className="absolute left-4 bottom-2 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-20 min-w-[220px] max-h-[200px] overflow-y-auto">
            {mentionResults.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => insertMention(m.username)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${i === mentionIdx ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50 text-slate-700'}`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                  {(m.display_name || m.username || '?')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.display_name || m.username}</p>
                  <p className="text-[10px] text-slate-400">@{m.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400">Supports **bold**, *italic*, `code`, @mentions, [links](url)</p>
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-lg hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Posting...' : 'Post Reply'}
        </button>
      </div>
    </form>
  )
}

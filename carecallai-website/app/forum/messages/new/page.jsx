'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import { Send, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function ComposeForm() {
  const searchParams = useSearchParams()
  const defaultTo = searchParams.get('to') || ''
  const { user, profile, token, loading, logout } = useForum()
  const router = useRouter()
  const [recipient, setRecipient] = useState(defaultTo)
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/forum/login')
  }, [loading, user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!recipient.trim() || !content.trim()) {
      setError('Recipient and message are required')
      return
    }
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/forum/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, recipientUsername: recipient.trim().replace('@', ''), content: content.trim() }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      router.push(`/forum/messages/${recipient.trim().replace('@', '')}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen ">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href="/forum/messages" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-teal-400 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to messages
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-6">New Message</h1>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">To</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-y"
                placeholder="Write your message..."
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function NewMessagePage() {
  return (
    <Suspense fallback={<div className="min-h-screen  flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div></div>}>
      <ComposeForm />
    </Suspense>
  )
}

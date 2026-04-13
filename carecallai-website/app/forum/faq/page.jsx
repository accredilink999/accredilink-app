'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageSquare, Send, HelpCircle, ArrowLeft, Heart, User, Loader2, LogIn } from 'lucide-react'
import { timeAgo } from '@/lib/forumAuth'

export default function CustomerFAQPage() {
  const [thread, setThread] = useState(null)
  const [replies, setReplies] = useState([])
  const [loadingThread, setLoadingThread] = useState(true)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFAQ()
    // Load saved customer info
    try {
      const saved = localStorage.getItem('forum-customer')
      if (saved) {
        const data = JSON.parse(saved)
        setCustomerName(data.name || '')
        setCustomerEmail(data.email || '')
      }
    } catch {}
  }, [])

  const fetchFAQ = async () => {
    try {
      const res = await fetch('/api/forum/faq')
      const data = await res.json()
      if (data.thread) {
        setThread(data.thread)
        setReplies(data.replies || [])
      }
    } catch {} finally { setLoadingThread(false) }
  }

  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    if (!customerName.trim() || !customerEmail.trim() || !question.trim()) {
      setError('Please fill in all fields')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/forum/faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerName.trim(),
          email: customerEmail.trim(),
          question: question.trim(),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      // Save customer info
      try {
        localStorage.setItem('forum-customer', JSON.stringify({ name: customerName, email: customerEmail }))
      } catch {}
      setSubmitted(true)
      setQuestion('')
      // Refresh to show new question
      fetchFAQ()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-sm">
              <img src="/logo-icon.png" alt="CareCall AI" className="w-6 h-6 rounded-md" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">CareCall<span className="text-teal-600">AI</span></span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Customer FAQ</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-500 hover:text-teal-600">Back to Site</Link>
            <Link href="/demo" className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
              Book a Demo
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Customer FAQ</h1>
                <p className="text-teal-200/70 text-sm">Common questions from care professionals considering CareCall AI</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mt-3 max-w-2xl">
              Browse answers to frequently asked questions, or submit your own question below.
              Our team and community admins will respond as quickly as possible.
            </p>
          </div>
        </div>

        {/* FAQ Content */}
        {loadingThread ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
          </div>
        ) : thread ? (
          <>
            {/* Main FAQ post */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-3">{thread.title}</h2>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {thread.content}
              </div>
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                <span>By CareCall AI Team</span>
                <span>{timeAgo(thread.created_at)}</span>
                <span>{replies.length} {replies.length === 1 ? 'answer' : 'answers'}</span>
              </div>
            </div>

            {/* Replies / Q&A */}
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" />
              Questions & Answers ({replies.length})
            </h3>

            <div className="space-y-3 mb-8">
              {replies.map(reply => {
                const author = reply.forum_profiles || {}
                const isAdmin = ['founder', 'admin', 'moderator'].includes(author.forum_role)
                return (
                  <div key={reply.id} className={`rounded-2xl border p-5 ${isAdmin ? 'bg-teal-50/50 border-teal-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${isAdmin ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                        {author.avatar_url ? (
                          <img src={author.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                        ) : (
                          (author.display_name || author.username || 'C')[0].toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-slate-900">{author.display_name || author.username || 'Customer'}</span>
                          {isAdmin && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-teal-100 text-teal-700 border border-teal-200">
                              CareCall AI Team
                            </span>
                          )}
                          {reply.is_customer_question && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                              Customer Question
                            </span>
                          )}
                          <span className="text-xs text-slate-400">{timeAgo(reply.created_at)}</span>
                        </div>
                        <div className="text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-wrap">
                          {reply.content}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {replies.length === 0 && (
                <div className="text-center py-8 bg-white rounded-2xl border border-slate-200">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No questions yet. Be the first to ask!</p>
                </div>
              )}
            </div>

            {/* Ask a question */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-500" />
                Ask a Question
              </h3>

              {submitted && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-teal-800 font-medium">Thank you for your question!</p>
                  <p className="text-xs text-teal-600 mt-1">Our team will review and respond as soon as possible. You can check back here for the answer.</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmitQuestion} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Your Email</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                      placeholder="jane@carecompany.co.uk"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Your Question</label>
                  <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-y"
                    placeholder="What would you like to know about CareCall AI?"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400">Your question will be reviewed before appearing publicly.</p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? 'Submitting...' : 'Submit Question'}
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">FAQ coming soon</p>
            <p className="text-sm text-slate-400 mt-1">Our team is preparing the FAQ content. Check back soon!</p>
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-10 py-8">
          <p className="text-slate-500 text-sm mb-4">Ready to try CareCall AI for your organisation?</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/demo" className="px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors shadow-sm">
              Book a Demo
            </Link>
            <Link href="/signup" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

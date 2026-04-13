'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import { Send, ArrowLeft, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function NewThreadForm() {
  const searchParams = useSearchParams()
  const defaultCategory = searchParams.get('category') || ''
  const { user, profile, token, loading, categories, logout } = useForum()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categorySlug, setCategorySlug] = useState(defaultCategory)
  const [tags, setTags] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !categorySlug) {
      setError('Title, content, and category are required')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          categorySlug,
          title: title.trim(),
          content: content.trim(),
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      router.push(`/forum/${categorySlug}/${data.thread.slug}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <>
        <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <p className="text-slate-500">You need to <Link href="/forum/login" className="text-teal-600 font-medium">sign in</Link> to create a thread.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link href="/forum" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-teal-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to forum
        </Link>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-slate-900 mb-6">Create New Thread</h1>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <select
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">Select a category...</option>
                {categories.filter(c => !c.is_locked || ['founder', 'admin'].includes(profile.forum_role)).map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="What's your thread about?"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-y min-h-[200px]"
                placeholder="Write your message here... Markdown is supported."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tags (optional)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="e.g. rota, compliance, eMAR (comma separated)"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

export default function NewThreadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div></div>}>
      <NewThreadForm />
    </Suspense>
  )
}

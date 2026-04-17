'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import ForumSidebar from '@/components/forum/ForumSidebar'
import BookingWidget from '@/components/forum/BookingWidget'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function BookingPage() {
  const { user, profile, token, loading, categories, logout } = useForum()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push('/forum/login')
  }, [loading, user])

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
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <ForumSidebar categories={categories} profile={profile} />
          <main className="flex-1 min-w-0">
            <Link href="/forum" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-teal-400 mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to forum
            </Link>
            <BookingWidget token={token} userId={user?.id} profile={profile} />
          </main>
        </div>
      </div>
    </div>
  )
}

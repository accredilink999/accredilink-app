'use client'
import { useState, useEffect, use } from 'react'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import UserBadge from '@/components/forum/UserBadge'
import ThreadCard from '@/components/forum/ThreadCard'
import { timeAgo } from '@/lib/forumAuth'
import { Calendar, MessageSquare, Heart, User } from 'lucide-react'

export default function ProfilePage({ params }) {
  const { username } = use(params)
  const { user, profile: myProfile, token, loading, logout } = useForum()
  const [profileData, setProfileData] = useState(null)
  const [threads, setThreads] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [username])

  const fetchProfile = async () => {
    setLoadingProfile(true)
    try {
      const res = await fetch(`/api/forum/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-public-profile', username }),
      })
      const data = await res.json()
      if (data.profile) {
        setProfileData(data.profile)
        // Fetch user's threads
        const threadRes = await fetch(`/api/forum/threads?authorId=${data.profile.id}&sort=newest`)
        const threadData = await threadRes.json()
        setThreads(threadData.threads || [])
      }
    } catch {} finally { setLoadingProfile(false) }
  }

  if (loading || loadingProfile) {
    return (
      <>
        <ForumHeader user={user} profile={myProfile} token={token} onLogout={logout} />
        <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      </>
    )
  }

  if (!profileData) {
    return (
      <>
        <ForumHeader user={user} profile={myProfile} token={token} onLogout={logout} />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">User not found</p>
        </div>
      </>
    )
  }

  return (
    <>
      <ForumHeader user={user} profile={myProfile} token={token} onLogout={logout} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <UserBadge
              username={profileData.username}
              displayName={profileData.display_name}
              avatarUrl={profileData.avatar_url}
              role={profileData.forum_role}
              size="lg"
              showName={false}
              linkToProfile={false}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{profileData.display_name || profileData.username}</h1>
                <UserBadge username={profileData.username} role={profileData.forum_role} showName={false} linkToProfile={false} size="xs" />
              </div>
              <p className="text-sm text-slate-500">@{profileData.username}</p>
              {profileData.bio && <p className="text-sm text-slate-600 mt-2">{profileData.bio}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-slate-100">
            <div className="text-center">
              <p className="text-lg font-bold text-teal-600">{profileData.thread_count || 0}</p>
              <p className="text-xs text-slate-400">Threads</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-teal-600">{profileData.post_count || 0}</p>
              <p className="text-xs text-slate-400">Posts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-teal-600">{profileData.reputation || 0}</p>
              <p className="text-xs text-slate-400">Reputation</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">{profileData.created_at ? timeAgo(profileData.created_at) : '-'}</p>
              <p className="text-xs text-slate-400">Joined</p>
            </div>
          </div>
        </div>

        {/* User's threads */}
        <h2 className="font-semibold text-lg text-slate-900 mb-4">Recent Threads</h2>
        <div className="space-y-2">
          {threads.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500 text-sm">No threads yet</p>
            </div>
          ) : (
            threads.map(thread => (
              <ThreadCard key={thread.id} thread={thread} showCategory />
            ))
          )}
        </div>
      </div>
    </>
  )
}

'use client'
import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import UserBadge from '@/components/forum/UserBadge'
import ThreadCard from '@/components/forum/ThreadCard'
import { timeAgo, getRoleBadge } from '@/lib/forumAuth'
import { Calendar, MessageSquare, Heart, User, Camera, Check, Loader2 } from 'lucide-react'

export default function ProfilePage({ params }) {
  const { username } = use(params)
  const { user, profile: myProfile, token, loading, logout, refreshProfile } = useForum()
  const router = useRouter()
  const [profileData, setProfileData] = useState(null)
  const [threads, setThreads] = useState([])
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [editingBio, setEditingBio] = useState(false)
  const [bio, setBio] = useState('')
  const fileInputRef = useRef(null)

  const isOwnProfile = user?.id === profileData?.id

  useEffect(() => {
    if (!loading && !user) { router.push('/forum/login'); return }
    if (user) fetchProfile()
  }, [loading, user, username])

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
        setBio(data.profile.bio || '')
        const threadRes = await fetch(`/api/forum/threads?authorId=${data.profile.id}&sort=newest`)
        const threadData = await threadRes.json()
        setThreads(threadData.threads || [])
      }
    } catch {} finally { setLoadingProfile(false) }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB')
      return
    }

    setUploading(true)
    try {
      // Convert to base64 and upload via API
      const reader = new FileReader()
      reader.onload = async () => {
        const res = await fetch('/api/forum/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'update-avatar', avatar: reader.result }),
        })
        const data = await res.json()
        if (data.avatarUrl) {
          setProfileData(prev => ({ ...prev, avatar_url: data.avatarUrl }))
          if (refreshProfile) await refreshProfile()
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setUploading(false)
    }
  }

  const handleSaveBio = async () => {
    if (!token) return
    await fetch('/api/forum/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'update-bio', bio }),
    })
    setProfileData(prev => ({ ...prev, bio }))
    setEditingBio(false)
  }

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        <ForumHeader user={user} profile={myProfile} token={token} onLogout={logout} />
        <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
        <ForumHeader user={user} profile={myProfile} token={token} onLogout={logout} />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">User not found</p>
        </div>
      </div>
    )
  }

  const badge = getRoleBadge(profileData.forum_role)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
      <ForumHeader user={user} profile={myProfile} token={token} onLogout={logout} />

      {/* Profile header with gradient */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="flex items-start gap-5">
            {/* Avatar with upload */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-3xl overflow-hidden shadow-xl shadow-teal-500/20">
                {profileData.avatar_url ? (
                  <img src={profileData.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{(profileData.display_name || profileData.username || '?')[0].toUpperCase()}</span>
                )}
              </div>
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{profileData.display_name || profileData.username}</h1>
                {badge && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${badge.color}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              <p className="text-teal-300/70 text-sm mt-0.5">@{profileData.username}</p>

              {editingBio ? (
                <div className="mt-3 flex gap-2">
                  <input
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={200}
                    className="flex-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                    placeholder="Tell the community about yourself..."
                  />
                  <button onClick={handleSaveBio} className="px-3 py-1.5 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600">
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-2">
                  {profileData.bio ? (
                    <p className="text-sm text-slate-300">{profileData.bio}</p>
                  ) : isOwnProfile ? (
                    <button onClick={() => setEditingBio(true)} className="text-xs text-teal-400 hover:text-teal-300">
                      + Add a bio
                    </button>
                  ) : null}
                  {isOwnProfile && profileData.bio && (
                    <button onClick={() => setEditingBio(true)} className="text-xs text-teal-400 hover:text-teal-300 ml-2">
                      Edit
                    </button>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.07] rounded-xl">
                  <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-sm font-semibold text-white">{profileData.thread_count || 0}</span>
                  <span className="text-xs text-slate-400">threads</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.07] rounded-xl">
                  <Heart className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-sm font-semibold text-white">{profileData.reputation || 0}</span>
                  <span className="text-xs text-slate-400">reputation</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.07] rounded-xl">
                  <Calendar className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-xs text-slate-400">Joined {profileData.created_at ? timeAgo(profileData.created_at) : '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="font-bold text-lg text-white mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-teal-600" />
          Recent Threads
        </h2>
        <div className="space-y-3">
          {threads.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm">No threads yet</p>
            </div>
          ) : (
            threads.map(thread => (
              <ThreadCard key={thread.id} thread={thread} showCategory />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

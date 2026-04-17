'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import { Camera, Loader2, Check, User, Bell, Shield, Save, Mail } from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, token, loading, logout, refreshProfile } = useForum()
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Profile fields
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState('')

  // Notification prefs
  const [notifyReplies, setNotifyReplies] = useState(true)
  const [notifyLikes, setNotifyLikes] = useState(true)
  const [notifyMentions, setNotifyMentions] = useState(true)
  const [notifyPMs, setNotifyPMs] = useState(true)

  // Privacy
  const [showOnline, setShowOnline] = useState(true)

  useEffect(() => {
    if (!loading && !user) { router.push('/forum/login'); return }
    if (profile) {
      setDisplayName(profile.display_name || '')
      setBio(profile.bio || '')
      setAvatarPreview(profile.avatar_url || '')
      setNotifyReplies(profile.notify_replies !== false)
      setNotifyLikes(profile.notify_likes !== false)
      setNotifyMentions(profile.notify_mentions !== false)
      setNotifyPMs(profile.notify_pms !== false)
      setShowOnline(profile.show_online !== false)
    }
  }, [loading, user, profile])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !token) return
    if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2MB'); return }

    setUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const res = await fetch('/api/forum/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'update-avatar', avatar: reader.result }),
        })
        const data = await res.json()
        if (data.avatarUrl) {
          setAvatarPreview(data.avatarUrl)
          if (refreshProfile) await refreshProfile()
        }
      } catch {} finally { setUploading(false) }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await Promise.all([
        fetch('/api/forum/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'update-display-name', displayName }),
        }),
        fetch('/api/forum/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'update-bio', bio }),
        }),
      ])
      if (refreshProfile) await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {} finally { setSaving(false) }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/forum/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action: 'update-preferences',
          notify_replies: notifyReplies,
          notify_likes: notifyLikes,
          notify_mentions: notifyMentions,
          notify_pms: notifyPMs,
          show_online: showOnline,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {} finally { setSaving(false) }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ]

  return (
    <div className="min-h-screen ">
      <ForumHeader user={user} profile={profile} token={token} onLogout={logout} />

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Account Settings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 mb-6">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium flex-1 justify-center transition-all ${tab === t.id ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Success message */}
        {saved && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-sm">
            <Check className="w-4 h-4" /> Settings saved successfully
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            {/* Avatar */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">Profile Photo</label>
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-md">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      (displayName || profile?.username || '?')[0].toUpperCase()
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                  >
                    {uploading ? 'Uploading...' : 'Upload new photo'}
                  </button>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400"
                placeholder="Your display name"
              />
            </div>

            {/* Username (readonly) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                value={profile?.username || ''}
                disabled
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-500"
              />
              <p className="text-xs text-slate-400 mt-1">Username cannot be changed</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 resize-y"
                placeholder="Tell the community about yourself..."
              />
              <p className="text-xs text-slate-400 mt-1">{bio.length}/200 characters</p>
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">{user?.email || ''}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Managed through your CareCall AI account</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {tab === 'notifications' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-1">Email Notifications</h2>
            <p className="text-sm text-slate-500 mb-6">Choose which email notifications you receive from the forum.</p>

            <div className="space-y-4">
              <ToggleSetting
                label="Thread Replies"
                description="Get notified when someone replies to your threads"
                checked={notifyReplies}
                onChange={setNotifyReplies}
              />
              <ToggleSetting
                label="Likes"
                description="Get notified when someone likes your posts"
                checked={notifyLikes}
                onChange={setNotifyLikes}
              />
              <ToggleSetting
                label="Mentions"
                description="Get notified when someone mentions you"
                checked={notifyMentions}
                onChange={setNotifyMentions}
              />
              <ToggleSetting
                label="Private Messages"
                description="Get notified when you receive a private message"
                checked={notifyPMs}
                onChange={setNotifyPMs}
              />
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {tab === 'privacy' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-semibold text-slate-900 mb-1">Privacy Settings</h2>
            <p className="text-sm text-slate-500 mb-6">Control your visibility on the forum.</p>

            <div className="space-y-4">
              <ToggleSetting
                label="Show Online Status"
                description="Let other members see when you are online"
                checked={showOnline}
                onChange={setShowOnline}
              />
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100">
              <button
                onClick={handleSaveNotifications}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Privacy Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ToggleSetting({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

import { createClient } from '@supabase/supabase-js'

// Forum client WITH session persistence (unlike the main site client)
let _forumClient = null
export function getForumClient() {
  if (_forumClient) return _forumClient
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (!supabaseUrl || !supabaseAnonKey) return null
  _forumClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'forum-auth',
    },
  })
  return _forumClient
}

// Your user ID for Founder badge
const FOUNDER_ID = '873293fe-b638-4b48-b899-ceb5bae519fb'

export function isFounder(userId) {
  return userId === FOUNDER_ID
}

export function getForumRole(userId, profileRole, orgRole) {
  if (isFounder(userId)) return 'founder'
  if (profileRole === 'super_admin' || profileRole === 'admin') return 'admin'
  if (orgRole === 'owner' || orgRole === 'admin') return 'admin'
  return 'user'
}

export function canModerate(forumRole) {
  return ['founder', 'admin', 'moderator'].includes(forumRole)
}

export function canPostInLocked(forumRole) {
  return ['founder', 'admin', 'moderator'].includes(forumRole)
}

export function getRoleBadge(role) {
  switch (role) {
    case 'founder': return { label: 'Founder', color: 'bg-amber-100 text-amber-800 border-amber-300' }
    case 'admin': return { label: 'Admin', color: 'bg-teal-100 text-teal-800 border-teal-300' }
    case 'moderator': return { label: 'Mod', color: 'bg-purple-100 text-purple-800 border-purple-300' }
    default: return null
  }
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export function timeAgo(date) {
  const now = new Date()
  const d = new Date(date)
  const seconds = Math.floor((now - d) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

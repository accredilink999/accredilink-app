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

// Permission labels for the admin permissions panel
export const PERMISSION_LABELS = {
  pin_threads:       { label: 'Pin Threads',        desc: 'Pin and unpin threads to the top of categories' },
  lock_threads:      { label: 'Lock Threads',       desc: 'Lock and unlock threads to prevent new replies' },
  delete_threads:    { label: 'Delete Threads',     desc: 'Delete any thread regardless of author' },
  edit_any_post:     { label: 'Edit Any Post',      desc: 'Edit thread content and replies from any user' },
  delete_any_reply:  { label: 'Delete Any Reply',   desc: 'Delete replies from any user' },
  bump_threads:      { label: 'Bump Threads',       desc: 'Bump threads to the top of the listing' },
  move_threads:      { label: 'Move Threads',       desc: 'Move threads between categories' },
  ban_users:         { label: 'Ban Users',           desc: 'Ban and unban regular users from the forum' },
  ban_mods:          { label: 'Ban Moderators',      desc: 'Ban and unban moderators' },
  mark_solution:     { label: 'Mark Solution',       desc: 'Mark replies as the accepted solution' },
  post_in_locked:    { label: 'Post in Locked',      desc: 'Reply to threads that are locked' },
  manage_categories: { label: 'Manage Categories',   desc: 'Edit existing category names and descriptions' },
  create_categories: { label: 'Create Categories',   desc: 'Create new forum categories/sections' },
  set_roles:         { label: 'Set User Roles',      desc: 'Promote or demote user roles' },
  view_admin_panel:  { label: 'View Admin Panel',    desc: 'Access the forum admin dashboard' },
}

// Default permissions if DB settings not loaded yet
export const DEFAULT_PERMISSIONS = {
  moderator: {
    pin_threads: true, lock_threads: true, delete_threads: true,
    edit_any_post: true, delete_any_reply: true, bump_threads: true,
    move_threads: true, ban_users: true, mark_solution: true,
    post_in_locked: true, manage_categories: false, create_categories: true,
    view_admin_panel: true, ban_mods: false, set_roles: false,
  },
  admin: {
    pin_threads: true, lock_threads: true, delete_threads: true,
    edit_any_post: true, delete_any_reply: true, bump_threads: true,
    move_threads: true, ban_users: true, ban_mods: true, mark_solution: true,
    post_in_locked: true, manage_categories: true, create_categories: true,
    set_roles: true, view_admin_panel: true,
  },
}

/**
 * Check if a role has a specific permission.
 * Founder always has all permissions.
 */
export function hasPermission(role, permissions, key) {
  if (role === 'founder') return true
  const perms = permissions || DEFAULT_PERMISSIONS
  return !!(perms[role]?.[key])
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

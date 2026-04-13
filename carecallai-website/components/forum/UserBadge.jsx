'use client'
import { getRoleBadge } from '@/lib/forumAuth'

export default function UserBadge({ username, displayName, avatarUrl, role, size = 'sm', showName = true, linkToProfile = true }) {
  const badge = getRoleBadge(role)
  const name = displayName || username
  const initials = (name || '?').slice(0, 2).toUpperCase()

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  const content = (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showName && (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-medium text-slate-900 truncate">{name}</span>
          {badge && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>
      )}
    </div>
  )

  if (linkToProfile && username) {
    return <a href={`/forum/profile/${username}`} className="hover:opacity-80 transition-opacity">{content}</a>
  }

  return content
}

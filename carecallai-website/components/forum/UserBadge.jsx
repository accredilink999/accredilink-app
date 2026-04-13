'use client'
import { getRoleBadge } from '@/lib/forumAuth'

const roleGradients = {
  founder: 'from-amber-400 to-amber-600',
  admin: 'from-teal-400 to-teal-600',
  moderator: 'from-purple-400 to-purple-600',
}

export default function UserBadge({ username, displayName, avatarUrl, role, size = 'sm', showName = true, linkToProfile = true }) {
  const badge = getRoleBadge(role)
  const name = displayName || username
  const initial = (name || '?')[0].toUpperCase()
  const gradient = roleGradients[role] || 'from-slate-400 to-slate-500'

  const sizeClasses = {
    xs: { avatar: 'w-6 h-6', text: 'text-[10px]', nameText: 'text-xs' },
    sm: { avatar: 'w-8 h-8', text: 'text-xs', nameText: 'text-sm' },
    md: { avatar: 'w-10 h-10', text: 'text-sm', nameText: 'text-sm' },
    lg: { avatar: 'w-14 h-14', text: 'text-lg', nameText: 'text-base' },
    xl: { avatar: 'w-20 h-20', text: 'text-2xl', nameText: 'text-lg' },
  }

  const s = sizeClasses[size] || sizeClasses.sm

  const content = (
    <div className="flex items-center gap-2">
      <div className={`${s.avatar} rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0 shadow-sm`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className={s.text}>{initial}</span>
        )}
      </div>
      {showName && (
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`font-medium text-slate-900 truncate ${s.nameText}`}>{name}</span>
          {badge && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${badge.color}`}>
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

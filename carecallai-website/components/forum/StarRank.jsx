'use client'

// Star ranking system:
// Founder: 6 red stars (fixed)
// Moderator: 4 gold stars (fixed)
// Admin: 5 teal stars (fixed)
// Regular users earn stars by posting:
//   0 posts: 1 silver star
//   10+ posts: 2 silver stars
//   25+ posts: 3 silver stars
//   50+ posts: 1 gold star
//   100+ posts: 2 gold stars
//   250+ posts: 3 gold stars
//   500+ posts: 4 gold stars

function getStarConfig(role, postCount = 0) {
  if (role === 'founder') {
    return { count: 6, color: 'text-red-500', fill: '#ef4444', label: 'Founder' }
  }
  if (role === 'admin') {
    return { count: 5, color: 'text-teal-500', fill: '#14b8a6', label: 'Admin' }
  }
  if (role === 'moderator') {
    return { count: 4, color: 'text-amber-500', fill: '#f59e0b', label: 'Moderator' }
  }

  // Regular users earn stars by post count
  if (postCount >= 500) return { count: 4, color: 'text-amber-500', fill: '#f59e0b', label: 'Gold IV' }
  if (postCount >= 250) return { count: 3, color: 'text-amber-500', fill: '#f59e0b', label: 'Gold III' }
  if (postCount >= 100) return { count: 2, color: 'text-amber-500', fill: '#f59e0b', label: 'Gold II' }
  if (postCount >= 50) return { count: 1, color: 'text-amber-500', fill: '#f59e0b', label: 'Gold I' }
  if (postCount >= 25) return { count: 3, color: 'text-slate-400', fill: '#94a3b8', label: 'Silver III' }
  if (postCount >= 10) return { count: 2, color: 'text-slate-400', fill: '#94a3b8', label: 'Silver II' }
  return { count: 1, color: 'text-slate-400', fill: '#94a3b8', label: 'Silver I' }
}

export default function StarRank({ role, postCount = 0, showLabel = false }) {
  const config = getStarConfig(role, postCount)

  return (
    <div className="flex items-center gap-0.5" title={`${config.label} — ${postCount} posts`}>
      {Array.from({ length: config.count }, (_, i) => (
        <svg key={i} className={`w-3 h-3 ${config.color}`} viewBox="0 0 20 20" fill={config.fill}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      {showLabel && (
        <span className={`text-[9px] ml-1 ${config.color} font-medium`}>{config.label}</span>
      )}
    </div>
  )
}

export { getStarConfig }

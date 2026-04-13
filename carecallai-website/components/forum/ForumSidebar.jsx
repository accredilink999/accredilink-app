'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, TrendingUp } from 'lucide-react'

const iconMap = {
  megaphone: '📢', 'help-circle': '❓', bug: '🐛', lightbulb: '💡',
  'message-circle': '💬', star: '⭐', shield: '🛡️', 'clipboard-check': '📋',
}

export default function ForumSidebar({ categories, stats, profile }) {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      {/* New Thread Button */}
      {profile && (
        <Link
          href="/forum/new"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors mb-4"
        >
          <Plus className="w-4 h-4" /> New Thread
        </Link>
      )}

      {/* Categories */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-sm text-slate-900">Categories</h3>
        </div>
        <nav className="py-1">
          <Link
            href="/forum"
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === '/forum' ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <TrendingUp className="w-4 h-4" /> All Categories
          </Link>
          {(categories || []).map(cat => (
            <Link
              key={cat.id}
              href={`/forum/${cat.slug}`}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${pathname === `/forum/${cat.slug}` ? 'bg-teal-50 text-teal-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span className="text-base">{iconMap[cat.icon] || '📁'}</span>
              <span className="truncate">{cat.name}</span>
              <span className="ml-auto text-xs text-slate-400">{cat.thread_count || 0}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white rounded-xl border border-slate-200 mt-4 p-4">
          <h3 className="font-semibold text-sm text-slate-900 mb-3">Forum Stats</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-teal-600">{stats.threads || 0}</p>
              <p className="text-xs text-slate-400">Threads</p>
            </div>
            <div>
              <p className="text-lg font-bold text-teal-600">{stats.replies || 0}</p>
              <p className="text-xs text-slate-400">Replies</p>
            </div>
            <div>
              <p className="text-lg font-bold text-teal-600">{stats.users || 0}</p>
              <p className="text-xs text-slate-400">Members</p>
            </div>
            <div>
              <p className="text-lg font-bold text-teal-600">{stats.categories || 0}</p>
              <p className="text-xs text-slate-400">Categories</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

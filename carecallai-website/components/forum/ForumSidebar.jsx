'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, TrendingUp, Megaphone, HelpCircle, Bug, Lightbulb, MessageCircle, Star, Shield, ClipboardCheck, MessageSquare } from 'lucide-react'

const iconMap = {
  announcements: Megaphone,
  'help-support': HelpCircle,
  'bug-reports': Bug,
  'feature-requests': Lightbulb,
  'general-discussion': MessageCircle,
  'tips-best-practice': Star,
  'ciw-compliance': Shield,
  'cqc-compliance': ClipboardCheck,
}

const colorMap = {
  announcements: 'text-amber-500',
  'help-support': 'text-blue-500',
  'bug-reports': 'text-red-500',
  'feature-requests': 'text-purple-500',
  'general-discussion': 'text-teal-500',
  'tips-best-practice': 'text-emerald-500',
  'ciw-compliance': 'text-rose-500',
  'cqc-compliance': 'text-sky-500',
}

export default function ForumSidebar({ categories, stats, profile }) {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
      {/* New Thread Button */}
      {profile && (
        <Link
          href="/forum/new"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-md shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" /> New Thread
        </Link>
      )}

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-sm text-slate-700">Categories</h3>
        </div>
        <nav className="py-1">
          <Link
            href="/forum"
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${pathname === '/forum' ? 'bg-teal-50 text-teal-700 font-medium border-r-2 border-teal-500' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <TrendingUp className="w-4 h-4" /> All Categories
          </Link>
          {(categories || []).map(cat => {
            const Icon = iconMap[cat.slug] || MessageSquare
            const color = colorMap[cat.slug] || 'text-slate-500'
            const isActive = pathname === `/forum/${cat.slug}`
            return (
              <Link
                key={cat.id}
                href={`/forum/${cat.slug}`}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-teal-50 text-teal-700 font-medium border-r-2 border-teal-500' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : color}`} />
                <span className="truncate flex-1">{cat.name}</span>
                {(cat.thread_count > 0) && (
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{cat.thread_count}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <h3 className="font-semibold text-sm text-slate-700 mb-3">Forum Stats</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-lg font-bold text-teal-600">{stats.threads || 0}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Threads</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-lg font-bold text-teal-600">{stats.categories || 0}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Categories</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

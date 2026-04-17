'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus, TrendingUp, Megaphone, HelpCircle, Bug, Lightbulb, MessageCircle, Star, Shield, ClipboardCheck, MessageSquare, BookOpen } from 'lucide-react'

const iconMap = {
  'user-documentation': BookOpen,
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
  'user-documentation': 'text-indigo-400',
  announcements: 'text-amber-400',
  'help-support': 'text-blue-400',
  'bug-reports': 'text-red-400',
  'feature-requests': 'text-purple-400',
  'general-discussion': 'text-teal-400',
  'tips-best-practice': 'text-emerald-400',
  'ciw-compliance': 'text-rose-400',
  'cqc-compliance': 'text-sky-400',
}

export default function ForumSidebar({ categories, stats, profile }) {
  const pathname = usePathname()

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
      {profile && (
        <Link
          href="/forum/new"
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg shadow-teal-500/20"
        >
          <Plus className="w-4 h-4" /> New Thread
        </Link>
      )}

      <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h3 className="font-semibold text-sm text-slate-300">Categories</h3>
        </div>
        <nav className="py-1">
          <Link
            href="/forum"
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${pathname === '/forum' ? 'bg-teal-500/20 text-teal-300 font-medium border-r-2 border-teal-400' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-300'}`}
          >
            <TrendingUp className="w-4 h-4" /> All Categories
          </Link>
          {(categories || []).map(cat => {
            const Icon = iconMap[cat.slug] || MessageSquare
            const color = colorMap[cat.slug] || 'text-slate-400'
            const isActive = pathname === `/forum/${cat.slug}`
            return (
              <Link
                key={cat.id}
                href={`/forum/${cat.slug}`}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${isActive ? 'bg-teal-500/20 text-teal-300 font-medium border-r-2 border-teal-400' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-300'}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : color}`} />
                <span className="truncate flex-1">{cat.name}</span>
                {(cat.thread_count > 0) && (
                  <span className="text-[10px] font-medium bg-white/10 text-slate-400 px-1.5 py-0.5 rounded-full">{cat.thread_count}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {stats && (
        <div className="bg-white/[0.06] backdrop-blur rounded-2xl border border-white/10 p-4">
          <h3 className="font-semibold text-sm text-slate-300 mb-3">Forum Stats</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white/[0.06] rounded-xl p-3">
              <p className="text-lg font-bold text-teal-400">{stats.threads || 0}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Threads</p>
            </div>
            <div className="bg-white/[0.06] rounded-xl p-3">
              <p className="text-lg font-bold text-teal-400">{stats.categories || 0}</p>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">Categories</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

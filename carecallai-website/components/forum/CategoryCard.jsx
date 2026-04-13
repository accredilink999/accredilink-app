'use client'
import Link from 'next/link'
import { MessageSquare, Eye, Lock } from 'lucide-react'

const iconMap = {
  megaphone: '📢',
  'help-circle': '❓',
  bug: '🐛',
  lightbulb: '💡',
  'message-circle': '💬',
  star: '⭐',
  shield: '🛡️',
  'clipboard-check': '📋',
}

export default function CategoryCard({ category }) {
  const icon = iconMap[category.icon] || '📁'

  return (
    <Link href={`/forum/${category.slug}`}>
      <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-teal-300 hover:shadow-md transition-all group cursor-pointer">
        <div className="flex items-start gap-4">
          <div className="text-3xl flex-shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                {category.name}
              </h3>
              {category.is_locked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
            </div>
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{category.description}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                {category.thread_count || 0} threads
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {category.post_count || 0} posts
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

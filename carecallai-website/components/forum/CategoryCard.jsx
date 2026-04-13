'use client'
import Link from 'next/link'
import { MessageSquare, Lock, Megaphone, HelpCircle, Bug, Lightbulb, MessageCircle, Star, Shield, ClipboardCheck } from 'lucide-react'

const categoryStyles = {
  announcements: { icon: Megaphone, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', border: 'hover:border-amber-300', text: 'text-amber-600' },
  'help-support': { icon: HelpCircle, gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', border: 'hover:border-blue-300', text: 'text-blue-600' },
  'bug-reports': { icon: Bug, gradient: 'from-red-500 to-rose-500', bg: 'bg-red-50', border: 'hover:border-red-300', text: 'text-red-600' },
  'feature-requests': { icon: Lightbulb, gradient: 'from-purple-500 to-violet-500', bg: 'bg-purple-50', border: 'hover:border-purple-300', text: 'text-purple-600' },
  'general-discussion': { icon: MessageCircle, gradient: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50', border: 'hover:border-teal-300', text: 'text-teal-600' },
  'tips-best-practice': { icon: Star, gradient: 'from-emerald-500 to-green-500', bg: 'bg-emerald-50', border: 'hover:border-emerald-300', text: 'text-emerald-600' },
  'ciw-compliance': { icon: Shield, gradient: 'from-rose-500 to-pink-500', bg: 'bg-rose-50', border: 'hover:border-rose-300', text: 'text-rose-600' },
  'cqc-compliance': { icon: ClipboardCheck, gradient: 'from-sky-500 to-blue-500', bg: 'bg-sky-50', border: 'hover:border-sky-300', text: 'text-sky-600' },
}

const defaultStyle = { icon: MessageSquare, gradient: 'from-slate-500 to-slate-600', bg: 'bg-slate-50', border: 'hover:border-slate-300', text: 'text-slate-600' }

export default function CategoryCard({ category }) {
  const style = categoryStyles[category.slug] || defaultStyle
  const Icon = style.icon

  return (
    <Link href={`/forum/${category.slug}`}>
      <div className={`bg-white rounded-2xl border border-slate-200 p-5 ${style.border} hover:shadow-lg transition-all group cursor-pointer relative overflow-hidden`}>
        {/* Subtle gradient overlay */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.gradient} opacity-[0.04] rounded-bl-[100px] transition-opacity group-hover:opacity-[0.08]`} />

        <div className="flex items-start gap-4 relative">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-slate-900 group-hover:${style.text} transition-colors`}>
                {category.name}
              </h3>
              {category.is_locked && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Admins
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">{category.description}</p>
            <div className="flex items-center gap-4 mt-3">
              <span className={`flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
                <MessageSquare className="w-3.5 h-3.5" />
                {category.thread_count || 0} threads
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

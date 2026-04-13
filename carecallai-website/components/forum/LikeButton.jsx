'use client'
import { Heart } from 'lucide-react'

export default function LikeButton({ liked, count = 0, onClick, size = 'sm' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
  }

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full transition-colors ${sizeClasses[size]} ${
        liked ? 'bg-red-50 text-red-600 border border-red-200' : 'text-slate-400 hover:bg-slate-100 border border-transparent'
      }`}
    >
      <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}

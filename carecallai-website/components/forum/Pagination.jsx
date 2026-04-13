'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

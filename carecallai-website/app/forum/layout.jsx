'use client'
import { ForumProvider } from '@/lib/forumContext'

export default function ForumLayout({ children }) {
  return (
    <ForumProvider>
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </ForumProvider>
  )
}

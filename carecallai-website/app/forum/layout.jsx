'use client'
import { ForumProvider } from '@/lib/forumContext'

export default function ForumLayout({ children }) {
  return (
    <ForumProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 relative">
        {/* Watermark logo pattern as the background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'url(/logo-icon.svg)',
            backgroundRepeat: 'repeat',
            backgroundSize: '120px 120px',
            opacity: 0.04,
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </ForumProvider>
  )
}

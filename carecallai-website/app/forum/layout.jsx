'use client'
import { ForumProvider } from '@/lib/forumContext'

export default function ForumLayout({ children }) {
  return (
    <ForumProvider>
      <div className="min-h-screen bg-slate-50 relative">
        {/* Watermark logo */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'url(/logo-icon.svg)',
            backgroundRepeat: 'repeat',
            backgroundSize: '120px 120px',
            opacity: 0.03,
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </ForumProvider>
  )
}

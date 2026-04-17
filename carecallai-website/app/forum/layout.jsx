'use client'
import { ForumProvider } from '@/lib/forumContext'

export default function ForumLayout({ children }) {
  return (
    <ForumProvider>
      <div className="min-h-screen relative">
        {children}
        {/* Watermark logo overlay — sits on top of dark backgrounds */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'url(/logo-icon.svg)',
            backgroundRepeat: 'repeat',
            backgroundSize: '120px 120px',
            opacity: 0.04,
            zIndex: 5,
          }}
        />
      </div>
    </ForumProvider>
  )
}

'use client'
import { useEffect } from 'react'
import { ForumProvider } from '@/lib/forumContext'

export default function ForumLayout({ children }) {
  // Register service worker for push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])

  return (
    <ForumProvider>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0d9488" />
      </head>
      <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-600 to-teal-700 relative">
        {/* Watermark logo pattern as the background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'url(/logo-icon.svg)',
            backgroundRepeat: 'repeat',
            backgroundSize: '140px 140px',
            opacity: 0.10,
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </ForumProvider>
  )
}

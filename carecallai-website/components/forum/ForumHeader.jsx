'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, LogOut, Settings, User, Menu, X } from 'lucide-react'
import NotificationBell from './NotificationBell'
import UserBadge from './UserBadge'
import { canModerate } from '@/lib/forumAuth'

export default function ForumHeader({ user, profile, token, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/forum/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Nav */}
          <div className="flex items-center gap-4">
            <Link href="/forum" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <span className="font-bold text-slate-900 hidden sm:inline">Community Forum</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/forum" className="px-3 py-1.5 text-sm text-slate-600 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition-colors">
                Home
              </Link>
              <Link href="/" className="px-3 py-1.5 text-sm text-slate-600 hover:text-teal-700 hover:bg-slate-50 rounded-lg transition-colors">
                Back to Site
              </Link>
            </nav>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {profile ? (
              <>
                <NotificationBell token={token} />
                {canModerate(profile.forum_role) && (
                  <Link href="/forum/admin" className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors hidden sm:flex">
                    <Settings className="w-5 h-5" />
                  </Link>
                )}
                <div className="hidden sm:block">
                  <UserBadge
                    username={profile.username}
                    displayName={profile.display_name}
                    avatarUrl={profile.avatar_url}
                    role={profile.forum_role}
                    size="sm"
                  />
                </div>
                <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link href="/forum/login" className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-slate-100">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search threads..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1">
              <Link href="/forum" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Home</Link>
              <Link href="/" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Back to Site</Link>
              {profile && canModerate(profile.forum_role) && (
                <Link href="/forum/admin" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">Admin</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

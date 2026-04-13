'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, LogOut, Settings, Menu, X } from 'lucide-react'
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Nav */}
          <div className="flex items-center gap-4">
            <Link href="/forum" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-sm">
                <img src="/logo-icon.png" alt="CareCall AI" className="w-6 h-6 rounded-md" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-slate-900 text-sm">
                  CareCall<span className="text-teal-600">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Community Forum</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1 ml-2">
              <Link href="/forum" className="px-3 py-1.5 text-sm text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors font-medium">
                Home
              </Link>
              <Link href="/" className="px-3 py-1.5 text-sm text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors">
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
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 focus:bg-white transition-all"
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {profile ? (
              <>
                <NotificationBell token={token} />
                {canModerate(profile.forum_role) && (
                  <Link href="/forum/admin" className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors hidden sm:flex" title="Admin">
                    <Settings className="w-5 h-5" />
                  </Link>
                )}
                <Link href={`/forum/profile/${profile.username}`} className="hidden sm:block ml-1">
                  <UserBadge
                    username={profile.username}
                    displayName={profile.display_name}
                    avatarUrl={profile.avatar_url}
                    role={profile.forum_role}
                    size="sm"
                  />
                </Link>
                <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link href="/forum/login" className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm">
                Sign In
              </Link>
            )}

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
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1 pb-2">
              <Link href="/forum" className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Home</Link>
              <Link href="/" className="px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 rounded-lg">Back to Site</Link>
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

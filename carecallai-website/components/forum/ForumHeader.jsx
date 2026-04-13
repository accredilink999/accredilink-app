'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search, LogOut, Settings, Menu, X, Mail, Users, MessageSquare } from 'lucide-react'
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
    <header className="bg-white/[0.06] backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Nav */}
          <div className="flex items-center gap-4">
            <Link href="/forum" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-sm">
                <img src="/logo-icon.png" alt="CareCall AI" className="w-6 h-6 rounded-md" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-white text-sm">
                  CareCall<span className="text-teal-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">Community Forum</span>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1 ml-2">
              <Link href="/forum" className="px-3 py-1.5 text-sm text-slate-300 hover:text-teal-400 hover:bg-white/[0.06] rounded-lg transition-colors font-medium">
                Home
              </Link>
              <Link href="/forum/members" className="px-3 py-1.5 text-sm text-slate-400 hover:text-teal-400 hover:bg-white/[0.06] rounded-lg transition-colors flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Members
              </Link>
              <Link href="/" className="px-3 py-1.5 text-sm text-slate-400 hover:text-teal-400 hover:bg-white/[0.06] rounded-lg transition-colors">
                Back to Site
              </Link>
            </nav>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads..."
                className="w-full pl-9 pr-4 py-2 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/30 focus:bg-white/[0.08] transition-all"
              />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {profile ? (
              <>
                <Link href="/forum/messages" className="p-2 text-slate-400 hover:text-teal-400 hover:bg-white/[0.06] rounded-lg transition-colors hidden sm:flex" title="Messages">
                  <Mail className="w-5 h-5" />
                </Link>
                <NotificationBell token={token} />
                <Link href="/forum/settings" className="p-2 text-slate-400 hover:text-teal-400 hover:bg-white/[0.06] rounded-lg transition-colors hidden sm:flex" title="Settings">
                  <Settings className="w-4 h-4" />
                </Link>
                {canModerate(profile.forum_role) && (
                  <Link href="/forum/admin" className="p-2 text-amber-400/70 hover:text-amber-400 hover:bg-white/[0.06] rounded-lg transition-colors hidden sm:flex" title="Admin">
                    <MessageSquare className="w-4 h-4" />
                  </Link>
                )}
                <Link href={`/forum/profile/${profile.username}`} className="hidden sm:block ml-1">
                  <UserBadge
                    username={profile.username}
                    displayName={profile.display_name}
                    avatarUrl={profile.avatar_url}
                    role={profile.forum_role}
                    size="sm"
                    darkMode
                  />
                </Link>
                <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Sign out">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link href="/forum/login" className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white text-sm font-medium rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-sm">
                Sign In
              </Link>
            )}

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-300 hover:bg-white/[0.06] rounded-lg">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/10">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search threads..."
                  className="w-full pl-9 pr-4 py-2 bg-white/[0.06] border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </form>
            <div className="flex flex-col gap-1 pb-2">
              <Link href="/forum" className="px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg font-medium">Home</Link>
              <Link href="/forum/members" className="px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg flex items-center gap-2"><Users className="w-4 h-4" /> Members</Link>
              <Link href="/forum/messages" className="px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg flex items-center gap-2"><Mail className="w-4 h-4" /> Messages</Link>
              <Link href="/forum/settings" className="px-3 py-2 text-sm text-slate-300 hover:bg-white/[0.06] rounded-lg flex items-center gap-2"><Settings className="w-4 h-4" /> Settings</Link>
              <Link href="/" className="px-3 py-2 text-sm text-slate-400 hover:bg-white/[0.06] rounded-lg">Back to Site</Link>
              {profile && canModerate(profile.forum_role) && (
                <Link href="/forum/admin" className="px-3 py-2 text-sm text-amber-400 hover:bg-white/[0.06] rounded-lg">Admin</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useForum } from '@/lib/forumContext'
import ForumHeader from '@/components/forum/ForumHeader'
import { canModerate, isFounder as isFounderFn } from '@/lib/forumAuth'
import { LayoutDashboard, Users, MessageSquare, FolderOpen, Shield, Key, Ban, Flag, Mail, Menu, X, ArrowLeft } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/forum/admin', label: 'Dashboard', icon: LayoutDashboard, access: 'mod' },
  { href: '/forum/admin/members', label: 'Members', icon: Users, access: 'mod' },
  { href: '/forum/admin/threads', label: 'Threads', icon: MessageSquare, access: 'mod' },
  { href: '/forum/admin/categories', label: 'Categories', icon: FolderOpen, access: 'mod' },
  { href: '/forum/admin/roles', label: 'Roles', icon: Shield, access: 'admin' },
  { href: '/forum/admin/permissions', label: 'Permissions', icon: Key, access: 'founder' },
  { href: '/forum/admin/banned', label: 'Banned', icon: Ban, access: 'mod' },
  { href: '/forum/admin/reports', label: 'Reports', icon: Flag, access: 'mod' },
  { href: '/forum/admin/invites', label: 'Invites', icon: Mail, access: 'founder' },
]

export default function AdminLayout({ children }) {
  const { user, profile, token, loading, logout } = useForum()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isFounder = profile?.forum_role === 'founder' || isFounderFn(user?.id)
  const isAdmin = isFounder || profile?.forum_role === 'admin'
  const isMod = isFounder || canModerate(profile?.forum_role)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/forum/login')
      return
    }
    if (!loading && user && !isFounderFn(user.id) && (!profile || !canModerate(profile.forum_role))) {
      router.push('/forum')
    }
  }, [loading, user, profile])

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  if (loading || (!user && !profile)) {
    return (
      <div className="min-h-screen">
        <ForumHeader profile={profile} token={token} onLogout={logout} />
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (!isMod) return null

  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.access === 'founder') return isFounder
    if (item.access === 'admin') return isAdmin
    return true
  })

  const isActive = (href) => {
    if (href === '/forum/admin') return pathname === '/forum/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen">
      <ForumHeader profile={profile} token={token} onLogout={logout} />

      <div className="max-w-[1600px] mx-auto px-4 py-4">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/forum" className="text-slate-400 hover:text-teal-400 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-400" /> Admin
            </h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-400 hover:text-teal-400 hover:bg-white/[0.06] rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar — desktop always, mobile toggleable */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-56 flex-shrink-0`}>
            <div className="lg:sticky lg:top-20">
              {/* Back to forum — desktop */}
              <Link href="/forum" className="hidden lg:flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors mb-4 px-1">
                <ArrowLeft className="w-4 h-4" /> Back to forum
              </Link>

              <div className="hidden lg:flex items-center gap-2.5 mb-5 px-1">
                <Shield className="w-6 h-6 text-teal-400" />
                <h1 className="text-xl font-bold text-white">Admin</h1>
              </div>

              <nav className="flex flex-col gap-1">
                {visibleItems.map(item => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${active ? 'text-teal-400' : ''}`} />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

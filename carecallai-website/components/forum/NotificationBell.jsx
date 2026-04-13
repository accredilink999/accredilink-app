'use client'
import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { timeAgo } from '@/lib/forumAuth'

export default function NotificationBell({ token }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!token) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [token])

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/forum/notifications?token=${token}`)
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      }
    } catch {}
  }

  const markAllRead = async () => {
    await fetch('/api/forum/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, markAll: true }),
    })
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-[400px] overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[340px]">
            {notifications.length === 0 ? (
              <p className="p-4 text-sm text-slate-400 text-center">No notifications yet</p>
            ) : (
              notifications.map(n => (
                <a
                  key={n.id}
                  href={n.thread_id ? `/forum/thread/${n.thread_id}` : '#'}
                  className={`block p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-teal-50/50' : ''}`}
                >
                  <p className="text-sm text-slate-700">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

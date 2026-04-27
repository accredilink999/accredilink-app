'use client'
import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushSubscription({ token }) {
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && VAPID_PUBLIC_KEY) {
      setSupported(true)
      checkSubscription()
    }
  }, [])

  async function checkSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      setSubscribed(!!sub)
    } catch {}
  }

  async function handleToggle() {
    if (!supported || loading) return
    setLoading(true)

    try {
      const reg = await navigator.serviceWorker.ready

      if (subscribed) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription()
        if (sub) await sub.unsubscribe()

        await fetch('/api/forum/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, action: 'unsubscribe' }),
        })

        setSubscribed(false)
      } else {
        // Request permission
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          setLoading(false)
          return
        }

        // Subscribe
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        await fetch('/api/forum/push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            action: 'subscribe',
            subscription: sub.toJSON(),
          }),
        })

        setSubscribed(true)
      }
    } catch (err) {
      console.error('Push subscription error:', err)
    }

    setLoading(false)
  }

  if (!supported) return null

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-lg transition-colors ${
        subscribed
          ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
          : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'
      }`}
      title={subscribed ? 'Push notifications on — click to turn off' : 'Enable push notifications'}
    >
      {loading ? (
        <BellRing className="w-4 h-4 animate-pulse" />
      ) : subscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
    </button>
  )
}

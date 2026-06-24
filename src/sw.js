/*
 * Minimal service worker — PWA install support + push notifications only.
 * NO caching of app code or API responses.
 * All old Workbox caches are wiped on install.
 */

// Version bump this to force cache clear on next deploy
const SW_VERSION = 'v2-clean'

// ─── Install: wipe ALL old caches ───────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => caches.delete(name)))
    )
  )
  self.skipWaiting()
})

// ─── Activate: claim all clients immediately ────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((name) => caches.delete(name)))
    ).then(() => self.clients.claim())
  )
})

// ─── Fetch: pass everything straight through to network ─────────────
// No caching at all — the browser's native HTTP cache handles it fine.
// This prevents stale JS bundles and API responses from being served.
self.addEventListener('fetch', (event) => {
  // Let the browser handle it normally — no interception
  return
})

// ─── Push notifications (Firebase) ──────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { notification: { title: 'Care Call', body: event.data.text() } }
  }

  const notification = payload.notification || {}
  const data = payload.data || {}
  const title = notification.title || 'Care Call'
  const isCall = data.type === 'radio_call'
  const options = {
    body: notification.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: isCall ? `radio-call-${Date.now()}` : undefined,
    data,
    requireInteraction: isCall,
    vibrate: isCall ? [300, 100, 300, 100, 300] : [200, 100, 200],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ─── Notification click ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})

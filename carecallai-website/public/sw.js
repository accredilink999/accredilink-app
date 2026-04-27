// CareCallAI Forum Service Worker — Push Notifications

self.addEventListener('push', (event) => {
  let data = { title: 'CareCallAI Forum', body: 'You have a new notification', url: '/forum' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/logo-icon.png',
      badge: '/logo-icon.png',
      tag: data.tag || 'forum-notification',
      renotify: true,
      data: { url: data.url || '/forum' },
      vibrate: [200, 100, 200],
      actions: [{ action: 'open', title: 'View' }],
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/forum'
  const fullUrl = new URL(url, self.location.origin).href
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('/forum') && 'focus' in client) {
          client.navigate(fullUrl)
          return client.focus()
        }
      }
      return clients.openWindow(fullUrl)
    })
  )
})

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

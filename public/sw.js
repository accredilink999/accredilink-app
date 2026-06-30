/*
 * Care Call — Service Worker v6 (no-cache)
 *
 * NO caching of app code or static assets.
 * All requests go straight to the network.
 * Old caches from previous versions are wiped on install.
 * Push notifications still work.
 */

// ─── Install: wipe ALL old caches ───────────────────────────────────
self.addEventListener('install', function(event) {
  console.log('[SW v6] Installing — clearing all caches');
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        console.log('[SW v6] Deleting cache:', name);
        return caches.delete(name);
      }));
    })
  );
  self.skipWaiting();
});

// ─── Activate: claim all clients ─────────────────────────────────────
// NOTE: Do NOT call client.navigate() here — it causes a double-reload
// race condition on iOS WKWebView (Capacitor) that results in a blank
// screen. The controllerchange listener in index.html handles the reload.
self.addEventListener('activate', function(event) {
  console.log('[SW v6] Activating — claiming clients');
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) {
        return caches.delete(name);
      }));
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ─── Fetch: NO caching — let everything go to network ───────────────
self.addEventListener('fetch', function(event) {
  // Pass through — no interception, no caching
  return;
});

// ─── Push notifications ─────────────────────────────────────────────
self.addEventListener('push', function(event) {
  if (!event.data) return;

  var payload;
  try {
    payload = event.data.json();
  } catch(e) {
    payload = { notification: { title: 'Care Call', body: event.data.text() } };
  }

  var notification = payload.notification || {};
  var data = payload.data || {};
  var isAlerter = data.type === 'alerter';

  var title = notification.title || (isAlerter ? 'Incoming CareCall AI Alert' : 'Care Call');
  var options = {
    body:    notification.body || notification.message || '',
    icon:    '/pwa-192x192.png',
    badge:   '/pwa-192x192.png',
    vibrate: isAlerter ? [300, 100, 300, 100, 300, 100, 300] : [200],
    requireInteraction: isAlerter, // keep on screen until tapped
    tag:     isAlerter ? 'carecall-alerter' : undefined,
    data:    data,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Notification click ─────────────────────────────────────────────
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  var url = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clients) {
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

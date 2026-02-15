/*
 * Care Call — Service Worker v5
 *
 * Strategy:
 *  - App shell (JS, CSS, HTML, images, fonts) → Network first, cache fallback
 *    So the app always opens, even with no signal.
 *  - Supabase API / REST calls → Network only, NEVER cached
 *    Data is always fresh when online. React Query keeps it in memory
 *    so it's still visible if signal drops mid-session.
 *  - On new deploy: old caches are cleared, fresh assets are re-cached.
 *  - BUILD_TS placeholder is replaced at build time so every deploy
 *    produces a byte-different sw.js, forcing browser SW update.
 */

var CACHE_NAME = 'care-call-v5-__BUILD_TS__';

// ─── Install: clear old caches, cache the app shell ─────────────────
self.addEventListener('install', function(event) {
  console.log('[SW v5] Installing — cache:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean up old caches, claim clients, force-reload ─────
self.addEventListener('activate', function(event) {
  console.log('[SW v5] Activating — cleaning caches and forcing reload');
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    }).then(function() {
      return self.clients.claim();
    }).then(function() {
      // Force all open windows to reload so they pick up the new code.
      // This is critical for old PWA installs still running stale HTML.
      return self.clients.matchAll({ type: 'window' });
    }).then(function(windowClients) {
      windowClients.forEach(function(client) {
        client.navigate(client.url);
      });
    })
  );
});

// ─── Helpers ─────────────────────────────────────────────────────────

function isApiRequest(url) {
  // Supabase REST / Auth / Realtime — never cache
  if (url.hostname.indexOf('supabase.co') !== -1) return true;
  // Any other external API
  if (url.hostname.indexOf('googleapis.com') !== -1 && url.pathname.indexOf('/fonts/') === -1) return true;
  return false;
}

function isStaticAsset(url) {
  var path = url.pathname;
  // Hashed JS/CSS bundles (e.g. /assets/index-xl9h-Q1X.js)
  if (path.indexOf('/assets/') === 0) return true;
  // Images
  if (/\.(png|jpg|jpeg|gif|svg|ico|webp)$/i.test(path)) return true;
  // Fonts
  if (/\.(woff2?|ttf|eot)$/i.test(path)) return true;
  // Manifest
  if (path === '/manifest.json') return true;
  return false;
}

function isNavigationOrHtml(request, url) {
  if (request.mode === 'navigate') return true;
  if (url.pathname === '/' || url.pathname === '/index.html') return true;
  return false;
}

// ─── Fetch handler ──────────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  var url = new URL(request.url);

  // NEVER cache API requests — always go to network
  if (isApiRequest(url)) return;

  // Only cache same-origin requests
  if (url.origin !== self.location.origin) return;

  // ── Static assets (JS/CSS bundles, images, fonts) ──────────────
  // These have content hashes in filenames, so they're immutable.
  // Try network first (get latest), fall back to cache if offline.
  if (isStaticAsset(url)) {
    event.respondWith(
      fetch(request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(request);
      })
    );
    return;
  }

  // ── HTML / Navigation requests ─────────────────────────────────
  // Network first → cache fallback → offline page
  // Use cache:'no-store' to bypass the browser HTTP cache entirely —
  // ensures every navigation gets the latest HTML from the server.
  if (isNavigationOrHtml(request, url)) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, clone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(request).then(function(cached) {
          return cached || new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Care Call - Offline</title>' +
            '<style>body{font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f1f5f9;color:#334155}' +
            '.box{text-align:center;padding:32px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:360px;width:90%}' +
            'h2{color:#0d9488;margin:0 0 12px}p{margin:8px 0;font-size:14px}button{margin-top:16px;padding:10px 24px;background:#0d9488;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer}</style></head>' +
            '<body><div class="box"><h2>You\'re Offline</h2><p>Care Call needs an internet connection.</p><p>Please check your signal and try again.</p>' +
            '<button onclick="window.location.reload()">Retry</button></div></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
          );
        });
      })
    );
    return;
  }

  // ── Everything else (registerSW.js, etc.) ──────────────────────
  // Network first, cache fallback
  event.respondWith(
    fetch(request).then(function(response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(request);
    })
  );
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
  var title = notification.title || 'Care Call';
  var options = {
    body: notification.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: payload.data || {}
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

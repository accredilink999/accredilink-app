/*
 * Care Call — Service Worker v7
 *
 * NO caching. All requests go to network.
 * P2P radio call notifications get Answer / Decline action buttons.
 * Credentials injected at build time (see vite.config.js swVersionStamp).
 */

var SUPABASE_URL = '__SUPABASE_URL__';
var SUPABASE_KEY = '__SUPABASE_ANON_KEY__';

// ─── Install: wipe ALL old caches ───────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) { return caches.delete(name); }));
    })
  );
  self.skipWaiting();
});

// ─── Activate: claim all clients ────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(name) { return caches.delete(name); }));
    }).then(function() { return self.clients.claim(); })
  );
});

// ─── Fetch: pass through — no caching ───────────────────────────────
self.addEventListener('fetch', function() { return; });

// ─── Push notifications ──────────────────────────────────────────────
self.addEventListener('push', function(event) {
  if (!event.data) return;

  var payload;
  try { payload = event.data.json(); }
  catch(e) { payload = { notification: { title: 'Care Call', body: event.data.text() } }; }

  var notification = payload.notification || {};
  var data = payload.data || {};
  var title = notification.title || 'Care Call';

  var isRadioCall = data.type === 'radio_call';

  // Extract channel name and call ID from data
  var channelName = data.channel_name || '';
  var callId = data.call_id || '';
  if (!channelName && data.url) {
    var m = data.url.match(/[?&]call=([^&]+)/);
    if (m) channelName = m[1];
  }

  var options = {
    body: notification.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {
      url: data.url || '/',
      type: data.type || '',
      channelName: channelName,
      callId: callId,
    },
  };

  if (isRadioCall) {
    // Persistent, high-visibility notification with action buttons
    options.requireInteraction = true;
    options.vibrate = [400, 150, 400, 150, 400, 150, 800];
    options.tag = 'radio-call-' + channelName;
    options.renotify = true;
    options.actions = [
      { action: 'answer', title: '✅ Answer' },
      { action: 'decline', title: '❌ Decline' }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Notification click ──────────────────────────────────────────────
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  var data = event.notification.data || {};
  var action = event.action;

  if (data.type === 'radio_call') {
    if (action === 'answer') {
      // Auto-connect to the channel
      var answerUrl = self.location.origin + '/TwoWayRadio?join=' + (data.channelName || '');
      event.waitUntil(openOrFocusWindow(answerUrl));
    } else if (action === 'decline') {
      // Update DB directly then do NOT open app
      var declinePromise = declineCallInDB(data.callId).catch(function() {
        // If DB update fails, open app as fallback so they can decline manually
        return openOrFocusWindow(self.location.origin + '/TwoWayRadio');
      });
      event.waitUntil(declinePromise);
    } else {
      // Body tap → show the answer / decline / call back screen
      var callUrl = self.location.origin + '/TwoWayRadio?call=' + (data.channelName || '');
      event.waitUntil(openOrFocusWindow(callUrl));
    }
  } else {
    var url = data.url || '/';
    event.waitUntil(openOrFocusWindow(url));
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────

function openOrFocusWindow(url) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    .then(function(clients) {
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    });
}

function declineCallInDB(callId) {
  if (!callId || !SUPABASE_URL || !SUPABASE_KEY) {
    return Promise.resolve();
  }
  return fetch(
    SUPABASE_URL + '/rest/v1/radio_calls?id=eq.' + callId + '&status=eq.pending',
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ status: 'declined' }),
    }
  );
}

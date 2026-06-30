// Firebase Cloud Messaging Service Worker
// Handles background push notifications when the app is not in focus.
// Config is loaded from IndexedDB (written by the main app after admin saves credentials).

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

let messagingInitialized = false;

// Read Firebase config from IndexedDB (written by main app)
function getConfigFromIDB() {
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open('care-call-firebase', 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore('config', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const tx = request.result.transaction('config', 'readonly');
        const get = tx.objectStore('config').get('firebase-config');
        get.onsuccess = () => resolve(get.result?.value || null);
        get.onerror = () => resolve(null);
      };
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

async function initMessaging() {
  if (messagingInitialized) return;

  const config = await getConfigFromIDB();
  if (!config || !config.projectId) return;

  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(config);
    }

    const messaging = firebase.messaging();

    // onBackgroundMessage fires for DATA-ONLY pushes (no notification field).
    // Alerter messages are sent data-only for web → we handle display here once.
    // Standard messages include a notification field → Firebase auto-displays them
    // without calling onBackgroundMessage, so no double-show.
    messaging.onBackgroundMessage((payload) => {
      const data  = payload.data  || {};
      const notif = payload.notification;

      // If Firebase already auto-showed a notification (notification field present), skip.
      if (notif && notif.title) return;

      const title     = data.title || 'CareCall AI';
      const body      = data.body  || '';
      const isAlerter = data.type  === 'alerter';
      const isCall    = data.type  === 'radio_call';

      const options = {
        body,
        icon:    '/pwa-192x192.png',
        badge:   '/pwa-64x64.png',
        tag:     isAlerter ? 'carecall-alerter' : (isCall ? `radio-call-${Date.now()}` : (data.tag || 'care-call-notification')),
        data,
        vibrate: isAlerter ? [300, 100, 300, 100, 300, 100, 300] : (isCall ? [300, 100, 300, 100, 300] : [200, 100, 200]),
        requireInteraction: isAlerter || isCall,
      };

      self.registration.showNotification(title, options);
    });

    messagingInitialized = true;
  } catch (e) {
    console.error('[FCM SW] Init failed:', e);
  }
}

// Init on activation and when config becomes available
initMessaging();

// Re-init when main app signals config is ready
self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG_READY') {
    messagingInitialized = false;
    initMessaging();
  }
});

// Handle notification click: focus existing window or open app at the deep link URL
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url  = data.action_url || data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', data });
          if ('focus' in client) return client.focus();
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

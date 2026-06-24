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

    messaging.onBackgroundMessage((payload) => {
      const title = payload.notification?.title || 'Care Call AI';
      const data  = payload.data || {};
      const isCall = data.type === 'radio_call';
      const options = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/pwa-192x192.png',
        badge: '/pwa-64x64.png',
        tag: isCall ? `radio-call-${Date.now()}` : (data.tag || 'care-call-notification'),
        data,
        vibrate: isCall ? [300, 100, 300, 100, 300] : [200, 100, 200],
        requireInteraction: isCall || data.requireInteraction === 'true',
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

// Handle notification click: focus existing window or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          // Post message so React can handle navigation without a full reload.
          // Also try navigate() for the ?call= PIN-bypass — falls back gracefully if unsupported.
          client.postMessage({ type: 'NOTIFICATION_CLICK', data: event.notification.data });
          if ('navigate' in client) client.navigate(url).catch(() => {});
          if ('focus'    in client) return client.focus();
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

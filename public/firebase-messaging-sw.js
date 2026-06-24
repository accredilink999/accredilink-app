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
        tag: data.tag || 'care-call-notification',
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

// Handle notification click: navigate existing window to the action URL or open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.startsWith(self.location.origin)) {
          // Navigate the existing tab to the action URL so ?call= param is present,
          // which bypasses the PIN screen for incoming call notifications.
          if ('navigate' in client) client.navigate(url);
          if ('focus'    in client) return client.focus();
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

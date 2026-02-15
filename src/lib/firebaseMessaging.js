/**
 * Firebase Cloud Messaging — client-side initialization.
 *
 * Config is loaded from SystemSettings (saved by the admin in Settings → Firebase Push Config).
 * The config is also written to IndexedDB so the service worker can read it for background pushes.
 */

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { supabase } from '@/api/supabaseClient';

let _messaging = null;

// ---------------------------------------------------------------------------
// IndexedDB helpers — share config with firebase-messaging-sw.js
// ---------------------------------------------------------------------------

function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('care-call-firebase', 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains('config')) {
        req.result.createObjectStore('config', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function writeConfigToIDB(config) {
  try {
    const db = await openIDB();
    const tx = db.transaction('config', 'readwrite');
    tx.objectStore('config').put({ key: 'firebase-config', value: config });
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; });
  } catch (e) {
    console.warn('[FCM] IDB write failed:', e);
  }
}

async function clearConfigFromIDB() {
  try {
    const db = await openIDB();
    const tx = db.transaction('config', 'readwrite');
    tx.objectStore('config').delete('firebase-config');
  } catch (_) { /* ignore */ }
}

// ---------------------------------------------------------------------------
// Load Firebase web config from Supabase SystemSettings
// ---------------------------------------------------------------------------

async function loadFirebaseWebConfig() {
  const { data, error } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'firebase_web_config')
    .maybeSingle();

  if (error || !data?.setting_value) return null;

  try {
    return typeof data.setting_value === 'string'
      ? JSON.parse(data.setting_value)
      : data.setting_value;
  } catch {
    return null;
  }
}

async function loadVapidKey() {
  const { data } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('setting_key', 'firebase_vapid_key')
    .maybeSingle();
  return data?.setting_value || null;
}

// ---------------------------------------------------------------------------
// Main init — call once from useNotifications or PushNotificationSetup
// ---------------------------------------------------------------------------

/**
 * Initializes Firebase Messaging for the current browser.
 * @param {Function} onForegroundMessage  - called when a message arrives while app is open
 * @returns {object|null} Firebase messaging instance, or null if not configured/supported
 */
export async function initFirebaseMessaging(onForegroundMessage) {
  // Check browser support
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const config = await loadFirebaseWebConfig();
  if (!config || !config.projectId) {
    console.log('[FCM] No Firebase web config saved — skipping init');
    return null;
  }

  // Write to IDB for SW background message handling
  await writeConfigToIDB(config);

  // Init Firebase app (avoid duplicate)
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  const messaging = getMessaging(app);
  _messaging = messaging;

  // Tell the service worker the config is ready
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      reg.active?.postMessage({ type: 'FIREBASE_CONFIG_READY' });
    } catch (_) { /* SW may not be active yet */ }
  }

  // Foreground message handler
  if (typeof onForegroundMessage === 'function') {
    onMessage(messaging, onForegroundMessage);
  }

  return messaging;
}

/**
 * Requests an FCM registration token for this device.
 * Requires notification permission to already be granted.
 * @returns {string|null} FCM token or null on failure
 */
export async function requestFCMToken() {
  const supported = await isSupported().catch(() => false);
  if (!supported) return null;

  const vapidKey = await loadVapidKey();
  if (!vapidKey) {
    console.warn('[FCM] No VAPID key configured — cannot get token');
    return null;
  }

  const messaging = _messaging;
  if (!messaging) {
    console.warn('[FCM] Messaging not initialized — call initFirebaseMessaging first');
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: reg,
    });
    return token || null;
  } catch (e) {
    console.error('[FCM] Failed to get token:', e);
    return null;
  }
}

/** Returns the current messaging instance (null if not initialized). */
export function getMessagingInstance() {
  return _messaging;
}

/** Clears the stored config (e.g. on logout or credential reset). */
export async function clearFirebaseConfig() {
  _messaging = null;
  await clearConfigFromIDB();
}

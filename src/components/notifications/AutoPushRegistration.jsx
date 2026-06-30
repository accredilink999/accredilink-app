/**
 * AutoPushRegistration
 *
 * Runs silently after login:
 *
 * NATIVE (Android/iOS):
 * - On first launch: requests ALL permissions (notifications, location, camera)
 *   in one go so the user doesn't have to visit Settings manually.
 * - On subsequent launches: silently refreshes the push token.
 *
 * WEB:
 * - If notification permission is already granted → auto-refresh FCM token (no UI)
 * - If permission not yet asked → show a one-time banner prompting the user
 * - If permission denied → do nothing
 *
 * The banner / first-launch flag is tracked via localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { invokeFunction } from '@/api/functions';
import { initFirebaseMessaging, requestFCMToken } from '@/lib/firebaseMessaging';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';

const DISMISSED_KEY = 'push-prompt-dismissed';
const NATIVE_PERMISSIONS_DONE_KEY = 'native-permissions-requested';

function isNativePlatform() {
  return window.Capacitor?.isNativePlatform?.() === true;
}

function getPlatform() {
  if (!isNativePlatform()) return 'web';
  return window.Capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android';
}

/** Save APNS token directly via Supabase edge function */
async function saveApnsToken(token) {
  console.log('[APNS] Saving token to server...');
  const result = await invokeFunction('manageFirebaseSubscription', { apnsToken: token, platform: 'ios' });
  console.log('[APNS] Save result:', JSON.stringify(result));
  return result;
}

/** Save FCM token via Supabase edge function */
async function saveFcmToken(token, platform) {
  const result = await invokeFunction('manageFirebaseSubscription', {
    firebaseToken: token,
    platform,
    origin: window.location.origin,
  });
  console.log('[FCM] Save result:', JSON.stringify(result));
  return result;
}

/**
 * Set up native notification tap handler.
 * When a user taps a push notification, navigate to the action_url.
 */
async function setupNativeNotificationClickHandler(PushNotifications) {
  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('[Push] Notification tapped:', JSON.stringify(notification));
    const data = notification?.notification?.data;
    const url = data?.url || data?.action_url;
    if (url) {
      console.log('[Push] Navigating to:', url);
      // Use window.location for in-app navigation (React Router picks it up)
      window.location.href = url;
    }
  });

  // Optional: handle foreground notifications (show toast instead of system notification)
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[Push] Foreground notification:', JSON.stringify(notification));
    const title = notification?.title || 'Notification';
    const body = notification?.body || '';
    toast.info(`${title}: ${body}`, { duration: 5000 });
  });
}

/**
 * Register for push and wait for the token.
 * IMPORTANT: Listeners are set up BEFORE calling register() to avoid
 * a race condition where iOS fires the event before the listener is ready.
 */
async function registerAndGetToken(PushNotifications) {
  // Clean up any stale listeners from previous calls
  await PushNotifications.removeAllListeners();

  // Set up click/foreground handlers first
  await setupNativeNotificationClickHandler(PushNotifications);

  // Set up listeners FIRST, then register — prevents race condition
  const tokenPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.warn('[Push] Token registration timed out after 15s');
      reject(new Error('Push token registration timed out'));
    }, 15000);

    PushNotifications.addListener('registration', (t) => {
      clearTimeout(timeout);
      console.log('[Push] Got token:', t.value?.substring(0, 20) + '...');
      resolve(t.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      clearTimeout(timeout);
      console.error('[Push] Registration error:', JSON.stringify(err));
      reject(new Error(err?.error || 'Push registration failed'));
    });
  });

  // NOW call register — the listeners are already waiting
  await PushNotifications.register();
  console.log('[Push] register() called, waiting for token...');

  return tokenPromise;
}

/**
 * Request all native permissions on first launch:
 * notifications, location, camera — in sequence.
 */
async function requestAllNativePermissions() {
  const platform = getPlatform();

  // 1. Push notifications
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const perm = await PushNotifications.checkPermissions();
    console.log('[AutoPerms] Current push permission:', perm.receive);
    if (perm.receive !== 'granted') {
      const result = await PushNotifications.requestPermissions();
      console.log('[AutoPerms] Permission request result:', result.receive);
    }

    // Register for push and save token
    const currentPerm = await PushNotifications.checkPermissions();
    if (currentPerm.receive === 'granted') {
      const token = await registerAndGetToken(PushNotifications);
      if (platform === 'ios') {
        await saveApnsToken(token);
        toast.success('iOS push notifications registered');
      } else {
        await saveFcmToken(token, platform);
      }
    } else {
      console.warn('[AutoPerms] Push permission not granted, skipping registration');
      toast.error('Push permission not granted');
    }
  } catch (e) {
    console.warn('[AutoPerms] Push setup failed:', e?.message || e);
    toast.error('Push setup failed: ' + (e?.message || 'unknown error'));
  }

  // 2. Location — trigger the native permission dialog
  try {
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });
  } catch (e) {
    console.warn('[AutoPerms] Location:', e?.message || 'denied or unavailable');
  }

  // 3. Camera — trigger the native permission dialog
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(t => t.stop());
  } catch (e) {
    console.warn('[AutoPerms] Camera:', e?.message || 'denied or unavailable');
  }

  // Mark as done so we don't re-prompt on every launch
  localStorage.setItem(NATIVE_PERMISSIONS_DONE_KEY, '1');
}

/**
 * Silently refresh the push token (no permission prompts).
 * Called on subsequent native launches or when web permission is already granted.
 */
async function silentTokenRefresh() {
  try {
    const platform = getPlatform();

    if (isNativePlatform()) {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const perm = await PushNotifications.checkPermissions();
      console.log('[AutoPush] Silent refresh — permission:', perm.receive, 'platform:', platform);
      if (perm.receive !== 'granted') {
        console.warn('[AutoPush] Permission not granted, cannot refresh token');
        return;
      }

      const token = await registerAndGetToken(PushNotifications);
      if (platform === 'ios') {
        await saveApnsToken(token);
      } else {
        await saveFcmToken(token, platform);
      }
    } else {
      const messaging = await initFirebaseMessaging();
      if (!messaging) return;
      const token = await requestFCMToken();
      if (!token) return;
      await saveFcmToken(token, platform);
    }
  } catch (e) {
    console.warn('[AutoPush] Silent refresh failed:', e?.message || e);
  }
}

export default function AutoPushRegistration() {
  const [showBanner, setShowBanner] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (isNativePlatform()) {
      // Native: always re-request permissions and refresh token on every launch
      // (previously only did this on first launch, which left stale tokens)
      requestAllNativePermissions();
      return;
    }

    // Web flow
    const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    if (!isSupported) return;

    const permission = Notification.permission;
    if (permission === 'granted') {
      silentTokenRefresh();
    } else if (permission === 'default') {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (!dismissed) {
        const timer = setTimeout(() => setShowBanner(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleEnable = useCallback(async () => {
    setRequesting(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission denied. You can re-enable in browser settings.');
        setShowBanner(false);
        localStorage.setItem(DISMISSED_KEY, '1');
        return;
      }

      const messaging = await initFirebaseMessaging();
      if (!messaging) {
        toast.error('Firebase not configured. Ask your admin to set up push credentials in Settings.');
        setShowBanner(false);
        return;
      }

      const token = await requestFCMToken();
      if (!token) {
        toast.error('Could not get push token. Check VAPID key configuration.');
        setShowBanner(false);
        return;
      }

      await saveFcmToken(token, 'web');

      toast.success('Push notifications enabled!');
      setShowBanner(false);
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch (e) {
      toast.error(e.message || 'Failed to enable push notifications');
    }
    setRequesting(false);
  }, []);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(DISMISSED_KEY, '1');
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm">Enable Notifications</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Get instant alerts for messages, shifts, and incidents.
          </p>
          <button
            onClick={handleEnable}
            disabled={requesting}
            className="mt-2 px-4 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
          >
            {requesting ? 'Enabling...' : 'Enable'}
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

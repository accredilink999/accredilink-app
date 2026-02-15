/**
 * AutoPushRegistration
 *
 * Runs silently after login:
 *
 * NATIVE (Android/iOS):
 * - On first launch: requests ALL permissions (notifications, location, camera)
 *   in one go so the user doesn't have to visit Settings manually.
 * - On subsequent launches: silently refreshes the FCM token.
 *
 * WEB:
 * - If notification permission is already granted → auto-refresh FCM token (no UI)
 * - If permission not yet asked → show a one-time banner prompting the user
 * - If permission denied → do nothing
 *
 * The banner / first-launch flag is tracked via localStorage.
 */

import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
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

/** Save APNS token directly to the profiles table for iOS */
async function saveApnsToken(token) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({ apns_device_token: token }).eq('id', user.id);
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
    if (perm.receive !== 'granted') {
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        console.log('[AutoPerms] Notifications granted');
      }
    }

    // Register for push and save token
    const currentPerm = await PushNotifications.checkPermissions();
    if (currentPerm.receive === 'granted') {
      await PushNotifications.register();
      const token = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 15000);
        PushNotifications.addListener('registration', (t) => {
          clearTimeout(timeout);
          resolve(t.value);
        });
        PushNotifications.addListener('registrationError', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      if (platform === 'ios') {
        await saveApnsToken(token);
        console.log('[AutoPerms] iOS APNS token saved');
      } else {
        await base44.functions.invoke('manageFirebaseSubscription', { firebaseToken: token, platform });
        console.log('[AutoPerms] Native FCM token saved');
      }
    }
  } catch (e) {
    console.warn('[AutoPerms] Push setup failed:', e?.message || e);
  }

  // 2. Location — trigger the native permission dialog
  try {
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
    });
    console.log('[AutoPerms] Location granted');
  } catch (e) {
    console.warn('[AutoPerms] Location:', e?.message || 'denied or unavailable');
  }

  // 3. Camera — trigger the native permission dialog
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(t => t.stop());
    console.log('[AutoPerms] Camera granted');
  } catch (e) {
    console.warn('[AutoPerms] Camera:', e?.message || 'denied or unavailable');
  }

  // Mark as done so we don't re-prompt on every launch
  localStorage.setItem(NATIVE_PERMISSIONS_DONE_KEY, '1');
}

/**
 * Silently refresh the FCM token (no permission prompts).
 * Called on subsequent native launches or when web permission is already granted.
 */
async function silentTokenRefresh() {
  try {
    const platform = getPlatform();

    if (isNativePlatform()) {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const perm = await PushNotifications.checkPermissions();
      if (perm.receive !== 'granted') return;
      await PushNotifications.register();
      const token = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timeout')), 10000);
        PushNotifications.addListener('registration', (t) => {
          clearTimeout(timeout);
          resolve(t.value);
        });
        PushNotifications.addListener('registrationError', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      if (platform === 'ios') {
        await saveApnsToken(token);
        console.log('[AutoPush] iOS APNS token refreshed');
      } else {
        await base44.functions.invoke('manageFirebaseSubscription', { firebaseToken: token, platform });
        console.log('[AutoPush] Native token refreshed');
      }
    } else {
      const messaging = await initFirebaseMessaging();
      if (!messaging) return;
      const token = await requestFCMToken();
      if (!token) return;
      await base44.functions.invoke('manageFirebaseSubscription', { firebaseToken: token, platform });
      console.log('[AutoPush] Web token refreshed');
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
      // Native: check if first launch
      const alreadyDone = localStorage.getItem(NATIVE_PERMISSIONS_DONE_KEY);
      if (!alreadyDone) {
        // First launch — request all permissions automatically
        requestAllNativePermissions();
      } else {
        // Subsequent launch — just refresh the token silently
        silentTokenRefresh();
      }
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

      await base44.functions.invoke('manageFirebaseSubscription', {
        firebaseToken: token,
        platform: 'web',
      });

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

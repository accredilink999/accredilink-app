/**
 * PushNotificationSetup
 *
 * Shown to every user (not just admins) so they can enable push notifications
 * on their device.
 *
 * - On native Android/iOS (Capacitor): uses @capacitor/push-notifications
 *   which gives a native FCM token (Android) or APNS token (iOS).
 * - On web: uses Firebase Messaging web SDK via service worker.
 *
 * Both paths send the token to the same manageFirebaseSubscription edge function.
 */

import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle2, AlertTriangle, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { initFirebaseMessaging, requestFCMToken } from '@/lib/firebaseMessaging';

/** Detect if running inside Capacitor native shell */
function isNativePlatform() {
  return window.Capacitor?.isNativePlatform?.() === true;
}

/** Get platform string for the edge function */
function getPlatform() {
  if (!isNativePlatform()) return 'web';
  return window.Capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android';
}

/**
 * Register for native push via Capacitor plugin.
 * Returns the FCM/APNS token string.
 */
async function registerNativePush() {
  const { PushNotifications } = await import('@capacitor/push-notifications');

  // Request permission
  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') {
    throw new Error('Push notification permission denied');
  }

  // Register with the OS (triggers FCM/APNS registration)
  await PushNotifications.register();

  // Wait for the token
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for push token')), 15000);

    PushNotifications.addListener('registration', (token) => {
      clearTimeout(timeout);
      resolve(token.value);
    });

    PushNotifications.addListener('registrationError', (err) => {
      clearTimeout(timeout);
      reject(new Error(err.error || 'Native push registration failed'));
    });
  });
}

export default function PushNotificationSetup() {
  const [permissionStatus, setPermissionStatus] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const [fcmReady, setFcmReady] = useState(false);
  const isNative = isNativePlatform();

  useEffect(() => {
    if (isNative) {
      // Native platform always supports push
      setIsSupported(true);
      // Check if already registered
      import('@capacitor/push-notifications').then(({ PushNotifications }) => {
        PushNotifications.checkPermissions().then((result) => {
          if (result.receive === 'granted') {
            setPermissionStatus('granted');
            setFcmReady(true);
          }
        }).catch(() => {});
      }).catch(() => {});
    } else {
      // Web platform
      const supported = 'Notification' in window && 'serviceWorker' in navigator;
      setIsSupported(supported);
      if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
        if (Notification.permission === 'granted') {
          initFirebaseMessaging().then(m => setFcmReady(!!m)).catch(() => {});
        }
      }
    }
  }, [isNative]);

  const registerPushMutation = useMutation({
    mutationFn: async () => {
      let token;
      const platform = getPlatform();

      if (isNative) {
        // ── Native Android/iOS path ──
        token = await registerNativePush();
        setPermissionStatus('granted');
        setFcmReady(true);
      } else {
        // ── Web path ──
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        if (permission !== 'granted') {
          throw new Error('Notification permission denied by user');
        }

        const messaging = await initFirebaseMessaging();
        if (!messaging) {
          throw new Error(
            'Firebase is not configured yet. Ask your admin to set up the Firebase Web Config in Settings → Push Notification Credentials.'
          );
        }
        setFcmReady(true);

        token = await requestFCMToken();
        if (!token) {
          throw new Error('Could not obtain a push token. Check that the VAPID key is correct.');
        }
      }

      // Save token to backend via edge function (uses service key, bypasses RLS)
      if (platform === 'ios') {
        await base44.functions.invoke('manageFirebaseSubscription', {
          apnsToken: token,
          platform: 'ios',
        });
      } else {
        await base44.functions.invoke('manageFirebaseSubscription', {
          firebaseToken: token,
          platform,
        });
      }

      return token;
    },
    onSuccess: () => {
      toast.success('Push notifications enabled for this device!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to enable push notifications');
    },
  });

  // --- Render states ---

  if (!isSupported) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900">Push Notifications Not Supported</p>
              <p className="text-sm text-amber-800 mt-1">
                Your browser or device does not support push notifications. Try a modern browser, or use the native mobile app.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-900">Push Notifications Blocked</p>
              <p className="text-sm text-red-800 mt-1">
                {isNative
                  ? 'Push notifications are blocked. Go to your device Settings → Apps → Accredilink → Notifications and enable them.'
                  : 'You have blocked notifications for this site. To re-enable, click the lock icon in your browser\'s address bar and allow notifications, then reload.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (permissionStatus === 'granted' && fcmReady) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-green-900">Push Notifications Enabled</p>
              <p className="text-sm text-green-800 mt-1">
                You will receive push notifications on this device for important events.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => registerPushMutation.mutate()}
              disabled={registerPushMutation.isPending}
              title="Re-register this device"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900 mb-1">Enable Push Notifications</p>
            <p className="text-sm text-slate-600 mb-4">
              Get instant alerts for messages, incidents, shift reminders, and more — even when the app is in the background.
            </p>
            <Button
              onClick={() => registerPushMutation.mutate()}
              disabled={registerPushMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              {registerPushMutation.isPending ? 'Enabling…' : 'Enable Push Notifications'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

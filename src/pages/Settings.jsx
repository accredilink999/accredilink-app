import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import PageHeader from '@/components/ui/PageHeader';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
        Bell,
        Moon,
        Shield,
        Smartphone,
        LogOut,
        User,
        Trash2,
        Building2,
        Upload,
        Flame,
        SlidersHorizontal,
        Download,
        CheckCircle2,
        MapPin,
        Camera,
        RefreshCw,
        XCircle,
        AlertTriangle,
        Fingerprint,
        QrCode,
        Share2,
        Copy,
        Check,
        KeyRound,
        Eye,
        EyeOff
      } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { APP_VERSION, isUpdateAvailable } from '@/lib/appVersion';
import { openExternalUrl } from '@/lib/openExternalUrl';
import {
  isBiometricSupported,
  isBiometricEnabled,
  registerBiometric,
  removeBiometric,
  getStoredCredential,
} from '@/utils/biometric';
import GlobalNotificationSettings from '@/components/admin/GlobalNotificationSettings';
import PushCredentialsManager from '@/components/admin/PushCredentialsManager';
import NotificationRulesManager from '@/components/admin/NotificationRulesManager';
import PushNotificationSetup from '@/components/notifications/PushNotificationSetup';
import { initFirebaseMessaging, requestFCMToken } from '@/lib/firebaseMessaging';
import { toast } from 'sonner';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useAuth } from '@/lib/AuthContext';

// Error boundary wrapper to prevent one section from crashing the entire page
class SettingsErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.error('Settings section error:', err); }
  render() {
    if (this.state.hasError) {
      return <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">This section failed to load. Check console for details.</div>;
    }
    return this.props.children;
  }
}

function InstallAppSection() {
  const { canPrompt, isInstalled, promptInstall } = usePWAInstall();
  const [installing, setInstalling] = useState(false);
  const [enabling, setEnabling] = useState(false);

  // Check if an Android APK is available for download
  const { data: apkUrlSetting } = useQuery({
    queryKey: ['apk_download_url'],
    queryFn: async () => {
      const results = await base44.entities.SystemSettings.filter({ setting_key: 'apk_download_url' });
      return results[0] || null;
    },
  });
  const apkAvailable = !!apkUrlSetting?.setting_value;
  const isAndroid = /android/i.test(navigator.userAgent);

  const requestPushPermissions = async () => {
    setEnabling(true);
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        toast.error('Push notifications are not supported on this browser.');
        setEnabling(false);
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        toast.error('Notifications blocked. Allow them in your browser settings, then try again.');
        setEnabling(false);
        return;
      }
      if (permission !== 'granted') {
        toast.info('Notification permission was dismissed. Tap the button to try again.');
        setEnabling(false);
        return;
      }

      const messaging = await initFirebaseMessaging();
      if (!messaging) {
        toast.error('Push service not configured yet. Ask your admin to set up Firebase credentials in Settings.');
        setEnabling(false);
        return;
      }

      const token = await requestFCMToken();
      if (!token) {
        toast.error('Could not get a push token. Check that Firebase VAPID key is correct.');
        setEnabling(false);
        return;
      }

      await base44.functions.invoke('manageFirebaseSubscription', {
        firebaseToken: token,
        platform: 'web',
      });
      toast.success('Push notifications enabled!');
    } catch (err) {
      console.error('Push registration error:', err);
      toast.error('Failed to enable notifications: ' + (err.message || 'Unknown error'));
    }
    setEnabling(false);
  };

  const handleInstall = async () => {
    if (canPrompt) {
      setInstalling(true);
      const outcome = await promptInstall();
      setInstalling(false);
      if (outcome === 'accepted') {
        toast.success('App installed successfully!');
        requestPushPermissions();
      }
    } else {
      // No install prompt available — trigger push permissions directly
      requestPushPermissions();
    }
  };

  if (isInstalled) {
    return (
      <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-emerald-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">App Installed</p>
            <p className="text-sm text-slate-500">You're using the installed app.</p>
          </div>
          {'Notification' in window && Notification.permission !== 'granted' && (
            <Button size="sm" onClick={requestPushPermissions} disabled={enabling} className="bg-indigo-600 hover:bg-indigo-700">
              <Bell className="w-3.5 h-3.5 mr-1.5" />
              {enabling ? 'Enabling...' : 'Enable Notifications'}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-emerald-500">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <Download className="w-5 h-5 text-emerald-600" />
        Install Latest App
      </h3>
      <p className="text-sm text-slate-600 mb-4">
        Install the latest version of this app on your device for quick access and push notifications.
      </p>

      {canPrompt ? (
        <Button
          onClick={handleInstall}
          disabled={installing}
          className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
        >
          <Download className="w-4 h-4 mr-2" />
          {installing ? 'Installing...' : 'Install App Now'}
        </Button>
      ) : isIOS ? (
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
          <p className="text-sm font-medium text-slate-700 mb-2">To install on iPhone/iPad:</p>
          <ol className="text-xs text-slate-600 list-decimal list-inside space-y-1">
            <li>Tap the <strong>Share</strong> button at the bottom of Safari</li>
            <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li>Tap <strong>"Add"</strong> in the top right</li>
          </ol>
        </div>
      ) : (
        <Button
          onClick={handleInstall}
          disabled={enabling}
          className="w-full bg-emerald-600 hover:bg-emerald-700 min-h-[44px]"
        >
          <Download className="w-4 h-4 mr-2" />
          {enabling ? 'Enabling...' : 'Install App Now'}
        </Button>
      )}

      {/* Android native app download */}
      {apkAvailable && isAndroid && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <Button
            onClick={() => openExternalUrl(apkUrlSetting.setting_value)}
            variant="outline"
            className="w-full border-green-300 text-green-700 hover:bg-green-50 min-h-[44px]"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Download Android App
          </Button>
          <p className="text-xs text-slate-400 mt-2 text-center">
            Native app with full push notification support
          </p>
        </div>
      )}
    </Card>
  );
}

function PermissionsSection() {
  const [permissions, setPermissions] = useState({
    notifications: 'checking',
    location: 'checking',
    camera: 'checking',
  });
  const [requesting, setRequesting] = useState(null);

  const checkPermissions = async () => {
    const isNativeApp = window.Capacitor?.isNativePlatform?.() === true;

    if (isNativeApp) {
      // Native: check push via Capacitor plugin
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const pushPerm = await PushNotifications.checkPermissions();
        setPermissions(p => ({ ...p, notifications: pushPerm.receive === 'granted' ? 'granted' : pushPerm.receive === 'denied' ? 'denied' : 'prompt' }));
      } catch {
        setPermissions(p => ({ ...p, notifications: 'unknown' }));
      }

      // Native: check location by trying a quick query
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, maximumAge: 60000 });
        });
        setPermissions(p => ({ ...p, location: 'granted' }));
      } catch (err) {
        setPermissions(p => ({ ...p, location: err.code === 1 ? 'denied' : 'granted' }));
      }

      // Native: check camera by trying a quick query
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        setPermissions(p => ({ ...p, camera: 'granted' }));
      } catch (err) {
        setPermissions(p => ({ ...p, camera: err.name === 'NotAllowedError' ? 'denied' : 'granted' }));
      }

      return;
    }

    // Web: use browser APIs
    // Notifications
    if ('Notification' in window) {
      setPermissions(p => ({ ...p, notifications: Notification.permission }));
    } else {
      setPermissions(p => ({ ...p, notifications: 'unsupported' }));
    }

    // Location
    if (navigator.permissions?.query) {
      try {
        const loc = await navigator.permissions.query({ name: 'geolocation' });
        setPermissions(p => ({ ...p, location: loc.state }));
        loc.onchange = () => setPermissions(p => ({ ...p, location: loc.state }));
      } catch {
        setPermissions(p => ({ ...p, location: 'unknown' }));
      }
    } else {
      setPermissions(p => ({ ...p, location: 'unknown' }));
    }

    // Camera
    if (navigator.permissions?.query) {
      try {
        const cam = await navigator.permissions.query({ name: 'camera' });
        setPermissions(p => ({ ...p, camera: cam.state }));
        cam.onchange = () => setPermissions(p => ({ ...p, camera: cam.state }));
      } catch {
        setPermissions(p => ({ ...p, camera: 'unknown' }));
      }
    } else {
      setPermissions(p => ({ ...p, camera: 'unknown' }));
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const isNative = window.Capacitor?.isNativePlatform?.() === true;

  const requestNotification = async () => {
    setRequesting('notifications');
    try {
      if (isNative) {
        // Native: use Capacitor push plugin
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const permResult = await PushNotifications.requestPermissions();
        const granted = permResult.receive === 'granted';
        setPermissions(p => ({ ...p, notifications: granted ? 'granted' : 'denied' }));
        if (!granted) {
          toast.error('Notifications blocked. Change this in your device settings.');
          setRequesting(null);
          return;
        }
        toast.success('Notifications enabled');
      } else {
        // Web: use browser Notification API
        const result = await Notification.requestPermission();
        setPermissions(p => ({ ...p, notifications: result }));
        if (result !== 'granted') {
          if (result === 'denied') toast.error('Notifications blocked. Change this in your browser settings.');
          setRequesting(null);
          return;
        }
        // Also try to register FCM
        try {
          const messaging = await initFirebaseMessaging();
          if (messaging) {
            const token = await requestFCMToken();
            if (token) {
              await base44.functions.invoke('manageFirebaseSubscription', {
                firebaseToken: token,
                platform: 'web',
              });
            }
          }
        } catch {}
        toast.success('Notifications enabled');
      }
    } catch (err) {
      toast.error('Failed: ' + err.message);
    }
    setRequesting(null);
  };

  const requestLocation = async () => {
    setRequesting('location');
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      setPermissions(p => ({ ...p, location: 'granted' }));
      toast.success('Location access granted');
    } catch (err) {
      if (err.code === 1) {
        setPermissions(p => ({ ...p, location: 'denied' }));
        toast.error('Location blocked. Change this in your browser/device settings.');
      } else {
        toast.error('Could not get location: ' + err.message);
      }
    }
    setRequesting(null);
  };

  const requestCamera = async () => {
    setRequesting('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setPermissions(p => ({ ...p, camera: 'granted' }));
      toast.success('Camera access granted');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setPermissions(p => ({ ...p, camera: 'denied' }));
        toast.error('Camera blocked. Change this in your browser/device settings.');
      } else {
        toast.error('Camera error: ' + err.message);
      }
    }
    setRequesting(null);
  };

  const requestAll = async () => {
    if (permissions.notifications !== 'granted') await requestNotification();
    if (permissions.location !== 'granted') await requestLocation();
    if (permissions.camera !== 'granted') await requestCamera();
  };

  const StatusIcon = ({ status }) => {
    if (status === 'granted') return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    if (status === 'denied') return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === 'prompt' || status === 'default') return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    return <AlertTriangle className="w-4 h-4 text-slate-400" />;
  };

  const statusLabel = (status) => {
    if (status === 'granted') return 'Allowed';
    if (status === 'denied') return 'Blocked';
    if (status === 'prompt' || status === 'default') return 'Not set';
    if (status === 'checking') return 'Checking...';
    return 'Unknown';
  };

  const allGranted = permissions.notifications === 'granted' && permissions.location === 'granted' && permissions.camera === 'granted';
  const anyDenied = permissions.notifications === 'denied' || permissions.location === 'denied' || permissions.camera === 'denied';

  const permissionItems = [
    { key: 'notifications', label: 'Notifications', icon: Bell, desc: 'Shift alerts and messages', request: requestNotification },
    { key: 'location', label: 'Location / GPS', icon: MapPin, desc: 'Clock-in and visit verification', request: requestLocation },
    { key: 'camera', label: 'Camera', icon: Camera, desc: 'Photo verification', request: requestCamera },
  ];

  return (
    <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          App Permissions
        </h3>
        {!allGranted && (
          <Button
            size="sm"
            onClick={requestAll}
            disabled={!!requesting}
            className="bg-blue-600 hover:bg-blue-700 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${requesting ? 'animate-spin' : ''}`} />
            {requesting ? 'Requesting...' : 'Request All'}
          </Button>
        )}
      </div>

      {anyDenied && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
          {window.Capacitor?.isNativePlatform?.()
            ? 'Some permissions are blocked. Go to your device Settings → Apps → Accredilink → Permissions to allow them.'
            : 'Some permissions are blocked. To fix this, tap the lock/site-settings icon in your browser\'s address bar and allow the blocked permissions, then reload.'}
        </div>
      )}

      <div className="space-y-2">
        {permissionItems.map(({ key, label, icon: Icon, desc, request }) => (
          <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium ${permissions[key] === 'granted' ? 'text-green-700' : permissions[key] === 'denied' ? 'text-red-600' : 'text-amber-600'}`}>
                {statusLabel(permissions[key])}
              </span>
              <StatusIcon status={permissions[key]} />
              {permissions[key] !== 'granted' && permissions[key] !== 'checking' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={request}
                  disabled={requesting === key}
                  className="h-7 text-xs px-2"
                >
                  {requesting === key ? '...' : 'Allow'}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function BiometricSection({ user }) {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(isBiometricEnabled());
  const [setting, setSetting] = useState(false);

  useEffect(() => {
    isBiometricSupported().then(setSupported);
  }, []);

  const handleToggle = async (checked) => {
    if (checked) {
      // Register biometric
      setSetting(true);
      try {
        await registerBiometric(
          user?.id,
          user?.staff_full_name || user?.full_name || 'User',
          user?.email || ''
        );
        setEnabled(true);
        toast.success('Biometric login enabled');
      } catch (err) {
        console.error('Biometric registration failed:', err);
        if (err.name === 'NotAllowedError') {
          toast.error('Biometric cancelled or not available on this device');
        } else {
          toast.error('Failed to set up biometric: ' + (err.message || 'Unknown error'));
        }
      }
      setSetting(false);
    } else {
      removeBiometric();
      setEnabled(false);
      toast.success('Biometric login disabled');
    }
  };

  if (!supported) {
    return (
      <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-purple-500">
        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Fingerprint className="w-5 h-5 text-purple-600" />
          Biometric Login
        </h3>
        <p className="text-sm text-slate-500">
          Biometric login (fingerprint / face recognition) is not supported on this device or browser.
        </p>
      </Card>
    );
  }

  const stored = getStoredCredential();

  return (
    <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-purple-500">
      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
        <Fingerprint className="w-5 h-5 text-purple-600" />
        Biometric Login
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900">
              {enabled ? 'Biometric enabled' : 'Enable biometric login'}
            </p>
            <p className="text-sm text-slate-500">
              Use fingerprint or face recognition to unlock the app
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={setting}
          />
        </div>
        {enabled && stored && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
            <p className="text-purple-800">
              Registered for <span className="font-medium">{stored.userName}</span>
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Set up {new Date(stored.registeredAt).toLocaleDateString()}
            </p>
          </div>
        )}
        <p className="text-xs text-slate-400">
          The app will automatically lock after 2 hours of inactivity. Use biometrics for quick unlock.
        </p>
      </div>
    </Card>
  );
}

function AppInfoCard({ userEmail }) {
  const isNative = window.Capacitor?.isNativePlatform?.() === true;
  const platform = isNative
    ? (window.Capacitor?.getPlatform?.() === 'ios' ? 'ios' : 'android')
    : 'web';

  // On native, show the actual installed APK/IPA version (not the Vercel JS version)
  const [nativeVersion, setNativeVersion] = useState(null);
  useEffect(() => {
    if (isNative) {
      import('@capacitor/app').then(({ App }) =>
        App.getInfo().then(info => setNativeVersion(info.version))
      ).catch(() => {});
    }
  }, [isNative]);
  const displayVersion = nativeVersion || APP_VERSION;

  const { data: latestInfo } = useQuery({
    queryKey: ['app_download_version_check'],
    queryFn: async () => {
      const results = await base44.entities.SystemSettings.filter({
        setting_key: 'app_download_android',
      });
      if (!results?.[0]?.setting_value) return null;
      try {
        return typeof results[0].setting_value === 'string'
          ? JSON.parse(results[0].setting_value)
          : results[0].setting_value;
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 15,
  });

  const latestVersion = latestInfo?.version;
  const downloadUrl = latestInfo?.file_url;
  const hasUpdate = isUpdateAvailable(displayVersion, latestVersion);

  return (
    <Card className="p-5 bg-white border-0 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Smartphone className="w-5 h-5 text-slate-500" />
        App Information
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Installed version</span>
          <span className="text-slate-900 font-medium">{displayVersion}</span>
        </div>
        {latestVersion && (
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Latest version</span>
            <span className={hasUpdate ? 'text-teal-600 font-medium' : 'text-slate-900 font-medium'}>
              {latestVersion}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Status</span>
          {hasUpdate ? (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              Update available
            </span>
          ) : (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Up to date
            </span>
          )}
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Platform</span>
          <span className="text-slate-900 capitalize">{platform}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-500">Logged in as</span>
          <span className="text-slate-900">{userEmail}</span>
        </div>
        {hasUpdate && downloadUrl && (
          <div className="space-y-2 mt-2">
            <button
              onClick={() => openExternalUrl(downloadUrl)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Update (v{latestVersion})
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(downloadUrl).catch(() => {});
                alert('Download link copied! Open it in Chrome to install.');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs text-slate-500 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy download link
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

function AndroidAppManager() {
  const queryClient = useQueryClient();
  const [apkUrl, setApkUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: apkSetting } = useQuery({
    queryKey: ['apk_download_url'],
    queryFn: async () => {
      const results = await base44.entities.SystemSettings.filter({ setting_key: 'apk_download_url' });
      return results[0] || null;
    },
  });

  useEffect(() => {
    if (apkSetting?.setting_value) setApkUrl(apkSetting.setting_value);
  }, [apkSetting]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (apkSetting) {
        await base44.entities.SystemSettings.update(apkSetting.id, { setting_value: apkUrl });
      } else {
        await base44.entities.SystemSettings.create({
          setting_key: 'apk_download_url',
          setting_value: apkUrl,
          description: 'Android APK download URL',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['apk_download_url'] });
      toast.success('APK download URL saved');
    } catch (err) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.apk')) {
      toast.error('Please select an .apk file');
      return;
    }
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setApkUrl(file_url);
      if (apkSetting) {
        await base44.entities.SystemSettings.update(apkSetting.id, { setting_value: file_url });
      } else {
        await base44.entities.SystemSettings.create({
          setting_key: 'apk_download_url',
          setting_value: file_url,
          description: 'Android APK download URL',
        });
      }
      queryClient.invalidateQueries({ queryKey: ['apk_download_url'] });
      toast.success('APK uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload: ' + (err.message || 'Unknown error'));
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      {/* Current APK status */}
      {apkSetting?.setting_value ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-800">APK available for download</p>
          <p className="text-xs text-green-600 mt-1 break-all">{typeof apkSetting.setting_value === 'string' ? apkSetting.setting_value.split('/').pop() : JSON.stringify(apkSetting.setting_value)}</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">No APK uploaded yet. Upload an APK or paste a download URL.</p>
        </div>
      )}

      {/* Upload APK */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Upload APK file</label>
        <label className="flex items-center gap-2 cursor-pointer text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors w-fit">
          <Upload className="w-4 h-4" />
          {saving ? 'Uploading...' : 'Choose APK file'}
          <input type="file" accept=".apk" onChange={handleUpload} className="hidden" disabled={saving} />
        </label>
      </div>

      {/* Or paste URL */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Or paste APK URL</label>
        <div className="flex gap-2">
          <Input
            value={apkUrl}
            onChange={(e) => setApkUrl(e.target.value)}
            placeholder="https://example.com/accredilink.apk"
            className="flex-1 text-sm"
          />
          <Button onClick={handleSave} disabled={saving || !apkUrl} size="sm">
            Save
          </Button>
        </div>
      </div>

      {/* Download link for staff */}
      {apkSetting?.setting_value && (
        <div className="border-t pt-4 mt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Staff download link</p>
          <p className="text-xs text-slate-500 mb-2">Staff will see a download button in their Settings page under "Install App".</p>
          <Button
            onClick={() => openExternalUrl(apkSetting.setting_value)}
            variant="outline"
            size="sm"
            className="text-green-700 border-green-300"
          >
            <Download className="w-4 h-4 mr-2" />
            Test Download
          </Button>
        </div>
      )}

      {/* Build instructions */}
      <div className="border-t pt-4">
        <p className="text-xs text-slate-400">
          Build the APK using Android Studio or the GitHub Actions workflow, then upload it here. Staff can install it on their Android devices.
        </p>
      </div>
    </div>
  );
}

function AppShareQRCode({ isAdmin }) {
  const queryClient = useQueryClient();
  const [customUrl, setCustomUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: urlSetting } = useQuery({
    queryKey: ['app_share_url'],
    queryFn: async () => {
      const results = await base44.entities.SystemSettings.filter({ setting_key: 'app_share_url' });
      return results[0] || null;
    },
  });

  const appUrl = urlSetting?.setting_value || 'https://care-call-ai.vercel.app';

  useEffect(() => {
    if (urlSetting?.setting_value) setCustomUrl(urlSetting.setting_value);
  }, [urlSetting]);

  const saveUrlMutation = useMutation({
    mutationFn: async (url) => {
      const existing = await base44.entities.SystemSettings.filter({ setting_key: 'app_share_url' });
      if (existing.length > 0) {
        return base44.entities.SystemSettings.update(existing[0].id, { setting_value: url });
      }
      return base44.entities.SystemSettings.create({
        setting_key: 'app_share_url',
        setting_value: url,
        description: 'App share URL for QR code',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app_share_url'] });
      toast.success('Share link updated');
    },
    onError: () => toast.error('Failed to save URL'),
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Accredi-Care App', url: appUrl });
      } catch {}
    } else {
      handleCopy();
    }
  };

  return (
    <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-teal-500">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-teal-600" />
        App Share Link
      </h3>
      <div className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-xl border-2 border-slate-100 shadow-inner">
          <QRCodeSVG
            value={appUrl}
            size={180}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>
        <p className="text-sm text-slate-600 text-center">
          Scan to install the app on your device
        </p>
        <div className="flex gap-2 w-full max-w-xs">
          <Button
            onClick={handleCopy}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {copied ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
            {copied ? 'Copied' : 'Copy Link'}
          </Button>
          <Button
            onClick={handleShare}
            size="sm"
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <Share2 className="w-4 h-4 mr-1.5" />
            Share
          </Button>
        </div>
        <p className="text-xs text-slate-400 break-all text-center">{appUrl}</p>
      </div>

      {isAdmin && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <Label className="text-slate-700 mb-2 block text-sm font-medium">Custom App URL</Label>
          <p className="text-xs text-slate-500 mb-2">Change the URL the QR code points to</p>
          <div className="flex gap-2">
            <Input
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://care-call-ai.vercel.app"
              className="flex-1 text-sm"
            />
            <Button
              onClick={() => saveUrlMutation.mutate(customUrl.trim())}
              disabled={saveUrlMutation.isPending || !customUrl.trim()}
              size="sm"
            >
              {saveUrlMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyLogo, setCompanyLogo] = useState(null);
  const isAdmin = user?.role === 'admin' || user?.job_title === 'admin' || user?.job_title === 'manager';
  const [shiftActivityNotifs, setShiftActivityNotifs] = useState(true);
  const { isPasswordRecovery, clearPasswordRecovery } = useAuth();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!isPasswordRecovery && !currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      // In recovery mode, skip current password check (user arrived via reset link)
      if (!isPasswordRecovery) {
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (verifyError) {
          toast.error('Current password is incorrect');
          return;
        }
      }
      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        toast.error('Failed to update password: ' + updateError.message);
        return;
      }
      // Clear force_password_change flag on both tables
      if (user?.id) {
        await supabase.from('profiles').update({ force_password_change: false }).eq('id', user.id);
        await supabase.from('users').update({ force_password_change: false }).eq('id', user.id);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      if (isPasswordRecovery) clearPasswordRecovery();
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error('Error changing password: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  React.useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user]);

  // Load the admin's shift activity notification preference
  React.useEffect(() => {
    if (user?.id && isAdmin) {
      base44.entities.User.list().then(users => {
        const me = users.find(u => u.id === user.id);
        if (me) setShiftActivityNotifs(me.shift_activity_notifications !== false);
      }).catch(() => {});
    }
  }, [user?.id, isAdmin]);

  // Load company settings on mount
  React.useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const settings = await base44.entities.SystemSettings.filter({ setting_key: ['company_name', 'company_logo'] });
        settings.forEach(setting => {
          if (setting.setting_key === 'company_name') {
            setCompanyName(setting.setting_value || '');
          } else if (setting.setting_key === 'company_logo') {
            setCompanyLogo(setting.setting_value);
          }
        });
      } catch (error) {
        console.log('Failed to load company settings:', error);
      }
    };
    if (isAdmin) {
      loadCompanySettings();
    }
  }, [isAdmin]);

  React.useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleShiftActivityMutation = useMutation({
    mutationFn: async (enabled) => {
      return base44.entities.User.update(user.id, { shift_activity_notifications: enabled });
    },
    onSuccess: (_, enabled) => {
      setShiftActivityNotifs(enabled);
      toast.success(enabled ? 'Shift activity notifications enabled' : 'Shift activity notifications disabled');
    },
    onError: () => toast.error('Failed to update preference'),
  });

  const updateNameMutation = useMutation({
    mutationFn: (name) => base44.auth.updateMe({ full_name: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
    },
  });

  const handleSaveName = () => {
    if (fullName.trim()) {
      updateNameMutation.mutate(fullName.trim());
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  const saveCompanyNameMutation = useMutation({
    mutationFn: async (name) => {
      const existing = await base44.entities.SystemSettings.filter({ setting_key: 'company_name' });
      if (existing.length > 0) {
        return base44.entities.SystemSettings.update(existing[0].id, {
          setting_value: name
        });
      }
      return base44.entities.SystemSettings.create({
        setting_key: 'company_name',
        setting_value: name,
        description: 'Company name'
      });
    },
    onSuccess: () => {
      toast.success('Company name saved');
    },
    onError: () => {
      toast.error('Failed to save company name');
    }
  });

  const saveLogoMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCompanyLogo(file_url);
      const existing = await base44.entities.SystemSettings.filter({ setting_key: 'company_logo' });
      if (existing.length > 0) {
        return base44.entities.SystemSettings.update(existing[0].id, {
          setting_value: file_url
        });
      }
      return base44.entities.SystemSettings.create({
        setting_key: 'company_logo',
        setting_value: file_url,
        description: 'Company logo URL'
      });
    },
    onSuccess: () => {
      toast.success('Logo uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload logo');
    }
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      saveLogoMutation.mutate(file);
    }
  };

  const handleCompanyNameSave = () => {
    if (companyName.trim()) {
      saveCompanyNameMutation.mutate(companyName.trim());
    }
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('deleteUserAccount');
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
      base44.auth.logout();
    },
    onError: (error) => {
      toast.error('Failed to delete account: ' + error.message);
    },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings" 
        subtitle="Manage your app preferences"
      />

      {/* Personal Information */}
      <Card className="p-5 bg-white border-0 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-slate-500" />
          Personal Information
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="text-slate-700 mb-2 block">Full Name</Label>
            {isEditing ? (
              <div className="flex gap-2">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="flex-1"
                />
                <Button onClick={handleSaveName} size="sm">
                  Save
                </Button>
                <Button onClick={() => {
                  setFullName(user?.full_name || '');
                  setIsEditing(false);
                }} variant="outline" size="sm">
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-slate-900">{user?.full_name || 'Not set'}</p>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className={`p-5 bg-white border-0 shadow-sm ${isPasswordRecovery ? 'ring-2 ring-teal-500' : ''}`}>
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-slate-500" />
          {isPasswordRecovery ? 'Set Your Password' : 'Change Password'}
        </h3>
        {isPasswordRecovery && (
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4 text-sm text-teal-800">
            Please set your new password below to complete your account setup.
          </div>
        )}
        <div className="space-y-3">
          {!isPasswordRecovery && (
            <div>
              <Label className="text-slate-700 mb-1.5 block text-sm">Current Password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>
          )}
          <div>
            <Label className="text-slate-700 mb-1.5 block text-sm">New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <Label className="text-slate-700 mb-1.5 block text-sm">Confirm New Password</Label>
            <Input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || (!isPasswordRecovery && !currentPassword) || !newPassword || !confirmNewPassword}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {changingPassword ? 'Changing...' : isPasswordRecovery ? 'Set Password' : 'Update Password'}
          </Button>
        </div>
      </Card>

      {/* Admin: Shift Activity Notifications Toggle */}
      {isAdmin && (
        <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-indigo-500">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            Shift Activity Notifications
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Receive shift updates</p>
              <p className="text-sm text-slate-500">
                Get notified when staff clock on/off shifts, check in/out of calls, and submit care logs
              </p>
            </div>
            <Switch
              checked={shiftActivityNotifs}
              onCheckedChange={(checked) => toggleShiftActivityMutation.mutate(checked)}
              disabled={toggleShiftActivityMutation.isPending}
            />
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Turn off when you're not working to avoid shift update notifications. All other notifications will still be sent.
          </p>
        </Card>
      )}

      {/* Biometric Authentication */}
      <SettingsErrorBoundary>
        <BiometricSection user={user} />
      </SettingsErrorBoundary>


      {/* App Permissions — visible to all users */}
      <SettingsErrorBoundary>
        <PermissionsSection />
      </SettingsErrorBoundary>

      {/* Admin: Global Notifications */}
      {isAdmin && (
        <SettingsErrorBoundary>
          <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-teal-500">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-teal-600" />
              Global Notification Settings
            </h3>
            <GlobalNotificationSettings />
          </Card>
        </SettingsErrorBoundary>
      )}

      {/* Push Notification Device Setup (all users) */}
      <SettingsErrorBoundary>
        <Card className="p-5 bg-white border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-slate-500" />
            Push Notifications
          </h3>
          <PushNotificationSetup />
        </Card>
      </SettingsErrorBoundary>

      {/* Admin: Push Notification Credentials (Firebase + APNS keys) */}
      {isAdmin && (
        <SettingsErrorBoundary>
          <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-orange-500">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-600" />
              Push Notification Credentials
            </h3>
            <PushCredentialsManager />
          </Card>
        </SettingsErrorBoundary>
      )}

      {/* Appearance */}
      <Card className="p-5 bg-white border-0 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5 text-slate-500" />
          Appearance
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Dark mode</p>
              <p className="text-sm text-slate-500">Switch to dark theme</p>
            </div>
            <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Compact view</p>
              <p className="text-sm text-slate-500">Show more content on screen</p>
            </div>
            <Switch />
          </div>
        </div>
      </Card>

      {/* Admin: Company Settings */}
      {isAdmin && (
        <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-blue-500">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Company Settings
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-700 mb-2 block">Company Name</Label>
              <div className="flex gap-2">
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="flex-1"
                />
                <Button 
                  onClick={handleCompanyNameSave} 
                  size="sm"
                  disabled={saveCompanyNameMutation.isPending}
                >
                  {saveCompanyNameMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-slate-700 mb-2 block">Company Logo</Label>
              <div className="flex items-center gap-3">
                {companyLogo && (
                  <img src={companyLogo} alt="Company logo" className="h-12 w-auto rounded" />
                )}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={saveLogoMutation.isPending}
                  />
                  <label htmlFor="logo-upload">
                    <Button asChild variant="outline" size="sm" className="cursor-pointer" disabled={saveLogoMutation.isPending}>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {saveLogoMutation.isPending ? 'Uploading...' : 'Upload Logo'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Android App Distribution — admin only */}
      {isAdmin && (
        <Card className="p-5 bg-white border-0 shadow-sm border-l-4 border-l-green-500">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            Android App
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Distribute the native Android app to staff. The app wraps the live web version with full support for push notifications, biometrics, GPS, and camera.
          </p>
          <AndroidAppManager />
        </Card>
      )}

      {/* Privacy & Security */}
      <Card className="p-5 bg-white border-0 shadow-sm">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-slate-500" />
          Privacy & Security
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Location sharing</p>
              <p className="text-sm text-slate-500">Allow location access for clock in/out</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>





      {/* App Info */}
      <AppInfoCard userEmail={user?.email} />

      {/* Logout */}
      <Button 
        onClick={handleLogout}
        variant="outline" 
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>

      {/* Delete Account */}
      <Button 
        onClick={() => setShowDeleteConfirm(true)}
        variant="outline" 
        className="w-full border-red-300 text-red-700 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Account
      </Button>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your account and all associated data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <p className="font-semibold mb-1">This will:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Delete your account permanently</li>
              <li>Remove all your personal data</li>
              <li>Cannot be recovered</li>
            </ul>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAccountMutation.mutate()}
              disabled={deleteAccountMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
/**
 * AppUpdateChecker
 *
 * Shows an update banner when a newer APK exists.
 * On native (Capacitor): reads the INSTALLED app version from the native
 * binary via @capacitor/app. On web: no-op since Vercel always serves latest.
 *
 * Uses localStorage so dismiss persists until a NEW version is released.
 * Non-blocking banner at top — does not cover the app.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isUpdateAvailable } from '@/lib/appVersion';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { Download, X } from 'lucide-react';

export default function AppUpdateChecker() {
  const [dismissed, setDismissed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [installedVersion, setInstalledVersion] = useState(null);

  const native = !!window.Capacitor?.isNativePlatform?.();
  const android = window.Capacitor?.getPlatform?.() === 'android';
  const ios = window.Capacitor?.getPlatform?.() === 'ios';

  // Get the INSTALLED native app version from the APK/IPA binary
  useEffect(() => {
    if (!native) return;
    import('@capacitor/app').then(({ App }) =>
      App.getInfo().then(info => {
        console.log('[UpdateChecker] Native version:', info.version);
        setInstalledVersion(info.version);
      })
    ).catch(err => {
      console.warn('[UpdateChecker] Failed to get native version:', err);
    });
  }, [native]);

  // Fetch the latest version info from the database
  const { data: latestInfo } = useQuery({
    queryKey: ['app_download_android_check'],
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
    staleTime: 1000 * 60 * 30,
  });

  const latestVersion = latestInfo?.version;
  const downloadUrl = latestInfo?.file_url;

  // Compare INSTALLED native version against latest in database
  const updateAvailable = native && installedVersion && latestVersion
    ? isUpdateAvailable(installedVersion, latestVersion)
    : false;

  // Persistent dismiss — stays gone until a NEW version is released
  useEffect(() => {
    if (latestVersion) {
      const key = `update-dismissed-${latestVersion}`;
      if (localStorage.getItem(key)) {
        setDismissed(true);
      }
    }
  }, [latestVersion]);

  // Log for debugging
  useEffect(() => {
    if (native) {
      console.log('[UpdateChecker] installed:', installedVersion, 'latest:', latestVersion, 'update:', updateAvailable, 'dismissed:', dismissed);
    }
  }, [native, installedVersion, latestVersion, updateAvailable, dismissed]);

  // Don't render: not native, no update, or dismissed
  if (!native || !updateAvailable || dismissed) return null;
  if (android && !downloadUrl) return null;

  const handleDismiss = () => {
    localStorage.setItem(`update-dismissed-${latestVersion}`, '1');
    setDismissed(true);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await openExternalUrl(downloadUrl);
      setTimeout(() => {
        setDownloading(false);
        handleDismiss();
      }, 3000);
    } catch (e) {
      console.warn('[UpdateChecker] Download failed:', e);
      setDownloading(false);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] p-3 animate-in slide-in-from-top duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-w-sm mx-auto">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-4 py-2.5 flex items-center justify-between">
          <p className="text-white text-sm font-semibold">
            Update v{latestVersion} available
          </p>
          <button onClick={handleDismiss} className="text-white/70 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-3 flex items-center gap-3">
          <p className="text-xs text-slate-500 flex-1">
            You have v{installedVersion}.
            {downloading
              ? ' Downloading — check notifications to install.'
              : ios
                ? ' Open TestFlight to update.'
                : ' Tap to download the latest version.'}
          </p>
          {android && !downloading && (
            <button
              onClick={handleDownload}
              className="flex-shrink-0 px-3 py-1.5 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors flex items-center gap-1.5 touch-manipulation"
            >
              <Download className="w-3.5 h-3.5" />
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AppUpdateChecker
 *
 * Shows an update popup when a newer APK exists.
 * On native (Capacitor): reads the INSTALLED app version from the native
 * binary via @capacitor/app. On web: no-op since Vercel always serves latest.
 *
 * Re-shows on every app open — staff can dismiss but it comes back next session.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isUpdateAvailable } from '@/lib/appVersion';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { Download, X, Smartphone } from 'lucide-react';

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
  const releaseNotes = latestInfo?.notes;

  // Compare INSTALLED native version against latest in database
  const updateAvailable = native && installedVersion && latestVersion
    ? isUpdateAvailable(installedVersion, latestVersion)
    : false;

  // Only use sessionStorage — popup comes back every time the app is opened fresh
  useEffect(() => {
    if (latestVersion) {
      const key = `update-dismissed-session-${latestVersion}`;
      if (sessionStorage.getItem(key)) {
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
    // Only dismiss for this session — shows again next app open
    sessionStorage.setItem(`update-dismissed-session-${latestVersion}`, '1');
    setDismissed(true);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await openExternalUrl(downloadUrl);
      // Show success state briefly then dismiss
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
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-5 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-8 h-8" />
          </div>
          <h2 className="font-bold text-xl">App Update Available</h2>
          <p className="text-teal-100 text-sm mt-1">
            Version {latestVersion} is ready to install
          </p>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {releaseNotes && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">What's new</p>
              <p className="text-sm text-slate-700">{releaseNotes}</p>
            </div>
          )}
          {!releaseNotes && (
            <p className="text-sm text-slate-600 text-center">
              A new version is available with the latest features and bug fixes.
            </p>
          )}

          <p className="text-xs text-slate-400 text-center">
            You have v{installedVersion} installed
          </p>

          <div className="space-y-2">
            {android && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="w-full px-4 py-4 text-base font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 active:bg-teal-800 transition-colors flex items-center justify-center gap-3 min-h-[56px] touch-manipulation disabled:opacity-70"
              >
                <Download className="w-5 h-5" />
                {downloading ? 'Downloading... Check notifications' : 'Update Now'}
              </button>
            )}
            {ios && (
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-700">
                  Open TestFlight to install the latest version.
                </p>
              </div>
            )}
            {downloading && android && (
              <p className="text-xs text-green-600 text-center font-medium">
                The update is downloading. You'll see a notification when it's ready — tap it to install.
              </p>
            )}
            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

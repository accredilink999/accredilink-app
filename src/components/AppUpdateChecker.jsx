/**
 * AppUpdateChecker
 *
 * Shows an update popup when a newer APK exists.
 * On native (Capacitor): reads the INSTALLED app version from the native
 * binary via @capacitor/app. On web: no-op since Vercel always serves latest.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { isUpdateAvailable } from '@/lib/appVersion';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { Download, X, Copy, Check, Loader2 } from 'lucide-react';

export default function AppUpdateChecker() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
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

  // Check if user already dismissed this version
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
    } catch (e) {
      console.warn('[UpdateChecker] Download failed:', e);
    } finally {
      // Keep spinner for a bit so user sees it worked
      setTimeout(() => setDownloading(false), 3000);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement('input');
      input.value = downloadUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 fade-in duration-200">
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Update Available</h2>
                <p className="text-teal-100 text-sm">
                  v{installedVersion} &rarr; v{latestVersion}
                </p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-white/70 hover:text-white p-1" aria-label="Dismiss">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {releaseNotes && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">What's new in v{latestVersion}</p>
              <p className="text-sm text-slate-700">{releaseNotes}</p>
            </div>
          )}
          {!releaseNotes && (
            <p className="text-sm text-slate-600">
              A new version of the app is available with the latest features and improvements.
            </p>
          )}

          <div className="space-y-2">
            {android && (
              <>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-teal-400 transition-colors flex items-center justify-center gap-2"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloading ? 'Downloading APK...' : 'Download Update'}
                </button>
                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-3 text-xs text-slate-400">or</span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>
                <button
                  onClick={handleCopyLink}
                  className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Link Copied! Open Chrome to paste' : 'Copy Link & Open in Chrome'}
                </button>
                {copied && (
                  <p className="text-xs text-green-600 text-center font-medium">
                    Open Chrome browser, paste the link in the address bar, and press Go
                  </p>
                )}
                {!copied && (
                  <p className="text-xs text-slate-400 text-center">
                    If download doesn't start, copy the link and paste in Chrome
                  </p>
                )}
              </>
            )}
            {ios && (
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-700">
                  Updates are delivered through TestFlight. Open TestFlight to install the latest version.
                </p>
              </div>
            )}
            <button onClick={handleDismiss} className="w-full px-4 py-2.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

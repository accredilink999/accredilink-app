/**
 * AppUpdateChecker
 *
 * Runs on app start (after auth). On native platforms, checks the
 * `app_download_android` system setting for a newer version.
 * Shows a dismissable dialog once per new version.
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { APP_VERSION, isUpdateAvailable } from '@/lib/appVersion';
import { openExternalUrl } from '@/lib/openExternalUrl';
import { Download, X, Copy, Check } from 'lucide-react';

function isNativePlatform() {
  return window.Capacitor?.isNativePlatform?.() === true;
}

export default function AppUpdateChecker() {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

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
    staleTime: 1000 * 60 * 30, // cache 30 min
  });

  const latestVersion = latestInfo?.version;
  const downloadUrl = latestInfo?.file_url;
  const releaseNotes = latestInfo?.notes;
  const updateAvailable = isUpdateAvailable(APP_VERSION, latestVersion);

  // Check if user already dismissed this version
  useEffect(() => {
    if (latestVersion) {
      const key = `update-dismissed-${latestVersion}`;
      if (localStorage.getItem(key)) {
        setDismissed(true);
      }
    }
  }, [latestVersion]);

  // Only show on native, only when update exists, only if not dismissed
  if (!isNativePlatform() || !updateAvailable || dismissed || !downloadUrl) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(`update-dismissed-${latestVersion}`, '1');
    setDismissed(true);
  };

  const handleDownload = () => {
    openExternalUrl(downloadUrl);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Update Available</h2>
                <p className="text-teal-100 text-sm">
                  v{APP_VERSION} &rarr; v{latestVersion}
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/70 hover:text-white p-1"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            A new version of the app is available. Update to get the latest features and improvements.
          </p>

          {releaseNotes && (
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">What's new</p>
              <p className="text-sm text-slate-700">{releaseNotes}</p>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleDownload}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Update
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copied!' : 'Copy Download Link'}
            </button>
            <p className="text-xs text-slate-400 text-center">
              If download doesn't start, copy the link and open in Chrome
            </p>

            <button
              onClick={handleDismiss}
              className="w-full px-4 py-2.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

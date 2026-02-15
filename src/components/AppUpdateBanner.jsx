import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, X } from 'lucide-react';

const DISMISSED_KEY = 'app-update-dismissed';

export default function AppUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    // Check if already dismissed this session
    try {
      const stored = sessionStorage.getItem(DISMISSED_KEY);
      return stored === 'true';
    } catch { return false; }
  });

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Listen for controller change (new service worker activated)
    const onControllerChange = () => {
      // Only show if not already dismissed this session
      try {
        if (sessionStorage.getItem(DISMISSED_KEY) !== 'true') {
          setUpdateAvailable(true);
        }
      } catch {
        setUpdateAvailable(true);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Periodically check for updates (every 5 minutes instead of every minute)
    const interval = setInterval(async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        registrations.forEach(registration => registration.update());
      } catch {}
    }, 300000);

    // Initial check
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => registration.update());
    }).catch(() => {});

    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const handleRefresh = useCallback(() => {
    try { sessionStorage.removeItem(DISMISSED_KEY); } catch {}
    window.location.reload();
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setUpdateAvailable(false);
    try { sessionStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
  }, []);

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <div
      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-3 flex items-center gap-3 mx-4 mb-2"
      role="alert"
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Update available</p>
        <p className="text-xs text-blue-100">Tap refresh for the latest version</p>
      </div>
      <Button
        size="sm"
        onClick={handleRefresh}
        className="bg-white text-blue-600 hover:bg-blue-50 h-8 px-3 flex-shrink-0"
      >
        <RefreshCw className="w-3 h-3 mr-1" />
        Refresh
      </Button>
      <button
        onClick={handleDismiss}
        className="text-blue-100 hover:text-white transition-colors p-2 -mr-1 flex-shrink-0"
        aria-label="Dismiss update banner"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Download } from 'lucide-react';

export default function AppDownloadPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is installed via native markers
    const isNativeApp = window.Capacitor?.isNativePlatform?.() ||
                        window.navigator.standalone === true ||
                        window.matchMedia('(display-mode: standalone)').matches ||
                        localStorage.getItem('app_installed');

    // Check if dismissed recently
    const lastDismissed = localStorage.getItem('app_download_dismissed');
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    if (!isNativeApp && (!lastDismissed || now - parseInt(lastDismissed) > dayInMs)) {
      setIsInstalled(false);
      setIsVisible(true);
    } else {
      setIsInstalled(isNativeApp);
    }
  }, []);

  if (isInstalled || !isVisible) return null;

  const handleDismiss = () => {
    localStorage.setItem('app_download_dismissed', Date.now().toString());
    setIsVisible(false);
  };

  const handleDownload = () => {
    // Detect if iOS or Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    let storeUrl = '';
    if (isIOS) {
      storeUrl = 'https://apps.apple.com'; // Replace with your App Store link
    } else if (isAndroid) {
      storeUrl = 'https://play.google.com/store'; // Replace with your Google Play link
    } else {
      // Web app install prompt
      storeUrl = window.location.origin;
    }

    window.open(storeUrl, '_blank');
    handleDismiss();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl shadow-lg p-4">
        <div className="flex items-start gap-3">
          <Download className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Get Our App</h3>
            <p className="text-sm text-teal-50 mb-3">
              Download the native app for faster access and offline support.
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleDownload}
                className="bg-white text-teal-600 hover:bg-teal-50"
              >
                Download Now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-white hover:bg-teal-700"
              >
                Dismiss
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
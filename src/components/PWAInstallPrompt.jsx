import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

function detectPlatform() {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  if (/macintosh|mac os/.test(ua) && navigator.maxTouchPoints > 0) return 'ios';
  return 'desktop';
}

function detectBrowser() {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('edg/')) return 'edge';
  if (ua.includes('chrome') && !ua.includes('edg/')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  return 'other';
}

export default function PWAInstallPrompt() {
  const { canPrompt, isInstalled, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  const platform = detectPlatform();
  const browser = detectBrowser();

  // On Chromium browsers, the native install dialog auto-fires from the hook.
  // Only show manual instructions for browsers without beforeinstallprompt (iOS Safari, Firefox).
  const hasNativePrompt = canPrompt || browser === 'chrome' || browser === 'edge';

  useEffect(() => {
    if (isInstalled || hasNativePrompt) return;

    // Show manual instructions after a short delay for non-Chromium browsers
    const timer = setTimeout(() => {
      if (!isInstalled && !sessionStorage.getItem('pwa_prompt_dismissed')) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isInstalled, hasNativePrompt]);

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt || isInstalled) return null;

  // If native prompt is still available (user might have dismissed auto-prompt),
  // show a simple install button
  if (canPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Install CareCall</h3>
                <p className="text-white/70 text-xs">One-click install</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-white/60 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/90 text-sm mb-4">
            Install CareCall for quick access, push notifications, and offline support.
          </p>
          <div className="flex gap-3">
            <Button onClick={handleDismiss} variant="outline" className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 min-h-[44px]">
              Not Now
            </Button>
            <Button onClick={handleInstall} className="flex-1 bg-white text-teal-600 hover:bg-white/90 font-semibold min-h-[44px]">
              <Download className="w-4 h-4 mr-2" /> Install
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Manual instructions for iOS Safari
  if (platform === 'ios') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Install CareCall</h3>
                <p className="text-white/70 text-xs">iPhone / iPad</p>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-white/60 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-white/15 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Install on your device
            </p>
            <ol className="text-white/90 text-sm list-decimal list-inside space-y-1.5">
              <li>Tap the <strong>Share</strong> button (box with arrow) at the bottom of Safari</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> in the top right corner</li>
            </ol>
          </div>
          <Button onClick={handleDismiss} variant="outline" className="w-full mt-4 bg-white/20 border-white/30 text-white hover:bg-white/30 min-h-[44px]">
            Got It
          </Button>
        </div>
      </div>
    );
  }

  // Fallback for other browsers (Firefox, etc.)
  return null;
}

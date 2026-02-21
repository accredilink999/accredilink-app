/**
 * Shared PWA install hook.
 * Captures the beforeinstallprompt event ONCE globally and can auto-trigger
 * the native install dialog on first visit.
 */
import { useState, useEffect, useCallback } from 'react';

// ── Global state (shared across all hook consumers) ──────────────────
let _deferredPrompt = null;
let _autoPrompted = false;
const _listeners = new Set();

function _notify() {
  _listeners.forEach((fn) => fn(_deferredPrompt));
}

// Capture the event as early as possible (module-level)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    _notify();

    // Note: auto-prompting removed — browsers require a user gesture
    // to call prompt(). The PWAInstallButton component handles this.
  });

  window.addEventListener('appinstalled', () => {
    _deferredPrompt = null;
    _notify();
  });
}

// ── Hook ─────────────────────────────────────────────────────────────
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(_deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  });

  useEffect(() => {
    const handler = (prompt) => {
      setDeferredPrompt(prompt);
      if (!prompt) setIsInstalled(true); // appinstalled fired
    };
    _listeners.add(handler);
    // Sync with current value in case event fired before this component mounted
    setDeferredPrompt(_deferredPrompt);
    return () => _listeners.delete(handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!_deferredPrompt) return null;
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    _deferredPrompt = null;
    _notify();
    return outcome;
  }, []);

  return {
    deferredPrompt,
    isInstalled,
    canPrompt: !!deferredPrompt && !isInstalled,
    promptInstall,
  };
}

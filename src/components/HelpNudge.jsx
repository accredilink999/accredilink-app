import { useState, useEffect } from 'react';
import { X, HelpCircle, Mail, BookOpen } from 'lucide-react';

const STORAGE_KEY = 'carecall_help_nudge';
const NUDGE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes between nudges
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h after "Don't show again"

/**
 * HelpNudge — periodic popup offering FAQ / email help.
 * Shows every ~30 minutes of active use. Can be dismissed or snoozed for 24h.
 */
export default function HelpNudge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

      // If user dismissed for 24h, respect that
      if (stored.dismissedUntil && Date.now() < stored.dismissedUntil) return;

      // Show after interval since last nudge
      const lastShown = stored.lastShown || 0;
      const elapsed = Date.now() - lastShown;
      const delay = Math.max(0, NUDGE_INTERVAL_MS - elapsed);

      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    } catch {
      // localStorage unavailable — don't show
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      stored.lastShown = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {}
  };

  const dismissForDay = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        lastShown: Date.now(),
        dismissedUntil: Date.now() + DISMISS_COOLDOWN_MS,
      }));
    } catch {}
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-4 z-[9998] w-80 max-w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <HelpCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">Need Help?</span>
          </div>
          <button onClick={dismiss} className="text-white/70 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-slate-600">
            We're here to help you get the most out of CareCall AI. Check our guides or get in touch!
          </p>

          <a
            href="/HowToUseApp"
            onClick={dismiss}
            className="flex items-center gap-3 p-3 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-teal-800">How to Use This App</p>
              <p className="text-xs text-teal-600">Step-by-step guides for every feature</p>
            </div>
          </a>

          <a
            href="mailto:support@carecallai.co.uk?subject=Help%20Request%20-%20CareCall%20AI"
            onClick={dismiss}
            className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Mail className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">Email Support</p>
              <p className="text-xs text-blue-600">We'll get back to you within 24 hours</p>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3">
          <button
            onClick={dismissForDay}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Don't show again today
          </button>
        </div>
      </div>
    </div>
  );
}

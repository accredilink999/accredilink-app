import { useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

/**
 * Global error catcher — captures unhandled JS errors, promise rejections,
 * and console.error calls, then logs them to the app_error_logs table.
 * Mount once at the top level of the app.
 */
export default function ErrorCatcher() {
  useEffect(() => {
    const logError = async (errorData) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('app_error_logs').insert({
          user_id: user?.id || null,
          user_email: user?.email || 'anonymous',
          error_message: String(errorData.message || '').slice(0, 2000),
          error_stack: String(errorData.stack || '').slice(0, 5000),
          error_source: errorData.source || 'unknown',
          page_url: window.location.pathname,
          user_agent: navigator.userAgent.slice(0, 500),
          metadata: errorData.metadata ? JSON.stringify(errorData.metadata) : null,
        });
      } catch (e) {
        // Silently fail — don't cause error loops
      }
    };

    // 1. Unhandled JS errors
    const onError = (event) => {
      logError({
        message: event.message,
        stack: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
        source: 'window.onerror',
      });
    };

    // 2. Unhandled promise rejections
    const onUnhandledRejection = (event) => {
      const reason = event.reason;
      const msg = reason?.message || String(reason);
      // Skip known harmless rejections
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('Failed to start the audio device') ||
        msg.includes('Keyboard') ||
        msg.includes('not implemented on web') ||
        msg.includes('BeforeInstallPromptEvent') ||
        msg.includes('Load failed')
      ) return;
      logError({
        message: msg,
        stack: reason?.stack || '',
        source: 'unhandledrejection',
      });
    };

    // 3. Intercept console.error to catch React/library errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      const msg = args.map(a => {
        if (a instanceof Error) return a.message;
        if (typeof a === 'string') return a;
        try { return JSON.stringify(a); } catch { return String(a); }
      }).join(' ');

      // Skip noisy/known harmless messages
      if (
        msg.includes('ResizeObserver') ||
        msg.includes('Loading chunk') ||
        msg.includes('validateDOMNesting') ||
        msg.includes('Each child in a list') ||
        msg.includes('getAllStaff network error') ||
        msg.includes('falling back to profiles') ||
        msg.includes('Geolocation error') ||
        msg.includes('Failed to start the audio device') ||
        msg.includes('DialogContent') ||
        msg.includes('DialogTitle') ||
        msg.includes('VisuallyHidden') ||
        msg.includes('Load failed')
      ) return;

      logError({
        message: msg.slice(0, 2000),
        stack: args.find(a => a instanceof Error)?.stack || '',
        source: 'console.error',
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      console.error = originalConsoleError;
    };
  }, []);

  return null; // Renders nothing — just attaches listeners
}

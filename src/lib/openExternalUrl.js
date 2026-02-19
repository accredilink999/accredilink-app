/**
 * Opens a URL in the external system browser (Chrome on Android).
 *
 * On Capacitor Android: uses an Android intent to open in Chrome/default browser.
 * Falls back to the iframe DownloadManager approach if intent fails.
 * On web: opens in new tab.
 */
export function openExternalUrl(url) {
  const isCapacitor = window.Capacitor?.isNativePlatform?.();

  if (isCapacitor) {
    // Try opening in the system browser via Android intent
    // This opens Chrome (or the default browser) which handles downloads properly
    try {
      const intentUrl = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
      window.location.href = intentUrl;
    } catch {
      // Fallback: hidden iframe to trigger WebView DownloadManager
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
      }, 5000);
    }
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Opens a URL in the system browser instead of the WebView.
 * Uses navigator.share() on Android as the most reliable approach.
 */
export async function openExternalUrl(url) {
  const isCapacitor = window.Capacitor?.isNativePlatform?.();

  if (isCapacitor) {
    // Try @capacitor/browser plugin first (available in newer APK builds)
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url, windowName: '_system' });
      return;
    } catch {
      // Plugin not installed
    }

    // Use navigator.share() to open Android share sheet
    // User can pick Chrome/browser to open the download URL
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Download Update',
          text: 'Open this link in Chrome to download the update',
          url,
        });
        return;
      } catch (e) {
        // User cancelled share or share failed
        if (e.name !== 'AbortError') {
          console.warn('[openExternalUrl] share failed:', e);
        }
        return;
      }
    }

    // Last resort: copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // silent fail
    }
  } else {
    window.open(url, '_blank');
  }
}

/**
 * Opens a URL in the external system browser.
 *
 * On Capacitor (iOS & Android): uses @capacitor/browser to open in Safari/Chrome.
 * On web: opens in new tab.
 */
export async function openExternalUrl(url) {
  const isCapacitor = window.Capacitor?.isNativePlatform?.();

  if (isCapacitor) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
    } catch {
      // Fallback if Browser plugin fails
      window.location.href = url;
    }
  } else {
    window.open(url, '_blank');
  }
}

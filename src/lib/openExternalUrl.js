/**
 * Opens a URL in the system browser (Chrome/Safari) instead of the WebView.
 * Essential for APK downloads which don't work inside Capacitor WebViews.
 */
export async function openExternalUrl(url) {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
  } catch {
    window.open(url, '_blank');
  }
}

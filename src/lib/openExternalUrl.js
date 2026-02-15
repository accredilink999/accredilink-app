/**
 * Opens a URL in the system browser (Chrome/Safari) instead of the WebView.
 * Essential for APK downloads which don't work inside Capacitor WebViews.
 */
export function openExternalUrl(url) {
  const isCapacitor = window.Capacitor?.isNativePlatform?.();
  const isAndroid = window.Capacitor?.getPlatform?.() === 'android';

  if (isCapacitor && isAndroid) {
    // On Android Capacitor, use intent URL to open in Chrome
    const schemeUrl = url.replace(/^https?:\/\//, '');
    const scheme = url.startsWith('https') ? 'https' : 'http';
    window.location.href = `intent://${schemeUrl}#Intent;scheme=${scheme};action=android.intent.action.VIEW;end`;
  } else {
    // iOS or web — just open in new tab/window
    window.open(url, '_blank');
  }
}

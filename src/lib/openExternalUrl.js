/**
 * Opens a URL externally or triggers a download.
 *
 * On Capacitor Android: uses a hidden iframe to trigger the WebView's
 * native DownloadManager listener (configured in MainActivity.java).
 * The APK downloads in the background with a notification.
 *
 * On web: opens in new tab.
 */
export function openExternalUrl(url) {
  const isCapacitor = window.Capacitor?.isNativePlatform?.();

  if (isCapacitor) {
    // Use hidden iframe to trigger WebView's native download listener
    // MainActivity.java has a DownloadManager listener that handles file downloads
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch {}
    }, 5000);
  } else {
    window.open(url, '_blank');
  }
}

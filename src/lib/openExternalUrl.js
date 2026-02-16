/**
 * Opens a URL in the system browser or downloads a file.
 * Tries multiple approaches for Capacitor Android WebView compatibility.
 */
export async function openExternalUrl(url) {
  const isCapacitor = window.Capacitor?.isNativePlatform?.();

  if (isCapacitor) {
    // Try @capacitor/browser plugin first (cleanest approach)
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url, windowName: '_system' });
      return;
    } catch {
      // Plugin not installed, try fallbacks
    }

    // Fallback: fetch file as blob and trigger download via blob URL
    // This works in WebViews where window.open and <a> tags don't
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('fetch failed');
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      // Extract filename from URL
      const filename = url.split('/').pop() || 'download.apk';
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 200);
      return;
    } catch (e) {
      console.warn('[openExternalUrl] blob download failed:', e);
    }

    // Last resort: navigate directly (may leave the app briefly)
    window.location.href = url;
  } else {
    window.open(url, '_blank');
  }
}

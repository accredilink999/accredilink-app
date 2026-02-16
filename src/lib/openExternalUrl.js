/**
 * Opens a URL in the system browser (Chrome/Safari) instead of the WebView.
 * Tries multiple approaches for Capacitor Android compatibility.
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
      // Plugin not installed, try fallback
    }

    // Fallback: create a hidden <a> tag and click it
    // This often triggers the system's download/browser handler
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 100);
  } else {
    window.open(url, '_blank');
  }
}

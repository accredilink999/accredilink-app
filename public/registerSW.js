if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) {
      // Force check for updates on every page load
      reg.update();
      // Also check every 60 seconds
      setInterval(function() { reg.update(); }, 60 * 1000);
    });
  });
}

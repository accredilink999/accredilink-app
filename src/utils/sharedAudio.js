// Shared AudioContext — created once across the whole app.
// When Agora (TwoWayRadio) unlocks it, all audio (including alerter tones) works freely.
let _sharedCtx = null;

export function getAudioCtx() {
  try {
    if (!_sharedCtx || _sharedCtx.state === 'closed') {
      _sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_sharedCtx.state === 'suspended') _sharedCtx.resume().catch(() => {});
    return _sharedCtx;
  } catch { return null; }
}

// Run fn(ctx) once the context is confirmed running
export function withRunningCtx(fn) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'running') { try { fn(ctx); } catch {} return; }
  ctx.resume().then(() => { try { fn(ctx); } catch {} }).catch(() => {});
}

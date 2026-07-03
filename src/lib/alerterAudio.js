/**
 * alerterAudio.js
 * Plays pager.mp3 via AudioContext (not HTMLAudioElement) so autoplay works on
 * cold start / notification tap — same pattern as the P2P call ringtone.
 * The buffer is preloaded on app mount so playback is instant.
 */

let _ctx    = null;
let _buffer = null;
let _source = null;

function getCtx() {
  try {
    if (!_ctx || _ctx.state === 'closed') {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return _ctx;
  } catch { return null; }
}

async function loadBuffer() {
  if (_buffer) return _buffer;
  const ctx = getCtx();
  if (!ctx) return null;
  try {
    const resp = await fetch('/pager.mp3');
    const ab   = await resp.arrayBuffer();
    _buffer    = await ctx.decodeAudioData(ab);
  } catch {}
  return _buffer;
}

export function playAlerterTone() {
  const ctx = getCtx();
  if (!ctx) return () => {};

  const doPlay = () => {
    if (!_buffer) return;
    if (_source) { try { _source.stop(); } catch {} _source = null; }
    _source = ctx.createBufferSource();
    _source.buffer = _buffer;
    _source.loop   = true;
    _source.connect(ctx.destination);
    _source.start();
  };

  if (ctx.state === 'running') {
    doPlay();
  } else {
    ctx.resume().then(doPlay).catch(() => {});
  }

  return () => {
    if (_source) { try { _source.stop(); } catch {} _source = null; }
  };
}

// Pre-warm: create context and preload buffer so first play is instant
export async function preWarmAlerterAudio() {
  try {
    getCtx();
    await loadBuffer();
  } catch {}
}

// Call this inside a user gesture to unlock the AudioContext on Android WebView
export function resumeAlerterCtx() {
  const ctx = getCtx();
  if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
}

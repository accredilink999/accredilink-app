/**
 * alerterAudio.js
 * Mirrors the AudioContext oscillator pattern from TwoWayRadio.jsx so alerter
 * tones fire reliably in all contexts (cold start, background, notification tap).
 * HTMLAudioElement.play() is blocked by autoplay policy on cold start;
 * AudioContext.resume() is not, matching how P2P call ringtones work.
 */

let _ctx = null;

function getCtx() {
  try {
    if (!_ctx || _ctx.state === 'closed') {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
    return _ctx;
  } catch { return null; }
}

// Pager-style tone pattern (distinct from radio ring)
const FREQS = [1400, 1000, 1400, 1000];

export function playAlerterTone() {
  const ctx = getCtx();
  if (!ctx) return () => {};

  let timer = null;
  const burst = () => FREQS.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    const t = ctx.currentTime + i * 0.13;
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
    osc.start(t);
    osc.stop(t + 0.11);
  });

  const start = () => { burst(); timer = setInterval(burst, 2200); };

  if (ctx.state === 'running') {
    start();
  } else {
    ctx.resume().then(start).catch(() => {});
  }

  return () => { if (timer) clearInterval(timer); };
}

export function stopAlerterTone(stopFn) {
  if (typeof stopFn === 'function') stopFn();
}

// Pre-warm so the context exists before first alert
export function preWarmAlerterAudio() {
  try { getCtx(); } catch {}
}

import { toast } from 'sonner';

// Web Audio API tone generator for toast notifications
// Uses short, distinct tones so they don't feel intrusive

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequencies, { volume = 0.15, duration = 120, gap = 60, wave = 'sine' } = {}) {
  try {
    const ctx = getAudioContext();
    let startTime = ctx.currentTime;

    for (const freq of frequencies) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration / 1000);
      startTime += (duration + gap) / 1000;
    }
  } catch {
    // Silently fail if audio is unavailable
  }
}

// Sound presets
const sounds = {
  success: () => playTone([523, 659, 784], { volume: 0.12, duration: 100, gap: 50, wave: 'sine' }),       // C5-E5-G5 ascending chord
  error:   () => playTone([440, 349], { volume: 0.15, duration: 150, gap: 80, wave: 'triangle' }),         // A4-F4 descending
  warning: () => playTone([440, 440], { volume: 0.12, duration: 120, gap: 100, wave: 'triangle' }),        // double A4
  info:    () => playTone([587], { volume: 0.10, duration: 100, wave: 'sine' }),                            // single D5 ping
};

// Patch toast methods to include sounds
const originalSuccess = toast.success;
const originalError = toast.error;
const originalWarning = toast.warning;
const originalInfo = toast.info;

toast.success = function (...args) {
  sounds.success();
  return originalSuccess.apply(this, args);
};

toast.error = function (...args) {
  sounds.error();
  return originalError.apply(this, args);
};

toast.warning = function (...args) {
  sounds.warning();
  return originalWarning.apply(this, args);
};

toast.info = function (...args) {
  sounds.info();
  return originalInfo.apply(this, args);
};

export default sounds;

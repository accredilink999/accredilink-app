// ── PIN utilities ──────────────────────────────────────────────────────────────
// PINs are hashed with SHA-256 and stored in localStorage per-user per-device.
// They are a CONVENIENCE feature (quick unlock), not a replacement for the
// Supabase session. The real auth state is always managed by Supabase.

const HASH_KEY    = (uid) => `cc_pin_hash_${uid}`;
const ASKED_KEY   = (uid) => `cc_pin_asked_${uid}`;
const SESSION_KEY = 'cc_pin_unlocked'; // sessionStorage — cleared on tab/app close

// ── Hashing ───────────────────────────────────────────────────────────────────

async function hashPin(userId, pin) {
  const raw = `carecallai:${userId}:${pin}`;
  const data = new TextEncoder().encode(raw);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Storage helpers ───────────────────────────────────────────────────────────

export function hasPin(userId) {
  if (!userId) return false;
  return !!localStorage.getItem(HASH_KEY(userId));
}

export async function savePin(userId, pin) {
  const hash = await hashPin(userId, pin);
  localStorage.setItem(HASH_KEY(userId), hash);
}

export async function verifyPin(userId, pin) {
  const stored = localStorage.getItem(HASH_KEY(userId));
  if (!stored) return false;
  const hash = await hashPin(userId, pin);
  return hash === stored;
}

export function removePin(userId) {
  localStorage.removeItem(HASH_KEY(userId));
}

// ── "Have we asked this user about PIN?" ─────────────────────────────────────

export function wasPinPromptShown(userId) {
  if (!userId) return true; // don't ask if we don't have a user ID
  return localStorage.getItem(ASKED_KEY(userId)) === '1';
}

export function markPinPromptShown(userId) {
  if (!userId) return;
  localStorage.setItem(ASKED_KEY(userId), '1');
}

// ── Session unlock state (per browser tab / PWA session) ─────────────────────

export function isPinSessionUnlocked() {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function setPinSessionUnlocked() {
  sessionStorage.setItem(SESSION_KEY, '1');
}

/**
 * Single source of truth for the installed app version.
 * Bump this value whenever a new APK is built and uploaded.
 */
export const APP_VERSION = '1.0.0';

/**
 * Compare two semver strings (e.g. "1.2.3").
 * Returns true when `latest` is newer than `current`.
 */
export function isUpdateAvailable(current, latest) {
  if (!current || !latest) return false;
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cv = c[i] || 0;
    const lv = l[i] || 0;
    if (lv > cv) return true;
    if (lv < cv) return false;
  }
  return false;
}

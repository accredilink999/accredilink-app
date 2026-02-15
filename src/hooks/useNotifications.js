/**
 * useNotifications
 *
 * Wires Supabase realtime events → sonner toast notifications + Web Audio sounds.
 * Respects per-event rules saved by the admin in Settings → Notification Rules.
 *
 * Usage: call this hook once in Layout.jsx alongside useNotificationManager.
 */

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// ---------------------------------------------------------------------------
// Sound engine — Web Audio API tones
// ---------------------------------------------------------------------------

const TONE_PRESETS = {
  none: null,
  gentle:     { freqs: [700, 900], vol: 0.18, dur: 0.12, gap: 0.18 },
  alert:      { freqs: [500, 700, 900], vol: 0.28, dur: 0.15, gap: 0.20 },
  urgent:     { freqs: [400, 600, 400, 700], vol: 0.42, dur: 0.20, gap: 0.25 },
  message:    { freqs: [800, 1000, 1200], vol: 0.25, dur: 0.13, gap: 0.18 },
  critical:   { freqs: [350, 550, 350, 550, 350], vol: 0.50, dur: 0.22, gap: 0.28 },
  // Additional presets
  soft_bell:  { freqs: [523, 659, 784], vol: 0.15, dur: 0.25, gap: 0.15, wave: 'sine' },
  doorbell:   { freqs: [880, 660], vol: 0.22, dur: 0.30, gap: 0.10, wave: 'sine' },
  triple_beep:{ freqs: [1000, 1000, 1000], vol: 0.20, dur: 0.08, gap: 0.12 },
  ascending:  { freqs: [400, 500, 600, 700, 800], vol: 0.20, dur: 0.10, gap: 0.08 },
  descending: { freqs: [800, 700, 600, 500, 400], vol: 0.20, dur: 0.10, gap: 0.08 },
  ping:       { freqs: [1200], vol: 0.25, dur: 0.15, gap: 0 },
  double_ping:{ freqs: [1200, 1400], vol: 0.22, dur: 0.10, gap: 0.20 },
  warble:     { freqs: [600, 800, 600, 800], vol: 0.25, dur: 0.08, gap: 0.06 },
  horn:       { freqs: [440, 550, 660], vol: 0.35, dur: 0.25, gap: 0.05, wave: 'sawtooth' },
  siren:      { freqs: [600, 900, 600, 900, 600], vol: 0.30, dur: 0.12, gap: 0.04 },
  xylophone:  { freqs: [523, 587, 659, 784, 880], vol: 0.18, dur: 0.15, gap: 0.10, wave: 'triangle' },
  bubble:     { freqs: [300, 500, 800, 1200], vol: 0.18, dur: 0.08, gap: 0.06 },
};

function playTone(preset) {
  if (!preset) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    preset.freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = preset.wave || 'sine';
      const t = now + i * (preset.dur + preset.gap);
      gain.gain.setValueAtTime(preset.vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + preset.dur);
      osc.start(t);
      osc.stop(t + preset.dur + 0.05);
    });
  } catch (_) { /* audio not available */ }
}

/** Play an uploaded audio file by URL */
function playAudioFile(url) {
  if (!url) return;
  try {
    const audio = new Audio(url);
    audio.play();
  } catch (_) { /* audio not available */ }
}

/** Play any sound — handles both tone preset keys and custom:url values */
function playSound(soundKey) {
  if (!soundKey || soundKey === 'none') return;
  if (soundKey.startsWith('custom:')) {
    playAudioFile(soundKey.slice(7));
  } else {
    playTone(TONE_PRESETS[soundKey]);
  }
}

// ---------------------------------------------------------------------------
// Default notification rules (used when admin has not saved custom rules)
// ---------------------------------------------------------------------------

const DEFAULT_RULES = {
  new_chat_message:  { enabled: true,  sound: 'message',  toastDuration: 8000,  variant: 'info' },
  incident_created:  { enabled: true,  sound: 'urgent',   toastDuration: 12000, variant: 'error' },
  leave_request:     { enabled: true,  sound: 'alert',    toastDuration: 8000,  variant: 'warning' },
  shift_reminder:    { enabled: true,  sound: 'gentle',   toastDuration: 7000,  variant: 'info' },
  training_deadline: { enabled: true,  sound: 'gentle',   toastDuration: 8000,  variant: 'warning' },
  announcement:      { enabled: true,  sound: 'alert',    toastDuration: 10000, variant: 'info' },
  high_priority:     { enabled: true,  sound: 'critical', toastDuration: 15000, variant: 'error' },
  general:           { enabled: true,  sound: 'gentle',   toastDuration: 6000,  variant: 'info' },
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications({ user, currentPageName }) {
  const rulesRef = useRef(DEFAULT_RULES);

  // Load admin-saved rules from SystemSettings
  const { data: savedRules } = useQuery({
    queryKey: ['notificationRules'],
    queryFn: async () => {
      const rows = await base44.entities.SystemSettings.filter({ setting_key: 'notification_rules' });
      if (rows?.length > 0 && rows[0].setting_value) {
        try {
          return typeof rows[0].setting_value === 'string'
            ? JSON.parse(rows[0].setting_value)
            : rows[0].setting_value;
        } catch { return null; }
      }
      return null;
    },
    enabled: !!user?.id,
    staleTime: 120000,
  });

  useEffect(() => {
    if (savedRules) {
      rulesRef.current = { ...DEFAULT_RULES, ...savedRules };
    }
  }, [savedRules]);

  // Helper: get merged rule for an event type
  const getRule = (type) => rulesRef.current[type] || rulesRef.current.general;

  // Helper: show toast based on variant
  function showToast(title, description, type, rule) {
    const opts = { description, duration: rule.toastDuration };
    switch (rule.variant) {
      case 'error':   return toast.error(title, opts);
      case 'warning': return toast.warning(title, opts);
      case 'success': return toast.success(title, opts);
      default:        return toast(title, opts);
    }
  }

  useEffect(() => {
    if (!user?.id) return;

    // ---- Chat messages → toast ----
    const unsubChat = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== 'create') return;
      if (event.data?.sender_id === user.id) return;
      if (currentPageName === 'Chat') return; // Already on chat, no toast needed

      const rule = getRule('new_chat_message');
      if (!rule.enabled) return;

      playSound(rule.sound);
      toast('New Chat Message', {
        description: event.data?.content?.substring(0, 100) || 'You have a new message',
        duration: rule.toastDuration,
        icon: '💬',
        action: { label: 'Open Chat', onClick: () => { window.location.hash = '#/Chat'; } },
      });
    });

    // ---- Notifications (incidents, leave, shifts, training, etc.) → toast ----
    const unsubNotifications = base44.entities.Notification.subscribe((event) => {
      if (event.type !== 'create') return;
      const notif = event.data;
      if (!notif) return;

      // Critical notifications are handled by NotificationBanner — skip toast for them
      if (notif.priority === 'critical') return;

      const type = notif.type || '';
      const priority = notif.priority || 'normal';

      let ruleKey = 'general';
      if (type.includes('incident'))   ruleKey = 'incident_created';
      else if (type.includes('leave')) ruleKey = 'leave_request';
      else if (type.includes('shift')) ruleKey = 'shift_reminder';
      else if (type.includes('training')) ruleKey = 'training_deadline';
      else if (type.includes('announcement')) ruleKey = 'announcement';
      else if (priority === 'high')    ruleKey = 'high_priority';

      const rule = getRule(ruleKey);
      if (!rule.enabled) return;

      playSound(rule.sound);
      showToast(
        notif.title || 'New Notification',
        notif.message?.substring(0, 120) || '',
        ruleKey,
        rule
      );
    });

    return () => {
      unsubChat();
      unsubNotifications();
    };
  }, [user?.id, currentPageName]); // eslint-disable-line react-hooks/exhaustive-deps
}

// Re-export so the rules manager can preview sounds
export { TONE_PRESETS, playTone, playAudioFile, playSound };

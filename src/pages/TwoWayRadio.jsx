import React, { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Radio, Mic, Users, Plus, Trash2, PhoneOff,
  Volume2, Loader2, Signal, ChevronLeft, Phone, Bell,
  AlertTriangle, MapPin, MicOff, X, ChevronDown, MessageSquare, Settings, UserPlus, Home
} from 'lucide-react';
import RadioShiftTab from './radio/RadioShiftTab';
import RadioSettingsTab from './radio/RadioSettingsTab';
import { RADIO_THEMES } from './radio/radioThemes';

const AGORA_APP_ID   = 'ff9f260da10245a5ab4855ea3ec59500';
const AGORA_APP_CERT = 'e8dd782a9eac4d3385162b3a1f81d6c4';
const COUNTDOWN_SECS = 10;

AgoraRTC.setLogLevel(4);

// ── Agora AccessToken V1 ──────────────────────────────────────────────────────
function _crc32(str) {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) { let c = i; for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[i] = c >>> 0; }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < str.length; i++) { const code = str.charCodeAt(i); c = t[(c ^ code) & 0xFF] ^ (c >>> 8); if (code > 255) c = t[(c ^ (code >>> 8)) & 0xFF] ^ (c >>> 8); }
  return (c ^ 0xFFFFFFFF) >>> 0;
}
async function buildAgoraToken(channelName, uid) {
  const expireTs = (Math.floor(Date.now() / 1000) + 3600) >>> 0;
  const salt = (Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
  const ts   = (Math.floor(Date.now() / 1000) + 24 * 3600) >>> 0;
  const uidStr = uid === 0 ? '' : String(uid);
  const u16 = n => { const b = new Uint8Array(2); b[0] = n & 0xFF; b[1] = (n >> 8) & 0xFF; return b; };
  const u32 = n => { n = n >>> 0; const b = new Uint8Array(4); b[0] = n & 0xFF; b[1] = (n >> 8) & 0xFF; b[2] = (n >> 16) & 0xFF; b[3] = (n >> 24) & 0xFF; return b; };
  const cat = (...as) => { const o = new Uint8Array(as.reduce((s, a) => s + a.length, 0)); let p = 0; for (const a of as) { o.set(a, p); p += a.length; } return o; };
  const pb  = b => cat(u16(b.length), b);
  const privs = [[1, expireTs], [2, expireTs], [3, expireTs], [4, expireTs]];
  const m = cat(u32(salt), u32(ts), cat(u16(privs.length), ...privs.flatMap(([k, v]) => [u16(k), u32(v)])));
  const enc = new TextEncoder();
  const ck = await crypto.subtle.importKey('raw', enc.encode(AGORA_APP_CERT), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', ck, cat(enc.encode(AGORA_APP_ID), enc.encode(channelName), enc.encode(uidStr), m)));
  const content = cat(pb(sig), u32(_crc32(channelName)), u32(_crc32(uidStr)), pb(m));
  let bin = ''; content.forEach(b => { bin += String.fromCharCode(b); });
  return '006' + AGORA_APP_ID + btoa(bin);
}

const toUid    = (str = '') => { let h = 0; for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; } return Math.abs(h) % 999999 + 1; };
const getOrgId = () => localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId');
const withOrgFilter = q => { const id = getOrgId(); return id ? q.eq('organization_id', id) : q; };

// ── Audio helpers ─────────────────────────────────────────────────────────────
// Shared AudioContext — created once, avoids 100-200ms cold-start latency on every tone
let _sharedCtx = null;
function getAudioCtx() {
  try {
    if (!_sharedCtx || _sharedCtx.state === 'closed') {
      _sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_sharedCtx.state === 'suspended') _sharedCtx.resume().catch(() => {});
    return _sharedCtx;
  } catch { return null; }
}

// Preload bundled tones so they play instantly on PTT press (no network fetch delay)
const _preloaded = {};
['/radio-tones/Beep Bop.aac', '/radio-tones/Bop Beep.aac', '/radio-tones/Alert tone.aac'].forEach(url => {
  try { const a = new Audio(url); a.preload = 'auto'; _preloaded[url] = a; } catch {}
});

function playCustomSound(key) {
  try {
    const stored = localStorage.getItem('radio_custom_sounds');
    if (!stored) return false;
    const snd = JSON.parse(stored)[key];
    if (!snd?.url) return false;
    const pre = _preloaded[snd.url];
    if (pre) {
      pre.currentTime = 0; pre.volume = 1.0;
      pre.play().catch(() => {});
    } else {
      const a = new Audio(snd.url); a.volume = 1.0; a.play().catch(() => {});
    }
    return true;
  } catch { return false; }
}

function playTone(freqs, loop = false) {
  if (localStorage.getItem('radio_silent_mode') === 'true') return () => {};
  // Custom incoming ring sound (loops until stop() is called)
  if (loop) {
    try {
      const stored = localStorage.getItem('radio_custom_sounds');
      if (stored) {
        const snd = JSON.parse(stored).incoming;
        if (snd?.url) {
          let active = true;
          const step = () => {
            if (!active) return;
            const a = new Audio(snd.url); a.volume = 1.0;
            a.play().catch(() => {});
            a.addEventListener('ended', () => { if (active) setTimeout(step, 300); });
          };
          step();
          return () => { active = false; };
        }
      }
    } catch {}
  }
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let timer = null;
  const burst = () => freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    const t = ctx.currentTime + i * 0.11;
    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
    osc.start(t); osc.stop(t + 0.10);
  });
  burst();
  if (loop) timer = setInterval(burst, 2400);
  return () => { if (timer) clearInterval(timer); ctx.close().catch(() => {}); };
}

function playAlarm() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let active = true;
  const pulse = () => {
    if (!active) return;
    [880, 0, 880, 0, 660].forEach((freq, i) => {
      if (!freq) return;
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'square';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0.85, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.start(t); osc.stop(t + 0.11);
    });
    setTimeout(() => { if (active) pulse(); }, 1800);
  };
  pulse();
  return () => { active = false; ctx.close().catch(() => {}); };
}

// UK TETRA/Airwave-style PTT tones — loud, sharp, two-tone
// talk-up (grant): low→high beep-bop  talk-down (clear): high→low bop-beep
function playPTTTone(type) {
  if (localStorage.getItem('radio_silent_mode') === 'true') return;
  if (playCustomSound(type === 'up' ? 'ptt_up' : 'ptt_down')) return;
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const freqs = type === 'up' ? [880, 1400] : [1400, 880];
    const now = ctx.currentTime;
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      const t = now + i * 0.075;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.92, t + 0.003); // sharp attack
      gain.gain.setValueAtTime(0.92, t + 0.058);
      gain.gain.linearRampToValueAtTime(0, t + 0.072);
      osc.start(t); osc.stop(t + 0.075);
    });
  } catch {}
}

// Call-end tone — three descending tones (bip-bop-boop)
function playCallEndTone() {
  if (localStorage.getItem('radio_silent_mode') === 'true') return;
  if (playCustomSound('call_end')) return;
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    [1200, 900, 600].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      const t = now + i * 0.095;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.85, t + 0.003);
      gain.gain.setValueAtTime(0.85, t + 0.065);
      gain.gain.linearRampToValueAtTime(0, t + 0.088);
      osc.start(t); osc.stop(t + 0.095);
    });
  } catch {}
}

// Call-connected tone — double ascending beep when a P2P call connects
function playCallConnectedTone() {
  if (localStorage.getItem('radio_silent_mode') === 'true') return;
  if (playCustomSound('call_connected')) return;
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    [880, 1400].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      const t = now + i * 0.075;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.8, t + 0.003);
      gain.gain.setValueAtTime(0.8, t + 0.058);
      gain.gain.linearRampToValueAtTime(0, t + 0.072);
      osc.start(t); osc.stop(t + 0.075);
    });
  } catch {}
}

// Callback-request alert tone — uses callback_request slot (defaults to Bop Beep)
function playCallbackRequestTone() {
  if (localStorage.getItem('radio_silent_mode') === 'true') return;
  if (playCustomSound('callback_request')) return;
  // Synthesised fallback: descending double-beep (bop-beep feel)
  try {
    const ctx = getAudioCtx(); if (!ctx) return;
    const now = ctx.currentTime;
    [1400, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      const t = now + i * 0.075;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.8, t + 0.003);
      gain.gain.setValueAtTime(0.8, t + 0.058);
      gain.gain.linearRampToValueAtTime(0, t + 0.072);
      osc.start(t); osc.stop(t + 0.075);
    });
  } catch {}
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.82; u.volume = 1;
  window.speechSynthesis.speak(u);
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TwoWayRadio() {
  const queryClient = useQueryClient();
  const location    = useLocation();
  const navigate    = useNavigate();

  // On T320 handsets the PTT side bars are unnecessary — hardware button is used
  const isRadioMode = localStorage.getItem('carecall_radio_mode') === 'true';

  // Agora refs
  const clientRef       = useRef(null);
  const micTrackRef     = useRef(null);
  const joinedChRef     = useRef(null);
  const stopToneRef     = useRef(null);
  const outgoingRef     = useRef(null);
  const activeCallIdRef = useRef(null); // tracks active P2P call so either party can end it

  // Realtime channel ref for emergency broadcast
  const rtEmergencyRef = useRef(null);

  // PTT intent ref — tracks whether the user is still holding the button,
  // so we can cancel if they release before the async mic track is ready
  const shouldTalkRef = useRef(false);

  // Emergency refs
  const countdownTimerRef  = useRef(null);
  const countdownAudioRef  = useRef(null);
  const mediaRecorderRef   = useRef(null);
  const recordingChunksRef = useRef([]);
  const locationRef        = useRef(null);
  const stopAlarmRef       = useRef(null);

  // Staff ref so Realtime subscription doesn't re-create when staff list refetches
  const staffRef = useRef([]);

  // ── State ─────────────────────────────────────────────────────────────────
  const [view, setView]                     = useState('main');
  const [isJoined, setIsJoined]             = useState(false);
  const [isTalking, setIsTalking]           = useState(false);
  const [isHandsFree, setIsHandsFree]       = useState(false); // emergency auto-transmit
  const [activeChannel, setActiveChannel]   = useState(null);
  const [speakingUids, setSpeakingUids]     = useState(new Set());
  const [remoteUsers, setRemoteUsers]       = useState([]);
  const [joining, setJoining]               = useState(false);
  const [micPermission, setMicPermission]   = useState('unknown');
  const [selectedPerson, setSelectedPerson] = useState(null);

  // P2P call
  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCall, setOutgoingCall] = useState(null);
  const [callDeclined, setCallDeclined] = useState(false);
  const [dismissedCbReqIds, setDismissedCbReqIds] = useState(() => {
    try {
      const raw = localStorage.getItem('dismissedCallbackRequests');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });

  // Emergency
  const [emergencyCountdown, setEmergencyCountdown] = useState(null); // null | 10…0
  const [emergencyActive, setEmergencyActive]       = useState(false);
  const [emergencyRecording, setEmergencyRecording] = useState(false);
  const [emergencyAddress, setEmergencyAddress]     = useState('');
  const [incomingEmergency, setIncomingEmergency]   = useState(null);

  // Channels panel
  const [newChannelName, setNewChannelName] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);

  // PTT handedness preference (persisted)
  const [pttHandedness, setPttHandedness] = useState(() => localStorage.getItem('pttHandedness') || 'right');
  const toggleHandedness = () => {
    const next = pttHandedness === 'right' ? 'left' : 'right';
    setPttHandedness(next);
    localStorage.setItem('pttHandedness', next);
  };

  const [showSettings, setShowSettings] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [managingChannelId, setManagingChannelId] = useState(null);

  // Area grouping (kept for admin team labels)
  const [expandedAreas, setExpandedAreas] = useState(new Set());
  const [showOffShiftByArea, setShowOffShiftByArea] = useState({});
  const [expandedChannelId, setExpandedChannelId] = useState(null);
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [groupBroadcastActive, setGroupBroadcastActive] = useState(false);

  // Tab navigation, theme, and per-device settings (all localStorage-backed for PWA/native)
  const [radioTheme, setRadioTheme]     = useState(() => localStorage.getItem('radio_theme') || 'blue');
  const [radioTab, setRadioTab]         = useState('radio'); // 'radio' | 'shift' | 'settings'
  const [silentMode, setSilentMode]     = useState(() => localStorage.getItem('radio_silent_mode') === 'true');
  const [showAllAreas, setShowAllAreas] = useState(() => localStorage.getItem('radio_show_all_areas') !== 'false');
  const [areaToggles, setAreaToggles]   = useState(() => { try { return JSON.parse(localStorage.getItem('radio_area_toggles') || '{}'); } catch { return {}; } });
  const [customSounds, setCustomSounds] = useState(() => {
    try {
      const stored = localStorage.getItem('radio_custom_sounds');
      const sounds = stored ? JSON.parse(stored) : {};
      // One-time migration: seed TETRA defaults for any unset slots
      if (localStorage.getItem('radio_sounds_migrated') !== 'v2') {
        const tetra = {
          ptt_up:            { name: 'Beep Bop.aac',  url: '/radio-tones/Beep Bop.aac' },
          ptt_down:          { name: 'Bop Beep.aac',  url: '/radio-tones/Bop Beep.aac' },
          incoming:          { name: 'Alert tone.aac', url: '/radio-tones/Alert tone.aac' },
          call_connected:    { name: 'Beep Bop.aac',  url: '/radio-tones/Beep Bop.aac' },
          callback_request:  { name: 'Bop Beep.aac',  url: '/radio-tones/Bop Beep.aac' },
        };
        let changed = false;
        for (const [k, v] of Object.entries(tetra)) {
          if (!sounds[k]) { sounds[k] = v; changed = true; }
        }
        if (changed) localStorage.setItem('radio_custom_sounds', JSON.stringify(sounds));
        localStorage.setItem('radio_sounds_migrated', 'v2');
      }
      return sounds;
    } catch { return {}; }
  });

  // Handset hardware settings
  const [pttKeyCode, setPttKeyCode] = useState(() => {
    const stored = parseInt(localStorage.getItem('radio_ptt_keycode') || '0');
    if (stored) return stored;
    // Synchronous fallback: ask the native bridge before evaluateJavascript has run
    try {
      const fromBridge = window.AndroidApp?.getDefaultPttKeyCode?.();
      if (fromBridge) {
        const code = parseInt(fromBridge);
        if (code) { localStorage.setItem('radio_ptt_keycode', String(code)); return code; }
      }
    } catch (_) {}
    return 0;
  });
  const [keepAwake, setKeepAwake]             = useState(() => localStorage.getItem('radio_keep_awake') === 'true');
  const [wakeOnIncoming, setWakeOnIncoming]   = useState(() => localStorage.getItem('radio_wake_on_incoming') === 'true');
  const [bringToFront, setBringToFront]       = useState(() => localStorage.getItem('radio_bring_to_front') === 'true');
  const [detectingPTTKey, setDetectingPTTKey] = useState(false);

  // 30s call timeout → text alert modal
  const [textAlertModal, setTextAlertModal] = useState(null);
  const [textAlertMsg, setTextAlertMsg] = useState('');
  const callTimeoutRef = useRef(null);

  useEffect(() => { outgoingRef.current = outgoingCall; }, [outgoingCall]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: user }         = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: staff = [] }   = useQuery({ queryKey: ['staff'],       queryFn: () => base44.entities.User.list() });

  // Callback requests — queried from DB so they survive page loads
  // (placed here, after `user`, to avoid TDZ — user?.id needed in queryKey + enabled)
  const { data: callbackRequestRecords = [] } = useQuery({
    queryKey: ['callbackRequests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const since = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('radio_calls')
        .select('id, caller_id, status, created_at')
        .eq('callee_id', user.id)
        .eq('status', 'callback_request')
        .gt('created_at', since)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });

  // Keep staffRef in sync so Realtime callbacks don't capture stale staff list
  useEffect(() => { staffRef.current = staff; }, [staff]);
  const todayStr               = format(new Date(), 'yyyy-MM-dd');
  const { data: todayShifts = [] } = useQuery({
    queryKey: ['radioShifts', todayStr], queryFn: () => ShiftApi.filter({ date: todayStr }), refetchInterval: 60000,
  });
  const { data: channels = [], isError: channelsError, error: channelsErrorObj } = useQuery({
    queryKey: ['radioChannels'],
    queryFn: async () => { const { data, error } = await withOrgFilter(supabase.from('radio_channels').select('*').order('created_at')); if (error) throw error; return data || []; },
    retry: 3,
    retryDelay: 2000,
  });
  const { data: radioSettings } = useQuery({
    queryKey: ['radioSettings'],
    queryFn: async () => { const { data } = await supabase.from('radio_settings').select('*').limit(1).single(); return data; },
    staleTime: 0, refetchInterval: 30000,
  });
  const { data: areas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.list(),
    staleTime: 300000,
  });

  // Admin-only: today's shift calls for the Shift tab
  const { data: todayShiftCalls = [] } = useQuery({
    queryKey: ['radioShiftCalls', todayStr],
    queryFn: async () => {
      const { data } = await withOrgFilter(
        supabase.from('shift_calls')
          .select('id, shift_id, service_user_name, status, scheduled_time, log_required, care_log_id, shifts(id, staff_id, staff_name, rota_area_id)')
          .eq('call_date', todayStr)
          .order('scheduled_time')
      );
      return data || [];
    },
    enabled: !!user?.id && (user?.role === 'super_admin' || user?.role === 'admin'),
    refetchInterval: 60000,
  });

  // Missed / callback / cancelled calls in the last 24 hours
  const { data: missedCalls = [] } = useQuery({
    queryKey: ['missedRadioCalls', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ data: cbCalls }, { data: dcCalls }, { data: cancelledCalls }] = await Promise.all([
        // I was called and said "call back"
        supabase.from('radio_calls').select('id, caller_id, callee_id, status, created_at')
          .eq('callee_id', user.id).eq('status', 'callback').gt('created_at', since)
          .order('created_at', { ascending: false }),
        // I called someone and they declined
        supabase.from('radio_calls').select('id, caller_id, callee_id, status, created_at')
          .eq('caller_id', user.id).eq('status', 'declined').gt('created_at', since)
          .order('created_at', { ascending: false }),
        // Someone called me but I didn't answer (30s timeout → cancelled)
        supabase.from('radio_calls').select('id, caller_id, callee_id, status, created_at')
          .eq('callee_id', user.id).eq('status', 'cancelled').gt('created_at', since)
          .order('created_at', { ascending: false }),
      ]);
      return [...(cbCalls || []), ...(dcCalls || []), ...(cancelledCalls || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20);
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
  const [dismissedMissedIds, setDismissedMissedIds] = useState(() => {
    try {
      const raw = localStorage.getItem('dismissedMissedCalls');
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch { return new Set(); }
  });
  const dismissMissedCalls = (...ids) => {
    setDismissedMissedIds(prev => {
      const next = new Set([...prev, ...ids]);
      try { localStorage.setItem('dismissedMissedCalls', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const urlPreview = new URLSearchParams(window.location.search).get('preview');
  const isControlDevice = !!user?.is_control_device || urlPreview === 'control';
  // Control devices get full admin-level radio access regardless of their assigned role
  const isSuperAdmin  = user?.role === 'super_admin' || user?.role === 'admin' || isControlDevice;
  const myUid         = user?.id ? toUid(user.id) : null;
  const otherStaff    = staff.filter(s => s.id !== user?.id);
  const staffByUid    = Object.fromEntries(staff.map(s => [toUid(s.id), s]));
  const speakingNames = [...speakingUids].filter(u => u !== myUid).map(u => staffByUid[u]?.full_name || `User ${u}`);

  // Declared early so hooks below can reference them without TDZ errors
  const isInChannel = isJoined && activeChannel;
  const pttMode     = selectedPerson ? 'p2p' : (isInChannel && groupBroadcastActive) ? 'group' : 'disabled';

  // Channel member grouping
  // Admin / control-device users appear in ALL channels so staff can always call them back.
  const channelMembersById = {};
  channels.forEach(ch => { channelMembersById[ch.id] = []; });
  staff.forEach(s => {
    const isControlUser = s.role === 'super_admin' || s.role === 'admin' || s.is_control_device;
    if (isControlUser) {
      channels.forEach(ch => channelMembersById[ch.id].push(s));
    } else if (s.radio_channel_id && channelMembersById[s.radio_channel_id]) {
      channelMembersById[s.radio_channel_id].push(s);
    }
  });
  const assignedIds = new Set(staff.filter(s => s.radio_channel_id).map(s => s.id));
  const unassignedStaff = staff.filter(s => !assignedIds.has(s.id) && s.id !== user?.id);

  // Area labels (for admin assignment modals)
  const areaById = Object.fromEntries(areas.map(a => [String(a.id), a]));
  const adminStaff = otherStaff.filter(s => s.role === 'admin' || s.role === 'super_admin');

  const formatCallTime = (dateStr) => {
    const d = new Date(dateStr);
    if (isToday(d)) return `Today ${format(d, 'HH:mm')}`;
    if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
    return format(d, 'dd MMM, HH:mm');
  };

  // When test mode is ON, only send notifications to the current super admin
  const testMode = !!radioSettings?.test_mode;
  const resolveRecipients = (ids) => testMode ? (user?.id ? [user.id] : []) : ids;


  // 30-second outgoing call timeout → offer text alert
  useEffect(() => {
    if (outgoingCall?.callId) {
      callTimeoutRef.current = setTimeout(async () => {
        const cur = outgoingRef.current;
        if (!cur?.callId) return;
        const calleeInfo = cur.callee;
        if (stopToneRef.current) { stopToneRef.current(); stopToneRef.current = null; }
        await supabase.from('radio_calls').update({ status: 'cancelled' }).eq('id', cur.callId);
        setOutgoingCall(null); setCallDeclined(false);
        setTextAlertModal({ callee: calleeInfo });
      }, 30000);
    } else {
      if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
    }
    return () => { if (callTimeoutRef.current) { clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outgoingCall?.callId]);

  const getStaffStatus = useCallback((staffId) => {
    const shifts = todayShifts.filter(s => s.staff_id === staffId && s.status !== 'cancelled');
    // Actively clocked in → shift status takes priority (auto, cannot be overridden)
    const active = shifts.find(s => s.clock_in_time && !s.clock_out_time);
    if (active) return active.on_break ? 'on_break' : 'with_client';
    // Not clocked in → manual radio_status always wins
    const manualStatus = staff.find(s => s.id === staffId)?.radio_status;
    if (manualStatus && ['available', 'on_break', 'dnd'].includes(manualStatus)) return manualStatus;
    // Fallback: derive from shift state
    if (!shifts.length) return 'off_shift';
    const allDone = shifts.every(s => s.clock_out_time);
    return allDone ? 'off_shift' : 'available';
  }, [todayShifts, staff]);

  // Returns both shift-state and radio-availability for display
  const getCombinedStatus = useCallback((staffId) => {
    const radioStatus = getStaffStatus(staffId);
    const shifts = todayShifts.filter(s => s.staff_id === staffId && s.status !== 'cancelled');
    const allDone = shifts.length > 0 && shifts.every(s => s.clock_out_time);
    const isOnShift = shifts.length > 0 && !allDone;
    const dots  = { with_client: 'bg-red-500', on_break: 'bg-amber-400', available: 'bg-green-500', off_shift: 'bg-blue-500', dnd: 'bg-slate-500' };
    const texts = { with_client: 'text-red-400', on_break: 'text-amber-400', available: 'text-green-400', off_shift: 'text-blue-400', dnd: 'text-slate-400' };
    const radioLabels = { with_client: 'With Client', on_break: 'On Break', available: 'Available', dnd: 'Do Not Disturb' };
    return {
      isOnShift,
      shiftLabel: isOnShift ? 'On Shift' : 'Off Shift',
      radioLabel: radioLabels[radioStatus] || null,
      dot: dots[radioStatus] || 'bg-blue-500',
      text: texts[radioStatus] || 'text-blue-400',
    };
  }, [getStaffStatus, todayShifts]);

  const setMyRadioStatus = async (newStatus) => {
    await base44.entities.User.update(user.id, { radio_status: newStatus });
    queryClient.refetchQueries({ queryKey: ['staff'] });
  };

  const statusCfg = {
    with_client: { label: 'With Client',    dot: 'bg-red-500',    text: 'text-red-400'    },
    on_break:    { label: 'On Break',       dot: 'bg-amber-400',  text: 'text-amber-400'  },
    available:   { label: 'Available',     dot: 'bg-green-500',  text: 'text-green-400'  },
    off_shift:   { label: 'Off Shift',     dot: 'bg-blue-500',   text: 'text-blue-400'   },
    dnd:         { label: 'Do Not Disturb', dot: 'bg-slate-500',  text: 'text-slate-400'  },
  };

  // ── Agora setup ───────────────────────────────────────────────────────────
  useEffect(() => {
    const c = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = c;
    c.on('user-published', async (u, t) => {
      await c.subscribe(u, t);
      if (t === 'audio') { u.audioTrack?.play(); setSpeakingUids(p => new Set([...p, u.uid])); }
      setRemoteUsers([...c.remoteUsers]);
    });
    c.on('user-unpublished', u => { setSpeakingUids(p => { const n = new Set(p); n.delete(u.uid); return n; }); setRemoteUsers([...c.remoteUsers]); });
    c.on('user-left',       u => { setSpeakingUids(p => { const n = new Set(p); n.delete(u.uid); return n; }); setRemoteUsers([...c.remoteUsers]); });
    c.on('user-joined',     () => setRemoteUsers([...c.remoteUsers]));
    return () => { leaveChannel(); c.removeAllListeners(); };
  }, []);

  // ── Agora helpers ─────────────────────────────────────────────────────────
  const leaveChannel = async () => {
    try {
      if (micTrackRef.current) { micTrackRef.current.stop(); micTrackRef.current.close(); micTrackRef.current = null; }
      if (clientRef.current && clientRef.current.connectionState !== 'DISCONNECTED') await clientRef.current.leave();
    } catch {}
    setIsJoined(false); setIsTalking(false); setIsHandsFree(false);
    setRemoteUsers([]); setSpeakingUids(new Set());
    joinedChRef.current = null;
  };

  const joinChannel = async (channelName) => {
    if (!myUid || !clientRef.current) return;
    setJoining(true);
    try {
      if (joinedChRef.current) await leaveChannel();
      const token = await buildAgoraToken(channelName, myUid);
      await clientRef.current.join(AGORA_APP_ID, channelName, token, myUid);
      joinedChRef.current = channelName;
      setIsJoined(true);
    } catch (e) { toast.error('Could not join: ' + e.message); }
    setJoining(false);
  };

  const startTalking = async () => {
    if (!isJoined || isTalking) return;
    shouldTalkRef.current = true;
    try {
      const track = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = track;
      await clientRef.current.publish(track);
      setMicPermission('granted');
      // If user released before the track was ready, stop immediately
      if (!shouldTalkRef.current) {
        try { await clientRef.current.unpublish(track); track.stop(); track.close(); micTrackRef.current = null; } catch {}
        return;
      }
      setIsTalking(true);
    } catch (e) {
      shouldTalkRef.current = false;
      if (e.name === 'NotAllowedError') { setMicPermission('denied'); toast.error('Microphone access denied'); }
      else toast.error('Mic error: ' + e.message);
    }
  };

  const stopTalking = async () => {
    shouldTalkRef.current = false;
    if (isHandsFree) return; // don't stop if in hands-free emergency mode
    if (isTalking) playPTTTone('down');
    try {
      if (micTrackRef.current) { await clientRef.current.unpublish(micTrackRef.current); micTrackRef.current.stop(); micTrackRef.current.close(); micTrackRef.current = null; }
    } catch {}
    setIsTalking(false);
  };

  const stopTone = () => { if (stopToneRef.current) { stopToneRef.current(); stopToneRef.current = null; } };
  const stopAlarm = () => { if (stopAlarmRef.current) { stopAlarmRef.current(); stopAlarmRef.current = null; } };

  // ── Supabase Realtime subscriptions ──────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const orgId = getOrgId() || 'global';

    // P2P incoming call inserts
    const callSub = supabase
      .channel(`radio-calls-in-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radio_calls', filter: `callee_id=eq.${user.id}` }, payload => {
        const call = payload.new;
        if (Date.now() - new Date(call.created_at).getTime() > 30000) return;
        if (call.status === 'pending') {
          const caller = staffRef.current.find(s => s.id === call.caller_id);
          setIncomingCall({ callId: call.id, caller, channelName: call.channel_name });
          stopTone(); stopToneRef.current = playTone([880, 1100, 880, 1100, 660], true);
          // Wake screen and bring app to front on T320 handset
          window.AndroidApp?.wakeForCall?.();
        } else if (call.status === 'callback_request') {
          queryClient.invalidateQueries({ queryKey: ['callbackRequests', user.id] });
          playCallbackRequestTone();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'radio_calls' }, payload => {
        const call = payload.new;
        const cur = outgoingRef.current;

        // Either party ended the call — hang up and return to main
        if (call.status === 'ended' && call.id === activeCallIdRef.current) {
          activeCallIdRef.current = null;
          stopTone();
          leaveChannel().then(() => { setActiveChannel(null); setView('main'); });
          return;
        }

        // Caller cancelled before callee answered — stop ringing on callee side
        setIncomingCall(prev => {
          if (prev && prev.callId === call.id && (call.status === 'cancelled' || call.status === 'declined')) {
            stopTone();
            return null;
          }
          return prev;
        });

        // Caller-side: response from callee
        if (!cur || call.id !== cur.callId) return;
        stopTone();
        if (call.status === 'accepted') {
          activeCallIdRef.current = call.id;
          setOutgoingCall(null); setCallDeclined(false);
          joinChannel(call.channel_name).then(() => { playCallConnectedTone(); setActiveChannel({ name: `📞 ${cur.callee?.full_name}`, id: '__ptp' }); setView('ptt'); });
        } else if (call.status === 'callback') {
          setCallDeclined(true);
          setTimeout(() => { setOutgoingCall(null); setCallDeclined(false); }, 4000);
        } else if (call.status === 'declined') {
          stopTone();
          toast('Call was declined');
          setOutgoingCall(null); setCallDeclined(false);
        }
      })
      .subscribe();

    // Emergency in-app broadcast
    const emergencyCh = supabase.channel(`radio-emergency-${orgId}`);
    emergencyCh.on('broadcast', { event: 'sos' }, ({ payload }) => {
      if (payload.staffId === user.id) return;
      setIncomingEmergency(payload);
      stopAlarm(); stopAlarmRef.current = playAlarm();
      speakText(`Emergency alert. ${payload.staffName || 'A staff member'} needs immediate assistance. Last known location: ${payload.address || 'location unavailable'}`);
    })
    .on('broadcast', { event: 'sos_cancelled' }, ({ payload }) => {
      // Admin or staff member cancelled the emergency
      if (incomingEmergency?.staffId === payload.staffId || true) {
        setIncomingEmergency(null);
        stopAlarm();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        toast(`✅ Emergency cancelled by ${payload.cancelledBy || 'staff'}`);
      }
    })
    .subscribe();
    rtEmergencyRef.current = emergencyCh;

    return () => { supabase.removeChannel(callSub); supabase.removeChannel(emergencyCh); };
  }, [user?.id]);

  // ── Radio action handlers ─────────────────────────────────────────────────

  const initiateP2PCall = async (overridePerson = null) => {
    const target = overridePerson || selectedPerson;
    if (!target || !user?.id) return;
    const ids = [user.id, target.id].sort();
    const chName = `ptp_${ids[0].slice(0, 8)}_${ids[1].slice(0, 8)}`;
    const { data: callRecord, error } = await supabase.from('radio_calls').insert({
      caller_id: user.id, callee_id: target.id,
      channel_name: chName, status: 'pending', organization_id: getOrgId(),
    }).select().single();
    if (error) { toast.error('Failed to initiate call'); return; }
    setOutgoingCall({ callId: callRecord.id, callee: target, channelName: chName });
    setCallDeclined(false);
    stopTone(); stopToneRef.current = playTone([400, 600, 800, 600, 400], true);
    const callerName = user?.full_name || user?.email || 'A team member';
    base44.functions.invoke('createNotification', {
      recipient_ids: resolveRecipients([target.id]), type: 'radio_call',
      title: `📞 ${callerName} is calling you`, message: 'Tap to answer on Team Radio.',
      priority: 'high', action_url: `/TwoWayRadio?call=${chName}`, send_push: true,
    }).catch(() => {});
  };

  const sendCallbackRequest = async (person) => {
    if (!person || !user?.id) return;
    await supabase.from('radio_calls').insert({
      caller_id: user.id, callee_id: person.id,
      channel_name: `cbr_${user.id.slice(0, 8)}`, status: 'callback_request',
      organization_id: getOrgId(),
    });
    const callerName = user?.full_name || 'A team member';
    base44.functions.invoke('createNotification', {
      recipient_ids: resolveRecipients([person.id]), type: 'radio_call',
      title: `📲 ${callerName} wants a call back`,
      message: 'Tap to call them back on Team Radio.',
      priority: 'high', action_url: '/TwoWayRadio', send_push: true,
    }).catch(() => {});
    toast.success(`Call-back request sent to ${person.full_name}`);
  };

  const dismissCallbackRequest = (...ids) => {
    setDismissedCbReqIds(prev => {
      const next = new Set([...prev, ...ids]);
      try { localStorage.setItem('dismissedCallbackRequests', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const callBackFromRequest = (req) => {
    dismissCallbackRequest(req.callId);
    const person = staffRef.current.find(s => s.id === req.callerId) || req.requester;
    setSelectedPerson(person);
    initiateP2PCall(person);
  };

  const callBackFromMissed = (call) => {
    const personId = (call.status === 'callback' || call.status === 'cancelled') ? call.caller_id : call.callee_id;
    const person = staffRef.current.find(s => s.id === personId);
    if (!person) { toast.error('Could not find that person'); return; }
    dismissMissedCalls(call.id);
    setSelectedPerson(person);
    initiateP2PCall(person);
  };

  const cancelOutgoingCall = async () => {
    stopTone();
    if (outgoingCall?.callId) {
      await supabase.from('radio_calls').update({ status: 'cancelled' }).eq('id', outgoingCall.callId);
      // Push notification to callee so they know about the missed call even if app is closed
      const callerName = user?.full_name || 'A team member';
      base44.functions.invoke('createNotification', {
        recipient_ids: resolveRecipients([outgoingCall.callee.id]),
        type: 'radio_call',
        title: `📵 Missed call from ${callerName}`,
        message: 'You missed a radio call. Tap to call back.',
        priority: 'high', action_url: '/TwoWayRadio', send_push: true,
      }).catch(() => {});
    }
    setOutgoingCall(null); setCallDeclined(false);
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    stopTone();
    const { caller, channelName, callId } = incomingCall;
    setIncomingCall(null);
    activeCallIdRef.current = callId;
    await supabase.from('radio_calls').update({ status: 'accepted' }).eq('id', callId);
    await joinChannel(channelName);
    playCallConnectedTone();
    setActiveChannel({ name: `📞 ${caller?.full_name || 'Call'}`, id: '__ptp' }); setView('ptt');
  };

  const endP2PCall = async () => {
    playCallEndTone();
    const callId = activeCallIdRef.current;
    activeCallIdRef.current = null; // clear before DB update so we don't self-trigger
    if (callId) await supabase.from('radio_calls').update({ status: 'ended' }).eq('id', callId);
    await leaveChannel();
    setActiveChannel(null); setView('main');
  };

  const declineIncomingCall = async (status = 'callback') => {
    stopTone();
    if (!incomingCall) return;
    const { callId } = incomingCall;
    setIncomingCall(null);
    if (callId) await supabase.from('radio_calls').update({ status }).eq('id', callId);
  };

  // "Call Back" on incoming call: mark as callback AND immediately dial the caller back
  const callBackImmediately = async () => {
    stopTone();
    if (!incomingCall) return;
    const caller = incomingCall.caller;
    const { callId } = incomingCall;
    setIncomingCall(null);
    if (callId) await supabase.from('radio_calls').update({ status: 'callback' }).eq('id', callId);
    if (caller) await initiateP2PCall(caller);
  };

  const handleSendAlert = async () => {
    const callerName = user?.full_name || user?.email || 'A team member';
    const targets = selectedPerson ? [selectedPerson.id] : otherStaff.map(s => s.id);
    if (!targets.length) return;
    base44.functions.invoke('createNotification', {
      recipient_ids: resolveRecipients(targets), type: 'radio_call',
      title: `🔔 Radio Alert from ${callerName}`,
      message: selectedPerson ? 'Please check your radio.' : 'All staff: please check radio.',
      priority: 'high', action_url: '/TwoWayRadio', send_push: true,
    }).catch(() => {});
    toast.success(selectedPerson ? `Alert sent to ${selectedPerson.full_name}` : 'Alert sent to all staff');
  };

  // ── Emergency ─────────────────────────────────────────────────────────────
  const playCountdownTick = (remaining) => {
    const ctx = countdownAudioRef.current;
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = remaining <= 3 ? 1200 : 880;
      osc.type = remaining <= 3 ? 'square' : 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch {}
  };

  const startEmergencyCountdown = () => {
    if (emergencyCountdown !== null || emergencyActive) return;
    setEmergencyCountdown(COUNTDOWN_SECS);

    // Create AudioContext during user gesture so iOS allows it
    try { countdownAudioRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
    playCountdownTick(COUNTDOWN_SECS);

    // Grab GPS immediately while countdown runs
    locationRef.current = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
        () => {},
        { timeout: 20000, enableHighAccuracy: true }
      );
    }

    let remaining = COUNTDOWN_SECS;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setEmergencyCountdown(remaining);
      if (remaining > 0) playCountdownTick(remaining);
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setEmergencyCountdown(null);
        try { countdownAudioRef.current?.close(); } catch {}
        countdownAudioRef.current = null;
        fireEmergency();
      }
    }, 1000);
  };

  const cancelEmergencyCountdown = () => {
    if (countdownTimerRef.current) { clearInterval(countdownTimerRef.current); countdownTimerRef.current = null; }
    try { countdownAudioRef.current?.close(); } catch {}
    countdownAudioRef.current = null;
    setEmergencyCountdown(null);
    locationRef.current = null;
  };

  const fireEmergency = async () => {
    setEmergencyActive(true);
    setEmergencyAddress('Locating…');

    // Join emergency Agora channel
    const sosChannel = `sos_${(user?.id || 'anon').slice(0, 8)}`;
    await joinChannel(sosChannel);
    setActiveChannel({ name: '🆘 EMERGENCY — LIVE', id: '__sos' });
    setView('ptt');

    // Auto-transmit hands-free so phone can be placed down
    try {
      const track = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = track;
      await clientRef.current.publish(track);
      setIsTalking(true);
      setIsHandsFree(true);  // prevent PTT release from stopping mic
      setMicPermission('granted');
    } catch {}

    // Start audio recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
      recorder.ondataavailable = e => { if (e.data.size > 0) recordingChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType });
        try {
          const fname = `sos_${user?.id || 'anon'}_${Date.now()}.webm`;
          await supabase.storage.from('emergency-audio').upload(fname, blob, { upsert: true });
        } catch {}
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start(2000);
      mediaRecorderRef.current = recorder;
      setEmergencyRecording(true);
    } catch {}

    // Gather location & address
    const loc = locationRef.current;
    const mapsUrl = loc ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : null;
    let address = loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}` : 'Location unavailable';
    if (loc) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`, { headers: { 'Accept-Language': 'en' } });
        const geo = await res.json();
        if (geo?.display_name) address = geo.display_name;
      } catch {}
    }
    setEmergencyAddress(address);

    const staffName = user?.full_name || user?.email || 'A staff member';

    // In-app realtime (fires TTS + overlay on receiving devices instantly)
    rtEmergencyRef.current?.send({
      type: 'broadcast', event: 'sos',
      payload: { staffName, staffId: user.id, loc, address, mapsUrl, sosChannel, timestamp: new Date().toISOString() },
    }).catch(() => {});

    // Push notification to all other staff (wakes locked/backgrounded screens)
    const recipientIds = staff.filter(s => s.id !== user?.id).map(s => s.id);
    if (recipientIds.length > 0) {
      base44.functions.invoke('createNotification', {
        recipient_ids: resolveRecipients(recipientIds), type: 'emergency',
        title: `🚨 EMERGENCY — ${staffName}`,
        message: `Staff needs help. Location: ${address}`,
        priority: 'high', action_url: '/TwoWayRadio', send_push: true,
      }).catch(() => {});
    }
  };

  // End emergency — called by the staff member OR triggered by admin cancel broadcast
  const endEmergency = (cancelledBy) => {
    if (mediaRecorderRef.current?.state !== 'inactive') { mediaRecorderRef.current?.stop(); }
    mediaRecorderRef.current = null;
    setEmergencyRecording(false);
    setEmergencyActive(false);
    setEmergencyAddress('');
    setIsHandsFree(false);

    // Broadcast cancellation so all receiving devices clear their overlays
    const name = cancelledBy || user?.full_name || user?.email || 'Staff';
    rtEmergencyRef.current?.send({
      type: 'broadcast', event: 'sos_cancelled',
      payload: { staffId: user?.id, cancelledBy: name },
    }).catch(() => {});

    leaveChannel().then(() => { setActiveChannel(null); setView('main'); });
  };

  // Admin cancels from their receiving device
  const adminCancelEmergency = (payload) => {
    stopAlarm();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIncomingEmergency(null);
    const cancelledBy = user?.full_name || user?.email || 'Admin';
    rtEmergencyRef.current?.send({
      type: 'broadcast', event: 'sos_cancelled',
      payload: { staffId: payload?.staffId, cancelledBy },
    }).catch(() => {});
    toast.success('Emergency cancelled — all devices notified');
  };

  const acknowledgeIncomingEmergency = (action, payload) => {
    if (action === 'cancel') { adminCancelEmergency(payload); return; }
    stopAlarm();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIncomingEmergency(null);
    if (action === 'help' && payload?.sosChannel) {
      joinChannel(payload.sosChannel).then(() => {
        setActiveChannel({ name: `🆘 ${payload.staffName}`, id: '__sos' }); setView('ptt');
      });
    }
  };

  // Channel mutations
  const addChannelMutation = useMutation({
    mutationFn: async (name) => { const { error } = await supabase.from('radio_channels').insert({ name, organization_id: getOrgId() }); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['radioChannels'] }); setNewChannelName(''); setShowAddChannel(false); toast.success('Channel created'); },
    onError: e => toast.error('Failed: ' + e.message),
  });
  const deleteChannelMutation = useMutation({
    mutationFn: async (id) => { const { error } = await supabase.from('radio_channels').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['radioChannels'] }),
  });

  const assignToChannel = async (userId, channelId) => {
    await base44.entities.User.update(userId, { radio_channel_id: channelId });
    queryClient.refetchQueries({ queryKey: ['staff'] });
  };

  // Auto-join from deep link (?join=channelName) — used by Answer button / admin direct-join
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get('join');
    if (!target || !myUid || !clientRef.current) return;
    if (joinedChRef.current === target) return;
    const doJoin = async () => {
      await joinChannel(target);
      if (target.startsWith('ptp_')) {
        setActiveChannel({ name: 'Radio Call', id: '__ptp' });
        stopTone(); setIncomingCall(null);
        const { data: pending } = await supabase
          .from('radio_calls')
          .select('id')
          .eq('callee_id', user?.id)
          .eq('channel_name', target)
          .eq('status', 'pending')
          .maybeSingle();
        if (pending) {
          await supabase.from('radio_calls').update({ status: 'accepted' }).eq('id', pending.id);
        }
      } else {
        setActiveChannel({ name: target, id: target });
      }
      setView('ptt');
    };
    doJoin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, myUid]);

  // Auto-join assigned channel on load.
  // Regular staff: always auto-join their assigned channel.
  // Admins: skip (they pick channels manually).
  // Control devices: auto-join their assigned channel.
  // In radio handset mode the device is free to join any channel manually.
  useEffect(() => {
    if (!user?.id || !myUid || !clientRef.current) return;
    const isRegularAdmin = (user?.role === 'super_admin' || user?.role === 'admin') && !isControlDevice;
    if (isRegularAdmin) return;
    if (isRadioMode) return; // T320 picks channels manually — no auto-join
    const myRecord = staff.find(s => s.id === user.id);
    if (!myRecord?.radio_channel_id) return;
    const ch = channels.find(c => c.id === myRecord.radio_channel_id);
    if (!ch || joinedChRef.current === ch.name) return;
    joinChannel(ch.name).then(() => { setActiveChannel(ch); setExpandedChannelId(ch.id); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, myUid, staff.length, channels.length, isSuperAdmin]);

  // Show answer screen from push notification deep link (?call=channelName)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get('call');
    if (!target || !user?.id) return;
    // Fetch the pending call to populate the incoming call overlay
    supabase
      .from('radio_calls')
      .select('id, caller_id, channel_name')
      .eq('callee_id', user.id)
      .eq('channel_name', target)
      .eq('status', 'pending')
      .maybeSingle()
      .then(({ data: pending }) => {
        if (!pending) return;
        activeCallIdRef.current = pending.id;
        const caller = staffRef.current.find(s => s.id === pending.caller_id)
          || { full_name: 'Team Member', id: pending.caller_id };
        setIncomingCall({ callId: pending.id, caller, channelName: pending.channel_name });
        stopTone(); stopToneRef.current = playTone([880, 1100, 880, 1100, 660], true);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, user?.id]);

  // Track online/offline for signal indicator
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // T320 LED — blink green when online, red when offline
  useEffect(() => {
    try { if (window.AndroidLED) window.AndroidLED.setOnline(isOnline); } catch {}
  }, [isOnline]);

  // Global pointer release — stops PTT no matter where the finger lifts
  useEffect(() => {
    const up = () => { if (shouldTalkRef.current) stopTalking(); };
    window.addEventListener('pointerup', up, { passive: true });
    window.addEventListener('pointercancel', up, { passive: true });
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [isTalking, isHandsFree]);

  // Keyboard Space = PTT (not in hands-free mode)
  useEffect(() => {
    const down = e => { if (e.code === 'Space' && isJoined && !isTalking && !isHandsFree) { e.preventDefault(); playPTTTone('up'); startTalking(); } };
    const up   = e => { if (e.code === 'Space' && !isHandsFree) stopTalking(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [isJoined, isTalking, isHandsFree]);

  // Reset broadcast active when leaving a channel (must be before early returns)
  useEffect(() => {
    if (!isJoined || !activeChannel) setGroupBroadcastActive(false);
  }, [isJoined, activeChannel]);

  // Pre-warm AudioContext on mount so first PTT tone fires instantly
  useEffect(() => { getAudioCtx(); }, []);

  // ── Wake lock — keep screen on while radio page is open ──────────────────
  useEffect(() => {
    if (!keepAwake || !navigator.wakeLock) return;
    let lock = null;
    const acquire = () => navigator.wakeLock.request('screen').then(l => { lock = l; }).catch(() => {});
    acquire();
    const onVisible = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [keepAwake]);

  // ── Hardware PTT key listener (Inrico T320 side key / any mapped keycode) ─
  // All refs updated directly during render (not in useEffect) so the keydown
  // closure always reads the latest value with zero timing gap.
  const pttModeRef              = useRef(pttMode);
  const isTalkingRef            = useRef(isTalking);
  const incomingCallRef         = useRef(incomingCall);
  const acceptIncomingCallRef   = useRef(null);
  const initiateP2PCallRef      = useRef(null);
  pttModeRef.current            = pttMode;
  isTalkingRef.current          = isTalking;
  incomingCallRef.current       = incomingCall;
  initiateP2PCallRef.current    = initiateP2PCall;
  acceptIncomingCallRef.current = acceptIncomingCall;

  useEffect(() => {
    // Core PTT logic — called by both the Android direct bridge AND the keyboard listener.
    // Refs are updated every render so this always sees current state even though the
    // effect only runs once (no stale closure problem).
    const pttDown = () => {
      if (incomingCallRef.current) { acceptIncomingCallRef.current?.(); return; }
      if (pttModeRef.current === 'p2p') initiateP2PCallRef.current?.();
      else if (pttModeRef.current === 'group') { playPTTTone('up'); startTalking(); }
    };
    const pttUp = () => {
      if (isTalkingRef.current) { playPTTTone('down'); stopTalking(); }
    };

    // Android native bridge: MainActivity calls window.__pttDown() / window.__pttUp()
    // directly instead of dispatching a KeyboardEvent. This avoids the Chromium WebView
    // bug where new KeyboardEvent({keyCode:280}) does not actually set e.keyCode.
    window.__pttDown = () => {
      // DEBUG: visible toast so we can confirm Android is reaching JS
      const mode = pttModeRef.current;
      const hasPerson = !!initiateP2PCallRef.current;
      import('sonner').then(({ toast: t }) => t.info(`PTT▼ mode=${mode} fn=${hasPerson}`, { duration: 3000 })).catch(() => {});
      pttDown();
    };
    window.__pttUp   = pttUp;

    // Keyboard fallback — for web browser testing with a mapped key
    if (!pttKeyCode) return;
    const handleDown = (e) => {
      if (e.keyCode !== pttKeyCode || e.repeat) return;
      e.preventDefault(); e.stopPropagation();
      pttDown();
    };
    const handleUp = (e) => {
      if (e.keyCode !== pttKeyCode) return;
      e.preventDefault(); e.stopPropagation();
      pttUp();
    };
    document.addEventListener('keydown', handleDown, true);
    document.addEventListener('keyup', handleUp, true);
    return () => {
      document.removeEventListener('keydown', handleDown, true);
      document.removeEventListener('keyup', handleUp, true);
      delete window.__pttDown;
      delete window.__pttUp;
    };
  }, []); // runs once — refs keep everything current

  // ── PTT key detection helper ─────────────────────────────────────────────
  const onDetectPTTKey = useCallback(() => {
    setDetectingPTTKey(true);
    const cancelTimeout = setTimeout(() => {
      setDetectingPTTKey(false);
      document.removeEventListener('keydown', handler, true);
      delete window.__pttDetect;
    }, 10000);
    function confirm(code) {
      clearTimeout(cancelTimeout);
      setPttKeyCode(code);
      localStorage.setItem('radio_ptt_keycode', String(code));
      setDetectingPTTKey(false);
      document.removeEventListener('keydown', handler, true);
      delete window.__pttDetect;
      toast.success(`PTT key bound — keycode ${code}`);
    }
    // Android APK path: MainActivity calls window.__pttDetect(keyCode) when detect is active
    window.__pttDetect = (code) => { if (code > 0) confirm(code); };
    // Web/PWA path: catch a real keyboard event
    function handler(e) {
      const code = e.keyCode;
      if (code > 0 && code !== 27) { e.preventDefault(); confirm(code); }
    }
    document.addEventListener('keydown', handler, true);
  }, []);

  const onSetPTTKey = useCallback((code) => {
    setPttKeyCode(code);
    localStorage.setItem('radio_ptt_keycode', String(code));
    toast.success(`PTT key set to keycode ${code}`);
  }, []);

  const onClearPTTKey = useCallback(() => {
    setPttKeyCode(0);
    localStorage.removeItem('radio_ptt_keycode');
    toast('PTT key binding cleared');
  }, []);

  // ── Error state ───────────────────────────────────────────────────────────
  if (channelsError) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-900 p-8 text-center">
      <Radio className="w-12 h-12 text-slate-600" />
      <p className="text-slate-300 font-medium">Could not load channels</p>
      <p className="text-slate-500 text-xs font-mono break-all">
        {channelsErrorObj?.message || channelsErrorObj?.code || String(channelsErrorObj) || 'unknown error'}
      </p>
      <button
        onClick={() => queryClient.invalidateQueries({ queryKey: ['radioChannels'] })}
        className="mt-2 px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium"
      >
        Retry
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SHARED OVERLAYS — rendered above both views
  // ════════════════════════════════════════════════════════════════════════════

  const EmergencyCountdownOverlay = emergencyCountdown !== null && (
    <div className="fixed inset-0 z-[70] bg-red-950 flex flex-col items-center justify-center gap-8 px-6">
      <p className="text-red-300 text-xs uppercase tracking-[0.25em] font-semibold">Sending Emergency Alert</p>
      {/* SVG ring countdown */}
      <div className="relative w-52 h-52">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#7f1d1d" strokeWidth="7" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="#ef4444" strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (emergencyCountdown / COUNTDOWN_SECS)}`}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <AlertTriangle className="w-10 h-10 text-red-400 animate-pulse" />
          <span className="text-white text-6xl font-black leading-none">{emergencyCountdown}</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-lg">Alert fires in {emergencyCountdown}s</p>
        <p className="text-red-400 text-sm mt-1">All staff will be notified with your location</p>
        <p className="text-red-500 text-xs mt-1">Phone will stay live — place it down and work</p>
      </div>
      <button onClick={cancelEmergencyCountdown}
        className="w-full max-w-xs py-5 rounded-2xl bg-white text-red-700 font-black text-2xl tracking-wide active:scale-95 transition-transform shadow-2xl">
        CANCEL
      </button>
    </div>
  );

  const ActiveEmergencyBanner = emergencyActive && (
    <div className="fixed top-0 left-0 right-0 z-[65] bg-red-600 flex items-center justify-between gap-2 px-4 py-2.5 animate-pulse">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="w-5 h-5 text-white shrink-0" />
        <span className="text-white font-bold text-sm truncate">🚨 EMERGENCY LIVE</span>
        {emergencyRecording && <span className="flex items-center gap-1 text-red-100 text-xs shrink-0"><span className="w-2 h-2 rounded-full bg-white animate-pulse" />REC</span>}
      </div>
      <button onClick={() => endEmergency()} className="bg-white text-red-700 font-black text-xs px-3 py-1.5 rounded-full shrink-0 whitespace-nowrap">
        END SOS
      </button>
    </div>
  );

  const IncomingCallOverlay = incomingCall && (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center gap-8 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping scale-150" />
        <div className="w-28 h-28 rounded-full bg-slate-800 border-4 border-green-500 flex items-center justify-center text-4xl font-bold text-white">
          {(incomingCall.caller?.full_name || '?')[0].toUpperCase()}
        </div>
      </div>
      <div className="text-center">
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Incoming Radio Call</p>
        <p className="text-white text-3xl font-bold">{incomingCall.caller?.full_name || 'Unknown'}</p>
      </div>
      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={() => declineIncomingCall('declined')}
          className="flex-1 py-5 rounded-2xl bg-red-600 text-white font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform">
          <PhoneOff className="w-6 h-6" />DECLINE
        </button>
        <button onClick={callBackImmediately}
          className="flex-1 py-5 rounded-2xl bg-amber-500 text-white font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform">
          <Phone className="w-6 h-6" />CALL<br />BACK
        </button>
        <button onClick={acceptIncomingCall}
          className="flex-1 py-5 rounded-2xl bg-green-500 text-white font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform">
          <Mic className="w-6 h-6" />ANSWER
        </button>
      </div>
    </div>
  );

  const OutgoingCallOverlay = outgoingCall && (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center gap-8 px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping scale-150" />
        <div className="w-28 h-28 rounded-full bg-slate-800 border-4 border-teal-500 flex items-center justify-center text-4xl font-bold text-white">
          {(outgoingCall.callee?.full_name || '?')[0].toUpperCase()}
        </div>
      </div>
      <div className="text-center">
        {callDeclined
          ? <><p className="text-amber-400 text-sm uppercase tracking-widest mb-1">Will Call Back</p><p className="text-white text-2xl font-bold">{outgoingCall.callee?.full_name}</p><p className="text-slate-400 text-sm mt-2">They'll get back to you shortly</p></>
          : <><p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Calling…</p><p className="text-white text-3xl font-bold">{outgoingCall.callee?.full_name}</p></>}
      </div>
      <button onClick={cancelOutgoingCall} className="w-20 h-20 rounded-full bg-red-600 text-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform">
        <PhoneOff className="w-7 h-7" /><span className="text-xs font-semibold">END</span>
      </button>
    </div>
  );

  // Full-screen incoming emergency (received on other devices)
  const IncomingEmergencyOverlay = incomingEmergency && (
    <div className="fixed inset-0 z-[60] bg-red-950 flex flex-col items-center justify-center gap-5 px-6 overflow-y-auto py-8">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-red-500/30 animate-ping scale-[2]" />
        <div className="w-24 h-24 rounded-full bg-red-700 border-4 border-red-400 flex items-center justify-center">
          <AlertTriangle className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-red-300 text-xs uppercase tracking-[0.25em] font-semibold">🚨 Emergency Alert</p>
        <p className="text-white text-3xl font-black mt-1">{incomingEmergency.staffName}</p>
        <p className="text-red-300 text-sm">needs immediate assistance</p>
      </div>
      <div className="bg-red-900/50 border border-red-700 rounded-2xl p-4 w-full max-w-sm">
        <p className="text-red-300 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />Last Known Location</p>
        <p className="text-white text-sm leading-snug">{incomingEmergency.address}</p>
        {incomingEmergency.mapsUrl && (
          <a href={incomingEmergency.mapsUrl} target="_blank" rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-teal-400 text-sm font-semibold">
            <MapPin className="w-4 h-4" />Open in Maps
          </a>
        )}
      </div>
      <div className="space-y-2 w-full max-w-sm">
        <button onClick={() => acknowledgeIncomingEmergency('help', incomingEmergency)}
          className="w-full py-4 rounded-2xl bg-green-600 text-white font-bold text-sm active:scale-95 transition-transform">
          Going to Help — Join Live Audio
        </button>
        {isSuperAdmin && (
          <button onClick={() => acknowledgeIncomingEmergency('cancel', incomingEmergency)}
            className="w-full py-4 rounded-2xl bg-amber-600 text-white font-bold text-sm active:scale-95 transition-transform">
            Cancel Emergency (Admin)
          </button>
        )}
        <button onClick={() => acknowledgeIncomingEmergency('dismiss', incomingEmergency)}
          className="w-full py-3 rounded-2xl border border-red-700 text-red-300 font-semibold text-sm active:scale-95 transition-transform">
          Dismiss Alert
        </button>
      </div>
    </div>
  );

  // Text-alert modal — shown when a 30s call times out
  const TextAlertModal = textAlertModal && (
    <div className="fixed inset-0 z-[80] bg-slate-950/98 flex flex-col items-center justify-center gap-6 px-6">
      <div className="w-16 h-16 rounded-full bg-amber-600/20 flex items-center justify-center">
        <PhoneOff className="w-8 h-8 text-amber-400" />
      </div>
      <div className="text-center">
        <p className="text-white text-xl font-bold">No Answer</p>
        <p className="text-slate-400 text-sm mt-1">{textAlertModal.callee?.full_name || 'They'} didn't pick up</p>
        <p className="text-slate-500 text-xs mt-1">Leave a text alert so they can call back?</p>
      </div>
      <div className="w-full max-w-sm">
        <textarea
          value={textAlertMsg}
          onChange={e => setTextAlertMsg(e.target.value)}
          placeholder="Optional message (e.g. Call me when free)"
          rows={3}
          className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-sm border border-slate-700 focus:border-teal-500 focus:outline-none resize-none"
          autoFocus
        />
      </div>
      <div className="flex gap-3 w-full max-w-sm">
        <button onClick={() => { setTextAlertModal(null); setTextAlertMsg(''); }}
          className="flex-1 py-4 rounded-2xl border border-slate-700 text-slate-400 font-semibold text-sm active:scale-95 transition-transform">
          Dismiss
        </button>
        <button
          onClick={async () => {
            const callerName = user?.full_name || user?.email || 'A team member';
            const msg = textAlertMsg.trim() || 'Tried to reach you on radio';
            await base44.functions.invoke('createNotification', {
              recipient_ids: resolveRecipients([textAlertModal.callee.id]),
              type: 'radio_call',
              title: `📞 Missed radio call from ${callerName}`,
              message: msg, priority: 'high',
              action_url: '/TwoWayRadio', send_push: true,
            }).catch(() => {});
            toast.success('Alert sent to ' + textAlertModal.callee.full_name);
            setTextAlertModal(null); setTextAlertMsg('');
          }}
          className="flex-1 py-4 rounded-2xl bg-teal-600 text-white font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
          <MessageSquare className="w-4 h-4" />Send Alert
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PTT VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'ptt') return (
    <>
      {EmergencyCountdownOverlay}
      {ActiveEmergencyBanner}
      {IncomingCallOverlay}
      {OutgoingCallOverlay}
      {IncomingEmergencyOverlay}
      {TextAlertModal}

      {/* Fixed full-height PTT side bar — hidden on T320 (hardware PTT) */}
      {!isHandsFree && !isRadioMode && (
        <button
          disabled={!isJoined || joining}
          onPointerDown={e => { e.preventDefault(); if (incomingCall) { acceptIncomingCall(); return; } playPTTTone('up'); startTalking(); }}
          style={{ position: 'fixed', top: 0, bottom: 0, [pttHandedness]: 0, width: 68, zIndex: 40 }}
          className={`flex flex-col items-center justify-center gap-3 select-none touch-none transition-colors ${
            !isJoined || joining ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : isTalking ? 'bg-red-600 text-white shadow-2xl shadow-red-900/80'
            : 'bg-teal-600 text-white'
          } ${pttHandedness === 'right' ? 'rounded-l-2xl' : 'rounded-r-2xl'}`}
        >
          {isTalking && (
            <>
              <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-inherit" />
              <div className="absolute inset-0 bg-red-500/10 animate-ping scale-110 rounded-inherit" style={{ animationDelay: '0.25s' }} />
            </>
          )}
          {joining ? <Loader2 className="w-7 h-7 animate-spin relative z-10" /> : isTalking ? <Mic className="w-7 h-7 relative z-10" /> : <Radio className="w-7 h-7 relative z-10" />}
          <span className="text-xs font-black tracking-widest relative z-10" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            {joining ? 'JOINING' : isTalking ? 'LIVE TX' : 'PTT'}
          </span>
          {isTalking && <span className="w-2 h-2 rounded-full bg-white animate-pulse relative z-10" />}
        </button>
      )}

      <div className={`h-screen overflow-y-auto bg-slate-900 flex flex-col pb-28 ${emergencyActive ? 'pt-10' : ''} ${!isHandsFree && !isRadioMode ? (pttHandedness === 'right' ? 'pr-[72px]' : 'pl-[72px]') : ''}`}>
        {/* Header */}
        <div className="bg-slate-800 px-4 pt-4 pb-3 flex items-center gap-3">
          <button onClick={() => { if (!emergencyActive) { leaveChannel().then(() => setActiveChannel(null)); } setView('main'); }}
            className="text-slate-400 hover:text-white p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold truncate">{activeChannel?.name || 'Radio'}</p>
            <p className="text-xs text-green-400 flex items-center gap-1"><Signal className="w-3 h-3" />Live{isHandsFree && <span className="text-red-400 ml-1">· Hands-free</span>}</p>
          </div>
          {!emergencyActive && (
            <button onClick={() => leaveChannel().then(() => { setActiveChannel(null); setView('main'); })}
              className="text-red-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-800 hover:bg-red-900/30 transition-colors shrink-0">
              Leave
            </button>
          )}
        </div>

        {/* Speaking indicator */}
        <div className="h-10 flex items-center justify-center">
          {speakingNames.length > 0
            ? <div className="flex items-center gap-2 bg-teal-900/50 rounded-full px-4 py-1.5 animate-pulse"><Volume2 className="w-4 h-4 text-teal-400" /><span className="text-teal-300 text-sm font-semibold">{speakingNames.join(', ')} speaking…</span></div>
            : <span className="text-slate-500 text-sm">Channel clear</span>}
        </div>


        {/* Status / content area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
          {isHandsFree ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping scale-110" style={{ animationDelay: '0.3s' }} />
                <div className="w-full h-full rounded-full bg-red-700 border-4 border-red-500 flex flex-col items-center justify-center gap-2 shadow-2xl">
                  <Mic className="w-14 h-14 text-white" />
                  <span className="text-white font-black text-sm tracking-wide">LIVE BROADCAST</span>
                  {emergencyRecording && <span className="text-red-200 text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white animate-pulse" />Recording</span>}
                </div>
              </div>
              <p className="text-red-300 text-sm text-center max-w-xs">Phone is broadcasting live audio.<br />Place it down and attend to the situation.</p>
              {emergencyAddress && (
                <div className="bg-slate-800 rounded-xl px-4 py-2 text-center max-w-xs">
                  <p className="text-slate-400 text-xs mb-0.5">Your location shared with all staff</p>
                  <p className="text-slate-300 text-xs leading-snug">{emergencyAddress}</p>
                </div>
              )}
              <button onClick={() => endEmergency()}
                className="mt-2 px-8 py-4 rounded-2xl bg-white text-red-700 font-black text-lg active:scale-95 transition-transform shadow-xl">
                END EMERGENCY
              </button>
            </div>
          ) : (
            <>
              {/* Transmitting status */}
              {isTalking && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-red-400 font-bold text-sm tracking-widest uppercase">Transmitting</p>
                </div>
              )}
              {!isTalking && !joining && isJoined && (
                <p className="text-slate-500 text-sm text-center">
                  Hold the <span className={`font-bold ${pttHandedness === 'right' ? 'text-teal-400' : 'text-teal-400'}`}>PTT</span> bar on the {pttHandedness} to speak
                </p>
              )}
              {joining && <Loader2 className="w-8 h-8 animate-spin text-teal-400" />}
              {/* End P2P Call */}
              {activeChannel?.id === '__ptp' && (
                <button onClick={endP2PCall}
                  className="w-full max-w-xs py-5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white shadow-xl flex items-center justify-center gap-3">
                  <PhoneOff className="w-7 h-7" />
                  <span className="text-lg font-black tracking-wide">END CALL</span>
                </button>
              )}
              {micPermission === 'denied' && <p className="text-red-400 text-xs text-center max-w-xs">Microphone blocked. Allow mic in browser settings and refresh.</p>}
              <p className="text-slate-500 text-xs text-center">Space bar on desktop · Release to stop</p>
              {remoteUsers.length > 0 && (
                <div className="w-full max-w-sm">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2 text-center">On channel</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {remoteUsers.map(u => (
                      <div key={u.uid} className="flex items-center gap-1.5 bg-slate-800 rounded-full px-3 py-1">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-slate-300 text-xs">{staffByUid[u.uid]?.full_name || `User ${u.uid}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!emergencyActive && (
          <div className="px-4 pb-2">
            <EmergencyButton onClick={startEmergencyCountdown} disabled={emergencyCountdown !== null} />
          </div>
        )}
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN VIEW
  // ════════════════════════════════════════════════════════════════════════════
  const unreadMissed = missedCalls.filter(c => !dismissedMissedIds.has(c.id));
  const unreadCbRequests = callbackRequestRecords
    .filter(r => !dismissedCbReqIds.has(r.id))
    .map(r => ({ callId: r.id, callerId: r.caller_id, requester: staff.find(s => s.id === r.caller_id) || { id: r.caller_id, full_name: 'Team Member' } }));
  const anyoneSpeaking = speakingNames.length > 0;

  // Reusable staff pill inside a channel card
  const StaffPill = ({ s }) => {
    const status = getStaffStatus(s.id);
    const cfg = statusCfg[status] || statusCfg.off_shift;
    const uid = toUid(s.id);
    const isSpeaking = speakingUids.has(uid);
    const isSelected = selectedPerson?.id === s.id;
    return (
      <button
        onClick={() => setSelectedPerson(isSelected ? null : s)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all border text-left ${
          isSelected ? 'bg-teal-900/60 border-teal-600 ring-1 ring-teal-500'
          : isSpeaking ? 'bg-slate-700 border-teal-700/50 animate-pulse'
          : 'bg-slate-800 border-slate-700 hover:border-slate-500'
        }`}
      >
        <div className="relative shrink-0">
          <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-[10px]">
            {(s.full_name || '?')[0].toUpperCase()}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-800 ${cfg.dot}`} />
        </div>
        <span className={`text-xs truncate max-w-[72px] ${isSelected ? 'text-teal-200 font-semibold' : 'text-slate-200'}`}>
          {(s.full_name || s.email || '?').split(' ')[0]}
        </span>
        {isSpeaking && <Mic className="w-2.5 h-2.5 text-teal-400 shrink-0" />}
      </button>
    );
  };

  // Manage-members modal
  const ManageModal = managingChannelId && (() => {
    const ch = channels.find(c => c.id === managingChannelId);
    if (!ch) return null;
    const allStaff = staff.slice();
    return (
      <div className="fixed inset-0 z-[200] bg-black/70 flex flex-col justify-end" onClick={() => setManagingChannelId(null)}>
        <div className="bg-slate-900 rounded-t-2xl border-t border-slate-700 max-h-[75vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="px-5 pt-4 pb-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <p className="text-white font-bold text-base">{ch.name}</p>
              <p className="text-slate-400 text-xs">Tap to assign or remove from this channel</p>
            </div>
            <button onClick={() => setManagingChannelId(null)} className="text-slate-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-1">
            {allStaff.map(s => {
              const inThisChannel = s.radio_channel_id === ch.id;
              const inOtherChannel = !inThisChannel && s.radio_channel_id;
              const otherCh = inOtherChannel ? channels.find(c => c.id === s.radio_channel_id) : null;
              const cs = getCombinedStatus(s.id);
              return (
                <button key={s.id} onClick={() => assignToChannel(s.id, inThisChannel ? null : ch.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left border ${
                    inThisChannel ? 'bg-teal-900/40 border-teal-700/50' : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                  }`}>
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                      {(s.full_name || '?')[0].toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${cs.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{s.full_name || s.email}</p>
                    <p className={`text-xs ${cs.text}`}>{cs.shiftLabel}{cs.radioLabel ? ` · ${cs.radioLabel}` : ''}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {inThisChannel ? <span className="text-teal-400">In this channel</span>
                        : otherCh ? <span className="text-amber-400">In {otherCh.name} — tap to move here</span>
                        : 'Unassigned'}
                    </p>
                  </div>
                  {inThisChannel
                    ? <span className="text-teal-400 text-xs font-bold shrink-0">✓ Remove</span>
                    : <span className="text-slate-500 text-xs shrink-0">Add →</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  })();

  const theme = RADIO_THEMES[radioTheme] || RADIO_THEMES.blue;

  return (
    <>
      {EmergencyCountdownOverlay}
      {ActiveEmergencyBanner}
      {IncomingCallOverlay}
      {OutgoingCallOverlay}
      {IncomingEmergencyOverlay}
      {TextAlertModal}
      {ManageModal}

      {/* ── PTT SIDE BAR — centred on edge, smaller pill — hidden on T320 (hardware PTT) ── */}
      {radioTab === 'radio' && !isRadioMode && <button
        disabled={pttMode === 'disabled'}
        onPointerDown={e => {
          e.preventDefault();
          if (incomingCall) { acceptIncomingCall(); return; }
          if (pttMode === 'p2p') initiateP2PCall();
          else if (pttMode === 'group') { playPTTTone('up'); startTalking(); }
        }}
        style={{ position: 'fixed', top: '50%', transform: 'translateY(-50%)', [pttHandedness]: 0, width: 60, height: 380, zIndex: 40 }}
        className={`flex flex-col items-center justify-center gap-2 select-none touch-none transition-colors ${
          pttMode === 'disabled' ? 'bg-slate-800/60 text-slate-700'
          : pttMode === 'p2p' ? 'bg-green-700 text-white'
          : isTalking ? 'bg-red-600 text-white shadow-2xl shadow-red-900/80'
          : `${theme.pttIdle} text-white`
        } ${pttHandedness === 'right' ? 'rounded-l-2xl' : 'rounded-r-2xl'}`}
      >
        {isTalking && (
          <>
            <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-inherit" />
            <div className="absolute inset-0 bg-red-500/10 animate-ping scale-110 rounded-inherit" style={{ animationDelay: '0.25s' }} />
          </>
        )}
        {pttMode === 'p2p' ? <Phone className="w-6 h-6 relative z-10" /> : <Radio className="w-6 h-6 relative z-10" />}
        <span className="text-[10px] font-black tracking-widest relative z-10" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          {pttMode === 'p2p' ? 'P2P' : isTalking ? 'LIVE TX' : 'PTT'}
        </span>
        {pttMode === 'p2p' && selectedPerson && (
          <span className="text-[9px] font-bold text-green-200 relative z-10 leading-tight"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            {selectedPerson.full_name.split(' ')[0]}
          </span>
        )}
      </button>}

      <div className="h-screen overflow-y-auto pb-28" style={theme.bgStyle}>

        {/* ── APP HOME BAR — hidden in radio mode (back button handles minimise) ── */}
        {isRadioMode ? null : isControlDevice ? (
          <div
            className={`w-full flex items-center gap-3 px-5 font-semibold text-base flex-shrink-0 ${theme.homeBar}`}
            style={{ paddingTop: `calc(0.875rem + env(safe-area-inset-top))`, paddingBottom: '0.875rem' }}
          >
            <Radio className="w-5 h-5 shrink-0" />
            <span className="flex-1">Control Radio</span>
            <span className="text-xs font-normal opacity-60">
              {activeChannel?.name || 'Radio'}
            </span>
          </div>
        ) : (
          <button
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className={`w-full flex items-center gap-3 px-5 font-semibold text-base flex-shrink-0 touch-manipulation ${theme.homeBar}`}
            style={{ paddingTop: `calc(0.875rem + env(safe-area-inset-top))`, paddingBottom: '0.875rem' }}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span>App Home</span>
          </button>
        )}

        {/* ── TAB BAR ── */}
        <div className={`flex border-b backdrop-blur ${theme.tabBar}`}>
          {(['radio', ...(isSuperAdmin ? ['shift'] : []), 'settings']).map(key => (
            <button key={key} onClick={() => setRadioTab(key)}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider transition-colors touch-manipulation ${
                radioTab === key ? theme.tabActive : theme.tabInactive
              }`}>
              {key === 'radio' ? 'Radio' : key === 'shift' ? 'Current Shift' : 'Settings'}
            </button>
          ))}
        </div>

        {radioTab === 'radio' && (<>

        {/* ── RADIO DEVICE HEADER ── */}
        <div className={`border-b ${theme.header}`}>
          {testMode && <div className="bg-amber-500 px-4 py-1"><span className="text-white text-xs font-bold">TEST MODE — alerts only go to you</span></div>}
          {isRadioMode ? (
            /* T320 native app: minimal title only — no decorative chrome needed */
            <div className="px-4 py-3 flex items-center gap-2">
              <Radio className={`w-4 h-4 shrink-0 ${theme.accent}`} />
              <span className={`font-black text-sm tracking-widest uppercase ${theme.accent}`}>CareCall Radio</span>
            </div>
          ) : radioTab === 'radio' ? (
            /* PWA / web: compact header with on-screen PTT button for testing */
            <div className="px-4 py-3 flex items-center gap-3">
              <Radio className={`w-4 h-4 shrink-0 ${theme.accent}`} />
              <span className={`font-black text-xs tracking-[0.2em] uppercase flex-1 ${theme.accent}`}>Care Call Radio</span>
              <button
                onPointerDown={e => { e.preventDefault(); window.__pttDown?.(); }}
                onPointerUp={e => { e.preventDefault(); window.__pttUp?.(); }}
                onPointerLeave={e => { e.preventDefault(); window.__pttUp?.(); }}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase select-none touch-none transition-colors ${
                  pttMode === 'p2p' ? 'bg-teal-600 text-white active:bg-teal-500' :
                  pttMode === 'group' ? 'bg-green-600 text-white active:bg-green-500' :
                  'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                {pttMode === 'p2p' ? '📞 PTT' : pttMode === 'group' ? '📡 PTT' : 'PTT'}
              </button>
            </div>
          ) : (
            <>
          <div className="h-2 bg-black/30 flex gap-[3px] px-3 pt-1">
            {Array.from({ length: 32 }).map((_, i) => <div key={i} className="flex-1 h-full bg-white/10 rounded-full" />)}
          </div>
          <div className="px-4 pt-3 pb-2 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 shrink-0 ${theme.accent}`} />
                <span className={`font-black text-xs tracking-[0.2em] uppercase ${theme.accent}`}>Care Call Radio</span>
              </div>
              <div className="flex items-end gap-0.5 mt-1.5">
                {[3, 5, 7, 9, 11].map((h, i) => <div key={i} className={`w-1.5 rounded-sm ${i < 4 ? theme.dot : 'bg-white/20'}`} style={{ height: h }} />)}
                <span className="text-slate-500 text-[10px] ml-1.5 font-mono">LIVE</span>
                <span className={`w-2 h-2 rounded-full ml-2 mb-0.5 ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-500 animate-pulse'}`} title={isOnline ? 'Online' : 'Offline'} />
                <span className={`text-[10px] ml-0.5 font-mono ${isOnline ? 'text-green-500' : 'text-red-500'}`}>{isOnline ? 'WiFi' : 'OFFLINE'}</span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded ${anyoneSpeaking ? 'bg-red-700' : 'bg-slate-800'}`}>
              <div className={`w-2 h-2 rounded-full ${anyoneSpeaking ? 'bg-red-300 animate-pulse' : 'bg-slate-600'}`} />
              <span className={`text-[10px] font-black tracking-widest ${anyoneSpeaking ? 'text-red-200' : 'text-slate-600'}`}>ON AIR</span>
            </div>
            <div className="relative">
              <button onClick={() => setShowSettings(v => !v)} className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-9 z-50 bg-slate-800 rounded-xl shadow-xl border border-slate-700 w-52 p-3">
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">PTT Button Side</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setPttHandedness('left'); localStorage.setItem('pttHandedness', 'left'); setShowSettings(false); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${pttHandedness === 'left' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>← Left</button>
                    <button onClick={() => { setPttHandedness('right'); localStorage.setItem('pttHandedness', 'right'); setShowSettings(false); }}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${pttHandedness === 'right' ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Right →</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="px-4 pb-2 h-7 flex items-center">
            {anyoneSpeaking
              ? <div className="flex items-center gap-2"><Volume2 className={`w-3.5 h-3.5 animate-pulse shrink-0 ${theme.accent}`} /><span className={`text-xs font-semibold truncate ${theme.accent}`}>{speakingNames.join(', ')} speaking…</span></div>
              : <span className="text-slate-600 text-xs font-mono">Channel clear ·· ·</span>}
          </div>
          <div className="h-2 bg-black/30 flex gap-[3px] px-3 pb-1">
            {Array.from({ length: 32 }).map((_, i) => <div key={i} className="flex-1 h-full bg-white/10 rounded-full" />)}
          </div>
            </>
          )}
        </div>

        {/* ── MISSED CALL STICKY ALERT ── */}
        {unreadMissed.length > 0 && (
          <div className="sticky top-0 z-30 bg-amber-600 shadow-lg">
            <div className="flex items-center gap-3 px-4 py-3">
              <PhoneOff className="w-4 h-4 text-white shrink-0" />
              <div className="flex-1 min-w-0">
                {unreadMissed.length === 1 ? (() => {
                  const call = unreadMissed[0];
                  const personId = call.status === 'callback' ? call.caller_id : call.callee_id;
                  const name = staff.find(s => s.id === personId)?.full_name || 'Team Member';
                  return (
                    <>
                      <p className="text-white text-sm font-bold truncate">
                        {call.status === 'callback' ? `Call back: ${name}` : `Missed call from ${name}`}
                      </p>
                      <p className="text-amber-200 text-xs">{formatCallTime(call.created_at)}</p>
                    </>
                  );
                })() : (
                  <p className="text-white text-sm font-bold">{unreadMissed.length} missed calls</p>
                )}
              </div>
              {unreadMissed.length === 1 && (
                <button
                  onClick={() => callBackFromMissed(unreadMissed[0])}
                  className="bg-white text-amber-700 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform touch-manipulation shrink-0">
                  Call Back
                </button>
              )}
              <button
                onClick={() => dismissMissedCalls(...unreadMissed.map(c => c.id))}
                className="text-amber-200 hover:text-white p-1 shrink-0 touch-manipulation">
                <X className="w-5 h-5" />
              </button>
            </div>
            {unreadMissed.length > 1 && (
              <div className="px-4 pb-3 space-y-1.5">
                {unreadMissed.map(call => {
                  const personId = call.status === 'callback' ? call.caller_id : call.callee_id;
                  const name = staff.find(s => s.id === personId)?.full_name || 'Team Member';
                  return (
                    <div key={call.id} className="flex items-center gap-2 bg-amber-700/40 rounded-lg px-3 py-2">
                      <p className="flex-1 text-white text-xs font-semibold truncate">{name} · {formatCallTime(call.created_at)}</p>
                      <button onClick={() => callBackFromMissed(call)} className="bg-white text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-md active:scale-95 transition-transform touch-manipulation shrink-0">Call Back</button>
                      <button onClick={() => dismissMissedCalls(call.id)} className="text-amber-300 hover:text-white p-0.5 shrink-0"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── CALLBACK REQUEST STICKY ALERT ── */}
        {unreadCbRequests.length > 0 && (
          <div className="sticky top-0 z-30 bg-teal-700 shadow-lg">
            <div className="flex items-center gap-3 px-4 py-3">
              <Phone className="w-4 h-4 text-white shrink-0" />
              <div className="flex-1 min-w-0">
                {unreadCbRequests.length === 1 ? (
                  <p className="text-white text-sm font-bold truncate">
                    {unreadCbRequests[0].requester?.full_name || 'Team Member'} wants a call back
                  </p>
                ) : (
                  <p className="text-white text-sm font-bold">{unreadCbRequests.length} call-back requests</p>
                )}
              </div>
              {unreadCbRequests.length === 1 && (
                <button
                  onClick={() => callBackFromRequest(unreadCbRequests[0])}
                  className="bg-white text-teal-700 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform touch-manipulation shrink-0">
                  Call Back
                </button>
              )}
              <button
                onClick={() => unreadCbRequests.forEach(r => dismissCallbackRequest(r.callId))}
                className="text-teal-200 hover:text-white p-1 shrink-0 touch-manipulation">
                <X className="w-5 h-5" />
              </button>
            </div>
            {unreadCbRequests.length > 1 && (
              <div className="px-4 pb-3 space-y-1.5">
                {unreadCbRequests.map(req => (
                  <div key={req.callId} className="flex items-center gap-2 bg-teal-800/50 rounded-lg px-3 py-2">
                    <p className="flex-1 text-white text-xs font-semibold truncate">{req.requester?.full_name || 'Team Member'}</p>
                    <button onClick={() => callBackFromRequest(req)} className="bg-white text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded-md active:scale-95 transition-transform touch-manipulation shrink-0">Call Back</button>
                    <button onClick={() => dismissCallbackRequest(req.callId)} className="text-teal-300 hover:text-white p-0.5 shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVE CHANNEL WINDOW — hidden on T320 (control is in all channels) ── */}
        {!isRadioMode && (() => {
          const myRecord = staff.find(s => s.id === user?.id);
          const myChannel = myRecord?.radio_channel_id ? channels.find(c => c.id === myRecord.radio_channel_id) : null;
          const displayCh = activeChannel && activeChannel.id !== '__ptp' && activeChannel.id !== '__sos' ? activeChannel : myChannel;
          return (
            <div className={`mx-4 mt-4 rounded-2xl border-2 px-5 py-3 flex items-center gap-3 ${
              isJoined && activeChannel ? 'bg-green-900/30 border-green-600' : 'bg-slate-900 border-slate-700'
            }`}>
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isJoined && activeChannel ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium">Active Channel</p>
                <p className={`text-sm font-bold truncate ${isJoined && activeChannel ? 'text-green-300' : 'text-slate-500'}`}>
                  {displayCh ? displayCh.name : 'No channel joined'}
                </p>
              </div>
              <Radio className={`w-4 h-4 shrink-0 ${isJoined && activeChannel ? 'text-green-400' : 'text-slate-700'}`} />
            </div>
          );
        })()}

        {/* ── MY STATUS ── */}
        {isRadioMode ? (
          /* T320: simple Available / Not Available toggle — no shift tracking */
          (() => {
            const myStatus = getStaffStatus(user?.id);
            const isAvailable = myStatus === 'available';
            return (
              <div className="px-4 pt-4 pb-1 flex gap-3">
                <button onClick={() => setMyRadioStatus('available')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 border-2 transition-all active:scale-[0.97] ${
                    isAvailable ? 'bg-green-900/50 border-green-500' : 'bg-slate-900 border-slate-700'
                  }`}>
                  <span className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-slate-600'}`} />
                  <span className={`text-sm font-bold ${isAvailable ? 'text-green-300' : 'text-slate-500'}`}>Available</span>
                </button>
                <button onClick={() => setMyRadioStatus('dnd')}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 border-2 transition-all active:scale-[0.97] ${
                    !isAvailable ? 'bg-slate-700 border-slate-500' : 'bg-slate-900 border-slate-700'
                  }`}>
                  <span className={`w-3 h-3 rounded-full ${!isAvailable ? 'bg-slate-300' : 'bg-slate-600'}`} />
                  <span className={`text-sm font-bold ${!isAvailable ? 'text-slate-200' : 'text-slate-500'}`}>Not Available</span>
                </button>
              </div>
            );
          })()
        ) : (() => {
          const myStatus = getStaffStatus(user?.id);
          const cs = getCombinedStatus(user?.id);
          const activeShift = todayShifts.find(s => s.staff_id === user?.id && s.clock_in_time && !s.clock_out_time && s.status !== 'cancelled');
          const isAutoStatus = !!activeShift;
          const manualOptions = [
            { key: 'available', label: 'Available',      dot: 'bg-green-500' },
            { key: 'on_break',  label: 'On Break',       dot: 'bg-amber-400' },
            { key: 'dnd',       label: 'Do Not Disturb', dot: 'bg-slate-500' },
          ];
          const statusBg = {
            with_client: 'bg-red-900/50 border-red-700',
            on_break:    'bg-amber-900/50 border-amber-600',
            available:   'bg-green-900/50 border-green-600',
            off_shift:   'bg-blue-900/40 border-blue-700',
            dnd:         'bg-slate-800 border-slate-600',
          };
          return (
            <div className="px-4 pt-4 pb-1 relative">
              <button onClick={() => !isAutoStatus && setShowStatusMenu(v => !v)}
                className={`w-full flex items-center gap-4 rounded-2xl px-5 py-4 transition-all border-2 ${
                  statusBg[myStatus] || statusBg.off_shift
                } ${isAutoStatus ? 'cursor-default' : 'active:scale-[0.98]'}`}>
                <span className={`w-4 h-4 rounded-full shrink-0 shadow-lg ${cs.dot}`} style={{ boxShadow: `0 0 8px currentColor` }} />
                <div className="flex-1 text-left">
                  <p className="text-slate-400 text-[10px] font-medium uppercase tracking-widest leading-none mb-1">My Status</p>
                  <p className={`text-base font-bold leading-tight ${cs.text}`}>{cs.shiftLabel}</p>
                  {cs.radioLabel && <p className={`text-sm font-semibold leading-tight ${cs.text} opacity-80`}>{cs.radioLabel}</p>}
                </div>
                {isAutoStatus
                  ? <span className="text-slate-500 text-xs bg-slate-800 px-2 py-1 rounded-lg">Auto</span>
                  : <span className={`text-xl ${cs.text}`}>▾</span>}
              </button>
              {showStatusMenu && !isAutoStatus && (
                <div className="absolute left-4 right-4 top-full mt-1 z-50 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                  {manualOptions.map(opt => (
                    <button key={opt.key} onClick={() => { setMyRadioStatus(opt.key); setShowStatusMenu(false); }}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-700 ${myStatus === opt.key ? 'bg-slate-700/70' : ''}`}>
                      <span className={`w-3 h-3 rounded-full shrink-0 ${opt.dot}`} />
                      <span className="text-white text-sm font-medium">{opt.label}</span>
                      {myStatus === opt.key && <span className="ml-auto text-teal-400 text-sm font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* ── MISSED CALLS ── */}
        {unreadMissed.length > 0 && (
          <div className="px-4 pt-3 pb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <PhoneOff className="w-3.5 h-3.5" /> Missed Calls ({unreadMissed.length})
              </span>
              <button onClick={() => dismissMissedCalls(...missedCalls.map(c => c.id))} className="text-slate-500 hover:text-slate-300 text-xs">Clear all</button>
            </div>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {unreadMissed.map(call => {
                const personId = (call.status === 'callback' || call.status === 'cancelled') ? call.caller_id : call.callee_id;
                const person = staff.find(s => s.id === personId);
                return (
                  <div key={call.id} className="flex items-center gap-3 bg-amber-900/20 border border-amber-800/40 rounded-xl px-3 py-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-600/30 flex items-center justify-center shrink-0"><PhoneOff className="w-4 h-4 text-amber-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{person?.full_name || 'Team Member'}</p>
                      <p className="text-amber-400 text-xs">{call.status === 'callback' ? 'Call back requested' : call.status === 'cancelled' ? 'Missed call' : 'Declined your call'} · {formatCallTime(call.created_at)}</p>
                    </div>
                    <button onClick={() => callBackFromMissed(call)} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all shrink-0">Call Back</button>
                    <button onClick={() => dismissMissedCalls(call.id)} className="text-slate-600 hover:text-slate-300 p-1 shrink-0"><X className="w-3.5 h-3.5" /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CHANNELS WITH MEMBERS ── */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Channels</span>
            {isSuperAdmin && (
              <button onClick={() => setShowAddChannel(v => !v)} className="text-teal-400 hover:text-teal-300"><Plus className="w-4 h-4" /></button>
            )}
          </div>
          {showAddChannel && (
            <div className="flex gap-2 mb-3">
              <Input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="Channel name…"
                className="h-9 text-sm bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                onKeyDown={e => { if (e.key === 'Enter' && newChannelName.trim()) addChannelMutation.mutate(newChannelName.trim()); }} />
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-9 shrink-0" disabled={!newChannelName.trim() || addChannelMutation.isPending}
                onClick={() => addChannelMutation.mutate(newChannelName.trim())}>Add</Button>
            </div>
          )}
          <div className="space-y-3">
            {channels.map(ch => {
              const members = channelMembersById[ch.id] || [];
              const isActive = isJoined && activeChannel?.id === ch.id;
              const isExpanded = expandedChannelId === ch.id;
              return (
                <div key={ch.id} className={`rounded-2xl border-2 overflow-hidden transition-colors ${
                  isActive ? 'border-green-500 bg-green-950/40' : 'border-green-800/60 bg-slate-900'
                }`}>
                  {/* Channel header row — tap to expand in both modes */}
                  <div className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer ${isActive ? 'bg-green-900/30' : 'hover:bg-green-950/30'}`}
                    onClick={() => setExpandedChannelId(isExpanded ? null : ch.id)}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-green-600' : 'bg-green-900/50'}`}>
                      <Radio className={`w-4 h-4 ${isActive ? 'text-white' : 'text-green-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{ch.name}</p>
                      <p className="text-slate-500 text-xs">{members.length} member{members.length !== 1 ? 's' : ''}</p>
                    </div>
                    {/* Admin controls — hidden on T320 */}
                    {!isRadioMode && isSuperAdmin && (
                      <button onClick={e => { e.stopPropagation(); setManagingChannelId(ch.id); }}
                        className="text-slate-600 hover:text-teal-400 p-1.5 transition-colors shrink-0">
                        <Users className="w-4 h-4" />
                      </button>
                    )}
                    {isActive && !isRadioMode && (
                      <button onClick={e => { e.stopPropagation(); setGroupBroadcastActive(v => !v); }}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors shrink-0 ${
                          groupBroadcastActive ? 'bg-teal-600 border-teal-500 text-white' : 'border-slate-600 text-slate-400 hover:border-teal-700 hover:text-teal-400'
                        }`}>
                        {groupBroadcastActive ? '📡 On Air' : 'Broadcast'}
                      </button>
                    )}
                    {!isRadioMode && isSuperAdmin && (isActive ? (
                      <button onClick={e => { e.stopPropagation(); leaveChannel().then(() => { setActiveChannel(null); setSelectedPerson(null); setGroupBroadcastActive(false); }); }}
                        className="text-red-400 text-xs font-bold px-3 py-1.5 rounded-full border border-red-800 hover:bg-red-900/30 transition-colors shrink-0">
                        Leave
                      </button>
                    ) : (
                      <button onClick={e => { e.stopPropagation(); joinChannel(ch.name).then(() => { setActiveChannel(ch); setSelectedPerson(null); }); }}
                        disabled={joining}
                        className="text-teal-400 text-xs font-bold px-3 py-1.5 rounded-full border border-teal-800 hover:bg-teal-900/30 transition-colors shrink-0 disabled:opacity-40">
                        {joining ? '…' : 'Join'}
                      </button>
                    ))}
                    {!isRadioMode && isSuperAdmin && (
                      <button onClick={e => { e.stopPropagation(); deleteChannelMutation.mutate(ch.id); }} className="text-slate-700 hover:text-red-400 p-1 transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Members — always visible in radio mode, expand/collapse on web */}
                  {isExpanded && (
                    <div className="border-t border-green-900/40">
                      {members.length > 0 ? (
                        <div className="p-2 space-y-1">
                          {members.map(s => {
                            const cs = getCombinedStatus(s.id);
                            const uid = toUid(s.id);
                            const isSpeaking = speakingUids.has(uid);
                            const isSelected = selectedPerson?.id === s.id;
                            return (
                              <button key={s.id} onClick={() => setSelectedPerson(isSelected ? null : s)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all border text-left ${
                                  isSelected ? 'bg-teal-900/50 border-teal-600'
                                  : isSpeaking ? 'bg-slate-700 border-teal-600/50 animate-pulse'
                                  : 'bg-slate-800/60 border-slate-700/50 hover:border-green-700/50'
                                }`}>
                                <div className="relative shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                                    {(s.full_name || '?')[0].toUpperCase()}
                                  </div>
                                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${cs.dot}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm font-semibold truncate">{s.full_name || s.email}</p>
                                  <p className={`text-xs ${cs.text}`}>{cs.shiftLabel}{cs.radioLabel ? ` · ${cs.radioLabel}` : ''}</p>
                                </div>
                                {isSpeaking && <Mic className="w-3.5 h-3.5 text-teal-400 shrink-0 animate-pulse" />}
                                {isSelected && <span className="text-teal-400 text-xs font-bold shrink-0">P2P ▶</span>}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-700 text-xs text-center py-3 italic">
                          {isSuperAdmin ? 'Tap the people icon to assign members' : 'No members assigned yet'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {channels.length === 0 && !showAddChannel && (
              <p className="text-slate-600 text-xs text-center py-4 italic">{isSuperAdmin ? 'Tap + to create a channel' : 'No channels yet'}</p>
            )}
          </div>
        </div>

        {/* ── UNASSIGNED PEOPLE (shrinks as admin assigns everyone) ── */}
        {unassignedStaff.length > 0 && (
          <div className="px-4 pt-2 pb-4">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-wider mb-2">
              Unassigned ({unassignedStaff.length})
              {isSuperAdmin && <span className="normal-case font-normal ml-1 text-slate-700">— assign via channel people icon</span>}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unassignedStaff.map(s => <StaffPill key={s.id} s={s} />)}
            </div>
          </div>
        )}
        </>)}

        {radioTab === 'shift' && (isSuperAdmin
          ? <RadioShiftTab
              todayShiftCalls={todayShiftCalls}
              todayShifts={todayShifts}
              rotaAreas={areas}
              staff={staff}
              navigate={navigate}
              createPageUrl={createPageUrl}
              isControlDevice={isControlDevice}
            />
          : <p className="text-slate-600 text-xs text-center mt-16 px-8">Shift overview is available to admins only.</p>
        )}

        {radioTab === 'settings' && (
          <RadioSettingsTab
            channels={channels}
            silentMode={silentMode}
            setSilentMode={setSilentMode}
            showAllAreas={showAllAreas}
            setShowAllAreas={setShowAllAreas}
            areaToggles={areaToggles}
            setAreaToggles={setAreaToggles}
            customSounds={customSounds}
            setCustomSounds={setCustomSounds}
            pttKeyCode={pttKeyCode}
            keepAwake={keepAwake}
            setKeepAwake={setKeepAwake}
            wakeOnIncoming={wakeOnIncoming}
            setWakeOnIncoming={setWakeOnIncoming}
            bringToFront={bringToFront}
            setBringToFront={setBringToFront}
            detectingPTTKey={detectingPTTKey}
            onDetectPTTKey={onDetectPTTKey}
            onSetPTTKey={onSetPTTKey}
            onClearPTTKey={onClearPTTKey}
            isControlDevice={isControlDevice}
            radioTheme={radioTheme}
            setRadioTheme={setRadioTheme}
          />
        )}

      </div>

      {/* ── DESELECT PILL — only when a person is selected ── */}
      {radioTab === 'radio' && selectedPerson && (
        <div className="fixed bottom-28 left-0 right-0 px-4 z-20 space-y-1.5"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <button
            onClick={() => sendCallbackRequest(selectedPerson)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-teal-800/95 backdrop-blur border border-teal-600 text-teal-200 text-xs font-semibold touch-manipulation active:scale-[0.98] transition-transform">
            <Phone className="w-3.5 h-3.5" /> Call me back — {selectedPerson.full_name}
          </button>
          <button onClick={() => setSelectedPerson(null)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800/95 backdrop-blur border border-slate-700 text-slate-300 text-xs touch-manipulation">
            <X className="w-3.5 h-3.5" /> Deselect — press PTT to call
          </button>
        </div>
      )}

      {/* ── SOS BUTTON — fixed round, bottom left ── */}
      {radioTab === 'radio' && !emergencyActive && (
        <button
          onClick={startEmergencyCountdown}
          disabled={emergencyCountdown !== null}
          style={{ position: 'fixed', bottom: 'calc(20px + env(safe-area-inset-bottom))', left: 20, zIndex: 30 }}
          className={`w-16 h-16 rounded-full flex flex-col items-center justify-center gap-0.5 shadow-2xl active:scale-95 transition-all touch-manipulation ${
            emergencyCountdown !== null ? 'bg-slate-700 text-slate-500' : 'bg-red-600 text-white shadow-red-900/60'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
          <span className="text-[9px] font-black tracking-widest">SOS</span>
        </button>
      )}
    </>
  );
}

// ── Emergency button ──────────────────────────────────────────────────────────
function EmergencyButton({ onClick, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-full max-w-lg mx-auto flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl transition-all active:scale-95 ${
        disabled
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
          : 'bg-gradient-to-r from-red-800 to-red-600 text-white hover:from-red-700 hover:to-red-500 shadow-red-950/60'
      }`}>
      <AlertTriangle className="w-6 h-6" />
      SOS — Emergency
      <AlertTriangle className="w-6 h-6" />
    </button>
  );
}

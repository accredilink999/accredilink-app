import React, { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
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
  AlertTriangle, MapPin, MicOff, X, ChevronDown, MessageSquare
} from 'lucide-react';

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
function playTone(freqs, loop = false) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let timer = null;
  const burst = () => freqs.forEach((freq, i) => {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq; osc.type = 'sine';
    const t = ctx.currentTime + i * 0.11;
    gain.gain.setValueAtTime(0.35, t);
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
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      osc.start(t); osc.stop(t + 0.11);
    });
    setTimeout(() => { if (active) pulse(); }, 1800);
  };
  pulse();
  return () => { active = false; ctx.close().catch(() => {}); };
}

// UK TETRA/Airwave-style PTT tones
// talk-up: two ascending beeps (grant tone)
// talk-down: two descending beeps (clear tone)
function playPTTTone(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const freqs = type === 'up' ? [880, 1320] : [1320, 880];
    const now = ctx.currentTime;
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      const t = now + i * 0.085;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.45, t + 0.008);
      gain.gain.setValueAtTime(0.45, t + 0.065);
      gain.gain.linearRampToValueAtTime(0, t + 0.080);
      osc.start(t); osc.stop(t + 0.085);
    });
    setTimeout(() => ctx.close().catch(() => {}), 300);
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

  // Area grouping
  const [expandedAreas, setExpandedAreas] = useState(new Set());
  const [showOffShiftByArea, setShowOffShiftByArea] = useState({});

  // 30s call timeout → text alert modal
  const [textAlertModal, setTextAlertModal] = useState(null);
  const [textAlertMsg, setTextAlertMsg] = useState('');
  const callTimeoutRef = useRef(null);

  useEffect(() => { outgoingRef.current = outgoingCall; }, [outgoingCall]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: user }         = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: staff = [] }   = useQuery({ queryKey: ['staff'],       queryFn: () => base44.entities.User.list() });

  // Keep staffRef in sync so Realtime callbacks don't capture stale staff list
  useEffect(() => { staffRef.current = staff; }, [staff]);
  const todayStr               = format(new Date(), 'yyyy-MM-dd');
  const { data: todayShifts = [] } = useQuery({
    queryKey: ['radioShifts', todayStr], queryFn: () => ShiftApi.filter({ date: todayStr }), refetchInterval: 60000,
  });
  const { data: channels = [], isError: channelsError } = useQuery({
    queryKey: ['radioChannels'],
    queryFn: async () => { const { data, error } = await withOrgFilter(supabase.from('radio_channels').select('*').order('created_at')); if (error) throw error; return data || []; },
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

  // Missed / callback calls in the last 4 hours
  const { data: missedCalls = [] } = useQuery({
    queryKey: ['missedRadioCalls', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const [{ data: cbCalls }, { data: dcCalls }] = await Promise.all([
        supabase.from('radio_calls').select('id, caller_id, callee_id, status, created_at')
          .eq('callee_id', user.id).eq('status', 'callback').gt('created_at', since)
          .order('created_at', { ascending: false }),
        supabase.from('radio_calls').select('id, caller_id, callee_id, status, created_at')
          .eq('caller_id', user.id).eq('status', 'declined').gt('created_at', since)
          .order('created_at', { ascending: false }),
      ]);
      return [...(cbCalls || []), ...(dcCalls || [])]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20);
    },
    enabled: !!user?.id,
    refetchInterval: 60000,
  });
  const [dismissedMissedIds, setDismissedMissedIds] = useState(new Set());

  const isSuperAdmin  = user?.role === 'super_admin' || user?.role === 'admin';
  const myUid         = user?.id ? toUid(user.id) : null;
  const otherStaff    = staff.filter(s => s.id !== user?.id);
  const staffByUid    = Object.fromEntries(staff.map(s => [toUid(s.id), s]));
  const speakingNames = [...speakingUids].filter(u => u !== myUid).map(u => staffByUid[u]?.full_name || `User ${u}`);

  // Area grouping derived values
  const myAreaId = user?.area_id || user?.rota_area_id || null;
  const areaById = Object.fromEntries(areas.map(a => [String(a.id), a]));
  const groupedByArea = {};
  otherStaff.filter(s => s.role !== 'admin' && s.role !== 'super_admin').forEach(s => {
    const aId = String(s.area_id || s.rota_area_id || 'none');
    if (!groupedByArea[aId]) groupedByArea[aId] = [];
    groupedByArea[aId].push(s);
  });
  const sortedAreaIds = Object.keys(groupedByArea).sort((a, b) => {
    if (a === String(myAreaId)) return -1;
    if (b === String(myAreaId)) return 1;
    return (areaById[a]?.name || '').localeCompare(areaById[b]?.name || '');
  });
  // All staff see all areas; admins shown in their own top section
  const visibleAreaIds = sortedAreaIds;
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

  // Auto-expand the logged-in user's own area + admins group on load
  useEffect(() => {
    const ids = ['__admins'];
    if (myAreaId) ids.push(String(myAreaId));
    setExpandedAreas(new Set(ids));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myAreaId]);

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
    if (!shifts.length) return 'off_shift';
    const active = shifts.find(s => s.clock_in_time && !s.clock_out_time);
    if (active) return active.on_break ? 'on_break' : 'with_client';
    const allDone = shifts.every(s => s.clock_out_time);
    return allDone ? 'off_shift' : 'available';
  }, [todayShifts]);

  const statusCfg = {
    with_client: { label: 'With Client', dot: 'bg-red-500',   text: 'text-red-400'   },
    on_break:    { label: 'On Break',    dot: 'bg-amber-400', text: 'text-amber-400' },
    available:   { label: 'Available',  dot: 'bg-green-500', text: 'text-green-400' },
    off_shift:   { label: 'Off Shift',  dot: 'bg-blue-500',  text: 'text-blue-400'  },
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
      playPTTTone('up');
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
        if (call.status !== 'pending') return;
        if (Date.now() - new Date(call.created_at).getTime() > 30000) return;
        const caller = staffRef.current.find(s => s.id === call.caller_id);
        setIncomingCall({ callId: call.id, caller, channelName: call.channel_name });
        stopTone(); stopToneRef.current = playTone([880, 1100, 880, 1100, 660], true);
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

        // Caller-side: response from callee
        if (!cur || call.id !== cur.callId) return;
        stopTone();
        if (call.status === 'accepted') {
          activeCallIdRef.current = call.id;
          setOutgoingCall(null); setCallDeclined(false);
          joinChannel(call.channel_name).then(() => { setActiveChannel({ name: `📞 ${cur.callee?.full_name}`, id: '__ptp' }); setView('ptt'); });
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

  const callBackFromMissed = (call) => {
    const personId = call.status === 'callback' ? call.caller_id : call.callee_id;
    const person = staffRef.current.find(s => s.id === personId);
    if (!person) { toast.error('Could not find that person'); return; }
    setDismissedMissedIds(prev => new Set([...prev, call.id]));
    setSelectedPerson(person);
    initiateP2PCall(person);
  };

  const cancelOutgoingCall = async () => {
    stopTone();
    if (outgoingCall?.callId) await supabase.from('radio_calls').update({ status: 'cancelled' }).eq('id', outgoingCall.callId);
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
    setActiveChannel({ name: `📞 ${caller?.full_name || 'Call'}`, id: '__ptp' }); setView('ptt');
  };

  const endP2PCall = async () => {
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
    const down = e => { if (e.code === 'Space' && isJoined && !isTalking && !isHandsFree) { e.preventDefault(); startTalking(); } };
    const up   = e => { if (e.code === 'Space' && !isHandsFree) stopTalking(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [isJoined, isTalking, isHandsFree]);

  // ── Error state ───────────────────────────────────────────────────────────
  if (channelsError) return (
    <div className="p-8 text-center bg-slate-900 min-h-screen flex flex-col items-center justify-center gap-3">
      <Radio className="w-12 h-12 text-slate-600 mx-auto" />
      <p className="text-slate-400 text-sm">Radio tables not set up. Run the SQL in Supabase first.</p>
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
        <button onClick={() => declineIncomingCall('callback')}
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

      {/* Fixed full-height PTT side bar */}
      {!isHandsFree && (
        <button
          disabled={!isJoined || joining}
          onPointerDown={e => { e.preventDefault(); startTalking(); }}
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

      <div className={`min-h-screen bg-slate-900 flex flex-col pb-28 ${emergencyActive ? 'pt-10' : ''} ${!isHandsFree ? (pttHandedness === 'right' ? 'pr-[72px]' : 'pl-[72px]') : ''}`}>
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

        {/* PTT side-switch hint — obvious tap target */}
        {!isHandsFree && (
          <button onClick={toggleHandedness}
            className="mx-auto flex items-center gap-2 bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all rounded-full px-5 py-2 mb-1">
            <span className="text-slate-300 text-sm font-semibold">
              {pttHandedness === 'right' ? '← Move PTT to left hand' : 'Move PTT to right hand →'}
            </span>
          </button>
        )}

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
  return (
    <>
      {EmergencyCountdownOverlay}
      {ActiveEmergencyBanner}
      {IncomingCallOverlay}
      {OutgoingCallOverlay}
      {IncomingEmergencyOverlay}
      {TextAlertModal}

      <div className={`min-h-screen bg-slate-900 pb-56 ${emergencyActive ? 'pt-10' : ''}`}>
        {/* Test mode banner */}
        {testMode && (
          <div className="bg-amber-500 px-4 py-2 flex items-center gap-2">
            <span className="text-white text-xs font-bold">🧪 TEST MODE — alerts only go to you</span>
          </div>
        )}
        {/* Header */}
        <div className="bg-slate-800 px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Team Radio</h1>
            <p className="text-slate-400 text-xs">Select a channel or person below</p>
          </div>
        </div>

        {/* CHANNELS */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Channels</span>
            {isSuperAdmin && <button onClick={() => setShowAddChannel(v => !v)} className="text-teal-400 hover:text-teal-300"><Plus className="w-4 h-4" /></button>}
          </div>
          {showAddChannel && (
            <div className="flex gap-2 mb-3">
              <Input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="Channel name…"
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                onKeyDown={e => { if (e.key === 'Enter' && newChannelName.trim()) addChannelMutation.mutate(newChannelName.trim()); }} />
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-9 shrink-0" disabled={!newChannelName.trim() || addChannelMutation.isPending}
                onClick={() => addChannelMutation.mutate(newChannelName.trim())}>Add</Button>
            </div>
          )}
          <div className="space-y-2">
            {channels.map(ch => (
              <div key={ch.id} className="flex items-center gap-2">
                <button onClick={async () => { await joinChannel(ch.name); setActiveChannel(ch); setSelectedPerson(null); setView('ptt'); }}
                  className="flex-1 flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full bg-teal-600/20 flex items-center justify-center shrink-0"><Radio className="w-5 h-5 text-teal-400" /></div>
                  <div className="flex-1 min-w-0"><p className="text-white font-semibold text-sm truncate">{ch.name}</p><p className="text-slate-400 text-xs">Tap to join</p></div>
                  <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180 shrink-0" />
                </button>
                {isSuperAdmin && <button onClick={() => deleteChannelMutation.mutate(ch.id)} className="text-slate-600 hover:text-red-400 p-2 transition-colors"><Trash2 className="w-4 h-4" /></button>}
              </div>
            ))}
            {channels.length === 0 && !showAddChannel && (
              <p className="text-slate-500 text-xs text-center py-2 italic">{isSuperAdmin ? 'Tap + to create a channel' : 'No channels yet'}</p>
            )}
          </div>
        </div>

        {/* PEOPLE — Admins group + area groups, all staff visible */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              People{selectedPerson && <span className="text-teal-400 normal-case font-normal"> — {selectedPerson.full_name} selected</span>}
            </span>
            {selectedPerson && <button onClick={() => setSelectedPerson(null)} className="text-slate-500 hover:text-slate-300 text-xs">Clear</button>}
          </div>

          {/* Reusable staff card */}
          {(() => {
            const StaffCard = ({ s, teamLabel }) => {
              const status = getStaffStatus(s.id);
              const cfg = statusCfg[status] || statusCfg.off_shift;
              const uid = toUid(s.id);
              const isSpeaking = speakingUids.has(uid);
              const isSelected = selectedPerson?.id === s.id;
              return (
                <button key={s.id} onClick={() => setSelectedPerson(isSelected ? null : s)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-left ${
                    isSelected ? 'bg-teal-900/50 ring-2 ring-teal-500'
                    : isSpeaking ? 'bg-slate-700 ring-1 ring-teal-600'
                    : 'bg-slate-800/80 hover:bg-slate-700'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-sm">
                      {(s.full_name || s.email || '?')[0].toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${cfg.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{s.full_name || s.email}</p>
                    <p className={`text-xs ${isSpeaking ? 'text-teal-400 animate-pulse' : cfg.text}`}>
                      {isSpeaking ? '🎙 Speaking' : cfg.label}
                      {teamLabel && <span className="text-slate-500"> · {teamLabel}</span>}
                    </p>
                  </div>
                  {isSelected && <span className="text-teal-400 text-xs font-bold shrink-0">SELECTED</span>}
                </button>
              );
            };

            const SectionHeader = ({ aId, label, isMyArea, onShiftCount, offShiftCount }) => {
              const isExpanded = expandedAreas.has(aId);
              return (
                <button
                  onClick={() => setExpandedAreas(prev => {
                    const next = new Set(prev); if (next.has(aId)) next.delete(aId); else next.add(aId); return next;
                  })}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                    isMyArea ? 'bg-teal-900/40 hover:bg-teal-900/60' : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-semibold text-sm truncate ${isMyArea ? 'text-teal-300' : 'text-slate-300'}`}>{label}</span>
                    {isMyArea && <span className="text-teal-500 text-xs shrink-0">My Team</span>}
                    {onShiftCount !== undefined && (
                      <span className="text-slate-500 text-xs shrink-0 ml-1">
                        <span className="text-green-400">{onShiftCount} on</span>
                        {offShiftCount > 0 && <span className="text-blue-400"> · {offShiftCount} off</span>}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              );
            };

            return (
              <div className="space-y-2">
                {/* Admins group */}
                {adminStaff.length > 0 && (
                  <div className="rounded-xl overflow-hidden border border-purple-800/40">
                    <SectionHeader aId="__admins" label="Admins & Managers" isMyArea={false} />
                    {expandedAreas.has('__admins') && (
                      <div className="bg-slate-800/50 space-y-0.5 px-2 pt-1 pb-2">
                        {adminStaff.map(s => {
                          const teamLabel = areaById[String(s.area_id || s.rota_area_id)]?.name;
                          return <StaffCard key={s.id} s={s} teamLabel={teamLabel} />;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Area groups */}
                {visibleAreaIds.length === 0 && adminStaff.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">No staff found</p>
                )}
                {visibleAreaIds.map(aId => {
                  const areaStaff = groupedByArea[aId] || [];
                  const areaName = areaById[aId]?.name || (aId === 'none' ? 'Unassigned' : 'Team');
                  const isMyArea = aId === String(myAreaId);
                  const onShiftStaff = areaStaff.filter(s => getStaffStatus(s.id) !== 'off_shift');
                  const offShiftStaff = areaStaff.filter(s => getStaffStatus(s.id) === 'off_shift');
                  const showOff = !!showOffShiftByArea[aId];
                  const isExpanded = expandedAreas.has(aId);
                  const displayedStaff = isExpanded ? (showOff ? areaStaff : onShiftStaff) : [];
                  return (
                    <div key={aId} className="rounded-xl overflow-hidden border border-slate-700/50">
                      <SectionHeader aId={aId} label={areaName} isMyArea={isMyArea} onShiftCount={onShiftStaff.length} offShiftCount={offShiftStaff.length} />
                      {isExpanded && (
                        <div className="bg-slate-800/50 space-y-0.5 px-2 pt-1 pb-2">
                          {displayedStaff.length === 0 && onShiftStaff.length === 0 && (
                            <p className="text-slate-500 text-xs text-center py-3">No on-shift staff</p>
                          )}
                          {displayedStaff.map(s => <StaffCard key={s.id} s={s} teamLabel={null} />)}
                          {offShiftStaff.length > 0 && (
                            <button
                              onClick={() => setShowOffShiftByArea(prev => ({ ...prev, [aId]: !showOff }))}
                              className="w-full text-center text-xs text-blue-400 hover:text-blue-300 py-2 transition-colors"
                            >
                              {showOff ? 'Hide off-shift staff' : `+ ${offShiftStaff.length} off-shift`}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* CALL LOG */}
        {missedCalls.length > 0 && (
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Call Log</span>
              <button
                onClick={() => setDismissedMissedIds(prev => new Set([...prev, ...missedCalls.map(c => c.id)]))}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Dismiss all
              </button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
              {missedCalls.filter(c => !dismissedMissedIds.has(c.id)).map(call => {
                const personId = call.status === 'callback' ? call.caller_id : call.callee_id;
                const person = staff.find(s => s.id === personId);
                return (
                  <div key={call.id} className="flex items-center gap-3 bg-slate-800 rounded-xl px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center shrink-0">
                      <PhoneOff className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{person?.full_name || 'Team Member'}</p>
                      <p className="text-amber-400 text-xs">{call.status === 'callback' ? 'Call back requested' : 'Declined your call'}</p>
                      <p className="text-slate-500 text-xs">{formatCallTime(call.created_at)}</p>
                    </div>
                    <button onClick={() => callBackFromMissed(call)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all shrink-0">
                      Call Back
                    </button>
                    <button onClick={() => setDismissedMissedIds(prev => new Set([...prev, call.id]))}
                      className="text-slate-500 hover:text-slate-300 p-1 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              {missedCalls.every(c => dismissedMissedIds.has(c.id)) && (
                <p className="text-slate-500 text-xs text-center py-2">No new missed calls</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM BAR */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pt-3 pb-2 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-10 space-y-3">
        {/* Call button — only shown when a person is selected */}
        {selectedPerson && (
          <button onClick={() => initiateP2PCall()} disabled={joining}
            className="w-full flex items-center justify-center gap-3 py-5 rounded-2xl bg-green-600 hover:bg-green-700 active:scale-95 transition-all text-white shadow-lg disabled:opacity-50 max-w-lg mx-auto">
            <Radio className="w-7 h-7" />
            <span className="text-base font-bold">P2P — {selectedPerson.full_name}</span>
          </button>
        )}
        {/* Emergency */}
        <EmergencyButton onClick={startEmergencyCountdown} disabled={emergencyActive || emergencyCountdown !== null} />
      </div>
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

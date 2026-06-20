import React, { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Radio, Mic, Users, Plus, Trash2, PhoneOff,
  Volume2, Loader2, Signal, ChevronLeft, Phone, Bell
} from 'lucide-react';

const AGORA_APP_ID  = 'ff9f260da10245a5ab4855ea3ec59500';
const AGORA_APP_CERT = 'e8dd782a9eac4d3385162b3a1f81d6c4';

AgoraRTC.setLogLevel(4);

// ── Agora AccessToken V1 (client-side, matches agora-token npm byte-for-byte) ──
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

const toUid = (str = '') => { let h = 0; for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; } return Math.abs(h) % 999999 + 1; };
const getOrgId = () => localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId');
const withOrgFilter = q => { const id = getOrgId(); return id ? q.eq('organization_id', id) : q; };

// ── Tetra-style call tones via Web Audio ──────────────────────────────────────
function playTone(freqs, loop = false) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let timer = null;
  const burst = () => {
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'sine';
      const t = ctx.currentTime + i * 0.11;
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);
      osc.start(t); osc.stop(t + 0.10);
    });
  };
  burst();
  if (loop) timer = setInterval(burst, 2400);
  return () => { if (timer) clearInterval(timer); ctx.close().catch(() => {}); };
}

export default function TwoWayRadio() {
  const queryClient = useQueryClient();
  const location    = useLocation();

  // Agora refs
  const clientRef     = useRef(null);
  const micTrackRef   = useRef(null);
  const joinedChRef   = useRef(null);
  const stopToneRef   = useRef(null);
  const outgoingRef   = useRef(null); // mirrors outgoingCall state for realtime callbacks

  // ── Core state ──────────────────────────────────────────────────────────────
  const [view, setView]               = useState('main'); // 'main' | 'ptt'
  const [isJoined, setIsJoined]       = useState(false);
  const [isTalking, setIsTalking]     = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [speakingUids, setSpeakingUids]   = useState(new Set());
  const [remoteUsers, setRemoteUsers]     = useState([]);
  const [joining, setJoining]             = useState(false);
  const [micPermission, setMicPermission] = useState('unknown');

  // Main-view selection
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Call overlays
  const [incomingCall, setIncomingCall] = useState(null);  // { callId, caller, channelName }
  const [outgoingCall, setOutgoingCall] = useState(null);  // { callId, callee, channelName }
  const [callDeclined, setCallDeclined] = useState(false); // callee sent "call back"

  // Channel management
  const [newChannelName, setNewChannelName] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);

  // Keep ref in sync for realtime callbacks
  useEffect(() => { outgoingRef.current = outgoingCall; }, [outgoingCall]);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: user }         = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const { data: staff = [] }   = useQuery({ queryKey: ['staff'],       queryFn: () => base44.entities.User.list() });
  const todayStr               = format(new Date(), 'yyyy-MM-dd');
  const { data: todayShifts = [] } = useQuery({
    queryKey: ['radioShifts', todayStr],
    queryFn: () => ShiftApi.filter({ date: todayStr }),
    refetchInterval: 60000,
  });
  const { data: channels = [], isError: channelsError } = useQuery({
    queryKey: ['radioChannels'],
    queryFn: async () => {
      const { data, error } = await withOrgFilter(supabase.from('radio_channels').select('*').order('created_at'));
      if (error) throw error;
      return data || [];
    },
  });

  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const myUid        = user?.id ? toUid(user.id) : null;
  const otherStaff   = staff.filter(s => s.id !== user?.id);
  const staffByUid   = Object.fromEntries(staff.map(s => [toUid(s.id), s]));
  const speakingNames = [...speakingUids].filter(u => u !== myUid).map(u => staffByUid[u]?.full_name || `User ${u}`);

  const getStaffStatus = useCallback((staffId) => {
    const shifts = todayShifts.filter(s => s.staff_id === staffId && s.status !== 'cancelled');
    if (!shifts.length) return 'available';
    const a = shifts.find(s => s.status === 'in_progress' || (s.clock_in_time && !s.clock_out_time));
    if (!a) return 'available';
    return a.on_break ? 'on_break' : 'with_client';
  }, [todayShifts]);

  const statusCfg = {
    with_client: { label: 'With Client', dot: 'bg-red-500',   text: 'text-red-400'   },
    on_break:    { label: 'On Break',    dot: 'bg-amber-400', text: 'text-amber-400' },
    available:   { label: 'Available',  dot: 'bg-green-500', text: 'text-green-400' },
  };

  // ── Agora setup ─────────────────────────────────────────────────────────────
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

  // ── Core audio actions ───────────────────────────────────────────────────────
  const leaveChannel = async () => {
    try {
      if (micTrackRef.current) { micTrackRef.current.stop(); micTrackRef.current.close(); micTrackRef.current = null; }
      if (clientRef.current && clientRef.current.connectionState !== 'DISCONNECTED') await clientRef.current.leave();
    } catch {}
    setIsJoined(false); setIsTalking(false); setRemoteUsers([]); setSpeakingUids(new Set());
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
    try {
      const track = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = track;
      await clientRef.current.publish(track);
      setIsTalking(true); setMicPermission('granted');
    } catch (e) {
      if (e.name === 'NotAllowedError') { setMicPermission('denied'); toast.error('Microphone access denied'); }
      else toast.error('Mic error: ' + e.message);
    }
  };

  const stopTalking = async () => {
    if (!isTalking) return;
    try {
      if (micTrackRef.current) { await clientRef.current.unpublish(micTrackRef.current); micTrackRef.current.stop(); micTrackRef.current.close(); micTrackRef.current = null; }
    } catch {}
    setIsTalking(false);
  };

  const stopTone = () => { if (stopToneRef.current) { stopToneRef.current(); stopToneRef.current = null; } };

  // ── Supabase Realtime — incoming P2P calls + All Call in-app alerts ──────────
  useEffect(() => {
    if (!user?.id) return;
    const orgId = getOrgId();

    // P2P incoming calls
    const callSub = supabase
      .channel('radio-calls-in')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radio_calls', filter: `callee_id=eq.${user.id}` }, payload => {
        const call = payload.new;
        if (call.status !== 'pending') return;
        // Only show if recent (within last 30s)
        if (Date.now() - new Date(call.created_at).getTime() > 30000) return;
        const caller = staff.find(s => s.id === call.caller_id);
        setIncomingCall({ callId: call.id, caller, channelName: call.channel_name });
        stopTone();
        stopToneRef.current = playTone([880, 1100, 880, 1100, 660], true);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'radio_calls' }, payload => {
        const call = payload.new;
        const cur = outgoingRef.current;
        if (!cur || call.id !== cur.callId) return;
        stopTone();
        if (call.status === 'accepted') {
          setOutgoingCall(null); setCallDeclined(false);
          joinChannel(call.channel_name).then(() => {
            setActiveChannel({ name: `📞 ${cur.callee?.full_name}`, id: '__ptp' });
            setView('ptt');
          });
        } else if (call.status === 'callback') {
          setCallDeclined(true);
          setTimeout(() => { setOutgoingCall(null); setCallDeclined(false); }, 4000);
        }
      })
      .subscribe();

    // All Call in-app broadcast (for when app is already open)
    const broadcastSub = supabase
      .channel(`radio-allcall-${orgId || 'global'}`)
      .on('broadcast', { event: 'all_call' }, ({ payload }) => {
        if (payload.callerId === user.id) return;
        const name = payload.callerName || 'Someone';
        toast(`📻 ${name} started All Staff Radio`, {
          duration: 30000,
          action: {
            label: 'Join now',
            onClick: () => {
              joinChannel('allstaff-broadcast').then(() => {
                setActiveChannel({ name: 'All Staff', id: '__allcall' });
                setView('ptt');
              });
            },
          },
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(callSub); supabase.removeChannel(broadcastSub); };
  }, [user?.id, staff]);

  // ── Button handlers ──────────────────────────────────────────────────────────
  const handleAllCall = async () => {
    await joinChannel('allstaff-broadcast');
    setActiveChannel({ name: 'All Staff', id: '__allcall' });
    setSelectedPerson(null);
    setView('ptt');

    const orgId = getOrgId();
    const callerName = user?.full_name || user?.email || 'A team member';

    // In-app realtime broadcast (for open apps)
    supabase.channel(`radio-allcall-${orgId || 'global'}`).send({
      type: 'broadcast', event: 'all_call',
      payload: { callerName, callerId: user.id },
    }).catch(() => {});

    // Push notification (for locked screens / backgrounded app)
    const recipientIds = otherStaff.map(s => s.id);
    if (recipientIds.length > 0) {
      base44.functions.invoke('createNotification', {
        recipient_ids: recipientIds,
        type: 'radio_call',
        title: '📻 All Staff Radio',
        message: `${callerName} is on the All Staff channel. Tap to join.`,
        priority: 'high',
        action_url: '/TwoWayRadio?join=allstaff-broadcast',
        send_push: true,
      }).catch(() => {});
    }
  };

  const initiateP2PCall = async () => {
    if (!selectedPerson || !user?.id) return;
    const ids = [user.id, selectedPerson.id].sort();
    const chName = `ptp_${ids[0].slice(0, 8)}_${ids[1].slice(0, 8)}`;

    const { data: callRecord, error } = await supabase.from('radio_calls').insert({
      caller_id: user.id, callee_id: selectedPerson.id,
      channel_name: chName, status: 'pending', organization_id: getOrgId(),
    }).select().single();

    if (error) { toast.error('Failed to initiate call'); return; }

    setOutgoingCall({ callId: callRecord.id, callee: selectedPerson, channelName: chName });
    setCallDeclined(false);
    stopTone();
    stopToneRef.current = playTone([400, 600, 800, 600, 400], true);

    // Push + in-app notification to target (they may have app closed)
    const callerName = user?.full_name || user?.email || 'A team member';
    base44.functions.invoke('createNotification', {
      recipient_ids: [selectedPerson.id],
      type: 'radio_call',
      title: `📞 ${callerName} is calling you`,
      message: 'Tap to answer on Team Radio.',
      priority: 'high',
      action_url: `/TwoWayRadio?join=${chName}`,
      send_push: true,
    }).catch(() => {});
  };

  const cancelOutgoingCall = async () => {
    stopTone();
    if (outgoingCall?.callId) {
      await supabase.from('radio_calls').update({ status: 'cancelled' }).eq('id', outgoingCall.callId);
    }
    setOutgoingCall(null); setCallDeclined(false);
  };

  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    stopTone();
    await supabase.from('radio_calls').update({ status: 'accepted' }).eq('id', incomingCall.callId);
    const { caller, channelName } = incomingCall;
    setIncomingCall(null);
    await joinChannel(channelName);
    setActiveChannel({ name: `📞 ${caller?.full_name || 'Call'}`, id: '__ptp' });
    setView('ptt');
  };

  const declineIncomingCall = async () => {
    stopTone();
    if (incomingCall?.callId) {
      await supabase.from('radio_calls').update({ status: 'callback' }).eq('id', incomingCall.callId);
    }
    setIncomingCall(null);
  };

  const handleSendAlert = async () => {
    const callerName = user?.full_name || user?.email || 'A team member';
    const targets = selectedPerson ? [selectedPerson.id] : otherStaff.map(s => s.id);
    if (!targets.length) return;
    base44.functions.invoke('createNotification', {
      recipient_ids: targets,
      type: 'radio_call',
      title: `🔔 Radio Alert from ${callerName}`,
      message: selectedPerson ? 'Please check your radio.' : 'All staff: please check radio.',
      priority: 'high',
      action_url: '/TwoWayRadio',
      send_push: true,
    }).catch(() => {});
    toast.success(selectedPerson ? `Alert sent to ${selectedPerson.full_name}` : 'Alert sent to all staff');
  };

  // Channel mutations
  const addChannelMutation = useMutation({
    mutationFn: async (name) => {
      const { error } = await supabase.from('radio_channels').insert({ name, organization_id: getOrgId() });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['radioChannels'] }); setNewChannelName(''); setShowAddChannel(false); toast.success('Channel created'); },
    onError: e => toast.error('Failed: ' + e.message),
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id) => { const { error } = await supabase.from('radio_channels').delete().eq('id', id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['radioChannels'] }),
  });

  // Auto-join from notification deep link (?join=channelName)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get('join');
    if (!target || !myUid || !clientRef.current) return;
    if (joinedChRef.current === target) return;

    joinChannel(target).then(() => {
      if (target === 'allstaff-broadcast') {
        setActiveChannel({ name: 'All Staff', id: '__allcall' });
      } else if (target.startsWith('ptp_')) {
        setActiveChannel({ name: 'Radio Call', id: '__ptp' });
        // Auto-accept: if there's an incoming call for this channel, mark it accepted
        if (incomingCall?.channelName === target) {
          supabase.from('radio_calls').update({ status: 'accepted' }).eq('id', incomingCall.callId).then(() => {});
          stopTone();
          setIncomingCall(null);
        }
      } else {
        setActiveChannel({ name: target, id: target });
      }
      setView('ptt');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, myUid]);

  // Keyboard Space = PTT
  useEffect(() => {
    const down = e => { if (e.code === 'Space' && isJoined && !isTalking) { e.preventDefault(); startTalking(); } };
    const up   = e => { if (e.code === 'Space') stopTalking(); };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [isJoined, isTalking]);

  // ── Error state ──────────────────────────────────────────────────────────────
  if (channelsError) return (
    <div className="p-8 text-center bg-slate-900 min-h-screen flex flex-col items-center justify-center">
      <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">Radio tables not set up. Run the SQL in Supabase first.</p>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // OVERLAYS — rendered on top of everything
  // ════════════════════════════════════════════════════════════════════════════

  const IncomingCallOverlay = incomingCall && (
    <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col items-center justify-center gap-8 px-6">
      {/* Pulse ring */}
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
      <div className="flex gap-6 w-full max-w-xs">
        <button
          onClick={declineIncomingCall}
          className="flex-1 py-5 rounded-2xl bg-amber-500 text-white font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform"
        >
          <Phone className="w-6 h-6" />
          I WILL<br />CALL BACK
        </button>
        <button
          onClick={acceptIncomingCall}
          className="flex-1 py-5 rounded-2xl bg-green-500 text-white font-bold text-sm flex flex-col items-center gap-1 active:scale-95 transition-transform"
        >
          <Mic className="w-6 h-6" />
          ACCEPT
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
        {callDeclined ? (
          <>
            <p className="text-amber-400 text-sm uppercase tracking-widest mb-1">Will Call Back</p>
            <p className="text-white text-2xl font-bold">{outgoingCall.callee?.full_name}</p>
            <p className="text-slate-400 text-sm mt-2">They'll get back to you shortly</p>
          </>
        ) : (
          <>
            <p className="text-slate-400 text-sm uppercase tracking-widest mb-1">Calling…</p>
            <p className="text-white text-3xl font-bold">{outgoingCall.callee?.full_name}</p>
          </>
        )}
      </div>
      <button
        onClick={cancelOutgoingCall}
        className="w-20 h-20 rounded-full bg-red-600 text-white flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform"
      >
        <PhoneOff className="w-7 h-7" />
        <span className="text-xs font-semibold">END</span>
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PTT VIEW — full-screen radio page
  // ════════════════════════════════════════════════════════════════════════════
  if (view === 'ptt') return (
    <>
      {IncomingCallOverlay}
      {OutgoingCallOverlay}
      <div className="min-h-screen bg-slate-900 flex flex-col pb-24">
        {/* Header */}
        <div className="bg-slate-800 px-4 pt-4 pb-3 flex items-center gap-3">
          <button
            onClick={async () => { await leaveChannel(); setActiveChannel(null); setView('main'); }}
            className="text-slate-400 hover:text-white p-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-white font-bold">{activeChannel?.name || 'Radio'}</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <Signal className="w-3 h-3" /> Live
            </p>
          </div>
          <button
            onClick={async () => { await leaveChannel(); setActiveChannel(null); setView('main'); }}
            className="text-red-400 hover:text-red-300 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-800 hover:bg-red-900/30 transition-colors"
          >
            Leave
          </button>
        </div>

        {/* Speaking indicator */}
        <div className="h-10 flex items-center justify-center">
          {speakingNames.length > 0 ? (
            <div className="flex items-center gap-2 bg-teal-900/50 rounded-full px-4 py-1.5 animate-pulse">
              <Volume2 className="w-4 h-4 text-teal-400" />
              <span className="text-teal-300 text-sm font-semibold">{speakingNames.join(', ')} speaking…</span>
            </div>
          ) : (
            <span className="text-slate-500 text-sm">Channel clear</span>
          )}
        </div>

        {/* PTT button */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
          <div className="relative">
            {isTalking && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500/25 animate-ping scale-110" />
                <div className="absolute inset-0 rounded-full bg-red-500/15 animate-ping scale-125" style={{ animationDelay: '0.2s' }} />
              </>
            )}
            <button
              disabled={!isJoined || joining}
              onMouseDown={startTalking} onMouseUp={stopTalking} onMouseLeave={stopTalking}
              onTouchStart={e => { e.preventDefault(); startTalking(); }}
              onTouchEnd={e => { e.preventDefault(); stopTalking(); }}
              className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center gap-3 font-bold text-xl transition-all select-none touch-none shadow-2xl ${
                !isJoined ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : isTalking ? 'bg-red-600 text-white scale-95'
                : 'bg-teal-600 text-white active:scale-95'
              }`}
            >
              {joining ? <Loader2 className="w-14 h-14 animate-spin" />
                : isTalking ? <Mic className="w-14 h-14" />
                : <Radio className="w-14 h-14" />}
              <span className="text-base font-bold tracking-wide">
                {joining ? 'JOINING…' : isTalking ? 'TRANSMITTING' : 'HOLD TO TALK'}
              </span>
            </button>
          </div>

          {micPermission === 'denied' && (
            <p className="text-red-400 text-xs text-center max-w-xs">
              Microphone blocked. Allow mic access in browser settings and refresh.
            </p>
          )}
          <p className="text-slate-500 text-xs">Hold to speak • Release to listen • Space bar on desktop</p>

          {/* Online in this channel */}
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
        </div>
      </div>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN VIEW — channels list + people list + 3 action buttons
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <>
      {IncomingCallOverlay}
      {OutgoingCallOverlay}

      <div className="min-h-screen bg-slate-900 pb-44">
        {/* Header */}
        <div className="bg-slate-800 px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Team Radio</h1>
            <p className="text-slate-400 text-xs">Select a channel or person below</p>
          </div>
        </div>

        {/* ── CHANNELS ─────────────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Channels</span>
            {isSuperAdmin && (
              <button onClick={() => setShowAddChannel(v => !v)} className="text-teal-400 hover:text-teal-300">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {showAddChannel && (
            <div className="flex gap-2 mb-3">
              <Input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="Channel name…"
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                onKeyDown={e => { if (e.key === 'Enter' && newChannelName.trim()) addChannelMutation.mutate(newChannelName.trim()); }}
              />
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-9 shrink-0"
                disabled={!newChannelName.trim() || addChannelMutation.isPending}
                onClick={() => addChannelMutation.mutate(newChannelName.trim())}>Add</Button>
            </div>
          )}

          <div className="space-y-2">
            {/* All Staff */}
            <button
              onClick={handleAllCall}
              className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">All Staff</p>
                <p className="text-slate-400 text-xs">Broadcast to everyone</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180" />
            </button>

            {channels.map(ch => (
              <div key={ch.id} className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    await joinChannel(ch.name);
                    setActiveChannel(ch);
                    setSelectedPerson(null);
                    setView('ptt');
                  }}
                  className="flex-1 flex items-center gap-3 bg-slate-800 hover:bg-slate-700 rounded-xl px-4 py-3 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-600/20 flex items-center justify-center shrink-0">
                    <Radio className="w-5 h-5 text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{ch.name}</p>
                    <p className="text-slate-400 text-xs">Tap to join</p>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-600 rotate-180" />
                </button>
                {isSuperAdmin && (
                  <button onClick={() => deleteChannelMutation.mutate(ch.id)} className="text-slate-600 hover:text-red-400 p-2 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}

            {channels.length === 0 && !showAddChannel && (
              <p className="text-slate-500 text-xs text-center py-2 italic">
                {isSuperAdmin ? 'Tap + to create a channel' : 'No channels yet'}
              </p>
            )}
          </div>
        </div>

        {/* ── PEOPLE ───────────────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              People {selectedPerson && <span className="text-teal-400 normal-case"> — {selectedPerson.full_name} selected</span>}
            </span>
            {selectedPerson && (
              <button onClick={() => setSelectedPerson(null)} className="text-slate-500 hover:text-slate-300 text-xs">Clear</button>
            )}
          </div>
          <div className="space-y-2">
            {otherStaff.map(s => {
              const status = getStaffStatus(s.id);
              const cfg = statusCfg[status];
              const uid = toUid(s.id);
              const isSpeaking = speakingUids.has(uid);
              const isSelected = selectedPerson?.id === s.id;

              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedPerson(isSelected ? null : s)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all text-left ${
                    isSelected
                      ? 'bg-teal-900/50 ring-2 ring-teal-500'
                      : isSpeaking
                        ? 'bg-slate-700 ring-1 ring-teal-600'
                        : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-white font-bold text-sm">
                      {(s.full_name || s.email || '?')[0].toUpperCase()}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${cfg.dot}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{s.full_name || s.email}</p>
                    <p className={`text-xs ${isSpeaking ? 'text-teal-400 animate-pulse' : cfg.text}`}>
                      {isSpeaking ? '🎙 Speaking' : cfg.label}
                    </p>
                  </div>
                  {isSelected && <span className="text-teal-400 text-xs font-bold">SELECTED</span>}
                </button>
              );
            })}
            {otherStaff.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No other staff found</p>
            )}
          </div>
        </div>
      </div>

      {/* ── 3 LARGE ACTION BUTTONS — fixed at bottom ─────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 px-4 pb-2 bg-slate-900/95 backdrop-blur border-t border-slate-800 pt-3 z-10">
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
          {/* 1 — ALL CALL (red) */}
          <button
            onClick={handleAllCall}
            disabled={joining}
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 transition-all text-white shadow-lg"
          >
            <Users className="w-7 h-7" />
            <span className="text-xs font-bold leading-tight text-center">ALL<br />CALL</span>
          </button>

          {/* 2 — POINT TO POINT (green) */}
          <button
            onClick={initiateP2PCall}
            disabled={!selectedPerson || joining}
            className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl active:scale-95 transition-all text-white shadow-lg ${
              selectedPerson
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Phone className="w-7 h-7" />
            <span className="text-xs font-bold leading-tight text-center">POINT 2<br />POINT</span>
          </button>

          {/* 3 — ALERT (amber) */}
          <button
            onClick={handleSendAlert}
            disabled={joining}
            className="flex flex-col items-center justify-center gap-2 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all text-white shadow-lg"
          >
            <Bell className="w-7 h-7" />
            <span className="text-xs font-bold leading-tight text-center">
              {selectedPerson ? 'ALERT\nPERSON' : 'ALERT\nALL'}
            </span>
          </button>
        </div>

        {selectedPerson && (
          <p className="text-center text-teal-400 text-xs mt-2 font-medium">
            {selectedPerson.full_name} selected — tap Point 2 Point to call
          </p>
        )}
      </div>
    </>
  );
}

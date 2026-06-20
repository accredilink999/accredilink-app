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
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Radio, Mic, MicOff, Users, Plus, Trash2, Phone, PhoneOff,
  Volume2, VolumeX, Loader2, Signal, Wifi, WifiOff
} from 'lucide-react';

const AGORA_APP_ID = 'ff9f260da10245a5ab4855ea3ec59500';
const AGORA_APP_CERT = 'e8dd782a9eac4d3385162b3a1f81d6c4';

AgoraRTC.setLogLevel(4); // errors only

// Agora AccessToken V1 — matches the official agora-token npm package byte-for-byte
function _crc32(str) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  let c = 0xFFFFFFFF;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    c = table[(c ^ code) & 0xFF] ^ (c >>> 8);
    if (code > 255) c = table[(c ^ (code >>> 8)) & 0xFF] ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

async function buildAgoraToken(channelName, uid) {
  const expireTs = (Math.floor(Date.now() / 1000) + 3600) >>> 0;
  const salt     = (Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0;
  const ts       = (Math.floor(Date.now() / 1000) + 24 * 3600) >>> 0;
  const uidStr   = uid === 0 ? '' : String(uid);

  const u16 = (n) => { const b = new Uint8Array(2); b[0] = n & 0xFF; b[1] = (n >> 8) & 0xFF; return b; };
  const u32 = (n) => { n = n >>> 0; const b = new Uint8Array(4); b[0] = n & 0xFF; b[1] = (n >> 8) & 0xFF; b[2] = (n >> 16) & 0xFF; b[3] = (n >> 24) & 0xFF; return b; };
  const cat = (...as) => { const o = new Uint8Array(as.reduce((s, a) => s + a.length, 0)); let p = 0; for (const a of as) { o.set(a, p); p += a.length; } return o; };
  const pb  = (b) => cat(u16(b.length), b); // putBytes: uint16LE(len) + raw bytes

  // m = salt + ts + privileges map
  const privs = [[1, expireTs], [2, expireTs], [3, expireTs], [4, expireTs]];
  const privMap = cat(u16(privs.length), ...privs.flatMap(([k, v]) => [u16(k), u32(v)]));
  const m = cat(u32(salt), u32(ts), privMap);

  // HMAC-SHA256: key = cert as UTF-8 bytes (NOT hex-decoded)
  //              msg = appId_utf8 + channelName_utf8 + uid_utf8 + m
  const enc = new TextEncoder();
  const keyBytes = enc.encode(AGORA_APP_CERT);
  const msgBytes = cat(enc.encode(AGORA_APP_ID), enc.encode(channelName), enc.encode(uidStr), m);
  const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, msgBytes));

  // content = putBytes(sig) + uint32(crc32(channel)) + uint32(crc32(uid)) + putBytes(m)
  const content = cat(pb(sig), u32(_crc32(channelName)), u32(_crc32(uidStr)), pb(m));

  let bin = '';
  content.forEach(b => { bin += String.fromCharCode(b); });
  return '006' + AGORA_APP_ID + btoa(bin);
}

// Convert UUID to a stable Agora-compatible integer UID
const toUid = (str = '') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return Math.abs(h) % 999999 + 1;
};

const withOrgFilter = (q) => {
  const orgId = localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId');
  return orgId ? q.eq('organization_id', orgId) : q;
};

export default function TwoWayRadio() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const clientRef = useRef(null);
  const micTrackRef = useRef(null);
  const joinedChannelRef = useRef(null);

  const [isJoined, setIsJoined] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);
  const [speakingUids, setSpeakingUids] = useState(new Set());
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [joining, setJoining] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [ptpTarget, setPtpTarget] = useState(null); // point-to-point staff member
  const [allCallActive, setAllCallActive] = useState(false);
  const [micPermission, setMicPermission] = useState('unknown'); // 'granted'|'denied'|'unknown'

  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const myUid = user?.id ? toUid(user.id) : null;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const nowStr = format(new Date(), 'HH:mm');

  const { data: todayShifts = [] } = useQuery({
    queryKey: ['radioShifts', todayStr],
    queryFn: () => ShiftApi.filter({ date: todayStr }),
    refetchInterval: 60000,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: channels = [], isError: channelsError } = useQuery({
    queryKey: ['radioChannels'],
    queryFn: async () => {
      const { data, error } = await withOrgFilter(supabase.from('radio_channels').select('*').order('created_at'));
      if (error) throw error;
      return data || [];
    },
  });

  // Determine each staff member's status from today's shifts
  const getStaffStatus = useCallback((staffId) => {
    const shifts = todayShifts.filter(s => s.staff_id === staffId && s.status !== 'cancelled');
    if (!shifts.length) return 'available';
    const activeShift = shifts.find(s => s.status === 'in_progress' || (s.clock_in_time && !s.clock_out_time));
    if (!activeShift) return 'available';
    if (activeShift.on_break) return 'on_break';
    return 'with_client';
  }, [todayShifts]);

  const statusConfig = {
    with_client: { label: 'With Client', color: 'bg-red-500', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
    on_break:    { label: 'On Break',    color: 'bg-amber-400', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
    available:   { label: 'Available',   color: 'bg-green-500', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  };

  // ── Agora setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const c = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = c;

    c.on('user-published', async (remoteUser, mediaType) => {
      await c.subscribe(remoteUser, mediaType);
      if (mediaType === 'audio') {
        remoteUser.audioTrack?.play();
        setSpeakingUids(prev => new Set([...prev, remoteUser.uid]));
      }
      setRemoteUsers(c.remoteUsers);
    });

    c.on('user-unpublished', (remoteUser) => {
      setSpeakingUids(prev => { const n = new Set(prev); n.delete(remoteUser.uid); return n; });
      setRemoteUsers([...c.remoteUsers]);
    });

    c.on('user-left', (remoteUser) => {
      setSpeakingUids(prev => { const n = new Set(prev); n.delete(remoteUser.uid); return n; });
      setRemoteUsers([...c.remoteUsers]);
    });

    c.on('user-joined', () => setRemoteUsers([...c.remoteUsers]));

    return () => {
      leaveChannel();
      c.removeAllListeners();
    };
  }, []);

  const leaveChannel = async () => {
    try {
      if (micTrackRef.current) {
        micTrackRef.current.stop();
        micTrackRef.current.close();
        micTrackRef.current = null;
      }
      if (clientRef.current && clientRef.current.connectionState !== 'DISCONNECTED') {
        await clientRef.current.leave();
      }
    } catch (e) { /* ignore */ }
    setIsJoined(false);
    setIsTalking(false);
    setRemoteUsers([]);
    setSpeakingUids(new Set());
    joinedChannelRef.current = null;
  };

  const joinChannel = async (channelName) => {
    if (!myUid || !clientRef.current) return;
    setJoining(true);
    try {
      if (joinedChannelRef.current) await leaveChannel();
      const token = await buildAgoraToken(channelName, myUid);
      await clientRef.current.join(AGORA_APP_ID, channelName, token, myUid);
      joinedChannelRef.current = channelName;
      setIsJoined(true);
      toast.success(`Joined ${channelName}`);
    } catch (e) {
      toast.error('Could not join channel: ' + e.message);
    }
    setJoining(false);
  };

  const startTalking = async () => {
    if (!isJoined || isTalking) return;
    try {
      const track = await AgoraRTC.createMicrophoneAudioTrack();
      micTrackRef.current = track;
      await clientRef.current.publish(track);
      setIsTalking(true);
      setMicPermission('granted');
    } catch (e) {
      if (e.name === 'NotAllowedError') {
        setMicPermission('denied');
        toast.error('Microphone permission denied');
      } else {
        toast.error('Could not access mic: ' + e.message);
      }
    }
  };

  const stopTalking = async () => {
    if (!isTalking) return;
    try {
      if (micTrackRef.current) {
        await clientRef.current.unpublish(micTrackRef.current);
        micTrackRef.current.stop();
        micTrackRef.current.close();
        micTrackRef.current = null;
      }
    } catch (e) { /* ignore */ }
    setIsTalking(false);
  };

  // All-call: join the "all-staff" broadcast channel
  const handleAllCall = async () => {
    if (allCallActive) {
      await leaveChannel();
      setAllCallActive(false);
      setActiveChannel(null);
      return;
    }
    await joinChannel('allstaff-broadcast');
    setAllCallActive(true);
    setActiveChannel({ name: 'All Staff', id: '__allcall' });

    // Alert all other staff — tapping the notification drops them straight into this channel
    const callerName = user?.full_name || user?.email || 'A team member';
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
      }).catch(() => {}); // fire-and-forget
    }
  };

  // Point-to-point: join a private channel with one other staff member
  const handlePointToPoint = async (targetUser) => {
    if (!user?.id) return;
    const ids = [user.id, targetUser.id].sort();
    const chName = `ptp_${ids[0].slice(0, 8)}_${ids[1].slice(0, 8)}`;
    await joinChannel(chName);
    setPtpTarget(targetUser);
    setAllCallActive(false);
    setActiveChannel({ name: `📞 ${targetUser.full_name}`, id: '__ptp' });

    // Alert the specific staff member — tapping drops them into the same private channel
    const callerName = user?.full_name || user?.email || 'A team member';
    base44.functions.invoke('createNotification', {
      recipient_ids: [targetUser.id],
      type: 'radio_call',
      title: `📞 ${callerName} is calling you`,
      message: 'Tap to answer on Team Radio.',
      priority: 'high',
      action_url: `/TwoWayRadio?join=${chName}`,
      send_push: true,
    }).catch(() => {});
  };

  // Add channel mutation
  const addChannelMutation = useMutation({
    mutationFn: async (name) => {
      const orgId = localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId');
      const { error } = await supabase.from('radio_channels').insert({ name, organization_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['radioChannels'] });
      setNewChannelName('');
      setShowAddChannel(false);
      toast.success('Channel created');
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('radio_channels').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['radioChannels'] }),
  });

  // Auto-join channel from notification deep link (?join=channelName)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const target = params.get('join');
    if (!target || !myUid || !clientRef.current) return;
    if (joinedChannelRef.current === target) return; // already in it

    joinChannel(target).then(() => {
      if (target === 'allstaff-broadcast') {
        setAllCallActive(true);
        setActiveChannel({ name: 'All Staff', id: '__allcall' });
      } else if (target.startsWith('ptp_')) {
        setActiveChannel({ name: 'Incoming Call', id: '__ptp' });
      } else {
        // named channel — match from channels list once loaded
        setActiveChannel(ch => ch || { name: target, id: target });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, myUid]);

  // Keyboard: Space = PTT
  useEffect(() => {
    const down = (e) => { if (e.code === 'Space' && isJoined && !isTalking) { e.preventDefault(); startTalking(); } };
    const up   = (e) => { if (e.code === 'Space') stopTalking(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [isJoined, isTalking]);

  // ── Find staff name from UID ─────────────────────────────────────────────
  const staffByUid = {};
  staff.forEach(s => { staffByUid[toUid(s.id)] = s; });

  const speakingNames = [...speakingUids]
    .filter(uid => uid !== myUid)
    .map(uid => staffByUid[uid]?.full_name || `User ${uid}`);

  const otherStaff = staff.filter(s => s.id !== user?.id);

  if (channelsError) {
    return (
      <div className="p-6 text-center">
        <Radio className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-700 mb-2">Radio not set up yet</h2>
        <p className="text-sm text-slate-500 mb-4">Ask your super admin to run the database setup SQL in Supabase.</p>
      </div>
    );
  }

  return (
    <div className="pb-24 min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Team Radio</h1>
            <p className="text-slate-400 text-xs">
              {isJoined ? (
                <span className="flex items-center gap-1 text-green-400">
                  <Signal className="w-3 h-3" /> Live — {activeChannel?.name}
                </span>
              ) : 'Select a channel to join'}
            </p>
          </div>
        </div>
        {isJoined && (
          <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
            onClick={async () => { await leaveChannel(); setActiveChannel(null); setAllCallActive(false); setPtpTarget(null); }}>
            <PhoneOff className="w-4 h-4 mr-1" /> Leave
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-0">
        {/* ── Channels panel ───────────────────────────────── */}
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Channels</span>
            {isSuperAdmin && (
              <button onClick={() => setShowAddChannel(v => !v)} className="text-teal-400 hover:text-teal-300">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Add channel input */}
          {showAddChannel && (
            <div className="flex gap-2 mb-2">
              <Input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="Channel name…"
                className="h-8 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                onKeyDown={e => { if (e.key === 'Enter' && newChannelName.trim()) addChannelMutation.mutate(newChannelName.trim()); }}
              />
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 shrink-0"
                disabled={!newChannelName.trim() || addChannelMutation.isPending}
                onClick={() => addChannelMutation.mutate(newChannelName.trim())}>
                Add
              </Button>
            </div>
          )}

          {/* All-call button */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleAllCall}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                allCallActive
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Users className="w-3 h-3" />
              All Staff
            </button>

            {channels.map(ch => {
              const isActive = activeChannel?.id === ch.id;
              return (
                <div key={ch.id} className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      if (isActive) { await leaveChannel(); setActiveChannel(null); return; }
                      await joinChannel(ch.name);
                      setActiveChannel(ch);
                      setAllCallActive(false);
                      setPtpTarget(null);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      isActive ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Radio className="w-3 h-3" />
                    {ch.name}
                  </button>
                  {isSuperAdmin && (
                    <button onClick={() => deleteChannelMutation.mutate(ch.id)}
                      className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {channels.length === 0 && !showAddChannel && (
              <span className="text-slate-500 text-xs italic">
                {isSuperAdmin ? 'Tap + to create a channel' : 'No channels yet'}
              </span>
            )}
          </div>
        </div>

        {/* ── PTT main area ────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center py-8 px-4 gap-4">
          {/* Who is speaking */}
          <div className="min-h-[28px]">
            {speakingNames.length > 0 ? (
              <div className="flex items-center gap-2 bg-teal-900/50 rounded-full px-4 py-1.5 animate-pulse">
                <Volume2 className="w-4 h-4 text-teal-400" />
                <span className="text-teal-300 text-sm font-semibold">{speakingNames.join(', ')} speaking…</span>
              </div>
            ) : isJoined ? (
              <span className="text-slate-500 text-sm">Channel clear</span>
            ) : null}
          </div>

          {/* Big PTT button */}
          <div className="relative">
            {/* Ripple rings when talking */}
            {isTalking && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping scale-110" />
                <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping scale-125 animation-delay-150" />
              </>
            )}
            <button
              disabled={!isJoined || joining}
              onMouseDown={startTalking}
              onMouseUp={stopTalking}
              onMouseLeave={stopTalking}
              onTouchStart={(e) => { e.preventDefault(); startTalking(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopTalking(); }}
              className={`relative w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 font-bold text-lg transition-all select-none touch-none shadow-2xl ${
                !isJoined
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : isTalking
                    ? 'bg-red-600 text-white scale-95 shadow-red-900'
                    : 'bg-teal-600 text-white active:bg-teal-700 active:scale-95'
              }`}
            >
              {joining ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : isTalking ? (
                <Mic className="w-10 h-10" />
              ) : (
                <Radio className="w-10 h-10" />
              )}
              <span className="text-sm font-semibold">
                {!isJoined ? 'Join a channel' : isTalking ? 'TRANSMITTING' : 'HOLD TO TALK'}
              </span>
            </button>
          </div>

          {micPermission === 'denied' && (
            <p className="text-red-400 text-xs text-center max-w-xs">
              Microphone access denied. Please allow mic access in your browser settings and refresh.
            </p>
          )}

          <p className="text-slate-500 text-xs">Hold button to speak • Release to listen</p>
        </div>

        {/* ── Staff presence & point-to-point ─────────────── */}
        <div className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Staff</span>
          </div>
          <div className="space-y-2">
            {otherStaff.map(s => {
              const status = getStaffStatus(s.id);
              const cfg = statusConfig[status];
              const uid = toUid(s.id);
              const isSpeaking = speakingUids.has(uid);
              const isOnCall = ptpTarget?.id === s.id && activeChannel?.id === '__ptp';

              return (
                <div key={s.id}
                  className={`flex items-center justify-between bg-slate-800 rounded-xl px-3 py-2.5 transition-all ${
                    isSpeaking ? 'ring-2 ring-teal-500 bg-slate-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-slate-300 font-semibold text-sm">
                        {(s.full_name || s.email || '?')[0].toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${cfg.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{s.full_name || s.email}</p>
                      <div className="flex items-center gap-1.5">
                        {isSpeaking && (
                          <span className="flex items-center gap-0.5 text-teal-400 text-xs animate-pulse">
                            <Volume2 className="w-3 h-3" /> Speaking
                          </span>
                        )}
                        {!isSpeaking && (
                          <span className={`text-xs ${cfg.text}`}>{cfg.label}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => isOnCall
                      ? (leaveChannel().then(() => { setActiveChannel(null); setPtpTarget(null); }))
                      : handlePointToPoint(s)
                    }
                    className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-semibold transition-all ${
                      isOnCall
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-teal-700 hover:text-white'
                    }`}
                  >
                    {isOnCall ? <PhoneOff className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                    {isOnCall ? 'End' : 'Call'}
                  </button>
                </div>
              );
            })}

            {otherStaff.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">No other staff members found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

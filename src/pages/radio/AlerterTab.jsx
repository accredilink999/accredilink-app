import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, parseISO, differenceInMinutes, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  BellRing, BellOff, CheckCheck, Trash2, ChevronDown, ChevronUp,
  ChevronLeft, User, UserRound, Clock, AlertTriangle, MessageSquare,
  AlertOctagon, CheckCircle, Radio, History,
} from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

// ── Pager tone — MP3-based ────────────────────────────────────────────────────
export const ALERTER_TONES = [
  { id: 'pager',      label: 'Pager',      file: '/pager.mp3' },
  { id: 'rnli_pager', label: 'RNLI Pager', file: '/rnli_pager.mp3' },
];

let _pagerAudio = null;
let _pagerTimer = null;
let _pagerActive = false;

function getAlertToneFile() {
  const id = localStorage.getItem('alerter_tone') || 'pager';
  return ALERTER_TONES.find(t => t.id === id)?.file || '/pager.mp3';
}

function playPagerOnce() {
  try {
    if (_pagerAudio) { _pagerAudio.pause(); _pagerAudio = null; }
    const a = new Audio(getAlertToneFile());
    a.volume = 1.0;
    _pagerAudio = a;
    a.play().catch(() => {});
  } catch {}
}

export function startPagerLoop() {
  if (_pagerActive) return;
  _pagerActive = true;
  playPagerOnce();
  _pagerTimer = setInterval(playPagerOnce, 4000);
}

export function stopPagerLoop() {
  _pagerActive = false;
  if (_pagerTimer) { clearInterval(_pagerTimer); _pagerTimer = null; }
  if (_pagerAudio) { try { _pagerAudio.pause(); } catch {} _pagerAudio = null; }
}

// ── Org helper ────────────────────────────────────────────────────────────────
const getOrgId = () =>
  localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';

// ── Alert thresholds ──────────────────────────────────────────────────────────
const LATE_CLOCK_IN_MINS  = 15;
const LATE_CALL_MINS      = 15;
const CALL_OVERRUN_MINS   = 50;
const LATE_CLOCK_OUT_MINS = 60;

// ── Field icon map ────────────────────────────────────────────────────────────
const FIELD_ICONS = {
  user:    User,
  person:  UserRound,
  clock:   Clock,
  alert:   AlertTriangle,
  message: MessageSquare,
  urgent:  AlertOctagon,
};

// ── Alert builder ─────────────────────────────────────────────────────────────
function buildAlerts(todayShifts, todayShiftCalls, staff, todayStr, now) {
  const alerts = [];

  // 1. LATE_SHIFT_CLOCK_IN
  todayShifts.forEach(s => {
    if (['completed', 'cancelled', 'available_cover', 'available'].includes(s.status)) return;
    if (s.clock_in_time) return;
    if (!s.start_time) return;
    try {
      const start = parseISO(`${s.date || todayStr}T${s.start_time}`);
      const minsLate = differenceInMinutes(now, start);
      if (minsLate < LATE_CLOCK_IN_MINS) return;
      const staffName = (s.staff_name || staff.find(u => u.id === s.staff_id)?.full_name || 'Unknown').toUpperCase();
      alerts.push({
        id:       `late_clockin_${s.id}`,
        type:     'LATE_SHIFT_CLOCK_IN',
        priority: 'HIGH',
        title:    'Staff Late Clock On',
        refId:    s.id,
        fields: [
          { icon: 'user',    label: 'Staff Member',    value: staffName },
          { icon: 'clock',   label: 'Shift Start',     value: `${s.start_time.slice(0, 5)} HRS` },
          { icon: 'alert',   label: 'Overdue',         value: `${minsLate} minutes` },
          { icon: 'message', label: 'Action Required', value: 'Staff member has not clocked on to their shift. Please attempt contact.' },
        ],
      });
    } catch {}
  });

  // 2. LATE_CALL_CHECKIN
  todayShiftCalls.forEach(c => {
    if (c.status !== 'pending') return;
    if (!c.scheduled_time) return;
    try {
      const due = parseISO(`${todayStr}T${c.scheduled_time}`);
      const minsLate = differenceInMinutes(now, due);
      if (minsLate < LATE_CALL_MINS) return;
      const pairedShiftId = c.shifts?.paired_shift_id;
      if (pairedShiftId) {
        const pairedIn = todayShiftCalls.some(other =>
          other.shift_id === pairedShiftId &&
          other.status !== 'pending' &&
          other.scheduled_time &&
          Math.abs(differenceInMinutes(parseISO(`${todayStr}T${other.scheduled_time}`), due)) <= 30
        );
        if (pairedIn) return;
      }
      const staffName = (c.shifts?.staff_name || staff.find(u => u.id === c.shifts?.staff_id)?.full_name || 'Unknown').toUpperCase();
      const clientName = (c.service_user_name || 'Unknown Client').toUpperCase();
      alerts.push({
        id:       `late_call_${c.id}`,
        type:     'LATE_CALL_CHECKIN',
        priority: 'HIGH',
        title:    'Late Client Check-In',
        refId:    c.id,
        fields: [
          { icon: 'user',    label: 'Staff Member',    value: staffName },
          { icon: 'person',  label: 'Client',          value: clientName },
          { icon: 'clock',   label: 'Call Due',        value: `${c.scheduled_time.slice(0, 5)} HRS` },
          { icon: 'alert',   label: 'Overdue',         value: `${minsLate} minutes` },
          { icon: 'message', label: 'Action Required', value: 'Nobody has checked in to this care call. Please verify staff welfare.' },
        ],
      });
    } catch {}
  });

  // 3. CALL_OVERRUN
  todayShiftCalls.forEach(c => {
    if (!['in_progress', 'started'].includes(c.status)) return;
    const startRef = c.clock_in_time || c.scheduled_time;
    if (!startRef) return;
    try {
      const startTime = c.clock_in_time
        ? new Date(c.clock_in_time)
        : parseISO(`${todayStr}T${c.scheduled_time}`);
      const minsIn = differenceInMinutes(now, startTime);
      if (minsIn < CALL_OVERRUN_MINS) return;
      const staffName = (c.shifts?.staff_name || staff.find(u => u.id === c.shifts?.staff_id)?.full_name || 'Unknown').toUpperCase();
      const clientName = (c.service_user_name || 'Unknown Client').toUpperCase();
      const timeLabel = c.clock_in_time
        ? format(new Date(c.clock_in_time), 'HH:mm')
        : c.scheduled_time?.slice(0, 5) || '??:??';
      alerts.push({
        id:       `overrun_${c.id}`,
        type:     'CALL_OVERRUN',
        priority: 'URGENT',
        title:    'Care Call Overrun',
        refId:    c.id,
        fields: [
          { icon: 'user',    label: 'Staff Member',    value: staffName },
          { icon: 'person',  label: 'Client',          value: clientName },
          { icon: 'clock',   label: 'Call Started',    value: `approx ${timeLabel} HRS` },
          { icon: 'alert',   label: 'Duration',        value: `${minsIn} minutes and counting` },
          { icon: 'urgent',  label: 'Action Required', value: 'Staff not booked out after 50 minutes. CHECK WELFARE IMMEDIATELY.' },
        ],
      });
    } catch {}
  });

  // 4. LATE_SHIFT_CLOCK_OUT
  todayShifts.forEach(s => {
    if (['cancelled', 'available_cover', 'available'].includes(s.status)) return;
    if (!s.clock_in_time) return;
    if (s.clock_out_time) return;
    if (!s.end_time) return;
    try {
      const end = parseISO(`${s.date || todayStr}T${s.end_time}`);
      const minsOverdue = differenceInMinutes(now, end);
      if (minsOverdue < LATE_CLOCK_OUT_MINS) return;
      const staffName = (s.staff_name || staff.find(u => u.id === s.staff_id)?.full_name || 'Unknown').toUpperCase();
      alerts.push({
        id:       `late_clockout_${s.id}`,
        type:     'LATE_SHIFT_CLOCK_OUT',
        priority: 'HIGH',
        title:    'Shift Not Booked Off',
        refId:    s.id,
        fields: [
          { icon: 'user',    label: 'Staff Member',    value: staffName },
          { icon: 'clock',   label: 'Shift Ended',     value: `${s.end_time.slice(0, 5)} HRS` },
          { icon: 'alert',   label: 'Overdue',         value: `${minsOverdue} minutes` },
          { icon: 'message', label: 'Action Required', value: 'Staff member has not booked off their shift. Please attempt contact.' },
        ],
      });
    } catch {}
  });

  return alerts;
}

// ── Alert History (log panel) ─────────────────────────────────────────────────
function AlertHistory() {
  const [open, setOpen] = useState(false);
  const orgId = getOrgId();
  const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['alerter_logs_history', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('alerter_logs')
        .select('*')
        .eq('organization_id', orgId)
        .gte('log_date', sevenDaysAgo)
        .order('triggered_at', { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: open && !!orgId,
    refetchInterval: open ? 60000 : false,
  });

  const grouped = useMemo(() => {
    const map = new Map();
    for (const log of logs) {
      const d = log.log_date || 'unknown';
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(log);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [logs]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-teal-700" />
          <span className="text-gray-700 text-sm font-medium">Alert History (7 days)</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-gray-100 max-h-96 overflow-y-auto">
          {isLoading && <p className="text-gray-400 text-sm px-4 py-3">Loading…</p>}
          {!isLoading && grouped.length === 0 && (
            <p className="text-gray-400 text-sm px-4 py-3">No logs in last 7 days</p>
          )}
          {grouped.map(([date, entries]) => {
            let displayDate = date;
            try { displayDate = format(parseISO(date), 'dd/MM/yyyy'); } catch {}
            return (
              <div key={date}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-2 bg-gray-50 border-b border-gray-100">
                  {displayDate}
                </p>
                {entries.map(log => {
                  const isUrgent = log.priority === 'URGENT';
                  let timeLabel = '';
                  try { timeLabel = format(new Date(log.triggered_at), 'HH:mm'); } catch {}
                  return (
                    <div key={log.id} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isUrgent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                        }`}>{log.priority}</span>
                        <span className="text-gray-400 text-xs">{timeLabel}</span>
                      </div>
                      {log.title && <p className="text-gray-800 text-sm font-medium">{log.title}</p>}
                      {log.body && <p className="text-gray-500 text-xs mt-0.5 leading-snug">{log.body}</p>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AlerterTab({ todayShifts = [], todayShiftCalls = [], staff = [], alerterEnabled = true }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [now, setNow]           = useState(() => new Date());
  const [selectedId, setSelectedId] = useState(null); // null = list view
  const [showHistory, setShowHistory] = useState(false);
  const [ackedIds, setAckedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alerter_acked') || '[]')); } catch { return new Set(); }
  });
  const [deletedIds, setDeletedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alerter_deleted') || '[]')); } catch { return new Set(); }
  });
  const [silenced, setSilenced] = useState(false);
  const [blinkOn, setBlinkOn]   = useState(true);

  const clockRef       = useRef(null);
  const blinkRef       = useRef(null);
  const loggedIdsRef   = useRef(new Set());
  const prevHasNewRef  = useRef(false);
  const firstSeenRef   = useRef({});

  // 30s poll
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(clockRef.current);
  }, []);

  // Blink
  useEffect(() => {
    blinkRef.current = setInterval(() => setBlinkOn(p => !p), 700);
    return () => clearInterval(blinkRef.current);
  }, []);

  // Poll for test alerts fired from Control Room (every 15s)
  const { data: testTriggers = [] } = useQuery({
    queryKey: ['alerter_test_triggers'],
    queryFn: async () => {
      const since = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // last 10 mins
      const orgId = getOrgId();
      let q = supabase.from('alerter_test_triggers').select('*').gte('triggered_at', since).order('triggered_at', { ascending: false });
      // Only filter by org if one is set — handles empty-org single-tenant deployments
      if (orgId) q = q.eq('organization_id', orgId);
      const { data } = await q;
      return data || [];
    },
    enabled: alerterEnabled,
    refetchInterval: 15000,
  });

  const testAlerts = useMemo(() => testTriggers.map(t => ({
    id:       `test_${t.id}`,
    type:     'TEST',
    priority: 'HIGH',
    title:    'Test Alert',
    refId:    t.id,
    fields: [
      { icon: 'alert',   label: 'Type',        value: 'CONTROL ROOM TEST ALERT' },
      { icon: 'user',    label: 'Fired By',    value: (t.triggered_by || 'Control Room').toUpperCase() },
      { icon: 'clock',   label: 'Time',        value: format(new Date(t.triggered_at), 'HH:mm dd/MM/yyyy') },
      { icon: 'message', label: 'Message',     value: t.message || 'Test alert — alerter is working correctly.' },
    ],
  })), [testTriggers]);

  const allAlerts    = useMemo(() => [...buildAlerts(todayShifts, todayShiftCalls, staff, todayStr, now), ...testAlerts], [todayShifts, todayShiftCalls, staff, todayStr, now, testAlerts]);
  const visibleAlerts = allAlerts.filter(a => !deletedIds.has(a.id));
  const newAlerts    = visibleAlerts.filter(a => !ackedIds.has(a.id));
  const hasNew       = newAlerts.length > 0;

  // Track first-seen timestamps
  useEffect(() => {
    allAlerts.forEach(a => {
      if (!firstSeenRef.current[a.id]) firstSeenRef.current[a.id] = new Date();
    });
  }, [allAlerts]);

  // Auto-select first new alert when one arrives and nothing selected
  useEffect(() => {
    if (hasNew && !selectedId) setSelectedId(newAlerts[0]?.id || null);
  }, [hasNew]); // eslint-disable-line

  // Wake lock while new alerts active
  useEffect(() => {
    if (!hasNew || !('wakeLock' in navigator)) return;
    let lock = null;
    const acquire = () => navigator.wakeLock?.request('screen').then(l => { lock = l; }).catch(() => {});
    acquire();
    const onVisible = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [hasNew]);

  // Pager tone
  useEffect(() => {
    if (!alerterEnabled) { stopPagerLoop(); return; }
    if (hasNew && !silenced) startPagerLoop();
    else stopPagerLoop();
    return () => stopPagerLoop();
  }, [hasNew, silenced, alerterEnabled]);

  // Reset silenced on new alert
  const prevNewIdsRef = useRef(new Set());
  useEffect(() => {
    const currentIds = new Set(newAlerts.map(a => a.id));
    if ([...currentIds].some(id => !prevNewIdsRef.current.has(id))) setSilenced(false);
    prevNewIdsRef.current = currentIds;
  }, [newAlerts]);

  // APK notification wake
  useEffect(() => {
    if (hasNew && !prevHasNewRef.current && 'Notification' in window) {
      navigator.serviceWorker?.ready.then(reg =>
        reg.showNotification('⚠️ CareCall Alerter', {
          body: `${newAlerts.length} new alert${newAlerts.length > 1 ? 's' : ''}`,
          tag: 'alerter', renotify: true, requireInteraction: true,
        })
      ).catch(() => {});
    }
    prevHasNewRef.current = hasNew;
  }, [hasNew, newAlerts.length]);

  // Supabase logging
  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId) return;
    allAlerts.forEach(alert => {
      if (loggedIdsRef.current.has(alert.id)) return;
      loggedIdsRef.current.add(alert.id);
      supabase.from('alerter_logs').insert({
        alert_id:        alert.id,
        alert_type:      alert.type,
        priority:        alert.priority,
        title:           alert.title,
        body:            alert.fields.map(f => `${f.label}: ${f.value}`).join(' | '),
        ref_id:          alert.refId,
        log_date:        format(new Date(), 'yyyy-MM-dd'),
        organization_id: orgId,
      }).then(() => {}).catch(() => {});
    });
  }, [allAlerts]);

  const ack = useCallback((id) => {
    setAckedIds(prev => {
      const next = new Set([...prev, id]);
      try { localStorage.setItem('alerter_acked', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const del = useCallback((id) => {
    setDeletedIds(prev => {
      const next = new Set([...prev, id]);
      try { localStorage.setItem('alerter_deleted', JSON.stringify([...next])); } catch {}
      return next;
    });
    setAckedIds(prev => {
      const next = new Set([...prev, id]);
      try { localStorage.setItem('alerter_acked', JSON.stringify([...next])); } catch {}
      return next;
    });
    if (selectedId === id) {
      const idx = visibleAlerts.findIndex(a => a.id === id);
      const next = visibleAlerts[idx + 1] || visibleAlerts[idx - 1] || null;
      setSelectedId(next?.id || null);
    }
  }, [selectedId, visibleAlerts]);

  const ackAll = useCallback(() => {
    const ids = visibleAlerts.map(a => a.id);
    setAckedIds(prev => {
      const next = new Set([...prev, ...ids]);
      try { localStorage.setItem('alerter_acked', JSON.stringify([...next])); } catch {}
      return next;
    });
    setSilenced(true);
  }, [visibleAlerts]);

  const timeStr = format(now, 'HH:mm');

  // ── Selected alert detail ──────────────────────────────────────────────────
  const selectedAlert = selectedId ? visibleAlerts.find(a => a.id === selectedId) : null;
  const selectedIdx   = selectedAlert ? visibleAlerts.findIndex(a => a.id === selectedId) : -1;
  const canPrev       = selectedIdx > 0;
  const canNext       = selectedIdx < visibleAlerts.length - 1;

  const goNext = () => { if (canNext) setSelectedId(visibleAlerts[selectedIdx + 1].id); };
  const goPrev = () => { if (canPrev) setSelectedId(visibleAlerts[selectedIdx - 1].id); };

  // ── Disabled state ────────────────────────────────────────────────────────
  if (!alerterEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <BellOff className="w-8 h-8 text-gray-300" />
        <p className="text-gray-400 text-sm text-center">Alerter disabled.<br />Enable it in Settings.</p>
      </div>
    );
  }

  // ── Teal header (shared) ──────────────────────────────────────────────────
  const Header = ({ onBack, title, subtitle }) => (
    <div className="flex items-center justify-between px-4 py-3" style={{ background: '#0f766e' }}>
      <div className="flex items-center gap-2">
        {onBack ? (
          <button onClick={onBack} className="flex items-center gap-1 text-white/90 touch-manipulation mr-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
        ) : (
          <Radio className="w-5 h-5 text-white" />
        )}
        <div>
          <p className="text-white font-semibold leading-tight">{title}</p>
          {subtitle && <p className="text-teal-100 text-xs leading-tight">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-teal-100 text-sm">{timeStr}</span>
        {hasNew && (
          <div className={`flex items-center gap-1 transition-opacity duration-200 ${blinkOn ? 'opacity-100' : 'opacity-20'}`}>
            <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]" />
            <span className="text-white text-xs font-bold">{newAlerts.length}</span>
          </div>
        )}
      </div>
    </div>
  );

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedAlert) {
    const isNew    = !ackedIds.has(selectedAlert.id);
    const isUrgent = selectedAlert.priority === 'URGENT';
    const receivedAt = firstSeenRef.current[selectedAlert.id] || now;

    return (
      <div className="flex flex-col" style={{ background: '#f5f5f5', minHeight: '100%' }}>
        <Header
          onBack={() => setSelectedId(null)}
          title="Pager"
          subtitle={`Message ${selectedIdx + 1} of ${visibleAlerts.length}`}
        />

        <div className="flex-1 overflow-y-auto pb-36">
          {/* Card */}
          <div className="m-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Card header */}
            <div className="flex items-start gap-3 p-4 border-b border-gray-100">
              <BellRing className={`w-6 h-6 mt-0.5 flex-shrink-0 ${isUrgent ? 'text-red-500' : 'text-teal-700'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base">{selectedAlert.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  Received: {format(receivedAt, 'dd/MM/yyyy HH:mm')}
                </p>
                <p className="text-sm mt-0.5">
                  Priority:{' '}
                  <span className={`font-semibold ${isUrgent ? 'text-red-500' : 'text-orange-500'}`}>
                    {isUrgent ? 'Urgent' : 'High'}
                  </span>
                </p>
              </div>
              {isNew && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0 ${
                  isUrgent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                }`}>NEW</span>
              )}
            </div>

            {/* Fields */}
            {selectedAlert.fields.map((field, fi) => {
              const Icon = FIELD_ICONS[field.icon] || MessageSquare;
              const isActionField = field.icon === 'urgent' || (field.icon === 'message' && field.label === 'Action Required');
              return (
                <div key={fi} className="flex gap-3 px-4 py-3 border-b border-gray-50 last:border-b-0">
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isUrgent && isActionField ? 'text-red-500' : 'text-teal-700'}`} />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{field.label}</p>
                    <p className={`text-sm mt-0.5 leading-snug ${
                      isUrgent && isActionField ? 'text-red-600 font-semibold' : 'text-gray-600'
                    }`}>{field.value}</p>
                  </div>
                </div>
              );
            })}

            {/* REF */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-gray-400 text-[10px] font-mono">REF: {selectedAlert.refId?.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Fixed bottom controls */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-2 shadow-lg">
          {/* Prev / Next navigation */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={goPrev}
              disabled={!canPrev}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium touch-manipulation ${
                canPrev ? 'border-teal-700 text-teal-700 active:bg-teal-50' : 'border-gray-200 text-gray-300'
              }`}
            >
              <ChevronUp className="w-4 h-4" /> Prev
            </button>
            <span className="text-gray-400 text-xs">{selectedIdx + 1} / {visibleAlerts.length}</span>
            <button
              onClick={goNext}
              disabled={!canNext}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium touch-manipulation ${
                canNext ? 'border-teal-700 text-teal-700 active:bg-teal-50' : 'border-gray-200 text-gray-300'
              }`}
            >
              Next <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isNew && !silenced && (
              <button
                onClick={() => { stopPagerLoop(); setSilenced(true); }}
                className="flex-1 border border-teal-700 text-teal-700 rounded-lg py-3 text-sm font-semibold active:bg-teal-50 touch-manipulation"
              >
                SILENCE
              </button>
            )}
            {isNew ? (
              <button
                onClick={() => { ack(selectedAlert.id); goNext(); }}
                className="flex-1 text-white rounded-lg py-3 text-sm font-semibold active:opacity-90 touch-manipulation"
                style={{ background: '#0f766e' }}
              >
                ACKNOWLEDGE
              </button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-1.5 text-gray-400 text-sm border border-gray-200 rounded-lg py-3">
                <CheckCheck className="w-4 h-4" /> Acknowledged
              </div>
            )}
            <button
              onClick={() => del(selectedAlert.id)}
              className="border border-red-200 text-red-400 rounded-lg px-4 py-3 active:bg-red-50 touch-manipulation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" style={{ background: '#f5f5f5', minHeight: '100%' }}>
      <Header
        title="Pager"
        subtitle={hasNew ? `${newAlerts.length} unread alert${newAlerts.length !== 1 ? 's' : ''}` : 'All clear'}
      />

      <div className="flex-1 overflow-y-auto pb-32 space-y-0">

        {/* All clear state */}
        {visibleAlerts.length === 0 && (
          <div className="m-4 bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-3" style={{ color: '#0f766e' }} />
            <p className="font-semibold text-gray-800 text-lg">All Clear</p>
            <p className="text-gray-500 text-sm mt-1">No outstanding alerts</p>
            <p className="text-gray-400 text-xs mt-1">{format(now, 'dd/MM/yyyy HH:mm')}</p>
          </div>
        )}

        {/* Alert list rows */}
        {visibleAlerts.length > 0 && (
          <div className="m-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {visibleAlerts.map((alert, idx) => {
              const isNew    = !ackedIds.has(alert.id);
              const isUrgent = alert.priority === 'URGENT';
              const receivedAt = firstSeenRef.current[alert.id] || now;
              const preview  = alert.fields.find(f => f.icon === 'user')?.value || '';
              return (
                <button
                  key={alert.id}
                  onClick={() => setSelectedId(alert.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-b-0 active:bg-gray-50 touch-manipulation ${isNew ? '' : 'opacity-60'}`}
                >
                  <BellRing className={`w-5 h-5 flex-shrink-0 ${isUrgent ? 'text-red-500' : 'text-teal-700'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm truncate ${isNew ? 'text-gray-900' : 'text-gray-500'}`}>{alert.title}</p>
                      {isNew && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          isUrgent ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                        }`}>{isUrgent ? 'URGENT' : 'HIGH'}</span>
                      )}
                    </div>
                    <p className="text-gray-500 text-xs truncate">{preview}</p>
                    <p className="text-gray-400 text-[10px]">{format(receivedAt, 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-300 flex-shrink-0 -rotate-90" />
                </button>
              );
            })}
          </div>
        )}

        {/* Bulk actions */}
        {hasNew && visibleAlerts.length > 1 && (
          <div className="mx-3 flex gap-2">
            <button
              onClick={() => { stopPagerLoop(); setSilenced(true); }}
              className="flex-1 border border-teal-700 text-teal-700 rounded-lg py-3 text-sm font-semibold active:bg-teal-50 touch-manipulation"
            >
              SILENCE ALL
            </button>
            <button
              onClick={ackAll}
              className="flex-1 text-white rounded-lg py-3 text-sm font-semibold active:opacity-90 touch-manipulation"
              style={{ background: '#0f766e' }}
            >
              ACK ALL
            </button>
          </div>
        )}

        {/* Alert History */}
        <div className="mx-3 mt-3">
          <AlertHistory />
        </div>
      </div>
    </div>
  );
}

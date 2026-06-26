import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, parseISO, differenceInMinutes, subDays } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { BellOff, CheckCheck, Trash2, BellRing, Wifi, ChevronDown } from 'lucide-react';
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

// ── Alert builder ─────────────────────────────────────────────────────────────
function buildAlerts(todayShifts, todayShiftCalls, staff, todayStr, now) {
  const alerts = [];
  const ts = format(now, 'dd/MM/yyyy HH:mm');

  // ── 1. LATE_SHIFT_CLOCK_IN ─────────────────────────────────────────────────
  todayShifts.forEach(s => {
    if (['completed', 'cancelled', 'available_cover', 'available'].includes(s.status)) return;
    if (s.clock_in_time) return;
    if (!s.start_time) return;
    try {
      const start = parseISO(`${s.date || todayStr}T${s.start_time}`);
      const minsLate = differenceInMinutes(now, start);
      if (minsLate < LATE_CLOCK_IN_MINS) return;
      const staffName = (s.staff_name || staff.find(u => u.id === s.staff_id)?.full_name || 'UNKNOWN').toUpperCase();
      alerts.push({
        id:       `late_clockin_${s.id}`,
        type:     'LATE_SHIFT_CLOCK_IN',
        priority: 'HIGH',
        timestamp: now,
        refId:    s.id,
        lines: [
          '** ALERT — STAFF LATE CLOCK ON **',
          staffName,
          `SHIFT START: ${s.start_time.slice(0, 5)} HRS · ${minsLate} MINS OVERDUE`,
          'Staff member has not clocked on to their shift. Please attempt contact.',
          ts,
        ],
      });

      // For paired shifts — also alert for paired staff if they haven't clocked in
      if (s.paired_shift_id && s.paired_staff_name) {
        const pairedShift = todayShifts.find(ps => ps.id === s.paired_shift_id);
        if (pairedShift && !pairedShift.clock_in_time &&
          !['completed', 'cancelled', 'available_cover', 'available'].includes(pairedShift.status)) {
          // Paired shift alert is generated when we iterate over pairedShift — avoid duplicates
          // by only alerting if this shift's id is lexically smaller (ensures one alert per pair)
          // Actually: each shift generates its own alert independently, which is correct per spec
        }
      }
    } catch {}
  });

  // ── 2. LATE_CALL_CHECKIN ───────────────────────────────────────────────────
  todayShiftCalls.forEach(c => {
    if (c.status !== 'pending') return;
    if (!c.scheduled_time) return;
    try {
      const due = parseISO(`${todayStr}T${c.scheduled_time}`);
      const minsLate = differenceInMinutes(now, due);
      if (minsLate < LATE_CALL_MINS) return;

      // Paired shift check: if the paired shift has a call checked in within 30 mins, skip
      const pairedShiftId = c.shifts?.paired_shift_id;
      if (pairedShiftId) {
        const pairedCallCheckedIn = todayShiftCalls.some(other =>
          other.shift_id === pairedShiftId &&
          other.status !== 'pending' &&
          other.scheduled_time &&
          Math.abs(differenceInMinutes(
            parseISO(`${todayStr}T${other.scheduled_time}`),
            due
          )) <= 30
        );
        if (pairedCallCheckedIn) return;
      }

      const staffName = (
        c.shifts?.staff_name ||
        staff.find(u => u.id === c.shifts?.staff_id)?.full_name ||
        'UNKNOWN'
      ).toUpperCase();
      const clientName = (c.service_user_name || 'CLIENT').toUpperCase();

      alerts.push({
        id:       `late_call_${c.id}`,
        type:     'LATE_CALL_CHECKIN',
        priority: 'HIGH',
        timestamp: now,
        refId:    c.id,
        lines: [
          '** ALERT — LATE CLIENT CHECK-IN **',
          `${staffName} → ${clientName}`,
          `CALL DUE: ${c.scheduled_time.slice(0, 5)} HRS · ${minsLate} MINS OVERDUE`,
          'Nobody has checked in to this care call. Please verify staff welfare.',
          ts,
        ],
      });
    } catch {}
  });

  // ── 3. CALL_OVERRUN ────────────────────────────────────────────────────────
  todayShiftCalls.forEach(c => {
    if (!['in_progress', 'started'].includes(c.status)) return;
    // Use clock_in_time if available, else fall back to scheduled_time
    const startRef = c.clock_in_time || c.scheduled_time;
    if (!startRef) return;
    try {
      const startTime = c.clock_in_time
        ? new Date(c.clock_in_time)
        : parseISO(`${todayStr}T${c.scheduled_time}`);
      const minsIn = differenceInMinutes(now, startTime);
      if (minsIn < CALL_OVERRUN_MINS) return;

      const staffName = (
        c.shifts?.staff_name ||
        staff.find(u => u.id === c.shifts?.staff_id)?.full_name ||
        'UNKNOWN'
      ).toUpperCase();
      const clientName = (c.service_user_name || 'CLIENT').toUpperCase();
      const timeLabel = c.clock_in_time
        ? format(new Date(c.clock_in_time), 'HH:mm')
        : c.scheduled_time?.slice(0, 5) || '??:??';

      alerts.push({
        id:       `overrun_${c.id}`,
        type:     'CALL_OVERRUN',
        priority: 'URGENT',
        timestamp: now,
        refId:    c.id,
        lines: [
          '** URGENT — CARE CALL OVERRUN **',
          `${staffName} WITH ${clientName}`,
          `STARTED: approx ${timeLabel} HRS · ${minsIn} MINS`,
          'Staff not booked out after 50 minutes. CHECK WELFARE IMMEDIATELY.',
          ts,
        ],
      });
    } catch {}
  });

  // ── 4. LATE_SHIFT_CLOCK_OUT ────────────────────────────────────────────────
  todayShifts.forEach(s => {
    if (['cancelled', 'available_cover', 'available'].includes(s.status)) return;
    if (!s.clock_in_time) return;  // must have clocked IN
    if (s.clock_out_time) return;  // already clocked out
    if (!s.end_time) return;
    try {
      const end = parseISO(`${s.date || todayStr}T${s.end_time}`);
      const minsOverdue = differenceInMinutes(now, end);
      if (minsOverdue < LATE_CLOCK_OUT_MINS) return;
      const staffName = (s.staff_name || staff.find(u => u.id === s.staff_id)?.full_name || 'UNKNOWN').toUpperCase();

      alerts.push({
        id:       `late_clockout_${s.id}`,
        type:     'LATE_SHIFT_CLOCK_OUT',
        priority: 'HIGH',
        timestamp: now,
        refId:    s.id,
        lines: [
          '** ALERT — SHIFT NOT BOOKED OFF **',
          staffName,
          `SHIFT ENDED: ${s.end_time.slice(0, 5)} HRS · ${minsOverdue} MINS OVERDUE`,
          'Staff member has not booked off their shift. Please attempt contact.',
          ts,
        ],
      });
    } catch {}
  });

  return alerts;
}

// ── Scanline CSS ───────────────────────────────────────────────────────────────
const scanlineStyle = {
  backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.18) 2px,rgba(0,0,0,0.18) 4px)',
  backgroundSize: '100% 4px',
};

// ── Alert History (past logs from Supabase) ───────────────────────────────────
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

  // Group by log_date
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
    <div className="rounded-xl border border-slate-800 overflow-hidden" style={{ background: '#0a0a0a' }}>
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-mono text-amber-600/80 text-[10px] uppercase tracking-widest">Alert History (7 days)</span>
        <ChevronDown className={`w-3.5 h-3.5 text-amber-800 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-amber-900/30 max-h-96 overflow-y-auto">
          {isLoading && (
            <p className="font-mono text-amber-900/60 text-[10px] px-4 py-3 tracking-wider">LOADING…</p>
          )}
          {!isLoading && grouped.length === 0 && (
            <p className="font-mono text-amber-900/50 text-[10px] px-4 py-3 tracking-wider">NO LOGS IN LAST 7 DAYS</p>
          )}
          {grouped.map(([date, entries]) => {
            let displayDate = date;
            try { displayDate = format(parseISO(date), 'dd/MM/yyyy'); } catch {}
            return (
              <div key={date} className="border-b border-amber-900/20 last:border-b-0">
                <p className="font-mono text-amber-700/60 text-[9px] uppercase tracking-[0.3em] px-4 py-1.5 border-b border-amber-900/20"
                  style={{ background: '#0d0800' }}>
                  {displayDate}
                </p>
                {entries.map(log => {
                  const isUrgent = log.priority === 'URGENT';
                  let timeLabel = '';
                  try { timeLabel = format(new Date(log.triggered_at), 'HH:mm'); } catch {}
                  return (
                    <div key={log.id} className="px-4 py-2 border-b border-amber-900/10 last:border-b-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wide ${
                          isUrgent ? 'bg-red-900/40 text-red-400' : 'bg-amber-900/40 text-amber-500'
                        }`}>{log.alert_type || log.priority}</span>
                        <span className="font-mono text-amber-900/50 text-[9px]">{timeLabel}</span>
                      </div>
                      {log.title && (
                        <p className="font-mono text-amber-600/80 text-[10px] tracking-wider leading-tight">{log.title}</p>
                      )}
                      {log.body && (
                        <p className="font-mono text-amber-800/60 text-[9px] leading-tight">{log.body}</p>
                      )}
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function AlerterTab({ todayShifts = [], todayShiftCalls = [], staff = [], alerterEnabled = true }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [now, setNow] = useState(() => new Date());
  const [ackedIds, setAckedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alerter_acked') || '[]')); } catch { return new Set(); }
  });
  const [deletedIds, setDeletedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alerter_deleted') || '[]')); } catch { return new Set(); }
  });
  const [silenced, setSilenced] = useState(false);
  const [blinkOn, setBlinkOn] = useState(true);
  const clockRef = useRef(null);
  const blinkRef = useRef(null);
  const loggedIdsRef = useRef(new Set());
  const prevHasNewRef = useRef(false);

  // Refresh alert detection every 30s (tighter polling for alerter)
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(clockRef.current);
  }, []);

  // Wake lock — keep screen on while there are new unacknowledged alerts (APK)
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

  // Blink indicator at 1Hz while new alerts exist
  useEffect(() => {
    blinkRef.current = setInterval(() => setBlinkOn(p => !p), 700);
    return () => clearInterval(blinkRef.current);
  }, []);

  const allAlerts = useMemo(
    () => buildAlerts(todayShifts, todayShiftCalls, staff, todayStr, now),
    [todayShifts, todayShiftCalls, staff, todayStr, now]
  );

  const visibleAlerts = allAlerts.filter(a => !deletedIds.has(a.id));
  const newAlerts     = visibleAlerts.filter(a => !ackedIds.has(a.id));
  const hasNew        = newAlerts.length > 0;

  // Pager tone: start when new unsilenced alerts, stop otherwise
  useEffect(() => {
    if (!alerterEnabled) { stopPagerLoop(); return; }
    if (hasNew && !silenced) { startPagerLoop(); }
    else { stopPagerLoop(); }
    return () => stopPagerLoop();
  }, [hasNew, silenced, alerterEnabled]);

  // Reset silenced when a brand-new alert ID appears
  const prevNewIdsRef = useRef(new Set());
  useEffect(() => {
    const currentIds = new Set(newAlerts.map(a => a.id));
    const hasReallyNew = [...currentIds].some(id => !prevNewIdsRef.current.has(id));
    if (hasReallyNew) setSilenced(false);
    prevNewIdsRef.current = currentIds;
  }, [newAlerts]);

  // APK wake: show service worker notification when hasNew transitions false→true
  useEffect(() => {
    if (hasNew && !prevHasNewRef.current) {
      if ('Notification' in window) {
        navigator.serviceWorker?.ready.then(reg =>
          reg.showNotification('⚠️ CareCall Alerter', {
            body: `${newAlerts.length} new alert${newAlerts.length > 1 ? 's' : ''}`,
            tag: 'alerter',
            renotify: true,
            requireInteraction: true,
          })
        ).catch(() => {});
      }
    }
    prevHasNewRef.current = hasNew;
  }, [hasNew, newAlerts.length]);

  // Supabase logging — fire-and-forget for new alert IDs
  useEffect(() => {
    const orgId = getOrgId();
    if (!orgId) return;
    allAlerts.forEach(alert => {
      if (loggedIdsRef.current.has(alert.id)) return;
      loggedIdsRef.current.add(alert.id);
      const logDate = format(new Date(), 'yyyy-MM-dd');
      supabase.from('alerter_logs').insert({
        alert_id:        alert.id,
        alert_type:      alert.type,
        priority:        alert.priority,
        title:           alert.lines[0],
        body:            alert.lines.join(' | '),
        ref_id:          alert.refId,
        log_date:        logDate,
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
  }, []);

  const ackAll = useCallback(() => {
    const ids = visibleAlerts.map(a => a.id);
    setAckedIds(prev => {
      const next = new Set([...prev, ...ids]);
      try { localStorage.setItem('alerter_acked', JSON.stringify([...next])); } catch {}
      return next;
    });
    setSilenced(true);
  }, [visibleAlerts]);

  const timeStr = format(now, 'HH:mm:ss');

  if (!alerterEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <BellOff className="w-8 h-8 text-slate-700" />
        <p className="text-slate-600 text-xs text-center">Alerter is disabled.<br />Enable it in Settings.</p>
      </div>
    );
  }

  return (
    <div className="pb-32 px-3 pt-3 space-y-3">

      {/* ── Pager bezel ───────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border-4 border-slate-700 shadow-2xl shadow-black/80"
        style={{ background: '#0a0a0a' }}>

        {/* Header bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-amber-900/40"
          style={{ background: '#0f0a00' }}>
          <div className="flex items-center gap-2">
            {/* Signal bars */}
            <div className="flex items-end gap-0.5">
              {[2, 4, 6, 8].map((h, i) => (
                <div key={i} className="w-1 rounded-sm bg-amber-500/70" style={{ height: h }} />
              ))}
            </div>
            <span className="font-mono text-amber-500 text-[10px] font-bold tracking-widest">MOTOROLA</span>
          </div>
          <span className="font-mono text-amber-400 text-[11px] tracking-widest">{timeStr}</span>
          {hasNew && (
            <div className={`flex items-center gap-1 transition-opacity ${blinkOn ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_6px_2px_rgba(239,68,68,0.7)]" />
              <span className="font-mono text-red-400 text-[10px] font-bold">{newAlerts.length} NEW</span>
            </div>
          )}
          {!hasNew && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-mono text-green-500 text-[10px]">ALL CLEAR</span>
            </div>
          )}
        </div>

        {/* LCD display area */}
        <div className="relative" style={{ ...scanlineStyle, background: '#050300' }}>

          {/* Model label */}
          <div className="px-3 pt-2 pb-1 border-b border-amber-900/20">
            <p className="font-mono text-amber-600/60 text-[9px] tracking-[0.3em] uppercase">CareCall Alerter v2 · Control</p>
          </div>

          {/* No alerts */}
          {visibleAlerts.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-green-500 text-sm tracking-widest">** ALL CLEAR **</p>
              <p className="font-mono text-green-700 text-[10px] mt-2 tracking-wider">NO OUTSTANDING ALERTS</p>
              <p className="font-mono text-green-800/60 text-[9px] mt-1">{format(now, 'dd/MM/yyyy HH:mm')}</p>
            </div>
          )}

          {/* Alert messages */}
          {visibleAlerts.map((alert) => {
            const isNew  = !ackedIds.has(alert.id);
            const urgent = alert.priority === 'URGENT';
            return (
              <div key={alert.id}
                className={`border-b border-amber-900/30 ${isNew ? 'bg-amber-950/10' : 'opacity-60'}`}>
                {/* Message body */}
                <div className="px-3 pt-3 pb-2 space-y-0.5">
                  {alert.lines.map((line, li) => {
                    // Last line is the timestamp — style differently
                    const isTimestamp = li === alert.lines.length - 1;
                    return (
                      <p key={li}
                        className={`font-mono tracking-wider leading-tight ${
                          isTimestamp
                            ? 'text-amber-900/60 text-[9px] mt-1'
                            : li === 0
                              ? (urgent ? 'text-red-400 font-bold text-[11px]' : 'text-amber-400 font-bold text-[11px]')
                              : (urgent ? 'text-amber-500 text-[11px]' : 'text-amber-700 text-[11px]')
                        }`}>
                        {line}
                      </p>
                    );
                  })}
                  <p className="font-mono text-amber-900/50 text-[9px] mt-0.5 tracking-widest">
                    REF:{alert.refId?.slice(0, 8).toUpperCase()}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex gap-1.5 px-3 pb-3">
                  {isNew && !silenced && (
                    <button
                      onClick={() => { stopPagerLoop(); setSilenced(true); }}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-amber-800/50 bg-amber-950/40 text-amber-500 font-mono text-[9px] tracking-wider active:bg-amber-900/40 touch-manipulation">
                      <BellOff className="w-2.5 h-2.5" />SILENCE
                    </button>
                  )}
                  {isNew && (
                    <button
                      onClick={() => ack(alert.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-amber-700/50 bg-amber-900/30 text-amber-400 font-mono text-[9px] tracking-wider active:bg-amber-800/40 touch-manipulation">
                      <CheckCheck className="w-2.5 h-2.5" />ACK
                    </button>
                  )}
                  <button
                    onClick={() => del(alert.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded border border-red-900/40 bg-red-950/20 text-red-600 font-mono text-[9px] tracking-wider active:bg-red-900/30 touch-manipulation">
                    <Trash2 className="w-2.5 h-2.5" />DELETE
                  </button>
                  {!isNew && (
                    <span className="flex items-center gap-1 px-2 py-1 text-amber-900/60 font-mono text-[9px] tracking-wider">
                      <CheckCheck className="w-2.5 h-2.5" />ACKNOWLEDGED
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Silence all / Ack all strip */}
          {hasNew && visibleAlerts.length > 1 && (
            <div className="px-3 py-2 border-t border-amber-900/30 flex gap-2">
              <button
                onClick={() => { stopPagerLoop(); setSilenced(true); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border border-amber-800/40 bg-amber-950/30 text-amber-600 font-mono text-[10px] tracking-wider active:bg-amber-900/30 touch-manipulation">
                <BellOff className="w-3 h-3" />SILENCE ALL
              </button>
              <button
                onClick={ackAll}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border border-amber-700/40 bg-amber-900/20 text-amber-500 font-mono text-[10px] tracking-wider active:bg-amber-800/30 touch-manipulation">
                <CheckCheck className="w-3 h-3" />ACK ALL
              </button>
            </div>
          )}

          {/* Standby footer */}
          <div className="px-3 py-1.5 flex items-center justify-between border-t border-amber-900/20">
            <span className="font-mono text-amber-900/50 text-[9px] tracking-widest">STANDBY</span>
            <div className="flex items-center gap-1">
              <Wifi className="w-2.5 h-2.5 text-amber-900/40" />
              <span className="font-mono text-amber-900/40 text-[9px]">LIVE</span>
            </div>
          </div>
        </div>

        {/* Bezel bottom strip */}
        <div className="h-3 flex items-center justify-center gap-1"
          style={{ background: '#080808' }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-slate-700/60" />
          ))}
        </div>
      </div>

      {/* ── Status summary under pager ─────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 space-y-1">
        <p className="font-mono text-slate-500 text-[9px] uppercase tracking-widest">Alert Summary</p>
        <div className="grid grid-cols-3 gap-2 mt-1">
          <div className="text-center">
            <p className="font-mono text-amber-400 text-lg font-bold">{visibleAlerts.length}</p>
            <p className="font-mono text-slate-600 text-[9px] tracking-wider">TOTAL</p>
          </div>
          <div className="text-center">
            <p className={`font-mono text-lg font-bold ${hasNew ? 'text-red-400' : 'text-slate-600'}`}>{newAlerts.length}</p>
            <p className="font-mono text-slate-600 text-[9px] tracking-wider">UNREAD</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-slate-500 text-lg font-bold">{visibleAlerts.length - newAlerts.length}</p>
            <p className="font-mono text-slate-600 text-[9px] tracking-wider">ACK'D</p>
          </div>
        </div>
      </div>

      {/* ── Alert History (scrollable past logs) ──────────────────────────── */}
      <AlertHistory />

      {/* ── Future: Emergency message from family ──────────────────────────── */}
      <div className="rounded-xl border border-slate-800/40 bg-slate-900/30 px-4 py-3">
        <p className="font-mono text-slate-700 text-[9px] uppercase tracking-widest">Emergency Message (Family)</p>
        <p className="font-mono text-slate-800 text-[9px] mt-1">— Coming soon: families can page control direct from the website —</p>
      </div>

    </div>
  );
}

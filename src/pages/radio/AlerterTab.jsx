import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { BellOff, CheckCheck, Trash2, BellRing, Wifi } from 'lucide-react';

// ── Pager tone (UK Motorola-style: 4 beeps at 2400Hz then 2s silence) ─────────
let _pagerCtx = null;
let _pagerTimer = null;
let _pagerActive = false;

function getPagerCtx() {
  try {
    if (!_pagerCtx || _pagerCtx.state === 'closed') {
      _pagerCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_pagerCtx.state === 'suspended') _pagerCtx.resume().catch(() => {});
    return _pagerCtx;
  } catch { return null; }
}

function playPagerBurst() {
  const ctx = getPagerCtx();
  if (!ctx) return;
  try {
    let t = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 2400;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.7, t + 0.01);
      gain.gain.setValueAtTime(0.7, t + 0.07);
      gain.gain.linearRampToValueAtTime(0, t + 0.09);
      osc.start(t); osc.stop(t + 0.09);
      t += 0.16;
    }
  } catch {}
}

function startPagerLoop() {
  if (_pagerActive) return;
  _pagerActive = true;
  playPagerBurst();
  _pagerTimer = setInterval(playPagerBurst, 3500);
}

function stopPagerLoop() {
  _pagerActive = false;
  if (_pagerTimer) { clearInterval(_pagerTimer); _pagerTimer = null; }
}

// ── Alert generation ──────────────────────────────────────────────────────────
const LATE_CLOCK_IN_MINS   = 15;
const LATE_CALL_MINS       = 15;
const CALL_OVERRUN_MINS    = 45;

function buildAlerts(todayShifts, todayShiftCalls, staff, todayStr, now) {
  const alerts = [];

  // 1. Late clock-in
  todayShifts.forEach(s => {
    if (['in_progress', 'completed', 'cancelled'].includes(s.status)) return;
    if (s.clock_in_time) return;
    if (!s.start_time) return;
    try {
      const start = parseISO(`${s.date || todayStr}T${s.start_time}`);
      const minsLate = differenceInMinutes(now, start);
      if (minsLate < LATE_CLOCK_IN_MINS) return;
      const staffName = s.staff_name || staff.find(u => u.id === s.staff_id)?.full_name || 'UNKNOWN';
      alerts.push({
        id:        `late_clockin_${s.id}`,
        type:      'LATE_CLOCK_IN',
        priority:  'HIGH',
        timestamp: now,
        refId:     s.id,
        lines: [
          '** ALERT — STAFF LATE CLOCK IN **',
          `${staffName.toUpperCase()}`,
          `SHIFT START: ${s.start_time.slice(0,5)} HRS`,
          `${minsLate} MINS OVERDUE — NO CLOCK IN RECORDED`,
        ],
      });
    } catch {}
  });

  // 2. Late client call check-in
  todayShiftCalls.forEach(c => {
    if (c.status !== 'pending') return;
    if (!c.scheduled_time) return;
    try {
      const due = parseISO(`${todayStr}T${c.scheduled_time}`);
      const minsLate = differenceInMinutes(now, due);
      if (minsLate < LATE_CALL_MINS) return;
      const staffName =
        c.shifts?.staff_name ||
        staff.find(u => u.id === c.shifts?.staff_id)?.full_name ||
        'UNKNOWN';
      alerts.push({
        id:        `late_call_${c.id}`,
        type:      'LATE_CALL_CHECKIN',
        priority:  'HIGH',
        timestamp: now,
        refId:     c.id,
        lines: [
          '** ALERT — LATE CLIENT CHECK-IN **',
          `${staffName.toUpperCase()} → ${(c.service_user_name || 'CLIENT').toUpperCase()}`,
          `CALL DUE: ${c.scheduled_time.slice(0,5)} HRS`,
          `${minsLate} MINS OVERDUE — NOT YET STARTED`,
        ],
      });
    } catch {}
  });

  // 3. Call overrun 45+ mins
  todayShiftCalls.forEach(c => {
    if (c.status !== 'in_progress') return;
    if (!c.scheduled_time) return;
    try {
      const due = parseISO(`${todayStr}T${c.scheduled_time}`);
      const minsIn = differenceInMinutes(now, due);
      if (minsIn < CALL_OVERRUN_MINS) return;
      const staffName =
        c.shifts?.staff_name ||
        staff.find(u => u.id === c.shifts?.staff_id)?.full_name ||
        'UNKNOWN';
      alerts.push({
        id:        `overrun_${c.id}`,
        type:      'CALL_OVERRUN',
        priority:  'URGENT',
        timestamp: now,
        refId:     c.id,
        lines: [
          '** URGENT — CALL OVERRUN >45 MINS **',
          `${staffName.toUpperCase()} WITH ${(c.service_user_name || 'CLIENT').toUpperCase()}`,
          `STARTED APPROX: ${c.scheduled_time.slice(0,5)} HRS`,
          'CHECK WELFARE IMMEDIATELY',
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function AlerterTab({ todayShifts = [], todayShiftCalls = [], staff = [], alerterEnabled = true }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const [now, setNow] = useState(() => new Date());
  const [ackedIds,    setAckedIds]    = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alerter_acked') || '[]')); } catch { return new Set(); }
  });
  const [deletedIds,  setDeletedIds]  = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('alerter_deleted') || '[]')); } catch { return new Set(); }
  });
  const [silenced, setSilenced] = useState(false);
  const [blinkOn,  setBlinkOn]  = useState(true);
  const clockRef  = useRef(null);
  const blinkRef  = useRef(null);

  // Refresh alert detection every 60s
  useEffect(() => {
    clockRef.current = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(clockRef.current);
  }, []);

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
            <p className="font-mono text-amber-600/60 text-[9px] tracking-[0.3em] uppercase">CareCall Alerter v1 · Control</p>
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
          {visibleAlerts.map((alert, idx) => {
            const isNew  = !ackedIds.has(alert.id);
            const urgent = alert.priority === 'URGENT';
            return (
              <div key={alert.id}
                className={`border-b border-amber-900/30 ${isNew ? 'bg-amber-950/10' : 'opacity-60'}`}>
                {/* Message body */}
                <div className="px-3 pt-3 pb-2 space-y-0.5">
                  {alert.lines.map((line, li) => (
                    <p key={li}
                      className={`font-mono text-[11px] tracking-wider leading-tight ${
                        li === 0
                          ? (urgent ? 'text-amber-300 font-bold' : 'text-amber-400 font-bold')
                          : (urgent ? 'text-amber-600' : 'text-amber-700')
                      }`}>
                      {line}
                    </p>
                  ))}
                  <p className="font-mono text-amber-900/70 text-[9px] mt-1 tracking-widest">
                    DETECTED: {format(alert.timestamp, 'HH:mm')} · REF:{alert.refId?.slice(0,8).toUpperCase()}
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

      {/* ── Future: Emergency message from family ──────────────────────────── */}
      <div className="rounded-xl border border-slate-800/40 bg-slate-900/30 px-4 py-3">
        <p className="font-mono text-slate-700 text-[9px] uppercase tracking-widest">Emergency Message (Family)</p>
        <p className="font-mono text-slate-800 text-[9px] mt-1">— Coming soon: families can page control direct from the website —</p>
      </div>

    </div>
  );
}

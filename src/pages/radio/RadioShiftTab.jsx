import React, { useState, useMemo } from 'react';
import { AlertTriangle, ChevronDown, CheckCircle, Clock, XCircle, FileText, User, ArrowRight } from 'lucide-react';
import { format, isPast, parseISO, formatDistanceToNow } from 'date-fns';

const CALL_STATUS = {
  completed:   { dot: 'bg-green-500',  text: 'text-green-400',  label: 'Complete',     border: 'border-l-green-600' },
  in_progress: { dot: 'bg-amber-400',  text: 'text-amber-400',  label: 'In Progress',  border: 'border-l-amber-500' },
  started:     { dot: 'bg-amber-400',  text: 'text-amber-400',  label: 'Started',      border: 'border-l-amber-500' },
  pending:     { dot: 'bg-red-500',    text: 'text-red-400',    label: 'Not Started',  border: 'border-l-red-700' },
  missed:      { dot: 'bg-red-600',    text: 'text-red-400',    label: 'Missed',       border: 'border-l-red-600' },
  not_at_home: { dot: 'bg-orange-500', text: 'text-orange-400', label: 'Not at Home',  border: 'border-l-orange-600' },
  log_missing: { dot: 'bg-amber-400',  text: 'text-amber-400',  label: 'Log Missing',  border: 'border-l-amber-500' },
};

function effectiveStatus(call) {
  if (call.status === 'completed' && call.log_required && !call.care_log_id) return 'log_missing';
  return call.status;
}

export default function RadioShiftTab({ todayShiftCalls, todayShifts, rotaAreas, staff = [], navigate, createPageUrl, isControlDevice = false }) {
  const [expandedAreas, setExpandedAreas] = useState(() => new Set(['all']));
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const getStaffName = (call) =>
    call.shifts?.staff_name ||
    staff.find(s => s.id === call.shifts?.staff_id)?.full_name ||
    '—';

  const getShiftStaffName = (shift) =>
    shift.staff_name ||
    staff.find(s => s.id === shift.staff_id)?.full_name ||
    shift.staff_id?.slice(0, 8) || '—';

  const getAreaName = (areaId) =>
    rotaAreas.find(a => a.id === areaId)?.name || null;

  const toggle = (id) => setExpandedAreas(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  // ── Alerts ──────────────────────────────────────────────────────────────────
  const missedCalls = todayShiftCalls.filter(c => c.status === 'missed');

  const missingLogs = todayShiftCalls.filter(c =>
    c.status === 'completed' && c.log_required && !c.care_log_id
  );

  const notClockedIn = todayShifts.filter(s => {
    // Exclude if actively in progress, completed, or cancelled
    if (['in_progress', 'completed', 'cancelled'].includes(s.status)) return false;
    // Exclude if a clock-in time is recorded
    if (s.clock_in_time) return false;
    // Only alert when start_time is known and in the past (avoid midnight false positives)
    if (!s.start_time) return false;
    try {
      const start = parseISO(`${s.date || todayStr}T${s.start_time}`);
      return isPast(start);
    } catch { return false; }
  });

  const totalAlerts = missedCalls.length + missingLogs.length + notClockedIn.length;

  // ── Group calls by area ───────────────────────────────────────────────────
  const areaGroups = useMemo(() => {
    const map = {};
    todayShiftCalls.forEach(call => {
      const areaId = call.shifts?.rota_area_id || 'unassigned';
      if (!map[areaId]) map[areaId] = { areaId, calls: [] };
      map[areaId].calls.push(call);
    });
    return Object.values(map).map(g => {
      const area = rotaAreas.find(a => a.id === g.areaId);
      return {
        ...g,
        areaName: area?.name || (g.areaId === 'unassigned' ? 'Unassigned' : 'Area'),
      };
    }).sort((a, b) => a.areaName.localeCompare(b.areaName));
  }, [todayShiftCalls, rotaAreas]);

  const groupSummary = (calls) => {
    const total = calls.length;
    const done  = calls.filter(c => effectiveStatus(c) === 'completed').length;
    const issues = calls.filter(c => ['missed', 'log_missing'].includes(effectiveStatus(c))).length;
    const active = calls.filter(c => ['in_progress', 'started'].includes(effectiveStatus(c))).length;
    return { total, done, issues, active };
  };

  return (
    <div className="pb-32">
      {/* ── Alerts ── */}
      <div className="mx-4 mt-4">
        {totalAlerts > 0 ? (
          <div className="rounded-2xl border border-red-800/60 bg-red-950/30 overflow-hidden">
            <div className="px-4 py-2.5 bg-red-900/40 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-red-300 text-xs font-black uppercase tracking-widest flex-1">
                {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''} Requiring Attention
              </span>
            </div>
            <div className="divide-y divide-red-900/30">
              {missedCalls.map(c => {
                const areaName = getAreaName(c.shifts?.rota_area_id);
                const staffName = getStaffName(c);
                const Tag = isControlDevice ? 'div' : 'button';
                return (
                  <Tag key={c.id}
                    {...(!isControlDevice && { onClick: () => navigate(`${createPageUrl('Rota')}?focus=call&id=${c.id}&shiftId=${c.shift_id}`) })}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left active:bg-red-900/30 touch-manipulation">
                    <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold">Missed call</p>
                      <p className="text-red-300 text-xs truncate">{c.service_user_name}</p>
                      <p className="text-red-400/70 text-[10px] mt-0.5">
                        {staffName}{areaName ? ` · ${areaName}` : ''} · scheduled {c.scheduled_time?.slice(0, 5) || '—'}
                      </p>
                    </div>
                    {!isControlDevice && <ArrowRight className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />}
                  </Tag>
                );
              })}
              {missingLogs.map(c => {
                const areaName = getAreaName(c.shifts?.rota_area_id);
                const staffName = getStaffName(c);
                const Tag = isControlDevice ? 'div' : 'button';
                return (
                  <Tag key={c.id}
                    {...(!isControlDevice && { onClick: () => navigate(`${createPageUrl('Rota')}?focus=call&id=${c.id}&shiftId=${c.shift_id}`) })}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left active:bg-red-900/30 touch-manipulation">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold">Care log missing</p>
                      <p className="text-amber-300 text-xs truncate">{c.service_user_name}</p>
                      <p className="text-amber-400/70 text-[10px] mt-0.5">
                        {staffName}{areaName ? ` · ${areaName}` : ''} · call marked complete, log not submitted
                      </p>
                    </div>
                    {!isControlDevice && <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />}
                  </Tag>
                );
              })}
              {notClockedIn.map(s => {
                const staffName = getShiftStaffName(s);
                const areaName = getAreaName(s.rota_area_id || s.area_id);
                let overdueStr = '';
                try {
                  const startDt = parseISO(`${s.date || todayStr}T${s.start_time}`);
                  overdueStr = formatDistanceToNow(startDt, { addSuffix: false }) + ' overdue';
                } catch {}
                const Tag = isControlDevice ? 'div' : 'button';
                return (
                  <Tag key={s.id}
                    {...(!isControlDevice && { onClick: () => navigate(`${createPageUrl('Rota')}?focus=shift&id=${s.id}`) })}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left active:bg-red-900/30 touch-manipulation">
                    <Clock className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-bold">Not clocked in</p>
                      <p className="text-orange-300 text-xs truncate">{staffName}</p>
                      <p className="text-orange-400/70 text-[10px] mt-0.5">
                        Started {s.start_time?.slice(0, 5)}{areaName ? ` · ${areaName}` : ''}{overdueStr ? ` · ${overdueStr}` : ''}
                      </p>
                    </div>
                    {!isControlDevice && <ArrowRight className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />}
                  </Tag>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-green-800/40 bg-green-950/20 px-4 py-3 flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <p className="text-green-400 text-xs font-semibold">All clear — no outstanding alerts for today</p>
          </div>
        )}
      </div>

      {/* ── Calls by area ── */}
      <div className="mx-4 mt-4 mb-2">
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Today's Calls by Area</p>
      </div>

      {areaGroups.length === 0 && (
        <p className="text-slate-600 text-xs text-center mt-6 px-4">No calls scheduled for today</p>
      )}

      {areaGroups.map(group => {
        const isExp = expandedAreas.has(group.areaId);
        const { total, done, issues, active } = groupSummary(group.calls);
        const allDone   = done === total && total > 0;
        const hasIssues = issues > 0;
        const headerDot = allDone ? 'bg-green-500' : hasIssues ? 'bg-red-500' : active > 0 ? 'bg-amber-400' : 'bg-slate-600';

        return (
          <div key={group.areaId} className="mx-4 mb-3 rounded-2xl border border-slate-700/60 bg-slate-900/80 overflow-hidden">
            <button onClick={() => toggle(group.areaId)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-slate-800/60 touch-manipulation">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${headerDot}`} />
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-bold truncate">{group.areaName}</p>
                <p className="text-slate-500 text-xs">
                  {done}/{total} complete
                  {issues > 0 ? ` · ${issues} issue${issues !== 1 ? 's' : ''}` : ''}
                  {active > 0 ? ` · ${active} active` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {hasIssues && <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">{issues}</span>}
                <ChevronDown className={`w-4 h-4 text-slate-600 transition-transform ${isExp ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isExp && (
              <div className="border-t border-slate-800">
                {group.calls.map(call => {
                  const es   = effectiveStatus(call);
                  const cfg  = CALL_STATUS[es] || CALL_STATUS.pending;
                  return (
                    <div key={call.id}
                      className={`flex items-center gap-3 px-4 py-2.5 border-b border-slate-800/60 border-l-2 ${cfg.border}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">{call.service_user_name || 'Unknown'}</p>
                        <p className="text-slate-500 text-[10px]">
                          {getStaffName(call)} · {call.scheduled_time?.slice(0, 5) || '—'}
                          {call.log_required && !call.care_log_id && call.status === 'completed'
                            ? ' · ⚠ log missing' : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold shrink-0 ${cfg.text}`}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

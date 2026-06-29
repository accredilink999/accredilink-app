import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId } from '@/lib/orgContext';
import { startOfMonth, subMonths, parseISO, format } from 'date-fns';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

function buildMonthRange(startDate) {
  const today = new Date();
  const earliest = startDate
    ? (new Date(startDate) > subMonths(today, 12) ? new Date(startDate) : subMonths(today, 12))
    : subMonths(today, 12);
  const months = [];
  let cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const thisMonthStart = startOfMonth(today);
  while (cursor < thisMonthStart) {
    months.push(`${cursor.getFullYear()}-${cursor.getMonth()}`);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  return months;
}

function monthKey(dateStr) {
  const d = parseISO(dateStr);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

export default function StaffStarRating({ userId, startDate, showBreakdown = false }) {
  const flashedRef = useRef(false);

  const { data: feedbackRows = [] } = useQuery({
    queryKey: ['starRating_feedback', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_feedback')
        .select('id, created_at')
        .eq('created_by', userId);
      if (error) { console.warn('starRating feedback:', error.message); return []; }
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: awardRows = [] } = useQuery({
    queryKey: ['starRating_awards', userId],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase.from('staff_awards').select('id, created_at').eq('recipient_id', userId);
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q;
      if (error) { console.warn('starRating awards:', error.message); return []; }
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: sickLeaveRows = [] } = useQuery({
    queryKey: ['starRating_sick', userId],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase
        .from('leave_requests')
        .select('id, start_date')
        .eq('staff_id', userId)
        .eq('leave_type', 'sick_leave')
        .eq('status', 'approved');
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q;
      if (error) { console.warn('starRating sick:', error.message); return []; }
      return data || [];
    },
    enabled: !!userId,
  });

  // Fetch this user's shift calls for punctuality checks (last 13 months)
  const { data: callData = { late: new Set(), lateBookOn: new Set() } } = useQuery({
    queryKey: ['starRating_calls', userId],
    queryFn: async () => {
      const since = format(subMonths(new Date(), 13), 'yyyy-MM-dd');
      const { data: shifts } = await supabase
        .from('shifts')
        .select('id, date')
        .eq('staff_id', userId)
        .gte('date', since);
      if (!shifts?.length) return { late: new Set(), lateBookOn: new Set() };

      const shiftDateMap = Object.fromEntries(shifts.map(s => [s.id, s.date]));
      const shiftIds = shifts.map(s => s.id);

      const { data: calls } = await supabase
        .from('shift_calls')
        .select('id, shift_id, clock_in_time, call_time, scheduled_time')
        .in('shift_id', shiftIds)
        .not('clock_in_time', 'is', null);

      if (!calls?.length) return { late: new Set(), lateBookOn: new Set() };

      const lateMonths = new Set();
      const byShift = {};
      calls.forEach(c => {
        const scheduled = new Date(c.call_time || c.scheduled_time);
        const actual = new Date(c.clock_in_time);
        if ((actual - scheduled) > FIFTEEN_MIN_MS) {
          const date = shiftDateMap[c.shift_id];
          if (date) lateMonths.add(monthKey(date));
        }
        if (!byShift[c.shift_id]) byShift[c.shift_id] = [];
        byShift[c.shift_id].push(c);
      });

      const lateBookOnMonths = new Set();
      Object.entries(byShift).forEach(([shiftId, shiftCalls]) => {
        shiftCalls.sort((a, b) => new Date(a.call_time || a.scheduled_time) - new Date(b.call_time || b.scheduled_time));
        const first = shiftCalls[0];
        const scheduled = new Date(first.call_time || first.scheduled_time);
        const actual = new Date(first.clock_in_time);
        if ((actual - scheduled) > FIFTEEN_MIN_MS) {
          const date = shiftDateMap[shiftId];
          if (date) lateBookOnMonths.add(monthKey(date));
        }
      });

      return { late: lateMonths, lateBookOn: lateBookOnMonths };
    },
    enabled: !!userId,
  });

  const months = buildMonthRange(startDate);
  const sickMonths = new Set(sickLeaveRows.filter(r => r.start_date).map(r => monthKey(r.start_date)));

  let noSickMonths = 0;
  let noLateCheckinMonths = 0;
  let noLateBookOnMonths = 0;
  months.forEach(m => {
    if (!sickMonths.has(m)) noSickMonths++;
    if (!callData.late.has(m)) noLateCheckinMonths++;
    if (!callData.lateBookOn.has(m)) noLateBookOnMonths++;
  });

  const feedbackCount = feedbackRows.length;
  const awardCount = awardRows.length;
  const total = feedbackCount + awardCount + noSickMonths * 2 + noLateCheckinMonths + noLateBookOnMonths;

  const storageKey = `cc_stars_${userId}`;
  const [flashing, setFlashing] = React.useState(false);

  useEffect(() => {
    if (!userId || flashedRef.current) return;
    const prev = parseInt(localStorage.getItem(storageKey) || '0', 10);
    if (total > 0 && total >= prev * 2 && prev > 0) {
      setFlashing(true);
      setTimeout(() => setFlashing(false), 2500);
    }
    if (total > 0) {
      localStorage.setItem(storageKey, String(total));
      flashedRef.current = true;
    }
  }, [total, userId, storageKey]);

  const visibleStars = Math.min(total, 5);
  const extra = total > 5 ? total - 5 : 0;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: visibleStars }).map((_, i) => (
          <span
            key={i}
            className={`text-xl ${flashing ? (i % 2 === 0 ? 'animate-bounce text-amber-400' : 'animate-pulse text-red-500') : 'text-amber-400'}`}
          >
            ⭐
          </span>
        ))}
        {extra > 0 && (
          <span className="text-sm font-semibold text-amber-600 ml-1">+{extra}</span>
        )}
        {total === 0 && (
          <span className="text-slate-400 text-sm">No stars yet</span>
        )}
      </div>
      <p className="text-xs font-semibold text-slate-600">{total} Star{total !== 1 ? 's' : ''}</p>
      {showBreakdown && (
        <p className="text-[11px] text-slate-400 text-center">
          {feedbackCount} feedback · {awardCount} awards · {noSickMonths * 2} no-sick · {noLateBookOnMonths} book-on · {noLateCheckinMonths} check-in
        </p>
      )}
    </div>
  );
}

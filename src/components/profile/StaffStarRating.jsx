import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId } from '@/lib/orgContext';
import { startOfMonth, subMonths, parseISO } from 'date-fns';

function getCleanMonthCount(sickLeaveRows, startDate) {
  const today = new Date();
  const lookbackStart = startDate ? new Date(startDate) : subMonths(today, 12);
  const earliest = lookbackStart > subMonths(today, 12) ? lookbackStart : subMonths(today, 12);

  const sickSet = new Set();
  sickLeaveRows.forEach(row => {
    if (row.start_date) {
      const d = parseISO(row.start_date);
      sickSet.add(`${d.getFullYear()}-${d.getMonth()}`);
    }
  });

  let cleanCount = 0;
  let cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const thisMonthStart = startOfMonth(today);

  while (cursor < thisMonthStart) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
    if (!sickSet.has(key)) cleanCount++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return cleanCount;
}

export default function StaffStarRating({ userId, startDate, showBreakdown = false }) {
  const flashedRef = useRef(false);

  const { data: feedbackRows = [] } = useQuery({
    queryKey: ['starRating_feedback', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_feedback')
        .select('id, created_at, created_by')
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
      let q = supabase.from('staff_awards').select('id, created_at, recipient_id').eq('recipient_id', userId);
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
        .select('id, start_date, staff_id')
        .eq('staff_id', userId)
        .eq('leave_type', 'sick_leave')
        .eq('status', 'approved');
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q;
      if (error) { console.warn('starRating sick leave:', error.message); return []; }
      return data || [];
    },
    enabled: !!userId,
  });

  const feedbackCount = feedbackRows.length;
  const awardCount = awardRows.length;
  const cleanMonths = getCleanMonthCount(sickLeaveRows, startDate);
  // TODO: Add +1 star per calendar month with NO late shift book-ons (field TBD)
  // TODO: Add +1 star per calendar month with NO late call check-ins (shift_calls where clock_in_time > call_time + 15min)
  const total = feedbackCount + awardCount + cleanMonths * 2;

  const storageKey = `cc_stars_${userId}`;
  const [flashing, setFlashing] = React.useState(false);

  useEffect(() => {
    if (!userId || flashedRef.current) return;
    const prev = parseInt(localStorage.getItem(storageKey) || '0', 10);
    if (total > 0 && total >= prev * 2 && prev > 0) {
      setFlashing(true);
      setTimeout(() => setFlashing(false), 2000);
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
          <span className="text-sm font-semibold text-amber-600 ml-1">+{extra} more</span>
        )}
        {total === 0 && (
          <span className="text-slate-400 text-sm">No stars yet</span>
        )}
      </div>
      <p className="text-xs font-semibold text-slate-600">{total} Star{total !== 1 ? 's' : ''}</p>
      {showBreakdown && (
        <p className="text-[11px] text-slate-400">
          {feedbackCount} feedback · {awardCount} awards · {cleanMonths} attendance
        </p>
      )}
    </div>
  );
}

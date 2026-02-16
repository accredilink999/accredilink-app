/**
 * ActiveShiftAutoOpen
 *
 * On app start, checks if the current user has a shift today
 * (clocked in or scheduled — booked on or not).
 * If found, navigates directly to the Rota page and auto-opens
 * the ShiftDetailModal for that shift.
 *
 * Uses sessionStorage so it only triggers once per browser session —
 * if the user dismisses it, it won't reappear until they close and reopen the app.
 */

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShiftApi } from '@/api/rotaApi';
import { createPageUrl } from '@/utils';

const SESSION_KEY = 'activeShiftAutoOpenDismissed';

export default function ActiveShiftAutoOpen({ userId }) {
  const navigate = useNavigate();
  const hasChecked = useRef(false);

  const today = new Date().toISOString().split('T')[0];

  // Fetch this user's shifts for today
  const { data: todayShifts = [] } = useQuery({
    queryKey: ['activeShiftAutoOpen', userId, today],
    queryFn: () => ShiftApi.filter({ staff_id: userId, date: today }),
    enabled: !!userId,
    staleTime: 60000,
  });

  useEffect(() => {
    if (hasChecked.current || todayShifts.length === 0) return;
    hasChecked.current = true;

    // Don't auto-navigate if already dismissed this session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    // Priority 1: shift already clocked in (in_progress)
    let match = todayShifts.find(s => s.status === 'in_progress');

    // Priority 2: any scheduled shift today
    if (!match) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Prefer the shift closest to the current time
      match = todayShifts
        .filter(s => s.status === 'scheduled')
        .sort((a, b) => {
          if (!a.start_time || !b.start_time) return 0;
          const [ah, am] = a.start_time.split(':').map(Number);
          const [bh, bm] = b.start_time.split(':').map(Number);
          // Sort by distance from current time
          return Math.abs((ah * 60 + am) - currentMinutes) - Math.abs((bh * 60 + bm) - currentMinutes);
        })[0];
    }

    if (match) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      navigate(createPageUrl('Rota') + `?autoShift=${match.id}&filter=myshifts`);
    }
  }, [todayShifts, navigate]);

  return null;
}

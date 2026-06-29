import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId } from '@/lib/orgContext';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO, isWithinInterval } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import { Trophy } from 'lucide-react';

const FILTERS = ['All Time', 'This Month', 'Today'];

function getCleanMonthsAllTime(sickRows, staffId, startDate) {
  const today = new Date();
  const lookbackStart = startDate ? new Date(startDate) : new Date(today.getFullYear() - 1, today.getMonth(), 1);
  const earliest = lookbackStart > new Date(today.getFullYear() - 1, today.getMonth(), 1)
    ? lookbackStart
    : new Date(today.getFullYear() - 1, today.getMonth(), 1);

  const sickSet = new Set();
  sickRows
    .filter(r => r.staff_id === staffId)
    .forEach(r => {
      if (r.start_date) {
        const d = parseISO(r.start_date);
        sickSet.add(`${d.getFullYear()}-${d.getMonth()}`);
      }
    });

  let cleanCount = 0;
  let cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  while (cursor < thisMonthStart) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
    if (!sickSet.has(key)) cleanCount++;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  return cleanCount;
}

function isThisMonthClean(sickRows, staffId) {
  const today = new Date();
  const monthKey = `${today.getFullYear()}-${today.getMonth()}`;
  return !sickRows.some(r => {
    if (r.staff_id !== staffId || !r.start_date) return false;
    const d = parseISO(r.start_date);
    return `${d.getFullYear()}-${d.getMonth()}` === monthKey;
  });
}

const RANK_STYLES = [
  'bg-amber-400 text-white',
  'bg-slate-300 text-slate-700',
  'bg-orange-300 text-orange-800',
];

export default function StaffLeaderboard() {
  const [filter, setFilter] = useState('All Time');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: staffList = [], isLoading: staffLoading } = useQuery({
    queryKey: ['leaderboardStaff'],
    queryFn: () => base44.entities.User.list('full_name', 500),
  });

  const { data: feedbackRows = [], isLoading: fbLoading } = useQuery({
    queryKey: ['leaderboardFeedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_feedback')
        .select('id, created_by, created_at');
      if (error) { console.warn('leaderboard feedback:', error.message); return []; }
      return data || [];
    },
  });

  const { data: awardRows = [], isLoading: awLoading } = useQuery({
    queryKey: ['leaderboardAwards'],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase.from('staff_awards').select('id, recipient_id, created_at');
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q;
      if (error) { console.warn('leaderboard awards:', error.message); return []; }
      return data || [];
    },
  });

  const { data: sickRows = [], isLoading: sickLoading } = useQuery({
    queryKey: ['leaderboardSick'],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase
        .from('leave_requests')
        .select('id, staff_id, start_date')
        .eq('leave_type', 'sick_leave')
        .eq('status', 'approved');
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q;
      if (error) { console.warn('leaderboard sick:', error.message); return []; }
      return data || [];
    },
  });

  const isLoading = staffLoading || fbLoading || awLoading || sickLoading;

  const today = new Date();
  const monthInterval = { start: startOfMonth(today), end: endOfMonth(today) };
  const dayInterval = { start: startOfDay(today), end: endOfDay(today) };

  const ranked = useMemo(() => {
    return staffList
      .map(staff => {
        const sid = staff.id;

        const fbAll = feedbackRows.filter(r => r.created_by === sid);
        const awAll = awardRows.filter(r => r.recipient_id === sid);

        let feedbackCount = 0;
        let awardCount = 0;
        let attendanceStars = 0;

        if (filter === 'All Time') {
          feedbackCount = fbAll.length;
          awardCount = awAll.length;
          const cleanMonths = getCleanMonthsAllTime(sickRows, sid, staff.start_date);
          attendanceStars = cleanMonths * 2;
        } else if (filter === 'This Month') {
          feedbackCount = fbAll.filter(r => isWithinInterval(new Date(r.created_at), monthInterval)).length;
          awardCount = awAll.filter(r => isWithinInterval(new Date(r.created_at), monthInterval)).length;
          attendanceStars = isThisMonthClean(sickRows, sid) ? 2 : 0;
        } else {
          feedbackCount = fbAll.filter(r => isWithinInterval(new Date(r.created_at), dayInterval)).length;
          awardCount = awAll.filter(r => isWithinInterval(new Date(r.created_at), dayInterval)).length;
          attendanceStars = 0;
        }

        const total = feedbackCount + awardCount + attendanceStars;
        return { staff, feedbackCount, awardCount, attendanceStars, total };
      })
      .filter(e => e.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [staffList, feedbackRows, awardRows, sickRows, filter]);

  return (
    <div className="max-w-2xl mx-auto pb-8 space-y-4">
      <PageHeader
        title="Star Leaderboard"
        icon={Trophy}
        subtitle="Staff recognition rankings"
      />

      <div className="flex gap-2 justify-center">
        {FILTERS.map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={filter === f ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500' : ''}
          >
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
        </div>
      ) : ranked.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No stars earned yet</p>
          <p className="text-slate-400 text-sm mt-1">Stars appear here once staff earn them</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {ranked.map((entry, idx) => {
            const isMe = entry.staff.id === currentUser?.id;
            const isTop3 = idx < 3;
            const rankStyle = RANK_STYLES[idx] || 'bg-slate-100 text-slate-500';
            const name = entry.staff.staff_full_name || entry.staff.full_name || entry.staff.email || 'Unknown';

            return (
              <Card
                key={entry.staff.id}
                className={`p-3 sm:p-4 border transition-all ${
                  isMe
                    ? 'border-amber-400 bg-amber-50 shadow-md'
                    : isTop3
                    ? 'border-slate-200 bg-white shadow-sm'
                    : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${rankStyle}`}>
                    {idx + 1}
                  </div>

                  <Avatar
                    name={name}
                    src={entry.staff.photo_url}
                    size="sm"
                    className="flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className={`text-sm font-semibold truncate ${isMe ? 'text-amber-700' : 'text-slate-900'}`}>
                        {name}
                      </p>
                      {isMe && (
                        <span className="text-[10px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {entry.feedbackCount} feedback · {entry.awardCount} awards · {entry.attendanceStars} attendance
                    </p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-base">⭐</span>
                    <span className={`text-sm font-bold ${isTop3 ? 'text-amber-600' : 'text-slate-600'}`}>
                      ×{entry.total}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

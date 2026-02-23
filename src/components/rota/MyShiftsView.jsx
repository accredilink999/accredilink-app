import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { supabase } from '@/api/supabaseClient';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, addDays, isSameDay } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EmptyState from '@/components/ui/EmptyState';
import Avatar from '@/components/ui/Avatar';
import StatusBadge from '@/components/ui/StatusBadge';
import { 
  Calendar,
  Clock,
  MapPin,
  Heart,
  ChevronRight
} from 'lucide-react';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-green-100 text-green-700',
  completed: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-red-100 text-red-700'
};

export default function MyShiftsView({ currentDate, userId, view, onShiftClick, selectedAreaId }) {
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['myShifts', userId, selectedAreaId],
    queryFn: () => {
      const filterQuery = selectedAreaId 
        ? { staff_id: userId, rota_area_id: selectedAreaId }
        : { staff_id: userId };
      return ShiftApi.filter(filterQuery, '-date');
    },
    enabled: !!userId,
  });

  const { data: allCalls = [] } = useQuery({
    queryKey: ['shift-calls', userId],
    queryFn: async () => {
      const shiftIds = shifts.map(s => s.id);
      if (shiftIds.length === 0) return [];
      let allResults = [];
      for (let i = 0; i < shiftIds.length; i += 50) {
        const batch = shiftIds.slice(i, i + 50);
        const { data, error } = await supabase
          .from('shift_calls')
          .select('*')
          .in('shift_id', batch)
          .order('scheduled_time');
        if (!error && data) allResults.push(...data);
      }
      return allResults;
    },
    enabled: shifts.length > 0,
  });

  const getCallsForShift = (shiftId) => {
    return allCalls.filter(call => call.shift_id === shiftId).sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Filter shifts based on current date and view
  const filteredShifts = shifts.filter(shift => {
    const shiftDate = new Date(shift.date);
    
    if (view === 'day') {
      return isSameDay(shiftDate, currentDate);
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return isWithinInterval(shiftDate, { start: weekStart, end: weekEnd });
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return isWithinInterval(shiftDate, { start: monthStart, end: monthEnd });
    }
  });

  // Group by date
  const groupedShifts = filteredShifts.reduce((acc, shift) => {
    const dateKey = shift.date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(shift);
    return acc;
  }, {});

  // Sort dates
  const sortedDates = Object.keys(groupedShifts).sort((a, b) => new Date(a) - new Date(b));

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4 h-32 animate-pulse bg-slate-100" />
        ))}
      </div>
    );
  }

  if (filteredShifts.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No shifts scheduled"
        description={`You have no shifts scheduled for this ${view}.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      {sortedDates.map(dateKey => {
        const dayShifts = groupedShifts[dateKey];
        const date = new Date(dateKey);
        const isToday = isSameDay(date, new Date());
        
        return (
          <div key={dateKey}>
            <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${isToday ? 'border-teal-300' : 'border-slate-200'}`}>
              <h3 className={`text-lg font-semibold ${isToday ? 'text-teal-700' : 'text-slate-900'}`}>
                {format(date, 'EEEE, d MMMM yyyy')}
              </h3>
              {isToday && (
                <Badge className="bg-teal-600 text-white">Today</Badge>
              )}
              <Badge variant="outline">{dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}</Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayShifts.map(shift => {
                const shiftCalls = getCallsForShift(shift.id);
                const displayName = shift.staff_name || shift.service_user_name || 'Unassigned';
                
                return (
                  <Card 
                    key={shift.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
                    onClick={() => onShiftClick(shift)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={displayName} size="sm" />
                          <div>
                            <CardTitle className="text-base">{displayName}</CardTitle>
                            {shift.shift_name && <p className="text-xs text-slate-600 font-medium">{shift.shift_name}</p>}
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {shift.start_time} - {shift.end_time}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={shift.status} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {shiftCalls.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Calls Scheduled</span>
                            <span className="font-medium text-slate-900">
                              {shiftCalls.length}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {shiftCalls.map((call) => (
                              <div
                                key={call.id}
                                className={`h-2 flex-1 rounded-full ${
                                  call.status === 'completed' ? 'bg-green-500' :
                                  call.status === 'in_progress' ? 'bg-blue-500' :
                                  call.status === 'not_at_home' ? 'bg-amber-500' :
                                  call.status === 'missed' ? 'bg-red-500' :
                                  'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No calls scheduled</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
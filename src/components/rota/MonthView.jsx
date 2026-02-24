import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShiftApi, applyAreaFilter } from '@/api/rotaApi';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { supabase } from '@/api/supabaseClient';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function MonthView({ currentDate, onShiftClick, onCreateShift, isAdmin, selectedAreaId, userId, filterByUserId }) {
   const [showAllShifts, setShowAllShifts] = useState(false);
   const monthStart = startOfMonth(currentDate);
   const monthEnd = endOfMonth(currentDate);
   const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
   const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

   const { data: shifts = [], isLoading } = useQuery({
     queryKey: ['shifts', 'month', format(monthStart, 'yyyy-MM'), selectedAreaId, filterByUserId, showAllShifts],
     queryFn: async () => {
       const startStr = format(startDate, 'yyyy-MM-dd');
       const endStr = format(endDate, 'yyyy-MM-dd');
       let query = supabase
         .from('shifts')
         .select('*')
         .gte('date', startStr)
         .lte('date', endStr);
       query = applyAreaFilter(query, selectedAreaId);
       const { data: allShifts = [], error } = await query;
       if (error) throw error;
       let filtered = allShifts;
       if (filterByUserId) {
         filtered = filtered.filter(s => s.staff_id === filterByUserId || !s.staff_id);
       } else if (!showAllShifts && !isAdmin && userId) {
         filtered = filtered.filter(s => s.staff_id === userId || !s.staff_id);
       }
       return filtered;
     },
   });

  const { data: shiftTypes = [] } = useQuery({
    queryKey: ['shiftTypes', selectedAreaId],
    queryFn: () => ShiftTypeApi.filterByArea(selectedAreaId),
  });

  const days = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getShiftsForDate = (date) => {
    return shifts.filter(shift => isSameDay(parseISO(shift.date), date));
  };

  return (
    <div className="space-y-3">
      {!isAdmin && !filterByUserId && (
        <div className="flex justify-end mb-2">
          <Button
            variant={showAllShifts ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAllShifts(!showAllShifts)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {showAllShifts ? "All Shifts" : "My Shifts"}
          </Button>
        </div>
      )}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        days
          .filter(date => isSameMonth(date, currentDate))
          .map((date) => {
            const isToday = isSameDay(date, new Date());
            const dayShifts = getShiftsForDate(date);

            return (
              <Card key={date.toISOString()} className="p-4 bg-white border-0 shadow-sm">
                <div className={`text-center p-3 rounded-lg mb-3 ${isToday ? 'bg-teal-50' : 'bg-slate-50'}`}>
                  <p className="text-xs text-slate-500">{format(date, 'EEEE')}</p>
                  <p className={`text-lg font-semibold ${isToday ? 'text-teal-600' : 'text-slate-900'}`}>
                    {format(date, 'd MMM')}
                  </p>
                </div>

                <div className="space-y-2">
                  {dayShifts.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-3">No shifts</p>
                  ) : (
                    dayShifts.map((shift) => {
                      const shiftType = shiftTypes.find(st => st.name === shift.shift_name);
                      const shiftColor = shiftType?.color || '#14b8a6';
                      const isAvailable = !shift.staff_id;
                      return (
                        <button
                           key={shift.id}
                           onClick={() => onShiftClick(shift)}
                           className={`w-full text-left p-3 rounded-lg hover:shadow-lg select-none transition-all ${isAvailable ? 'border-2 border-dashed' : ''}`}
                           style={isAvailable ? {
                             borderColor: shiftColor,
                             backgroundColor: `${shiftColor}15`,
                           } : {
                             backgroundColor: shiftColor,
                           }}
                         >
                          <p className={`text-sm font-medium ${isAvailable ? '' : 'text-white'}`} style={isAvailable ? { color: shiftColor } : {}}>
                            {isAvailable ? (shift.shift_name || 'Shift') : (
                              shift.shift_name ? (
                                <>
                                  {shift.shift_name}
                                  <span className="opacity-90"> ({shift.staff_name}{shift.paired_staff_name ? ` + ${shift.paired_staff_name}` : ''})</span>
                                </>
                              ) : shift.staff_name ? `${shift.staff_name}${shift.paired_staff_name ? ` + ${shift.paired_staff_name}` : ''}` : 'Unassigned'
                            )}
                          </p>
                          <p className={`text-sm ${isAvailable ? 'text-slate-500' : 'text-white opacity-90'}`}>{shift.start_time} - {shift.end_time}</p>
                          {isAvailable && (
                            <p className="text-xs font-medium text-teal-600 mt-1">Available - Tap to Claim</p>
                          )}
                          {!isAvailable && shift.service_user_name && (
                            <p className="text-xs text-white opacity-80">{shift.service_user_name}</p>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </Card>
            );
          })
      )}
    </div>
  );
}
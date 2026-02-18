import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { Plus, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function WeekView({ currentDate, onShiftClick, onCreateShift, isAdmin, selectedAreaId, userId, filterByUserId }) {
   const [showAllShifts, setShowAllShifts] = useState(false);

   const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
   const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

   const { data: shifts = [], isLoading, error: shiftsError } = useQuery({
     queryKey: ['shifts', 'week', format(weekStart, 'yyyy-MM-dd'), selectedAreaId, filterByUserId, showAllShifts],
     queryFn: async () => {
       console.log('[WeekView] Fetching shifts...');
       const allShifts = await ShiftApi.list('-created_date', 500);
       console.log('[WeekView] Raw shifts from DB:', allShifts?.length);
       const weekEnd = addDays(weekStart, 6);
       let filtered = allShifts.filter(shift => {
         if (!shift.date) return false;
         const shiftDate = parseISO(shift.date);
         const dateMatches = shiftDate.getTime() >= weekStart.getTime() && shiftDate.getTime() <= weekEnd.getTime();
         const shiftArea = shift.rota_area_id || shift.area_id;
         const areaMatches = !selectedAreaId || shiftArea === selectedAreaId;
         return dateMatches && areaMatches;
       });
       if (filterByUserId) {
         filtered = filtered.filter(s => s.staff_id === filterByUserId || !s.staff_id);
       } else if (!showAllShifts && !isAdmin && userId) {
         filtered = filtered.filter(s => s.staff_id === userId || !s.staff_id);
       }
       console.log('[WeekView] Filtered shifts:', filtered?.length, 'selectedAreaId:', selectedAreaId);
       return filtered;
     },
   });
   if (shiftsError) console.error('[WeekView] Shifts error:', shiftsError);

  const { data: shiftTypes = [] } = useQuery({
    queryKey: ['shiftTypes'],
    queryFn: () => ShiftTypeApi.list(),
  });

  const { data: allCalls = [] } = useQuery({
    queryKey: ['shift-calls', 'week', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const shiftIds = shifts.map(s => s.id);
      if (shiftIds.length === 0) return [];
      const calls = await ShiftCallApi.list('-scheduled_time', 500);
      return calls.filter(call => shiftIds.includes(call.shift_id));
    },
    enabled: shifts.length > 0,
  });

  const getCallsForShift = (shiftId) => {
    return allCalls.filter(call => call.shift_id === shiftId);
  };

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
      
      <div className="lg:hidden space-y-3">
        {/* Mobile: List view */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          weekDates.map((date) => {
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
                      const shiftCalls = getCallsForShift(shift.id);
                      const isAvailable = !shift.staff_id;
                      return (
                        <button
                          key={shift.id}
                          onClick={() => onShiftClick(shift)}
                          className={`w-full text-left p-3 rounded-lg hover:shadow-lg transition-all select-none ${isAvailable ? 'border-2 border-dashed' : ''}`}
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
                          {!isAvailable && shiftCalls.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-white opacity-80 mb-1">{shiftCalls.length} call{shiftCalls.length !== 1 ? 's' : ''}</p>
                              <div className="flex gap-0.5">
                                {shiftCalls.map((call) => (
                                  <div
                                    key={call.id}
                                    className={`h-1.5 flex-1 rounded-full ${
                                      call.status === 'completed' ? 'bg-green-300' :
                                      call.status === 'in_progress' ? 'bg-blue-300' :
                                      call.status === 'missed' ? 'bg-red-300' :
                                      'bg-white/40'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
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

      <Card className="hidden lg:block p-4 bg-white border-0 shadow-sm">
        <div className="grid grid-cols-7 gap-2 min-w-full overflow-x-auto">
          {weekDates.map((date) => {
            const isToday = isSameDay(date, new Date());
            const dayShifts = getShiftsForDate(date);

            return (
              <div key={date.toISOString()} className="min-h-[300px]">
                <div 
                  className={`text-center p-3 rounded-t-lg ${isToday ? 'bg-teal-50 border-b-2 border-teal-500' : 'bg-slate-50'} ${isAdmin ? 'cursor-pointer hover:bg-teal-100' : ''} transition-colors`}
                  onClick={() => isAdmin && onCreateShift && onCreateShift(date)}
                >
                  <p className="text-xs text-slate-500">{format(date, 'EEE')}</p>
                  <p className={`text-xl font-semibold ${isToday ? 'text-teal-600' : 'text-slate-900'}`}>
                    {format(date, 'd')}
                  </p>
                </div>

                <div 
                  className="border border-t-0 border-slate-200 rounded-b-lg p-2 space-y-2 min-h-[250px]"
                  onClick={(e) => {
                    if (isAdmin && e.target === e.currentTarget) {
                      onCreateShift(date);
                    }
                  }}
                >
                  {isLoading ? (
                    <Skeleton className="h-20 w-full" />
                  ) : (
                    <>
                      {dayShifts.map((shift) => {
                        const shiftType = shiftTypes.find(st => st.name === shift.shift_name);
                        const shiftColor = shiftType?.color || '#14b8a6';
                        const shiftCalls = getCallsForShift(shift.id);
                        const isAvailable = !shift.staff_id;
                        return (
                          <button
                            key={shift.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onShiftClick(shift);
                            }}
                            className={`w-full text-left p-2 rounded-lg hover:shadow-lg select-none transition-all ${isAvailable ? 'border-2 border-dashed' : ''}`}
                            style={isAvailable ? {
                              borderColor: shiftColor,
                              backgroundColor: `${shiftColor}15`,
                            } : {
                              backgroundColor: shiftColor,
                            }}
                          >
                            <p className={`text-xs font-medium truncate ${isAvailable ? '' : 'text-white'}`} style={isAvailable ? { color: shiftColor } : {}}>
                              {isAvailable ? (shift.shift_name || 'Shift') : (
                                shift.shift_name ? (
                                  <>
                                    {shift.shift_name}
                                    <span className="opacity-90"> ({shift.staff_name}{shift.paired_staff_name ? ` + ${shift.paired_staff_name}` : ''})</span>
                                  </>
                                ) : shift.staff_name ? `${shift.staff_name}${shift.paired_staff_name ? ` + ${shift.paired_staff_name}` : ''}` : 'Unassigned'
                              )}
                            </p>
                            <p className={`text-xs ${isAvailable ? 'text-slate-500' : 'text-white opacity-90'}`}>
                              {shift.start_time} - {shift.end_time}
                            </p>
                            {isAvailable && (
                              <p className="text-[10px] font-medium text-teal-600 mt-0.5">Available</p>
                            )}
                            {!isAvailable && shift.service_user_name && (
                              <p className="text-xs text-white opacity-80 truncate">
                                {shift.service_user_name}
                              </p>
                            )}
                            {!isAvailable && shiftCalls.length > 0 && (
                              <div className="mt-1">
                                <p className="text-[10px] text-white opacity-80">{shiftCalls.length} call{shiftCalls.length !== 1 ? 's' : ''}</p>
                                <div className="flex gap-0.5 mt-0.5">
                                  {shiftCalls.map((call) => (
                                    <div
                                      key={call.id}
                                      className={`h-1 flex-1 rounded-full ${
                                        call.status === 'completed' ? 'bg-green-300' :
                                        call.status === 'in_progress' ? 'bg-blue-300' :
                                        call.status === 'missed' ? 'bg-red-300' :
                                        'bg-white/40'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}

                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateShift(date);
                          }}
                          className="w-full p-2 border border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-teal-400 hover:text-teal-600 transition-colors select-none"
                          style={{ touchAction: 'manipulation' }}
                        >
                          <Plus className="w-4 h-4 mx-auto" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
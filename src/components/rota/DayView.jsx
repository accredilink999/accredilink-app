import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { format, isSameDay, parseISO } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from 'lucide-react';


export default function DayView({ currentDate, onShiftClick, onCreateShift, isAdmin, userId, selectedAreaId, filterByUserId }) {
   const { data: shifts = [], isLoading } = useQuery({
     queryKey: ['shifts', 'day', format(currentDate, 'yyyy-MM-dd'), selectedAreaId, filterByUserId, userId],
     queryFn: async () => {
       const allShifts = await ShiftApi.list('-created_date', 500);
       let filtered = allShifts.filter(shift => {
         if (!shift.date) return false;
         const dateMatches = isSameDay(parseISO(shift.date), currentDate);
         const shiftArea = shift.rota_area_id || shift.area_id;
         const areaMatches = !selectedAreaId || shiftArea === selectedAreaId;
         return dateMatches && areaMatches;
       });
       if (filterByUserId) {
         filtered = filtered.filter(s => s.staff_id === filterByUserId || !s.staff_id);
       }
       return filtered;
     },
   });

  const { data: shiftTypes = [] } = useQuery({
    queryKey: ['shiftTypes'],
    queryFn: () => ShiftTypeApi.list(),
  });

  const { data: calls = [] } = useQuery({
    queryKey: ['shift-calls', format(currentDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const shiftIds = shifts.map(s => s.id);
      if (shiftIds.length === 0) return [];
      const allCalls = await ShiftCallApi.list('-scheduled_time', 500);
      return allCalls.filter(call => shiftIds.includes(call.shift_id));
    },
    enabled: shifts.length > 0,
  });

  const getDisplayShifts = () => {
    return shifts;
  };
  const displayShifts = getDisplayShifts();

  const getCallsForShift = (shiftId) => {
    return calls.filter(call => call.shift_id === shiftId).sort((a, b) => (a.order || 0) - (b.order || 0));
  };



  const ShiftCard = ({ shift, onClick }) => {
    const shiftType = shiftTypes.find(st => st.name === shift.shift_name);
    const shiftColor = shiftType?.color || '#14b8a6';
    const shiftCalls = getCallsForShift(shift.id);
    const isAvailable = !shift.staff_id;

    return (
      <button
         onClick={onClick}
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
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : displayShifts.length === 0 ? (
        <Card className="p-8 text-center bg-white border-0 shadow-sm">
          <p className="text-slate-500">{filterByUserId ? 'No shifts assigned to you' : 'No shifts scheduled for this day'}</p>
          {isAdmin && !filterByUserId && (
            <Button onClick={() => onCreateShift(currentDate)} variant="outline" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Create First Shift
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          {displayShifts.map(shift => {
            return <ShiftCard key={shift.id} shift={shift} onClick={() => onShiftClick(shift)} />;
          })}
        </div>
      )}


    </div>
  );
}
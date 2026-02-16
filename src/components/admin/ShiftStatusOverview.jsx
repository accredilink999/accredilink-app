import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { supabase } from '@/api/supabaseClient';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isToday, parseISO } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle, Eye, EyeOff, Users } from 'lucide-react';
import ShiftDetailModal from '@/components/rota/ShiftDetailModal';

export default function ShiftStatusOverview() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [followingShifts, setFollowingShifts] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: shiftsToday = [] } = useQuery({
    queryKey: ['shiftsToday', selectedDate],
    queryFn: async () => {
      const allShifts = await ShiftApi.list('-created_date', 500);
      return allShifts.filter(s => s.date === selectedDate);
    },
    staleTime: 0,
  });

  // Real-time shift updates
  useEffect(() => {
    const unsubscribe = ShiftApi.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['shiftsToday', selectedDate] });
    });
    return unsubscribe;
  }, [queryClient, selectedDate]);

  // Real-time shift_calls updates
  useEffect(() => {
    const unsubscribe = ShiftCallApi.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['shiftCalls'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Force re-render every 30 seconds to update time-based status
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setForceUpdate(prev => prev + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const { data: careLogs = [] } = useQuery({
    queryKey: ['careLogs', selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('care_logs')
        .select('*')
        .eq('visit_date', selectedDate);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Fetch shift_calls for today's shifts only (direct supabase query for accuracy)
  const shiftIds = shiftsToday.map(s => s.id);
  const { data: shiftCalls = [] } = useQuery({
    queryKey: ['shiftCalls', shiftIds.join(',')],
    queryFn: async () => {
      if (shiftIds.length === 0) return [];
      const { data, error } = await supabase
        .from('shift_calls')
        .select('*')
        .in('shift_id', shiftIds);
      if (error) throw error;
      return data || [];
    },
    enabled: shiftIds.length > 0,
    refetchInterval: 10000,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.filter({ role: 'user' }),
  });

  const updateFollowingMutation = useMutation({
    mutationFn: async (following) => {
      const user = await base44.auth.me();
      return base44.auth.updateMe({
        ...user,
        following_shifts: following
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  // Get shift status
  const getShiftStatus = (shift) => {
    if (shift.status === 'completed' || shift.clock_out_time || shift.actual_end_time) return 'complete';
    // Only show 'booked_on' if they've actually clocked in (check both clock_in_time and actual_start_time)
    if ((shift.clock_in_time || shift.actual_start_time) && !shift.clock_out_time && !shift.actual_end_time) return 'booked_on';
    
    const now = new Date();
    const shiftStart = parseISO(`${shift.date}T${shift.start_time}`);
    
    // Check if not booked and shift start time has passed
    if (!shift.staff_id && now >= shiftStart) return 'overdue';
    if (!shift.staff_id) return 'not_booked';
    
    // Check if shift hasn't started yet (booked but not started)
    if (now < shiftStart) return 'upcoming';
    
    // If we get here: staff assigned but hasn't clocked in yet and shift has started
    return 'not_booked';
  };

  // Get care log status for shift
  const getLogStatus = (shiftId) => {
    const log = careLogs.find(l => l.shift_id === shiftId);
    if (log && log.status === 'submitted') return 'submitted';
    
    // Check if shift is overdue (passed end time)
    const shift = shiftsToday.find(s => s.id === shiftId);
    if (shift && shift.status === 'completed') {
      const now = new Date();
      const shiftEnd = parseISO(`${shift.date}T${shift.end_time}`);
      if (now > shiftEnd && !log) return 'overdue';
    }
    return log ? 'submitted' : 'pending';
  };

  // Get call status for shift
  const getCallStatus = (shift) => {
    const shiftStatus = getShiftStatus(shift);
    const shiftCallsList = shiftCalls.filter(c => c.shift_id === shift.id);
    // Only count as "in progress" if the call has actually been clocked into (has clock_in_time)
    // and is a real visit (not sitin_cover)
    const inProgressCalls = shiftCallsList.filter(c =>
      (c.status === 'in_progress' || c.status === 'started') &&
      c.clock_in_time &&
      c.call_type !== 'sitin_cover'
    );
    if (inProgressCalls.length > 0) return 'in_progress';
    if (shiftStatus === 'booked_on') return 'between_calls';
    return null;
  };

  // Stats
  const onShift = shiftsToday.filter(s => getShiftStatus(s) === 'booked_on').length;
  const bookedOn = shiftsToday.filter(s => s.staff_id).length;
  const notBooked = shiftsToday.filter(s => !s.staff_id).length;
  const completedLogs = shiftsToday.filter(s => getLogStatus(s.id) === 'submitted').length;
  const overdueLogs = shiftsToday.filter(s => getLogStatus(s.id) === 'overdue').length;

  return (
    <div className="space-y-4">
      {/* Header with date and follow button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Shift Status for {format(parseISO(selectedDate), 'dd MMM yyyy')}</h2>
          <p className="text-sm text-slate-500 mt-1">{shiftsToday.length} shifts scheduled</p>
        </div>
        <Button
          variant={followingShifts ? 'default' : 'outline'}
          onClick={() => {
            setFollowingShifts(!followingShifts);
            updateFollowingMutation.mutate(!followingShifts);
          }}
          className="gap-2"
        >
          {followingShifts ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          {followingShifts ? 'Following Today' : 'Follow Today'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">On Shift</p>
              <p className="text-2xl font-bold text-blue-900">{onShift}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">Today's Shifts</p>
              <p className="text-2xl font-bold text-green-900">{bookedOn}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-medium">Not Booked</p>
              <p className="text-2xl font-bold text-red-900">{notBooked}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600 font-medium">Logs Done</p>
              <p className="text-2xl font-bold text-emerald-900">{completedLogs}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-600 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-orange-900">{overdueLogs}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-400" />
          </div>
        </Card>
      </div>

      {/* Shifts List */}
      <div className="space-y-2">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          All Shifts Today
        </h3>
        <div className="grid gap-2">
          {shiftsToday.length === 0 ? (
            <Card className="p-4 text-center text-slate-500">
              No shifts scheduled for this date
            </Card>
          ) : (
            shiftsToday.map(shift => {
               const shiftStatus = getShiftStatus(shift);
               const logStatus = getLogStatus(shift.id);
               const staffName = shift.staff_name || 'Unassigned';

              return (
                <div key={shift.id} onClick={() => setSelectedShift(shift)} role="button" tabIndex={0} className="cursor-pointer select-none">
                  <Card className="p-3 bg-white border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 mb-1 flex-wrap">
                         <p className="font-medium text-slate-900 truncate">{staffName}</p>
                         <Badge className={`text-xs flex-shrink-0 ${
                           shiftStatus === 'overdue' ? 'bg-red-100 text-red-800' :
                           shiftStatus === 'not_booked' ? 'bg-red-100 text-red-800' :
                           shiftStatus === 'booked_on' ? 'bg-amber-100 text-amber-800' :
                           shiftStatus === 'complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                         }`}>
                          {shiftStatus === 'overdue' ? 'Overdue' :
                           shiftStatus === 'not_booked' ? 'SHIFT' :
                           shiftStatus === 'booked_on' ? 'Booked On' :
                           shiftStatus === 'complete' ? 'Complete' : 'Upcoming'}
                         </Badge>
                         {getCallStatus(shift) === 'in_progress' && (
                           <Badge className="text-xs bg-blue-100 text-blue-800 flex-shrink-0">Call In Progress</Badge>
                         )}
                         {getCallStatus(shift) === 'between_calls' && (
                           <Badge className="text-xs bg-purple-100 text-purple-800 flex-shrink-0">Between Calls</Badge>
                         )}
                       </div>
                       <p className="text-xs text-slate-500">
                         {shift.start_time} - {shift.end_time} • {shift.service_user_name}
                       </p>
                     </div>
                     <div className="flex items-center gap-2 flex-shrink-0">
                       {logStatus === 'overdue' && (
                         <Badge variant="destructive" className="text-xs">Overdue Log</Badge>
                       )}
                       {(() => {
                         const shiftLogs = careLogs.filter(l => l.shift_id === shift.id);
                         const completedLogs = shiftLogs.filter(l => l.status === 'submitted').length;
                         const callsForShift = shiftCalls.filter(c => c.shift_id === shift.id && c.call_type !== 'sitin_cover');
                         const totalCalls = callsForShift.length;
                         if (totalCalls === 0) return null;
                         return (
                           <Badge className={`text-xs ${
                             completedLogs >= totalCalls
                               ? 'bg-green-100 text-green-800'
                               : 'bg-yellow-100 text-yellow-800'
                           }`}>
                             {completedLogs} / {totalCalls} logs
                           </Badge>
                         );
                       })()}
                       {logStatus === 'pending' && (
                         <Badge variant="outline" className="text-xs">Pending Log</Badge>
                       )}
                     </div>
                   </div>
                   </Card>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedShift && (
        <ShiftDetailModal
          shift={selectedShift}
          open={!!selectedShift}
          onClose={() => setSelectedShift(null)}
          isAdmin={true}
          userId={user?.id}
        />
      )}
    </div>
  );
}
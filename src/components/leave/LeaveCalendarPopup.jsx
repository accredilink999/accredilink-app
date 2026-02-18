import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWithinInterval } from 'date-fns';

export default function LeaveCalendarPopup({ open, onClose, showInitials = false }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const queryClient = useQueryClient();

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const { data: approvedLeave = [] } = useQuery({
    queryKey: ['approvedLeaveRequests'],
    queryFn: () => base44.entities.LeaveRequest.filter({ status: 'approved' }),
    enabled: open,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: () => base44.entities.User.list(),
    enabled: open,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  // Refetch leave when calendar opens to ensure latest data
  useEffect(() => {
    if (open) {
      queryClient.invalidateQueries({ queryKey: ['approvedLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
    }
  }, [open, queryClient]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Build a map of dates with leave info
  const leaveMap = {};
  approvedLeave.forEach(leave => {
    const startDate = new Date(leave.start_date);
    const endDate = new Date(leave.end_date);
    const staffUser = staff.find(s => s.id === leave.staff_id);
    const displayName = staffUser?.staff_full_name || staffUser?.full_name || leave.staff_name || 'Unknown';
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = format(d, 'yyyy-MM-dd');
      if (!leaveMap[dateKey]) {
        leaveMap[dateKey] = [];
      }
      leaveMap[dateKey].push({
        staffName: displayName,
        type: leave.type,
        leaveRecord: leave
      });
    }
  });

  // Add empty days at start of month to align with day of week
  const startDayOfWeek = monthStart.getDay();
  const paddedDays = [...Array(startDayOfWeek).fill(null), ...days];
  
  const daysInWeeks = [];
  for (let i = 0; i < paddedDays.length; i += 7) {
    daysInWeeks.push(paddedDays.slice(i, i + 7));
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl" aria-describedby="leave-calendar-description">
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white z-10 pb-4">
            <DialogHeader>
              <DialogTitle>Team Leave Calendar</DialogTitle>
            </DialogHeader>
          </div>
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {daysInWeeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIdx) => {
                   if (!day) {
                     return <div key={dayIdx} className="p-1 rounded-lg border border-slate-200 bg-white"></div>;
                   }

                   const dateKey = format(day, 'yyyy-MM-dd');
                   const leavesOnDay = leaveMap[dateKey] || [];
                   const isCurrentMonth = isSameMonth(day, currentDate);

                   return (
                     <div
                       key={dayIdx}
                       className={`p-1 rounded-lg border min-h-24 ${
                         isCurrentMonth
                           ? leavesOnDay.length > 0
                             ? 'bg-red-100 border-red-300'
                             : 'bg-slate-50 border-slate-200'
                           : 'bg-slate-100 border-slate-200'
                       }`}
                     >
                       <p className={`text-xs font-semibold mb-1 ${
                         isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                       }`}>
                         {format(day, 'd')}
                       </p>
                       <div className="space-y-0.5">
                         {leavesOnDay.map((leave, idx) => (
                            <Badge
                              key={idx}
                              className={`text-xs w-full justify-center bg-red-500 text-white truncate ${isAdmin ? 'cursor-pointer hover:bg-red-600' : ''}`}
                              onClick={() => {
                                if (isAdmin) {
                                  setSelectedLeave({ ...leave, date: dateKey });
                                  setIsDetailsOpen(true);
                                }
                              }}
                            >
                              {showInitials ? getInitials(leave.staffName) : leave.staffName}
                            </Badge>
                          ))}
                       </div>
                     </div>
                   );
                 })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="p-3 bg-slate-50 rounded-lg text-sm">
            <p className="font-medium text-slate-900 mb-2">Legend:</p>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-slate-600">Staff on approved leave {isAdmin && '(click for details)'}</span>
            </div>
          </div>
          </div>

          {/* Leave Details Modal */}
          {selectedLeave && (
          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
           <DialogContent className="max-w-md">
             <DialogHeader>
               <DialogTitle>Leave Details</DialogTitle>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <p className="text-sm text-slate-600 mb-1">Staff Member</p>
                 <p className="font-semibold text-slate-900">{selectedLeave.staffName}</p>
               </div>
               <div>
                 <p className="text-sm text-slate-600 mb-1">Leave Type</p>
                 <p className="font-semibold text-slate-900 capitalize">{selectedLeave.type?.replace(/_/g, ' ')}</p>
               </div>
               <div>
                 <p className="text-sm text-slate-600 mb-1">Date Selected</p>
                 <p className="font-semibold text-slate-900">{format(new Date(selectedLeave.date), 'dd MMM yyyy')}</p>
               </div>
               {selectedLeave.leaveRecord && (
                 <>
                   <div>
                     <p className="text-sm text-slate-600 mb-1">Full Period</p>
                     <p className="font-semibold text-slate-900">
                       {format(new Date(selectedLeave.leaveRecord.start_date), 'dd MMM')} - {format(new Date(selectedLeave.leaveRecord.end_date), 'dd MMM yyyy')}
                     </p>
                   </div>
                   {selectedLeave.leaveRecord.reason && (
                     <div>
                       <p className="text-sm text-slate-600 mb-1">Reason</p>
                       <p className="text-slate-900">{selectedLeave.leaveRecord.reason}</p>
                     </div>
                   )}
                   <div>
                     <p className="text-sm text-slate-600 mb-1">Reviewed By</p>
                     <p className="font-semibold text-slate-900">
                       {selectedLeave.leaveRecord.reviewed_by ? (() => {
                         const reviewer = staff.find(s => s.id === selectedLeave.leaveRecord.reviewed_by);
                         return reviewer?.staff_full_name || reviewer?.full_name || selectedLeave.leaveRecord.reviewed_by_name || 'Pending';
                       })() : 'Pending'}
                     </p>
                   </div>
                   {selectedLeave.leaveRecord.review_notes && (
                     <div>
                       <p className="text-sm text-slate-600 mb-1">Review Notes</p>
                       <p className="text-slate-900">{selectedLeave.leaveRecord.review_notes}</p>
                     </div>
                   )}
                 </>
               )}
               <Button 
                 onClick={() => setIsDetailsOpen(false)}
                 variant="outline"
                 className="w-full"
               >
                 Close
               </Button>
             </div>
           </DialogContent>
          </Dialog>
          )}
          </DialogContent>
          </Dialog>
          );
          }
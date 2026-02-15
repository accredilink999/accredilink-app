import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftCallApi } from '@/api/rotaApi';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddCallModal from '@/components/rota/AddCallModal';
import AddClientCallsModal from '@/components/rota/AddClientCallsModal';
import CareLogForm from '@/components/careLogs/CareLogForm';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, CheckCircle, AlertCircle, Play, Square, Plus, Edit, Trash2, FileText, Car, ListChecks } from 'lucide-react';
import { format } from 'date-fns';
import { notifyAdminsOfActivity } from '@/utils/adminNotifications';
import { toast } from 'sonner';

// Haversine formula: returns distance in miles between two GPS points
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CallManager({ shift, calls, isAdmin, isMyShift }) {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddClientCallsOpen, setIsAddClientCallsOpen] = useState(false);
  const [editingCall, setEditingCall] = useState(null);
  const [careLogCall, setCareLogCall] = useState(null);
  const [clockOutConfirmCall, setClockOutConfirmCall] = useState(null);
  const [notMyCallConfirm, setNotMyCallConfirm] = useState(null);
  const [driveToCallConfirm, setDriveToCallConfirm] = useState(null);
  const [taskWarningCall, setTaskWarningCall] = useState(null);
  const [newTaskText, setNewTaskText] = useState({});

  const [freshCalls, setFreshCalls] = useState(calls);

  useEffect(() => {
    setFreshCalls(calls);
  }, [calls]);

  // Real-time subscription to shift call updates (listen to ALL changes for shared shift sync)
  useEffect(() => {
    const unsubscribe = ShiftCallApi.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
    });
    return unsubscribe;
  }, [shift?.id, queryClient]);

  const callsToDisplay = (freshCalls || calls).sort((a, b) => {
    const timeA = a.scheduled_time ? a.scheduled_time.split(':') : ['23', '59'];
    const timeB = b.scheduled_time ? b.scheduled_time.split(':') : ['23', '59'];
    const minutesA = parseInt(timeA[0]) * 60 + parseInt(timeA[1]);
    const minutesB = parseInt(timeB[0]) * 60 + parseInt(timeB[1]);
    return minutesA - minutesB;
  });

  // Fetch care logs to check which calls have logs (including paired shift)
  const { data: careLogs = [] } = useQuery({
    queryKey: ['careLogs', shift?.id, shift?.paired_shift_id],
    queryFn: async () => {
      const logs = await base44.entities.CareLog.filter({ shift_id: shift?.id }, '-created_date', 100);
      if (shift?.paired_shift_id) {
        const pairedLogs = await base44.entities.CareLog.filter({ shift_id: shift.paired_shift_id }, '-created_date', 100);
        return [...logs, ...pairedLogs];
      }
      return logs;
    },
    enabled: !!shift?.id,
  });

  const getCallsWithPartnerLogs = () => {
    if (!shift?.paired_shift_id) return [];
    return careLogs
      .filter(log => log.shift_id === shift.paired_shift_id)
      .map(log => log.service_user_id);
  };

  // Fetch service users to check status
  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers', callsToDisplay?.map(c => c.service_user_id)],
    queryFn: async () => {
      const userIds = [...new Set(callsToDisplay?.map(c => c.service_user_id).filter(Boolean))];
      if (userIds.length === 0) return [];
      const users = await Promise.all(userIds.map(id => base44.entities.ServiceUser.list().then(all => all.find(u => u.id === id))));
      return users.filter(Boolean);
    },
    enabled: !!callsToDisplay?.length,
  });

  const clockInMutation = useMutation({
    mutationFn: async (call) => {
      const updatedCall = await ShiftCallApi.update(call.id, {
        clock_in_time: new Date().toISOString(),
        status: 'in_progress'
      });
      return updatedCall;
    },
    onMutate: (call) => {
      setFreshCalls(prev => prev.map(c => c.id === call.id ? { ...c, clock_in_time: new Date().toISOString(), status: 'in_progress' } : c));
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });

      // Sync check-in to shared/paired shift calls (same service user, date, time)
      if (data.service_user_id && data.call_date && data.scheduled_time) {
        try {
          const matchingCalls = await ShiftCallApi.filter({
            service_user_id: data.service_user_id,
            call_date: data.call_date,
            scheduled_time: data.scheduled_time
          });
          const otherCalls = matchingCalls.filter(c => c.id !== data.id && c.status === 'pending');
          for (const otherCall of otherCalls) {
            await ShiftCallApi.update(otherCall.id, { status: 'in_progress' });
          }
        } catch (err) {
          console.log('Error syncing check-in to shared calls:', err);
        }
      }

      // ALWAYS show "Did you drive?" prompt — for every call including the first
      setDriveToCallConfirm({ ...data, currentLocation: null });

      // Capture geolocation in parallel while dialog is showing
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setDriveToCallConfirm(prev => prev ? {
              ...prev,
              currentLocation: position.coords
            } : null);
          },
          (error) => console.log('Geolocation error:', error),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }

      // Notify admins of call check-in
      const staffName = shift?.staff_name || 'Staff';
      const clientName = data.service_user_name || 'a client';
      notifyAdminsOfActivity({
        title: `Call check-in: ${clientName}`,
        message: `${staffName} has checked in to ${clientName}'s call.`,
        excludeUserId: shift?.staff_id,
      });
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: async (call) => {
      const updatedCall = await ShiftCallApi.update(call.id, {
        clock_out_time: new Date().toISOString(),
        status: 'completed'
      });
      return updatedCall;
    },
    onMutate: (call) => {
      setFreshCalls(prev => prev.map(c => c.id === call.id ? { ...c, clock_out_time: new Date().toISOString(), status: 'completed' } : c));
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });

      // Sync check-out to shared/paired shift calls
      if (data.service_user_id && data.call_date && data.scheduled_time) {
        try {
          const matchingCalls = await ShiftCallApi.filter({
            service_user_id: data.service_user_id,
            call_date: data.call_date,
            scheduled_time: data.scheduled_time
          });
          const otherCalls = matchingCalls.filter(c => c.id !== data.id && c.status !== 'completed');
          for (const otherCall of otherCalls) {
            await ShiftCallApi.update(otherCall.id, {
              clock_out_time: new Date().toISOString(),
              status: 'completed'
            });
            // Send push notification to the partner
            if (otherCall.shift_id) {
              try {
                const otherShift = await base44.entities.Shift.read(otherCall.shift_id);
                if (otherShift?.staff_id && otherShift.staff_id !== shift?.staff_id) {
                  const staffName = shift?.staff_name || 'Your shift partner';
                  base44.functions.invoke('createNotification', {
                    recipient_ids: [otherShift.staff_id],
                    type: 'care_log',
                    title: `Call completed: ${data.service_user_name || 'Client'}`,
                    message: `${staffName} has completed this call.`,
                    priority: 'normal',
                    action_url: '/CareLogs',
                    send_push: true,
                  }).catch(e => console.warn('Push to partner failed:', e));
                }
              } catch (e) {
                console.warn('Could not notify partner:', e);
              }
            }
          }
          if (otherCalls.length > 0) {
            console.log(`[ClockOut] Auto-completed ${otherCalls.length} shared call(s)`);
          }
        } catch (err) {
          console.log('Error syncing check-out to shared calls:', err);
        }
      }

      // Check if this is the last call to be completed
      const completedCount = freshCalls.filter(c => c.status === 'completed').length;
      const isLastCall = completedCount >= freshCalls.length - 1;

      if (isLastCall) {
        // Calculate mileage from all shift_calls where drove_to_call=true
        try {
          const allShiftCalls = await ShiftCallApi.filter(
            { shift_id: shift?.id },
            'created_at',
            100
          );

          const droveCallsWithGPS = allShiftCalls
            .filter(c => c.drove_to_call === true && c.checkin_latitude && c.checkin_longitude)
            .sort((a, b) => new Date(a.clock_in_time) - new Date(b.clock_in_time));

          if (droveCallsWithGPS.length >= 2) {
            let totalMiles = 0;
            for (let i = 0; i < droveCallsWithGPS.length - 1; i++) {
              const lat1 = parseFloat(droveCallsWithGPS[i].checkin_latitude);
              const lon1 = parseFloat(droveCallsWithGPS[i].checkin_longitude);
              const lat2 = parseFloat(droveCallsWithGPS[i + 1].checkin_latitude);
              const lon2 = parseFloat(droveCallsWithGPS[i + 1].checkin_longitude);
              const R = 3959; // Earth radius in miles
              const dLat = (lat2 - lat1) * Math.PI / 180;
              const dLon = (lon2 - lon1) * Math.PI / 180;
              const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              totalMiles += R * c;
            }

            if (totalMiles > 0.1) {
              await base44.functions.invoke('createShiftMileageExpense', {
                shiftId: shift?.id,
                totalMiles: Math.round(totalMiles * 100) / 100
              });
            }
          }
        } catch (err) {
          console.error('Error calculating mileage:', err);
        }
      }

      // Notify admins of call check-out
      const coStaffName = shift?.staff_name || 'Staff';
      const coClientName = data.service_user_name || 'a client';
      notifyAdminsOfActivity({
        title: `Call check-out: ${coClientName}`,
        message: `${coStaffName} has checked out of ${coClientName}'s call.`,
        excludeUserId: shift?.staff_id,
      });
    },
  });

  const deleteCallMutation = useMutation({
    mutationFn: (callId) => ShiftCallApi.delete(callId),
    onSuccess: (_, callId) => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
      // Play audible notification sound
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRlwFAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTgFAACAgICAgICAgICAgICAgICAgH+Af4CAgH+Af4CAf4B/gICBgYKDhIaHiImKi4yNjo6PkJGRkpOTlJSUlJSUk5OSkZGQj46NjIuKiYiHhoWEg4KBgH9/fn59fHx7e3p6enp6ent7fH19fn+AgYKDhIWGh4iJiouMjY6Pj5CRkZKSk5OTk5OTk5KSkZCPjo2Mi4qJiIeGhYSDgoGAf35+fXx8e3t6enp6enp7e3x9fX5/gIGCg4SFhoeIiYqLjI2Oj4+QkZGSkpOTk5OTk5OSkpGQj46NjIuKiYiHhoWEg4KBgH9+fn18fHt7enp6');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}
      toast.success('Call deleted', { duration: 3000 });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete call');
    },
  });

  const updateTasksMutation = useMutation({
    mutationFn: ({ callId, tasks }) =>
      ShiftCallApi.update(callId, { tasks }),
    onMutate: ({ callId, tasks }) => {
      setFreshCalls(prev => prev.map(c => c.id === callId ? { ...c, tasks } : c));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
    },
  });

  const handleToggleTask = (call, taskIdx) => {
    const tasks = [...(call.tasks || [])];
    tasks[taskIdx] = { ...tasks[taskIdx], completed: !tasks[taskIdx].completed };
    updateTasksMutation.mutate({ callId: call.id, tasks });
  };

  const handleAddTask = (call) => {
    const text = (newTaskText[call.id] || '').trim();
    if (!text) return;
    const tasks = [...(call.tasks || []), { text, completed: false }];
    updateTasksMutation.mutate({ callId: call.id, tasks });
    setNewTaskText(prev => ({ ...prev, [call.id]: '' }));
  };

  const handleRemoveTask = (call, taskIdx) => {
    const tasks = (call.tasks || []).filter((_, i) => i !== taskIdx);
    updateTasksMutation.mutate({ callId: call.id, tasks });
  };

  const getIncompleteTasks = (call) => {
    return (call.tasks || []).filter(t => !t.completed);
  };

  // Calculate miles driven from previous check-in to this check-in
  const getMilesFromPrevious = (call, index) => {
    if (!call.drove_to_call || !call.checkin_latitude || !call.checkin_longitude) return null;
    // Find the previous call (by order) that has GPS coordinates
    const sorted = callsToDisplay.filter(c => c.drove_to_call && c.checkin_latitude && c.checkin_longitude);
    const myIdx = sorted.findIndex(c => c.id === call.id);
    if (myIdx <= 0) return 0; // First driven call = 0 miles (starting point)
    const prev = sorted[myIdx - 1];
    return haversineMiles(
      parseFloat(prev.checkin_latitude), parseFloat(prev.checkin_longitude),
      parseFloat(call.checkin_latitude), parseFloat(call.checkin_longitude)
    );
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ callId, status }) =>
      ShiftCallApi.update(callId, { status }),
    onMutate: ({ callId, status }) => {
      setFreshCalls(prev => prev.map(c => c.id === callId ? { ...c, status } : c));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'missed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddClientCallsOpen(true)}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Scheduled Calls
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            variant="outline"
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Manual Call
          </Button>
        </div>
      )}

      {!calls || calls.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No calls scheduled for this shift</p>
        </Card>
      ) : (
        <div className="space-y-3">
           {callsToDisplay.map((call, index) => {
             const serviceUser = serviceUsers.find(su => su.id === call.service_user_id);
             const isOnHold = serviceUser?.status === 'on_hold';
             const canClockIn = (isMyShift || isAdmin) && !call.clock_in_time && (call.status === 'pending' || call.status === 'in_progress') && !isOnHold;
             const canClockOut = (isMyShift || isAdmin) && call.clock_in_time && !call.clock_out_time && call.status === 'in_progress' && !isOnHold;
             const hasCarLog = careLogs.some(log => log.id === call.care_log_id || (log.shift_call_id === call.id));


             const getCardBackground = () => {
               if (isOnHold) return 'bg-gray-100 opacity-50';
               if (call.status === 'completed') return 'bg-green-50';

               const callTime = new Date(`${call.date}T${call.scheduled_time}`);
               const now = new Date();
               const callHasCompletedLog = careLogs.some(log =>
                 (log.shift_call_id === call.id || log.id === call.care_log_id) &&
                 log.status === 'completed'
               );
               const isOverdue = callTime < now && !callHasCompletedLog && call.status !== 'in_progress';

               if (isOverdue) return 'bg-red-50';
               if (call.status === 'pending') return 'bg-yellow-50';
               return '';
             };

             return (
               <Card key={call.id} className={`p-4 hover:shadow-md transition-shadow ${getCardBackground()}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{call.service_user_name}</h4>
                      <p className="text-sm text-slate-500">{call.service_user_address}</p>
                      <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {call.scheduled_time} ({call.duration_minutes}min)
                      </p>
                      {call.call_type && (
                        <Badge variant="outline" className="mt-1 text-xs py-0 px-1.5">{call.call_type}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOnHold && (
                      <Badge className="bg-gray-400 text-white">On Hold</Badge>
                    )}
                    <Badge className={getStatusColor(call.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(call.status)}
                        {call.status}
                      </span>
                    </Badge>
                  </div>
                </div>

                {call.clock_in_time && (
                  <div className="text-xs text-slate-600 space-y-1 mb-3">
                    <p>Clocked in: {format(new Date(call.clock_in_time), 'HH:mm')}</p>
                    {call.clock_out_time && (
                      <p>Clocked out: {format(new Date(call.clock_out_time), 'HH:mm')}</p>
                    )}
                  </div>
                )}

                {/* Drive status indicator */}
                {call.drove_to_call != null && (
                  <div className="text-xs mb-3 flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    {call.drove_to_call ? (() => {
                      const miles = getMilesFromPrevious(call, index);
                      return (
                        <span className="text-green-600">
                          Drove to call — {miles !== null ? `${miles.toFixed(1)} miles` : '0 miles'}
                        </span>
                      );
                    })() : (
                      <span className="text-slate-400">Did not drive — 0 miles</span>
                    )}
                  </div>
                )}

                {call.notes && (
                  <p className="text-sm text-slate-600 mb-3">{call.notes}</p>
                )}

                {/* Task checklist */}
                {((call.tasks && call.tasks.length > 0) || isAdmin) && call.status !== 'completed' && (
                  <div className="mb-3 p-3 bg-slate-50 rounded-lg border">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1 mb-2">
                      <ListChecks className="w-3.5 h-3.5" />
                      Tasks {call.tasks?.length > 0 && `(${call.tasks.filter(t => t.completed).length}/${call.tasks.length})`}
                    </p>
                    {(call.tasks || []).map((task, tIdx) => (
                      <label key={tIdx} className="flex items-center gap-2 py-1 cursor-pointer">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(call, tIdx)}
                          disabled={isOnHold}
                        />
                        <span className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {task.text}
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); handleRemoveTask(call, tIdx); }}
                            className="ml-auto text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </label>
                    ))}
                    {isAdmin && (
                      <div className="flex gap-1 mt-2">
                        <Input
                          value={newTaskText[call.id] || ''}
                          onChange={(e) => setNewTaskText(prev => ({ ...prev, [call.id]: e.target.value }))}
                          placeholder="Add a task..."
                          className="h-8 text-xs"
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(call); } }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddTask(call)}
                          disabled={!(newTaskText[call.id] || '').trim()}
                          className="h-8 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Completed call: show task summary */}
                {call.tasks && call.tasks.length > 0 && call.status === 'completed' && (
                  <div className="mb-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <ListChecks className="w-3 h-3" />
                      Tasks: {call.tasks.filter(t => t.completed).length}/{call.tasks.length} completed
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 w-full">
                  {canClockIn && (
                                     <Button
                                       size="sm"
                                       onClick={() => clockInMutation.mutate(call)}
                                       disabled={clockInMutation.isPending}
                                       className="bg-green-600 hover:bg-green-700 w-full min-h-[44px] px-4 touch-manipulation"
                                     >
                                       <Play className="w-3 h-3 mr-1" />
                                       Check In
                                     </Button>
                                   )}
                                   {canClockOut && (
                     <Button
                       size="sm"
                       onClick={() => {
                         const incomplete = getIncompleteTasks(call);
                         if (incomplete.length > 0) {
                           setTaskWarningCall(call);
                         } else if (hasCarLog) {
                           clockOutMutation.mutate(call);
                         } else {
                           setClockOutConfirmCall(call);
                         }
                       }}
                       disabled={clockOutMutation.isPending}
                       className="bg-red-600 hover:bg-red-700 w-full min-h-[44px] px-4 touch-manipulation"
                     >
                       <Square className="w-3 h-3 mr-1" />
                       Check Out
                     </Button>
                   )}
                  {(isMyShift || isAdmin) && !hasCarLog && !isOnHold && call.status !== 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCareLogCall(call)}
                        className="gap-1 w-full min-h-[44px] px-4 touch-manipulation"
                      >
                        <FileText className="w-3 h-3" />
                        Care Log
                      </Button>
                    )}
                  {call.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotMyCallConfirm(call)}
                      className="w-full min-h-[44px] px-4 touch-manipulation"
                    >
                      Not My Call
                    </Button>
                  )}
                  {(isMyShift || isAdmin) && !hasCarLog && call.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ callId: call.id, status: 'missed' })}
                      className="w-full min-h-[44px] px-4 touch-manipulation"
                    >
                      Not Home
                    </Button>
                  )}
                  {isAdmin && call.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        toast(`Delete "${call.service_user_name || 'this call'}"?`, {
                          action: {
                            label: 'Delete',
                            onClick: () => deleteCallMutation.mutate(call.id),
                          },
                          cancel: { label: 'Cancel' },
                          duration: 5000,
                        });
                      }}
                      className="w-full min-h-[44px] px-4 touch-manipulation"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isAddModalOpen && (
        <AddCallModal
          shift={shift}
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {isAddClientCallsOpen && (
        <AddClientCallsModal
          shift={shift}
          open={isAddClientCallsOpen}
          onClose={() => setIsAddClientCallsOpen(false)}
        />
      )}

      {careLogCall && (
        <CareLogForm
          shift={shift}
          serviceUser={{ id: careLogCall.service_user_id, full_name: careLogCall.service_user_name }}
          open={!!careLogCall}
          onClose={() => setCareLogCall(null)}
          callId={careLogCall.id}
        />
      )}

      <AlertDialog open={!!clockOutConfirmCall} onOpenChange={(open) => !open && setClockOutConfirmCall(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Check Out Without Care Log?</AlertDialogTitle>
            <AlertDialogDescription>
              No care log has been completed for this call. Are you sure you want to check out? It's recommended to complete a care log to record details about the visit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clockOutMutation.mutate(clockOutConfirmCall);
                setClockOutConfirmCall(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Continue Check Out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!notMyCallConfirm} onOpenChange={(open) => !open && setNotMyCallConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove This Call?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{notMyCallConfirm?.service_user_name}" from your shift. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteCallMutation.mutate(notMyCallConfirm.id);
                setNotMyCallConfirm(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Call
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* "Did you drive to this call?" — shown for EVERY call */}
      <AlertDialog open={!!driveToCallConfirm} onOpenChange={(open) => !open && setDriveToCallConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Did you drive to this call?</AlertDialogTitle>
            <AlertDialogDescription>
              This will record your GPS location for mileage tracking purposes.
              {driveToCallConfirm && !driveToCallConfirm.currentLocation && (
                <span className="block mt-2 text-amber-600 font-medium">
                  GPS location not available. Please enable Location Services in your device settings.
                  Without GPS, fuel mileage cannot be automatically calculated.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel
              onClick={async () => {
                if (driveToCallConfirm?.id) {
                  try {
                    await ShiftCallApi.update(driveToCallConfirm.id, {
                      drove_to_call: false,
                    });
                    queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
                  } catch (err) {
                    console.error('Error saving drive data:', err);
                  }
                }
                setDriveToCallConfirm(null);
              }}
            >
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (driveToCallConfirm?.id) {
                  const coords = driveToCallConfirm.currentLocation;
                  try {
                    await ShiftCallApi.update(driveToCallConfirm.id, {
                      drove_to_call: true,
                      checkin_latitude: coords ? coords.latitude : null,
                      checkin_longitude: coords ? coords.longitude : null,
                    });
                    queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
                  } catch (err) {
                    console.error('Error saving drive data:', err);
                  }
                }
                setDriveToCallConfirm(null);
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Yes, I Drove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Incomplete tasks warning on checkout */}
      <AlertDialog open={!!taskWarningCall} onOpenChange={(open) => !open && setTaskWarningCall(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              Incomplete Tasks
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">The following tasks have not been completed for this call:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                  {taskWarningCall && getIncompleteTasks(taskWarningCall).map((t, i) => (
                    <li key={i}>{t.text}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm">Are you sure you want to check out without completing all tasks?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const call = taskWarningCall;
                setTaskWarningCall(null);
                const callHasLog = careLogs.some(log => log.id === call.care_log_id || (log.shift_call_id === call.id));
                if (callHasLog) {
                  clockOutMutation.mutate(call);
                } else {
                  setClockOutConfirmCall(call);
                }
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Check Out Anyway
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { ShiftCallApi, ShiftApi } from '@/api/rotaApi';
import { resolveCallAddresses, haversineMiles } from '@/lib/addressMileage';
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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SpeechButton from '@/components/ui/SpeechButton';
import { Clock, MapPin, CheckCircle, AlertCircle, Play, Square, Plus, Edit, Trash2, FileText, Car, ListChecks, ClipboardList, User, Users } from 'lucide-react';
import { format } from 'date-fns';
import { notifyAdminsOfActivity } from '@/utils/adminNotifications';
import { toast } from 'sonner';


// Parse sit-in cover metadata from call notes (JSON)
function parseSitinMeta(call) {
  if (call.call_type !== 'sitin_cover') return null;
  try {
    return JSON.parse(call.notes || '{}');
  } catch {
    return { sitin_cover: true, accepted: false };
  }
}

export default function CallManager({ shift, calls, isAdmin, isMyShift, sameDayShifts = [], userId }) {
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
  const [sitinLogCallId, setSitinLogCallId] = useState(null);
  const [sitinLogForm, setSitinLogForm] = useState({ visit_type: 'food_drink', notes: '', service_user_id: '' });

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
    // Sit-in cover calls always appear first
    if (a.call_type === 'sitin_cover' && b.call_type !== 'sitin_cover') return -1;
    if (b.call_type === 'sitin_cover' && a.call_type !== 'sitin_cover') return 1;
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

  // Fetch current user for sitting log attribution
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Check if any sitin_cover calls exist to decide whether to load sitting logs
  const hasSitinCalls = callsToDisplay.some(c => c.call_type === 'sitin_cover');

  // Fetch sitting logs for this shift (only if sitin calls exist)
  const { data: shiftSittingLogs = [] } = useQuery({
    queryKey: ['shiftSittingLogs', shift?.id],
    queryFn: () => base44.entities.SittingLog.filter({ shift_id: shift.id }, '-created_at', 200),
    enabled: !!shift?.id && hasSitinCalls,
  });

  // Fetch all active service users for the sitting log client dropdown
  const { data: allServiceUsers = [] } = useQuery({
    queryKey: ['allActiveServiceUsers'],
    queryFn: () => base44.entities.ServiceUser.filter({ status: 'active' }, 'full_name', 500),
    enabled: hasSitinCalls,
  });


  // Fetch paired shift's calls to show partner progress (without syncing status)
  const { data: pairedShiftCalls = [] } = useQuery({
    queryKey: ['paired-shift-calls', shift?.paired_shift_id],
    queryFn: () => ShiftCallApi.filter({ shift_id: shift.paired_shift_id }, 'scheduled_time', 100),
    enabled: !!shift?.paired_shift_id,
  });

  // Helper: get partner's matching call for a given call (matched by service_user_name + scheduled_time + call_date)
  const getPartnerCall = (call) => {
    if (!shift?.paired_shift_id || pairedShiftCalls.length === 0) return null;
    return pairedShiftCalls.find(pc =>
      pc.scheduled_time === call.scheduled_time &&
      pc.call_date === call.call_date &&
      (pc.service_user_id === call.service_user_id ||
       pc.service_user_name === call.service_user_name)
    ) || null;
  };

  const VISIT_TYPE_LABELS = {
    food_drink: 'Food & Drink',
    mood: 'Mood',
    concerns: 'Concerns',
    compliments: 'Compliments & Complaints',
    healthcare_visit: 'Healthcare Visit',
    social_care_call: 'Social Care Call',
    appointment: 'Appointment',
    social_care_outing: 'Social Care Outing',
  };

  const createSitinLogMutation = useMutation({
    mutationFn: (data) => base44.entities.SittingLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSittingLogs', shift.id] });
      queryClient.invalidateQueries({ queryKey: ['sittingLogs'] });
      setSitinLogForm({ visit_type: 'food_drink', notes: '', service_user_id: sitinLogForm.service_user_id });
      setSitinLogCallId(null);
      toast.success('Sitting log saved');
    },
    onError: (err) => toast.error('Failed to save: ' + (err.message || 'Unknown error')),
  });

  const deleteSitinLogMutation = useMutation({
    mutationFn: (logId) => base44.entities.SittingLog.delete(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSittingLogs', shift.id] });
      queryClient.invalidateQueries({ queryKey: ['sittingLogs'] });
      toast.success('Log deleted');
    },
  });

  const handleSubmitSitinLog = () => {
    if (!sitinLogForm.service_user_id || !sitinLogForm.notes.trim()) {
      toast.error('Please select a client and enter details');
      return;
    }
    const selectedClient = allServiceUsers.find(u => u.id === sitinLogForm.service_user_id);
    createSitinLogMutation.mutate({
      service_user_id: sitinLogForm.service_user_id,
      service_user_name: selectedClient?.full_name || '',
      visit_type: sitinLogForm.visit_type,
      visitor_name: currentUser?.full_name || '',
      visit_date: new Date().toISOString(),
      notes: sitinLogForm.notes,
      recorded_by: currentUser?.id || userId,
      recorded_by_name: currentUser?.full_name || shift?.staff_name || '',
      shift_id: shift.id,
    });
  };

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

      // Notify paired shift partner of check-in (don't sync status — each partner checks in independently)
      if (shift?.paired_shift_id && data.service_user_id) {
        try {
          const pairedShift = await base44.entities.Shift.read(shift.paired_shift_id);
          if (pairedShift?.staff_id && pairedShift.staff_id !== shift.staff_id) {
            base44.functions.invoke('createNotification', {
              recipient_ids: [pairedShift.staff_id],
              type: 'care_log',
              title: `Partner checked in: ${data.service_user_name || 'Client'}`,
              message: `${shift?.staff_name || 'Your partner'} has checked in to ${data.service_user_name}'s call.`,
              priority: 'normal',
              action_url: '/Rota',
              send_push: true,
            }).catch(e => console.warn('Partner checkin notification failed:', e));
          }
        } catch (e) {
          console.warn('Could not notify partner of check-in:', e);
        }
      }

      // Show "Did you drive?" prompt — skip for sit-in cover calls
      if (data.call_type !== 'sitin_cover') {
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

      // Notify paired shift partner of check-out (don't sync status — each partner checks out independently)
      if (shift?.paired_shift_id && data.service_user_id) {
        try {
          const pairedShift = await base44.entities.Shift.read(shift.paired_shift_id);
          if (pairedShift?.staff_id && pairedShift.staff_id !== shift?.staff_id) {
            base44.functions.invoke('createNotification', {
              recipient_ids: [pairedShift.staff_id],
              type: 'care_log',
              title: `Partner completed: ${data.service_user_name || 'Client'}`,
              message: `${shift?.staff_name || 'Your partner'} has checked out of ${data.service_user_name}'s call.`,
              priority: 'normal',
              action_url: '/Rota',
              send_push: true,
            }).catch(e => console.warn('Partner checkout notification failed:', e));
          }
        } catch (e) {
          console.warn('Could not notify partner of check-out:', e);
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
    mutationFn: async (callId) => {
      // First unlink any care logs that reference this shift call
      // (to avoid foreign key constraint violations)
      const { data: linkedLogs } = await supabase
        .from('care_logs')
        .select('id')
        .eq('shift_call_id', callId);
      if (linkedLogs && linkedLogs.length > 0) {
        await supabase
          .from('care_logs')
          .update({ shift_call_id: null })
          .eq('shift_call_id', callId);
      }
      return ShiftCallApi.delete(callId);
    },
    onMutate: (callId) => {
      setFreshCalls(prev => prev.filter(c => c.id !== callId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
      toast.success('Call Removed', { duration: 3000 });
    },
    onError: (err, callId) => {
      // Revert optimistic delete
      setFreshCalls(calls);
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
      console.error('Delete call error:', err);
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

  // Miles display: just show "Drove" — actual mileage total is on the expense record
  // (individual call-to-call distance requires async geocoding which can't run in render)

  const updateStatusMutation = useMutation({
    mutationFn: ({ callId, status }) =>
      ShiftCallApi.update(callId, { status }),
    onMutate: ({ callId, status }) => {
      setFreshCalls(prev => prev.map(c => c.id === callId ? { ...c, status } : c));
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
      if (status === 'missed') {
        toast.success('Marked as Not Home');
      }
    },
    onError: (err, { callId }) => {
      // Revert optimistic update
      setFreshCalls(calls);
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
      console.error('Update status error:', err);
      toast.error(err.message || 'Failed to update call status');
    },
  });

  const notMyCallMutation = useMutation({
    mutationFn: async (call) => {
      // Delete the call from this shift
      await ShiftCallApi.delete(call.id);

      // Notify paired partner that they now own this call
      if (shift?.paired_shift_id && call.service_user_id && call.call_date && call.scheduled_time) {
        try {
          const pairedShift = await base44.entities.Shift.read(shift.paired_shift_id);
          if (pairedShift?.staff_id && pairedShift.staff_id !== shift.staff_id) {
            await base44.functions.invoke('createNotification', {
              recipient_ids: [pairedShift.staff_id],
              type: 'shift_activity',
              title: `Call assigned to you: ${call.service_user_name}`,
              message: `${shift?.staff_name || 'Your partner'} has marked ${call.service_user_name}'s ${call.scheduled_time} call as not theirs. You are now responsible for this call.`,
              priority: 'high',
              action_url: '/Rota',
              send_push: true,
            }).catch(e => console.warn('Partner notification failed:', e));
          }
        } catch (e) {
          console.warn('Could not notify partner:', e);
        }
      }

      // Notify admins
      notifyAdminsOfActivity({
        title: `Call removed: ${call.service_user_name}`,
        message: `${shift?.staff_name || 'Staff'} removed ${call.service_user_name}'s ${call.scheduled_time} call from their shift.`,
        excludeUserId: shift?.staff_id,
      });

      return call.service_user_name;
    },
    onMutate: (call) => {
      setFreshCalls(prev => prev.filter(c => c.id !== call.id));
    },
    onSuccess: (clientName) => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls'] });
      toast.success(`${clientName} removed from your shift`);
      setNotMyCallConfirm(null);
    },
    onError: (err) => {
      setFreshCalls(calls);
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
      toast.error('Failed to remove call: ' + (err.message || 'Unknown error'));
    },
  });

  const acceptSitinMutation = useMutation({
    mutationFn: async (call) => {
      const meta = parseSitinMeta(call);
      // Use the logged-in user's ID, not the viewed shift's staff_id
      const acceptorId = userId || shift?.staff_id;

      // Get the acceptor's actual name
      let acceptorName = shift?.staff_name || 'Staff';
      try {
        const currentUser = await base44.auth.me();
        acceptorName = currentUser?.full_name || currentUser?.name || shift?.staff_name || 'Staff';
      } catch (e) {
        console.warn('Could not fetch current user name:', e);
      }

      const updatedNotes = JSON.stringify({
        ...meta,
        accepted: true,
        accepted_by: acceptorId,
        accepted_by_name: acceptorName,
        accepted_at: new Date().toISOString(),
      });
      const updatedCall = await ShiftCallApi.update(call.id, {
        notes: updatedNotes,
      });

      // Notify admins with acceptor's name
      notifyAdminsOfActivity({
        title: `Sit-in cover accepted`,
        message: `${acceptorName} has accepted the sit-in cover call on ${shift?.staff_name || 'the'} shift.`,
        excludeUserId: acceptorId,
      });

      // Notify paired shift partner if exists
      if (shift?.paired_shift_id) {
        try {
          const allShifts = await ShiftApi.list('-created_date', 500);
          const pairedShift = allShifts.find(s => s.id === shift.paired_shift_id);
          if (pairedShift?.staff_id && pairedShift.staff_id !== acceptorId) {
            await base44.functions.invoke('createNotification', {
              recipient_ids: [pairedShift.staff_id],
              type: 'shift_activity',
              title: 'Partner Accepted Sit-In Cover',
              message: `${acceptorName} has accepted the sit-in cover call.`,
              priority: 'normal',
              action_url: '/Rota',
              send_push: true,
            });
          }
        } catch (e) {
          console.warn('Failed to notify partner:', e);
        }
      }

      // Also notify the shift's assigned staff if they're not the acceptor
      if (shift?.staff_id && shift.staff_id !== acceptorId) {
        try {
          await base44.functions.invoke('createNotification', {
            recipient_ids: [shift.staff_id],
            type: 'shift_activity',
            title: 'Sit-In Cover Accepted On Your Shift',
            message: `${acceptorName} has accepted the sit-in cover call on your shift.`,
            priority: 'normal',
            action_url: '/Rota',
            send_push: true,
          });
        } catch (e) {
          console.warn('Failed to notify shift staff:', e);
        }
      }

      // Sync acceptance to paired shift's matching sitin_cover call
      if (call.call_date && call.scheduled_time) {
        try {
          const matchingCalls = await ShiftCallApi.filter({
            call_date: call.call_date,
            scheduled_time: call.scheduled_time,
          });
          const otherSitinCalls = matchingCalls.filter(c => c.id !== call.id && c.call_type === 'sitin_cover');
          for (const otherCall of otherSitinCalls) {
            const otherMeta = parseSitinMeta(otherCall);
            await ShiftCallApi.update(otherCall.id, {
              notes: JSON.stringify({
                ...otherMeta,
                partner_accepted: true,
                partner_name: acceptorName,
              }),
            });
          }
        } catch (err) {
          console.log('Error syncing sitin acceptance:', err);
        }
      }

      return updatedCall;
    },
    onMutate: (call) => {
      const meta = parseSitinMeta(call);
      const acceptorId = userId || shift?.staff_id;
      const updatedNotes = JSON.stringify({ ...meta, accepted: true, accepted_by: acceptorId, accepted_at: new Date().toISOString() });
      setFreshCalls(prev => prev.map(c => c.id === call.id ? { ...c, notes: updatedNotes } : c));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
      toast.success('Sit-in cover accepted');
    },
    onError: () => {
      setFreshCalls(calls);
      toast.error('Failed to accept sit-in cover');
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
             // Special rendering for sit-in cover calls
             if (call.call_type === 'sitin_cover') {
               const meta = parseSitinMeta(call);
               const isAccepted = meta?.accepted === true;
               const isPartnerAccepted = meta?.partner_accepted === true;
               const acceptedByMe = meta?.accepted_by === shift?.staff_id || meta?.accepted_by === userId;
               const iAccepted = isAccepted && acceptedByMe;
               const partnerDidIt = isPartnerAccepted && !acceptedByMe;
               const canSitinClockIn = iAccepted && (isMyShift || isAdmin) && !call.clock_in_time && call.status !== 'completed';
               const canSitinClockOut = iAccepted && (isMyShift || isAdmin) && call.clock_in_time && !call.clock_out_time && call.status !== 'completed';

               return (
                 <Card key={call.id} className={`p-4 hover:shadow-md transition-shadow border-2 ${isAccepted ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                   <div className="flex items-start justify-between mb-3">
                     <div className="flex items-start gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${isAccepted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                         {index + 1}
                       </div>
                       <div>
                         <h4 className="font-semibold text-slate-900">Sit-in Required On Shift</h4>
                         <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                           <Clock className="w-3 h-3" />
                           {meta?.time_on || call.scheduled_time} - {meta?.time_off || ''}
                           {call.duration_minutes ? ` (${call.duration_minutes}min)` : ''}
                         </p>
                         <Badge variant="outline" className="mt-1 text-xs py-0 px-1.5 border-amber-300 text-amber-700">
                           Sit-in Cover
                         </Badge>
                       </div>
                     </div>
                     <Badge className={isAccepted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                       {isAccepted ? 'Accepted' : 'Pending'}
                     </Badge>
                   </div>

                   {call.clock_in_time && (
                     <div className="text-xs text-slate-600 space-y-1 mb-3">
                       <p>Checked in: {format(new Date(call.clock_in_time), 'HH:mm')}</p>
                       {call.clock_out_time && (
                         <p>Checked out: {format(new Date(call.clock_out_time), 'HH:mm')}</p>
                       )}
                     </div>
                   )}

                   <div className="grid grid-cols-1 gap-2 w-full">
                     {!isAccepted && !partnerDidIt && (isMyShift || isAdmin) && (
                       <Button
                         size="sm"
                         onClick={() => acceptSitinMutation.mutate(call)}
                         disabled={acceptSitinMutation.isPending}
                         className="bg-amber-500 hover:bg-amber-600 text-white w-full min-h-[44px] px-4 touch-manipulation"
                       >
                         Accept Sit-in Call?
                       </Button>
                     )}
                     {partnerDidIt && (
                       <div className="text-center p-3 bg-green-100 rounded-lg">
                         <p className="text-sm font-semibold text-green-700">
                           Partner Accepted This Call
                         </p>
                         <p className="text-xs text-green-600 mt-1">
                           {meta?.partner_name || 'Partner'} has accepted the sit-in cover
                         </p>
                       </div>
                     )}
                     {iAccepted && (
                       <div className="text-center p-2 bg-green-100 rounded-lg">
                         <p className="text-sm font-medium text-green-700">You accepted this sit-in cover</p>
                       </div>
                     )}
                     {canSitinClockIn && (
                       <Button
                         size="sm"
                         onClick={() => clockInMutation.mutate(call)}
                         disabled={clockInMutation.isPending}
                         className="bg-green-600 hover:bg-green-700 w-full min-h-[44px] px-4 touch-manipulation"
                       >
                         <Play className="w-3 h-3 mr-1" />
                         Check In (Sit-In)
                       </Button>
                     )}
                     {canSitinClockOut && (
                       <Button
                         size="sm"
                         onClick={() => clockOutMutation.mutate(call)}
                         disabled={clockOutMutation.isPending}
                         className="bg-red-600 hover:bg-red-700 w-full min-h-[44px] px-4 touch-manipulation"
                       >
                         <Square className="w-3 h-3 mr-1" />
                         Check Out (Sit-In)
                       </Button>
                     )}
                     {/* Sitting Log button — visible after acceptance */}
                     {(isAccepted || isPartnerAccepted) && (isMyShift || isAdmin) && sitinLogCallId !== call.id && (
                       <Button
                         size="sm"
                         onClick={() => {
                           setSitinLogCallId(call.id);
                           setSitinLogForm({ visit_type: 'food_drink', notes: '', service_user_id: '' });
                         }}
                         className="bg-teal-600 hover:bg-teal-700 w-full min-h-[44px] px-4 touch-manipulation"
                       >
                         <ClipboardList className="w-3 h-3 mr-1" />
                         Sitting Log
                       </Button>
                     )}
                     {isAdmin && call.status !== 'completed' && (
                       <Button
                         size="sm"
                         variant="ghost"
                         onClick={() => {
                           toast('Remove sit-in cover from this shift?', {
                             action: {
                               label: 'Remove',
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

                   {/* Inline Sitting Log Form */}
                   {sitinLogCallId === call.id && (
                     <div className="mt-3 p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-3">
                       <h4 className="font-semibold text-slate-900 text-sm">New Sitting Log Entry</h4>
                       <div>
                         <label className="text-sm font-medium text-slate-700 mb-1 block">Client</label>
                         <Select value={sitinLogForm.service_user_id} onValueChange={(v) => setSitinLogForm(prev => ({ ...prev, service_user_id: v }))}>
                           <SelectTrigger>
                             <SelectValue placeholder="Select client" />
                           </SelectTrigger>
                           <SelectContent>
                             {allServiceUsers.map(u => (
                               <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <label className="text-sm font-medium text-slate-700 mb-1 block">Entry Type</label>
                         <Select value={sitinLogForm.visit_type} onValueChange={(v) => setSitinLogForm(prev => ({ ...prev, visit_type: v }))}>
                           <SelectTrigger>
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="food_drink">Food & Drink Log</SelectItem>
                             <SelectItem value="mood">Mood Log</SelectItem>
                             <SelectItem value="concerns">Concerns Log</SelectItem>
                             <SelectItem value="compliments">Compliments & Complaints Log</SelectItem>
                             <SelectItem value="healthcare_visit">Healthcare Visit</SelectItem>
                             <SelectItem value="social_care_call">Social Care Call</SelectItem>
                             <SelectItem value="appointment">Appointment</SelectItem>
                             <SelectItem value="social_care_outing">Social Care Outing</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <label className="text-sm font-medium text-slate-700 mb-1 block">Details</label>
                         <div className="flex gap-2">
                           <Textarea
                             placeholder="Enter details..."
                             value={sitinLogForm.notes}
                             onChange={(e) => setSitinLogForm(prev => ({ ...prev, notes: e.target.value }))}
                             className="h-24 flex-1"
                           />
                           <SpeechButton
                             onResult={(text) => setSitinLogForm(prev => ({ ...prev, notes: (prev.notes || '') + ' ' + text }))}
                             className="h-12 px-3"
                           />
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <Button
                           onClick={handleSubmitSitinLog}
                           disabled={createSitinLogMutation.isPending}
                           className="flex-1 min-h-[44px] touch-manipulation"
                         >
                           {createSitinLogMutation.isPending ? 'Saving...' : 'Save Sitting Log'}
                         </Button>
                         <Button variant="outline" onClick={() => setSitinLogCallId(null)} className="flex-1 min-h-[44px] touch-manipulation">
                           Cancel
                         </Button>
                       </div>
                     </div>
                   )}

                   {/* Existing sitting logs for this shift */}
                   {shiftSittingLogs.length > 0 && (
                     <div className="mt-3 space-y-2">
                       <p className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                         <ClipboardList className="w-3 h-3" />
                         Sitting Logs ({shiftSittingLogs.filter(l => !l.is_daily_report).length})
                       </p>
                       {shiftSittingLogs.filter(l => !l.is_daily_report).map(log => (
                         <div key={log.id} className="p-2 bg-white border border-slate-200 rounded text-sm">
                           <div className="flex items-start justify-between">
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 flex-wrap mb-1">
                                 <span className="font-medium text-slate-900 text-xs truncate">{log.service_user_name}</span>
                                 <Badge variant="outline" className="text-[10px] py-0 px-1">
                                   {VISIT_TYPE_LABELS[log.visit_type] || log.visit_type}
                                 </Badge>
                               </div>
                               <p className="text-xs text-slate-700 whitespace-pre-wrap line-clamp-2">{log.notes}</p>
                               <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                                 <span className="flex items-center gap-1">
                                   <Clock className="w-2.5 h-2.5" />
                                   {format(new Date(log.visit_date), 'HH:mm')}
                                 </span>
                                 <span className="flex items-center gap-1">
                                   <User className="w-2.5 h-2.5" />
                                   {log.recorded_by_name}
                                 </span>
                               </div>
                             </div>
                             {(isAdmin || isMyShift) && (
                               <Button
                                 variant="ghost"
                                 size="sm"
                                 onClick={() => deleteSitinLogMutation.mutate(log.id)}
                                 disabled={deleteSitinLogMutation.isPending}
                                 className="text-red-400 hover:text-red-600 flex-shrink-0 h-6 w-6 p-0"
                               >
                                 <Trash2 className="w-3 h-3" />
                               </Button>
                             )}
                           </div>
                         </div>
                       ))}
                     </div>
                   )}
                 </Card>
               );
             }

             const serviceUser = serviceUsers.find(su => su.id === call.service_user_id);
             const isOnHold = serviceUser?.status === 'on_hold';
             const canClockIn = (isMyShift || isAdmin) && !call.clock_in_time && (call.status === 'pending' || call.status === 'in_progress') && !isOnHold;
             const canClockOut = (isMyShift || isAdmin) && call.clock_in_time && !call.clock_out_time && call.status === 'in_progress' && !isOnHold;
             const hasCarLog = careLogs.some(log => log.id === call.care_log_id || (log.shift_call_id === call.id));
             const partnerHasLog = shift?.paired_shift_id && careLogs.some(
               log => log.shift_id === shift.paired_shift_id && log.service_user_id === call.service_user_id
             );


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
                    {call.drove_to_call ? (
                      <>
                        <span className="text-green-600">Drove to call</span>
                        {call.call_mileage > 0 && (
                          <span className="text-teal-600 font-medium ml-1">({call.call_mileage} mi)</span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">Did not drive</span>
                    )}
                  </div>
                )}

                {/* Partner status indicator for paired shifts */}
                {shift?.paired_shift_id && (() => {
                  const partnerCall = getPartnerCall(call);
                  const partnerHasLog = careLogs.some(
                    log => log.shift_id === shift.paired_shift_id && log.service_user_id === call.service_user_id
                  );
                  if (!partnerCall) return null;
                  const parts = [];
                  if (partnerCall.clock_in_time) parts.push('Checked in');
                  if (partnerHasLog) parts.push('Log done');
                  if (partnerCall.clock_out_time) parts.push('Checked out');
                  if (parts.length === 0) return null;
                  return (
                    <div className="text-xs mb-3 flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      <Users className="w-3 h-3" />
                      <span>Partner: {parts.join(' · ')}</span>
                    </div>
                  );
                })()}

                {call.notes && call.call_type !== 'sitin_cover' && (
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
                         } else if (hasCarLog || partnerHasLog) {
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
                  {(isMyShift || isAdmin) && !hasCarLog && !partnerHasLog && !isOnHold && call.status !== 'completed' && (
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
                  {!hasCarLog && partnerHasLog && call.status !== 'completed' && (
                    <div className="col-span-2 text-xs text-purple-700 bg-purple-50 px-3 py-2 rounded flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      Partner Has Filled In The Log For This Call
                    </div>
                  )}
                  {(isMyShift || isAdmin) && call.status !== 'completed' && !shift?.paired_shift_id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setNotMyCallConfirm(call)}
                      className="w-full min-h-[44px] px-4 touch-manipulation"
                    >
                      Not My Call
                    </Button>
                  )}
                  {(isMyShift || isAdmin) && !hasCarLog && !partnerHasLog && call.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ callId: call.id, status: 'missed' })}
                      className="w-full min-h-[44px] px-4 touch-manipulation"
                    >
                      Not Home
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCallMutation.mutate(call.id)}
                      disabled={deleteCallMutation.isPending}
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
          scheduledTime={careLogCall.scheduled_time}
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

      {/* Not My Call confirmation dialog */}
      <AlertDialog open={!!notMyCallConfirm} onOpenChange={(open) => !open && setNotMyCallConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove This Call?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{notMyCallConfirm?.service_user_name}</strong> from your shift. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => notMyCallMutation.mutate(notMyCallConfirm)}
              disabled={notMyCallMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {notMyCallMutation.isPending ? 'Removing...' : 'Remove Call'}
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
              This will record mileage for fuel expense tracking.
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

                    // Calculate mileage from addresses of all drove_to_call check-ins
                    const allShiftCalls = await ShiftCallApi.filter(
                      { shift_id: shift?.id },
                      'created_at',
                      100
                    );
                    const droveCalls = allShiftCalls
                      .filter(c => c.drove_to_call === true)
                      .sort((a, b) => new Date(a.clock_in_time) - new Date(b.clock_in_time));

                    // Look up postcodes from service_users table (postcodes are in separate column)
                    const suIds = [...new Set(droveCalls.map(c => c.service_user_id).filter(Boolean))];
                    if (suIds.length > 0) {
                      const { data: sus } = await supabase
                        .from('service_users')
                        .select('id, postcode')
                        .in('id', suIds);
                      const pcMap = {};
                      for (const su of (sus || [])) {
                        if (su.postcode) pcMap[su.id] = su.postcode.trim();
                      }
                      for (const call of droveCalls) {
                        if (call.service_user_id && pcMap[call.service_user_id]) {
                          call.service_user_address = pcMap[call.service_user_id];
                        }
                      }
                    }

                    const droveWithAddr = droveCalls.filter(c => c.service_user_address);
                    if (droveWithAddr.length >= 2) {
                      const resolved = await resolveCallAddresses(droveWithAddr);

                      if (resolved.length >= 2) {
                        let totalMiles = 0;
                        // Calculate per-leg distance and store on each call
                        for (let i = 0; i < resolved.length - 1; i++) {
                          const legMiles = haversineMiles(
                            resolved[i].resolvedLat, resolved[i].resolvedLng,
                            resolved[i + 1].resolvedLat, resolved[i + 1].resolvedLng
                          );
                          totalMiles += legMiles;
                          // Store individual mileage on the destination call
                          const legRounded = Math.round(legMiles * 100) / 100;
                          if (legRounded > 0) {
                            await ShiftCallApi.update(resolved[i + 1].id, {
                              call_mileage: legRounded,
                            });
                          }
                        }
                        if (totalMiles > 0.1) {
                          await base44.functions.invoke('createShiftMileageExpense', {
                            shiftId: shift?.id,
                            totalMiles: Math.round(totalMiles * 100) / 100
                          });
                        }
                      }
                    }
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

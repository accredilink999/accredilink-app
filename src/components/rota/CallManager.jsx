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
import { Clock, MapPin, CheckCircle, AlertCircle, Play, Square, Plus, Edit, Trash2, FileText, Car, ListChecks, ClipboardList, User, Users, Home, XCircle, SkipForward, ChevronDown, Timer } from 'lucide-react';
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
  const [deleteConfirmCallId, setDeleteConfirmCallId] = useState(null);
  const [holdExpiredConfirm, setHoldExpiredConfirm] = useState(null);
  const [expandedCallId, setExpandedCallId] = useState(null);
  const [logCompletorCall, setLogCompletorCall] = useState(null);
  const [delayCall, setDelayCall] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState('');

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

      // Auto-check-in the partner's matching call and notify them
      if (shift?.paired_shift_id && data.service_user_id) {
        try {
          const pairedShift = await base44.entities.Shift.read(shift.paired_shift_id);
          if (pairedShift?.staff_id && pairedShift.staff_id !== shift.staff_id) {
            // Find and auto-check-in the partner's matching call if it's still pending
            const partnerCalls = await ShiftCallApi.filter({ shift_id: pairedShift.id }, 'scheduled_time', 100);
            const partnerMatch = partnerCalls.find(pc =>
              pc.scheduled_time === data.scheduled_time &&
              pc.call_date === data.call_date &&
              (pc.service_user_id === data.service_user_id || pc.service_user_name === data.service_user_name) &&
              pc.status === 'pending' && !pc.clock_in_time
            );
            if (partnerMatch) {
              await ShiftCallApi.update(partnerMatch.id, {
                clock_in_time: new Date().toISOString(),
                status: 'in_progress',
              });
              queryClient.invalidateQueries({ queryKey: ['paired-shift-calls', shift.paired_shift_id] });
            }
            // Notify the partner
            base44.functions.invoke('createNotification', {
              recipient_ids: [pairedShift.staff_id],
              type: 'care_log',
              title: `Checked in: ${data.service_user_name || 'Client'}`,
              message: `${shift?.staff_name || 'Your partner'} has checked in to ${data.service_user_name}'s call — your call has also been marked in progress.`,
              priority: 'normal',
              action_url: '/Rota',
              send_push: true,
            }).catch(e => console.warn('Partner checkin notification failed:', e));
          }
        } catch (e) {
          console.warn('Could not auto-check-in partner call:', e);
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
        areaId: shift?.rota_area_id || shift?.area_id,
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
        areaId: shift?.rota_area_id || shift?.area_id,
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
      if (status === 'not_at_home') {
        toast.success('Marked as Not at Home');
      } else if (status === 'missed') {
        toast.success('Marked as Missed');
      } else if (status === 'completed') {
        toast.success('Call marked as complete');
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

  // Decrement temporary hold counter for on-hold service users
  const decrementHoldMutation = useMutation({
    mutationFn: async ({ serviceUserId, serviceUserName, currentRemaining }) => {
      const newRemaining = currentRemaining - 1;
      if (newRemaining <= 0) {
        // Hold expired: revert to active
        await base44.entities.ServiceUser.update(serviceUserId, {
          status: 'active',
          hold_type: 'permanent',
          hold_remaining_calls: null
        });
        return { expired: true, serviceUserName };
      } else {
        // Decrement the counter
        await base44.entities.ServiceUser.update(serviceUserId, {
          hold_remaining_calls: newRemaining
        });
        // Warn on last held call
        if (newRemaining === 1) {
          toast.warning(`Last held call for ${serviceUserName} - hold will expire after the next call`);
        }
        return { expired: false, remaining: newRemaining, serviceUserName };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
      if (result.expired) {
        toast.success(`Hold period ended for ${result.serviceUserName} - status reverted to Active`);
        setHoldExpiredConfirm(result.serviceUserName);
      }
    },
    onError: (err) => {
      console.error('Failed to decrement hold:', err);
      toast.error('Failed to update hold status');
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
        areaId: shift?.rota_area_id || shift?.area_id,
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
        areaId: shift?.rota_area_id || shift?.area_id,
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

  const handlePartnerCompletingLog = async (call) => {
    try {
      await ShiftCallApi.update(call.id, {
        clock_out_time: new Date().toISOString(),
        status: 'completed',
      });
      setFreshCalls(prev => prev.map(c => c.id === call.id
        ? { ...c, status: 'completed', clock_out_time: new Date().toISOString() }
        : c));

      const partnerCall = getPartnerCall(call);
      if (partnerCall) {
        await supabase.from('shift_calls').update({ log_required: true }).eq('id', partnerCall.id);
        if (shift?.paired_shift_id) {
          try {
            const pairedShift = await base44.entities.Shift.read(shift.paired_shift_id);
            if (pairedShift?.staff_id && pairedShift.staff_id !== shift?.staff_id) {
              base44.functions.invoke('createNotification', {
                recipient_ids: [pairedShift.staff_id],
                type: 'care_log',
                title: `Care log required: ${call.service_user_name}`,
                message: `${shift?.staff_name || 'Your partner'} has checked out of ${call.service_user_name}'s call. You must complete the care log before continuing.`,
                priority: 'high',
                action_url: '/Rota',
                send_push: true,
              }).catch(e => console.warn('Log required notification failed:', e));
            }
          } catch (e) {
            console.warn('Could not notify partner of log requirement:', e);
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
      if (shift?.paired_shift_id) {
        queryClient.invalidateQueries({ queryKey: ['paired-shift-calls', shift.paired_shift_id] });
      }
      toast.success('Call complete — your partner will fill the care log');
    } catch (err) {
      console.error('Error completing call:', err);
      toast.error('Failed to complete call');
    }
  };

  const reportDelayMutation = useMutation({
    mutationFn: async ({ call, minutes }) => {
      const delayUntil = new Date(Date.now() + parseInt(minutes) * 60 * 1000).toISOString();
      await ShiftCallApi.update(call.id, {
        delay_until: delayUntil,
        overdue_alert_sent_at: new Date().toISOString(),
      });
      notifyAdminsOfActivity({
        title: `⏱ Delayed check-in: ${call.service_user_name}`,
        message: `${shift?.staff_name || 'Staff'} is running ${minutes} minutes late to ${call.service_user_name}'s ${call.scheduled_time} call.`,
        excludeUserId: shift?.staff_id,
        areaId: shift?.rota_area_id || shift?.area_id,
      });
      if (shift?.paired_shift_id) {
        try {
          const pairedShift = await base44.entities.Shift.read(shift.paired_shift_id);
          if (pairedShift?.staff_id && pairedShift.staff_id !== shift?.staff_id) {
            base44.functions.invoke('createNotification', {
              recipient_ids: [pairedShift.staff_id],
              type: 'shift_activity',
              title: `Partner delayed: ${call.service_user_name}`,
              message: `${shift?.staff_name || 'Your partner'} is running ${minutes} minutes late to ${call.service_user_name}'s ${call.scheduled_time} call.`,
              priority: 'high',
              action_url: '/Rota',
              send_push: true,
            }).catch(e => console.warn('Partner delay notification failed:', e));
          }
        } catch (e) {
          console.warn('Could not notify partner of delay:', e);
        }
      }
      return delayUntil;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });
      toast.success("Delay reported — you'll be re-alerted when the time expires");
      setDelayCall(null);
      setDelayMinutes('');
    },
    onError: (err) => toast.error('Failed to report delay: ' + (err.message || 'Unknown error')),
  });

  const handleNotAtHome = async (call) => {
    updateStatusMutation.mutate({ callId: call.id, status: 'not_at_home' });
    const partnerCall = getPartnerCall(call);
    if (partnerCall) {
      try {
        await ShiftCallApi.update(partnerCall.id, { status: 'not_at_home' });
        queryClient.invalidateQueries({ queryKey: ['paired-shift-calls', shift.paired_shift_id] });
        if (shift?.paired_shift_id) {
          const pairedShift = await base44.entities.Shift.read(shift.paired_shift_id);
          if (pairedShift?.staff_id && pairedShift.staff_id !== shift?.staff_id) {
            base44.functions.invoke('createNotification', {
              recipient_ids: [pairedShift.staff_id],
              type: 'shift_activity',
              title: `Client not home: ${call.service_user_name}`,
              message: `${shift?.staff_name || 'Your partner'} marked ${call.service_user_name} as not at home — your call has been updated automatically.`,
              priority: 'normal',
              action_url: '/Rota',
              send_push: true,
            }).catch(e => console.warn('Partner not-at-home notification failed:', e));
          }
        }
      } catch (e) {
        console.warn('Failed to update partner call to not_at_home:', e);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_at_home': return 'bg-amber-100 text-amber-800';
      case 'missed': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Play className="w-4 h-4" />;
      case 'not_at_home': return <MapPin className="w-4 h-4" />;
      case 'missed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // The currently active (in-progress + clocked-in, not yet complete) call — locks other pending calls
  const activeInProgressCall = (freshCalls || calls).find(
    c => c.status === 'in_progress' && !!c.clock_in_time && !c.clock_out_time
  ) || null;

  // If any of MY own calls have log_required set (partner said I'm filling it), block the whole UI
  const pendingLogCalls = isMyShift
    ? (freshCalls || calls).filter(c => c.log_required === true && !c.care_log_id)
    : [];

  return (
    <div className="space-y-4">
      {isMyShift && pendingLogCalls.length > 0 && !careLogCall && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <p className="text-sm font-medium text-orange-800 truncate">
              Care log needed: <strong>{pendingLogCalls[0].service_user_name}</strong>
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              const call = pendingLogCalls[0];
              try { localStorage.removeItem(`draft:careLog:${shift?.id || 'new'}`); } catch (e) {}
              if (!call.clock_out_time) {
                ShiftCallApi.update(call.id, { clock_out_time: new Date().toISOString() })
                  .catch(e => console.warn('Clock out failed:', e));
              }
              setTimeout(() => setCareLogCall(call), 80);
            }}
            className="bg-orange-600 hover:bg-orange-700 flex-shrink-0"
          >
            Fill Log
          </Button>
        </div>
      )}
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
             const matchedPartnerCall = shift?.paired_shift_id ? getPartnerCall(call) : null;
             const partnerHasLog = shift?.paired_shift_id && matchedPartnerCall && careLogs.some(
               log => log.shift_id === shift.paired_shift_id &&
                 log.service_user_id === call.service_user_id &&
                 (log.shift_call_id === matchedPartnerCall.id || (!log.shift_call_id && log.visit_time === call.scheduled_time))
             );


             const getCardBackground = () => {
               if (isOnHold) return 'bg-gray-100 opacity-50';
               if (call.status === 'completed') return 'bg-green-50';
               if (call.status === 'not_at_home') return 'bg-amber-50';
               if (call.status === 'missed') return 'bg-red-50';

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
                      <Badge className="bg-amber-500 text-white">
                        {serviceUser?.hold_type === 'temporary' && serviceUser?.hold_remaining_calls > 0
                          ? `On Hold (${serviceUser.hold_remaining_calls} call${serviceUser.hold_remaining_calls !== 1 ? 's' : ''} remaining)`
                          : 'On Hold'}
                      </Badge>
                    )}
                    <Badge className={getStatusColor(call.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(call.status)}
                        {call.status === 'not_at_home' ? 'not at home' : call.status}
                      </span>
                    </Badge>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteConfirmCallId(call.id)}
                        className="text-slate-300 hover:text-red-400 transition-colors p-1 touch-manipulation"
                        title="Delete call"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
                  if (!matchedPartnerCall) return null;
                  const parts = [];
                  if (matchedPartnerCall.clock_in_time) parts.push('Checked in');
                  if (partnerHasLog) parts.push('Log done');
                  if (matchedPartnerCall.clock_out_time) parts.push('Checked out');
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

                {!hasCarLog && partnerHasLog && call.status !== 'completed' && (
                    <div className="mb-3 text-xs text-purple-700 bg-purple-50 px-3 py-2 rounded flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 flex-shrink-0" />
                      Partner Has Filled In The Log For This Call
                    </div>
                  )}
                {/* Intelligent status bar — replaces all individual action buttons */}
                {(isMyShift || isAdmin) && (() => {
                  const isPending = call.status === 'pending' || (call.status === 'in_progress' && !call.clock_in_time);
                  const isInProgress = call.status === 'in_progress' && !!call.clock_in_time;
                  const isComplete = call.status === 'completed';
                  const isNotHome = call.status === 'not_at_home';
                  const isMissed = call.status === 'missed';
                  const isExpanded = expandedCallId === call.id;

                  // Lock pending calls while another call is in progress and awaiting completion
                  const isLockedByActiveCall = isMyShift && isPending && activeInProgressCall && activeInProgressCall.id !== call.id;
                  if (isLockedByActiveCall) {
                    return (
                      <div className="w-full py-4 px-5 bg-slate-100 text-slate-500 font-semibold text-base rounded-xl flex items-center gap-3 mt-1 border border-slate-200">
                        <Square className="w-5 h-5 flex-shrink-0 text-slate-400" />
                        <span className="text-sm">Complete <strong>{activeInProgressCall.service_user_name}</strong>'s call first</span>
                      </div>
                    );
                  }

                  if (isOnHold) {
                    return (
                      <div>
                        <div className="w-full py-4 px-5 bg-slate-200 text-slate-600 font-semibold text-base rounded-xl flex items-center gap-3 mt-1">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <span>Client On Hold</span>
                        </div>
                        {isAdmin && serviceUser?.hold_type === 'temporary' && serviceUser?.hold_remaining_calls > 0 && (
                          <button
                            onClick={() => decrementHoldMutation.mutate({
                              serviceUserId: serviceUser.id,
                              serviceUserName: call.service_user_name,
                              currentRemaining: serviceUser.hold_remaining_calls,
                            })}
                            disabled={decrementHoldMutation.isPending}
                            className="mt-2 w-full py-3.5 px-4 bg-amber-50 border border-amber-200 text-amber-700 font-semibold rounded-xl flex items-center gap-3 active:scale-[0.99] touch-manipulation disabled:opacity-50 transition-all"
                          >
                            <SkipForward className="w-4 h-4 flex-shrink-0" />
                            Skip Call (Decrement Hold)
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (isComplete) {
                    return (
                      <div className="w-full py-4 px-5 bg-green-500 text-white font-semibold text-base rounded-xl flex items-center gap-3 mt-1">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Call Complete</span>
                      </div>
                    );
                  }

                  if (isNotHome) {
                    return (
                      <div className="w-full py-4 px-5 bg-green-500 text-white font-semibold text-base rounded-xl flex items-center gap-3 mt-1">
                        <Home className="w-5 h-5 flex-shrink-0" />
                        <span>Client Not Home</span>
                      </div>
                    );
                  }

                  if (isMissed) {
                    return (
                      <div className="w-full py-4 px-5 bg-red-100 text-red-800 font-semibold text-base rounded-xl flex items-center gap-3 mt-1">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>Call Missed</span>
                      </div>
                    );
                  }

                  if (isPending) {
                    const isOverdue = (() => {
                      if (!call.scheduled_time || !call.call_date) return false;
                      if (call.delay_until && new Date(call.delay_until) > new Date()) return false;
                      const [h, m] = call.scheduled_time.split(':').map(Number);
                      const sched = new Date(call.call_date);
                      sched.setHours(h, m, 0, 0);
                      return Date.now() > sched.getTime() + 15 * 60 * 1000;
                    })();

                    // Partner is already at this call — show amber "Check In Too?" bar
                    const partnerIsInProgress = matchedPartnerCall?.status === 'in_progress' && !!matchedPartnerCall?.clock_in_time;
                    if (partnerIsInProgress) {
                      return (
                        <div className="mt-1">
                          <button
                            onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                            className="w-full py-4 px-5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-semibold text-base rounded-xl flex items-center justify-between transition-all touch-manipulation"
                          >
                            <span className="flex items-center gap-3">
                              <Users className="w-5 h-5 flex-shrink-0" />
                              Partner In Progress — Check In Too?
                            </span>
                            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                          {isExpanded && (
                            <div className="mt-2">
                              <button
                                onClick={() => { clockInMutation.mutate(call); setExpandedCallId(null); }}
                                disabled={clockInMutation.isPending}
                                className="w-full py-3.5 px-4 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-xl flex items-center gap-3 active:scale-[0.99] touch-manipulation disabled:opacity-50 transition-all"
                              >
                                <Play className="w-4 h-4 flex-shrink-0" />
                                Check In to Call
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div className="mt-1">
                        <button
                          onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                          className={`w-full py-4 px-5 text-white font-semibold text-base rounded-xl flex items-center justify-between transition-all touch-manipulation ${
                            isOverdue
                              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                              : 'bg-blue-500 hover:bg-blue-600 active:scale-[0.99]'
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            {isOverdue
                              ? <AlertCircle className="w-5 h-5 flex-shrink-0" />
                              : <Clock className="w-5 h-5 flex-shrink-0" />}
                            {isOverdue ? '⚠ Overdue — Action Required' : 'Pending Check In'}
                          </span>
                          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="mt-2 space-y-2">
                            <button
                              onClick={() => { clockInMutation.mutate(call); setExpandedCallId(null); }}
                              disabled={clockInMutation.isPending}
                              className="w-full py-3.5 px-4 bg-green-50 border border-green-200 text-green-700 font-semibold rounded-xl flex items-center gap-3 active:scale-[0.99] touch-manipulation disabled:opacity-50 transition-all"
                            >
                              <Play className="w-4 h-4 flex-shrink-0" />
                              Check In to Call
                            </button>
                            {isOverdue && (
                              <button
                                onClick={() => { setDelayCall(call); setExpandedCallId(null); }}
                                className="w-full py-3.5 px-4 bg-amber-50 border border-amber-200 text-amber-700 font-semibold rounded-xl flex items-center gap-3 active:scale-[0.99] touch-manipulation transition-all"
                              >
                                <Timer className="w-4 h-4 flex-shrink-0" />
                                Report a Delay
                              </button>
                            )}
                            <button
                              onClick={() => { handleNotAtHome(call); setExpandedCallId(null); }}
                              className="w-full py-3.5 px-4 bg-amber-50 border border-amber-200 text-amber-700 font-semibold rounded-xl flex items-center gap-3 active:scale-[0.99] touch-manipulation transition-all"
                            >
                              <Home className="w-4 h-4 flex-shrink-0" />
                              Client Not Home
                            </button>
                            <button
                              onClick={() => { setNotMyCallConfirm(call); setExpandedCallId(null); }}
                              className="w-full py-3.5 px-4 bg-red-50 border border-red-200 text-red-700 font-semibold rounded-xl flex items-center gap-3 active:scale-[0.99] touch-manipulation transition-all"
                            >
                              <XCircle className="w-4 h-4 flex-shrink-0" />
                              Remove This Call from My List
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (isInProgress) {
                    return (
                      <div className="mt-1">
                        <button
                          onClick={() => setExpandedCallId(isExpanded ? null : call.id)}
                          className="w-full py-4 px-5 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white font-semibold text-base rounded-xl flex items-center justify-between transition-all touch-manipulation"
                        >
                          <span className="flex items-center gap-3">
                            <Play className="w-5 h-5 flex-shrink-0" />
                            Call In Progress • Check Out?
                          </span>
                          <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && (
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                setExpandedCallId(null);
                                try { localStorage.removeItem(`draft:careLog:${shift?.id || 'new'}`); } catch (e) {}
                                const incomplete = getIncompleteTasks(call);
                                const capturedCall = call;
                                setTimeout(() => {
                                  if (incomplete.length > 0) {
                                    setTaskWarningCall(capturedCall);
                                  } else if (shift?.paired_shift_id) {
                                    setLogCompletorCall(capturedCall);
                                  } else {
                                    setCareLogCall(capturedCall);
                                  }
                                }, 80);
                              }}
                              className="w-full py-3.5 px-4 bg-blue-50 border border-blue-200 text-blue-700 font-semibold rounded-xl flex items-center gap-3 active:scale-[0.99] touch-manipulation transition-all"
                            >
                              <FileText className="w-4 h-4 flex-shrink-0" />
                              Complete Call &amp; Fill Log
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })()}
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

      {/* Delete call confirmation dialog */}
      <AlertDialog open={!!deleteConfirmCallId} onOpenChange={(open) => !open && setDeleteConfirmCallId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete This Call?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this call? This action cannot be undone. Any linked care logs will be unlinked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteCallMutation.mutate(deleteConfirmCallId);
                setDeleteConfirmCallId(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
                    // 1. Mark this call as drove
                    await ShiftCallApi.update(driveToCallConfirm.id, {
                      drove_to_call: true,
                      checkin_latitude: coords ? coords.latitude : null,
                      checkin_longitude: coords ? coords.longitude : null,
                    });
                    queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });

                    // 2. Get this call's postcode
                    const thisCallSuId = driveToCallConfirm.service_user_id;
                    let thisPostcode = null;
                    if (thisCallSuId) {
                      const { data: suData } = await supabase
                        .from('service_users')
                        .select('postcode')
                        .eq('id', thisCallSuId)
                        .single();
                      thisPostcode = suData?.postcode?.trim()?.toUpperCase() || null;
                    }

                    // 3. Find THIS USER's previous "I drove" call TODAY across ALL their shifts
                    const todayStr = format(new Date(), 'yyyy-MM-dd');
                    const staffId = shift?.staff_id || userId;
                    // Get all shifts for this staff member today
                    const { data: todayShifts } = await supabase
                      .from('shifts')
                      .select('id')
                      .eq('staff_id', staffId)
                      .eq('date', todayStr);
                    const todayShiftIds = (todayShifts || []).map(s => s.id);

                    let allDroveCalls = [];
                    for (const sid of todayShiftIds) {
                      const calls = await ShiftCallApi.filter({ shift_id: sid }, 'clock_in_time', 200);
                      allDroveCalls = allDroveCalls.concat(
                        calls.filter(c => c.drove_to_call === true && c.id !== driveToCallConfirm.id)
                      );
                    }
                    allDroveCalls.sort((a, b) =>
                      new Date(a.clock_in_time || a.scheduled_time || 0) - new Date(b.clock_in_time || b.scheduled_time || 0)
                    );

                    // 4. Calculate distance from previous drove point to this one
                    const prevDrove = allDroveCalls.length > 0 ? allDroveCalls[allDroveCalls.length - 1] : null;
                    let legMiles = 0;

                    if (prevDrove && thisPostcode) {
                      // Get previous call's postcode
                      let prevPostcode = null;
                      if (prevDrove.service_user_id) {
                        const { data: prevSu } = await supabase
                          .from('service_users')
                          .select('postcode')
                          .eq('id', prevDrove.service_user_id)
                          .single();
                        prevPostcode = prevSu?.postcode?.trim()?.toUpperCase() || null;
                      }

                      if (prevPostcode && thisPostcode) {
                        // Resolve both postcodes to coords
                        await resolveCallAddresses([
                          { service_user_address: prevPostcode },
                          { service_user_address: thisPostcode },
                        ]);
                        const resolved = await resolveCallAddresses([
                          { ...prevDrove, service_user_address: prevPostcode },
                          { ...driveToCallConfirm, service_user_address: thisPostcode },
                        ]);
                        if (resolved.length === 2) {
                          legMiles = haversineMiles(
                            resolved[0].resolvedLat, resolved[0].resolvedLng,
                            resolved[1].resolvedLat, resolved[1].resolvedLng
                          );
                        }
                      }
                    }

                    // 5. Store per-call mileage
                    const legRounded = Math.round(legMiles * 100) / 100;
                    await ShiftCallApi.update(driveToCallConfirm.id, {
                      call_mileage: legRounded,
                    });
                    queryClient.invalidateQueries({ queryKey: ['shift-calls', shift?.id] });

                    // 6. Update daily mileage expense in real-time
                    try {
                      const totalMiles = allDroveCalls.reduce((sum, c) => sum + (Number(c.call_mileage) || 0), 0) + legRounded;
                      const totalMilesRounded = Math.round(totalMiles * 100) / 100;

                      const { data: rateSetting } = await supabase
                        .from('system_settings')
                        .select('setting_value')
                        .eq('setting_key', 'mileage_rate_ppm')
                        .single();
                      const ratePpm = rateSetting?.setting_value ? parseInt(rateSetting.setting_value, 10) : 45;
                      const ratePerMile = ratePpm / 100;
                      const amount = Math.round(totalMilesRounded * ratePerMile * 100) / 100;

                      if (totalMilesRounded > 0) {
                        const staffName = shift?.staff_name || 'Unknown';
                        const today = new Date();
                        const dayOfWeek = today.getDay();
                        const weekStart = new Date(today);
                        weekStart.setDate(weekStart.getDate() - dayOfWeek);
                        const weekEnd = new Date(weekStart);
                        weekEnd.setDate(weekEnd.getDate() + 6);
                        const paymentDue = new Date(weekStart);
                        paymentDue.setDate(paymentDue.getDate() + 11);

                        const { data: existing } = await supabase
                          .from('expenses')
                          .select('id')
                          .eq('staff_id', staffId)
                          .eq('date', todayStr)
                          .eq('expense_type', 'mileage')
                          .maybeSingle();

                        const expenseData = {
                          staff_id: staffId,
                          staff_name: staffName,
                          expense_type: 'mileage',
                          amount,
                          date: todayStr,
                          expense_date: todayStr,
                          description: `Mileage: ${totalMilesRounded} mi @ ${ratePpm}p/mi`,
                          mileage: totalMilesRounded,
                          mileage_distance: totalMilesRounded,
                          mileage_rate: ratePerMile,
                          week_start_date: weekStart.toISOString().split('T')[0],
                          week_end_date: weekEnd.toISOString().split('T')[0],
                          payment_due_date: paymentDue.toISOString().split('T')[0],
                          status: 'pending',
                        };

                        if (existing?.id) {
                          await supabase.from('expenses').update(expenseData).eq('id', existing.id);
                        } else {
                          await supabase.from('expenses').insert(expenseData);
                        }
                      }
                    } catch (expErr) {
                      console.error('Error updating daily expense:', expErr);
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

      {/* Who is completing the care log? */}
      <AlertDialog open={!!logCompletorCall} onOpenChange={(open) => !open && setLogCompletorCall(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Who is completing the care log?</AlertDialogTitle>
            <AlertDialogDescription>
              {shift?.paired_shift_id
                ? 'This is a double-handed call. Who will be filling in the care log for this visit?'
                : 'Please confirm who is completing the care log.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={() => {
                const call = logCompletorCall;
                setLogCompletorCall(null);
                try { localStorage.removeItem(`draft:careLog:${shift?.id || 'new'}`); } catch (e) {}
                setTimeout(() => setCareLogCall(call), 80);
              }}
              className="bg-blue-600 hover:bg-blue-700 h-12"
            >
              <User className="w-4 h-4 mr-2" />
              I Am Completing It
            </Button>
            {shift?.paired_shift_id && (
              <Button
                variant="outline"
                onClick={() => {
                  const call = logCompletorCall;
                  setLogCompletorCall(null);
                  handlePartnerCompletingLog(call);
                }}
                className="h-12 border-slate-300"
              >
                <Users className="w-4 h-4 mr-2" />
                My Partner Is Completing It
              </Button>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Delay dialog */}
      <AlertDialog open={!!delayCall} onOpenChange={(open) => { if (!open) { setDelayCall(null); setDelayMinutes(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <Timer className="w-5 h-5" />
              Report a Delay
            </AlertDialogTitle>
            <AlertDialogDescription>
              How many minutes late are you to <strong>{delayCall?.service_user_name}</strong>'s {delayCall?.scheduled_time} call?
              Your partner and area managers will be notified, and you'll be re-alerted when this time expires.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {['10', '15', '20', '30'].map(m => (
                <button
                  key={m}
                  onClick={() => setDelayMinutes(m)}
                  className={`py-2.5 rounded-lg text-sm font-semibold border-2 transition-colors ${
                    delayMinutes === m
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-slate-200 text-slate-700 hover:border-amber-300'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <Input
              type="number"
              value={delayMinutes}
              onChange={(e) => setDelayMinutes(e.target.value)}
              placeholder="Or type custom minutes..."
              min="1"
              max="120"
            />
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel onClick={() => { setDelayCall(null); setDelayMinutes(''); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (delayCall && delayMinutes && parseInt(delayMinutes) > 0) {
                  reportDelayMutation.mutate({ call: delayCall, minutes: delayMinutes });
                }
              }}
              disabled={!delayMinutes || parseInt(delayMinutes) < 1 || reportDelayMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
            >
              {reportDelayMutation.isPending ? 'Reporting...' : 'Report Delay'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hold expired confirmation dialog */}
      <AlertDialog open={!!holdExpiredConfirm} onOpenChange={(open) => !open && setHoldExpiredConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Temporary Hold Ended</AlertDialogTitle>
            <AlertDialogDescription>
              The temporary hold for <strong>{holdExpiredConfirm}</strong> has ended. Their status has been set back to <strong>Active</strong>. Calls for this client will resume as normal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogAction onClick={() => setHoldExpiredConfirm(null)} className="bg-teal-600 hover:bg-teal-700">
              OK, Got It
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
                setTimeout(() => {
                  if (shift?.paired_shift_id) {
                    setLogCompletorCall(call);
                  } else {
                    setCareLogCall(call);
                  }
                }, 80);
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

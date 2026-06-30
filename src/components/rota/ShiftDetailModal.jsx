import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { getMatchingCallsForShift } from '@/utils/shiftCallAutoAssign';
import CareLogForm from '@/components/careLogs/CareLogForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Avatar from '@/components/ui/Avatar';
import StatusBadge from '@/components/ui/StatusBadge';
import CallManager from '@/components/rota/CallManager';
import ShiftSittingLogs from '@/components/rota/ShiftSittingLogs';
import ShiftSwapRequest from '@/components/rota/ShiftSwapRequest';
import { Clock, MapPin, Calendar, User, Trash2, Play, Square, RefreshCw, Edit2, Save, X, Car, FileText, CheckCircle, AlertCircle, Home, Radio } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { notifyAdminsOfActivity } from '@/utils/adminNotifications';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Sit-in shift types don't have client calls — only clock on/off
const SIT_IN_NAMES = new Set(['Sit In L', 'Sit In E', 'Sit In FD']);

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export default function ShiftDetailModal({ shift, open, onClose, isAdmin, userId, isEditMode = false }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSitIn = SIT_IN_NAMES.has(shift?.shift_name);
  const [activeTab, setActiveTab] = useState(isSitIn ? 'sitting-logs' : 'calls');
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [clockOffShiftConfirm, setClockOffShiftConfirm] = useState(false);
  const [shiftSummaryOpen, setShiftSummaryOpen] = useState(false);
  const [deleteShiftConfirm, setDeleteShiftConfirm] = useState(false);
  const [editMode, setEditMode] = useState(isEditMode);
  const [editData, setEditData] = useState({
    start_time: shift.start_time,
    end_time: shift.end_time,
    status: shift.status,
    shift_name: shift.shift_name,
    care_notes: shift.care_notes,
    staff_id: shift.staff_id,
    staff_name: shift.staff_name,
    rota_area_id: shift.rota_area_id,
  });

  const [currentShift, setCurrentShift] = useState(shift);
  const [staffSaveDialogOpen, setStaffSaveDialogOpen] = useState(false);
  const [endPatternDialogOpen, setEndPatternDialogOpen] = useState(false);
  const [endPatternDate, setEndPatternDate] = useState('');
  const [summaryLogCall, setSummaryLogCall] = useState(null);
  const [sitInCoverRequired, setSitInCoverRequired] = useState('no');
  const [sitInTimeOn, setSitInTimeOn] = useState('');
  const [sitInTimeOff, setSitInTimeOff] = useState('');

  useEffect(() => {
    setCurrentShift(shift);
  }, [shift]);

  // Hide bottom nav while this modal is open
  useEffect(() => {
    if (open) window.dispatchEvent(new CustomEvent('shift-modal-open'));
    return () => window.dispatchEvent(new CustomEvent('shift-modal-close'));
  }, [open]);

  // Real-time subscription to shift updates
  useEffect(() => {
    const unsubscribe = ShiftApi.subscribe((event) => {
      if (event.new && event.new.id === shift.id) {
        setCurrentShift(event.new);
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        queryClient.invalidateQueries({ queryKey: ['shift', shift.id] });
      }
    });
    return unsubscribe;
  }, [shift.id, queryClient]);

  // Real-time subscription to shift call updates (no shift_id filter — shared shifts update other shift's calls)
  useEffect(() => {
    const unsubscribe = ShiftCallApi.subscribe((event) => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift.id] });
    });
    return unsubscribe;
  }, [shift.id, queryClient]);

  // Real-time subscription to care log updates
  useEffect(() => {
    const channel = supabase
      .channel(`care-logs-shift-${shift.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'care_logs' }, (payload) => {
        if (payload.new?.shift_id === shift.id || payload.new?.shift_id === shift.paired_shift_id) {
          queryClient.invalidateQueries({ queryKey: ['careLogs', shift.id, shift.paired_shift_id] });
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [shift.id, shift.paired_shift_id, queryClient]);

  // Silently sync calls from current service users when viewing a future shift
  useEffect(() => {
    if (!open) return;
    const today = new Date().toISOString().slice(0, 10);
    if (shift.date <= today || shift.clock_in_time || SIT_IN_NAMES.has(shift.shift_name)) return;
    const areaId = shift.rota_area_id || shift.area_id;
    if (!areaId) return;
    (async () => {
      try {
        const serviceUsers = await base44.entities.ServiceUser.filter({ status: 'active' });
        const matchingCalls = getMatchingCallsForShift(serviceUsers, areaId, shift.start_time, shift.end_time);
        if (!matchingCalls.length) return;
        const existingCalls = await ShiftCallApi.filter({ shift_id: shift.id });
        const existingKey = new Set(existingCalls.map(c => `${c.service_user_id}|${c.scheduled_time}`));
        const newCalls = matchingCalls.filter(c => !existingKey.has(`${c.service_user_id}|${c.scheduled_time}`));
        if (!newCalls.length) return;
        for (const call of newCalls) {
          await ShiftCallApi.create({
            shift_id: shift.id,
            service_user_id: call.service_user_id,
            service_user_name: call.service_user_name,
            service_user_address: call.service_user_address,
            scheduled_time: call.scheduled_time,
            call_time: call.scheduled_time,
            duration_minutes: call.duration_minutes,
            call_type: call.call_type,
            call_types: call.call_types || [call.call_type],
            notes: call.notes || '',
            call_date: shift.date,
            status: 'pending',
          });
        }
        queryClient.invalidateQueries({ queryKey: ['shift-calls', shift.id] });
      } catch (e) {
        console.warn('[ShiftDetailModal] Silent call sync failed:', e);
      }
    })();
  }, [open, shift.id]);

  const { data: calls = [] } = useQuery({
    queryKey: ['shift-calls', shift.id],
    queryFn: async () => {
      const shiftCalls = await ShiftCallApi.filter({ shift_id: shift.id }, 'scheduled_time', 100);
      // Sort by scheduled_time to ensure consistent order for paired shifts
      return shiftCalls.sort((a, b) => {
        const timeA = a.scheduled_time ? a.scheduled_time.split(':') : ['23', '59'];
        const timeB = b.scheduled_time ? b.scheduled_time.split(':') : ['23', '59'];
        const minutesA = parseInt(timeA[0]) * 60 + parseInt(timeA[1]);
        const minutesB = parseInt(timeB[0]) * 60 + parseInt(timeB[1]);
        return minutesA - minutesB;
      });
    },
    enabled: !!shift.id,
  });

  const hasSitinCoverCall = calls?.some(c => c.call_type === 'sitin_cover');

  // Initialize sit-in cover state from existing calls
  useEffect(() => {
    const sitinCall = calls.find(c => c.call_type === 'sitin_cover');
    if (sitinCall) {
      setSitInCoverRequired('yes');
      try {
        const meta = JSON.parse(sitinCall.notes || '{}');
        setSitInTimeOn(meta.time_on || sitinCall.scheduled_time || '');
        setSitInTimeOff(meta.time_off || '');
      } catch {
        setSitInTimeOn(sitinCall.scheduled_time || '');
        setSitInTimeOff('');
      }
    } else {
      setSitInCoverRequired('no');
      setSitInTimeOn('');
      setSitInTimeOff('');
    }
  }, [calls]);

  const { data: serviceUser = null } = useQuery({
    queryKey: ['serviceUser', shift.service_user_id],
    queryFn: () => shift.service_user_id ? base44.entities.ServiceUser.list().then(users => users.find(u => u.id === shift.service_user_id)) : null,
    enabled: !!shift.service_user_id,
  });

  const { data: pairedShift = null } = useQuery({
    queryKey: ['pairedShift', shift.paired_shift_id],
    queryFn: async () => {
      if (!shift.paired_shift_id) return null;
      const results = await ShiftApi.filter({ id: shift.paired_shift_id });
      return results[0] || null;
    },
    enabled: !!shift.paired_shift_id,
  });

  // Fetch paired shift calls for cross-referencing partner-completed logs
  const { data: pairedCalls = [] } = useQuery({
    queryKey: ['shift-calls-paired', shift.paired_shift_id],
    queryFn: () => shift.paired_shift_id ? ShiftCallApi.filter({ shift_id: shift.paired_shift_id }, 'scheduled_time', 100) : [],
    enabled: !!shift.paired_shift_id,
  });

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
    enabled: isAdmin && editMode,
  });

  const { data: allStaff = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: async () => {
      try {
        const users = await base44.entities.User.list('full_name', 500);
        return users.filter(u => u.role === 'user' || u.job_title !== 'admin').map(u => ({
          ...u,
          displayName: u.staff_full_name || u.full_name || u.email?.split('@')[0] || 'Unknown'
        })).sort((a, b) => a.displayName.localeCompare(b.displayName));
      } catch (error) {
        console.error('Error fetching staff:', error);
        return [];
      }
    },
    enabled: isAdmin && editMode,
  });

  const { data: availableShifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['availableShifts', shift.date, shift.start_time, shift.end_time, shift.id],
    queryFn: async () => {
      try {
        const { data: matchingShifts, error } = await supabase
          .from('shifts')
          .select('*')
          .eq('date', shift.date)
          .eq('start_time', shift.start_time)
          .eq('end_time', shift.end_time)
          .not('staff_id', 'is', null)
          .neq('id', shift.id);
        if (error) throw error;
        return (matchingShifts || []).filter(s =>
          (!s.paired_shift_id || s.paired_shift_id === '') &&
          s.staff_id !== shift.staff_id
        );
      } catch (error) {
        console.error('[Pairing] Error fetching available shifts:', error);
        return [];
      }
    },
    enabled: !!shift.date && !!shift.start_time && !!shift.end_time && isAdmin && !editMode,
  });

  // Care logs for shift summary on clock-off
  const { data: shiftCareLogs = [] } = useQuery({
    queryKey: ['careLogs', shift.id, shift.paired_shift_id],
    queryFn: async () => {
      const logs = await base44.entities.CareLog.filter({ shift_id: shift.id }, '-created_date', 100);
      if (shift.paired_shift_id) {
        const pairedLogs = await base44.entities.CareLog.filter({ shift_id: shift.paired_shift_id }, '-created_date', 100);
        return [...logs, ...pairedLogs];
      }
      return logs;
    },
    enabled: !!shift.id,
  });

  // Fetch all shifts on the same day for handover staff dropdown
  const { data: sameDayShifts = [] } = useQuery({
    queryKey: ['sameDayShifts', shift.date],
    queryFn: () => ShiftApi.filter({ date: shift.date }),
    enabled: !!shift.date,
  });

  // Compute shift summary data for the checkout popup
  const getShiftSummary = () => {
    const regularCalls = calls.filter(c => c.call_type !== 'sitin_cover');
    const totalCalls = regularCalls.length;
    const completedCalls = regularCalls.filter(c => c.status === 'completed').length;
    const inProgressCalls = regularCalls.filter(c => c.status === 'in_progress').length;
    const pendingCalls = regularCalls.filter(c => c.status === 'pending').length;
    const missedCalls = regularCalls.filter(c => c.status === 'missed' || c.status === 'not_at_home').length;
    const droveCalls = regularCalls.filter(c => c.drove_to_call);
    const didNotDriveCalls = regularCalls.filter(c => c.drove_to_call === false);

    // Sum stored per-call mileage (recorded at check-in via "Did you drive?" prompt)
    const totalMiles = regularCalls
      .filter(c => c.drove_to_call)
      .reduce((sum, c) => sum + (Number(c.call_mileage) || 0), 0);

    // Outstanding logs = calls without a care log (exclude sitin_cover)
    // Also exclude logs already completed by the shift partner on shared shifts
    const outstandingLogs = regularCalls.filter(c => {
      if (c.status === 'missed' || c.status === 'not_at_home') return false; // missed/not-at-home calls don't need logs
      const hasLog = shiftCareLogs.some(log => {
        if (log.id === c.care_log_id || log.shift_call_id === c.id) return true;
        // Partner-completed: match via the partner's call for same client + same scheduled time
        if (log.shift_call_id && log.status === 'submitted') {
          const partnerCall = pairedCalls.find(pc => pc.id === log.shift_call_id);
          if (partnerCall && partnerCall.service_user_id === c.service_user_id && partnerCall.scheduled_time === c.scheduled_time) {
            return true;
          }
        }
        return false;
      });
      return !hasLog;
    });

    return {
      totalCalls, completedCalls, inProgressCalls, pendingCalls, missedCalls,
      droveCalls: droveCalls.length,
      didNotDriveCalls: didNotDriveCalls.length,
      totalMiles: Math.round(totalMiles * 100) / 100,
      outstandingLogs,
      callDetails: regularCalls.sort((a, b) => (a.scheduled_time || '').localeCompare(b.scheduled_time || '')),
    };
  };

  const regenerateCallsMutation = useMutation({
    mutationFn: async () => {
      const areaId = shift.rota_area_id || shift.area_id;
      if (!areaId) throw new Error('Shift has no area — cannot match calls');
      const serviceUsers = await base44.entities.ServiceUser.filter({ status: 'active' });
      const matchingCalls = getMatchingCallsForShift(serviceUsers, areaId, shift.start_time, shift.end_time);
      if (matchingCalls.length === 0) throw new Error('No matching service users found for this area and time window');
      const callTypesData = await base44.entities.CallType.filter({ is_active: true });
      // Get existing call service_user_ids to avoid duplicates
      const existingCalls = await ShiftCallApi.filter({ shift_id: shift.id });
      const existingUserIds = new Set(existingCalls.map(c => c.service_user_id));
      let created = 0;
      for (const call of matchingCalls) {
        if (existingUserIds.has(call.service_user_id)) continue;
        const ct = callTypesData.find(c => c.name === call.call_type);
        const tasks = ct?.default_tasks?.length ? ct.default_tasks.map(t => ({ text: t, completed: false })) : [];
        await ShiftCallApi.create({
          shift_id: shift.id,
          service_user_id: call.service_user_id,
          service_user_name: call.service_user_name,
          service_user_address: call.service_user_address,
          scheduled_time: call.scheduled_time,
          call_time: call.scheduled_time,
          duration_minutes: call.duration_minutes,
          call_type: call.call_type,
          call_types: call.call_types || [call.call_type],
          tasks,
          call_date: shift.date,
          status: 'pending',
          notes: call.notes || '',
        });
        created++;
      }
      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift.id] });
      toast.success(`${created} call${created !== 1 ? 's' : ''} added to shift`);
    },
    onError: (e) => toast.error(e.message || 'Failed to regenerate calls'),
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async () => {
      // Delete associated shift_calls
      const calls = await ShiftCallApi.filter({ shift_id: shift.id });
      for (const call of calls) {
        await ShiftCallApi.delete(call.id);
      }
      // Clear pairing on partner shift
      if (shift.paired_shift_id) {
        await supabase.from('shifts')
          .update({ paired_shift_id: null, paired_staff_name: null })
          .eq('id', shift.paired_shift_id);
      }
      // Revert to blank available shift
      return ShiftApi.update(shift.id, {
        staff_id: null,
        staff_name: null,
        paired_shift_id: null,
        paired_staff_name: null,
        shift_pattern_id: null,
        is_base_shift: true,
        status: 'scheduled',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-calls'] });
      toast.success('Shift cleared — now available to claim');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to clear shift');
    },
  });

  // Permanently delete the shift from the database
  const permanentDeleteMutation = useMutation({
    mutationFn: async () => {
      // Delete associated shift_calls
      const calls = await ShiftCallApi.filter({ shift_id: shift.id });
      for (const call of calls) {
        await ShiftCallApi.delete(call.id);
      }
      // Clear pairing on partner shift
      if (shift.paired_shift_id) {
        await supabase.from('shifts')
          .update({ paired_shift_id: null, paired_staff_name: null })
          .eq('id', shift.paired_shift_id);
      }
      // Permanently delete the shift record
      const { error } = await supabase.from('shifts').delete().eq('id', shift.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-calls'] });
      toast.success('Shift permanently deleted');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete shift');
    },
  });

  const endPatternMutation = useMutation({
    mutationFn: async () => {
      if (!shift.shift_pattern_id || !endPatternDate) throw new Error('No pattern or date selected');
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('shift_pattern_id', shift.shift_pattern_id)
        .gt('date', endPatternDate);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Pattern ended — future shifts removed from that date');
      setEndPatternDialogOpen(false);
      onClose();
    },
    onError: (e) => toast.error(e.message || 'Failed to end pattern'),
  });

  const clockOnMutation = useMutation({
    mutationFn: () => {
      const now = new Date().toISOString();
      return ShiftApi.update(shift.id, {
        clock_in_time: now,
        status: 'in_progress'
      });
    },
    onMutate: () => {
      // Optimistic update — show change immediately
      const now = new Date().toISOString();
      setCurrentShift(prev => ({ ...prev, clock_in_time: now, status: 'in_progress' }));
    },
    onSuccess: (data) => {
      if (data) setCurrentShift(data);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', shift.id] });
      toast.success('Clocked on to shift');

      // Notify admins
      notifyAdminsOfActivity({
        title: `Shift started: ${shift.staff_name || 'Staff'}`,
        message: `${shift.staff_name || 'Staff'} has clocked on to their shift.`,
        excludeUserId: shift.staff_id,
        areaId: shift.rota_area_id || shift.area_id,
      });
    },
    onError: (error) => {
      // Revert optimistic update
      setCurrentShift(shift);
      console.error('Clock on failed:', error);
      toast.error('Failed to clock on: ' + (error.message || 'Unknown error'));
    },
  });

  const clockOffMutation = useMutation({
    mutationFn: () => {
      const endTime = new Date();
      return ShiftApi.update(shift.id, {
        clock_out_time: endTime.toISOString(),
        status: 'completed'
      });
    },
    onMutate: () => {
      const now = new Date().toISOString();
      setCurrentShift(prev => ({ ...prev, clock_out_time: now, status: 'completed' }));
    },
    onSuccess: (data) => {
      if (data) setCurrentShift(data);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', shift.id] });
      // Play completion sound
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
        // Second tone for "completion" feel
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1320;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc2.start(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.8);
      } catch (e) { /* audio not available */ }
      // Longer duration success toast
      toast.success('Shift Completed', { duration: 5000 });
      setShiftSummaryOpen(false);

      // Notify admins — include outstanding logs warning if any
      const summary = getShiftSummary();
      const outstandingCount = summary.outstandingLogs.length;
      const shiftAreaId = shift.rota_area_id || shift.area_id;
      if (outstandingCount > 0) {
        const logNames = summary.outstandingLogs.map(c => `${c.service_user_name} (${c.scheduled_time})`).join(', ');
        notifyAdminsOfActivity({
          title: `⚠️ Shift ended with ${outstandingCount} missing log${outstandingCount !== 1 ? 's' : ''}`,
          message: `${shift.staff_name || 'Staff'} clocked off with outstanding care logs: ${logNames}`,
          excludeUserId: shift.staff_id,
          areaId: shiftAreaId,
        });
      } else {
        notifyAdminsOfActivity({
          title: `Shift completed: ${shift.staff_name || 'Staff'}`,
          message: `${shift.staff_name || 'Staff'} has clocked off their shift.`,
          excludeUserId: shift.staff_id,
          areaId: shiftAreaId,
        });
      }

      // Close modal after a brief delay so user sees the toast
      setTimeout(() => {
        onClose();
      }, 1500);
    },
    onError: (error) => {
      console.error('Clock off failed:', error);
      toast.error('Failed to clock off: ' + (error.message || 'Unknown error'));
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ saveMode = 'single' } = {}) => {
      await ShiftApi.update(shift.id, editData);

      // If staff changed and shift is in a pattern, propagate to future shifts
      const staffChanged = editData.staff_id !== shift.staff_id;
      if (staffChanged && shift.shift_pattern_id && saveMode !== 'single') {
        const { data: patternShifts } = await supabase
          .from('shifts')
          .select('id, date')
          .eq('shift_pattern_id', shift.shift_pattern_id)
          .gt('date', shift.date);

        if (patternShifts && patternShifts.length > 0) {
          const shiftDayOfWeek = new Date(shift.date + 'T12:00:00').getDay();
          let toUpdate = patternShifts.filter(s => new Date(s.date + 'T12:00:00').getDay() === shiftDayOfWeek);

          const intervalMap = { biweekly: 14, '3weekly': 21, '4weekly': 28 };
          const intervalDays = intervalMap[saveMode];
          if (intervalDays) {
            const baseTime = new Date(shift.date + 'T12:00:00').getTime();
            toUpdate = toUpdate.filter(s => {
              const days = Math.round((new Date(s.date + 'T12:00:00').getTime() - baseTime) / 86400000);
              return days % intervalDays === 0;
            });
          }

          if (toUpdate.length > 0) {
            const toUpdateIds = toUpdate.map(s => s.id);
            await supabase
              .from('shifts')
              .update({ staff_id: editData.staff_id, staff_name: editData.staff_name })
              .in('id', toUpdateIds);

            // Also update each paired partner's display name
            const { data: withPairs } = await supabase
              .from('shifts')
              .select('paired_shift_id')
              .in('id', toUpdateIds)
              .not('paired_shift_id', 'is', null);
            if (withPairs && withPairs.length > 0) {
              const partnerIds = withPairs.map(s => s.paired_shift_id).filter(Boolean);
              await supabase
                .from('shifts')
                .update({ paired_staff_name: editData.staff_name })
                .in('id', partnerIds);
            }
          }
        }
      }

      // If staff changed and shift is paired, update or clear pairing on partner
      const pairedId = currentShift.paired_shift_id;
      if (pairedId && editData.staff_id !== shift.staff_id) {
        if (editData.staff_id) {
          // Staff changed to someone else → update partner's paired_staff_name
          await ShiftApi.update(pairedId, { paired_staff_name: editData.staff_name });
        } else {
          // Staff removed → clear pairing on both sides
          await ShiftApi.update(pairedId, { paired_shift_id: null, paired_staff_name: null });
          await ShiftApi.update(shift.id, { paired_shift_id: null, paired_staff_name: null });
        }
      }

      // Handle sit-in cover call changes
      const existingSitinCall = calls.find(c => c.call_type === 'sitin_cover');

      if (sitInCoverRequired === 'yes' && sitInTimeOn && sitInTimeOff) {
        const durationMinutes = timeToMinutes(sitInTimeOff) - timeToMinutes(sitInTimeOn);
        const existingMeta = existingSitinCall ? (() => { try { return JSON.parse(existingSitinCall.notes || '{}'); } catch { return {}; } })() : {};
        const sitinNotes = JSON.stringify({
          sitin_cover: true,
          time_on: sitInTimeOn,
          time_off: sitInTimeOff,
          accepted: existingMeta.accepted || false,
          accepted_by: existingMeta.accepted_by || null,
          accepted_at: existingMeta.accepted_at || null,
        });
        const callPayload = {
          service_user_name: 'Sit-in Required On Shift',
          service_user_address: '',
          scheduled_time: sitInTimeOn,
          call_time: sitInTimeOn,
          duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
          call_type: 'sitin_cover',
          call_types: ['sitin_cover'],
          tasks: [],
          call_date: shift.date,
          status: 'pending',
          notes: sitinNotes,
        };

        if (existingSitinCall) {
          await ShiftCallApi.update(existingSitinCall.id, {
            scheduled_time: sitInTimeOn,
            call_time: sitInTimeOn,
            duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
            notes: sitinNotes,
          });
          // Sync update to paired shift
          if (pairedId) {
            const pairedCalls = await ShiftCallApi.filter({ shift_id: pairedId });
            const pairedSitin = pairedCalls.find(c => c.call_type === 'sitin_cover');
            if (pairedSitin) {
              await ShiftCallApi.update(pairedSitin.id, {
                scheduled_time: sitInTimeOn,
                call_time: sitInTimeOn,
                duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
                notes: sitinNotes,
              });
            } else {
              await ShiftCallApi.create({ ...callPayload, shift_id: pairedId });
            }
          }
        } else {
          await ShiftCallApi.create({ ...callPayload, shift_id: shift.id });
          // Also create on paired shift
          if (pairedId) {
            const pairedCalls = await ShiftCallApi.filter({ shift_id: pairedId });
            const pairedSitin = pairedCalls.find(c => c.call_type === 'sitin_cover');
            if (!pairedSitin) {
              await ShiftCallApi.create({ ...callPayload, shift_id: pairedId });
            }
          }

          // Notify staff + paired partner
          const notifyIds = [shift.staff_id].filter(Boolean);
          if (pairedId) {
            try {
              const pairedShiftData = await ShiftApi.filter({ id: pairedId });
              if (pairedShiftData[0]?.staff_id) notifyIds.push(pairedShiftData[0].staff_id);
            } catch {}
          }
          if (notifyIds.length > 0) {
            base44.functions.invoke('createNotification', {
              recipient_ids: notifyIds,
              type: 'shift_activity',
              title: 'Sit-In Cover Added',
              message: `A sit-in cover call has been added to your shift (${sitInTimeOn} - ${sitInTimeOff}).`,
              priority: 'high',
              action_url: '/Rota',
              send_push: true,
            }).catch(e => console.warn('Notification failed:', e));
          }

          notifyAdminsOfActivity({
            title: 'Sit-in cover added',
            message: `Sit-in cover added to ${shift.staff_name || 'staff'}'s shift (${sitInTimeOn} - ${sitInTimeOff}).`,
            excludeUserId: shift.staff_id,
            areaId: shift.rota_area_id || shift.area_id,
          });
        }
      } else if (sitInCoverRequired === 'no' && existingSitinCall) {
        await ShiftCallApi.delete(existingSitinCall.id);
        // Also remove from paired shift
        if (pairedId) {
          const pairedCalls = await ShiftCallApi.filter({ shift_id: pairedId });
          const pairedSitin = pairedCalls.find(c => c.call_type === 'sitin_cover');
          if (pairedSitin) await ShiftCallApi.delete(pairedSitin.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', shift.id] });
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift.id] });
      if (currentShift.paired_shift_id) {
        queryClient.invalidateQueries({ queryKey: ['shift-calls', currentShift.paired_shift_id] });
      }
      toast.success('Shift updated successfully');
      setEditMode(false);
      onClose();
    },
    onError: (err) => {
      console.error('Update shift error:', err);
      toast.error(err.message || 'Failed to update shift');
    },
  });

  const pairShiftMutation = useMutation({
    mutationFn: async (targetShiftId) => {
      const targetShift = availableShifts.find(s => s.id === targetShiftId);
      // Pair both shifts with each other
      await ShiftApi.update(shift.id, {
        paired_shift_id: targetShiftId,
        paired_staff_name: targetShift.staff_name
      });
      await ShiftApi.update(targetShiftId, {
        paired_shift_id: shift.id,
        paired_staff_name: currentShift.staff_name
      });

      // Copy sitin_cover calls to the paired shift
      const currentCalls = await ShiftCallApi.filter({ shift_id: shift.id });
      const sitinCalls = currentCalls.filter(c => c.call_type === 'sitin_cover');
      for (const sc of sitinCalls) {
        const existing = await ShiftCallApi.filter({ shift_id: targetShiftId, call_type: 'sitin_cover', scheduled_time: sc.scheduled_time });
        if (existing.length === 0) {
          await ShiftCallApi.create({
            shift_id: targetShiftId,
            service_user_name: 'Sit-in Required On Shift',
            service_user_address: '',
            scheduled_time: sc.scheduled_time,
            call_time: sc.call_time,
            duration_minutes: sc.duration_minutes,
            call_type: 'sitin_cover',
            call_types: ['sitin_cover'],
            tasks: [],
            call_date: sc.call_date,
            status: sc.status,
            notes: sc.notes,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', shift.id] });
    },
  });

  const unpairShiftMutation = useMutation({
    mutationFn: async () => {
      if (currentShift.paired_shift_id) {
        // Remove pairing from both shifts
        await ShiftApi.update(currentShift.paired_shift_id, {
          paired_shift_id: null,
          paired_staff_name: null
        });
      }
      await ShiftApi.update(shift.id, {
        paired_shift_id: null,
        paired_staff_name: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift', shift.id] });
    },
  });

  const isMyShift = currentShift.staff_id === userId;
  const serviceUserOnHold = serviceUser?.status === 'on_hold';
  const canClockOn = (isMyShift || isAdmin) && !currentShift.clock_in_time && currentShift.status !== 'completed' && !serviceUserOnHold;
  // Allow clock off if: clocked on OR any calls have been worked (even without shift clock-on)
  // NOTE: Do NOT check currentShift.status !== 'completed' here — when all calls finish
  // the shift status can get set to 'completed' via realtime, which would hide the button
  // before the user can actually clock off. The !clock_out_time check is sufficient.
  const hasWorkedCalls = calls.length > 0 && calls.some(c => c.status === 'completed' || c.status === 'in_progress');
  const canClockOff = (isMyShift || isAdmin) && !currentShift.clock_out_time && (currentShift.clock_in_time || hasWorkedCalls) && !serviceUserOnHold;
  const regularCallsForDone = calls.filter(c => c.call_type !== 'sitin_cover');
  const allCallsDone = regularCallsForDone.length > 0 && regularCallsForDone.every(c => c.status === 'completed' || c.status === 'missed' || c.status === 'not_at_home');

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-full h-[100dvh] md:max-w-3xl md:max-h-[90vh] p-0 md:p-6 md:rounded-lg rounded-none flex flex-col fixed bottom-0 md:bottom-auto md:top-[50%] md:translate-y-[-50%] top-auto translate-y-0">
        {/* Mobile-only: full-width App Home bar replaces the bottom nav */}
        <button
          onClick={onClose}
          className="md:hidden w-full flex items-center gap-3 px-5 py-3.5 bg-teal-600 text-white font-semibold text-base flex-shrink-0 active:bg-teal-700 touch-manipulation"
        >
          <Home className="w-5 h-5" />
          App Home
        </button>
        <DialogHeader className="hidden md:block md:px-0 md:pt-0">
          <DialogTitle>Shift Details</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 md:px-0 space-y-6 pb-6 md:pb-0">
          {/* Shift Header */}
          <Card className={`p-4 border-0 ${serviceUserOnHold ? 'bg-gray-100 opacity-50' : 'bg-slate-50'}`}>
           <div className="flex items-start justify-between mb-4 gap-2">
             <div className="flex items-center gap-3 min-w-0">
               <div className="flex -space-x-2">
                 <Avatar name={currentShift.staff_name} size="md" />
                 {currentShift.paired_shift_id && (
                   <Avatar name={pairedShift?.staff_name || currentShift.paired_staff_name} size="md" />
                 )}
               </div>
               <div className="min-w-0">
                 <h3 className="font-semibold text-slate-900 truncate">{isMyShift ? 'Your Shift' : currentShift.staff_name}</h3>
                 {currentShift.paired_shift_id && (
                   <p className="text-sm text-teal-600 truncate">+ {pairedShift?.staff_name || currentShift.paired_staff_name || 'Paired'} (paired)</p>
                 )}
                 <p className="text-sm text-slate-500 truncate">{format(parseISO(currentShift.date), 'd MMM yyyy')}</p>
               </div>
             </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {serviceUserOnHold && (
                  <Badge className="bg-gray-400 text-white">On Hold</Badge>
                )}
                {isAdmin && !editMode && (
                 <Button size="icon" variant="outline" onClick={() => setEditMode(true)} className="min-h-[44px] min-w-[44px] touch-manipulation">
                   <Edit2 className="w-4 h-4" />
                 </Button>
                )}
                <StatusBadge status={editMode ? editData.status : currentShift.status} className="flex-shrink-0" />
              </div>
            </div>

            {editMode ? (
              <div className="space-y-3 text-sm">
                <div>
                  <Label className="text-xs">Staff Member</Label>
                  <Select value={editData.staff_id || ''} onValueChange={(staffId) => {
                     const staffMember = allStaff.find(s => s.id === staffId);
                     setEditData({...editData, staff_id: staffId, staff_name: staffMember?.displayName || ''});
                   }}>
                     <SelectTrigger className="text-sm">
                       {editData.staff_name ? <span>{editData.staff_name}</span> : <SelectValue placeholder="Select staff member" />}
                     </SelectTrigger>
                     <SelectContent>
                       {allStaff.map(staff => (
                         <SelectItem key={staff.id} value={staff.id}>
                           {staff.displayName}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                  {editData.staff_name && (
                    <p className="text-xs text-slate-500 mt-1">Currently assigned: {editData.staff_name}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs">Rota Area</Label>
                  <Select value={editData.rota_area_id || ''} onValueChange={(value) => setEditData({...editData, rota_area_id: value})}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select rota area" />
                    </SelectTrigger>
                    <SelectContent>
                      {rotaAreas.map(area => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Shift Name (Optional)</Label>
                  <Input
                    value={editData.shift_name || ''}
                    onChange={(e) => setEditData({...editData, shift_name: e.target.value})}
                    placeholder="e.g., Morning Shift"
                    className="text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Start Time</Label>
                    <Input
                      type="time"
                      value={editData.start_time}
                      onChange={(e) => setEditData({...editData, start_time: e.target.value})}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">End Time</Label>
                    <Input
                      type="time"
                      value={editData.end_time}
                      onChange={(e) => setEditData({...editData, end_time: e.target.value})}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={editData.status} onValueChange={(value) => setEditData({...editData, status: value})}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Care Notes</Label>
                  <Input
                    value={editData.care_notes || ''}
                    onChange={(e) => setEditData({...editData, care_notes: e.target.value})}
                    placeholder="Add any notes about this shift"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Any Sit In Cover Required For This Shift?</Label>
                  <Select
                    value={sitInCoverRequired}
                    onValueChange={(value) => {
                      setSitInCoverRequired(value);
                      if (value === 'no') {
                        setSitInTimeOn('');
                        setSitInTimeOff('');
                      }
                    }}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                  {sitInCoverRequired === 'yes' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2 space-y-2">
                      <p className="text-xs text-amber-800 font-medium">Sit-In Cover Times</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-amber-700">Time On</Label>
                          <Input
                            type="time"
                            value={sitInTimeOn}
                            onChange={(e) => setSitInTimeOn(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-amber-700">Time Off</Label>
                          <Input
                            type="time"
                            value={sitInTimeOff}
                            onChange={(e) => setSitInTimeOff(e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
               <div className="flex items-center gap-2 text-slate-600">
                 <Clock className="w-4 h-4" />
                 <span>Scheduled: {currentShift.start_time} - {currentShift.end_time}</span>
               </div>
               {currentShift.clock_in_time && (
                 <div className="flex items-center gap-2 text-slate-600">
                   <Clock className="w-4 h-4" />
                   <span>Actual: {format(new Date(currentShift.clock_in_time), 'HH:mm')}
                     {currentShift.clock_out_time && ` - ${format(new Date(currentShift.clock_out_time), 'HH:mm')}`}
                   </span>
                 </div>
               )}
               {currentShift.clock_in_time && currentShift.clock_out_time && (
                 <div className="flex items-center gap-2 text-slate-600">
                   <Clock className="w-4 h-4" />
                   <span>Hours Worked: {((new Date(currentShift.clock_out_time) - new Date(currentShift.clock_in_time)) / (1000 * 60 * 60)).toFixed(2)}h</span>
                 </div>
               )}
             </div>
            )}

            {/* Clock On/Off Controls */}
            {(isMyShift || isAdmin) && (
              <div className="mt-4 flex flex-wrap gap-2">
                {canClockOn && (
                  <Button
                    onClick={() => clockOnMutation.mutate()}
                    disabled={clockOnMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 min-h-[44px] px-4 touch-manipulation"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Clock On Shift
                  </Button>
                )}
                {canClockOff && (
                  <Button
                    onClick={() => setShiftSummaryOpen(true)}
                    disabled={clockOffMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 min-h-[44px] px-4 touch-manipulation"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Clock Off Shift
                  </Button>
                )}
                {currentShift.clock_in_time && !currentShift.clock_out_time && (
                  <Button
                    onClick={() => { onClose(); navigate('/TwoWayRadio'); }}
                    className="bg-teal-600 hover:bg-teal-700 min-h-[44px] px-4 touch-manipulation"
                  >
                    <Radio className="w-4 h-4 mr-2" />
                    Team Radio
                  </Button>
                )}
                {currentShift.status === 'scheduled' && (
                  <Button
                    onClick={() => setIsSwapModalOpen(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black min-h-[44px] px-4 touch-manipulation"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Request Swap
                  </Button>
                )}
              </div>
            )}

          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {isSitIn ? (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sitting-logs">Sitting Logs</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
            ) : hasSitinCoverCall ? (
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="calls">
                  Calls ({calls.length})
                </TabsTrigger>
                <TabsTrigger value="sitting-logs">Sitting Logs</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calls">
                  Calls ({calls.length})
                </TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
            )}

            {/* Sitting Logs tab for sit-in shifts or shifts with sitin_cover calls */}
            {(isSitIn || hasSitinCoverCall) && (
              <TabsContent value="sitting-logs" className="space-y-4 mt-4">
                <ShiftSittingLogs
                  shift={currentShift}
                  isMyShift={isMyShift}
                  isAdmin={isAdmin}
                />
                {/* Clock Off button at bottom of sitting logs */}
                {canClockOff && isSitIn && (
                  <div className="mt-4 p-3 rounded-lg bg-slate-50">
                    <Button
                      onClick={() => setShiftSummaryOpen(true)}
                      disabled={clockOffMutation.isPending}
                      className="w-full min-h-[48px] touch-manipulation text-base bg-red-600 hover:bg-red-700"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Clock Off Shift
                    </Button>
                  </div>
                )}
              </TabsContent>
            )}

            {!isSitIn && (
            <TabsContent value="calls" className="space-y-4 mt-4">
               <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                 <div className="min-w-0">
                   <p className="text-sm font-medium text-slate-700">Calls not looking right?</p>
                   <p className="text-xs text-slate-500">Recalculate from your area &amp; shift time</p>
                 </div>
                 <Button
                   size="sm"
                   onClick={() => regenerateCallsMutation.mutate()}
                   disabled={regenerateCallsMutation.isPending}
                   className="shrink-0 ml-3 bg-slate-600 hover:bg-slate-700 text-white"
                 >
                   {regenerateCallsMutation.isPending
                     ? <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />Recalculating…</>
                     : <><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Recalculate</>}
                 </Button>
               </div>
               <CallManager
                 shift={shift}
                 calls={calls}
                 isAdmin={isAdmin}
                 isMyShift={isMyShift}
                 sameDayShifts={sameDayShifts}
                 userId={userId}
                 onOpenCareLog={(call) => {
                   try { localStorage.removeItem(`draft:careLog:${shift?.id || 'new'}`); } catch (e) {}
                   setSummaryLogCall(call);
                 }}
               />
               {/* Bottom Clock Off button — visible after calls, prominent when all done */}
               {canClockOff && (
                 <div className={`mt-4 p-3 rounded-lg ${allCallsDone ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                   {allCallsDone && (
                     <p className="text-sm text-green-700 font-medium text-center mb-2 flex items-center justify-center gap-1">
                       <CheckCircle className="w-4 h-4" />
                       All calls completed — ready to end shift
                     </p>
                   )}
                   <Button
                     onClick={() => setShiftSummaryOpen(true)}
                     disabled={clockOffMutation.isPending}
                     className={`w-full min-h-[48px] touch-manipulation text-base ${allCallsDone ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                   >
                     <Square className="w-4 h-4 mr-2" />
                     {allCallsDone ? 'End Shift' : 'Clock Off Shift'}
                   </Button>
                 </div>
               )}
             </TabsContent>
            )}

             <TabsContent value="details" className="space-y-4 mt-4">
              <Card className="p-4">
                <h4 className="font-semibold text-slate-900 mb-3">Shift Information</h4>
                  {editMode ? (
                    <div className="space-y-4 text-sm">
                      <div>
                        <Label className="text-xs">Service User</Label>
                        <Input
                          value={currentShift.service_user_name || ''}
                          disabled
                          className="text-sm bg-slate-100"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Care Notes</Label>
                        <Input
                          value={editData.care_notes || ''}
                          onChange={(e) => setEditData({...editData, care_notes: e.target.value})}
                          placeholder="Add any notes about this shift"
                          className="text-sm"
                        />
                      </div>
                      {currentShift.clock_in_location && (
                        <div>
                          <Label className="text-xs">Clock In Location</Label>
                          <Input value={currentShift.clock_in_location} disabled className="text-sm bg-slate-100" />
                        </div>
                      )}
                      {currentShift.clock_out_location && (
                        <div>
                          <Label className="text-xs">Clock Out Location</Label>
                          <Input value={currentShift.clock_out_location} disabled className="text-sm bg-slate-100" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      {currentShift.service_user_name && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Primary Service User:</span>
                          <span className="text-slate-900">{currentShift.service_user_name}</span>
                        </div>
                      )}
                      {currentShift.clock_in_location && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Clock In Location:</span>
                          <span className="text-slate-900">{currentShift.clock_in_location}</span>
                        </div>
                      )}
                      {currentShift.clock_out_location && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Clock Out Location:</span>
                          <span className="text-slate-900">{currentShift.clock_out_location}</span>
                        </div>
                      )}
                      {currentShift.care_notes && (
                        <div>
                          <span className="text-slate-600">Care Notes:</span>
                          <p className="text-slate-900 mt-1">{currentShift.care_notes}</p>
                        </div>
                      )}
                    </div>
                  )}
              </Card>

              {/* Clock off button kept in Sitting Logs tab for sit-in shifts */}
             </TabsContent>
          </Tabs>

          {/* Pairing Section - Admin Only */}
          {isAdmin && (
            <Card className="p-4">
              <h4 className="font-semibold text-slate-900 mb-3">Staff Pairing</h4>
              {currentShift.paired_shift_id ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={pairedShift?.staff_name || currentShift.paired_staff_name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{pairedShift?.staff_name || currentShift.paired_staff_name || 'Paired staff'}</p>
                      <p className="text-xs text-slate-500">Paired staff member</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => unpairShiftMutation.mutate()}
                    disabled={unpairShiftMutation.isPending}
                    className="min-h-[44px] px-4 touch-manipulation"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Unpair
                  </Button>
                </div>
              ) : shiftsLoading ? (
                <p className="text-sm text-slate-500">Loading available shifts...</p>
              ) : availableShifts && availableShifts.length > 0 ? (
                <Select onValueChange={(targetId) => pairShiftMutation.mutate(targetId)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member to pair with" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableShifts.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.staff_name} - ({s.start_time} - {s.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-slate-500">No other staff assigned to {shift.start_time} - {shift.end_time} on this date</p>
              )}
            </Card>
          )}

          {/* Admin Actions */}
          {isAdmin && !editMode && (
            <div className="flex flex-col-reverse md:flex-row gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose} className="w-full md:w-auto min-h-[44px] px-4 touch-manipulation">
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteShiftConfirm(true)}
                disabled={deleteShiftMutation.isPending}
                className="w-full md:w-auto min-h-[44px] px-4 touch-manipulation"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Shift
              </Button>
            </div>
          )}

          {isAdmin && editMode && (
            <div className="flex flex-col-reverse md:flex-row gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setEditMode(false);
                  setEditData({ start_time: shift.start_time, end_time: shift.end_time, status: shift.status, shift_name: shift.shift_name, care_notes: shift.care_notes, staff_id: shift.staff_id, staff_name: shift.staff_name, rota_area_id: shift.rota_area_id });
                }}
                className="w-full md:w-auto min-h-[44px] px-4 touch-manipulation"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              {isAdmin && shift.shift_pattern_id && (
                <Button
                  variant="outline"
                  onClick={() => { setEndPatternDate(shift.date); setEndPatternDialogOpen(true); }}
                  className="w-full md:w-auto border-red-200 text-red-600 hover:bg-red-50 min-h-[44px] px-4 touch-manipulation"
                >
                  End Pattern
                </Button>
              )}
              <Button
                onClick={() => {
                  const staffChanged = editData.staff_id !== shift.staff_id;
                  if (staffChanged && shift.shift_pattern_id) {
                    setStaffSaveDialogOpen(true);
                  } else {
                    updateShiftMutation.mutate({ saveMode: 'single' });
                  }
                }}
                disabled={updateShiftMutation.isPending}
                className="w-full md:w-auto bg-teal-600 hover:bg-teal-700 min-h-[44px] px-4 touch-manipulation"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )}
          </div>
          </DialogContent>
          </Dialog>

          {/* Staff change scope dialog */}
          <AlertDialog open={staffSaveDialogOpen} onOpenChange={setStaffSaveDialogOpen}>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Update Recurring Shifts?</AlertDialogTitle>
                <AlertDialogDescription>
                  This shift is part of a recurring pattern. How would you like to apply this staff change?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 py-2">
                <Button
                  variant="outline"
                  className="justify-start min-h-[44px] text-left"
                  onClick={() => { setStaffSaveDialogOpen(false); updateShiftMutation.mutate({ saveMode: 'single' }); }}
                >
                  <span className="font-semibold mr-2">This shift only</span>
                  <span className="text-slate-500 text-xs">— change this one date only</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start min-h-[44px] text-left"
                  onClick={() => { setStaffSaveDialogOpen(false); updateShiftMutation.mutate({ saveMode: 'weekly' }); }}
                >
                  <span className="font-semibold mr-2">Every week</span>
                  <span className="text-slate-500 text-xs">— update this day each week from now on</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start min-h-[44px] text-left"
                  onClick={() => { setStaffSaveDialogOpen(false); updateShiftMutation.mutate({ saveMode: 'biweekly' }); }}
                >
                  <span className="font-semibold mr-2">Every 2 weeks</span>
                  <span className="text-slate-500 text-xs">— update alternating weeks from now on</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start min-h-[44px] text-left"
                  onClick={() => { setStaffSaveDialogOpen(false); updateShiftMutation.mutate({ saveMode: '3weekly' }); }}
                >
                  <span className="font-semibold mr-2">Every 3 weeks</span>
                  <span className="text-slate-500 text-xs">— update every 3rd week from now on</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start min-h-[44px] text-left"
                  onClick={() => { setStaffSaveDialogOpen(false); updateShiftMutation.mutate({ saveMode: '4weekly' }); }}
                >
                  <span className="font-semibold mr-2">Every 4 weeks</span>
                  <span className="text-slate-500 text-xs">— update every 4th week from now on</span>
                </Button>
              </div>
              <div className="flex justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          {/* End Pattern dialog */}
          <AlertDialog open={endPatternDialogOpen} onOpenChange={setEndPatternDialogOpen}>
            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>End Recurring Pattern</AlertDialogTitle>
                <AlertDialogDescription>
                  All shifts in this pattern after the chosen date will be permanently removed. Past shifts are untouched.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-3 space-y-2">
                <Label>End pattern after this date</Label>
                <Input
                  type="date"
                  min={shift.date}
                  value={endPatternDate}
                  onChange={(e) => setEndPatternDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={!endPatternDate || endPatternMutation.isPending}
                  onClick={() => endPatternMutation.mutate()}
                >
                  {endPatternMutation.isPending ? 'Removing...' : 'End Pattern'}
                </Button>
              </div>
            </AlertDialogContent>
          </AlertDialog>

          {isSwapModalOpen && (
          <ShiftSwapRequest
          shift={shift}
          open={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          />
          )}

          {/* Shift Summary / Clock Off popup */}
          <AlertDialog open={shiftSummaryOpen} onOpenChange={setShiftSummaryOpen}>
          <AlertDialogContent className="max-w-md flex flex-col p-0 gap-0 overflow-hidden" style={{ maxHeight: '90dvh' }}>
            {/* Full-width close bar — same pattern as the shift popup */}
            <button
              onClick={() => setShiftSummaryOpen(false)}
              className="w-full flex items-center justify-between px-5 py-4 bg-teal-600 text-white flex-shrink-0 active:bg-teal-700 touch-manipulation"
            >
              <AlertDialogTitle className="text-base font-semibold text-white">Shift Summary</AlertDialogTitle>
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 min-h-0">
              <AlertDialogDescription asChild>
                <div className="space-y-4 text-sm">
                  {(() => {
                    const summary = getShiftSummary();
                    return (
                      <>
                        {/* Calls Breakdown */}
                        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                          <p className="font-semibold text-slate-900 text-sm">Calls Attended</p>
                          {summary.callDetails.map((call, i) => {
                            const hasLog = shiftCareLogs.some(log => {
                              if (log.id === call.care_log_id || log.shift_call_id === call.id) return true;
                              if (log.shift_call_id && log.status === 'submitted') {
                                const partnerCall = pairedCalls.find(pc => pc.id === log.shift_call_id);
                                if (partnerCall && partnerCall.service_user_id === call.service_user_id && partnerCall.scheduled_time === call.scheduled_time) return true;
                              }
                              return false;
                            });
                            return (
                              <div key={call.id} className="flex items-center justify-between py-1 border-b border-slate-200 last:border-0">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">{i + 1}</span>
                                  <span className="text-slate-800 truncate">{call.service_user_name}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {call.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                                  {call.status === 'in_progress' && <Play className="w-4 h-4 text-blue-500" />}
                                  {call.status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                                  {call.status === 'not_at_home' && <MapPin className="w-4 h-4 text-amber-500" />}
                                  {call.status === 'missed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                  {hasLog ? (
                                    <FileText className="w-4 h-4 text-green-500" />
                                  ) : call.status !== 'missed' && call.status !== 'not_at_home' ? (
                                    <FileText className="w-4 h-4 text-red-400" />
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                          <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                            <div className="bg-green-50 rounded px-2 py-1">
                              <span className="text-green-700 font-medium">{summary.completedCalls} completed</span>
                            </div>
                            {summary.pendingCalls > 0 && (
                              <div className="bg-amber-50 rounded px-2 py-1">
                                <span className="text-amber-700 font-medium">{summary.pendingCalls} pending</span>
                              </div>
                            )}
                            {summary.inProgressCalls > 0 && (
                              <div className="bg-blue-50 rounded px-2 py-1">
                                <span className="text-blue-700 font-medium">{summary.inProgressCalls} in progress</span>
                              </div>
                            )}
                            {summary.missedCalls > 0 && (
                              <div className="bg-red-50 rounded px-2 py-1">
                                <span className="text-red-700 font-medium">{summary.missedCalls} missed</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Driving & Mileage */}
                        <div className="bg-slate-50 rounded-lg p-3 space-y-1">
                          <p className="font-semibold text-slate-900 text-sm flex items-center gap-1"><Car className="w-4 h-4" /> Mileage</p>
                          <div className="flex justify-between text-slate-700">
                            <span>Drove to calls:</span>
                            <span className="font-medium">{summary.droveCalls}</span>
                          </div>
                          <div className="flex justify-between text-slate-700">
                            <span>Did not drive:</span>
                            <span className="font-medium">{summary.didNotDriveCalls}</span>
                          </div>
                          <div className="flex justify-between text-slate-900 font-semibold pt-1 border-t border-slate-200">
                            <span>Total Miles:</span>
                            <span>{summary.totalMiles} miles</span>
                          </div>
                        </div>

                        {/* Outstanding Logs Warning */}
                        {summary.outstandingLogs.length > 0 && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="font-semibold text-amber-800 text-sm flex items-center gap-1 mb-2">
                              <AlertCircle className="w-4 h-4" />
                              {summary.outstandingLogs.length} Outstanding Care Log{summary.outstandingLogs.length !== 1 ? 's' : ''}
                            </p>
                            <div className="space-y-1.5">
                              {summary.outstandingLogs.map(call => (
                                <button
                                  key={call.id}
                                  type="button"
                                  onClick={() => setSummaryLogCall(call)}
                                  className="w-full flex items-center justify-between px-2 py-1.5 rounded bg-white border border-amber-200 hover:bg-amber-100 transition-colors text-left"
                                >
                                  <span className="text-xs text-amber-800">{call.service_user_name} ({call.scheduled_time})</span>
                                  <span className="text-xs text-teal-600 font-medium flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    Fill Log
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </AlertDialogDescription>
            </div>

            {/* Fixed footer buttons — always reachable on iPhone */}
            <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => clockOffMutation.mutate()}
                disabled={clockOffMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {clockOffMutation.isPending ? 'Ending...' : 'Confirm End Shift'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={deleteShiftConfirm} onOpenChange={setDeleteShiftConfirm}>
          <AlertDialogContent>
          <AlertDialogHeader>
           <AlertDialogTitle>Remove Shift</AlertDialogTitle>
           <AlertDialogDescription>
             Choose how to remove this shift:
           </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 pt-1">
           <AlertDialogAction
             onClick={() => {
               deleteShiftMutation.mutate();
               setDeleteShiftConfirm(false);
             }}
             disabled={deleteShiftMutation.isPending}
             className="bg-amber-600 hover:bg-amber-700 w-full"
           >
             {deleteShiftMutation.isPending ? 'Clearing...' : 'Clear Staff (keep shift claimable)'}
           </AlertDialogAction>
           <AlertDialogAction
             onClick={() => {
               permanentDeleteMutation.mutate();
               setDeleteShiftConfirm(false);
             }}
             disabled={permanentDeleteMutation.isPending}
             className="bg-red-600 hover:bg-red-700 w-full"
           >
             {permanentDeleteMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
           </AlertDialogAction>
           <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
          </div>
          </AlertDialogContent>
          </AlertDialog>

          {/* Care Log Form opened from shift summary */}
          {summaryLogCall && (
            <CareLogForm
              shift={shift}
              serviceUser={{ id: summaryLogCall.service_user_id, full_name: summaryLogCall.service_user_name }}
              open={!!summaryLogCall}
              scheduledTime={summaryLogCall.scheduled_time}
              onClose={() => {
                setSummaryLogCall(null);
                queryClient.invalidateQueries({ queryKey: ['careLogs', shift.id, shift.paired_shift_id] });
                queryClient.invalidateQueries({ queryKey: ['shift-calls', shift.id] });
              }}
              callId={summaryLogCall.id}
            />
          )}

</>
          );
          }
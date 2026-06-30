import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { ShiftApi, ShiftCallApi, applyAreaFilter } from '@/api/rotaApi';
import { supabase } from '@/api/supabaseClient';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import DraftRecoveryPrompt from '@/components/ui/DraftRecoveryPrompt';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, addDays, eachDayOfInterval } from 'date-fns';
import { Calendar, Clock, Copy, Users } from 'lucide-react';
import { notifyAdminsOfActivity } from '@/utils/adminNotifications';

// Sit-in shift types — no client calls, only clock on/off
const SIT_IN_NAMES = new Set(['Sit In L', 'Sit In E', 'Sit In FD']);

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

export default function CreateShiftModal({ open, onClose, selectedDate, selectedAreaId }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('staff');
  const [shiftDate, setShiftDate] = useState(selectedDate);
  const [selectedRotaAreaId, setSelectedRotaAreaId] = useState(selectedAreaId || '');
  const [useMultipleDays, setUseMultipleDays] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [shiftsToCreate, setShiftsToCreate] = useState([]);
  const [sitInCoverRequired, setSitInCoverRequired] = useState('no');
  const [showSitInTimePopup, setShowSitInTimePopup] = useState(false);
  const [sitInTimeOn, setSitInTimeOn] = useState('');
  const [sitInTimeOff, setSitInTimeOff] = useState('');
  const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false);
  const [pendingShiftsData, setPendingShiftsData] = useState([]);
  const shiftInitialData = {
      shift_name: '',
      staff_id: '',
      service_user_id: '',
      start_time: '09:00',
      end_time: '17:00',
      visit_details: '',
    };

  const { formData, setFormData, hasDraft, restoreDraft, discardDraft, clearDraft } = useFormPersistence(
    `draft:createShift:${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : 'new'}`,
    shiftInitialData
  );

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      try {
        const users = await base44.entities.User.list('full_name', 500);
        return users
          .filter(u => u.is_active !== false)
          .map(u => ({
            ...u,
            displayName: u.staff_full_name || u.full_name || u.email?.split('@')[0] || 'Unknown'
          }))
          .sort((a, b) => a.displayName.localeCompare(b.displayName));
      } catch (error) {
        console.error('Error fetching staff:', error);
        return [];
      }
    },
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: async () => {
      const result = await base44.entities.ServiceUser.list();
      console.log('[CreateShift] Service users loaded:', result.length, result.slice(0, 2).map(s => ({ id: s.id, name: s.full_name, area_id: s.area_id, status: s.status, call_times: s.call_times?.length })));
      return result;
    },
  });

  const { data: shiftTypes = [], error: shiftTypesError } = useQuery({
    queryKey: ['shiftTypes', selectedAreaId],
    queryFn: async () => {
      console.log('[CreateShiftModal] Fetching shift types...');
      const result = await ShiftTypeApi.filterByArea(selectedAreaId);
      console.log('[CreateShiftModal] Shift types result:', result?.length, result);
      return result;
    },
  });
  if (shiftTypesError) console.error('[CreateShiftModal] Shift types error:', shiftTypesError);

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  const { data: callTypesData = [] } = useQuery({
    queryKey: ['callTypes', selectedAreaId],
    queryFn: async () => {
      let q = supabase.from('call_types').select('*').eq('is_active', true);
      if (selectedAreaId) q = q.or(`area_id.eq.${selectedAreaId},area_id.is.null`);
      const { data, error } = await q.order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  // Helper: get default tasks for a call type name
  const getDefaultTasks = (typeName) => {
    const ct = callTypesData.find(c => c.name === typeName);
    if (!ct?.default_tasks?.length) return [];
    return ct.default_tasks.map(text => ({ text, completed: false }));
  };

  // Compute matching virtual calls for the current form selection
  // One call_time entry = one visit = one ShiftCall
  // Only matches service users whose area matches the selected rota area
  const getMatchingCallsForShift = (areaId, startTime, endTime) => {
    if (!serviceUsers.length || !startTime || !endTime) {
      console.log('[CreateShift] getMatchingCalls bail: serviceUsers=', serviceUsers.length, 'start=', startTime, 'end=', endTime);
      return [];
    }
    // Require a valid area — don't auto-assign across all areas
    if (!areaId) {
      console.log('[CreateShift] getMatchingCalls bail: no valid area, areaId=', areaId);
      return [];
    }
    const shiftStart = timeToMinutes(startTime);
    const shiftEnd = timeToMinutes(endTime);
    const calls = [];

    console.log('[CreateShift] Matching calls: area=', areaId, 'window=', startTime, '-', endTime, 'serviceUsers=', serviceUsers.length);

    for (const su of serviceUsers) {
      if (!su.call_times || su.call_times.length === 0) continue;
      if (su.status !== 'active') continue;
      // Check both area_id and rota_area_id (entities layer adds aliases)
      const suArea = su.area_id || su.rota_area_id;
      if (suArea !== areaId) continue;
      for (const ct of su.call_times) {
        const callStart = timeToMinutes(ct.time);
        const callDuration = parseInt(ct.duration) || 30;
        const callEnd = callStart + callDuration;
        if (callStart >= shiftStart && callEnd <= shiftEnd) {
          // One call_time entry = one visit = one ShiftCall
          const types = (ct.types && Array.isArray(ct.types)) ? ct.types : (ct.type ? [ct.type] : ['Visit']);
          calls.push({
            service_user_id: su.id,
            service_user_name: su.full_name,
            service_user_address: su.address,
            scheduled_time: ct.time,
            duration_minutes: callDuration,
            call_type: types[0] || 'Visit',
            call_types: types,
            notes: ct.notes || '',
          });
        }
      }
    }
    console.log('[CreateShift] Matched', calls.length, 'calls');
    return calls;
  };

  // Preview count for the current form state (skip for sit-in shifts)
  const previewCalls = useMemo(() => {
    if (tab !== 'staff') return [];
    if (SIT_IN_NAMES.has(formData.shift_name)) return [];
    return getMatchingCallsForShift(
      selectedRotaAreaId || selectedAreaId,
      formData.start_time,
      formData.end_time
    );
  }, [serviceUsers, selectedRotaAreaId, selectedAreaId, formData.start_time, formData.end_time, formData.shift_name, tab]);

  const createShiftMutation = useMutation({
    mutationFn: async (shiftsData) => {
       console.log('[CreateShift] Creating shifts:', shiftsData.map(s => ({ date: s.date, area: s.rota_area_id, times: s.start_time + '-' + s.end_time, name: s.shift_name })));

       // Fetch blank shifts for the relevant dates/area to find replaceable slots
       const dates = [...new Set(shiftsData.map(s => s.date))].sort();
       const areaIds = [...new Set(shiftsData.map(s => s.rota_area_id).filter(Boolean))];

       let allBlanks = [];
       for (const aid of areaIds) {
         let q = supabase
           .from('shifts')
           .select('*')
           .is('staff_id', null)
           .gte('date', dates[0])
           .lte('date', dates[dates.length - 1]);
         q = applyAreaFilter(q, aid);
         const { data, error } = await q;
         if (!error && data) allBlanks.push(...data);
       }
       console.log('[CreateShift] Found', allBlanks.length, 'blank shifts in date range');

       // Build lookups: by shift_name and by times
       const blanksByName = {};  // area|date|shift_name → [blanks]
       const blanksByTime = {};  // area|date|start_time|end_time → [blanks]
       for (const s of allBlanks) {
         const sArea = s.rota_area_id || s.area_id;
         if (s.shift_name) {
           const nameKey = `${sArea}|${s.date}|${s.shift_name}`;
           if (!blanksByName[nameKey]) blanksByName[nameKey] = [];
           blanksByName[nameKey].push(s);
         }
         const timeKey = `${sArea}|${s.date}|${s.start_time}|${s.end_time}`;
         if (!blanksByTime[timeKey]) blanksByTime[timeKey] = [];
         blanksByTime[timeKey].push(s);
       }

       const usedBlankIds = new Set();
       const shifts = [];
       let totalCalls = 0;
       let replaced = 0;
       for (const rawShiftData of shiftsData) {
         const { _sitInCover, ...shiftData } = rawShiftData;

         // Find a blank shift to replace — prefer matching by shift_name, fall back to times
         const areaId = shiftData.rota_area_id || shiftData.area_id || '';
         let blankShift = null;

         // 1. Try matching by shift name (most reliable)
         if (shiftData.shift_name) {
           const nameKey = `${areaId}|${shiftData.date}|${shiftData.shift_name}`;
           const candidates = blanksByName[nameKey] || [];
           blankShift = candidates.find(b => !usedBlankIds.has(b.id));
         }

         // 2. Fall back to matching by exact times
         if (!blankShift) {
           const timeKey = `${areaId}|${shiftData.date}|${shiftData.start_time}|${shiftData.end_time}`;
           const candidates = blanksByTime[timeKey] || [];
           blankShift = candidates.find(b => !usedBlankIds.has(b.id));
         }

         let shift;
         if (blankShift && shiftData.staff_id) {
           // Replace blank shift by assigning staff to it
           usedBlankIds.add(blankShift.id);
           const updated = await ShiftApi.update(blankShift.id, {
             staff_id: shiftData.staff_id,
             staff_name: shiftData.staff_name,
             shift_name: shiftData.shift_name || blankShift.shift_name,
             start_time: shiftData.start_time,
             end_time: shiftData.end_time,
             visit_details: shiftData.visit_details,
             status: 'scheduled',
           });
           shift = { ...blankShift, ...updated, date: blankShift.date };
           replaced++;
           console.log('[CreateShift] Replaced blank shift', blankShift.id, blankShift.shift_name);
         } else {
           shift = await ShiftApi.create(shiftData);
           console.log('[CreateShift] Created new shift', shift.id, '(no blank match found)');
         }
         shifts.push(shift);

         // Sit-in shifts don't get client calls
         if (SIT_IN_NAMES.has(shiftData.shift_name)) {
           console.log('[CreateShift] Sit-in shift, skipping call auto-assign');
           continue;
         }

         // Auto-create ShiftCall records from matching service user call_times
         const matchingCalls = getMatchingCallsForShift(
           shiftData.rota_area_id,
           shiftData.start_time,
           shiftData.end_time
         );
         console.log('[CreateShift] Shift', shift.id, 'area:', shiftData.rota_area_id, '→', matchingCalls.length, 'matching calls');

         for (const call of matchingCalls) {
           try {
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
               tasks: getDefaultTasks(call.call_type),
               call_date: shiftData.date,
               status: 'pending',
               notes: call.notes || '',
             });
             totalCalls++;
           } catch (callError) {
             console.error('[CreateShift] Failed to create call:', call.service_user_name, call.scheduled_time, callError);
           }
         }

         // Create sit-in cover call if requested
         if (_sitInCover) {
           const { time_on, time_off } = _sitInCover;
           const durationMinutes = timeToMinutes(time_off) - timeToMinutes(time_on);
           const sitinNotes = JSON.stringify({
             sitin_cover: true,
             time_on,
             time_off,
             accepted: false,
             accepted_by: null,
             accepted_at: null,
           });
           try {
             await ShiftCallApi.create({
               shift_id: shift.id,
               service_user_name: 'Sit-in Required On Shift',
               service_user_address: '',
               scheduled_time: time_on,
               call_time: time_on,
               duration_minutes: durationMinutes > 0 ? durationMinutes : 60,
               call_type: 'sitin_cover',
               call_types: ['sitin_cover'],
               tasks: [],
               call_date: shiftData.date,
               status: 'pending',
               notes: sitinNotes,
             });
             totalCalls++;
           } catch (err) {
             console.error('[CreateShift] Failed to create sit-in cover call:', err);
           }

           // Send push notification to assigned staff
           if (shiftData.staff_id) {
             base44.functions.invoke('createNotification', {
               recipient_ids: [shiftData.staff_id],
               type: 'shift_activity',
               title: 'Sit-In Cover Required',
               message: `A sit-in cover call has been added to your shift on ${shiftData.date} (${time_on} - ${time_off}). Please accept when ready.`,
               priority: 'high',
               action_url: '/Rota',
               send_push: true,
             }).catch(e => console.warn('Sitin cover notification failed:', e));
           }

           notifyAdminsOfActivity({
             title: 'Sit-in cover created',
             message: `Sit-in cover added to ${shiftData.staff_name || 'staff'}'s shift on ${shiftData.date} (${time_on} - ${time_off}).`,
             excludeUserId: shiftData.staff_id,
             areaId: shiftData.rota_area_id || shiftData.area_id,
           });
         }
       }
       console.log('[CreateShift] Done. Total calls auto-assigned:', totalCalls, 'Replaced blank shifts:', replaced);
       return { shifts, totalCalls, replaced };
     },
    onSuccess: ({ shifts, totalCalls, replaced }) => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shift-calls'] });
      const callMsg = totalCalls > 0 ? ` with ${totalCalls} call${totalCalls !== 1 ? 's' : ''} auto-assigned` : '';
      const replaceMsg = replaced > 0 ? ` (${replaced} filled available slot${replaced !== 1 ? 's' : ''})` : '';
      toast.success(`${shifts.length} shift${shifts.length !== 1 ? 's' : ''} created${callMsg}${replaceMsg}`);
      setShiftsToCreate([]);
      setTimeout(() => onClose(), 100);
    },
    onError: (error) => {
      console.error('Failed to create shifts:', error);
      toast.error('Failed: ' + (error.message || 'Failed to create shifts'));
    }
  });

  const handleAddShift = () => {
    if (tab === 'client' && !formData.service_user_id) return;

    const staffMember = staff.find(s => s.id === formData.staff_id);
    const serviceUser = serviceUsers.find(s => s.id === formData.service_user_id);
    const areaId = selectedRotaAreaId || selectedAreaId || null;

    let dates = [format(shiftDate, 'yyyy-MM-dd')];
    if (useMultipleDays && endDate) {
      const startDate = new Date(shiftDate);
      const end = new Date(endDate);
      dates = eachDayOfInterval({ start: startDate, end }).map(d => format(d, 'yyyy-MM-dd'));
    }

    // Count matching calls for preview (skip for sit-in shifts)
    const matchCount = (tab === 'staff' && !SIT_IN_NAMES.has(formData.shift_name))
      ? getMatchingCallsForShift(areaId, formData.start_time, formData.end_time).length
      : 0;

    const newShifts = dates.map(date => ({
      ...(formData.shift_name && { shift_name: formData.shift_name }),
      ...(tab === 'staff' ? {
        ...(formData.staff_id && { staff_id: formData.staff_id, staff_name: staffMember?.displayName }),
      } : {
        service_user_id: formData.service_user_id,
        service_user_name: serviceUser?.full_name,
      }),
      date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      visit_details: formData.visit_details || 'Follow Care Plans & Citizens Wishes at all times',
      status: 'scheduled',
      rota_area_id: areaId,
      area_id: areaId,
      _matchingCalls: matchCount, // preview only, stripped before create
      _sitInCover: (tab === 'staff' && sitInCoverRequired === 'yes' && sitInTimeOn && sitInTimeOff)
        ? { time_on: sitInTimeOn, time_off: sitInTimeOff }
        : null,
    }));

    setShiftsToCreate([...shiftsToCreate, ...newShifts]);

    setFormData({
      ...formData,
      shift_name: '',
      start_time: '09:00',
      end_time: '17:00',
      visit_details: '',
    });
    setSitInCoverRequired('no');
    setSitInTimeOn('');
    setSitInTimeOff('');
    setShiftDate(selectedDate);
    setEndDate('');
    setUseMultipleDays(false);
  };

  const handleRemoveShift = (index) => {
    setShiftsToCreate(shiftsToCreate.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (shiftsToCreate.length === 0) {
      handleAddShift();
      return;
    }
    const cleaned = shiftsToCreate
      .filter(s => s !== undefined)
      .map(({ _matchingCalls, ...rest }) => rest);
    // Only offer recurrence when creating a single shift
    if (cleaned.length === 1) {
      setPendingShiftsData(cleaned);
      setRecurrenceDialogOpen(true);
    } else {
      createShiftMutation.mutate(cleaned);
    }
  };

  const handleRecurrenceChoice = (mode) => {
    setRecurrenceDialogOpen(false);
    if (mode === 'single' || pendingShiftsData.length === 0) {
      createShiftMutation.mutate(pendingShiftsData);
      return;
    }
    const base = pendingShiftsData[0];
    const baseDate = new Date(base.date + 'T12:00:00');
    const intervalDays = mode === 'biweekly' ? 14 : 7;
    const occurrences = 12;
    const expanded = Array.from({ length: occurrences }, (_, i) => ({
      ...base,
      date: format(addDays(baseDate, i * intervalDays), 'yyyy-MM-dd'),
    }));
    createShiftMutation.mutate(expanded);
  };

  return (
    <>
    <DraftRecoveryPrompt open={open && hasDraft} onRestore={restoreDraft} onDiscard={discardDraft} />
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Rota</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={() => { setTab(tab === 'staff' ? 'client' : 'staff'); }} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
             <TabsTrigger value="staff">Staff Shift</TabsTrigger>
             <TabsTrigger value="client">One Off Visit</TabsTrigger>
           </TabsList>

          <TabsContent value="staff" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rota Area</Label>
              <Select value={selectedRotaAreaId} onValueChange={setSelectedRotaAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rota area" />
                </SelectTrigger>
                <SelectContent>
                  {rotaAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Shift Date</Label>
              <Input
                type="date"
                value={shiftDate ? format(shiftDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => setShiftDate(e.target.value ? new Date(e.target.value) : new Date())}
              />
            </div>



            <div className="space-y-2">
              <Label>Shift Name (Optional)</Label>
              <Select
                value={formData.shift_name}
                onValueChange={(value) => {
                  const selectedType = shiftTypes.find(t => t.name === value);
                  setFormData({ 
                    ...formData, 
                    shift_name: value,
                    start_time: selectedType?.start_time || formData.start_time,
                    end_time: selectedType?.end_time || formData.end_time
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or leave blank" />
                </SelectTrigger>
                <SelectContent>
                  {shiftTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      {type.name} {type.start_time && type.end_time && `(${type.start_time}-${type.end_time})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
              >
                <SelectTrigger>
                    {formData.staff_id ? <span>{staff.find(s => s.id === formData.staff_id)?.displayName}</span> : <SelectValue placeholder="Select staff member" />}
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            {/* Sit-in Cover Required dropdown */}
            <div className="space-y-2">
              <Label>Any Sit In Cover Required For This Shift?</Label>
              <Select
                value={sitInCoverRequired}
                onValueChange={(value) => {
                  setSitInCoverRequired(value);
                  if (value === 'yes') {
                    setShowSitInTimePopup(true);
                  } else {
                    setSitInTimeOn('');
                    setSitInTimeOff('');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
              {sitInCoverRequired === 'yes' && sitInTimeOn && sitInTimeOff && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium">
                    Sit-in cover: {sitInTimeOn} - {sitInTimeOff}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-amber-700 mt-1 h-7 px-2"
                    onClick={() => setShowSitInTimePopup(true)}
                  >
                    Edit Times
                  </Button>
                </div>
              )}
            </div>

            {/* Live preview of auto-matched calls */}
            {previewCalls.length > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                <p className="text-sm text-teal-800 font-medium flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {previewCalls.length} client call{previewCalls.length !== 1 ? 's' : ''} will be auto-assigned
                </p>
                <p className="text-xs text-teal-600 mt-1">
                  Based on active clients in this area with call times within {formData.start_time}–{formData.end_time}. You can edit calls after the shift is created.
                </p>
              </div>
            )}

          </TabsContent>

          <TabsContent value="client" className="space-y-4 py-4">
            {selectedDate && (
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {format(selectedDate, 'EEEE, d MMMM yyyy')}
              </p>
            )}

            <div className="space-y-2">
              <Label>Rota Area</Label>
              <Select value={selectedRotaAreaId} onValueChange={setSelectedRotaAreaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rota area" />
                </SelectTrigger>
                <SelectContent>
                  {rotaAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Service User / Client</Label>
              <Select
                value={formData.service_user_id}
                onValueChange={(value) => setFormData({ ...formData, service_user_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {serviceUsers.filter(s => s.status === 'active').map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Start Time</Label>
                 <Input
                   type="time"
                   value={formData.start_time}
                   onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                 />
               </div>
               <div className="space-y-2">
                 <Label>End Time</Label>
                 <Input
                   type="time"
                   value={formData.end_time}
                   onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                 />
               </div>
             </div>

            <div className="space-y-2">
              <Label>Visit Details</Label>
              <Textarea
                placeholder="Enter details about the visit..."
                value={formData.visit_details}
                onChange={(e) => setFormData({ ...formData, visit_details: e.target.value })}
                className="min-h-24"
              />
            </div>
            </TabsContent>
        </Tabs>

        {shiftsToCreate.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Shifts to Create ({shiftsToCreate.length})</Label>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[...shiftsToCreate].sort((a, b) => {
                if (a.date !== b.date) return a.date.localeCompare(b.date);
                return a.start_time.localeCompare(b.start_time);
              }).map((shift, idx) => (
                <Card key={idx} className="p-3 flex items-center justify-between bg-slate-50">
                  <div className="text-sm flex-1">
                    <p className="font-medium text-slate-900">
                      {shift.staff_name || shift.service_user_name}
                      {shift.shift_name && <span className="text-teal-600 ml-2">({shift.shift_name})</span>}
                    </p>
                    <p className="text-xs text-slate-600">
                      {format(new Date(shift.date), 'dd/MM/yyyy')} • {shift.start_time} - {shift.end_time}
                    </p>
                    {shift._matchingCalls > 0 && (
                      <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {shift._matchingCalls} client call{shift._matchingCalls !== 1 ? 's' : ''} will be auto-assigned
                      </p>
                    )}
                    {shift._sitInCover && (
                      <p className="text-xs text-amber-600 mt-1">
                        Sit-in cover: {shift._sitInCover.time_on} - {shift._sitInCover.time_off}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveShift(idx)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                  >
                    Remove
                  </Button>
                  </Card>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddShift}
            disabled={!formData.start_time || !formData.end_time || (tab === 'client' && !formData.service_user_id) || (useMultipleDays && !endDate)}
            variant="outline"
          >
            Add Shift
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={shiftsToCreate.length === 0 || createShiftMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {createShiftMutation.isPending ? 'Creating...' : `Create ${shiftsToCreate.length} Shift${shiftsToCreate.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Recurrence dialog */}
    <AlertDialog open={recurrenceDialogOpen} onOpenChange={setRecurrenceDialogOpen}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Repeating Shift?</AlertDialogTitle>
          <AlertDialogDescription>
            Would you like to create this as a one-off or a repeating shift?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Button variant="outline" className="justify-start min-h-[44px]" onClick={() => handleRecurrenceChoice('single')}>
            <span className="font-semibold mr-2">This shift only</span>
            <span className="text-slate-500 text-xs">— one date, no recurrence</span>
          </Button>
          <Button variant="outline" className="justify-start min-h-[44px]" onClick={() => handleRecurrenceChoice('weekly')}>
            <span className="font-semibold mr-2">Repeat every week</span>
            <span className="text-slate-500 text-xs">— same day, 12 weeks</span>
          </Button>
          <Button variant="outline" className="justify-start min-h-[44px]" onClick={() => handleRecurrenceChoice('biweekly')}>
            <span className="font-semibold mr-2">Repeat every 2 weeks</span>
            <span className="text-slate-500 text-xs">— alternating weeks, 12 occurrences</span>
          </Button>
        </div>
        <div className="flex justify-end">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </div>
      </AlertDialogContent>
    </AlertDialog>

    {/* Sit-in Cover Time Popup */}
    <AlertDialog open={showSitInTimePopup} onOpenChange={setShowSitInTimePopup}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sit-In Cover Times</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Time On</Label>
                <Input
                  type="time"
                  value={sitInTimeOn}
                  onChange={(e) => setSitInTimeOn(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Time Off</Label>
                <Input
                  type="time"
                  value={sitInTimeOff}
                  onChange={(e) => setSitInTimeOff(e.target.value)}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3">
          <AlertDialogCancel onClick={() => {
            if (!sitInTimeOn || !sitInTimeOff) {
              setSitInCoverRequired('no');
            }
          }}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => setShowSitInTimePopup(false)}
            disabled={!sitInTimeOn || !sitInTimeOff}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Confirm
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
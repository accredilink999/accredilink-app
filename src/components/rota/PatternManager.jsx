import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftPatternApi, ShiftCallApi } from '@/api/rotaApi';
import { supabase } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CreatePatternModal from '@/components/rota/CreatePatternModal';
import { Plus, Trash2, Play, Square, Calendar, Edit, Zap, Eraser, UserX } from 'lucide-react';
import { toast } from 'sonner';

export default function PatternManager({ open, onClose }) {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState(null);
  const [addingCallsToPattern, setAddingCallsToPattern] = useState(null);
  const [redeployConfirmPattern, setRedeployConfirmPattern] = useState(null);
  const [deleteConfirmPattern, setDeleteConfirmPattern] = useState(null);
  const [clearShiftsConfirmPattern, setClearShiftsConfirmPattern] = useState(null);
  const [cleanupStaffId, setCleanupStaffId] = useState('');
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false);
  const [redeployWeeks, setRedeployWeeks] = useState(1);

  const { data: patterns = [] } = useQuery({
    queryKey: ['shift-patterns'],
    queryFn: () => ShiftPatternApi.list('-created_at', 100),
  });

  // Fetch distinct staff who have assigned future shifts (for orphan cleanup)
  const today = new Date().toISOString().split('T')[0];
  const { data: assignedStaff = [] } = useQuery({
    queryKey: ['assigned-staff-shifts', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select('staff_id, staff_name')
        .not('staff_id', 'is', null)
        .gte('date', today)
        .order('staff_name');
      if (error) throw error;
      // Deduplicate by staff_id
      const seen = new Set();
      return (data || []).filter(s => {
        if (seen.has(s.staff_id)) return false;
        seen.add(s.staff_id);
        return true;
      });
    },
    enabled: open,
  });

  const cleanupStaffMutation = useMutation({
    mutationFn: async (staffId) => {
      const staffName = assignedStaff.find(s => s.staff_id === staffId)?.staff_name || 'Unknown';
      toast.info(`Clearing all future shifts for ${staffName}...`);

      // Find all future shifts for this staff member
      const { data: staffShifts, error } = await supabase
        .from('shifts')
        .select('id')
        .eq('staff_id', staffId)
        .gte('date', today);
      if (error) throw error;
      if (!staffShifts || staffShifts.length === 0) return { totalCleared: 0, staffName };

      const ids = staffShifts.map(s => s.id);
      // Delete shift_calls in batches
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        await supabase.from('shift_calls').delete().in('shift_id', batch);
      }
      // Revert shifts to blank in batches
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        await supabase
          .from('shifts')
          .update({ staff_id: null, staff_name: null, shift_pattern_id: null })
          .in('id', batch);
      }
      return { totalCleared: ids.length, staffName };
    },
    onSuccess: ({ totalCleared, staffName }) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftCalls'] });
      queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-staff-shifts'] });
      toast.success(`Cleared ${totalCleared} shift${totalCleared !== 1 ? 's' : ''} for ${staffName}`);
      setCleanupStaffId('');
    },
    onError: (error) => {
      toast.error('Failed to clear shifts: ' + error.message);
    },
  });

  const deletePatternMutation = useMutation({
    mutationFn: async (pattern) => {
      // 1. Find shifts created by this pattern and revert them to blank
      const { data: patternShifts } = await supabase
        .from('shifts')
        .select('id')
        .eq('shift_pattern_id', pattern.id);

      if (patternShifts && patternShifts.length > 0) {
        const shiftIds = patternShifts.map(s => s.id);
        // Delete any shift_calls for these shifts
        for (const shiftId of shiftIds) {
          await supabase.from('shift_calls').delete().eq('shift_id', shiftId);
        }
        // Revert shifts back to blank (available to claim)
        await supabase
          .from('shifts')
          .update({ staff_id: null, staff_name: null, shift_pattern_id: null })
          .eq('shift_pattern_id', pattern.id);
      }

      // 2. Also try matching by staff_id + rota_area_id (for shifts created before pattern tracking)
      if (pattern.staff_id && pattern.rota_area_id) {
        const { data: staffShifts } = await supabase
          .from('shifts')
          .select('id, shift_pattern_id')
          .eq('staff_id', pattern.staff_id)
          .eq('rota_area_id', pattern.rota_area_id)
          .is('shift_pattern_id', null)
          .gte('date', new Date().toISOString().split('T')[0]);

        // Only revert future shifts that have no pattern_id (legacy)
        if (staffShifts && staffShifts.length > 0) {
          for (const s of staffShifts) {
            await supabase.from('shift_calls').delete().eq('shift_id', s.id);
          }
          const legacyIds = staffShifts.map(s => s.id);
          await supabase
            .from('shifts')
            .update({ staff_id: null, staff_name: null })
            .in('id', legacyIds);
        }
      }

      // 3. Delete the pattern itself
      await ShiftPatternApi.delete(pattern.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-patterns'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftCalls'] });
      toast.success('Pattern deleted and shifts reverted to available');
    },
    onError: (error) => {
      toast.error('Failed to delete pattern: ' + error.message);
    },
  });

  const clearShiftsMutation = useMutation({
    mutationFn: async (pattern) => {
      toast.info(`Clearing shifts for ${pattern.staff_name}...`);
      let totalCleared = 0;

      // 1. Find shifts by shift_pattern_id
      const { data: patternShifts } = await supabase
        .from('shifts')
        .select('id')
        .eq('shift_pattern_id', pattern.id)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (patternShifts && patternShifts.length > 0) {
        const ids = patternShifts.map(s => s.id);
        // Delete shift_calls in batches
        for (let i = 0; i < ids.length; i += 50) {
          const batch = ids.slice(i, i + 50);
          await supabase.from('shift_calls').delete().in('shift_id', batch);
        }
        // Revert shifts to blank
        for (let i = 0; i < ids.length; i += 50) {
          const batch = ids.slice(i, i + 50);
          await supabase
            .from('shifts')
            .update({ staff_id: null, staff_name: null, shift_pattern_id: null })
            .in('id', batch);
        }
        totalCleared += patternShifts.length;
      }

      // 2. Fallback: also find by staff_id + rota_area_id + staff_name for orphaned shifts
      if (pattern.staff_id) {
        let fallbackQuery = supabase
          .from('shifts')
          .select('id')
          .eq('staff_id', pattern.staff_id)
          .gte('date', new Date().toISOString().split('T')[0]);

        if (pattern.rota_area_id) {
          fallbackQuery = fallbackQuery.eq('rota_area_id', pattern.rota_area_id);
        }

        const { data: staffShifts } = await fallbackQuery;
        if (staffShifts && staffShifts.length > 0) {
          const ids = staffShifts.map(s => s.id);
          for (let i = 0; i < ids.length; i += 50) {
            const batch = ids.slice(i, i + 50);
            await supabase.from('shift_calls').delete().in('shift_id', batch);
          }
          for (let i = 0; i < ids.length; i += 50) {
            const batch = ids.slice(i, i + 50);
            await supabase
              .from('shifts')
              .update({ staff_id: null, staff_name: null, shift_pattern_id: null })
              .in('id', batch);
          }
          totalCleared += staffShifts.length;
        }
      }

      return { totalCleared };
    },
    onSuccess: ({ totalCleared }) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftCalls'] });
      queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
      toast.success(`Cleared ${totalCleared} shift${totalCleared !== 1 ? 's' : ''} back to available`);
    },
    onError: (error) => {
      toast.error('Failed to clear shifts: ' + error.message);
    },
  });

  const togglePatternMutation = useMutation({
    mutationFn: ({ patternId, isActive }) =>
      ShiftPatternApi.update(patternId, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-patterns'] });
    },
  });

  const addCallsToShiftsMutation = useMutation({
    mutationFn: async (patternId) => {
      const allPatterns = await ShiftPatternApi.list();
      const pattern = allPatterns.find(p => p.id === patternId);
      if (!pattern) throw new Error('Pattern not found');

      const shifts = await ShiftApi.filter({ staff_id: pattern.staff_id });
      if (shifts.length === 0) {
        throw new Error('No shifts found for this staff member. Deploy the pattern first.');
      }

      const serviceUsers = await base44.entities.ServiceUser.filter({ status: 'active' });
      let totalCallsAdded = 0;

      for (const shift of shifts) {
        const existingCalls = await base44.entities.ClientCall.filter({ shift_id: shift.id });
        if (existingCalls.length > 0) continue;

        const matchingCalls = [];
        for (const serviceUser of serviceUsers) {
          if (!serviceUser.call_times || !Array.isArray(serviceUser.call_times)) continue;

          serviceUser.call_times.forEach(callTime => {
            try {
              const callStart = parseInt(callTime.time.split(':')[0]) * 60 + parseInt(callTime.time.split(':')[1]);
              const shiftStart = parseInt(shift.start_time.split(':')[0]) * 60 + parseInt(shift.start_time.split(':')[1]);
              const shiftEnd = parseInt(shift.end_time.split(':')[0]) * 60 + parseInt(shift.end_time.split(':')[1]);
              const callDuration = parseInt(callTime.duration) || 60;
              const callEnd = callStart + callDuration;

              if (callStart >= shiftStart && callEnd <= shiftEnd) {
                matchingCalls.push({
                  shift_id: shift.id,
                  service_user_id: serviceUser.id,
                  service_user_name: serviceUser.full_name,
                  scheduled_time: callTime.time,
                  date: shift.date,
                  type: callTime.type || 'visit',
                  duration_minutes: callDuration,
                });
              }
            } catch (e) {
              console.error('Error processing call:', e);
            }
          });
        }

        if (matchingCalls.length > 0) {
          await ShiftCallApi.bulkCreate(matchingCalls);
          totalCallsAdded += matchingCalls.length;
        }
      }
      
      return { totalCallsAdded };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
      toast.success(`Added ${data?.totalCallsAdded || 0} client calls`);
      setAddingCallsToPattern(null);
    },
    onError: (error) => {
      toast.error('Error: ' + error.message);
    }
  });

  const deployPatternMutation = useMutation({
    mutationFn: async (pattern) => {
      console.log('Starting deploy for pattern:', pattern);
      toast.info('Deploying pattern...');

      const shiftsToCreate = [];
      const rawStart = pattern.start_date ? new Date(pattern.start_date + 'T00:00:00') : new Date();
      // Anchor to the Sunday of the start_date week so days land correctly (Sun-Sat)
      const startDate = new Date(rawStart);
      startDate.setDate(startDate.getDate() - startDate.getDay());

      const numRepeats = pattern.repeat_count || 1;
      const daysPerCycle = pattern.pattern_type === 'weekly' ? 7 :
                           pattern.pattern_type === 'two_week' ? 14 :
                           pattern.pattern_type === 'three_week' ? 21 : 28;
      const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

      toast.info(`Deploying pattern for ${numRepeats} repeat${numRepeats !== 1 ? 's' : ''}...`);

      // Create shifts for all repetitions
      for (let repeat = 0; repeat < numRepeats; repeat++) {
        pattern.shifts.forEach(shift => {
          const targetDayJS = dayMap[shift.day_of_week];
          // Each cycle: startDate + (repeat * cycle length) + (week offset within pattern) + day offset
          const shiftDate = new Date(startDate);
          shiftDate.setDate(shiftDate.getDate() + (repeat * daysPerCycle) + ((shift.week - 1) * 7) + targetDayJS);

          const dateStr = shiftDate.toISOString().split('T')[0];
          shiftsToCreate.push({
            staff_id: pattern.staff_id,
            staff_name: pattern.staff_name,
            rota_area_id: pattern.rota_area_id || 'default',
            date: dateStr,
            start_time: shift.start_time,
            end_time: shift.end_time,
            status: 'scheduled',
            shift_pattern_id: pattern.id,
          });
        });
      }

      // Fetch blank shifts in this area for the date range
      const areaId = pattern.rota_area_id || 'default';
      const dates = [...new Set(shiftsToCreate.map(s => s.date))].sort();
      let blankShifts = [];
      if (areaId !== 'default' && dates.length > 0) {
        const { data, error } = await supabase
          .from('shifts')
          .select('id, date, start_time, end_time, rota_area_id, staff_id')
          .is('staff_id', null)
          .eq('rota_area_id', areaId)
          .gte('date', dates[0])
          .lte('date', dates[dates.length - 1]);
        if (!error && data) blankShifts = data;
      }

      // Build lookup: date|start_time|end_time → blank shift
      const blankShiftMap = {};
      for (const s of blankShifts) {
        const key = `${s.date}|${s.start_time}|${s.end_time}`;
        blankShiftMap[key] = s;
      }

      const allShifts = [];
      const toReplace = []; // { id, ... } for batch update
      const toCreate = [];
      let replaced = 0;

      for (const shiftData of shiftsToCreate) {
        const key = `${shiftData.date}|${shiftData.start_time}|${shiftData.end_time}`;
        const blank = blankShiftMap[key];

        if (blank) {
          toReplace.push(blank);
          allShifts.push({ ...blank, staff_id: shiftData.staff_id, staff_name: shiftData.staff_name });
          replaced++;
          delete blankShiftMap[key];
        } else {
          toCreate.push(shiftData);
        }
      }

      // Batch update all blank shifts at once (in chunks of 50)
      const BATCH_SIZE = 50;
      for (let i = 0; i < toReplace.length; i += BATCH_SIZE) {
        const batch = toReplace.slice(i, i + BATCH_SIZE);
        const ids = batch.map(s => s.id);
        await supabase
          .from('shifts')
          .update({
            staff_id: pattern.staff_id,
            staff_name: pattern.staff_name,
            shift_pattern_id: pattern.id,
            status: 'scheduled',
          })
          .in('id', ids);
      }

      if (toCreate.length > 0) {
        const created = await ShiftApi.bulkCreate(toCreate);
        allShifts.push(...created);
      }

      // Add client calls to all shifts — delete existing first to prevent duplicates, then bulk insert
      if (areaId !== 'default' && allShifts.length > 0) {
        // Delete any existing shift_calls for these shifts to prevent duplicates on re-deploy
        const allShiftIds = allShifts.map(s => s.id);
        for (let i = 0; i < allShiftIds.length; i += BATCH_SIZE) {
          const batch = allShiftIds.slice(i, i + BATCH_SIZE);
          await supabase.from('shift_calls').delete().in('shift_id', batch);
        }

        const serviceUsers = await base44.entities.ServiceUser.filter({ status: 'active' });
        const areaServiceUsers = serviceUsers.filter(su => (su.rota_area_id || su.area_id) === areaId);

        const allCallsToCreate = [];
        for (const shift of allShifts) {
          for (const serviceUser of areaServiceUsers) {
            if (!serviceUser.call_times || !Array.isArray(serviceUser.call_times)) continue;

            serviceUser.call_times.forEach(callTime => {
              try {
                const callStart = parseInt(callTime.time.split(':')[0]) * 60 + parseInt(callTime.time.split(':')[1]);
                const shiftStart = parseInt(shift.start_time.split(':')[0]) * 60 + parseInt(shift.start_time.split(':')[1]);
                const shiftEnd = parseInt(shift.end_time.split(':')[0]) * 60 + parseInt(shift.end_time.split(':')[1]);
                const callDuration = parseInt(callTime.duration) || 60;
                const callEnd = callStart + callDuration;

                if (callStart >= shiftStart && callEnd <= shiftEnd) {
                  allCallsToCreate.push({
                    shift_id: shift.id,
                    service_user_id: serviceUser.id,
                    service_user_name: serviceUser.full_name,
                    scheduled_time: callTime.time,
                    call_time: callTime.time,
                    call_date: shift.date,
                    call_type: callTime.type || 'visit',
                    call_types: [callTime.type || 'visit'],
                    duration_minutes: callDuration,
                    status: 'pending',
                    notes: '',
                  });
                }
              } catch (e) {
                console.error('Error processing call time:', e);
              }
            });
          }
        }

        if (allCallsToCreate.length > 0) {
          await ShiftCallApi.bulkCreate(allCallsToCreate);
        }
      }

      return { total: shiftsToCreate.length, replaced };
    },
    onSuccess: ({ total, replaced }) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
      const msg = replaced > 0
        ? `Pattern deployed: ${replaced} available shift${replaced !== 1 ? 's' : ''} filled in, ${total - replaced} new shift${total - replaced !== 1 ? 's' : ''} created`
        : 'Pattern deployed with client calls';
      toast.success(msg);
    },
    onError: (error) => {
      toast.error('Error deploying pattern: ' + error.message);
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shift Pattern Manager</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Pattern
            </Button>

            {/* Staff shift cleanup tool */}
            {assignedStaff.length > 0 && (
              <Card className="p-3 bg-orange-50 border-orange-200">
                <p className="text-xs font-medium text-orange-800 mb-2">
                  <UserX className="w-3 h-3 inline mr-1" />
                  Clear Staff Shifts (removes all future shifts for a staff member)
                </p>
                <div className="flex gap-2">
                  <select
                    value={cleanupStaffId}
                    onChange={(e) => setCleanupStaffId(e.target.value)}
                    className="flex-1 text-sm border border-orange-300 rounded px-2 py-1.5 bg-white"
                  >
                    <option value="">Select staff member...</option>
                    {assignedStaff.map((s) => (
                      <option key={s.staff_id} value={s.staff_id}>
                        {s.staff_name}
                      </option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    disabled={!cleanupStaffId || cleanupStaffMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => setCleanupConfirmOpen(true)}
                  >
                    <Eraser className="w-3 h-3 mr-1" />
                    {cleanupStaffMutation.isPending ? 'Clearing...' : 'Clear'}
                  </Button>
                </div>
              </Card>
            )}

            {patterns.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-500">No shift patterns created yet</p>
                <p className="text-sm text-slate-400 mt-2">
                  Create patterns to quickly schedule recurring shifts
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {patterns.map((pattern) => (
                  <Card key={pattern.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{pattern.pattern_name}</h4>
                        <p className="text-sm text-slate-600">{pattern.staff_name}</p>
                        <p className="text-sm text-slate-500">
                          {pattern.start_time} - {pattern.end_time}
                        </p>
                        {pattern.start_date && (
                          <p className="text-xs text-slate-400">
                            Starts: {new Date(pattern.start_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        )}
                        {pattern.repeat_count > 1 && (
                          <p className="text-xs text-slate-400">
                            Repeats: {pattern.repeat_count}x
                          </p>
                        )}
                      </div>
                      <Badge className={pattern.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
                        {pattern.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-slate-500 mb-1">Days:</p>
                      <div className="flex gap-1 flex-wrap">
                        {pattern.days_of_week?.map((day) => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {day.slice(0, 3)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {pattern.call_templates?.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-slate-500 mb-1">
                          Includes {pattern.call_templates.length} call(s)
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPattern(pattern)}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => { setRedeployWeeks(pattern.repeat_count || 1); setRedeployConfirmPattern(pattern); }}
                        disabled={deployPatternMutation.isPending}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {deployPatternMutation.isPending ? 'Deploying...' : 'Re-deploy'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addCallsToShiftsMutation.mutate(pattern.id)}
                        disabled={addCallsToShiftsMutation.isPending}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {addCallsToShiftsMutation.isPending ? 'Adding...' : 'Add Calls'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                        onClick={() => setClearShiftsConfirmPattern(pattern)}
                        disabled={clearShiftsMutation.isPending}
                      >
                        <Eraser className="w-3 h-3 mr-1" />
                        {clearShiftsMutation.isPending ? 'Clearing...' : 'Clear Shifts'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteConfirmPattern(pattern)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isCreateModalOpen && (
        <CreatePatternModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {editingPattern && (
        <CreatePatternModal
          open={!!editingPattern}
          onClose={() => setEditingPattern(null)}
          pattern={editingPattern}
        />
      )}

      {/* Re-deploy confirmation */}
      <AlertDialog open={!!redeployConfirmPattern} onOpenChange={(open) => {
        if (!open) setRedeployConfirmPattern(null);
        else if (redeployConfirmPattern) setRedeployWeeks(redeployConfirmPattern.repeat_count || 1);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-deploy Pattern?</AlertDialogTitle>
            <AlertDialogDescription>
              Re-deploying will assign staff to blank shifts. Choose how many repeats to deploy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-2">
            <Label>Deploy for how many repeats?</Label>
            <Select
              value={redeployWeeks.toString()}
              onValueChange={(value) => setRedeployWeeks(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 56 }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} {num === 1 ? 'repeat' : 'repeats'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                deployPatternMutation.mutate({ ...redeployConfirmPattern, repeat_count: redeployWeeks });
                setRedeployConfirmPattern(null);
              }}
            >
              Yes, Re-deploy
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirmPattern} onOpenChange={(open) => !open && setDeleteConfirmPattern(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pattern?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the pattern and revert all shifts it created back to available. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                deletePatternMutation.mutate(deleteConfirmPattern);
                setDeleteConfirmPattern(null);
              }}
            >
              Yes, Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear shifts confirmation */}
      <AlertDialog open={!!clearShiftsConfirmPattern} onOpenChange={(open) => !open && setClearShiftsConfirmPattern(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Deployed Shifts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revert all future shifts for <strong>{clearShiftsConfirmPattern?.staff_name}</strong> back to blank/available and remove their client calls. The pattern itself will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                clearShiftsMutation.mutate(clearShiftsConfirmPattern);
                setClearShiftsConfirmPattern(null);
              }}
            >
              Yes, Clear Shifts
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Staff cleanup confirmation */}
      <AlertDialog open={cleanupConfirmOpen} onOpenChange={(open) => !open && setCleanupConfirmOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Future Shifts?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revert ALL future shifts for <strong>{assignedStaff.find(s => s.staff_id === cleanupStaffId)?.staff_name}</strong> back to blank/available and remove their client calls. This is useful for cleaning up orphaned shifts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                cleanupStaffMutation.mutate(cleanupStaffId);
                setCleanupConfirmOpen(false);
              }}
            >
              Yes, Clear All Shifts
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
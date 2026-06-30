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
import { Input } from "@/components/ui/input";
import CreatePatternModal from '@/components/rota/CreatePatternModal';
import { Plus, Trash2, Play, Square, Calendar, Edit, Zap, Eraser, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { deployPatternShifts, clearPatternShifts } from '@/utils/deployPattern';

export default function PatternManager({ open, onClose, selectedAreaId }) {
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
  const [redeployFromDate, setRedeployFromDate] = useState(today);

  const { data: patterns = [] } = useQuery({
    queryKey: ['shift-patterns'],
    queryFn: () => ShiftPatternApi.list('-created_at', 100),
  });

  // Fetch distinct staff who have assigned future shifts (for orphan cleanup)
  const today = new Date().toISOString().split('T')[0];
  const { data: assignedStaff = [] } = useQuery({
    queryKey: ['assigned-staff-shifts', today, selectedAreaId],
    queryFn: async () => {
      let q = supabase
        .from('shifts')
        .select('staff_id, staff_name')
        .not('staff_id', 'is', null)
        .gte('date', today)
        .order('staff_name');
      if (selectedAreaId) q = q.eq('rota_area_id', selectedAreaId);
      const { data, error } = await q;
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

      // Find all future shifts for this staff member IN THIS AREA ONLY
      let cleanupQ = supabase
        .from('shifts')
        .select('id, paired_shift_id')
        .eq('staff_id', staffId)
        .gte('date', today);
      if (selectedAreaId) cleanupQ = cleanupQ.eq('rota_area_id', selectedAreaId);
      const { data: staffShifts, error } = await cleanupQ;
      if (error) throw error;
      if (!staffShifts || staffShifts.length === 0) return { totalCleared: 0, staffName };

      // Collect partner shift IDs to clear their pairing reference
      const partnerIds = staffShifts.filter(s => s.paired_shift_id).map(s => s.paired_shift_id);

      const ids = staffShifts.map(s => s.id);
      // Delete shift_calls in batches
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        await supabase.from('shift_calls').delete().in('shift_id', batch);
      }
      // Revert shifts to blank in batches (include pairing fields)
      for (let i = 0; i < ids.length; i += 50) {
        const batch = ids.slice(i, i + 50);
        await supabase
          .from('shifts')
          .update({ staff_id: null, staff_name: null, shift_pattern_id: null, paired_shift_id: null, paired_staff_name: null })
          .in('id', batch);
      }
      // Clear pairing on partner shifts
      for (let i = 0; i < partnerIds.length; i += 50) {
        const batch = partnerIds.slice(i, i + 50);
        await supabase.from('shifts')
          .update({ paired_shift_id: null, paired_staff_name: null })
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
      const partnerIds = new Set();

      // 1. Find shifts created by this pattern and revert them to blank
      const { data: patternShifts } = await supabase
        .from('shifts')
        .select('id, paired_shift_id')
        .eq('shift_pattern_id', pattern.id);

      if (patternShifts && patternShifts.length > 0) {
        for (const s of patternShifts) {
          if (s.paired_shift_id) partnerIds.add(s.paired_shift_id);
        }
        const shiftIds = patternShifts.map(s => s.id);
        // Delete any shift_calls for these shifts
        for (let i = 0; i < shiftIds.length; i += 50) {
          await supabase.from('shift_calls').delete().in('shift_id', shiftIds.slice(i, i + 50));
        }
        // Revert shifts back to blank (available to claim)
        await supabase
          .from('shifts')
          .update({ staff_id: null, staff_name: null, shift_pattern_id: null, paired_shift_id: null, paired_staff_name: null })
          .eq('shift_pattern_id', pattern.id);
      }

      // 2. Also try matching by staff_id + rota_area_id (for shifts created before pattern tracking)
      if (pattern.staff_id && pattern.rota_area_id) {
        const { data: staffShifts } = await supabase
          .from('shifts')
          .select('id, shift_pattern_id, paired_shift_id')
          .eq('staff_id', pattern.staff_id)
          .eq('rota_area_id', pattern.rota_area_id)
          .is('shift_pattern_id', null)
          .gte('date', new Date().toISOString().split('T')[0]);

        if (staffShifts && staffShifts.length > 0) {
          for (const s of staffShifts) {
            if (s.paired_shift_id) partnerIds.add(s.paired_shift_id);
          }
          const legacyIds = staffShifts.map(s => s.id);
          for (let i = 0; i < legacyIds.length; i += 50) {
            await supabase.from('shift_calls').delete().in('shift_id', legacyIds.slice(i, i + 50));
          }
          await supabase
            .from('shifts')
            .update({ staff_id: null, staff_name: null, paired_shift_id: null, paired_staff_name: null })
            .in('id', legacyIds);
        }
      }

      // 3. Clear pairing on partner shifts
      if (partnerIds.size > 0) {
        const ids = [...partnerIds];
        for (let i = 0; i < ids.length; i += 50) {
          await supabase.from('shifts')
            .update({ paired_shift_id: null, paired_staff_name: null })
            .in('id', ids.slice(i, i + 50));
        }
      }

      // 4. Delete the pattern itself
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
      const partnerIds = new Set();

      // 1. Find shifts by shift_pattern_id — check shift_name to know original vs created
      const { data: patternShifts } = await supabase
        .from('shifts')
        .select('id, shift_name, paired_shift_id')
        .eq('shift_pattern_id', pattern.id)
        .gte('date', new Date().toISOString().split('T')[0]);

      if (patternShifts && patternShifts.length > 0) {
        for (const s of patternShifts) {
          if (s.paired_shift_id) partnerIds.add(s.paired_shift_id);
        }
        const toRevert = patternShifts.filter(s => s.shift_name).map(s => s.id);
        const toDelete = patternShifts.filter(s => !s.shift_name).map(s => s.id);
        const allIds = patternShifts.map(s => s.id);

        // Delete shift_calls for all
        for (let i = 0; i < allIds.length; i += 50) {
          const batch = allIds.slice(i, i + 50);
          await supabase.from('shift_calls').delete().in('shift_id', batch);
        }
        // Revert original template shifts back to blank (include pairing fields)
        for (let i = 0; i < toRevert.length; i += 50) {
          const batch = toRevert.slice(i, i + 50);
          await supabase
            .from('shifts')
            .update({ staff_id: null, staff_name: null, shift_pattern_id: null, paired_shift_id: null, paired_staff_name: null })
            .in('id', batch);
        }
        // Delete shifts that were created new by deploy (no shift_name = not a template)
        for (let i = 0; i < toDelete.length; i += 50) {
          const batch = toDelete.slice(i, i + 50);
          await supabase.from('shifts').delete().in('id', batch);
        }
        totalCleared += patternShifts.length;
      }

      // 2. Fallback: also find by staff_id + rota_area_id for orphaned shifts
      // ALWAYS scope by area to prevent cross-area clearing
      if (pattern.staff_id && pattern.rota_area_id) {
        let fallbackQuery = supabase
          .from('shifts')
          .select('id, shift_name, paired_shift_id')
          .eq('staff_id', pattern.staff_id)
          .eq('rota_area_id', pattern.rota_area_id)
          .gte('date', new Date().toISOString().split('T')[0]);

        const { data: staffShifts } = await fallbackQuery;
        if (staffShifts && staffShifts.length > 0) {
          for (const s of staffShifts) {
            if (s.paired_shift_id) partnerIds.add(s.paired_shift_id);
          }
          const toRevert = staffShifts.filter(s => s.shift_name).map(s => s.id);
          const toDelete = staffShifts.filter(s => !s.shift_name).map(s => s.id);
          const allIds = staffShifts.map(s => s.id);

          for (let i = 0; i < allIds.length; i += 50) {
            const batch = allIds.slice(i, i + 50);
            await supabase.from('shift_calls').delete().in('shift_id', batch);
          }
          for (let i = 0; i < toRevert.length; i += 50) {
            const batch = toRevert.slice(i, i + 50);
            await supabase
              .from('shifts')
              .update({ staff_id: null, staff_name: null, shift_pattern_id: null, paired_shift_id: null, paired_staff_name: null })
              .in('id', batch);
          }
          for (let i = 0; i < toDelete.length; i += 50) {
            const batch = toDelete.slice(i, i + 50);
            await supabase.from('shifts').delete().in('id', batch);
          }
          totalCleared += staffShifts.length;
        }
      }

      // 3. Clear pairing on partner shifts
      if (partnerIds.size > 0) {
        const ids = [...partnerIds];
        for (let i = 0; i < ids.length; i += 50) {
          await supabase.from('shifts')
            .update({ paired_shift_id: null, paired_staff_name: null })
            .in('id', ids.slice(i, i + 50));
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
    mutationFn: async ({ pattern, fromDate }) => {
      toast.info('Clearing previous shifts...');
      const cleared = await clearPatternShifts({
        patternId: pattern.id,
        staffId: pattern.staff_id,
        areaId: pattern.rota_area_id,
        fromDate,
      });
      if (cleared > 0) toast.info(`Cleared ${cleared} previous shifts`);

      return deployPatternShifts({
        pattern,
        staffId: pattern.staff_id,
        staffName: pattern.staff_name,
        repeatCount: pattern.repeat_count || 1,
        patternId: pattern.id,
        fromDate,
      });
    },
    onSuccess: ({ filled, calls }) => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
      queryClient.invalidateQueries({ queryKey: ['shiftCalls'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-staff-shifts'] });
      toast.success(`Pattern deployed: ${filled} shifts filled, ${calls} calls created`);
    },
    onError: (error) => {
      toast.error('Error deploying pattern: ' + error.message);
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] !pb-4 overflow-y-auto">
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

                    <div className="flex gap-2 flex-wrap">
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
          selectedAreaId={selectedAreaId}
        />
      )}

      {editingPattern && (
        <CreatePatternModal
          open={!!editingPattern}
          onClose={() => setEditingPattern(null)}
          pattern={editingPattern}
          selectedAreaId={selectedAreaId}
        />
      )}

      {/* Re-deploy confirmation */}
      <AlertDialog open={!!redeployConfirmPattern} onOpenChange={(open) => {
        if (!open) setRedeployConfirmPattern(null);
        else if (redeployConfirmPattern) {
          setRedeployWeeks(redeployConfirmPattern.repeat_count || 1);
          setRedeployFromDate(today);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-deploy Pattern?</AlertDialogTitle>
            <AlertDialogDescription>
              Shifts <strong>before</strong> the date below are left untouched — payroll history stays intact.
              Only shifts from that date onwards will be cleared and redeployed with the updated pattern.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 space-y-4">
            <div className="space-y-1">
              <Label>Apply changes from</Label>
              <Input
                type="date"
                value={redeployFromDate}
                min={today}
                onChange={(e) => setRedeployFromDate(e.target.value)}
              />
              <p className="text-xs text-slate-500">Defaults to today — past shifts and payroll will not be affected.</p>
            </div>
            <div className="space-y-1">
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
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                deployPatternMutation.mutate({
                  pattern: { ...redeployConfirmPattern, repeat_count: redeployWeeks },
                  fromDate: redeployFromDate,
                });
                setRedeployConfirmPattern(null);
              }}
            >
              Re-deploy from {redeployFromDate}
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
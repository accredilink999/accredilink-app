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
import CreatePatternModal from '@/components/rota/CreatePatternModal';
import { Plus, Trash2, Play, Square, Calendar, Edit, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function PatternManager({ open, onClose }) {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState(null);
  const [addingCallsToPattern, setAddingCallsToPattern] = useState(null);
  const [redeployConfirmPattern, setRedeployConfirmPattern] = useState(null);
  const [deleteConfirmPattern, setDeleteConfirmPattern] = useState(null);

  const { data: patterns = [] } = useQuery({
    queryKey: ['shift-patterns'],
    queryFn: () => ShiftPatternApi.list('-created_at', 100),
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
          await base44.entities.ClientCall.bulkCreate(matchingCalls);
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
      const shiftsToCreate = [];
      const startDate = new Date();
      const daysPerCycle = pattern.pattern_type === 'weekly' ? 7 :
                           pattern.pattern_type === 'two_week' ? 14 :
                           pattern.pattern_type === 'three_week' ? 21 : 28;

      // Create shifts for 1 repetition
      for (let repeat = 0; repeat < 1; repeat++) {
        pattern.shifts.forEach(shift => {
          const dayMap = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
          const dayOffset = dayMap[shift.day_of_week] + ((shift.week - 1) * 7);
          const shiftDate = new Date(startDate);
          shiftDate.setDate(shiftDate.getDate() + dayOffset + (repeat * daysPerCycle));

          const dateStr = shiftDate.toISOString().split('T')[0];
          shiftsToCreate.push({
            staff_id: pattern.staff_id,
            staff_name: pattern.staff_name,
            rota_area_id: pattern.rota_area_id || 'default',
            rota_area_name: pattern.rota_area_name || 'Default',
            date: dateStr,
            start_time: shift.start_time,
            end_time: shift.end_time,
            status: 'scheduled',
            shift_pattern_id: pattern.id,
          });
        });
      }

      console.log('Shifts to create:', shiftsToCreate);

      // Fetch existing shifts to find blank/available ones we can replace
      const areaId = pattern.rota_area_id || 'default';
      const existingShifts = areaId !== 'default'
        ? await ShiftApi.list('-created_at', 5000)
        : [];
      // Build lookup: date|start_time|end_time → blank shift (no staff_id)
      const blankShiftMap = {};
      for (const s of existingShifts) {
        if (!s.date || s.staff_id) continue;
        const sArea = s.rota_area_id || s.area_id;
        if (sArea !== areaId) continue;
        const key = `${s.date}|${s.start_time}|${s.end_time}`;
        blankShiftMap[key] = s;
      }

      const allShifts = []; // track created or updated shifts for call assignment
      let replaced = 0;

      if (shiftsToCreate.length > 0) {
        const toCreate = [];

        for (const shiftData of shiftsToCreate) {
          const key = `${shiftData.date}|${shiftData.start_time}|${shiftData.end_time}`;
          const blank = blankShiftMap[key];

          if (blank) {
            // Replace the blank shift by assigning staff to it
            const updated = await ShiftApi.update(blank.id, {
              staff_id: shiftData.staff_id,
              staff_name: shiftData.staff_name,
              shift_pattern_id: shiftData.shift_pattern_id,
              status: 'scheduled',
            });
            allShifts.push({ ...blank, ...updated, start_time: blank.start_time, end_time: blank.end_time, date: blank.date });
            replaced++;
            // Remove from map so second shift at same time creates fresh
            delete blankShiftMap[key];
          } else {
            toCreate.push(shiftData);
          }
        }

        if (toCreate.length > 0) {
          const created = await ShiftApi.bulkCreate(toCreate);
          allShifts.push(...created);
        }

        // Add client calls to all shifts (created + replaced)
        if (areaId !== 'default') {
          const serviceUsers = await base44.entities.ServiceUser.filter({ status: 'active' });
          const areaServiceUsers = serviceUsers.filter(su => (su.rota_area_id || su.area_id) === areaId);

          for (const shift of allShifts) {
            // Check if shift already has calls (replaced blank shifts might)
            const existingCalls = await base44.entities.ClientCall.filter({ shift_id: shift.id });
            if (existingCalls.length > 0) continue;

            const matchingCalls = [];

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
                  console.error('Error processing call time:', e);
                }
              });
            }

            if (matchingCalls.length > 0) {
              await base44.entities.ClientCall.bulkCreate(matchingCalls);
            }
          }
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
                        onClick={() => setRedeployConfirmPattern(pattern)}
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
      <AlertDialog open={!!redeployConfirmPattern} onOpenChange={(open) => !open && setRedeployConfirmPattern(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Re-deploy Pattern?</AlertDialogTitle>
            <AlertDialogDescription>
              This pattern has already been deployed. Re-deploying may create duplicate shifts. Only use this after editing the pattern or adding new shifts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                deployPatternMutation.mutate(redeployConfirmPattern);
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
    </>
  );
}
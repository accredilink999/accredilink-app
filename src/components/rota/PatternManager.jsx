import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftPatternApi } from '@/api/rotaApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const { data: patterns = [] } = useQuery({
    queryKey: ['shift-patterns'],
    queryFn: () => ShiftPatternApi.list('-created_date', 100),
  });

  const deletePatternMutation = useMutation({
    mutationFn: (patternId) => ShiftPatternApi.delete(patternId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-patterns'] });
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
        ? await ShiftApi.list('-created_date', 5000)
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
                        onClick={() => deployPatternMutation.mutate(pattern)}
                        disabled={deployPatternMutation.isPending}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        {deployPatternMutation.isPending ? 'Deploying...' : 'Deploy'}
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
                        onClick={() => {
                          if (confirm('Delete this pattern?')) {
                            deletePatternMutation.mutate(pattern.id);
                          }
                        }}
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
    </>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { ShiftPatternApi, ShiftCallApi } from '@/api/rotaApi';
import { getMatchingCallsForShift } from '@/utils/shiftCallAutoAssign';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Clock, RotateCcw } from 'lucide-react';
import PatternPreview from './PatternPreview';

const DRAFT_KEY = 'pattern_modal_draft';

const defaultFormData = {
  pattern_name: '',
  staff_id: '',
  pattern_type: 'weekly',
  rota_area_id: '',
  shifts: [],
  repeat_count: 1,
  start_date: (() => { const d = new Date(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().split('T')[0]; })(),
};

const hasMeaningfulData = (data) =>
  data.pattern_name || data.staff_id || data.rota_area_id || data.shifts.length > 0;

export default function CreatePatternModal({ open, onClose, pattern = null }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(
      pattern ? {
        pattern_name: pattern.pattern_name || '',
        staff_id: pattern.staff_id || '',
        pattern_type: pattern.pattern_type || 'weekly',
        rota_area_id: pattern.rota_area_id || '',
        shifts: pattern.shifts || [],
        repeat_count: pattern.repeat_count || 1,
        start_date: pattern.start_date || new Date().toISOString().split('T')[0],
      } : { ...defaultFormData }
    );
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const skipDraftSave = useRef(false);

  // Check for saved draft when modal opens (only for new patterns)
  useEffect(() => {
    if (open && !pattern) {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const draft = JSON.parse(saved);
          if (hasMeaningfulData(draft)) {
            setShowDraftBanner(true);
          }
        }
      } catch {}
    }
    if (!open) {
      setShowDraftBanner(false);
    }
  }, [open, pattern]);

  // Auto-save draft to localStorage on form changes
  useEffect(() => {
    if (!open || pattern || skipDraftSave.current) return;
    if (hasMeaningfulData(formData)) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }
  }, [formData, open, pattern]);

  const restoreDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        setFormData(JSON.parse(saved));
        toast.success('Draft restored');
      }
    } catch {}
    setShowDraftBanner(false);
  };

  const dismissDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftBanner(false);
  };

  const clearDraftAndClose = () => {
    localStorage.removeItem(DRAFT_KEY);
    skipDraftSave.current = true;
    setFormData({ ...defaultFormData });
    setShowDraftBanner(false);
    onClose();
    setTimeout(() => { skipDraftSave.current = false; }, 100);
  };


  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.filter({ status: 'active' }),
  });

  const { data: callTypesData = [] } = useQuery({
    queryKey: ['callTypes'],
    queryFn: () => base44.entities.CallType.list(),
  });

  const { data: shiftTypes = [] } = useQuery({
    queryKey: ['shiftTypes'],
    queryFn: () => ShiftTypeApi.list(),
  });

  const isRollingRota = formData.pattern_type !== 'weekly';

  const createPatternMutation = useMutation({
    mutationFn: async (data) => {
      if (pattern?.id) {
        return ShiftPatternApi.update(pattern.id, data);
      }
      return ShiftPatternApi.create(data);
    },
    onSuccess: async (createdPattern) => {
      queryClient.invalidateQueries({ queryKey: ['shift-patterns'] });
      // Deploy pattern: assign staff to matching blank shifts on the rota
      if (!pattern) {
        toast.success('Pattern saved successfully!');
        try {
          await createShiftsFromPattern(createdPattern, formData.repeat_count, createdPattern.id);
        } catch (error) {
          console.error('Error deploying shifts:', error);
          toast.error('Pattern saved but shift deployment failed: ' + error.message);
        }
      } else {
        toast.success('Pattern updated');
      }
      localStorage.removeItem(DRAFT_KEY);
      skipDraftSave.current = true;
      onClose();
      if (!pattern) {
        setFormData({ ...defaultFormData });
      }
      setTimeout(() => { skipDraftSave.current = false; }, 100);
    },
    onError: (error) => {
      console.error('[CreatePatternModal] Save error:', error);
      toast.error('Failed to save pattern: ' + (error.message || 'Unknown error'));
    },
  });

  const createShiftsFromPattern = async (patternData, numRepeats, patternId) => {
    const staffMember = staff.find(s => s.id === formData.staff_id);
    const staffName = staffMember?.staff_full_name || staffMember?.full_name;
    const rawStart = formData.start_date ? new Date(formData.start_date + 'T00:00:00') : new Date();
    // Anchor to Sunday of the start week
    const startDate = new Date(rawStart);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

    const daysPerCycle = formData.pattern_type === 'weekly' ? 7 :
                         formData.pattern_type === 'two_week' ? 14 :
                         formData.pattern_type === 'three_week' ? 21 : 28;

    toast.info(`Deploying pattern for ${numRepeats} week${numRepeats !== 1 ? 's' : ''}...`);

    // Calculate the full date range we need to cover
    const totalDays = daysPerCycle * numRepeats;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalDays);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    // Fetch all blank (unassigned) shifts in this area for the date range
    let query = supabase
      .from('shifts')
      .select('id, date, start_time, end_time, shift_name, rota_area_id, staff_id')
      .is('staff_id', null)
      .gte('date', startStr)
      .lte('date', endStr);

    if (formData.rota_area_id) {
      query = query.eq('rota_area_id', formData.rota_area_id);
    }

    const { data: blankShifts, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!blankShifts || blankShifts.length === 0) {
      toast.info('No blank shifts found in that area/date range to assign');
      return;
    }

    // Build a list of target dates + times from the pattern
    const targets = [];
    for (let repeat = 0; repeat < numRepeats; repeat++) {
      formData.shifts.forEach(shift => {
        const targetDayJS = dayMap[shift.day_of_week];
        const cycleStart = new Date(startDate);
        cycleStart.setDate(cycleStart.getDate() + (repeat * daysPerCycle) + ((shift.week - 1) * 7));

        const currentDay = cycleStart.getDay();
        let daysUntil = targetDayJS - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        const targetDate = new Date(cycleStart);
        targetDate.setDate(targetDate.getDate() + daysUntil);

        const shiftTypeName = shiftTypes.find(st => st.id === shift.shift_type)?.name || shift.shift_type;

        targets.push({
          date: targetDate.toISOString().split('T')[0],
          start_time: shift.start_time,
          end_time: shift.end_time,
          shift_name: shiftTypeName,
        });
      });
    }

    // Match targets to blank shifts — collect all matches first (no API calls yet)
    // Priority: date + shift_name (shift type), then date + exact times
    const matchedShifts = []; // { blankShift, target }
    for (const target of targets) {
      // Priority 1: date + shift type name (e.g. "Early", "Late", "Night")
      let match = target.shift_name
        ? blankShifts.find(bs =>
            bs.date === target.date &&
            bs.shift_name === target.shift_name &&
            !bs._used
          )
        : null;

      // Priority 2: date + exact start_time + end_time
      if (!match) {
        match = blankShifts.find(bs =>
          bs.date === target.date &&
          bs.start_time === target.start_time &&
          bs.end_time === target.end_time &&
          !bs._used
        );
      }

      if (match) {
        match._used = true;
        matchedShifts.push({ blankShift: match, target });
      } else {
        console.log('No blank shift match for:', target.date, target.start_time, '-', target.end_time, target.shift_name);
      }
    }

    if (matchedShifts.length === 0) {
      toast.info('No matching blank shifts found for the pattern times');
      return;
    }

    // Batch update all matched shifts in chunks of 50
    const BATCH_SIZE = 50;
    let assigned = 0;
    for (let i = 0; i < matchedShifts.length; i += BATCH_SIZE) {
      const batch = matchedShifts.slice(i, i + BATCH_SIZE);
      const ids = batch.map(m => m.blankShift.id);
      const { error: updateError } = await supabase
        .from('shifts')
        .update({ staff_id: formData.staff_id, staff_name: staffName, shift_pattern_id: patternId || null })
        .in('id', ids);
      if (updateError) {
        console.error('Batch shift update error:', updateError);
      } else {
        assigned += batch.length;
      }
    }

    // Collect all client calls for all matched shifts, then bulk insert
    const allCallsToCreate = [];
    for (const { blankShift } of matchedShifts) {
      const matchingCalls = getMatchingCallsForShift(
        serviceUsers,
        formData.rota_area_id,
        blankShift.start_time,
        blankShift.end_time
      );
      for (const call of matchingCalls) {
        const ct = callTypesData.find(c => c.name === call.call_type);
        const tasks = ct?.default_tasks?.length
          ? ct.default_tasks.map(text => ({ text, completed: false }))
          : [];
        allCallsToCreate.push({
          shift_id: blankShift.id,
          service_user_id: call.service_user_id,
          service_user_name: call.service_user_name,
          service_user_address: call.service_user_address,
          scheduled_time: call.scheduled_time,
          call_time: call.scheduled_time,
          duration_minutes: call.duration_minutes,
          call_type: call.call_type,
          call_types: call.call_types || [call.call_type],
          tasks,
          call_date: blankShift.date,
          status: 'pending',
          notes: call.notes || '',
        });
      }
    }

    // Bulk create all calls in batches
    let totalCalls = 0;
    if (allCallsToCreate.length > 0) {
      try {
        await ShiftCallApi.bulkCreate(allCallsToCreate);
        totalCalls = allCallsToCreate.length;
      } catch (err) {
        console.error('Bulk call creation error:', err);
        toast.error('Some client calls failed to create');
      }
    }

    if (assigned > 0) {
      toast.success(`Assigned ${staffName} to ${assigned} shift${assigned !== 1 ? 's' : ''} with ${totalCalls} call${totalCalls !== 1 ? 's' : ''}`);
    }

    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['shiftCalls'] });
  };



  const handleSubmit = () => {
    try {
      const staffMember = staff.find(s => s.id === formData.staff_id);
      const area = rotaAreas.find(a => a.id === formData.rota_area_id);

      // Compute derived fields for PatternManager display
      const uniqueDays = [...new Set(formData.shifts.map(s => s.day_of_week))];
      const allStartTimes = formData.shifts.map(s => s.start_time).filter(Boolean).sort();
      const allEndTimes = formData.shifts.map(s => s.end_time).filter(Boolean).sort();

      const payload = {
        pattern_name: formData.pattern_name,
        staff_id: formData.staff_id,
        pattern_type: formData.pattern_type,
        rota_area_id: formData.rota_area_id,
        shifts: formData.shifts,
        staff_name: staffMember?.staff_full_name || staffMember?.full_name || '',
        rota_area_name: area?.name || '',
        is_active: true,
        days_of_week: uniqueDays,
        start_time: allStartTimes[0] || '',
        end_time: allEndTimes[allEndTimes.length - 1] || '',
        start_date: formData.start_date || new Date().toISOString().split('T')[0],
        repeat_count: formData.repeat_count || 1,
      };

      console.log('[CreatePatternModal] Saving pattern:', payload);
      createPatternMutation.mutate(payload);
    } catch (err) {
      console.error('[CreatePatternModal] handleSubmit error:', err);
      toast.error('Error preparing pattern: ' + err.message);
    }
  };



  const days = [
    { value: 'sunday', label: 'Sun' },
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
  ];

  const addShift = (day, week = 1) => {
    setFormData(prev => ({
      ...prev,
      shifts: [...prev.shifts, {
        day_of_week: day,
        week: week,
        start_time: '07:00',
        end_time: '15:00',
        shift_type: 'early',
        call_templates: []
      }]
    }));
  };

  const removeShift = (index) => {
    setFormData(prev => ({
      ...prev,
      shifts: prev.shifts.filter((_, i) => i !== index)
    }));
  };

  const updateShift = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      shifts: prev.shifts.map((shift, i) => 
        i === index ? { ...shift, [field]: value } : shift
      )
    }));
  };

  const getShiftsForDay = (day, week = 1) => {
    return formData.shifts
      .map((shift, index) => ({ ...shift, index }))
      .filter(s => s.day_of_week === day && s.week === week);
  };

  const renderWeekView = (weekNumber) => (
    <div className="space-y-3">
      {days.map((day) => {
        const dayShifts = getShiftsForDay(day.value, weekNumber);
        return (
          <Card key={day.value} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="font-semibold text-slate-700">{day.label}</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addShift(day.value, weekNumber)}
                className="h-7"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Shift
              </Button>
            </div>

            <div className="space-y-2">
              {dayShifts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">No shifts</p>
              ) : (
                dayShifts.map((shift) => (
                  <div key={shift.index} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                    <Select
                       value={shift.shift_type}
                       onValueChange={(value) => {
                         updateShift(shift.index, 'shift_type', value);
                         const selectedShiftType = shiftTypes.find(st => st.id === value);
                         if (selectedShiftType?.start_time && selectedShiftType?.end_time) {
                           updateShift(shift.index, 'start_time', selectedShiftType.start_time);
                           updateShift(shift.index, 'end_time', selectedShiftType.end_time);
                         }
                       }}
                     >
                       <SelectTrigger className="w-28 h-8 text-xs">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         {shiftTypes.length > 0 ? (
                           shiftTypes.map((st) => (
                             <SelectItem key={st.id} value={st.id}>
                               {st.name}
                             </SelectItem>
                           ))
                         ) : (
                           <>
                             <SelectItem value="early">Early</SelectItem>
                             <SelectItem value="late">Late</SelectItem>
                             <SelectItem value="night">Night</SelectItem>
                             <SelectItem value="long_day">Long Day</SelectItem>
                           </>
                         )}
                       </SelectContent>
                     </Select>

                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <Input
                        type="time"
                        value={shift.start_time}
                        onChange={(e) => updateShift(shift.index, 'start_time', e.target.value)}
                        className="w-24 h-8 text-xs"
                      />
                      <span className="text-xs text-slate-400">-</span>
                      <Input
                        type="time"
                        value={shift.end_time}
                        onChange={(e) => updateShift(shift.index, 'end_time', e.target.value)}
                        className="w-24 h-8 text-xs"
                      />
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeShift(shift.index)}
                      className="h-7 w-7 p-0 ml-auto"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );

  const selectedStaff = staff.find(s => s.id === formData.staff_id);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-[98vw] lg:h-[98vh] max-h-[90vh] flex flex-col overflow-hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{pattern ? 'Edit Shift Pattern' : 'Create Shift Pattern'}</DialogTitle>
        </DialogHeader>

        {showDraftBanner && (
          <div className="flex-shrink-0 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <RotateCcw className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 flex-1">You have an unsaved draft from before. Restore it?</p>
            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100" onClick={restoreDraft}>
              Restore
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500" onClick={dismissDraft}>
              Discard
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-hidden min-h-0">
          <div className="grid lg:grid-cols-2 gap-6 h-full">
            {/* Form Section */}
            <div className="space-y-4 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pattern Name</Label>
              <Input
                value={formData.pattern_name}
                onChange={(e) => setFormData({ ...formData, pattern_name: e.target.value })}
                placeholder="e.g., Standard Rota"
              />
            </div>

            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select
                value={formData.staff_id}
                onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.filter(s => s.is_active !== false).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.staff_full_name || s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pattern Type</Label>
              <Select
                value={formData.pattern_type}
                onValueChange={(value) => setFormData({ ...formData, pattern_type: value, shifts: [] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly (7 days)</SelectItem>
                  <SelectItem value="two_week">Two Week Rolling (14 days)</SelectItem>
                  <SelectItem value="three_week">Three Week Rolling (21 days)</SelectItem>
                  <SelectItem value="four_week">Four Week Rolling (28 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rota Area</Label>
              <Select
                value={formData.rota_area_id}
                onValueChange={(value) => setFormData({ ...formData, rota_area_id: value })}
              >
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
                <Label>Start Date (must be a Sunday)</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => {
                    const picked = new Date(e.target.value + 'T00:00:00');
                    const day = picked.getDay();
                    if (day !== 0) {
                      // Snap back to previous Sunday
                      picked.setDate(picked.getDate() - day);
                    }
                    setFormData({ ...formData, start_date: picked.toISOString().split('T')[0] });
                  }}
                />
                <p className="text-xs text-slate-400">Weeks run Sunday to Saturday. Date will snap to the nearest Sunday.</p>
              </div>

              <div className="space-y-2">
                <Label>Deploy for how many weeks?</Label>
                <Select
                  value={formData.repeat_count.toString()}
                  onValueChange={(value) => setFormData({ ...formData, repeat_count: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 56 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'week' : 'weeks'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </div>

          {formData.pattern_type === 'weekly' ? (
            renderWeekView(1)
          ) : formData.pattern_type === 'two_week' ? (
            <Tabs defaultValue="week1" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="week1">Week 1</TabsTrigger>
                <TabsTrigger value="week2">Week 2</TabsTrigger>
              </TabsList>
              <TabsContent value="week1" className="mt-4">
                {renderWeekView(1)}
              </TabsContent>
              <TabsContent value="week2" className="mt-4">
                {renderWeekView(2)}
              </TabsContent>
            </Tabs>
          ) : formData.pattern_type === 'three_week' ? (
            <Tabs defaultValue="week1" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="week1">Week 1</TabsTrigger>
                <TabsTrigger value="week2">Week 2</TabsTrigger>
                <TabsTrigger value="week3">Week 3</TabsTrigger>
              </TabsList>
              <TabsContent value="week1" className="mt-4">
                {renderWeekView(1)}
              </TabsContent>
              <TabsContent value="week2" className="mt-4">
                {renderWeekView(2)}
              </TabsContent>
              <TabsContent value="week3" className="mt-4">
                {renderWeekView(3)}
              </TabsContent>
            </Tabs>
          ) : (
            <Tabs defaultValue="week1" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="week1">Week 1</TabsTrigger>
                <TabsTrigger value="week2">Week 2</TabsTrigger>
                <TabsTrigger value="week3">Week 3</TabsTrigger>
                <TabsTrigger value="week4">Week 4</TabsTrigger>
              </TabsList>
              <TabsContent value="week1" className="mt-4">
                {renderWeekView(1)}
              </TabsContent>
              <TabsContent value="week2" className="mt-4">
                {renderWeekView(2)}
              </TabsContent>
              <TabsContent value="week3" className="mt-4">
                {renderWeekView(3)}
              </TabsContent>
              <TabsContent value="week4" className="mt-4">
                {renderWeekView(4)}
              </TabsContent>
            </Tabs>
          )}

              {formData.shifts.length > 0 && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <p className="text-sm text-teal-700">
                    <strong>{formData.shifts.length}</strong> shift{formData.shifts.length !== 1 ? 's' : ''} configured
                  </p>
                </div>
              )}
            </div>

            {/* Preview Section */}
            <div className="hidden lg:block border-l border-slate-200 pl-6 overflow-y-auto">
              <PatternPreview 
                shifts={formData.shifts}
                patternType={formData.pattern_type}
                staffName={selectedStaff?.staff_full_name || selectedStaff?.full_name}
                patternName={formData.pattern_name}
              />
            </div>

            {/* Mobile Preview - Below form */}
            <div className="lg:hidden border-t border-slate-200 pt-4 overflow-y-auto">
              <PatternPreview 
                shifts={formData.shifts}
                patternType={formData.pattern_type}
                staffName={selectedStaff?.staff_full_name || selectedStaff?.full_name}
                patternName={formData.pattern_name}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2">
          <Button variant="outline" onClick={clearDraftAndClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!formData.pattern_name || !formData.staff_id || !formData.rota_area_id || formData.shifts.length === 0 || createPatternMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {createPatternMutation.isPending ? (pattern ? 'Saving...' : 'Creating & Deploying...') : (pattern ? 'Save Changes' : 'Create & Deploy Pattern')}
          </Button>
        </DialogFooter>


      </DialogContent>
    </Dialog>
  );
}
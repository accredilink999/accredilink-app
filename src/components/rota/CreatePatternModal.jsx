import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { ShiftPatternApi } from '@/api/rotaApi';
import { deployPatternShifts } from '@/utils/deployPattern';
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
  start_date: new Date().toISOString().split('T')[0],
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

    const result = await deployPatternShifts({
      pattern: {
        ...patternData,
        shifts: formData.shifts,
        start_date: formData.start_date,
        pattern_type: formData.pattern_type,
        rota_area_id: formData.rota_area_id,
      },
      staffId: formData.staff_id,
      staffName,
      repeatCount: numRepeats,
      patternId,
    });

    if (result.filled > 0) {
      toast.success(`Assigned ${staffName} to ${result.filled} shifts with ${result.calls} calls`);
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
                  <div key={shift.index} className="bg-slate-50 p-2 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
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
                         <SelectTrigger className="flex-1 h-8 text-xs">
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
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeShift(shift.index)}
                        className="h-7 w-7 p-0 flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3 text-red-600" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <Input
                        type="time"
                        value={shift.start_time}
                        onChange={(e) => updateShift(shift.index, 'start_time', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                      <span className="text-xs text-slate-400">-</span>
                      <Input
                        type="time"
                        value={shift.end_time}
                        onChange={(e) => updateShift(shift.index, 'end_time', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                    </div>
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
      <DialogContent className="max-w-[95vw] lg:max-w-[98vw] lg:h-[98vh] max-h-[90vh] !pb-4 !flex !flex-col !overflow-hidden" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
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

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid lg:grid-cols-2 gap-6 lg:h-full">
            {/* Form Section */}
            <div className="space-y-4 lg:overflow-y-auto lg:pr-2">
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
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
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
            <div className="hidden lg:block border-l border-slate-200 pl-6 overflow-y-auto min-h-0">
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
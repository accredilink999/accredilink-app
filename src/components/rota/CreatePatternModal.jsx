import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { ShiftApi, ShiftPatternApi } from '@/api/rotaApi';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Clock } from 'lucide-react';
import PatternPreview from './PatternPreview';

export default function CreatePatternModal({ open, onClose, pattern = null }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(
      pattern ? {
        pattern_name: pattern.pattern_name || '',
        staff_id: pattern.staff_id || '',
        pattern_type: pattern.pattern_type || 'weekly',
        rota_area_id: pattern.rota_area_id || '',
        shifts: pattern.shifts || [],
        repeat_count: 1,
      } : {
        pattern_name: '',
        staff_id: '',
        pattern_type: 'weekly',
        rota_area_id: '',
        shifts: [],
        repeat_count: 1,
      }
    );


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
      // For rolling rotas, create shifts with the repeat count
      if (isRollingRota && !pattern) {
        try {
          await createShiftsFromPattern(createdPattern, formData.repeat_count);
        } catch (error) {
          console.error('Error creating shifts:', error);
        }
      }
      toast.success(pattern ? 'Pattern updated' : 'Pattern created');
      onClose();
      if (!pattern) {
        setFormData({
          pattern_name: '',
          staff_id: '',
          pattern_type: 'weekly',
          rota_area_id: '',
          shifts: [],
          repeat_count: 1,
        });
      }
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const createShiftsFromPattern = async (patternData, numRepeats) => {
    const staffMember = staff.find(s => s.id === formData.staff_id);
    const startDate = new Date();
    const shiftsToCreate = [];
    let currentDate = new Date(startDate);

    // Calculate shifts per pattern cycle
    const daysPerCycle = formData.pattern_type === 'weekly' ? 7 : 
                         formData.pattern_type === 'two_week' ? 14 :
                         formData.pattern_type === 'three_week' ? 21 : 28;

    // Create shifts for each repeat
    for (let repeat = 0; repeat < numRepeats; repeat++) {
      formData.shifts.forEach(shift => {
        const dayMap = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
        const dayOffset = dayMap[shift.day_of_week] + ((shift.week - 1) * 7);
        const shiftDate = new Date(startDate);
        shiftDate.setDate(shiftDate.getDate() + dayOffset + (repeat * daysPerCycle));

        shiftsToCreate.push({
          staff_id: formData.staff_id,
          staff_name: staffMember?.staff_full_name || staffMember?.full_name,
          rota_area_id: formData.rota_area_id || 'default',
          rota_area_name: rotaAreas.find(a => a.id === formData.rota_area_id)?.name || 'Default',
          date: shiftDate.toISOString().split('T')[0],
          start_time: shift.start_time,
          end_time: shift.end_time,
          status: 'scheduled',
        });
      });
    }

    // Bulk create shifts
    if (shiftsToCreate.length > 0) {
      await ShiftApi.bulkCreate(shiftsToCreate);

      // Search and add matching client calls if rota area is selected
      if (formData.rota_area_id) {
        const areaServiceUsers = serviceUsers.filter(su => su.rota_area_id === formData.rota_area_id || !su.rota_area_id);
        
        for (const shiftToCreate of shiftsToCreate) {
          const matchingCalls = [];
          
          for (const serviceUser of areaServiceUsers) {
            if (!serviceUser.call_times) continue;
            
            serviceUser.call_times.forEach(callTime => {
              const callStart = parseInt(callTime.time.split(':')[0]) * 60 + parseInt(callTime.time.split(':')[1]);
              const shiftStart = parseInt(shiftToCreate.start_time.split(':')[0]) * 60 + parseInt(shiftToCreate.start_time.split(':')[1]);
              const shiftEnd = parseInt(shiftToCreate.end_time.split(':')[0]) * 60 + parseInt(shiftToCreate.end_time.split(':')[1]);
              const callDuration = callTime.duration || 60;
              const callEnd = callStart + callDuration;

              if (callStart >= shiftStart && callEnd <= shiftEnd) {
                matchingCalls.push({
                  shift_id: null, // Will be set after shift is created
                  service_user_id: serviceUser.id,
                  service_user_name: serviceUser.full_name,
                  scheduled_time: callTime.time,
                  date: shiftToCreate.date,
                  type: callTime.type || 'visit',
                  duration_minutes: callDuration,
                });
              }
            });
          }

          // Store calls to be assigned after shifts are created
          if (matchingCalls.length > 0) {
            // Assign calls to the created shift
            const createdShift = await ShiftApi.filter({ 
              staff_id: formData.staff_id, 
              date: shiftToCreate.date,
              start_time: shiftToCreate.start_time,
              end_time: shiftToCreate.end_time
            });
            
            if (createdShift.length > 0) {
              for (const call of matchingCalls) {
                await base44.entities.ClientCall.create({
                  ...call,
                  shift_id: createdShift[0].id,
                });
              }
            }
          }
        }
      }
    }

    queryClient.invalidateQueries({ queryKey: ['shifts'] });
    queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
  };



  const handleSubmit = async () => {
    const staffMember = staff.find(s => s.id === formData.staff_id);

    createPatternMutation.mutate({
      ...formData,
      staff_name: staffMember?.staff_full_name || staffMember?.full_name,
      is_active: true,
    });
  };



  const days = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' },
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
      <DialogContent className="max-w-[95vw] lg:max-w-[98vw] lg:h-[98vh] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{pattern ? 'Edit Shift Pattern' : 'Create Shift Pattern'}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid lg:grid-cols-2 gap-6 h-full">
            {/* Form Section */}
            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 180px)' }}>
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

            {isRollingRota && (
              <div className="space-y-2">
                <Label>Number of Repetitions</Label>
                <Select
                  value={formData.repeat_count.toString()}
                  onValueChange={(value) => setFormData({ ...formData, repeat_count: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 12].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'repeat' : 'repeats'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
            <div className="hidden lg:block border-l border-slate-200 pl-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
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

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={!formData.pattern_name || !formData.staff_id || formData.shifts.length === 0 || createPatternMutation.isPending || (isRollingRota && !formData.rota_area_id)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {createPatternMutation.isPending ? (pattern ? 'Saving...' : isRollingRota ? 'Creating & Deploying...' : 'Creating...') : (pattern ? 'Save Changes' : isRollingRota ? 'Create & Deploy Pattern' : 'Create Pattern')}
          </Button>
        </DialogFooter>


      </DialogContent>
    </Dialog>
  );
}
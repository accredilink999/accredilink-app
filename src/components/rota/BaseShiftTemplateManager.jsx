import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { ShiftApi } from '@/api/rotaApi';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Calendar, Play, Pencil, X, Loader2 } from 'lucide-react';
import { format, eachDayOfInterval, parseISO } from 'date-fns';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Mon' },
  { value: 'tuesday', label: 'Tue' },
  { value: 'wednesday', label: 'Wed' },
  { value: 'thursday', label: 'Thu' },
  { value: 'friday', label: 'Fri' },
  { value: 'saturday', label: 'Sat' },
  { value: 'sunday', label: 'Sun' },
];

const DAY_NAME_MAP = {
  0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday',
  4: 'thursday', 5: 'friday', 6: 'saturday',
};

export default function BaseShiftTemplateManager({ open, onClose }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [generateId, setGenerateId] = useState(null);
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    area_id: '',
    shift_type_name: '',
    start_time: '09:00',
    end_time: '17:00',
    days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['baseShiftTemplates'],
    queryFn: () => base44.entities.BaseShiftTemplate.list('name'),
  });

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  const { data: shiftTypes = [] } = useQuery({
    queryKey: ['shiftTypes'],
    queryFn: () => ShiftTypeApi.filter({ is_active: true }),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (editId) {
        return base44.entities.BaseShiftTemplate.update(editId, data);
      }
      return base44.entities.BaseShiftTemplate.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baseShiftTemplates'] });
      toast.success(editId ? 'Template updated' : 'Template created');
      resetForm();
    },
    onError: (e) => toast.error('Failed: ' + e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.BaseShiftTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['baseShiftTemplates'] });
      toast.success('Template deleted');
    },
  });

  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!generateId || !startDate || !endDate) return;
    const template = templates.find(t => t.id === generateId);
    if (!template) return;

    setGenerating(true);
    try {
      const days = eachDayOfInterval({
        start: parseISO(startDate),
        end: parseISO(endDate),
      });

      // Fetch existing shifts in this area for the date range to avoid duplicates
      const existingShifts = await ShiftApi.list('-created_date', 5000);
      const existingSet = new Set();
      for (const s of existingShifts) {
        if (!s.date) continue;
        const sArea = s.rota_area_id || s.area_id;
        if (sArea === template.area_id) {
          // Key: date + shift_name + start_time + end_time
          existingSet.add(`${s.date}|${s.shift_name}|${s.start_time}|${s.end_time}`);
        }
      }

      const templateDays = new Set(template.days_of_week || []);
      const shiftsToCreate = [];
      let skipped = 0;

      for (const day of days) {
        const dayName = DAY_NAME_MAP[day.getDay()];
        if (!templateDays.has(dayName)) continue;

        const dateStr = format(day, 'yyyy-MM-dd');
        const key = `${dateStr}|${template.shift_type_name}|${template.start_time}|${template.end_time}`;

        // Skip if a shift with the same type/time already exists on this day
        if (existingSet.has(key)) {
          skipped++;
          continue;
        }

        shiftsToCreate.push({
          staff_id: null,
          staff_name: null,
          date: dateStr,
          start_time: template.start_time,
          end_time: template.end_time,
          shift_name: template.shift_type_name,
          rota_area_id: template.area_id,
          status: 'scheduled',
          is_base_shift: true,
        });
      }

      if (shiftsToCreate.length === 0) {
        toast.error(skipped > 0
          ? `All ${skipped} day${skipped !== 1 ? 's' : ''} already have this shift — nothing to create`
          : 'No matching days in the selected range');
        setGenerating(false);
        return;
      }

      await ShiftApi.bulkCreate(shiftsToCreate);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      const msg = `${shiftsToCreate.length} available shift${shiftsToCreate.length !== 1 ? 's' : ''} created` +
        (skipped > 0 ? ` (${skipped} skipped — already exist)` : '');
      toast.success(msg);
      setGenerateId(null);
    } catch (e) {
      toast.error('Failed to generate shifts: ' + e.message);
    }
    setGenerating(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setFormData({
      name: '',
      area_id: '',
      shift_type_name: '',
      start_time: '09:00',
      end_time: '17:00',
      days_of_week: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    });
  };

  const startEdit = (template) => {
    setEditId(template.id);
    setFormData({
      name: template.name || '',
      area_id: template.area_id || '',
      shift_type_name: template.shift_type_name || '',
      start_time: template.start_time || '09:00',
      end_time: template.end_time || '17:00',
      days_of_week: template.days_of_week || [],
    });
    setShowForm(true);
  };

  const handleShiftTypeChange = (typeName) => {
    setFormData(prev => {
      const st = shiftTypes.find(s => s.name === typeName);
      return {
        ...prev,
        shift_type_name: typeName,
        ...(st?.start_time ? { start_time: st.start_time } : {}),
        ...(st?.end_time ? { end_time: st.end_time } : {}),
      };
    });
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day],
    }));
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.start_time || !formData.end_time) {
      toast.error('Name, start time, and end time are required');
      return;
    }
    if (formData.days_of_week.length === 0) {
      toast.error('Select at least one day of the week');
      return;
    }
    saveMutation.mutate(formData);
  };

  const getAreaName = (areaId) => rotaAreas.find(a => a.id === areaId)?.name || 'Any Area';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Base Shift Templates</DialogTitle>
        </DialogHeader>

        {/* Generate Shifts Dialog */}
        {generateId && (
          <Card className="p-4 border-2 border-teal-200 bg-teal-50 space-y-3">
            <p className="text-sm font-medium text-teal-800">Generate Available Shifts</p>
            <p className="text-xs text-teal-600">
              Creates empty shifts on the rota for staff to claim. Select a date range:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={!startDate || !endDate || generating}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {generating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                Generate
              </Button>
              <Button size="sm" variant="outline" onClick={() => setGenerateId(null)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <Card className="p-4 space-y-3 border-2 border-blue-200 bg-blue-50">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">{editId ? 'Edit Template' : 'New Template'}</p>
              <Button variant="ghost" size="icon" onClick={resetForm} className="h-6 w-6">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <Label className="text-xs">Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Morning Shift - North"
              />
            </div>
            <div>
              <Label className="text-xs">Rota Area</Label>
              <Select value={formData.area_id} onValueChange={(v) => setFormData(prev => ({ ...prev, area_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {rotaAreas.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: a.color || '#14b8a6' }} />
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Shift Type</Label>
              <Select value={formData.shift_type_name} onValueChange={handleShiftTypeChange}>
                <SelectTrigger><SelectValue placeholder="Select shift type" /></SelectTrigger>
                <SelectContent>
                  {shiftTypes.map(st => (
                    <SelectItem key={st.id} value={st.name}>
                      <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: st.color || '#14b8a6' }} />
                      {st.name} ({st.start_time} - {st.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Time *</Label>
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-xs">End Time *</Label>
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">Days of Week *</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <label key={day.value} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={formData.days_of_week.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <span className="text-xs">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={saveMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
              size="sm"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              {editId ? 'Update Template' : 'Create Template'}
            </Button>
          </Card>
        )}

        {/* Template List */}
        <div className="space-y-2">
          {!showForm && (
            <Button
              variant="outline"
              onClick={() => { resetForm(); setShowForm(true); }}
              className="w-full gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              Add Template
            </Button>
          )}

          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-4">Loading...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No templates yet. Create one to get started.</p>
          ) : (
            templates.map(template => (
              <Card key={template.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{template.name}</p>
                    <p className="text-xs text-slate-500">
                      {getAreaName(template.area_id)} &bull; {template.shift_type_name || 'No type'} &bull; {template.start_time} - {template.end_time}
                    </p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {(template.days_of_week || []).map(day => (
                        <Badge key={day} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        setGenerateId(template.id);
                        setEndDate('');
                      }}
                      title="Generate shifts"
                    >
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => startEdit(template)}
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        if (confirm('Delete this template?')) deleteMutation.mutate(template.id);
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

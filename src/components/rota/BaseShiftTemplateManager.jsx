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
import { Plus, Trash2, Calendar, Play, Pencil, X, Loader2, AlertTriangle } from 'lucide-react';
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
  const [showDeployAll, setShowDeployAll] = useState(false);
  const [deployAllStartDate, setDeployAllStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deployAllEndDate, setDeployAllEndDate] = useState('');
  const [deployingAll, setDeployingAll] = useState(false);
  const [showClearAll, setShowClearAll] = useState(false);
  const [clearStartDate, setClearStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clearEndDate, setClearEndDate] = useState('');
  const [clearing, setClearing] = useState(false);

  const handleDeployAll = async () => {
    if (!deployAllStartDate || !deployAllEndDate) return;
    if (templates.length === 0) {
      toast.error('No templates to deploy');
      return;
    }

    setDeployingAll(true);
    try {
      const days = eachDayOfInterval({
        start: parseISO(deployAllStartDate),
        end: parseISO(deployAllEndDate),
      });

      // Count existing shifts per key (supports multiple staff slots)
      const existingShifts = await ShiftApi.list('-created_date', 5000);
      const existingCount = {};
      for (const s of existingShifts) {
        if (!s.date) continue;
        const sArea = s.rota_area_id || s.area_id;
        const key = `${sArea}|${s.date}|${s.shift_name}|${s.start_time}|${s.end_time}`;
        existingCount[key] = (existingCount[key] || 0) + 1;
      }

      let totalCreated = 0;
      let totalSkipped = 0;
      const results = []; // per-template results for feedback

      // Track how many templates have been processed per key
      const templatesSeen = {};

      for (const template of templates) {
        if (template.is_active === false) continue;
        const templateDays = new Set(template.days_of_week || []);
        const shiftsForTemplate = [];
        let skippedForTemplate = 0;

        if (!template.area_id) {
          results.push({ name: template.name, created: 0, skipped: 0, error: 'no area set' });
          continue;
        }
        if (!templateDays.size) {
          results.push({ name: template.name, created: 0, skipped: 0, error: 'no days selected' });
          continue;
        }

        for (const day of days) {
          const dayName = DAY_NAME_MAP[day.getDay()];
          if (!templateDays.has(dayName)) continue;

          const dateStr = format(day, 'yyyy-MM-dd');
          const key = `${template.area_id}|${dateStr}|${template.shift_type_name}|${template.start_time}|${template.end_time}`;

          templatesSeen[key] = (templatesSeen[key] || 0) + 1;
          const needed = templatesSeen[key];
          const existing = existingCount[key] || 0;

          if (existing >= needed) {
            skippedForTemplate++;
            totalSkipped++;
            continue;
          }

          shiftsForTemplate.push({
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

        // Create this template's shifts in a separate batch
        if (shiftsForTemplate.length > 0) {
          try {
            await ShiftApi.bulkCreate(shiftsForTemplate);
            totalCreated += shiftsForTemplate.length;
            results.push({ name: template.name, created: shiftsForTemplate.length, skipped: skippedForTemplate });
          } catch (err) {
            console.error(`[DeployAll] Failed for template "${template.name}":`, err);
            results.push({ name: template.name, created: 0, skipped: skippedForTemplate, error: err.message });
          }
        } else {
          results.push({ name: template.name, created: 0, skipped: skippedForTemplate });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['shifts'] });

      if (totalCreated === 0) {
        const detail = results
          .filter(r => r.error || r.skipped > 0)
          .map(r => r.error ? `${r.name}: ${r.error}` : `${r.name}: ${r.skipped} already exist`)
          .join(', ');
        toast.error(`No shifts created. ${detail || 'All days already covered.'}`);
      } else {
        // Show per-template breakdown
        const breakdown = results
          .filter(r => r.created > 0 || r.error)
          .map(r => r.error ? `${r.name} (failed)` : `${r.name}: ${r.created}`)
          .join(', ');
        const skipMsg = totalSkipped > 0 ? ` (${totalSkipped} skipped)` : '';
        toast.success(`${totalCreated} shifts created${skipMsg} — ${breakdown}`);
      }
      setShowDeployAll(false);
    } catch (e) {
      toast.error('Failed to deploy all: ' + e.message);
    }
    setDeployingAll(false);
  };

  const handleClearAvailable = async () => {
    if (!clearStartDate || !clearEndDate) return;
    setClearing(true);
    try {
      const allShifts = await ShiftApi.list('-created_date', 5000);
      const startD = parseISO(clearStartDate);
      const endD = parseISO(clearEndDate);

      // Find blank/available shifts (no staff assigned) in the date range
      const toDelete = allShifts.filter(s => {
        if (!s.date || s.staff_id) return false;
        const d = parseISO(s.date);
        return d >= startD && d <= endD;
      });

      if (toDelete.length === 0) {
        toast.error('No available (unassigned) shifts found in that date range');
        setClearing(false);
        return;
      }

      // Delete them one by one (no bulk delete available)
      let deleted = 0;
      for (const shift of toDelete) {
        try {
          await ShiftApi.delete(shift.id);
          deleted++;
        } catch (err) {
          console.error('Failed to delete shift', shift.id, err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success(`Cleared ${deleted} available shift${deleted !== 1 ? 's' : ''}`);
      setShowClearAll(false);
    } catch (e) {
      toast.error('Failed to clear shifts: ' + e.message);
    }
    setClearing(false);
  };

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

      // Count existing shifts per key in this area (supports multiple staff slots)
      const existingShifts = await ShiftApi.list('-created_date', 5000);
      const existingCount = {};
      // Also count how many templates share the same params to know total slots needed
      const sameTemplateCount = templates.filter(t =>
        t.area_id === template.area_id &&
        t.shift_type_name === template.shift_type_name &&
        t.start_time === template.start_time &&
        t.end_time === template.end_time &&
        t.is_active !== false
      ).length;

      for (const s of existingShifts) {
        if (!s.date) continue;
        const sArea = s.rota_area_id || s.area_id;
        if (sArea === template.area_id) {
          const key = `${s.date}|${s.shift_name}|${s.start_time}|${s.end_time}`;
          existingCount[key] = (existingCount[key] || 0) + 1;
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

        // Skip only if enough shifts already exist to cover all templates with these params
        const existing = existingCount[key] || 0;
        if (existing >= sameTemplateCount) {
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

        {/* Deploy All Dialog */}
        {showDeployAll && (
          <Card className="p-4 border-2 border-orange-200 bg-orange-50 space-y-3">
            <p className="text-sm font-medium text-orange-800">Deploy All Templates</p>
            <p className="text-xs text-orange-600">
              Generates available shifts for ALL {templates.length} template{templates.length !== 1 ? 's' : ''} at once.
              Each template's area and day rules will be applied. Existing shifts are skipped.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={deployAllStartDate}
                  onChange={(e) => setDeployAllStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={deployAllEndDate}
                  onChange={(e) => setDeployAllEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleDeployAll}
                disabled={!deployAllStartDate || !deployAllEndDate || deployingAll}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {deployingAll ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
                {deployingAll ? 'Deploying...' : 'Deploy All'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowDeployAll(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        {/* Clear Available Shifts Dialog */}
        {showClearAll && (
          <Card className="p-4 border-2 border-red-200 bg-red-50 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm font-medium text-red-800">Clear Available Shifts</p>
            </div>
            <p className="text-xs text-red-600">
              This will delete all unassigned/available shifts in the selected date range.
              Shifts that already have staff assigned will NOT be affected.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={clearStartDate}
                  onChange={(e) => setClearStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={clearEndDate}
                  onChange={(e) => setClearEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleClearAvailable}
                disabled={!clearStartDate || !clearEndDate || clearing}
                className="bg-red-600 hover:bg-red-700"
              >
                {clearing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                {clearing ? 'Clearing...' : 'Clear Shifts'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowClearAll(false)}>
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { resetForm(); setShowForm(true); }}
                className="flex-1 gap-2"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add Template
              </Button>
              {templates.length > 0 && (
                <>
                  <Button
                    onClick={() => { setShowDeployAll(true); setDeployAllEndDate(''); }}
                    className="flex-1 gap-2 bg-orange-600 hover:bg-orange-700"
                    size="sm"
                  >
                    <Play className="w-4 h-4" />
                    Deploy All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => { setShowClearAll(true); setClearEndDate(''); }}
                    className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </Button>
                </>
              )}
            </div>
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

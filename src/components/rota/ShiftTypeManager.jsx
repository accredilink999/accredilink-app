import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Edit2, Loader2, Save } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const DEFAULT_TYPES = ['Early', 'Late', 'Sit In E', 'Sit In L', 'Sit In FD', 'SSCC'];

export default function ShiftTypeManager({ open, onClose }) {
  const queryClient = useQueryClient();
  const [newType, setNewType] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [newColor, setNewColor] = useState('#14b8a6');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editColor, setEditColor] = useState('#14b8a6');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingDeleteName, setPendingDeleteName] = useState('');

  const { data: shiftTypes = [] } = useQuery({
    queryKey: ['shiftTypes'],
    queryFn: () => ShiftTypeApi.filter({ is_active: true }),
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data) => ShiftTypeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTypes'] });
      toast.success('Shift type created');
      setNewType('');
      setNewStartTime('09:00');
      setNewEndTime('17:00');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, start_time, end_time, color, oldName, oldStartTime, oldEndTime }) => {
      console.log('[ShiftType] Saving:', { id, name, start_time, end_time, color });
      const saved = await ShiftTypeApi.update(id, { name, start_time, end_time, color });
      console.log('[ShiftType] Saved result:', saved);

      // Propagate changes to all future shifts using this shift type
      const today = new Date().toISOString().split('T')[0];
      const shiftUpdates = {};
      const timesChanged = start_time !== oldStartTime || end_time !== oldEndTime;
      if (start_time !== oldStartTime) shiftUpdates.start_time = start_time;
      if (end_time !== oldEndTime) shiftUpdates.end_time = end_time;
      if (name !== oldName) shiftUpdates.shift_name = name;

      const summary = { templates: 0, shifts: 0 };

      // Also update base shift templates that reference this shift type
      const templateUpdates = {};
      if (name !== oldName) templateUpdates.shift_type_name = name;
      if (start_time !== oldStartTime) templateUpdates.start_time = start_time;
      if (end_time !== oldEndTime) templateUpdates.end_time = end_time;

      if (Object.keys(templateUpdates).length > 0) {
        const { data: tplData, error: tplErr } = await supabase
          .from('base_shift_templates')
          .update(templateUpdates)
          .eq('shift_type_name', oldName)
          .select('id');
        if (tplErr) {
          console.error('[ShiftType] Template propagate error:', tplErr);
          toast.error('Failed to update templates: ' + tplErr.message);
        } else {
          summary.templates = tplData?.length || 0;
        }
      }

      if (Object.keys(shiftUpdates).length > 0) {
        // If times changed, fetch affected shifts first so we can fix pairing
        let affectedShifts = [];
        if (timesChanged) {
          const { data: affected } = await supabase
            .from('shifts')
            .select('id, paired_shift_id')
            .eq('shift_name', oldName)
            .gte('date', today)
            .not('paired_shift_id', 'is', null);
          affectedShifts = affected || [];
        }

        // Update all matching shifts from today forward
        const { data, error } = await supabase
          .from('shifts')
          .update(shiftUpdates)
          .eq('shift_name', oldName)
          .gte('date', today)
          .select('id');
        if (error) {
          console.error('[ShiftType] Shift propagate error:', error);
          toast.error('Shift type saved but failed to update live shifts: ' + error.message);
        } else {
          summary.shifts = data?.length || 0;
        }

        // Clear stale pairing on partner shifts that have a different shift type
        if (timesChanged && affectedShifts.length > 0) {
          const affectedIds = new Set(affectedShifts.map(s => s.id));
          const stalePartnerIds = affectedShifts
            .map(s => s.paired_shift_id)
            .filter(pid => pid && !affectedIds.has(pid));

          if (stalePartnerIds.length > 0) {
            for (let i = 0; i < stalePartnerIds.length; i += 50) {
              await supabase.from('shifts')
                .update({ paired_shift_id: null, paired_staff_name: null })
                .in('id', stalePartnerIds.slice(i, i + 50));
            }
            const staleOwnIds = affectedShifts
              .filter(s => s.paired_shift_id && !affectedIds.has(s.paired_shift_id))
              .map(s => s.id);
            for (let i = 0; i < staleOwnIds.length; i += 50) {
              await supabase.from('shifts')
                .update({ paired_shift_id: null, paired_staff_name: null })
                .in('id', staleOwnIds.slice(i, i + 50));
            }
          }
        }
      }

      return summary;
    },
    onSuccess: (summary, variables) => {
      queryClient.invalidateQueries({ queryKey: ['shiftTypes'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['baseShiftTemplates'] });
      const parts = [`Shift type saved: ${variables.name} (${variables.start_time} - ${variables.end_time})`];
      if (summary.shifts > 0) parts.push(`${summary.shifts} live shift(s) updated`);
      if (summary.templates > 0) parts.push(`${summary.templates} template(s) updated`);
      if (summary.shifts === 0 && summary.templates === 0) parts.push('No shifts or templates needed updating');
      toast.success(parts.join(' — '));
      setEditingId(null);
    },
    onError: (error) => {
      console.error('[ShiftType] Update error:', error);
      toast.error('Failed to save shift type: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => ShiftTypeApi.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTypes'] });
      toast.success('Shift type deleted');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const colors = [
    '#14b8a6', '#0d7a6f', // Teal (light/dark)
    '#3b82f6', '#1d4ed8', // Blue (light/dark)
    '#8b5cf6', '#6d28d9', // Purple (light/dark)
    '#ec4899', '#be185d', // Pink (light/dark)
    '#f59e0b', '#b45309', // Amber (light/dark)
    '#10b981', '#047857', // Green (light/dark)
    '#ef4444', '#b91c1c', // Red (light/dark)
    '#6366f1', '#4338ca', // Indigo (light/dark)
    '#f97316', '#c2410c', // Orange (light/dark)
    '#84cc16', '#4d7c0f', // Lime (light/dark)
  ];
  
  const handleAddDefault = async () => {
    for (let i = 0; i < DEFAULT_TYPES.length; i++) {
      const type = DEFAULT_TYPES[i];
      const exists = shiftTypes.some(st => st.name === type);
      if (!exists) {
        await createMutation.mutateAsync({ 
          name: type, 
          start_time: '09:00', 
          end_time: '17:00', 
          color: colors[i % colors.length],
          is_active: true 
        });
      }
    }
  };

  const handleAddNew = () => {
    if (newType.trim()) {
      createMutation.mutate({
        name: newType.trim(),
        start_time: newStartTime,
        end_time: newEndTime,
        color: newColor,
        is_active: true
      });
    }
  };

  const handleSaveEdit = () => {
    if (editValue.trim() && editingId) {
      const oldType = shiftTypes.find(t => t.id === editingId);
      updateMutation.mutate({
        id: editingId,
        name: editValue.trim(),
        start_time: editStartTime,
        end_time: editEndTime,
        color: editColor,
        oldName: oldType?.name || editValue.trim(),
        oldStartTime: oldType?.start_time || '',
        oldEndTime: oldType?.end_time || '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Shift Types</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Default Types Button */}
          {shiftTypes.length === 0 && (
            <Button
              onClick={handleAddDefault}
              variant="outline"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Default Shift Types
            </Button>
          )}

          {/* Current Types */}
          <div className={`space-y-2 overflow-y-auto ${editingId ? 'max-h-[60vh]' : 'max-h-64'}`}>
            {shiftTypes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No shift types yet</p>
            ) : (
              shiftTypes.map((type) => (
                <Card key={type.id} className="p-3">
                  {editingId === type.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Shift type name"
                        autoFocus
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Start Time</Label>
                          <Input
                            type="time"
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">End Time</Label>
                          <Input
                            type="time"
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Color</Label>
                        <div className="grid grid-cols-10 gap-1.5 mt-1">
                          {colors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditColor(color)}
                              className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                              style={{ 
                                backgroundColor: color,
                                borderColor: editColor === color ? '#000' : 'transparent'
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          onClick={handleSaveEdit}
                          disabled={updateMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                        >
                          {updateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="w-4 h-4 rounded-full border border-slate-300"
                          style={{ backgroundColor: type.color || '#14b8a6' }}
                        />
                        <div>
                          <p className="text-sm font-medium">{type.name}</p>
                          {type.start_time && type.end_time && (
                            <p className="text-xs text-slate-500">{type.start_time} - {type.end_time}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingId(type.id);
                            setEditValue(type.name);
                            setEditStartTime(type.start_time || '09:00');
                            setEditEndTime(type.end_time || '17:00');
                            setEditColor(type.color || '#14b8a6');
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPendingDeleteId(type.id);
                            setPendingDeleteName(type.name);
                            setConfirmOpen(true);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* Add New Type */}
          <div className="pt-4 border-t space-y-3">
            <Label>Add New Shift Type</Label>
            <Input
              placeholder="e.g. Night Shift"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddNew()}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <div className="grid grid-cols-10 gap-1.5 mt-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColor(color)}
                    className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                    style={{ 
                      backgroundColor: color,
                      borderColor: newColor === color ? '#000' : 'transparent'
                    }}
                  />
                ))}
              </div>
            </div>
            <Button
              onClick={handleAddNew}
              disabled={!newType.trim() || createMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Shift Type
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${pendingDeleteName}"?`}
        description="This action cannot be undone."
        confirmLabel="Yes, Delete"
        variant="destructive"
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteMutation.mutate(pendingDeleteId);
            setPendingDeleteId(null);
            setPendingDeleteName('');
          }
        }}
      />
    </Dialog>
  );
}
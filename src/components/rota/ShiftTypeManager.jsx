import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShiftTypeApi } from '@/api/shiftTypeApi';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Edit2 } from 'lucide-react';

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
    mutationFn: ({ id, name, start_time, end_time, color }) => ShiftTypeApi.update(id, { name, start_time, end_time, color }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftTypes'] });
      toast.success('Shift type updated');
      setEditingId(null);
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
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
      updateMutation.mutate({ 
        id: editingId, 
        name: editValue.trim(),
        start_time: editStartTime,
        end_time: editEndTime,
        color: editColor
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
          <div className="space-y-2 max-h-64 overflow-y-auto">
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
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateMutation.isPending}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          className="flex-1"
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
                            if (confirm(`Delete "${type.name}"?`)) {
                              deleteMutation.mutate(type.id);
                            }
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
    </Dialog>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

export default function CallTypeManager({ open, onClose, selectedAreaId }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', color: '#0d9488', default_tasks: [] });
  const [newTask, setNewTask] = useState('');

  const { data: callTypes = [], isLoading } = useQuery({
    queryKey: ['callTypes', selectedAreaId],
    queryFn: async () => {
      let q = supabase.from('call_types').select('*').eq('is_active', true);
      if (selectedAreaId) q = q.or(`area_id.eq.${selectedAreaId},area_id.is.null`);
      const { data, error } = await q.order('sort_order');
      if (error) throw error;
      return data || [];
    },
    enabled: !!open,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('call_types')
        .insert({ ...data, sort_order: callTypes.length, is_active: true, ...(selectedAreaId ? { area_id: selectedAreaId } : {}) })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callTypes'] });
      setFormData({ name: '', color: '#0d9488', default_tasks: [] });
      setNewTask('');
      toast.success('Call type added');
    },
    onError: () => toast.error('Failed to add call type'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: result, error } = await supabase
        .from('call_types')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callTypes'] });
      setEditingId(null);
      setFormData({ name: '', color: '#0d9488', default_tasks: [] });
      setNewTask('');
      toast.success('Call type updated');
    },
    onError: () => toast.error('Failed to update call type'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('call_types')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callTypes'] });
      toast.success('Call type removed');
    },
    onError: () => toast.error('Failed to remove call type'),
  });

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (ct) => {
    setEditingId(ct.id);
    setFormData({
      name: ct.name,
      color: ct.color || '#0d9488',
      default_tasks: ct.default_tasks || [],
    });
    setNewTask('');
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', color: '#0d9488', default_tasks: [] });
    setNewTask('');
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    setFormData(prev => ({
      ...prev,
      default_tasks: [...prev.default_tasks, newTask.trim()],
    }));
    setNewTask('');
  };

  const handleRemoveTask = (idx) => {
    setFormData(prev => ({
      ...prev,
      default_tasks: prev.default_tasks.filter((_, i) => i !== idx),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Call Types</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Add / Edit form */}
          <Card className="p-4 bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">
              {editingId ? 'Edit Call Type' : 'Add Call Type'}
            </h4>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Meal, Drinks, Night Check..."
                />
              </div>
              <div>
                <Label className="text-xs">Colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <span className="text-xs text-slate-500">{formData.color}</span>
                </div>
              </div>

              {/* Default tasks */}
              <div>
                <Label className="text-xs">Default Tasks (auto-added to calls of this type)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="e.g. Prepare food..."
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(); } }}
                    className="flex-1"
                  />
                  <Button type="button" size="sm" variant="outline" onClick={handleAddTask} disabled={!newTask.trim()}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                {formData.default_tasks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.default_tasks.map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                        <span className="text-slate-700">{task}</span>
                        <button type="button" onClick={() => handleRemoveTask(idx)} className="text-red-500 hover:text-red-700">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.name.trim() || createMutation.isPending || updateMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 flex-1"
                  size="sm"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {editingId ? 'Update' : 'Add'}
                </Button>
                {editingId && (
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* List */}
          {isLoading ? (
            <p className="text-center text-slate-500 py-4">Loading...</p>
          ) : callTypes.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No call types yet</p>
          ) : (
            <div className="space-y-2">
              {callTypes.map((ct) => (
                <div
                  key={ct.id}
                  className="p-3 bg-white border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: ct.color || '#0d9488' }}
                      />
                      <span className="text-sm font-medium text-slate-900">{ct.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(ct)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(ct.id)}
                        disabled={deleteMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {ct.default_tasks && ct.default_tasks.length > 0 && (
                    <div className="mt-2 ml-6 flex flex-wrap gap-1">
                      <ListChecks className="w-3 h-3 text-slate-400 mt-0.5" />
                      {ct.default_tasks.map((task, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-0">{task}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

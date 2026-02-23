import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { ShiftCallApi } from '@/api/rotaApi';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ListChecks } from 'lucide-react';

export default function AddCallModal({ shift, open, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    service_user_id: '',
    scheduled_time: '09:00',
    duration_minutes: 30,
    call_type: '',
    notes: ''
  });
  const [customTasks, setCustomTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.filter({ status: 'active' }),
  });

  const shiftAreaId = shift?.rota_area_id || shift?.area_id;
  const { data: callTypes = [] } = useQuery({
    queryKey: ['callTypes', shiftAreaId],
    queryFn: async () => {
      let q = supabase.from('call_types').select('*').eq('is_active', true);
      if (shiftAreaId) q = q.or(`area_id.eq.${shiftAreaId},area_id.is.null`);
      const { data, error } = await q.order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: existingCalls = [] } = useQuery({
    queryKey: ['shift-calls', shift.id],
    queryFn: () => ShiftCallApi.filter({ shift_id: shift.id }),
  });

  const createCallMutation = useMutation({
    mutationFn: (data) => ShiftCallApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-calls', shift.id] });
      queryClient.removeQueries({ queryKey: ['shift-calls', shift.id] });
      toast.success('Call added');
      onClose();
      setFormData({ service_user_id: '', scheduled_time: '09:00', duration_minutes: 30, call_type: '', notes: '' });
      setCustomTasks([]);
      setNewTaskInput('');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const getDefaultTasks = (typeName) => {
    if (!typeName) return [];
    const ct = callTypes.find(c => c.name === typeName);
    if (!ct?.default_tasks?.length) return [];
    return ct.default_tasks.map(text => ({ text, completed: false }));
  };

  // Preview: default tasks from selected call type
  const defaultTasks = useMemo(() => getDefaultTasks(formData.call_type), [formData.call_type, callTypes]);

  const handleAddCustomTask = () => {
    const text = newTaskInput.trim();
    if (!text) return;
    setCustomTasks(prev => [...prev, text]);
    setNewTaskInput('');
  };

  const handleRemoveCustomTask = (idx) => {
    setCustomTasks(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const serviceUser = serviceUsers.find(su => su.id === formData.service_user_id);
    const allTasks = [
      ...getDefaultTasks(formData.call_type),
      ...customTasks.map(text => ({ text, completed: false })),
    ];

    createCallMutation.mutate({
      shift_id: shift.id,
      service_user_id: formData.service_user_id,
      service_user_name: serviceUser?.full_name,
      service_user_address: serviceUser?.address,
      scheduled_time: formData.scheduled_time,
      call_time: formData.scheduled_time,
      duration_minutes: parseInt(formData.duration_minutes),
      call_type: formData.call_type || null,
      tasks: allTasks,
      call_date: shift.date,
      notes: formData.notes,
      status: 'pending',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Call to Shift</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Service User</Label>
            <Select
              value={formData.service_user_id}
              onValueChange={(value) => setFormData({ ...formData, service_user_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select service user" />
              </SelectTrigger>
              <SelectContent>
                {serviceUsers.map((su) => (
                  <SelectItem key={su.id} value={su.id}>
                    {su.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Call Type</Label>
            <Select
              value={formData.call_type}
              onValueChange={(value) => setFormData({ ...formData, call_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select call type" />
              </SelectTrigger>
              <SelectContent>
                {callTypes.map((ct) => (
                  <SelectItem key={ct.id} value={ct.name}>
                    {ct.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Scheduled Time</Label>
              <Input
                type="time"
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration (mins)</Label>
              <Input
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                min="15"
                step="15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions..."
              rows={3}
            />
          </div>

          {/* Tasks section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5" />
              Tasks
            </Label>
            <div className="p-3 bg-slate-50 rounded-lg border space-y-2">
              {/* Default tasks from call type */}
              {defaultTasks.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium">From call type:</p>
                  {defaultTasks.map((task, i) => (
                    <div key={`default-${i}`} className="flex items-center gap-2 py-1 px-2 bg-white rounded border text-xs">
                      <Badge variant="outline" className="text-[10px] py-0 px-1">Auto</Badge>
                      <span className="text-slate-700">{task.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Custom tasks */}
              {customTasks.length > 0 && (
                <div className="space-y-1">
                  {defaultTasks.length > 0 && <p className="text-xs text-slate-500 font-medium mt-2">Custom tasks:</p>}
                  {customTasks.map((task, i) => (
                    <div key={`custom-${i}`} className="flex items-center justify-between py-1 px-2 bg-white rounded border text-xs">
                      <span className="text-slate-700">{task}</span>
                      <button type="button" onClick={() => handleRemoveCustomTask(i)} className="text-red-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add custom task input */}
              <div className="flex gap-1 mt-1">
                <Input
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="Add a custom task..."
                  className="h-8 text-xs"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTask(); } }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddCustomTask}
                  disabled={!newTaskInput.trim()}
                  className="h-8 px-2"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {defaultTasks.length === 0 && customTasks.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-1">
                  {formData.call_type ? 'No default tasks for this type — add custom tasks above' : 'Select a call type to see default tasks'}
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.service_user_id || createCallMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {createCallMutation.isPending ? 'Adding...' : 'Add Call'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
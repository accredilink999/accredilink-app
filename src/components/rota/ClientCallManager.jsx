import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { format } from 'date-fns';
import { Clock, Plus, Trash2, Edit2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ClientCallManager({ open, onClose }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCall, setEditingCall] = useState(null);
  const [formData, setFormData] = useState({
    service_user_id: '',
    scheduled_time: '09:00',
    duration_minutes: 30,
    notes: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.filter({ status: 'active' }),
  });

  const { data: clientCalls = [] } = useQuery({
    queryKey: ['clientCalls'],
    queryFn: () => base44.entities.ClientCall.list('-date', 500),
    enabled: open,
  });

  const createCallMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientCall.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
      toast.success('Client call created');
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const deleteCallMutation = useMutation({
    mutationFn: (callId) => base44.entities.ClientCall.delete(callId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
      toast.success('Client call deleted');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      service_user_id: '',
      scheduled_time: '09:00',
      duration_minutes: 30,
      notes: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setEditingCall(null);
  };

  const handleSubmit = () => {
    const serviceUser = serviceUsers.find(su => su.id === formData.service_user_id);
    
    createCallMutation.mutate({
      service_user_id: formData.service_user_id,
      service_user_name: serviceUser?.full_name,
      service_user_address: serviceUser?.address,
      date: formData.date,
      scheduled_time: formData.scheduled_time,
      duration_minutes: parseInt(formData.duration_minutes),
      notes: formData.notes,
      status: 'pending',
      assigned_staff_ids: [],
      assigned_staff_names: [],
    });
  };

  const upcomingCalls = clientCalls.filter(call => new Date(call.date) >= new Date());

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Client Calls</DialogTitle>
        </DialogHeader>

        {isAddOpen ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

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

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.service_user_id || createCallMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {createCallMutation.isPending ? 'Creating...' : 'Create Call'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Button onClick={() => setIsAddOpen(true)} className="w-full bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Client Call
            </Button>

            {upcomingCalls.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-slate-500">No upcoming client calls</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {upcomingCalls.map((call) => (
                  <Card key={call.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{call.service_user_name}</h4>
                        <p className="text-sm text-slate-500">{call.service_user_address}</p>
                        <p className="text-sm text-slate-600 flex items-center gap-1 mt-2">
                          <Clock className="w-3 h-3" />
                          {format(new Date(call.date), 'MMM d, yyyy')} at {call.scheduled_time} ({call.duration_minutes}min)
                        </p>
                        {call.assigned_staff_names?.length > 0 && (
                          <p className="text-sm text-teal-600 mt-2">
                            Assigned to: {call.assigned_staff_names.join(', ')}
                          </p>
                        )}
                        {call.notes && (
                          <p className="text-sm text-slate-600 mt-2">{call.notes}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCallMutation.mutate(call.id)}
                        disabled={deleteCallMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
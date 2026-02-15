import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { format, parseISO } from 'date-fns';
import { Clock } from 'lucide-react';

export default function AssignCallsModal({ open, onClose, shift }) {
  const queryClient = useQueryClient();
  const [selectedCallIds, setSelectedCallIds] = useState([]);

  const { data: clientCalls = [] } = useQuery({
    queryKey: ['clientCalls', shift?.date],
    queryFn: async () => {
      if (!shift?.date) return [];
      const calls = await base44.entities.ClientCall.list('-scheduled_time', 500);
      return calls.filter(call => call.date === shift.date);
    },
    enabled: open && !!shift?.date,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
    enabled: open,
  });

  const assignCallsMutation = useMutation({
    mutationFn: async (callIds) => {
      const staffMember = staff.find(s => s.id === shift.staff_id);
      for (const callId of callIds) {
        const call = clientCalls.find(c => c.id === callId);
        if (call) {
          const newStaffIds = [...(call.assigned_staff_ids || []), shift.staff_id];
          const newStaffNames = [...(call.assigned_staff_names || []), staffMember?.staff_full_name || staffMember?.full_name];
          await base44.entities.ClientCall.update(callId, {
            assigned_staff_ids: newStaffIds,
            assigned_staff_names: newStaffNames,
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientCalls'] });
      toast.success('Calls assigned');
      onClose();
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const matchingCalls = clientCalls.filter(call => {
    const callStart = parseInt(call.scheduled_time.split(':')[0]) * 60 + parseInt(call.scheduled_time.split(':')[1]);
    const shiftStart = parseInt(shift?.start_time?.split(':')[0]) * 60 + parseInt(shift?.start_time?.split(':')[1]);
    const shiftEnd = parseInt(shift?.end_time?.split(':')[0]) * 60 + parseInt(shift?.end_time?.split(':')[1]);
    const callEnd = callStart + (call.duration_minutes || 0);
    
    return callStart >= shiftStart && callEnd <= shiftEnd;
  });

  const handleToggle = (callId) => {
    setSelectedCallIds(prev =>
      prev.includes(callId) ? prev.filter(id => id !== callId) : [...prev, callId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Client Calls to {shift?.staff_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {matchingCalls.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-slate-500">No client calls match this shift time</p>
            </Card>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                {matchingCalls.length} call{matchingCalls.length !== 1 ? 's' : ''} available during this shift
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {matchingCalls.map((call) => (
                  <Card key={call.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={call.id}
                        checked={selectedCallIds.includes(call.id)}
                        onCheckedChange={() => handleToggle(call.id)}
                        className="mt-1"
                      />
                      <label htmlFor={call.id} className="flex-1 cursor-pointer">
                        <p className="font-medium text-sm text-slate-900">{call.service_user_name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {call.scheduled_time} ({call.duration_minutes}min)
                        </p>
                        {call.assigned_staff_names?.length > 0 && (
                          <p className="text-xs text-teal-600 mt-1">
                            Also: {call.assigned_staff_names.join(', ')}
                          </p>
                        )}
                      </label>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => assignCallsMutation.mutate(selectedCallIds)}
            disabled={selectedCallIds.length === 0 || assignCallsMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {assignCallsMutation.isPending ? 'Assigning...' : 'Assign Calls'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

export default function ShiftSwapRequest({ shift, open, onClose }) {
  const queryClient = useQueryClient();
  const [swapWithId, setSwapWithId] = useState('');
  const [reason, setReason] = useState('');

  const { data: staff = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ShiftSwapRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSwapRequests'] });
      onClose();
    },
  });

  const handleSubmit = async () => {
    const swapWithStaff = swapWithId ? staff.find(s => s.id === swapWithId) : null;
    
    createMutation.mutate({
      shift_id: shift.id,
      requester_id: shift.staff_id,
      requester_name: shift.staff_name,
      shift_date: shift.date,
      shift_time: `${shift.start_time} - ${shift.end_time}`,
      service_user_name: shift.service_user_name,
      swap_with_id: swapWithId || null,
      swap_with_name: swapWithStaff?.staff_full_name || swapWithStaff?.full_name || null,
      reason,
      status: 'pending'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Shift Swap</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-500">Shift Details</p>
            <p className="font-medium">{shift?.service_user_name}</p>
            <p className="text-sm text-slate-600">{shift?.date} • {shift?.start_time} - {shift?.end_time}</p>
          </div>

          <div>
            <Label>Swap With (Optional)</Label>
            <Select value={swapWithId} onValueChange={setSwapWithId}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member or leave empty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Anyone Available</SelectItem>
                {staff
                  .filter(s => s.id !== shift?.staff_id)
                  .map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.staff_full_name || s.full_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Reason *</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you need to swap this shift..."
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!reason || createMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
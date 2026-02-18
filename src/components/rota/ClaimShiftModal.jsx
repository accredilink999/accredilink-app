import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';
import { notifyClaimCreated } from '@/utils/shiftClaimNotifications';

export default function ClaimShiftModal({ shift, open, onClose }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Check if user already has a pending claim for this shift
  const { data: existingClaims = [] } = useQuery({
    queryKey: ['myClaimsForShift', shift?.id, user?.id],
    queryFn: () => base44.entities.ShiftClaimRequest.filter({
      shift_id: shift?.id,
      staff_id: user?.id,
      status: 'pending',
    }),
    enabled: !!shift?.id && !!user?.id,
  });

  const hasPendingClaim = existingClaims.length > 0;

  const claimMutation = useMutation({
    mutationFn: async (data) => {
      const result = await base44.entities.ShiftClaimRequest.create(data);
      notifyClaimCreated({
        claim: data,
        areaId: shift.rota_area_id || shift.area_id,
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftClaimRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingClaims'] });
      queryClient.invalidateQueries({ queryKey: ['myClaimRequests'] });
      queryClient.invalidateQueries({ queryKey: ['myClaimsForShift'] });
      onClose();
    },
    onError: (e) => {
      console.error('Claim failed:', e);
    },
  });

  const handleSubmit = () => {
    if (!user) return;
    claimMutation.mutate({
      shift_id: shift.id,
      staff_id: user.id,
      staff_name: user.staff_full_name || user.full_name,
      shift_date: shift.date,
      shift_time: `${shift.start_time} - ${shift.end_time}`,
      shift_name: shift.shift_name || null,
      area_id: shift.rota_area_id || shift.area_id || null,
      reason: reason || null,
      status: 'pending',
    });
  };

  const areaName = shift?.rota_area_name || shift?.area_name || '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim Available Shift</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-teal-50 rounded-lg">
            <p className="text-sm text-teal-600 font-medium">Shift Details</p>
            {shift?.shift_name && (
              <p className="font-medium text-slate-900">{shift.shift_name}</p>
            )}
            <p className="text-sm text-slate-600">
              {shift?.date} &bull; {shift?.start_time} - {shift?.end_time}
            </p>
            {areaName && (
              <p className="text-xs text-slate-500 mt-1">{areaName}</p>
            )}
          </div>

          {hasPendingClaim ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 font-medium">
                You already have a pending claim for this shift.
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Please wait for admin to review your existing claim.
              </p>
            </div>
          ) : (
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optionally explain why you'd like to claim this shift..."
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!hasPendingClaim && (
            <Button
              onClick={handleSubmit}
              disabled={claimMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {claimMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Claim Shift
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { notifyClaimCreated } from '@/utils/shiftClaimNotifications';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ClaimShiftModal({ shift, open, onClose, isAdmin = false }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [allocateStaffId, setAllocateStaffId] = useState('');

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

  const { data: allStaff = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  const allocateMutation = useMutation({
    mutationFn: async (staffId) => {
      const staffMember = allStaff.find(s => s.id === staffId);
      return ShiftApi.update(shift.id, {
        staff_id: staffId,
        staff_name: staffMember?.staff_full_name || staffMember?.full_name || '',
        status: 'confirmed',
      });
    },
    onSuccess: (_, staffId) => {
      const staffMember = allStaff.find(s => s.id === staffId);
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftClaimRequests'] });
      toast.success(`Shift allocated to ${staffMember?.staff_full_name || staffMember?.full_name}`);
      onClose();
    },
    onError: (e) => toast.error(e.message || 'Failed to allocate shift'),
  });

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

  const deleteShiftMutation = useMutation({
    mutationFn: async () => {
      // Delete associated shift_calls
      const calls = await ShiftCallApi.filter({ shift_id: shift.id });
      for (const call of calls) {
        await ShiftCallApi.delete(call.id);
      }
      // Revert to blank available shift instead of deleting
      return ShiftApi.update(shift.id, {
        staff_id: null,
        staff_name: null,
        paired_shift_id: null,
        paired_staff_name: null,
        shift_pattern_id: null,
        is_base_shift: true,
        status: 'scheduled',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      toast.success('Shift cleared — now available to claim');
      onClose();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to clear shift');
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

          {isAdmin && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <UserCheck className="w-4 h-4 text-teal-600" /> Allocate to Staff
              </Label>
              <div className="flex gap-2">
                <Select value={allocateStaffId} onValueChange={setAllocateStaffId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select staff member…" />
                  </SelectTrigger>
                  <SelectContent>
                    {allStaff.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.staff_full_name || s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => allocateMutation.mutate(allocateStaffId)}
                  disabled={!allocateStaffId || allocateMutation.isPending}
                  className="bg-teal-600 hover:bg-teal-700 shrink-0"
                >
                  {allocateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Allocate'}
                </Button>
              </div>
              <p className="text-xs text-slate-400">Auto-approved — no claim request raised.</p>
              <div className="border-t border-slate-100 pt-3 mt-1">
                <p className="text-xs font-medium text-slate-500 mb-2">Or claim for yourself</p>
              </div>
            </div>
          )}

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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isAdmin && (
            <Button
              variant="destructive"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleteShiftMutation.isPending}
              className="w-full sm:w-auto sm:mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Shift
            </Button>
          )}
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

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Clear Shift?"
          description="This will remove the staff assignment and revert this shift to a blank available slot."
          confirmLabel="Clear Shift"
          variant="destructive"
          onConfirm={() => deleteShiftMutation.mutate()}
        />
      </DialogContent>
    </Dialog>
  );
}

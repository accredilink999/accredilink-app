import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, Calendar, Clock, User, ArrowRightLeft } from 'lucide-react';
import { notifySwapAccepted, notifySwapDeclined } from '@/utils/shiftSwapNotifications';

export default function ShiftSwapResponseModal({ swapRequest, open, onClose, currentUser }) {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShiftSwapRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSwapRequests'] });
      queryClient.invalidateQueries({ queryKey: ['mySwapRequests'] });
      queryClient.invalidateQueries({ queryKey: ['incomingSwapRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingSwaps'] });
      setProcessing(null);
      onClose();
    },
  });

  const handleAccept = () => {
    setProcessing('accept');
    updateMutation.mutate({
      id: swapRequest.id,
      data: {
        status: 'pending_admin',
        target_response: 'accepted',
        target_responded_at: new Date().toISOString(),
      }
    });
    // Notify requester + area admins
    notifySwapAccepted({
      swap: swapRequest,
      targetName: currentUser?.staff_full_name || currentUser?.full_name,
      areaId: swapRequest.rota_area_id,
    });
  };

  const handleDecline = () => {
    setProcessing('decline');
    updateMutation.mutate({
      id: swapRequest.id,
      data: {
        status: 'declined',
        target_response: 'declined',
        target_responded_at: new Date().toISOString(),
      }
    });
    // Notify requester + area admins
    notifySwapDeclined({
      swap: swapRequest,
      targetName: currentUser?.staff_full_name || currentUser?.full_name,
      areaId: swapRequest.rota_area_id,
    });
  };

  if (!swapRequest) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-yellow-600" />
            Shift Swap Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              {swapRequest.requester_name} wants to swap shifts with you
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{swapRequest.shift_date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>{swapRequest.shift_time}</span>
              </div>
              {swapRequest.service_user_name && (
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{swapRequest.service_user_name}</span>
                </div>
              )}
            </div>
          </Card>

          {swapRequest.reason && (
            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Reason:</p>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{swapRequest.reason}</p>
            </div>
          )}

          <p className="text-sm text-slate-500">
            If you accept, this will be sent to an admin for final approval. Your shifts will only be swapped once an admin approves.
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            onClick={handleDecline}
            disabled={!!processing}
            variant="destructive"
            className="flex-1"
          >
            {processing === 'decline' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!!processing}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {processing === 'accept' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

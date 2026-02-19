import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Check, X, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function LeaveRequests({ staffId, isAdmin }) {
  const queryClient = useQueryClient();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const { data: requests = [] } = useQuery({
    queryKey: ['leave-requests', staffId, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        return base44.entities.LeaveRequest.list('-created_date', 200);
      }
      return base44.entities.LeaveRequest.filter({ staff_id: staffId }, '-created_date', 100);
    },
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.LeaveRequest.update(id, {
      status: 'approved',
      reviewed_by: currentUser?.id,
      reviewed_by_name: currentUser?.full_name
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request approved');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => base44.entities.LeaveRequest.update(id, {
      status: 'rejected',
      reviewed_by: currentUser?.id,
      reviewed_by_name: currentUser?.full_name,
      review_notes: reason
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request rejected');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LeaveRequest.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      toast.success('Leave request deleted');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-slate-100 text-slate-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-500">No leave requests</p>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isAdmin && <h4 className="font-semibold text-slate-900 mb-1">{request.staff_name}</h4>}
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(request.status)}>
                    {request.status}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {request.type.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {format(parseISO(request.start_date), 'MMM d, yyyy')} - {format(parseISO(request.end_date), 'MMM d, yyyy')}
                </p>
                {request.reason && (
                  <p className="text-sm text-slate-500 mt-1">{request.reason}</p>
                )}
                {request.review_notes && (
                  <p className="text-xs text-slate-500 mt-2 italic">Review: {request.review_notes}</p>
                )}
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(request.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          const reason = prompt('Rejection reason:');
                          if (reason) rejectMutation.mutate({ id: request.id, reason });
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  {request.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setPendingDeleteId(request.id);
                        setDeleteConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Leave Request?"
        description="Delete this approved leave request? This action cannot be undone."
        confirmLabel="Yes, Delete"
        variant="destructive"
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteMutation.mutate(pendingDeleteId);
            setPendingDeleteId(null);
          }
        }}
      />
    </div>
  );
}
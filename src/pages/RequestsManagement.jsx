import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { 
  Calendar, 
  RefreshCw, 
  Check, 
  X, 
  Loader2,
  MessageSquare
} from 'lucide-react';

export default function RequestsManagement() {
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: swapRequests = [] } = useQuery({
    queryKey: ['shiftSwapRequests'],
    queryFn: () => base44.entities.ShiftSwapRequest.list('-created_date'),
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date'),
  });

  const updateSwapMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShiftSwapRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSwapRequests'] });
      setReviewNotes({});
      setProcessingId(null);
    },
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      setReviewNotes({});
      setProcessingId(null);
    },
  });

  const handleSwapDecision = async (request, status) => {
    setProcessingId(request.id);
    updateSwapMutation.mutate({
      id: request.id,
      data: {
        status,
        reviewed_by: user.id,
        reviewed_by_name: user.gps_map_name || user.full_name,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes[request.id] || ''
      }
    });
  };

  const handleLeaveDecision = async (request, status) => {
    setProcessingId(request.id);
    updateLeaveMutation.mutate({
      id: request.id,
      data: {
        status,
        reviewed_by: user.id,
        reviewed_by_name: user.gps_map_name || user.full_name,
        review_notes: reviewNotes[request.id] || ''
      }
    });
  };

  const pendingSwaps = swapRequests.filter(r => r.status === 'pending');
  const pendingLeave = leaveRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Requests Management" 
        subtitle="Review and approve shift swaps and leave requests"
      >
        <div className="flex gap-2">
          <Badge className="bg-orange-100 text-orange-700">
            {pendingSwaps.length} Swap{pendingSwaps.length !== 1 ? 's' : ''}
          </Badge>
          <Badge className="bg-purple-100 text-purple-700">
            {pendingLeave.length} Leave
          </Badge>
        </div>
      </PageHeader>

      <Tabs defaultValue="swaps" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="swaps">
            Shift Swaps ({pendingSwaps.length})
          </TabsTrigger>
          <TabsTrigger value="leave">
            Leave Requests ({pendingLeave.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swaps" className="mt-6">
          {pendingSwaps.length === 0 ? (
            <EmptyState
              icon={RefreshCw}
              title="No pending swap requests"
              description="All shift swap requests have been reviewed."
            />
          ) : (
            <div className="space-y-4">
              {pendingSwaps.map((request) => (
                <Card key={request.id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{request.requester_name}</h3>
                      <p className="text-sm text-slate-500">
                        {request.shift_date} • {request.shift_time}
                      </p>
                      {request.service_user_name && (
                        <p className="text-sm text-teal-600">{request.service_user_name}</p>
                      )}
                    </div>
                    <Badge className="bg-orange-100 text-orange-700">Pending</Badge>
                  </div>

                  {request.swap_with_name && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-500">Wants to swap with</p>
                      <p className="font-medium text-slate-900">{request.swap_with_name}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Reason:</p>
                    <p className="text-sm text-slate-600">{request.reason}</p>
                  </div>

                  <div className="mb-4">
                    <Label>Review Notes (Optional)</Label>
                    <Textarea
                      value={reviewNotes[request.id] || ''}
                      onChange={(e) => setReviewNotes({...reviewNotes, [request.id]: e.target.value})}
                      placeholder="Add notes about your decision..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSwapDecision(request, 'approved')}
                      disabled={processingId === request.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleSwapDecision(request, 'rejected')}
                      disabled={processingId === request.id}
                      variant="destructive"
                      className="flex-1"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leave" className="mt-6">
          {pendingLeave.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No pending leave requests"
              description="All leave requests have been reviewed."
            />
          ) : (
            <div className="space-y-4">
              {pendingLeave.map((request) => (
                <Card key={request.id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">{request.staff_name}</h3>
                      <p className="text-sm text-slate-500 capitalize">{request.type.replace('_', ' ')}</p>
                    </div>
                    <Badge className="bg-purple-100 text-purple-700">Pending</Badge>
                  </div>

                  <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500">Leave Period</p>
                    <p className="font-medium text-slate-900">
                      {request.start_date} to {request.end_date}
                    </p>
                  </div>

                  {request.reason && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Reason:</p>
                      <p className="text-sm text-slate-600">{request.reason}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <Label>Review Notes (Optional)</Label>
                    <Textarea
                      value={reviewNotes[request.id] || ''}
                      onChange={(e) => setReviewNotes({...reviewNotes, [request.id]: e.target.value})}
                      placeholder="Add notes about your decision..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleLeaveDecision(request, 'approved')}
                      disabled={processingId === request.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleLeaveDecision(request, 'rejected')}
                      disabled={processingId === request.id}
                      variant="destructive"
                      className="flex-1"
                    >
                      {processingId === request.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <X className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from 'sonner';
import { notifySwapApproved, notifySwapRejected } from '@/utils/shiftSwapNotifications';
import { notifyClaimApproved, notifyClaimRejected, notifyShiftsReleased } from '@/utils/shiftClaimNotifications';
import { supabase } from '@/api/supabaseClient';
import { getMatchingCallsForShift } from '@/utils/shiftCallAutoAssign';
import {
  Calendar,
  RefreshCw,
  Check,
  X,
  Loader2,
  MessageSquare,
  ArrowRightLeft,
  Hand
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

  const { data: claimRequests = [] } = useQuery({
    queryKey: ['shiftClaimRequests'],
    queryFn: () => base44.entities.ShiftClaimRequest.list('-created_date'),
  });

  // Fetch affected shift counts for pending leave requests
  const [leaveShiftCounts, setLeaveShiftCounts] = useState({});
  const pendingLeaveIds = leaveRequests.filter(r => r.status === 'pending').map(r => r.id).join(',');
  useEffect(() => {
    const pending = leaveRequests.filter(r => r.status === 'pending');
    if (pending.length === 0) { setLeaveShiftCounts({}); return; }
    let cancelled = false;
    (async () => {
      const counts = {};
      for (const req of pending) {
        const { count } = await supabase
          .from('shifts')
          .select('id', { count: 'exact', head: true })
          .eq('staff_id', req.staff_id)
          .gte('date', req.start_date)
          .lte('date', req.end_date);
        if (cancelled) return;
        counts[req.id] = count || 0;
      }
      setLeaveShiftCounts(counts);
    })();
    return () => { cancelled = true; };
  }, [pendingLeaveIds]);

  const updateSwapMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShiftSwapRequest.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shiftSwapRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingSwaps'] });
      queryClient.invalidateQueries({ queryKey: ['mySwapRequests'] });
      queryClient.invalidateQueries({ queryKey: ['incomingSwapRequests'] });
      setReviewNotes({});
      setProcessingId(null);
    },
  });

  const handleSwapDecision = async (request, status) => {
    setProcessingId(request.id);
    const adminName = user.gps_map_name || user.staff_full_name || user.full_name;

    if (status === 'approved') {
      // Actually swap the shifts
      try {
        // Find the requester's shift
        const requesterShifts = await ShiftApi.filter({ id: request.shift_id });
        const requesterShift = requesterShifts[0];

        if (!requesterShift) {
          toast.error('Could not find the original shift to swap');
          setProcessingId(null);
          return;
        }

        // Find a matching shift for the target staff on the same date
        const targetShifts = await ShiftApi.filter({
          staff_id: request.swap_with_id,
          date: request.shift_date,
        });

        if (targetShifts.length === 0) {
          toast.error(`No shift found for ${request.swap_with_name} on ${request.shift_date}`);
          setProcessingId(null);
          return;
        }

        // Use the first matching shift for the target
        const targetShift = targetShifts[0];

        // Swap staff assignments on both shifts (clear pattern link — shift is no longer pattern-managed)
        await ShiftApi.update(requesterShift.id, {
          staff_id: request.swap_with_id,
          staff_name: request.swap_with_name,
          shift_pattern_id: null,
        });
        await ShiftApi.update(targetShift.id, {
          staff_id: request.requester_id,
          staff_name: request.requester_name,
          shift_pattern_id: null,
        });

        // Update the swap request
        updateSwapMutation.mutate({
          id: request.id,
          data: {
            status: 'approved',
            reviewed_by: user.id,
            reviewed_by_name: adminName,
            reviewed_at: new Date().toISOString(),
            review_notes: reviewNotes[request.id] || ''
          }
        });

        // Invalidate shift queries so rota updates
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        queryClient.invalidateQueries({ queryKey: ['todayShifts'] });

        toast.success('Shift swap approved — shifts have been reassigned');

        // Notify both staff + area admins
        notifySwapApproved({
          swap: request,
          adminName,
          areaId: request.rota_area_id,
        });
      } catch (err) {
        console.error('Shift swap error:', err);
        toast.error('Failed to swap shifts: ' + (err.message || 'Unknown error'));
        setProcessingId(null);
      }
    } else {
      // Rejected
      updateSwapMutation.mutate({
        id: request.id,
        data: {
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_by_name: adminName,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[request.id] || ''
        }
      });

      toast.success('Shift swap rejected');

      notifySwapRejected({
        swap: request,
        adminName,
        areaId: request.rota_area_id,
      });
    }
  };

  const handleLeaveDecision = async (request, status) => {
    setProcessingId(request.id);
    const adminName = user.gps_map_name || user.staff_full_name || user.full_name;

    if (status === 'approved') {
      try {
        // 1. Find all shifts for this staff in the leave date range
        const { data: affectedShifts = [] } = await supabase
          .from('shifts')
          .select('id, date, start_time, end_time, shift_name, rota_area_id')
          .eq('staff_id', request.staff_id)
          .gte('date', request.start_date)
          .lte('date', request.end_date);

        // 2. For each shift: delete client calls, then clear staff assignment
        for (const shift of affectedShifts) {
          await supabase
            .from('shift_calls')
            .delete()
            .eq('shift_id', shift.id);

          await supabase
            .from('shifts')
            .update({ staff_id: null, staff_name: null, paired_staff_id: null, paired_staff_name: null, shift_pattern_id: null })
            .eq('id', shift.id);
        }

        // 3. Update leave request status
        await base44.entities.LeaveRequest.update(request.id, {
          status: 'approved',
          reviewed_by: user.id,
          reviewed_by_name: adminName,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[request.id] || '',
        });

        // 4. Invalidate caches
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        queryClient.invalidateQueries({ queryKey: ['shift-calls'] });
        queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
        queryClient.invalidateQueries({ queryKey: ['todayShifts'] });

        // 5. Toast with count
        const shiftCount = affectedShifts.length;
        toast.success(
          `Leave approved${shiftCount > 0 ? ` — ${shiftCount} shift(s) released as available` : ''}`
        );

        // 6. Notify all staff in the area about available shifts
        if (shiftCount > 0) {
          notifyShiftsReleased({
            staffName: request.staff_name,
            staffId: request.staff_id,
            shiftCount,
            startDate: request.start_date,
            endDate: request.end_date,
            areaId: affectedShifts[0]?.rota_area_id,
          });
        }
      } catch (err) {
        console.error('Leave approval error:', err);
        toast.error('Failed to approve leave: ' + (err.message || 'Unknown error'));
      }
    } else {
      // Rejected — no shift changes needed
      await base44.entities.LeaveRequest.update(request.id, {
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_by_name: adminName,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes[request.id] || '',
      });
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      toast.success('Leave request rejected');
    }
    setProcessingId(null);
    setReviewNotes({});
  };

  const SIT_IN_NAMES = new Set(['Sit In L', 'Sit In E', 'Sit In FD']);

  const handleClaimDecision = async (claim, status) => {
    setProcessingId(claim.id);
    const adminName = user.gps_map_name || user.staff_full_name || user.full_name;

    if (status === 'approved') {
      try {
        // 1. Assign staff to the shift
        await ShiftApi.update(claim.shift_id, {
          staff_id: claim.staff_id,
          staff_name: claim.staff_name,
          status: 'scheduled',
        });

        // 2. Auto-create client calls (skip for sit-in shifts)
        const shiftData = (await ShiftApi.filter({ id: claim.shift_id }))[0];
        if (shiftData && !SIT_IN_NAMES.has(shiftData.shift_name)) {
          const serviceUsers = await base44.entities.ServiceUser.filter({ status: 'active' });
          const matchingCalls = getMatchingCallsForShift(
            serviceUsers, claim.area_id, shiftData.start_time, shiftData.end_time
          );
          const callTypesData = await base44.entities.CallType.filter({ is_active: true });
          for (const call of matchingCalls) {
            const ct = callTypesData.find(c => c.name === call.call_type);
            const tasks = ct?.default_tasks?.length ? ct.default_tasks.map(t => ({ text: t, completed: false })) : [];
            try {
              await ShiftCallApi.create({
                shift_id: claim.shift_id,
                service_user_id: call.service_user_id,
                service_user_name: call.service_user_name,
                service_user_address: call.service_user_address,
                scheduled_time: call.scheduled_time,
                call_time: call.scheduled_time,
                duration_minutes: call.duration_minutes,
                call_type: call.call_type,
                call_types: call.call_types || [call.call_type],
                tasks,
                call_date: shiftData.date,
                status: 'pending',
                notes: call.notes || '',
              });
            } catch (callErr) {
              console.error('[ClaimApprove] Failed to create call:', callErr);
            }
          }
        }

        // 3. Update claim status
        await base44.entities.ShiftClaimRequest.update(claim.id, {
          status: 'approved',
          reviewed_by: user.id,
          reviewed_by_name: adminName,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes[claim.id] || '',
        });

        // 4. Auto-reject other pending claims for same shift
        const otherClaims = claimRequests.filter(
          c => c.shift_id === claim.shift_id && c.id !== claim.id && c.status === 'pending'
        );
        for (const other of otherClaims) {
          await base44.entities.ShiftClaimRequest.update(other.id, {
            status: 'rejected',
            reviewed_by: user.id,
            reviewed_by_name: adminName,
            reviewed_at: new Date().toISOString(),
            review_notes: 'Shift claimed by another staff member',
          });
          notifyClaimRejected({ claim: other, adminName, areaId: other.area_id });
        }

        queryClient.invalidateQueries({ queryKey: ['shiftClaimRequests'] });
        queryClient.invalidateQueries({ queryKey: ['pendingClaims'] });
        queryClient.invalidateQueries({ queryKey: ['myClaimRequests'] });
        queryClient.invalidateQueries({ queryKey: ['shifts'] });
        queryClient.invalidateQueries({ queryKey: ['shift-calls'] });

        toast.success('Shift claim approved — staff assigned with client calls');
        notifyClaimApproved({ claim, adminName, areaId: claim.area_id });
      } catch (err) {
        console.error('Claim approval error:', err);
        toast.error('Failed to approve claim: ' + (err.message || 'Unknown error'));
      }
    } else {
      // Rejected
      await base44.entities.ShiftClaimRequest.update(claim.id, {
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_by_name: adminName,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes[claim.id] || '',
      });
      queryClient.invalidateQueries({ queryKey: ['shiftClaimRequests'] });
      queryClient.invalidateQueries({ queryKey: ['pendingClaims'] });
      queryClient.invalidateQueries({ queryKey: ['myClaimRequests'] });
      toast.success('Shift claim rejected');
      notifyClaimRejected({ claim, adminName, areaId: claim.area_id });
    }
    setProcessingId(null);
    setReviewNotes({});
  };

  // Only show swaps that the target staff has accepted (pending_admin)
  const pendingSwaps = swapRequests.filter(r => r.status === 'pending_admin');
  // Also show pending_target for visibility but without approve buttons
  const awaitingTargetSwaps = swapRequests.filter(r => r.status === 'pending_target');
  const pendingLeave = leaveRequests.filter(r => r.status === 'pending');
  const pendingClaims = claimRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requests Management"
        subtitle="Review and approve shift swaps and leave requests"
      >
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-orange-100 text-orange-700">
            {pendingSwaps.length} Swap{pendingSwaps.length !== 1 ? 's' : ''}
          </Badge>
          <Badge className="bg-teal-100 text-teal-700">
            {pendingClaims.length} Claim{pendingClaims.length !== 1 ? 's' : ''}
          </Badge>
          <Badge className="bg-purple-100 text-purple-700">
            {pendingLeave.length} Leave
          </Badge>
        </div>
      </PageHeader>

      <Tabs defaultValue="swaps" className="w-full">
        <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3">
          <TabsTrigger value="swaps" className="text-xs sm:text-sm">
            Swaps ({pendingSwaps.length})
          </TabsTrigger>
          <TabsTrigger value="claims" className="text-xs sm:text-sm">
            Claims ({pendingClaims.length})
          </TabsTrigger>
          <TabsTrigger value="leave" className="text-xs sm:text-sm">
            Leave ({pendingLeave.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="swaps" className="mt-6">
          {/* Swaps awaiting target response — info only */}
          {awaitingTargetSwaps.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-500 mb-3">Awaiting Staff Response</h3>
              <div className="space-y-3">
                {awaitingTargetSwaps.map((request) => (
                  <Card key={request.id} className="p-4 bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-slate-700">
                          {request.requester_name} <ArrowRightLeft className="w-3 h-3 inline mx-1" /> {request.swap_with_name}
                        </h4>
                        <p className="text-sm text-slate-500">{request.shift_date} &bull; {request.shift_time}</p>
                        {request.service_user_name && (
                          <p className="text-xs text-teal-600">{request.service_user_name}</p>
                        )}
                      </div>
                      <Badge className="bg-slate-200 text-slate-600">Awaiting Response</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Swaps ready for admin approval */}
          {pendingSwaps.length === 0 ? (
            <EmptyState
              icon={RefreshCw}
              title="No pending swap requests"
              description="Shift swap requests that have been accepted by the target staff will appear here for your approval."
            />
          ) : (
            <div className="space-y-4">
              {pendingSwaps.map((request) => (
                <Card key={request.id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {request.requester_name} <ArrowRightLeft className="w-4 h-4 inline mx-1" /> {request.swap_with_name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {request.shift_date} &bull; {request.shift_time}
                      </p>
                      {request.service_user_name && (
                        <p className="text-sm text-teal-600">{request.service_user_name}</p>
                      )}
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">Staff Accepted</Badge>
                  </div>

                  <div className="mb-3 p-3 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-emerald-600 font-medium">
                      {request.swap_with_name} has agreed to this swap
                    </p>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Reason:</p>
                    <p className="text-sm text-slate-600">{request.reason}</p>
                  </div>

                  <div className="mb-4">
                    <Label>Review Notes (Optional)</Label>
                    <Textarea
                      value={reviewNotes[request.id] || ''}
                      onChange={(e) => setReviewNotes(prev => ({...prev, [request.id]: e.target.value}))}
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
                      Approve & Swap Shifts
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

        <TabsContent value="claims" className="mt-6">
          {pendingClaims.length === 0 ? (
            <EmptyState
              icon={Hand}
              title="No pending shift claims"
              description="When staff claim available shifts, they'll appear here for your approval."
            />
          ) : (
            <div className="space-y-4">
              {pendingClaims.map((claim) => (
                <Card key={claim.id} className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {claim.staff_name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {claim.shift_date} &bull; {claim.shift_time}
                      </p>
                      {claim.shift_name && (
                        <p className="text-sm text-teal-600">{claim.shift_name}</p>
                      )}
                    </div>
                    <Badge className="bg-teal-100 text-teal-700">Claim</Badge>
                  </div>

                  {claim.reason && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-slate-700 mb-2">Reason:</p>
                      <p className="text-sm text-slate-600">{claim.reason}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <Label>Review Notes (Optional)</Label>
                    <Textarea
                      value={reviewNotes[claim.id] || ''}
                      onChange={(e) => setReviewNotes(prev => ({...prev, [claim.id]: e.target.value}))}
                      placeholder="Add notes about your decision..."
                      className="mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleClaimDecision(claim, 'approved')}
                      disabled={processingId === claim.id}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processingId === claim.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      Approve & Assign
                    </Button>
                    <Button
                      onClick={() => handleClaimDecision(claim, 'rejected')}
                      disabled={processingId === claim.id}
                      variant="destructive"
                      className="flex-1"
                    >
                      {processingId === claim.id ? (
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

                  {leaveShiftCounts[request.id] > 0 && (
                    <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <p className="text-sm text-amber-700 font-medium">
                        Approving will release {leaveShiftCounts[request.id]} shift(s) as available
                      </p>
                    </div>
                  )}

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
                      onChange={(e) => setReviewNotes(prev => ({...prev, [request.id]: e.target.value}))}
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

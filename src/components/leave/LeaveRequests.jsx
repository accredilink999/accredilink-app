import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Check, X, Trash2 } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

/**
 * Calculate the number of leave days from a request.
 */
function getLeaveDays(request) {
  if (request.days_requested && request.days_requested > 0) return request.days_requested;
  if (request.start_date && request.end_date) {
    return differenceInDays(parseISO(request.end_date), parseISO(request.start_date)) + 1;
  }
  return 0;
}

/**
 * Update the holiday_allowances used_days for a staff member.
 * delta > 0 = add to used_days (approve), delta < 0 = subtract (revoke/delete approved).
 */
async function updateLeaveBalance(staffId, staffName, leaveYear, delta) {
  try {
    const balances = await base44.entities.HolidayAllowance.filter({
      staff_id: staffId,
      year: leaveYear,
    });

    if (balances.length > 0) {
      const balance = balances[0];
      const newUsed = Math.max(0, (balance.used_days || 0) + delta);
      await base44.entities.HolidayAllowance.update(balance.id, { used_days: newUsed });
    } else if (delta > 0) {
      await base44.entities.HolidayAllowance.create({
        staff_id: staffId,
        staff_name: staffName,
        year: leaveYear,
        total_allowance_days: 28,
        total_allowance_hours: 210,
        used_days: delta,
        pending_days: 0,
        carried_over_days: 0,
      });
    }
  } catch (err) {
    console.error('Failed to update leave balance:', err);
  }
}

/**
 * Clear staff from shifts during leave dates — revert to blank (claimable).
 * Template-based shifts (have shift_name) are reverted to blank.
 * Non-template shifts are deleted.
 */
async function clearShiftsForLeave(staffId, startDate, endDate) {
  try {
    // Find all shifts for this staff member in the date range
    const { data: staffShifts, error } = await supabase
      .from('shifts')
      .select('id, shift_name, paired_shift_id')
      .eq('staff_id', staffId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;
    if (!staffShifts || staffShifts.length === 0) return 0;

    // Template shifts → revert to blank (available)
    const templateShiftIds = staffShifts.filter(s => s.shift_name).map(s => s.id);
    if (templateShiftIds.length > 0) {
      const BATCH = 50;
      for (let i = 0; i < templateShiftIds.length; i += BATCH) {
        await supabase
          .from('shifts')
          .update({
            staff_id: null,
            staff_name: null,
            shift_pattern_id: null,
            paired_shift_id: null,
            paired_staff_name: null,
            is_base_shift: true,
            status: 'available',
          })
          .in('id', templateShiftIds.slice(i, i + BATCH));
      }
    }

    // Non-template shifts → delete
    const orphanShiftIds = staffShifts.filter(s => !s.shift_name).map(s => s.id);
    if (orphanShiftIds.length > 0) {
      const BATCH = 50;
      for (let i = 0; i < orphanShiftIds.length; i += BATCH) {
        await supabase
          .from('shifts')
          .delete()
          .in('id', orphanShiftIds.slice(i, i + BATCH));
      }
    }

    // Clear paired references
    const pairedIds = staffShifts.filter(s => s.paired_shift_id).map(s => s.paired_shift_id);
    if (pairedIds.length > 0) {
      const BATCH = 50;
      for (let i = 0; i < pairedIds.length; i += BATCH) {
        await supabase
          .from('shifts')
          .update({ paired_shift_id: null, paired_staff_name: null })
          .in('id', pairedIds.slice(i, i + BATCH));
      }
    }

    return staffShifts.length;
  } catch (err) {
    console.error('Failed to clear shifts for leave:', err);
    return 0;
  }
}

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
    mutationFn: async (request) => {
      // 1. Approve the leave request
      await base44.entities.LeaveRequest.update(request.id, {
        status: 'approved',
        reviewed_by: currentUser?.id,
        reviewed_by_name: currentUser?.full_name,
      });

      // 2. Deduct from leave balance (annual leave only)
      const days = getLeaveDays(request);
      if (days > 0 && request.type === 'annual_leave') {
        const leaveYear = new Date(request.start_date).getFullYear();
        await updateLeaveBalance(request.staff_id, request.staff_name, leaveYear, days);
      }

      // 3. Clear staff from shifts for leave dates (make claimable)
      const clearedCount = await clearShiftsForLeave(
        request.staff_id,
        request.start_date,
        request.end_date
      );

      return { days, clearedCount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      const msg = result.clearedCount > 0
        ? `Leave approved — ${result.days} days deducted, ${result.clearedCount} shift(s) now available`
        : `Leave approved — ${result.days} days deducted from balance`;
      toast.success(msg);
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
    mutationFn: async (request) => {
      // If deleting an approved annual_leave, restore the balance
      if (request.status === 'approved' && request.type === 'annual_leave') {
        const days = getLeaveDays(request);
        if (days > 0) {
          const leaveYear = new Date(request.start_date).getFullYear();
          await updateLeaveBalance(request.staff_id, request.staff_name, leaveYear, -days);
        }
      }
      await base44.entities.LeaveRequest.delete(request.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      toast.success('Leave request deleted — balance restored');
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
        requests.map((request) => {
          const days = getLeaveDays(request);
          return (
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
                    {days > 0 && (
                      <span className="text-xs text-slate-500">{days} day{days !== 1 ? 's' : ''}</span>
                    )}
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
                          onClick={() => approveMutation.mutate(request)}
                          disabled={approveMutation.isPending}
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
          );
        })
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Leave Request?"
        description="Delete this approved leave request? The leave balance will be restored."
        confirmLabel="Yes, Delete"
        variant="destructive"
        onConfirm={() => {
          const request = requests.find(r => r.id === pendingDeleteId);
          if (request) {
            deleteMutation.mutate(request);
            setPendingDeleteId(null);
          }
        }}
      />
    </div>
  );
}

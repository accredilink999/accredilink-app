import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import LeaveCalendarPopup from '@/components/leave/LeaveCalendarPopup';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign,
  ArrowRightLeft,
  CalendarOff,
  AlertCircle,
  Calendar,
  Trash2,
  ClipboardCheck
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const leaveTypeLabels = {
  annual_leave: 'Annual Leave',
  sick_leave: 'Sick Leave',
  unpaid_leave: 'Unpaid Leave',
  maternity: 'Maternity Leave',
  paternity: 'Paternity Leave',
  compassionate: 'Compassionate Leave',
  other: 'Other'
};

const leaveTypeColors = {
  annual_leave: 'bg-blue-100 text-blue-700',
  sick_leave: 'bg-red-100 text-red-700',
  unpaid_leave: 'bg-slate-100 text-slate-700',
  maternity: 'bg-pink-100 text-pink-700',
  paternity: 'bg-purple-100 text-purple-700',
  compassionate: 'bg-amber-100 text-amber-700',
  other: 'bg-slate-100 text-slate-700'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-slate-100 text-slate-800',
};

const statusIcons = {
  pending: <Clock className="w-4 h-4" />,
  approved: <CheckCircle2 className="w-4 h-4" />,
  rejected: <XCircle className="w-4 h-4" />,
};

export default function AdminApprovalsFinancials() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('leave');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['allLeaveRequests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date', 100),
  });

  const { data: shiftSwaps = [] } = useQuery({
    queryKey: ['allShiftSwaps'],
    queryFn: () => base44.entities.ShiftSwapRequest.list('-created_date', 100),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['allExpenses'],
    queryFn: () => base44.entities.Expense.list('-created_date', 100),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staffMembers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  const updateLeaveMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeaveRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] }),
  });

  const updateSwapMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ShiftSwapRequest.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allShiftSwaps'] }),
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allExpenses'] }),
  });

  const handleApproveLeave = (request) => {
    updateLeaveMutation.mutate({
      id: request.id,
      data: {
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_by_name: user?.full_name
      }
    });
  };

  const handleRejectLeave = (request) => {
    updateLeaveMutation.mutate({
      id: request.id,
      data: {
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_by_name: user?.full_name
      }
    });
  };

  const deleteLeaveRequest = async (id) => {
    if (confirm('Delete this leave request?')) {
      await base44.entities.LeaveRequest.delete(id);
      queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] });
    }
  };

  const handleApproveSwap = (request) => {
    updateSwapMutation.mutate({
      id: request.id,
      data: {
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_by_name: user?.full_name
      }
    });
  };

  const handleRejectSwap = (request) => {
    updateSwapMutation.mutate({
      id: request.id,
      data: {
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_by_name: user?.full_name
      }
    });
  };

  const handleApproveExpense = (expense) => {
    updateExpenseMutation.mutate({
      id: expense.id,
      data: {
        status: 'approved',
        reviewed_by: user?.id,
        reviewed_by_name: user?.full_name
      }
    });
  };

  const handleRejectExpense = (expense) => {
    updateExpenseMutation.mutate({
      id: expense.id,
      data: {
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_by_name: user?.full_name
      }
    });
  };

  const pendingLeave = leaveRequests.filter(r => r.status === 'pending');
  const pendingSwaps = shiftSwaps.filter(r => r.status === 'pending');
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const approvedExpenses = expenses.filter(e => e.status === 'approved');

  const totalApprovedExpenses = approvedExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalPendingExpenses = pendingExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Approvals & Financials"
        subtitle="Manage all staff leave requests, shift swaps, and expense approvals"
        icon={ClipboardCheck}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-700">{pendingLeave.length}</p>
              <p className="text-sm text-amber-600 mt-1">Pending Leave</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-700">{pendingSwaps.length}</p>
              <p className="text-sm text-purple-600 mt-1">Pending Swaps</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-700">{pendingExpenses.length}</p>
              <p className="text-sm text-blue-600 mt-1">Pending Expenses</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-700">£{totalPendingExpenses.toFixed(2)}</p>
              <p className="text-sm text-emerald-600 mt-1">Total Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200 w-full justify-start">
          <TabsTrigger value="leave" className="relative">
            Leave Requests
            {pendingLeave.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                {pendingLeave.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="swaps" className="relative">
            Shift Swaps
            {pendingSwaps.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                {pendingSwaps.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="expenses" className="relative">
            Expenses
            {pendingExpenses.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                {pendingExpenses.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Leave Requests Tab */}
        <TabsContent value="leave" className="space-y-4">
          <div className="mb-4">
            <Button
              onClick={() => setCalendarOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Team Leave Calendar
            </Button>
          </div>

          {leaveRequests.length === 0 ? (
            <EmptyState
              icon={CalendarOff}
              title="No leave requests"
              description="All leave requests have been processed"
            />
          ) : (
            <div className="space-y-3">
              {leaveRequests.map((request, idx) => {
                const days = differenceInDays(new Date(request.end_date), new Date(request.start_date)) + 1;
                const colors = [
                  'from-blue-50 to-cyan-50 border-blue-100',
                  'from-purple-50 to-pink-50 border-purple-100',
                  'from-emerald-50 to-teal-50 border-emerald-100',
                  'from-orange-50 to-red-50 border-orange-100',
                  'from-amber-50 to-yellow-50 border-amber-100'
                ];
                const colorClass = colors[idx % colors.length];
                const staffUser = staffMembers.find(s => s.id === request.staff_id);
                const displayName = staffUser?.staff_full_name || staffUser?.full_name || request.staff_name;

                return (
                  <Card key={request.id} className={`p-4 bg-gradient-to-r ${colorClass}`}>
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar name={displayName} size="sm" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-slate-900">{displayName}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${leaveTypeColors[request.type]}`}>
                              {leaveTypeLabels[request.type]}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {format(new Date(request.start_date), 'dd MMM')} - {format(new Date(request.end_date), 'dd MMM yyyy')}
                            <span className="text-slate-400"> ({days} day{days > 1 ? 's' : ''})</span>
                          </p>
                          {request.reason && <p className="text-sm text-slate-600 mt-1">{request.reason}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusColors[request.status]}>
                          <span className="flex items-center gap-1">
                            {statusIcons[request.status]}
                            {request.status}
                          </span>
                        </Badge>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRejectLeave(request)}
                              disabled={updateLeaveMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1 text-red-500" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveLeave(request)}
                              disabled={updateLeaveMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                        {request.status === 'approved' && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => deleteLeaveRequest(request.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Shift Swaps Tab */}
        <TabsContent value="swaps" className="space-y-4">
          {shiftSwaps.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="No shift swap requests"
              description="All shift swap requests have been processed"
            />
          ) : (
            <div className="space-y-3">
              {shiftSwaps.map((request, idx) => {
                const colors = [
                  'from-blue-50 to-cyan-50 border-blue-100',
                  'from-purple-50 to-pink-50 border-purple-100',
                  'from-emerald-50 to-teal-50 border-emerald-100',
                ];
                const colorClass = colors[idx % colors.length];

                return (
                  <Card key={request.id} className={`p-4 bg-gradient-to-r ${colorClass}`}>
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          <Avatar name={request.requested_by_name} size="sm" />
                          <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                          <Avatar name={request.swap_with_name} size="sm" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{request.requested_by_name} ↔ {request.swap_with_name}</h3>
                          <p className="text-sm text-slate-600 mt-1">{request.shift_date || 'Date not specified'}</p>
                          {request.reason && <p className="text-sm text-slate-600 mt-1">{request.reason}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusColors[request.status]}>
                          <span className="flex items-center gap-1">
                            {statusIcons[request.status]}
                            {request.status}
                          </span>
                        </Badge>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRejectSwap(request)}
                              disabled={updateSwapMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1 text-red-500" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveSwap(request)}
                              disabled={updateSwapMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-700">£{totalPendingExpenses.toFixed(2)}</p>
                  <p className="text-sm text-blue-600 mt-1">Pending Amount</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-700">£{totalApprovedExpenses.toFixed(2)}</p>
                  <p className="text-sm text-emerald-600 mt-1">Approved Total</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-700">{pendingExpenses.length}</p>
                  <p className="text-sm text-purple-600 mt-1">Awaiting Review</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {expenses.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No expenses submitted"
              description="All expenses have been processed"
            />
          ) : (
            <div className="space-y-3">
              {expenses.map((expense, idx) => {
                const colors = [
                  'from-orange-50 to-amber-50 border-orange-100',
                  'from-rose-50 to-pink-50 border-rose-100',
                  'from-sky-50 to-blue-50 border-sky-100',
                ];
                const colorClass = colors[idx % colors.length];

                return (
                  <Card key={expense.id} className={`p-4 bg-gradient-to-r ${colorClass}`}>
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {(() => {
                          const staffUser = staffMembers.find(s => s.id === expense.staff_id);
                          const displayName = staffUser?.staff_full_name || staffUser?.full_name || expense.staff_name;
                          return (
                            <>
                              <Avatar name={displayName} size="sm" />
                              <div>
                                <h3 className="font-semibold text-slate-900">{expense.description}</h3>
                                <p className="text-sm text-slate-600 mt-1">{displayName}</p>
                                <p className="text-lg font-bold text-slate-900 mt-2">£{parseFloat(expense.amount).toFixed(2)}</p>
                                <p className="text-xs text-slate-500 mt-1">Submitted: {format(new Date(expense.created_date), 'dd MMM yyyy')}</p>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusColors[expense.status]}>
                          <span className="flex items-center gap-1">
                            {statusIcons[expense.status]}
                            {expense.status}
                          </span>
                        </Badge>
                        {expense.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRejectExpense(expense)}
                              disabled={updateExpenseMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-1 text-red-500" />
                              Reject
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => handleApproveExpense(expense)}
                              disabled={updateExpenseMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <LeaveCalendarPopup open={calendarOpen} onClose={() => setCalendarOpen(false)} showInitials={false} />
    </div>
  );
}
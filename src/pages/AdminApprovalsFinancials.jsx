import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { invokeFunction } from '@/api/functions';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  ClipboardCheck,
  Car,
  PoundSterling,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  List,
  Download,
  Users,
  Loader2
} from 'lucide-react';
import { format, differenceInDays, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameWeek, isAfter } from 'date-fns';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState('expenses');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(null); // null = auto-detect
  const [expenseView, setExpenseView] = useState('weekly'); // 'weekly' | 'all'
  const [expandedCards, setExpandedCards] = useState({});
  const [expandedDays, setExpandedDays] = useState({});
  const [customRate, setCustomRate] = useState('');
  const [monthlyDay, setMonthlyDay] = useState('');
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [staffFilter, setStaffFilter] = useState('all');

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
    queryFn: () => base44.entities.Expense.list('-created_date', 500),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staffMembers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  // Mileage rate from SystemSettings
  const { data: rateSettings = [] } = useQuery({
    queryKey: ['mileageRateSetting'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'mileage_rate_ppm' }),
  });
  const mileageRatePpm = rateSettings[0]?.setting_value ? parseInt(rateSettings[0].setting_value, 10) : 45;
  const mileageRate = mileageRatePpm / 100; // £ per mile

  const saveRateMutation = useMutation({
    mutationFn: async (ppm) => {
      const existing = rateSettings[0];
      if (existing) {
        return base44.entities.SystemSettings.update(existing.id, { setting_value: String(ppm) });
      }
      return base44.entities.SystemSettings.create({
        setting_key: 'mileage_rate_ppm',
        setting_value: String(ppm),
        description: 'Mileage rate in pence per mile',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mileageRateSetting'] });
      toast.success('Mileage rate updated');
    },
  });

  // Pay schedule from SystemSettings — JSON: { type: 'weekly'|'monthly', day: number }
  // weekly: day = day of week (0=Sun..6=Sat), default 4 (Thursday)
  // monthly: day = day of month (1-28)
  const { data: payScheduleSettings = [] } = useQuery({
    queryKey: ['payScheduleSetting'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'expense_pay_schedule' }),
  });
  const paySchedule = useMemo(() => {
    try {
      return payScheduleSettings[0]?.setting_value ? JSON.parse(payScheduleSettings[0].setting_value) : { type: 'weekly', day: 4 };
    } catch { return { type: 'weekly', day: 4 }; }
  }, [payScheduleSettings]);

  const savePayScheduleMutation = useMutation({
    mutationFn: async (schedule) => {
      const val = JSON.stringify(schedule);
      const existing = payScheduleSettings[0];
      if (existing) {
        return base44.entities.SystemSettings.update(existing.id, { setting_value: val });
      }
      return base44.entities.SystemSettings.create({
        setting_key: 'expense_pay_schedule',
        setting_value: val,
        description: 'Expense payment schedule (weekly/monthly)',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payScheduleSetting'] });
      toast.success('Payment schedule updated');
    },
  });

  // Calculate next pay date based on schedule
  const getNextPayDateStr = () => {
    const now = new Date();
    if (paySchedule.type === 'monthly') {
      const dayOfMonth = paySchedule.day || 1;
      let payDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
      if (payDate <= now) payDate = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
      return format(payDate, "EEEE do MMMM");
    }
    // weekly — default Thursday (day 4)
    const targetDay = paySchedule.day ?? 4;
    const current = now.getDay();
    let daysUntil = (targetDay - current + 7) % 7;
    if (daysUntil === 0) daysUntil = 7; // next week, not today
    const payDate = new Date(now);
    payDate.setDate(payDate.getDate() + daysUntil);
    return format(payDate, "EEEE do MMMM");
  };

  // Filter expenses by selected staff
  const filteredExpenses = useMemo(() => {
    if (staffFilter === 'all') return expenses;
    return expenses.filter(e => e.staff_id === staffFilter);
  }, [expenses, staffFilter]);

  // Get unique staff members who have expenses
  const staffWithExpenses = useMemo(() => {
    const staffMap = {};
    expenses.forEach(exp => {
      if (!exp.staff_id || exp.expense_type === 'weekly_mileage') return;
      if (!staffMap[exp.staff_id]) {
        const staffUser = staffMembers.find(s => s.id === exp.staff_id);
        staffMap[exp.staff_id] = {
          id: exp.staff_id,
          name: staffUser?.staff_full_name || staffUser?.full_name || exp.staff_name || 'Unknown',
        };
      }
    });
    return Object.values(staffMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [expenses, staffMembers]);

  // Group expenses by staff + week (Sun-Sat)
  const weeklyStaffGroups = useMemo(() => {
    const groups = {};
    filteredExpenses.forEach(exp => {
      if (exp.expense_type === 'weekly_mileage') return; // skip summary records
      const expDate = new Date(exp.date || exp.expense_date || exp.created_date || exp.created_at);
      if (isNaN(expDate.getTime())) return;
      const weekStart = startOfWeek(expDate, { weekStartsOn: 0 });
      const staffId = exp.staff_id || 'unknown';
      const key = `${format(weekStart, 'yyyy-MM-dd')}_${staffId}`;
      if (!groups[key]) {
        const staffUser = staffMembers.find(s => s.id === staffId);
        groups[key] = {
          weekStart,
          weekEnd: endOfWeek(expDate, { weekStartsOn: 0 }),
          staffId,
          staffName: staffUser?.staff_full_name || staffUser?.full_name || exp.staff_name || 'Unknown',
          expenses: [],
          totalMiles: 0,
          totalAmount: 0,
        };
      }
      groups[key].expenses.push(exp);
      groups[key].totalAmount += parseFloat(exp.amount || 0);
      if (exp.expense_type === 'mileage') {
        groups[key].totalMiles += parseFloat(exp.mileage_distance || exp.mileage || 0);
      }
    });
    return groups;
  }, [filteredExpenses, staffMembers]);

  // Auto-select the most recent week with expenses (or current week if none)
  useEffect(() => {
    if (selectedWeek !== null) return; // already set by user
    const allWeekStarts = Object.values(weeklyStaffGroups).map(g => g.weekStart);
    if (allWeekStarts.length > 0) {
      const mostRecent = allWeekStarts.sort((a, b) => b - a)[0];
      setSelectedWeek(mostRecent);
    } else {
      setSelectedWeek(startOfWeek(new Date(), { weekStartsOn: 0 }));
    }
  }, [weeklyStaffGroups, selectedWeek]);

  const effectiveWeek = selectedWeek || startOfWeek(new Date(), { weekStartsOn: 0 });

  // Filter groups for the selected week
  const currentWeekGroups = useMemo(() => {
    return Object.entries(weeklyStaffGroups)
      .filter(([, g]) => isSameWeek(g.weekStart, effectiveWeek, { weekStartsOn: 0 }))
      .map(([key, g]) => ({
        ...g,
        key,
        allApproved: g.expenses.every(e => e.status === 'approved' || e.status === 'paid'),
        allPaid: g.expenses.every(e => e.status === 'paid'),
        hasPending: g.expenses.some(e => e.status === 'pending'),
      }))
      .sort((a, b) => a.staffName.localeCompare(b.staffName));
  }, [weeklyStaffGroups, effectiveWeek]);

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

  const deleteLeaveRequest = (id) => {
    setPendingAction(() => async () => {
      await base44.entities.LeaveRequest.delete(id);
      queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] });
    });
    setConfirmOpen(true);
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
    // Notify staff
    if (expense.staff_id) {
      const payDateStr = getNextPayDateStr();
      const amt = parseFloat(expense.amount || 0).toFixed(2);
      base44.functions.invoke('createNotification', {
        recipient_ids: [expense.staff_id],
        type: 'expense_approved',
        title: 'Expenses Approved',
        message: `Your expenses (£${amt}) have been approved and will be paid into your account on ${payDateStr}.`,
        priority: 'normal',
        action_url: '/ApprovalsAndFinancials',
        send_push: true,
      }).catch(e => console.warn('Expense approval notification failed:', e));
    }
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

  // Batch approve all expenses for a staff member's week
  const batchApproveMutation = useMutation({
    mutationFn: async ({ expenseIds, staffId, staffName, totalAmount }) => {
      await Promise.all(expenseIds.map(id =>
        base44.entities.Expense.update(id, {
          status: 'approved',
          reviewed_by: user?.id,
          reviewed_by_name: user?.full_name,
        })
      ));
      return { staffId, staffName, totalAmount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['allExpenses'] });
      toast.success('Week approved');
      if (result?.staffId) {
        const payDateStr = getNextPayDateStr();
        const amt = parseFloat(result.totalAmount || 0).toFixed(2);
        base44.functions.invoke('createNotification', {
          recipient_ids: [result.staffId],
          type: 'expense_approved',
          title: 'Expenses Approved',
          message: `Your weekly expenses (£${amt}) have been approved and will be paid into your account on ${payDateStr}.`,
          priority: 'normal',
          action_url: '/ApprovalsAndFinancials',
          send_push: true,
        }).catch(e => console.warn('Batch approval notification failed:', e));
      }
    },
  });

  const batchRejectMutation = useMutation({
    mutationFn: async ({ expenseIds }) => {
      await Promise.all(expenseIds.map(id =>
        base44.entities.Expense.update(id, {
          status: 'rejected',
          reviewed_by: user?.id,
          reviewed_by_name: user?.full_name,
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allExpenses'] });
      toast.success('Week rejected');
    },
  });

  const batchMarkPaidMutation = useMutation({
    mutationFn: async ({ expenseIds, staffId, staffName, totalAmount }) => {
      await Promise.all(expenseIds.map(id =>
        base44.entities.Expense.update(id, { status: 'paid' })
      ));
      return { staffId, staffName, totalAmount };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['allExpenses'] });
      toast.success('Marked as paid');
      if (result?.staffId) {
        const amt = parseFloat(result.totalAmount || 0).toFixed(2);
        base44.functions.invoke('createNotification', {
          recipient_ids: [result.staffId],
          type: 'expense_paid',
          title: 'Expenses Paid',
          message: `£${amt} mileage expenses have been paid into your account.`,
          priority: 'normal',
          action_url: '/ApprovalsAndFinancials',
          send_push: true,
        }).catch(e => console.warn('Batch paid notification failed:', e));
      }
    },
  });

  // Backfill mileage from shift_calls
  const handleBackfill = async () => {
    setBackfillLoading(true);
    try {
      const result = await invokeFunction('backfillMileageExpenses');
      const msg = result.message || `Created ${result.created} mileage expenses`;
      console.log('[Backfill result]', JSON.stringify(result, null, 2));
      if (result.errors?.length) {
        toast.error(`${msg}\nErrors: ${result.errors.join(', ')}`);
      } else {
        toast.success(msg);
      }
      queryClient.invalidateQueries({ queryKey: ['allExpenses'] });
    } catch (err) {
      toast.error(err.message || 'Backfill failed');
    } finally {
      setBackfillLoading(false);
    }
  };

  // Debug mileage for a specific staff member or client
  const handleDebugMileage = async (name, mode = 'staff') => {
    try {
      const payload = mode === 'client' ? { clientName: name } : { staffName: name };
      const result = await invokeFunction('debugMileage', payload);
      console.log(`[Debug Mileage - ${mode}]`, JSON.stringify(result, null, 2));
      if (mode === 'client' && result.summary) {
        const s = result.summary;
        toast.info(
          `Client "${name}":\n` +
          `Found in service_users: ${s.serviceUsersFound > 0 ? 'YES' : 'NO'}\n` +
          `Has address: ${s.hasAddress ? 'YES' : 'NO'} | Has coords: ${s.hasCoordinates ? 'YES' : 'NO'}\n` +
          `Total calls: ${s.totalCalls} | With GPS: ${s.callsWithGPS}\n` +
          `With service_user_id: ${s.callsWithServiceUserId}/${s.totalCalls}\n` +
          `Drove: ${s.callsDroveTrue} yes / ${s.callsDroveFalse} no / ${s.callsDroveNull} null\n` +
          `Historical GPS points: ${s.historicalGPSPoints}\n` +
          `Name matches: ${s.allNamesMATCH ? 'ALL MATCH' : 'MISMATCH — check console'}`,
          { duration: 20000 }
        );
      } else if (result.summary) {
        const s = result.summary;
        toast.info(
          `${name}: ${s.totalShifts} shifts, ${s.totalCalls} calls\n` +
          `Drove: ${s.callsDroveTrue} yes / ${s.callsDroveFalse} no / ${s.callsDroveNull} null\n` +
          `GPS: ${s.callsWithGPS}/${s.totalCalls} calls\n` +
          `Service users with coords: ${s.serviceUsersWithCoords}/${s.serviceUsersWithAddress}\n` +
          `Existing expenses: ${s.existingMileageExpenses}`,
          { duration: 15000 }
        );
      } else {
        toast.info(JSON.stringify(result), { duration: 10000 });
      }
    } catch (err) {
      toast.error(`Debug failed: ${err.message}`);
    }
  };

  const pendingLeave = leaveRequests.filter(r => r.status === 'pending');
  const pendingSwaps = shiftSwaps.filter(r => r.status === 'pending');
  const pendingExpenses = filteredExpenses.filter(e => e.status === 'pending' && e.expense_type !== 'weekly_mileage');
  const approvedExpenses = filteredExpenses.filter(e => e.status === 'approved' && e.expense_type !== 'weekly_mileage');

  // Recalculate totals using current mileage rate for mileage expenses
  const calcExpenseAmount = (e) => {
    if (e.expense_type === 'mileage') {
      return parseFloat(e.mileage_distance || e.mileage || 0) * mileageRate;
    }
    return parseFloat(e.amount) || 0;
  };
  const totalApprovedExpenses = approvedExpenses.reduce((sum, e) => sum + calcExpenseAmount(e), 0);
  const totalPendingExpenses = pendingExpenses.reduce((sum, e) => sum + calcExpenseAmount(e), 0);

  // Week-level totals
  const weekTotalPending = currentWeekGroups.filter(g => g.hasPending).reduce((sum, g) => sum + g.totalAmount, 0);
  const weekTotalApproved = currentWeekGroups.filter(g => g.allApproved && !g.allPaid).reduce((sum, g) => sum + g.totalAmount, 0);
  const weekTotalMiles = currentWeekGroups.reduce((sum, g) => sum + g.totalMiles, 0);

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
              <p className="text-3xl font-bold text-blue-700">{currentWeekGroups.filter(g => g.hasPending).reduce((sum, g) => sum + g.expenses.filter(e => e.status === 'pending').length, 0)}</p>
              <p className="text-sm text-blue-600 mt-1">Week Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-700">£{weekTotalPending.toFixed(2)}</p>
              <p className="text-sm text-emerald-600 mt-1">Week Pending</p>
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
          {/* Expense Settings — mileage rate + pay schedule */}
          <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-5 h-5 text-teal-600" />
              <p className="text-sm font-semibold text-slate-700">Mileage Rate: <span className="text-teal-700 text-base">{mileageRatePpm}p/mile</span></p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[25, 30, 35, 40, 45].map(rate => (
                <Button
                  key={rate}
                  size="sm"
                  variant={mileageRatePpm === rate ? 'default' : 'outline'}
                  className={mileageRatePpm === rate ? 'bg-teal-600' : ''}
                  onClick={() => saveRateMutation.mutate(rate)}
                  disabled={saveRateMutation.isPending}
                >
                  {rate}p
                </Button>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Custom"
                  className="w-20 h-9"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                />
                <span className="text-sm text-slate-500">p</span>
                <Button
                  size="sm"
                  disabled={!customRate || saveRateMutation.isPending}
                  onClick={() => { if (customRate) saveRateMutation.mutate(parseInt(customRate, 10)); }}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Set
                </Button>
              </div>
            </div>

            {/* Pay Schedule */}
            <div className="mt-4 pt-3 border-t border-teal-200/50">
              <div className="flex items-center gap-2 mb-2">
                <PoundSterling className="w-4 h-4 text-teal-600" />
                <p className="text-sm font-semibold text-slate-700">Payment Day: <span className="text-teal-700">{getNextPayDateStr()}</span></p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Select
                  value={paySchedule.type}
                  onValueChange={(val) => savePayScheduleMutation.mutate({ type: val, day: val === 'weekly' ? 4 : 1 })}
                >
                  <SelectTrigger className="w-[130px] h-9 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>

                {paySchedule.type === 'weekly' && (
                  <Select
                    value={String(paySchedule.day ?? 4)}
                    onValueChange={(val) => savePayScheduleMutation.mutate({ type: 'weekly', day: parseInt(val, 10) })}
                  >
                    <SelectTrigger className="w-[140px] h-9 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((name, i) => (
                        <SelectItem key={i} value={String(i)}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {paySchedule.type === 'monthly' && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={1}
                      max={28}
                      placeholder={String(paySchedule.day || 1)}
                      className="w-16 h-9 bg-white"
                      value={monthlyDay}
                      onChange={(e) => setMonthlyDay(e.target.value)}
                    />
                    <span className="text-xs text-slate-500">of each month</span>
                    <Button
                      size="sm"
                      disabled={!monthlyDay || savePayScheduleMutation.isPending}
                      onClick={() => {
                        const d = Math.min(28, Math.max(1, parseInt(monthlyDay, 10) || 1));
                        savePayScheduleMutation.mutate({ type: 'monthly', day: d });
                        setMonthlyDay('');
                      }}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      Set
                    </Button>
                  </div>
                )}

                {savePayScheduleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-teal-600" />}
              </div>
            </div>
          </Card>

          {/* Import & Staff Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={handleBackfill}
              disabled={backfillLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {backfillLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
              {backfillLoading ? 'Importing...' : 'Import Existing Mileage'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const name = prompt('Staff name to debug:');
                if (name) handleDebugMileage(name, 'staff');
              }}
            >
              Debug Staff
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const name = prompt('Client/service user name to debug:');
                if (name) handleDebugMileage(name, 'client');
              }}
            >
              Debug Client
            </Button>

            <div className="flex items-center gap-1 ml-auto">
              <Users className="w-4 h-4 text-slate-400" />
              <Select value={staffFilter} onValueChange={setStaffFilter}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="All Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffWithExpenses.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant={expenseView === 'weekly' ? 'default' : 'outline'} className={expenseView === 'weekly' ? 'bg-teal-600 hover:bg-teal-700' : ''} onClick={() => setExpenseView('weekly')}>
              Weekly Summary
            </Button>
            <Button size="sm" variant={expenseView === 'all' ? 'default' : 'outline'} className={expenseView === 'all' ? 'bg-teal-600 hover:bg-teal-700' : ''} onClick={() => setExpenseView('all')}>
              <List className="w-3.5 h-3.5 mr-1" /> All
            </Button>
          </div>

          {expenseView === 'weekly' ? (
            <>
              {/* Week navigator */}
              <div className="flex items-center justify-between">
                <Button size="sm" variant="outline" onClick={() => setSelectedWeek(subWeeks(effectiveWeek, 1))}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Sun {format(effectiveWeek, 'dd MMM')} – Sat {format(endOfWeek(effectiveWeek, { weekStartsOn: 0 }), 'dd MMM yyyy')}
                  </h3>
                  {isSameWeek(effectiveWeek, new Date(), { weekStartsOn: 0 }) && (
                    <Badge className="mt-1 bg-teal-100 text-teal-700">Week to Date</Badge>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => setSelectedWeek(addWeeks(effectiveWeek, 1))}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {/* Week stats */}
              {(() => {
                const isCurrentWeek = isSameWeek(effectiveWeek, new Date(), { weekStartsOn: 0 });
                const weekTotalAmount = currentWeekGroups.reduce((sum, g) => sum + g.totalAmount, 0);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                      <CardContent className="pt-5 pb-4">
                        <div className="text-center">
                          <Car className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-slate-700">{weekTotalMiles.toFixed(1)}</p>
                          <p className="text-xs text-slate-500">{isCurrentWeek ? 'Miles So Far' : 'Total Miles'}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                      <CardContent className="pt-5 pb-4">
                        <div className="text-center">
                          <PoundSterling className="w-5 h-5 text-teal-500 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-teal-700">£{weekTotalAmount.toFixed(2)}</p>
                          <p className="text-xs text-teal-500">{isCurrentWeek ? 'Week to Date Total' : 'Week Total'}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                      <CardContent className="pt-5 pb-4">
                        <div className="text-center">
                          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-blue-700">£{weekTotalPending.toFixed(2)}</p>
                          <p className="text-xs text-blue-500">Pending Approval</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                      <CardContent className="pt-5 pb-4">
                        <div className="text-center">
                          <Users className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-purple-700">{currentWeekGroups.length}</p>
                          <p className="text-xs text-purple-500">Staff Members</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {/* Per-staff weekly cards */}
              {currentWeekGroups.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="No expenses this week"
                  description="No expense claims have been submitted for this week"
                />
              ) : (
                <div className="space-y-3">
                  {currentWeekGroups.map((group) => {
                    const isExpanded = expandedCards[group.key];
                    const status = group.allPaid ? 'paid' : group.allApproved ? 'approved' : group.hasPending ? 'pending' : 'approved';
                    const pendingIds = group.expenses.filter(e => e.status === 'pending').map(e => e.id);
                    const approvedIds = group.expenses.filter(e => e.status === 'approved').map(e => e.id);

                    return (
                      <Card key={group.key} className="overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Avatar name={group.staffName} size="sm" />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 truncate">{group.staffName}</h4>
                                <p className="text-xs text-slate-500">{group.expenses.length} expense{group.expenses.length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                {group.totalMiles > 0 && (
                                  <p className="text-xs text-slate-500">{group.totalMiles.toFixed(1)} miles</p>
                                )}
                                <p className="text-lg font-bold text-slate-900">£{group.totalAmount.toFixed(2)}</p>
                              </div>
                              <Badge className={statusColors[status]}>
                                <span className="flex items-center gap-1">
                                  {statusIcons[status] || statusIcons.approved}
                                  {status}
                                </span>
                              </Badge>
                            </div>
                          </div>

                          {/* Daily breakdown — all 7 days Sun-Sat */}
                          <div className="mt-3 border-t border-slate-100 pt-3">
                            {(() => {
                              const today = new Date();
                              const days = [];
                              let runningMiles = 0;
                              let runningAmount = 0;
                              for (let i = 0; i < 7; i++) {
                                const day = new Date(group.weekStart);
                                day.setDate(day.getDate() + i);
                                const dayStr = format(day, 'yyyy-MM-dd');
                                const dayExps = group.expenses.filter(e => {
                                  const ed = new Date(e.date || e.expense_date || e.created_date);
                                  return format(ed, 'yyyy-MM-dd') === dayStr;
                                });
                                const dayMiles = dayExps.reduce((s, e) => s + parseFloat(e.mileage_distance || e.mileage || 0), 0);
                                const dayAmount = dayExps.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
                                runningMiles += dayMiles;
                                runningAmount += dayAmount;
                                const isToday = format(today, 'yyyy-MM-dd') === dayStr;
                                const isFuture = day > today;
                                days.push({ day, dayStr, dayMiles, dayAmount, hasData: dayExps.length > 0, runningMiles, runningAmount, isToday, isFuture, expCount: dayExps.length, expenses: dayExps });
                              }
                              return (
                                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-0 text-sm">
                                  <span className="text-xs font-semibold text-slate-400 uppercase pb-1">Day</span>
                                  <span className="text-xs font-semibold text-slate-400 uppercase text-right pb-1">Miles</span>
                                  <span className="text-xs font-semibold text-slate-400 uppercase text-right pb-1">Amount</span>
                                  <span className="text-xs font-semibold text-slate-400 uppercase text-right pb-1">Running</span>
                                  {days.map(d => {
                                    const dayKey = `${group.key}_${d.dayStr}`;
                                    const isDayExpanded = expandedDays[dayKey];
                                    return (
                                    <React.Fragment key={d.dayStr}>
                                      <span
                                        className={`py-1.5 border-b border-slate-50 flex items-center gap-1 cursor-pointer ${d.isToday ? 'font-semibold text-teal-700' : d.isFuture ? 'text-slate-300' : d.hasData ? 'text-slate-700' : 'text-slate-400'}`}
                                        onClick={() => d.hasData && setExpandedDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }))}
                                      >
                                        {d.hasData && (isDayExpanded ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />)}
                                        {format(d.day, 'EEE dd MMM')}
                                        {d.isToday && <Badge className="bg-teal-100 text-teal-700 text-[10px] py-0 px-1">Today</Badge>}
                                        {d.expCount > 1 && <span className="text-[10px] text-slate-400">({d.expCount})</span>}
                                      </span>
                                      <span className={`py-1.5 border-b border-slate-50 text-right ${d.isToday ? 'font-semibold text-teal-700' : d.hasData ? 'text-slate-700' : 'text-slate-300'}`}>
                                        {d.dayMiles > 0 ? `${d.dayMiles.toFixed(1)} mi` : '—'}
                                      </span>
                                      <span className={`py-1.5 border-b border-slate-50 text-right font-medium ${d.isToday ? 'font-semibold text-teal-700' : d.hasData ? 'text-slate-900' : 'text-slate-300'}`}>
                                        {d.dayAmount > 0 ? `£${d.dayAmount.toFixed(2)}` : '—'}
                                      </span>
                                      <span className={`py-1.5 border-b border-slate-50 text-right text-xs ${d.hasData ? 'text-slate-500' : 'text-slate-300'}`}>
                                        {d.runningAmount > 0 && !d.isFuture ? `£${d.runningAmount.toFixed(2)}` : '—'}
                                      </span>
                                      {isDayExpanded && d.expenses.map((exp, idx) => (
                                        <React.Fragment key={exp.id || idx}>
                                          <div className="col-span-4 bg-slate-50 px-3 py-2 text-xs text-slate-600 border-b border-slate-100 whitespace-pre-wrap">
                                            {exp.description || 'No detail'}
                                          </div>
                                        </React.Fragment>
                                      ))}
                                    </React.Fragment>
                                    );
                                  })}
                                  {/* Weekly total row */}
                                  <span className="font-semibold text-slate-900 pt-2 border-t border-slate-200">Week Total</span>
                                  <span className="font-semibold text-slate-900 pt-2 text-right border-t border-slate-200">{group.totalMiles.toFixed(1)} mi</span>
                                  <span className="font-bold text-slate-900 pt-2 text-right border-t border-slate-200">£{group.totalAmount.toFixed(2)}</span>
                                  <span className="pt-2 border-t border-slate-200"></span>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Action buttons */}
                          {pendingIds.length > 0 && (
                            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                              <Button
                                size="sm"
                                onClick={() => batchApproveMutation.mutate({ expenseIds: pendingIds, staffId: group.staffId, staffName: group.staffName, totalAmount: group.totalAmount })}
                                disabled={batchApproveMutation.isPending}
                                className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve Week
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => batchRejectMutation.mutate({ expenseIds: pendingIds })}
                                disabled={batchRejectMutation.isPending}
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-1 text-red-500" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {status === 'approved' && approvedIds.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100">
                              <Button
                                size="sm"
                                onClick={() => batchMarkPaidMutation.mutate({ expenseIds: approvedIds, staffId: group.staffId, staffName: group.staffName, totalAmount: group.totalAmount })}
                                disabled={batchMarkPaidMutation.isPending}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                <PoundSterling className="w-4 h-4 mr-1" />
                                Mark as Paid
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* All expenses flat list (original view) */
            <>
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

              {filteredExpenses.filter(e => e.expense_type !== 'weekly_mileage').length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  title="No expenses submitted yet"
                  description="Mileage expenses are automatically created when staff check out of their last call after answering 'Yes' to 'Did you drive?'"
                />
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.filter(e => e.expense_type !== 'weekly_mileage').map((expense, idx) => {
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
                                    <p className="text-lg font-bold text-slate-900 mt-2">
                                      £{expense.expense_type === 'mileage'
                                        ? (parseFloat(expense.mileage_distance || expense.mileage || 0) * mileageRate).toFixed(2)
                                        : (parseFloat(expense.amount) || 0).toFixed(2)}
                                    </p>
                                    {expense.expense_type === 'mileage' && (
                                      <p className="text-xs text-slate-500">{parseFloat(expense.mileage_distance || expense.mileage || 0).toFixed(1)} miles @ {mileageRatePpm}p/mile</p>
                                    )}
                                    <p className="text-xs text-slate-500 mt-1">Submitted: {format(new Date(expense.created_date || expense.created_at || expense.date || expense.expense_date), 'dd MMM yyyy')}</p>
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
            </>
          )}
        </TabsContent>
      </Tabs>

      <LeaveCalendarPopup open={calendarOpen} onClose={() => setCalendarOpen(false)} showInitials={false} />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete leave request?"
        description="This action cannot be undone."
        confirmLabel="Yes, Delete"
        variant="destructive"
        onConfirm={() => pendingAction?.()}
      />
    </div>
  );
}
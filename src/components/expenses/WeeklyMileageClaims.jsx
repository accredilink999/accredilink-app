import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Calendar, Car, PoundSterling, Clock, TrendingUp } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek, isAfter, isSameWeek } from 'date-fns';

// Week runs Friday to Thursday — payment due on the Thursday (end of period)
function getPaymentThursday(weekStartFriday) {
  const d = new Date(weekStartFriday);
  d.setDate(d.getDate() + 6); // Friday + 6 = Thursday
  return d;
}

export default function WeeklyMileageClaims({ userId, isAdmin }) {
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch all mileage expenses (individual per-shift records)
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['mileage-expenses', userId, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        const all = await base44.entities.Expense.list('-date', 500);
        return all.filter(e => e.expense_type === 'mileage');
      }
      const all = await base44.entities.Expense.list('-date', 200);
      return all.filter(e => e.expense_type === 'mileage' && e.staff_id === userId);
    },
    enabled: !!userId,
  });

  // Fetch weekly summary records
  const { data: weeklySummaries = [] } = useQuery({
    queryKey: ['weekly-mileage-summaries', userId, isAdmin],
    queryFn: async () => {
      const all = await base44.entities.Expense.list('-date', 200);
      if (isAdmin) {
        return all.filter(e => e.expense_type === 'weekly_mileage');
      }
      return all.filter(e => e.expense_type === 'weekly_mileage' && e.staff_id === userId);
    },
    enabled: !!userId,
  });

  // Load admin-configured mileage rate
  const { data: rateSettings = [] } = useQuery({
    queryKey: ['mileageRateSetting'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'mileage_rate_ppm' }),
  });
  const mileageRatePpm = rateSettings[0]?.setting_value ? parseInt(rateSettings[0].setting_value, 10) : 45;
  const mileageRate = mileageRatePpm / 100;

  // Group daily expenses by week (Fri-Thu) and by staff
  const weeklyGroups = {};
  expenses.forEach(exp => {
    const expDate = new Date(exp.date || exp.expense_date || exp.created_at);
    if (isNaN(expDate.getTime())) return;
    const weekStart = startOfWeek(expDate, { weekStartsOn: 5 }); // Sunday
    const staffKey = isAdmin ? exp.staff_id : 'me';
    const key = `${format(weekStart, 'yyyy-MM-dd')}_${staffKey}`;
    if (!weeklyGroups[key]) {
      weeklyGroups[key] = {
        weekStart,
        weekEnd: endOfWeek(expDate, { weekStartsOn: 5 }),
        weekStartStr: format(weekStart, 'yyyy-MM-dd'),
        staffId: exp.staff_id,
        staffName: exp.staff_name,
        expenses: [],
        totalMiles: 0,
        totalAmount: 0,
        paymentDue: getPaymentThursday(weekStart),
      };
    }
    weeklyGroups[key].expenses.push(exp);
    weeklyGroups[key].totalMiles += parseFloat(exp.mileage_distance || exp.mileage || 0);
    weeklyGroups[key].totalAmount += parseFloat(exp.mileage_distance || exp.mileage || 0) * mileageRate;
  });

  // Current week accrual for staff view
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 5 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 5 });
  const currentWeekKey = Object.keys(weeklyGroups).find(k =>
    weeklyGroups[k].weekStartStr === format(currentWeekStart, 'yyyy-MM-dd') &&
    (!isAdmin || weeklyGroups[k].staffId === userId)
  );
  const currentWeekGroup = currentWeekKey ? weeklyGroups[currentWeekKey] : null;

  // Map weekly summaries by staff + week for status lookup
  const summaryMap = {};
  weeklySummaries.forEach(s => {
    if (s.week_start_date && s.staff_id) {
      summaryMap[`${s.week_start_date}_${s.staff_id}`] = s;
    }
  });

  const weekKeys = Object.keys(weeklyGroups).sort((a, b) => b.localeCompare(a));

  const approveWeeklyMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Expense.update(id, {
      status: 'approved',
      approved_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-mileage-summaries'] });
      queryClient.invalidateQueries({ queryKey: ['mileage-expenses'] });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id }) => base44.entities.Expense.update(id, { status: 'paid' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-mileage-summaries'] });
    },
  });

  const generateWeeklyMutation = useMutation({
    mutationFn: () => base44.functions.invoke('createWeeklyMileageExpenses', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-mileage-summaries'] });
    },
  });

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      paid: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-40 bg-slate-100 animate-pulse rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current week accrual card */}
      {!isAdmin && (
        <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200 overflow-hidden">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-teal-800">This Week</h3>
              <span className="text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                {format(currentWeekStart, 'dd MMM')} – {format(currentWeekEnd, 'dd MMM')}
              </span>
            </div>
            {currentWeekGroup ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <Car className="w-4 h-4 text-teal-600 mx-auto" />
                  <p className="text-xl font-bold text-slate-900">{currentWeekGroup.totalMiles.toFixed(1)}</p>
                  <p className="text-xs text-slate-500">Miles</p>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <PoundSterling className="w-4 h-4 text-teal-600 mx-auto" />
                  <p className="text-xl font-bold text-slate-900">£{currentWeekGroup.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Accruing</p>
                </div>
                <div className="text-center p-2 bg-white/60 rounded-lg">
                  <Clock className="w-4 h-4 text-teal-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-900">{mileageRatePpm}p/mi</p>
                  <p className="text-xs text-slate-500">Rate</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-teal-600">No mileage logged this week yet</p>
            )}
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <div className="flex gap-3 items-center flex-wrap">
          <Button
            onClick={() => generateWeeklyMutation.mutate()}
            disabled={generateWeeklyMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700 min-h-[44px] touch-manipulation"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {generateWeeklyMutation.isPending ? 'Generating...' : 'Generate Weekly Claims'}
          </Button>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {weekKeys.length === 0 ? (
        <Card className="p-8 text-center">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No mileage records found</p>
          <p className="text-xs text-slate-400 mt-1">
            Mileage is automatically tracked when you answer "Yes" to "Did you drive?" at check-in
          </p>
        </Card>
      ) : (
        weekKeys.map(weekKey => {
          const group = weeklyGroups[weekKey];
          const summaryKey = `${group.weekStartStr}_${group.staffId}`;
          const summary = summaryMap[summaryKey];
          const status = summary?.status || 'pending';
          const isPastDue = isAfter(new Date(), group.paymentDue);

          if (filterStatus !== 'all' && status !== filterStatus) return null;

          return (
            <Card key={weekKey} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Week: {format(group.weekStart, 'dd MMM')} - {format(group.weekEnd, 'dd MMM yyyy')}
                    </CardTitle>
                    {isAdmin && group.staffName && (
                      <p className="text-sm text-slate-500 mt-1">{group.staffName}</p>
                    )}
                  </div>
                  <Badge className={getStatusBadge(status)}>{status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-slate-50 rounded">
                    <Car className="w-4 h-4 text-slate-500 mx-auto" />
                    <p className="text-lg font-bold text-slate-900">{group.totalMiles.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">Miles</p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded">
                    <PoundSterling className="w-4 h-4 text-slate-500 mx-auto" />
                    <p className="text-lg font-bold text-slate-900">{'\u00A3'}{group.totalAmount.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">Amount</p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded">
                    <Clock className="w-4 h-4 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-900">{format(group.paymentDue, 'dd MMM')}</p>
                    <p className="text-xs text-slate-500">{isPastDue ? 'Overdue' : 'Pay by'}</p>
                  </div>
                </div>

                {/* Daily breakdown */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase">Daily Breakdown</p>
                  {group.expenses
                    .sort((a, b) => new Date(a.date || a.expense_date) - new Date(b.date || b.expense_date))
                    .map(exp => (
                    <div key={exp.id} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                      <span className="text-slate-600">
                        {format(new Date(exp.date || exp.expense_date || exp.created_at), 'EEE dd MMM')}
                      </span>
                      <span className="text-slate-900 font-medium">
                        {parseFloat(exp.mileage_distance || exp.mileage || 0).toFixed(1)} mi / {'\u00A3'}{(parseFloat(exp.mileage_distance || exp.mileage || 0) * mileageRate).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Admin actions */}
                {isAdmin && summary && status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => approveWeeklyMutation.mutate({ id: summary.id })}
                      disabled={approveWeeklyMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 flex-1 min-h-[44px] touch-manipulation"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt('Rejection reason:');
                        if (reason) {
                          base44.entities.Expense.update(summary.id, { status: 'rejected', rejection_reason: reason });
                          queryClient.invalidateQueries({ queryKey: ['weekly-mileage-summaries'] });
                        }
                      }}
                      className="flex-1 min-h-[44px] touch-manipulation"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}

                {isAdmin && summary && status === 'approved' && (
                  <Button
                    size="sm"
                    onClick={() => markPaidMutation.mutate({ id: summary.id })}
                    disabled={markPaidMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 min-h-[44px] touch-manipulation"
                  >
                    <PoundSterling className="w-4 h-4 mr-1" />
                    Mark as Paid
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}

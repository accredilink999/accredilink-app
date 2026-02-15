import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle } from 'lucide-react';

export default function LeaveBalance({ userId }) {
  const currentYear = new Date().getFullYear();

  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.id === userId);
    },
  });

  const { data: allowance } = useQuery({
    queryKey: ['holiday-allowance', userId, currentYear],
    queryFn: async () => {
      const allowances = await base44.entities.HolidayAllowance.filter({
        staff_id: userId,
        year: currentYear
      });
      return allowances[0];
    },
  });

  const totalAllowance = allowance?.total_allowance_days || user?.holiday_allowance_days || 0;
  const usedDays = allowance?.used_days || user?.holiday_used_days || 0;
  const pendingDays = allowance?.pending_days || 0;
  const remainingDays = totalAllowance - usedDays - pendingDays;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Total Allowance</CardTitle>
          <Calendar className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{totalAllowance} days</div>
          <p className="text-xs text-slate-500">For {currentYear}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Used</CardTitle>
          <CheckCircle className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">{usedDays} days</div>
          <p className="text-xs text-slate-500">{pendingDays} pending approval</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Remaining</CardTitle>
          <Clock className="w-4 h-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-teal-600">{remainingDays} days</div>
          <p className="text-xs text-slate-500">Available to book</p>
        </CardContent>
      </Card>
    </div>
  );
}
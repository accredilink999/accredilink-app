import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle, TrendingDown } from 'lucide-react';

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

  const totalDays = allowance?.total_allowance_days || user?.holiday_allowance_days || 0;
  const totalHours = allowance?.total_allowance_hours || (totalDays * 7.5);
  const carriedOver = allowance?.carried_over_days || 0;
  const usedDays = allowance?.used_days || user?.holiday_used_days || 0;
  const usedHours = usedDays * 7.5;
  const pendingDays = allowance?.pending_days || 0;
  const remainingDays = totalDays + carriedOver - usedDays - pendingDays;
  const remainingHours = remainingDays * 7.5;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Allowance</CardTitle>
            <Calendar className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalDays}</div>
            <p className="text-xs text-slate-500">days</p>
            <div className="text-lg font-semibold text-blue-600 mt-1">{totalHours.toFixed(1)}</div>
            <p className="text-xs text-slate-500">hours</p>
          </CardContent>
        </Card>

        {carriedOver > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Carried Over</CardTitle>
              <TrendingDown className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-700">{carriedOver}</div>
              <p className="text-xs text-slate-500">days</p>
              <div className="text-lg font-semibold text-amber-600 mt-1">{(carriedOver * 7.5).toFixed(1)}</div>
              <p className="text-xs text-slate-500">hours</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Used</CardTitle>
            <CheckCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{usedDays}</div>
            <p className="text-xs text-slate-500">days</p>
            <div className="text-lg font-semibold text-red-600 mt-1">{usedHours.toFixed(1)}</div>
            <p className="text-xs text-slate-500">hours</p>
            {pendingDays > 0 && (
              <p className="text-xs text-amber-600 mt-1">{pendingDays} day{pendingDays !== 1 ? 's' : ''} pending</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-teal-200 bg-teal-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-teal-700">Remaining</CardTitle>
            <Clock className="w-4 h-4 text-teal-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-700">{remainingDays}</div>
            <p className="text-xs text-teal-600">days</p>
            <div className="text-lg font-semibold text-teal-600 mt-1">{remainingHours.toFixed(1)}</div>
            <p className="text-xs text-teal-600">hours available</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {totalDays > 0 && (
        <div className="px-1">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{usedDays} of {totalDays + carriedOver} days used</span>
            <span>{Math.round((usedDays / (totalDays + carriedOver)) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all ${
                usedDays / (totalDays + carriedOver) > 0.9 ? 'bg-red-500' :
                usedDays / (totalDays + carriedOver) > 0.7 ? 'bg-amber-500' : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(100, (usedDays / (totalDays + carriedOver)) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

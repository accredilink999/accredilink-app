import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Loader } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO, differenceInHours } from 'date-fns';

export default function GeneratePayroll() {
  const queryClient = useQueryClient();
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedStaff, setSelectedStaff] = useState([]);

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts-for-payroll', periodStart, periodEnd],
    queryFn: async () => {
      const allShifts = await ShiftApi.list('-date', 5000);
      return allShifts.filter(shift => {
        const shiftDate = parseISO(shift.date);
        const start = parseISO(periodStart);
        const end = parseISO(periodEnd);
        return shiftDate >= start && shiftDate <= end && shift.total_hours_worked;
      });
    },
    enabled: !!periodStart && !!periodEnd,
  });

  const generatePayrollMutation = useMutation({
    mutationFn: async (staffIds) => {
      const records = [];
      
      for (const staffId of staffIds) {
        const staffMember = staff.find(s => s.id === staffId);
        const staffShifts = shifts.filter(s => s.staff_id === staffId);
        
        const regularHours = staffShifts.reduce((sum, shift) => sum + (shift.total_hours_worked || 0), 0);
        const overtimeHours = 0; // Calculate based on threshold
        const hourlyRate = staffMember?.hourly_rate || 0;
        const overtimeRate = hourlyRate * 1.5;
        
        const grossPay = (regularHours * hourlyRate) + (overtimeHours * overtimeRate);
        const tax = grossPay * 0.2; // Simplified
        const ni = grossPay * 0.12; // Simplified
        const netPay = grossPay - tax - ni;

        records.push({
          staff_id: staffId,
          staff_name: staffMember?.full_name,
          period_start: periodStart,
          period_end: periodEnd,
          regular_hours: parseFloat(regularHours.toFixed(2)),
          overtime_hours: overtimeHours,
          hourly_rate: hourlyRate,
          overtime_rate: overtimeRate,
          gross_pay: parseFloat(grossPay.toFixed(2)),
          deductions: {
            tax: parseFloat(tax.toFixed(2)),
            ni: parseFloat(ni.toFixed(2)),
            pension: 0,
            other: 0
          },
          net_pay: parseFloat(netPay.toFixed(2)),
          status: 'draft'
        });
      }

      return Promise.all(records.map(record => base44.entities.PayrollRecord.create(record)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      setSelectedStaff([]);
    },
  });

  const toggleStaff = (staffId) => {
    setSelectedStaff(prev =>
      prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]
    );
  };

  const activeStaff = staff.filter(s => s.employment_status === 'active');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Payroll Period</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Staff ({selectedStaff.length} selected)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {activeStaff.map((member) => {
              const staffShifts = shifts.filter(s => s.staff_id === member.id);
              const totalHours = staffShifts.reduce((sum, shift) => sum + (shift.total_hours_worked || 0), 0);

              return (
                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedStaff.includes(member.id)}
                      onCheckedChange={() => toggleStaff(member.id)}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{member.full_name}</p>
                      <p className="text-sm text-slate-500">{totalHours.toFixed(1)}h worked</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">£{member.hourly_rate || 0}/hour</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => generatePayrollMutation.mutate(selectedStaff)}
        disabled={selectedStaff.length === 0 || generatePayrollMutation.isPending}
        className="w-full bg-teal-600 hover:bg-teal-700"
        size="lg"
      >
        {generatePayrollMutation.isPending ? (
          <Loader className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Calculator className="w-5 h-5 mr-2" />
        )}
        Generate Payroll for {selectedStaff.length} Staff
      </Button>
    </div>
  );
}
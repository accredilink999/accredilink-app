import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calculator, Loader, CheckCircle, Users, PoundSterling, Clock, ChevronDown, ChevronUp, Pencil } from 'lucide-react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { calculatePayslip, TAX_CODES, NI_CATEGORIES } from '@/config/ukPayroll';

// Calculate hours from shift start/end times
function getShiftHours(shift) {
  if (shift.total_hours_worked && shift.total_hours_worked > 0) return shift.total_hours_worked;
  if (shift.start_time && shift.end_time) {
    const [sh, sm] = shift.start_time.split(':').map(Number);
    const [eh, em] = shift.end_time.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60; // overnight
    return mins / 60;
  }
  return 0;
}

export default function GeneratePayroll() {
  const queryClient = useQueryClient();
  const [periodStart, setPeriodStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [periodEnd, setPeriodEnd] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [expandedStaff, setExpandedStaff] = useState({});
  const [generated, setGenerated] = useState(false);

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: settings } = useQuery({
    queryKey: ['payrollSettings'],
    queryFn: async () => {
      const result = await base44.entities.PayrollSettings.list('-created_date', 1);
      return result?.[0];
    }
  });

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['shifts-for-payroll', periodStart, periodEnd],
    queryFn: async () => {
      const allShifts = await ShiftApi.list('-date', 5000);
      return allShifts.filter(shift => {
        const shiftDate = shift.date;
        return shiftDate >= periodStart && shiftDate <= periodEnd && shift.staff_id;
      });
    },
    enabled: !!periodStart && !!periodEnd,
  });

  const activeStaff = useMemo(() =>
    staff.filter(s => s.employment_status === 'active'),
    [staff]
  );

  // Build staff payroll data
  const staffPayrollData = useMemo(() => {
    return activeStaff.map(member => {
      const staffShifts = shifts.filter(s => s.staff_id === member.id);
      const totalHours = staffShifts.reduce((sum, shift) => sum + getShiftHours(shift), 0);
      const ov = overrides[member.id] || {};
      const regularHours = ov.regularHours !== undefined ? parseFloat(ov.regularHours) : parseFloat(totalHours.toFixed(2));
      const overtimeHours = ov.overtimeHours !== undefined ? parseFloat(ov.overtimeHours) : 0;
      const hourlyRate = ov.hourlyRate !== undefined ? parseFloat(ov.hourlyRate) : (member.hourly_rate || 0);
      const overtimeRate = ov.overtimeRate !== undefined ? parseFloat(ov.overtimeRate) : null;
      const taxCode = ov.taxCode || member.tax_code || '1257L';
      const niCategory = ov.niCategory || member.ni_category || 'A';
      const pensionPercent = ov.pensionPercent !== undefined ? parseFloat(ov.pensionPercent) : 0;
      const otherDeductions = ov.otherDeductions !== undefined ? parseFloat(ov.otherDeductions) : 0;
      const otherDeductionsLabel = ov.otherDeductionsLabel || '';

      const result = calculatePayslip({
        regularHours, overtimeHours, hourlyRate, overtimeRate,
        taxCode, niCategory, pensionPercent, otherDeductions
      });

      return {
        ...member,
        staffShifts,
        shiftCount: staffShifts.length,
        calculatedHours: totalHours,
        regularHours, overtimeHours, hourlyRate,
        overtimeRate: result.overtimeRate,
        taxCode, niCategory, pensionPercent,
        otherDeductions, otherDeductionsLabel,
        ...result,
      };
    });
  }, [activeStaff, shifts, overrides]);

  const selectedPayrollData = staffPayrollData.filter(s => selectedStaff.includes(s.id));

  const totals = useMemo(() => {
    return selectedPayrollData.reduce((acc, s) => ({
      grossPay: acc.grossPay + s.grossPay,
      tax: acc.tax + s.tax,
      ni: acc.ni + s.ni,
      netPay: acc.netPay + s.netPay,
      hours: acc.hours + s.regularHours + s.overtimeHours,
    }), { grossPay: 0, tax: 0, ni: 0, netPay: 0, hours: 0 });
  }, [selectedPayrollData]);

  const toggleStaff = (staffId) => {
    setSelectedStaff(prev =>
      prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]
    );
  };

  const selectAll = () => {
    if (selectedStaff.length === activeStaff.length) {
      setSelectedStaff([]);
    } else {
      setSelectedStaff(activeStaff.map(s => s.id));
    }
  };

  const updateOverride = (staffId, field, value) => {
    setOverrides(prev => ({
      ...prev,
      [staffId]: { ...prev[staffId], [field]: value }
    }));
  };

  const toggleExpand = (staffId) => {
    setExpandedStaff(prev => ({ ...prev, [staffId]: !prev[staffId] }));
  };

  const generatePayrollMutation = useMutation({
    mutationFn: async () => {
      const records = selectedPayrollData.map(s => ({
        staff_id: s.id,
        staff_name: s.full_name,
        period_start: periodStart,
        period_end: periodEnd,
        regular_hours: s.regularHours,
        overtime_hours: s.overtimeHours,
        hourly_rate: s.hourlyRate,
        overtime_rate: s.overtimeRate,
        gross_pay: s.grossPay,
        deductions: {
          tax: s.tax,
          ni: s.ni,
          pension: s.pension,
          other: s.otherDeductions,
          other_label: s.otherDeductionsLabel,
        },
        net_pay: s.netPay,
        status: 'draft',
        tax_code: s.taxCode,
        ni_category: s.niCategory,
        pension_percent: s.pensionPercent,
        ni_number: s.ni_number || '',
        employer_paye_ref: settings?.tax_id || '',
        company_name: settings?.company_name || '',
        payment_method: 'bank_transfer',
      }));

      return Promise.all(records.map(record => base44.entities.PayrollRecord.create(record)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      setGenerated(true);
      setSelectedStaff([]);
    },
  });

  if (generated) {
    return (
      <Card className="p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Payroll Generated Successfully</h2>
        <p className="text-slate-600 mb-6">
          {selectedPayrollData.length || 'All'} payslips have been created. View them in the Records tab.
        </p>
        <Button onClick={() => setGenerated(false)} className="bg-teal-600 hover:bg-teal-700">
          Generate Another Period
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PoundSterling className="w-5 h-5 text-teal-600" />
            Generate Payroll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Period End</Label>
              <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
            </div>
          </div>
          {shiftsLoading && (
            <div className="flex items-center gap-2 mt-3 text-sm text-slate-500">
              <Loader className="w-4 h-4 animate-spin" />
              Loading shifts...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Staff ({selectedStaff.length} of {activeStaff.length} selected)
            </CardTitle>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedStaff.length === activeStaff.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {staffPayrollData.map((member) => {
              const isSelected = selectedStaff.includes(member.id);
              const isExpanded = expandedStaff[member.id];

              return (
                <div key={member.id} className={`rounded-lg border transition-colors ${isSelected ? 'border-teal-300 bg-teal-50/50' : 'border-slate-200 bg-slate-50'}`}>
                  {/* Staff Row Header */}
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleStaff(member.id)} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 truncate">{member.full_name}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {member.shiftCount} shifts · {member.calculatedHours.toFixed(1)}h
                          </span>
                          <span>£{member.hourlyRate}/hr</span>
                          <Badge variant="outline" className="text-xs">{member.taxCode}</Badge>
                          <Badge variant="outline" className="text-xs">NI {member.niCategory}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isSelected && (
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-slate-500">Gross: £{member.grossPay.toFixed(2)}</p>
                          <p className="text-xs text-red-600">Tax: -£{member.tax.toFixed(2)} · NI: -£{member.ni.toFixed(2)}</p>
                          <p className="text-sm font-semibold text-green-700">Net: £{member.netPay.toFixed(2)}</p>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => toggleExpand(member.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Mobile summary */}
                  {isSelected && (
                    <div className="sm:hidden px-3 pb-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Gross: £{member.grossPay.toFixed(2)}</span>
                        <span className="text-red-600">Tax: -£{member.tax.toFixed(2)}</span>
                        <span className="text-red-600">NI: -£{member.ni.toFixed(2)}</span>
                        <span className="font-semibold text-green-700">Net: £{member.netPay.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Expanded Edit Section */}
                  {isExpanded && (
                    <div className="px-3 pb-3 border-t border-slate-200 mt-1 pt-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Regular Hours</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={overrides[member.id]?.regularHours ?? member.calculatedHours.toFixed(2)}
                            onChange={(e) => updateOverride(member.id, 'regularHours', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Overtime Hours</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={overrides[member.id]?.overtimeHours ?? 0}
                            onChange={(e) => updateOverride(member.id, 'overtimeHours', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Hourly Rate (£)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={overrides[member.id]?.hourlyRate ?? (member.hourly_rate || 0)}
                            onChange={(e) => updateOverride(member.id, 'hourlyRate', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Overtime Rate (£)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Auto (1.5x)"
                            value={overrides[member.id]?.overtimeRate ?? ''}
                            onChange={(e) => updateOverride(member.id, 'overtimeRate', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tax Code</Label>
                          <Select
                            value={overrides[member.id]?.taxCode || member.tax_code || '1257L'}
                            onValueChange={(v) => updateOverride(member.id, 'taxCode', v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TAX_CODES.map(tc => (
                                <SelectItem key={tc.value} value={tc.value}>
                                  {tc.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">NI Category</Label>
                          <Select
                            value={overrides[member.id]?.niCategory || member.ni_category || 'A'}
                            onValueChange={(v) => updateOverride(member.id, 'niCategory', v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {NI_CATEGORIES.map(nc => (
                                <SelectItem key={nc.value} value={nc.value}>
                                  {nc.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Pension %</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={overrides[member.id]?.pensionPercent ?? 0}
                            onChange={(e) => updateOverride(member.id, 'pensionPercent', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Other Deductions (£)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={overrides[member.id]?.otherDeductions ?? 0}
                            onChange={(e) => updateOverride(member.id, 'otherDeductions', e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      {/* Calculation Preview */}
                      <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-slate-500">Regular Pay</p>
                            <p className="font-medium">£{member.regularPay.toFixed(2)}</p>
                          </div>
                          {member.overtimePay > 0 && (
                            <div>
                              <p className="text-xs text-slate-500">Overtime Pay</p>
                              <p className="font-medium">£{member.overtimePay.toFixed(2)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-slate-500">Gross Pay</p>
                            <p className="font-semibold">£{member.grossPay.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">PAYE Tax ({member.taxCode})</p>
                            <p className="font-medium text-red-600">-£{member.tax.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">NI (Cat {member.niCategory})</p>
                            <p className="font-medium text-red-600">-£{member.ni.toFixed(2)}</p>
                          </div>
                          {member.pension > 0 && (
                            <div>
                              <p className="text-xs text-slate-500">Pension ({member.pensionPercent}%)</p>
                              <p className="font-medium text-red-600">-£{member.pension.toFixed(2)}</p>
                            </div>
                          )}
                          {member.otherDeductions > 0 && (
                            <div>
                              <p className="text-xs text-slate-500">Other</p>
                              <p className="font-medium text-red-600">-£{member.otherDeductions.toFixed(2)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-slate-500">Net Pay</p>
                            <p className="font-bold text-green-700 text-lg">£{member.netPay.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {activeStaff.length === 0 && (
            <p className="text-center text-slate-500 py-6">No active staff found</p>
          )}
        </CardContent>
      </Card>

      {/* Totals Summary */}
      {selectedStaff.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-500">Total Hours</p>
            <p className="text-lg font-bold text-slate-900">{totals.hours.toFixed(1)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-500">Total Gross</p>
            <p className="text-lg font-bold text-slate-900">£{totals.grossPay.toFixed(2)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-500">Total Tax</p>
            <p className="text-lg font-bold text-red-600">-£{totals.tax.toFixed(2)}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs text-slate-500">Total NI</p>
            <p className="text-lg font-bold text-red-600">-£{totals.ni.toFixed(2)}</p>
          </Card>
          <Card className="p-4 text-center col-span-2 sm:col-span-1">
            <p className="text-xs text-slate-500">Total Net</p>
            <p className="text-lg font-bold text-green-700">£{totals.netPay.toFixed(2)}</p>
          </Card>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={() => generatePayrollMutation.mutate()}
        disabled={selectedStaff.length === 0 || generatePayrollMutation.isPending}
        className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-base"
      >
        {generatePayrollMutation.isPending ? (
          <Loader className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Calculator className="w-5 h-5 mr-2" />
        )}
        Generate Payroll for {selectedStaff.length} Staff Members
      </Button>
    </div>
  );
}

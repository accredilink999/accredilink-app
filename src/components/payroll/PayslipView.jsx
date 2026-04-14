import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Download, Loader, X } from 'lucide-react';
import { calculatePayslip, calculateMonthlyTax, calculateMonthlyNI, TAX_CODES, NI_CATEGORIES } from '@/config/ukPayroll';
import PrintablePayslip from './PrintablePayslip';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PayslipView({ record, open, onClose, readOnly = false }) {
  const queryClient = useQueryClient();
  const printRef = useRef(null);
  const [form, setForm] = useState({});
  const [downloading, setDownloading] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['payrollSettings'],
    queryFn: async () => {
      const result = await base44.entities.PayrollSettings.list('-created_date', 1);
      return result?.[0];
    }
  });

  const { data: companySettings = {} } = useQuery({
    queryKey: ['companySettings'],
    queryFn: async () => {
      const rows = await base44.entities.SystemSettings.filter({ setting_key: ['company_name', 'company_logo'] });
      const result = {};
      rows.forEach(s => { result[s.setting_key] = s.setting_value; });
      return result;
    },
  });

  useEffect(() => {
    if (record) {
      const deductions = typeof record.deductions === 'string'
        ? JSON.parse(record.deductions)
        : (record.deductions || {});

      setForm({
        regular_hours: record.regular_hours || 0,
        overtime_hours: record.overtime_hours || 0,
        hourly_rate: record.hourly_rate || 0,
        overtime_rate: record.overtime_rate || 0,
        tax_code: record.tax_code || '1257L',
        ni_category: record.ni_category || 'A',
        pension_percent: record.pension_percent || 0,
        other_deductions: deductions.other || 0,
        other_label: deductions.other_label || '',
        payment_method: record.payment_method || 'bank_transfer',
        ni_number: record.ni_number || '',
        period_start: record.period_start || '',
        period_end: record.period_end || '',
        payment_date: record.payment_date || '',
        // Holiday fields
        holiday_days: record.holiday_days || 0,
        holiday_hours: record.holiday_hours || 0,
        holiday_pay: record.holiday_pay || 0,
      });
    }
  }, [record]);

  // Calculate live preview — include holiday pay in gross
  const basePay = calculatePayslip({
    regularHours: parseFloat(form.regular_hours) || 0,
    overtimeHours: parseFloat(form.overtime_hours) || 0,
    hourlyRate: parseFloat(form.hourly_rate) || 0,
    overtimeRate: parseFloat(form.overtime_rate) || null,
    taxCode: form.tax_code || '1257L',
    niCategory: form.ni_category || 'A',
    pensionPercent: parseFloat(form.pension_percent) || 0,
    otherDeductions: parseFloat(form.other_deductions) || 0,
  });

  // Add holiday pay to gross, then recalculate tax/NI on full amount
  const holidayPay = parseFloat(form.holiday_pay) || 0;
  const grossPay = Math.round((basePay.grossPay + holidayPay) * 100) / 100;
  const { tax } = calculateMonthlyTax(grossPay, form.tax_code || '1257L');
  const { ni } = calculateMonthlyNI(grossPay, form.ni_category || 'A');
  const pensionAmt = Math.round(grossPay * ((parseFloat(form.pension_percent) || 0) / 100) * 100) / 100;
  const otherDed = parseFloat(form.other_deductions) || 0;
  const totalDeductions = Math.round((tax + ni + pensionAmt + otherDed) * 100) / 100;
  const netPay = Math.round((grossPay - totalDeductions) * 100) / 100;

  const slipSettings = { ...settings, company_logo: companySettings?.company_logo, company_name: companySettings?.company_name || settings?.company_name };

  const previewRecord = {
    ...record,
    regular_hours: parseFloat(form.regular_hours) || 0,
    overtime_hours: parseFloat(form.overtime_hours) || 0,
    hourly_rate: parseFloat(form.hourly_rate) || 0,
    overtime_rate: basePay.overtimeRate,
    gross_pay: grossPay,
    net_pay: netPay,
    tax_code: form.tax_code,
    ni_category: form.ni_category,
    pension_percent: parseFloat(form.pension_percent) || 0,
    ni_number: form.ni_number,
    payment_method: form.payment_method,
    period_start: form.period_start || record?.period_start,
    period_end: form.period_end || record?.period_end,
    payment_date: form.payment_date || record?.payment_date,
    holiday_days: parseFloat(form.holiday_days) || 0,
    holiday_hours: parseFloat(form.holiday_hours) || 0,
    holiday_pay: holidayPay,
    deductions: {
      tax,
      ni,
      pension: pensionAmt,
      other: otherDed,
      other_label: form.other_label,
    },
  };

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.PayrollRecord.update(record.id, {
      regular_hours: previewRecord.regular_hours,
      overtime_hours: previewRecord.overtime_hours,
      hourly_rate: previewRecord.hourly_rate,
      overtime_rate: previewRecord.overtime_rate,
      gross_pay: previewRecord.gross_pay,
      net_pay: previewRecord.net_pay,
      tax_code: previewRecord.tax_code,
      ni_category: previewRecord.ni_category,
      pension_percent: previewRecord.pension_percent,
      ni_number: previewRecord.ni_number,
      payment_method: previewRecord.payment_method,
      period_start: previewRecord.period_start,
      period_end: previewRecord.period_end,
      payment_date: previewRecord.payment_date,
      holiday_days: previewRecord.holiday_days,
      holiday_hours: previewRecord.holiday_hours,
      holiday_pay: previewRecord.holiday_pay,
      deductions: previewRecord.deductions,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-records'] });
      onClose();
    },
  });

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const staffName = (record?.staff_name || 'payslip').replace(/\s+/g, '_');
      const period = record?.period_start || 'period';
      pdf.save(`Payslip_${staffName}_${period}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[850px] max-h-[95vh] overflow-y-auto p-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Payslip — {record.staff_name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={record.status === 'paid' ? 'bg-green-100 text-green-800' : record.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}>
                {record.status}
              </Badge>
              <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
                {downloading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Admin edit fields */}
        {!readOnly && (
          <div className="space-y-4 border-b pb-4">
            <p className="text-sm text-slate-500">Edit values below — payslip recalculates automatically.</p>

            {/* Period dates */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Period Start</Label>
                <Input type="date" value={form.period_start || ''}
                  onChange={(e) => setForm({ ...form, period_start: e.target.value })}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Period End</Label>
                <Input type="date" value={form.period_end || ''}
                  onChange={(e) => setForm({ ...form, period_end: e.target.value })}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payment Date</Label>
                <Input type="date" value={form.payment_date || ''}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                  className="h-8 text-sm" />
              </div>
            </div>

            {/* Pay fields */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Regular Hours</Label>
                <Input type="number" step="0.5" value={form.regular_hours}
                  onChange={(e) => setForm({ ...form, regular_hours: e.target.value })}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Overtime Hours</Label>
                <Input type="number" step="0.5" value={form.overtime_hours}
                  onChange={(e) => setForm({ ...form, overtime_hours: e.target.value })}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Hourly Rate (£)</Label>
                <Input type="number" step="0.01" value={form.hourly_rate}
                  onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Overtime Rate (£)</Label>
                <Input type="number" step="0.01" placeholder="Auto (1.5x)"
                  value={form.overtime_rate || ''}
                  onChange={(e) => setForm({ ...form, overtime_rate: e.target.value })}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Holiday Days</Label>
                <Input type="number" step="1" value={form.holiday_days}
                  onChange={(e) => setForm({ ...form, holiday_days: e.target.value })}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Holiday Hours</Label>
                <Input type="number" step="0.5" value={form.holiday_hours}
                  onChange={(e) => {
                    const hrs = parseFloat(e.target.value) || 0;
                    const rate = parseFloat(form.hourly_rate) || 0;
                    setForm({ ...form, holiday_hours: e.target.value, holiday_pay: (hrs * rate).toFixed(2) });
                  }}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Holiday Pay (£)</Label>
                <Input type="number" step="0.01" value={form.holiday_pay}
                  onChange={(e) => setForm({ ...form, holiday_pay: e.target.value })}
                  className="h-8 text-sm bg-blue-50" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tax Code</Label>
                <Select value={form.tax_code} onValueChange={(v) => setForm({ ...form, tax_code: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TAX_CODES.map(tc => (
                      <SelectItem key={tc.value} value={tc.value}>{tc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">NI Category</Label>
                <Select value={form.ni_category} onValueChange={(v) => setForm({ ...form, ni_category: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {NI_CATEGORIES.map(nc => (
                      <SelectItem key={nc.value} value={nc.value}>{nc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pension %</Label>
                <Input type="number" step="0.1" value={form.pension_percent}
                  onChange={(e) => setForm({ ...form, pension_percent: e.target.value })}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Other Deductions (£)</Label>
                <Input type="number" step="0.01" value={form.other_deductions}
                  onChange={(e) => setForm({ ...form, other_deductions: e.target.value })}
                  className="h-8 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">NI Number</Label>
                <Input value={form.ni_number}
                  onChange={(e) => setForm({ ...form, ni_number: e.target.value })}
                  className="h-8 text-sm" placeholder="AB 12 34 56 C" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Payment Method</Label>
                <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live Calculation Summary */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 p-3 bg-slate-50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-slate-500">Basic</p>
                <p className="font-bold text-slate-900">£{basePay.grossPay.toFixed(2)}</p>
              </div>
              {holidayPay > 0 && (
                <div className="text-center">
                  <p className="text-xs text-slate-500">Holiday</p>
                  <p className="font-bold text-blue-700">+£{holidayPay.toFixed(2)}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-slate-500">Gross</p>
                <p className="font-bold text-slate-900">£{grossPay.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Tax</p>
                <p className="font-bold text-red-600">-£{tax.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">NI</p>
                <p className="font-bold text-red-600">-£{ni.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Net Pay</p>
                <p className="font-bold text-green-700 text-lg">£{netPay.toFixed(2)}</p>
              </div>
            </div>

            {/* Save button for edit mode */}
            <div className="flex justify-end">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
                {saveMutation.isPending ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}

        {/* Full-size Payslip Preview */}
        <div className="overflow-x-auto bg-white">
          <PrintablePayslip record={readOnly ? record : previewRecord} settings={slipSettings} />
        </div>

      </DialogContent>

      {/* Hidden Payslip for PDF generation — outside dialog scroll container */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, overflow: 'visible', zIndex: -1 }}>
        <PrintablePayslip ref={printRef} record={readOnly ? record : previewRecord} settings={slipSettings} />
      </div>
    </Dialog>
  );
}

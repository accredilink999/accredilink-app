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
import { calculatePayslip, TAX_CODES, NI_CATEGORIES } from '@/config/ukPayroll';
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
      });
    }
  }, [record]);

  // Calculate live preview
  const calculated = calculatePayslip({
    regularHours: parseFloat(form.regular_hours) || 0,
    overtimeHours: parseFloat(form.overtime_hours) || 0,
    hourlyRate: parseFloat(form.hourly_rate) || 0,
    overtimeRate: parseFloat(form.overtime_rate) || null,
    taxCode: form.tax_code || '1257L',
    niCategory: form.ni_category || 'A',
    pensionPercent: parseFloat(form.pension_percent) || 0,
    otherDeductions: parseFloat(form.other_deductions) || 0,
  });

  const previewRecord = {
    ...record,
    regular_hours: parseFloat(form.regular_hours) || 0,
    overtime_hours: parseFloat(form.overtime_hours) || 0,
    hourly_rate: parseFloat(form.hourly_rate) || 0,
    overtime_rate: calculated.overtimeRate,
    gross_pay: calculated.grossPay,
    net_pay: calculated.netPay,
    tax_code: form.tax_code,
    ni_category: form.ni_category,
    pension_percent: parseFloat(form.pension_percent) || 0,
    ni_number: form.ni_number,
    payment_method: form.payment_method,
    deductions: {
      tax: calculated.tax,
      ni: calculated.ni,
      pension: calculated.pension,
      other: parseFloat(form.other_deductions) || 0,
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
      net_pay: previewRecord.netPay,
      tax_code: previewRecord.tax_code,
      ni_category: previewRecord.ni_category,
      pension_percent: previewRecord.pension_percent,
      ni_number: previewRecord.ni_number,
      payment_method: previewRecord.payment_method,
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
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg">
              Payslip — {record.staff_name}
            </DialogTitle>
            <Badge className={record.status === 'paid' ? 'bg-green-100 text-green-800' : record.status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'}>
              {record.status}
            </Badge>
          </div>
        </DialogHeader>

        {!readOnly && (
          <div className="space-y-4 border-b pb-4">
            <p className="text-sm text-slate-500">Edit values below — payslip recalculates automatically.</p>

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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-50 rounded-lg">
              <div className="text-center">
                <p className="text-xs text-slate-500">Gross</p>
                <p className="font-bold text-slate-900">£{calculated.grossPay.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Tax</p>
                <p className="font-bold text-red-600">-£{calculated.tax.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">NI</p>
                <p className="font-bold text-red-600">-£{calculated.ni.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Pension</p>
                <p className="font-bold text-red-600">-£{calculated.pension.toFixed(2)}</p>
              </div>
              <div className="text-center col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-500">Net Pay</p>
                <p className="font-bold text-green-700 text-lg">£{calculated.netPay.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Printable Payslip Preview (hidden for PDF) */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <PrintablePayslip ref={printRef} record={previewRecord} settings={settings} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
            {downloading ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download PDF
          </Button>
          {!readOnly && (
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-teal-600 hover:bg-teal-700">
              {saveMutation.isPending ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

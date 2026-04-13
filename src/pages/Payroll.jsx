import React, { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from '@/components/ui/PageHeader';
import PayrollDashboard from '@/components/payroll/PayrollDashboard';
import PayrollRecords from '@/components/payroll/PayrollRecords';
import GeneratePayroll from '@/components/payroll/GeneratePayroll';
import MigratedPayslips from '@/components/payroll/MigratedPayslips';
import PayPeriodManager from '@/components/approvals/PayPeriodManager';
import PayrollSettingsManager from '@/components/payroll/PayrollSettingsManager';
import PrintablePayslip from '@/components/payroll/PrintablePayslip';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { DollarSign, FileText, Download, Eye, Loader } from 'lucide-react';

function StaffPayslips({ user }) {
  const [viewRecord, setViewRecord] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const printRef = useRef(null);

  const { data: payrollRecords = [] } = useQuery({
    queryKey: ['my-payslips', user?.id],
    queryFn: async () => {
      const records = await base44.entities.PayrollRecord.filter({ staff_id: user?.id }, '-created_date', 500);
      return records.filter(r => r.status === 'approved' || r.status === 'paid');
    },
    enabled: !!user?.id,
  });

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

  const handleDownloadPDF = async (record) => {
    setViewRecord(record);
    setDownloading(record.id);
    await new Promise(r => setTimeout(r, 300));
    try {
      const el = printRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const staffName = (record.staff_name || 'payslip').replace(/\s+/g, '_');
      const period = record.period_start || 'period';
      pdf.save(`Payslip_${staffName}_${period}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  // Group by month
  const grouped = {};
  payrollRecords.forEach(r => {
    const d = new Date(r.period_end);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!grouped[key]) grouped[key] = { label, records: [] };
    grouped[key].records.push(r);
  });

  const months = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));

  const slipSettings = { ...settings, company_logo: companySettings?.company_logo, company_name: companySettings?.company_name || settings?.company_name };

  return (
    <div className="space-y-6">
      {months.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No payslips available yet</p>
        </Card>
      )}

      {months.map(([key, { label, records }]) => (
        <div key={key}>
          <h3 className="font-semibold text-slate-900 mb-2">{label}</h3>
          <div className="space-y-2">
            {records.map(record => {
              const deductions = typeof record.deductions === 'string'
                ? JSON.parse(record.deductions) : (record.deductions || {});

              return (
                <Card key={record.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {new Date(record.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – {new Date(record.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <div className="flex gap-2 sm:gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span>{record.regular_hours || 0}h worked</span>
                          <span>Gross: £{(record.gross_pay || 0).toFixed(2)}</span>
                          <span>Tax: £{(deductions.tax || 0).toFixed(2)}</span>
                          <span>NI: £{(deductions.ni || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500">Net Pay</p>
                        <p className="text-lg font-bold text-green-700">£{(record.net_pay || 0).toFixed(2)}</p>
                      </div>
                      <Badge className={record.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                        {record.status}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => setViewRecord(record)} className="min-h-[36px] touch-manipulation">
                        <Eye className="w-4 h-4 mr-1" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDownloadPDF(record)}
                        disabled={downloading === record.id} className="min-h-[36px] touch-manipulation">
                        {downloading === record.id
                          ? <Loader className="w-4 h-4 animate-spin" />
                          : <Download className="w-4 h-4 mr-1" />
                        }
                        <span className="hidden sm:inline">{downloading === record.id ? '...' : 'PDF'}</span>
                      </Button>
                    </div>
                  </div>
                  {/* Mobile net pay */}
                  <div className="sm:hidden flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Net Pay</span>
                    <span className="text-base font-bold text-green-700">£{(record.net_pay || 0).toFixed(2)}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* View Payslip Dialog — shows PDF-style preview */}
      {viewRecord && (
        <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg">
                  Payslip — {new Date(viewRecord.period_start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </DialogTitle>
                <Button variant="outline" onClick={() => handleDownloadPDF(viewRecord)} disabled={downloading === viewRecord.id}>
                  {downloading === viewRecord.id
                    ? <Loader className="w-4 h-4 mr-2 animate-spin" />
                    : <Download className="w-4 h-4 mr-2" />
                  }
                  Download PDF
                </Button>
              </div>
            </DialogHeader>
            <div className="border rounded-lg overflow-hidden bg-white">
              <div style={{ transform: 'scale(0.55)', transformOrigin: 'top left', width: '182%', overflow: 'auto' }}>
                <PrintablePayslip record={viewRecord} settings={slipSettings} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hidden printable for PDF generation */}
      {viewRecord && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
          <PrintablePayslip ref={printRef} record={viewRecord} settings={slipSettings} />
        </div>
      )}
    </div>
  );
}

export default function Payroll() {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: payPeriod } = useQuery({
    queryKey: ['payPeriod'],
    queryFn: () => base44.entities.PayPeriod?.list('-created_date', 1).then(data => data?.[0]),
  });

  const isSuperAdmin = user?.role === 'super_admin';
  const [activeTab, setActiveTab] = useState('dashboard');

  // Non-admin staff see their own payslips + migrated
  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Payslips"
          subtitle="View and download your payslips"
          icon={DollarSign}
        />
        <Tabs defaultValue="payslips">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
            <TabsTrigger value="migrated">Older Payslips</TabsTrigger>
          </TabsList>
          <TabsContent value="payslips" className="mt-4">
            <StaffPayslips user={user} />
          </TabsContent>
          <TabsContent value="migrated" className="mt-4">
            <MigratedPayslips user={user} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Management"
        subtitle="Generate payslips with UK PAYE tax and NI calculations"
        icon={DollarSign}
      />

      <PayPeriodManager
        payPeriod={payPeriod}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: ['payPeriod'] })}
      />

      <PayrollSettingsManager />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-lg grid-cols-4">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="records">Records</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="migrated">Migrated</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <PayrollDashboard />
        </TabsContent>

        <TabsContent value="records" className="mt-6">
          <PayrollRecords />
        </TabsContent>

        <TabsContent value="generate" className="mt-6">
          <GeneratePayroll />
        </TabsContent>

        <TabsContent value="migrated" className="mt-6">
          <MigratedPayslips user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

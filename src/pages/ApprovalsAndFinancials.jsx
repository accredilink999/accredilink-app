import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CheckCircle2, Clock, XCircle, DollarSign, Plus, Calendar, Car, PoundSterling, TrendingUp, FileText, Download, Eye, Loader } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LeaveCalendarPopup from '@/components/leave/LeaveCalendarPopup';
import MigratedPayslips from '@/components/payroll/MigratedPayslips';
import PrintablePayslip from '@/components/payroll/PrintablePayslip';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatDistanceToNow, format, parseISO, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';

export default function ApprovalsAndFinancials() {
  const [leaveTab, setLeaveTab] = useState('my');
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', notes: '' });
  const [leaveForm, setLeaveForm] = useState({ type: '', start_date: '', end_date: '', reason: '' });
  const [viewRecord, setViewRecord] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const printRef = React.useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  const { data: payPeriod } = useQuery({
    queryKey: ['payPeriod'],
    queryFn: () => base44.entities.PayPeriod?.list('-created_date', 1).then(data => data?.[0]),
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['allLeaveRequests'],
    queryFn: () => base44.entities.LeaveRequest.list('-created_date', 100),
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['shifts', user?.id, payPeriod?.id],
    queryFn: () => ShiftApi.filter({ staff_id: user?.id }, '-created_date', 1000),
    enabled: !!user?.id && !!payPeriod,
  });

  const { data: sickRecords = [] } = useQuery({
    queryKey: ['sickRecords', user?.id, payPeriod?.id],
    queryFn: () => base44.entities.SicknessRecord.filter({ staff_id: user?.id }, '-created_date', 100),
    enabled: !!user?.id && !!payPeriod,
  });

  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    return (endH * 60 + endM - (startH * 60 + startM)) / 60;
  };

  const hoursWorked = shifts
    .filter(shift => {
      if (!payPeriod?.period_start || !payPeriod?.period_end || !shift.date) return false;
      const shiftDate = parseISO(shift.date);
      return isWithinInterval(shiftDate, { 
        start: parseISO(payPeriod.period_start), 
        end: parseISO(payPeriod.period_end) 
      });
    })
    .reduce((sum, shift) => sum + calculateHours(shift.start_time, shift.end_time), 0);

  const leaveHours = leaveRequests
    .filter(r => r.staff_id === user?.id && r.status === 'approved' && payPeriod?.period_start && payPeriod?.period_end)
    .filter(r => {
      const start = parseISO(r.start_date);
      const end = parseISO(r.end_date);
      const periodStart = parseISO(payPeriod.period_start);
      const periodEnd = parseISO(payPeriod.period_end);
      return isWithinInterval(start, { start: periodStart, end: periodEnd }) || 
             isWithinInterval(end, { start: periodStart, end: periodEnd }) ||
             (start <= periodStart && end >= periodEnd);
    })
    .reduce((sum, r) => {
      const start = parseISO(r.start_date);
      const end = parseISO(r.end_date);
      const periodStart = parseISO(payPeriod.period_start);
      const periodEnd = parseISO(payPeriod.period_end);
      const actualStart = start < periodStart ? periodStart : start;
      const actualEnd = end > periodEnd ? periodEnd : end;
      const days = Math.ceil((actualEnd - actualStart) / (1000 * 60 * 60 * 24)) + 1;
      return sum + (days * 8);
    }, 0);

  const sickHours = sickRecords
    .filter(r => {
      if (!payPeriod?.period_start || !payPeriod?.period_end || !r.start_date) return false;
      const startDate = parseISO(r.start_date);
      return isWithinInterval(startDate, { 
        start: parseISO(payPeriod.period_start), 
        end: parseISO(payPeriod.period_end) 
      });
    })
    .reduce((sum, r) => sum + ((r.days_absent || 0) * 8), 0);

  const { data: expenseRecords = [] } = useQuery({
    queryKey: ['myExpenses', user?.id],
    queryFn: () => base44.entities.Expense.filter({ staff_id: user?.id }, '-created_date', 50),
    enabled: !!user?.id,
  });

  // Mileage rate from SystemSettings
  const { data: rateSettings = [] } = useQuery({
    queryKey: ['mileageRateSetting'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'mileage_rate_ppm' }),
  });
  const mileageRatePpm = rateSettings[0]?.setting_value ? parseInt(rateSettings[0].setting_value, 10) : 45;
  const mileageRate = mileageRatePpm / 100;

  // Current week mileage accrual
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const currentWeekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const currentWeekMileage = expenseRecords
    .filter(e => {
      if (e.expense_type !== 'mileage') return false;
      const d = new Date(e.date || e.expense_date || e.created_date);
      return d >= currentWeekStart && d <= currentWeekEnd;
    });
  const currentWeekMiles = currentWeekMileage.reduce((sum, e) => sum + parseFloat(e.mileage_distance || e.mileage || 0), 0);
  const currentWeekAmount = currentWeekMileage.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  // All current week expenses (not just mileage)
  const currentWeekExpenses = expenseRecords.filter(e => {
    const d = new Date(e.date || e.expense_date || e.created_date);
    return d >= currentWeekStart && d <= currentWeekEnd;
  });
  const currentWeekTotal = currentWeekExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  const { data: payrollRecords = [] } = useQuery({
    queryKey: ['myPayroll', user?.id],
    queryFn: async () => {
      const records = await base44.entities.PayrollRecord.filter({ staff_id: user?.id }, '-created_date', 500);
      return records.filter(r => r.status === 'approved' || r.status === 'paid');
    },
    enabled: !!user?.id,
  });

  const { data: payrollSettings } = useQuery({
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

  const slipSettings = { ...payrollSettings, company_logo: companySettings?.company_logo, company_name: companySettings?.company_name || payrollSettings?.company_name };

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
      const staffName = (record.staff_name || 'payslip').replace(/\s+/g, '_');
      const period = record.period_start || 'period';
      pdf.save(`Payslip_${staffName}_${period}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staffMembers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  const { data: leaveBalances = [] } = useQuery({
    queryKey: ['myLeaveBalance', user?.id],
    queryFn: () => base44.entities.HolidayAllowance.filter({ staff_id: user?.id }, '-created_date', 10),
    enabled: !!user?.id,
  });

  const currentYear = new Date().getFullYear();
  const currentYearBalance = leaveBalances.find(b => b.year === currentYear);
  const remainingDays = currentYearBalance 
    ? (currentYearBalance.total_allowance_days + currentYearBalance.carried_over_days) - (currentYearBalance.used_days || 0) - (currentYearBalance.pending_days || 0)
    : 0;
  const remainingHours = remainingDays * 7.5;

  const myLeaveRequests = leaveRequests.filter(r => r.staff_id === user?.id);
  const pendingLeave = leaveRequests.filter(r => r.status === 'pending');
  const approvedLeave = myLeaveRequests.filter(r => r.status === 'approved');
  const rejectedLeave = myLeaveRequests.filter(r => r.status === 'rejected');
  
  const displayedLeaveRequests = leaveTab === 'my' ? myLeaveRequests :
                                 leaveTab === 'pending' && isAdmin ? pendingLeave : 
                                 leaveTab === 'all' && isAdmin ? leaveRequests : myLeaveRequests;

  const pendingExpenses = expenseRecords.filter(e => e.status === 'pending');
  const approvedExpenses = expenseRecords.filter(e => e.status === 'approved');

  const totalApprovedExpenses = approvedExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

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

  const submitExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myExpenses', user?.id] });
      setExpenseForm({ description: '', amount: '', notes: '' });
      setShowExpenseForm(false);
    },
  });

  const handleSubmitExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    submitExpenseMutation.mutate({
      staff_id: user?.id,
      staff_name: user?.staff_full_name || user?.full_name,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      notes: expenseForm.notes,
      status: 'pending'
    });
  };

  const submitLeaveMutation = useMutation({
    mutationFn: (data) => base44.entities.LeaveRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allLeaveRequests'] });
      setLeaveForm({ type: '', start_date: '', end_date: '', reason: '' });
      setShowLeaveForm(false);
    },
  });

  const handleSubmitLeave = (e) => {
    e.preventDefault();
    if (!leaveForm.type || !leaveForm.start_date || !leaveForm.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }
    submitLeaveMutation.mutate({
      staff_id: user?.id,
      staff_name: user?.staff_full_name || user?.full_name,
      type: leaveForm.type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      reason: leaveForm.reason,
      status: 'pending'
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Approvals & Financials"
        subtitle="Track your leave requests, expenses, and payroll information"
      />

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="bg-gradient-to-r from-purple-100 to-pink-100 p-2 w-full flex flex-wrap justify-start sm:flex-nowrap gap-1">
          <TabsTrigger value="leave" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm sm:text-base whitespace-nowrap px-3 py-2">Leave Requests</TabsTrigger>
          <TabsTrigger value="expenses" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm sm:text-base whitespace-nowrap px-3 py-2">Expenses</TabsTrigger>
          <TabsTrigger value="payroll" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm sm:text-base whitespace-nowrap px-3 py-2">Payroll</TabsTrigger>
        </TabsList>

        {/* Leave Requests Tab */}
         <TabsContent value="leave" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 md:items-center flex-wrap">
            {!showLeaveForm && (
              <Button 
                onClick={() => setShowLeaveForm(true)}
                className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Request Leave
              </Button>
            )}
            {isAdmin && pendingLeave.length > 0 && (
              <Button
                onClick={() => setLeaveTab('pending')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white w-full md:w-auto relative"
              >
                Pending Approval ({pendingLeave.length})
              </Button>
            )}
            <Button
              onClick={() => setCalendarOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white w-full md:w-auto"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View Team Leave Already Booked
            </Button>
          </div>

          {showLeaveForm && (
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <form onSubmit={handleSubmitLeave} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Leave Type *</label>
                  <Select value={leaveForm.type} onValueChange={(value) => setLeaveForm({ ...leaveForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual_leave">Annual Leave</SelectItem>
                      <SelectItem value="sick_leave">Sick Leave</SelectItem>
                      <SelectItem value="unpaid_leave">Unpaid Leave</SelectItem>
                      <SelectItem value="maternity">Maternity</SelectItem>
                      <SelectItem value="paternity">Paternity</SelectItem>
                      <SelectItem value="compassionate">Compassionate</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">Start Date *</label>
                    <Input
                      type="date"
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-1">End Date *</label>
                    <Input
                      type="date"
                      value={leaveForm.end_date}
                      onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Reason</label>
                  <Textarea
                    placeholder="Add reason for your leave request"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="h-20"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={submitLeaveMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {submitLeaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowLeaveForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Tabs value={leaveTab} onValueChange={setLeaveTab}>
             <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200 w-full flex flex-wrap justify-start sm:flex-nowrap gap-1 p-2">
               <TabsTrigger value="my" className="whitespace-nowrap text-sm sm:text-base px-3 py-2">My Requests</TabsTrigger>
               <TabsTrigger value="balance" className="whitespace-nowrap text-sm sm:text-base px-3 py-2">Leave Balance</TabsTrigger>
               {isAdmin && (
                 <TabsTrigger value="all" className="whitespace-nowrap text-sm sm:text-base px-3 py-2">All Requests</TabsTrigger>
               )}
             </TabsList>

             {/* Leave Balance Tab */}
             <TabsContent value="balance" className="space-y-4">
               {currentYearBalance ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
                     <CardContent className="pt-6">
                       <div>
                         <p className="text-sm text-slate-600 mb-3 font-medium">Total Allowance ({currentYear})</p>
                         <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">Days:</span>
                             <span className="text-2xl font-bold text-teal-600">{currentYearBalance.total_allowance_days}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">Hours:</span>
                             <span className="text-2xl font-bold text-teal-600">{(currentYearBalance.total_allowance_days * 7.5).toFixed(1)}</span>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                     <CardContent className="pt-6">
                       <div>
                         <p className="text-sm text-slate-600 mb-3 font-medium">Carried Over</p>
                         <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">Days:</span>
                             <span className="text-2xl font-bold text-amber-600">{currentYearBalance.carried_over_days || 0}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">Hours:</span>
                             <span className="text-2xl font-bold text-amber-600">{((currentYearBalance.carried_over_days || 0) * 7.5).toFixed(1)}</span>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                     <CardContent className="pt-6">
                       <div>
                         <p className="text-sm text-slate-600 mb-3 font-medium">Leave Used</p>
                         <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">Days:</span>
                             <span className="text-2xl font-bold text-red-600">{currentYearBalance.used_days || 0}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">Hours:</span>
                             <span className="text-2xl font-bold text-red-600">{((currentYearBalance.used_days || 0) * 7.5).toFixed(1)}</span>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>

                   <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                     <CardContent className="pt-6">
                       <div>
                         <p className="text-sm text-slate-600 mb-3 font-medium">Remaining Balance</p>
                         <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">Days:</span>
                             <span className="text-2xl font-bold text-green-600">{remainingDays.toFixed(1)}</span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-slate-600">Hours:</span>
                             <span className="text-2xl font-bold text-green-600">{remainingHours.toFixed(1)}</span>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </div>
               ) : (
                 <Card className="p-8 text-center bg-slate-50">
                   <p className="text-slate-500">No leave balance set up yet. Contact your administrator to set up your leave entitlement.</p>
                 </Card>
               )}
             </TabsContent>

             <TabsContent value={leaveTab} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-1">Hours Worked</p>
                      <p className="text-3xl font-bold text-blue-600">{hoursWorked.toFixed(1)}h</p>
                      <p className="text-xs text-slate-500 mt-2">This pay period</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-1">Leave Hours</p>
                      <p className="text-3xl font-bold text-purple-600">{leaveHours.toFixed(1)}h</p>
                      <p className="text-xs text-slate-500 mt-2">This pay period</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-1">Sick Hours</p>
                      <p className="text-3xl font-bold text-red-600">{sickHours.toFixed(1)}h</p>
                      <p className="text-xs text-slate-500 mt-2">This pay period</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-1">Remaining Leave</p>
                      <p className="text-3xl font-bold text-teal-600">{remainingDays.toFixed(1)}</p>
                      <p className="text-xs text-slate-500 mt-2">{remainingHours.toFixed(1)}h ({currentYear})</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-1">My Pending</p>
                      <p className="text-3xl font-bold text-amber-600">{myLeaveRequests.filter(r => r.status === 'pending').length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-1">My Approved</p>
                      <p className="text-3xl font-bold text-green-600">{approvedLeave.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-slate-600 mb-1">My Rejected</p>
                      <p className="text-3xl font-bold text-red-600">{rejectedLeave.length}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                {displayedLeaveRequests.length === 0 ? (
                  <Card className="p-8 text-center bg-slate-50">
                    <p className="text-slate-500">No leave requests</p>
                  </Card>
                ) : (
                  displayedLeaveRequests.map(request => {
                                    const staffUser = staffMembers.find(s => s.id === request.staff_id);
                                    const displayName = staffUser?.staff_full_name || staffUser?.full_name || request.staff_name;
                                    return (
                                    <Card key={request.id} className={`p-4 border-l-4 ${request.status === 'approved' ? 'border-l-green-500 bg-green-50' : request.status === 'rejected' ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50'}`}>
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-slate-900 capitalize">{request.type.replace(/_/g, ' ')}</h3>
                                            <Badge className={statusColors[request.status]}>
                                              <span className="flex items-center gap-1">
                                                {statusIcons[request.status]}
                                                {request.status}
                                              </span>
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-slate-600 mb-2">{displayName}</p>
                                          <p className="text-sm text-slate-600 mb-2">{request.reason || 'No reason provided'}</p>
                                          <p className="text-xs text-slate-500">{request.start_date} to {request.end_date}</p>
                                          </div>
                                          </div>
                                          </Card>
                                          );
                                          })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="space-y-4">
          {/* Current week mileage accrual */}
          <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-teal-800">This Week's Mileage</h3>
                <span className="text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                  {format(currentWeekStart, 'dd MMM')} – {format(currentWeekEnd, 'dd MMM')}
                </span>
              </div>
              {currentWeekMiles > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-white/60 rounded-lg">
                    <Car className="w-4 h-4 text-teal-600 mx-auto" />
                    <p className="text-xl font-bold text-slate-900">{currentWeekMiles.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">Miles</p>
                  </div>
                  <div className="text-center p-2 bg-white/60 rounded-lg">
                    <PoundSterling className="w-4 h-4 text-teal-600 mx-auto" />
                    <p className="text-xl font-bold text-slate-900">£{currentWeekAmount.toFixed(2)}</p>
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

          {/* Daily breakdown for current week */}
          <Card className="p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Daily Breakdown</h3>
            {currentWeekExpenses.length === 0 ? (
              <p className="text-sm text-slate-500">No expenses this week yet</p>
            ) : (
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 gap-y-0 text-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase pb-1">Day</span>
                <span className="text-xs font-semibold text-slate-400 uppercase text-right pb-1">Miles</span>
                <span className="text-xs font-semibold text-slate-400 uppercase text-right pb-1">Amount</span>
                <span className="text-xs font-semibold text-slate-400 uppercase text-right pb-1">Running</span>
                {(() => {
                  const today = new Date();
                  let runningAmount = 0;
                  const days = [];
                  for (let i = 0; i < 7; i++) {
                    const day = new Date(currentWeekStart);
                    day.setDate(day.getDate() + i);
                    const dayStr = format(day, 'yyyy-MM-dd');
                    const dayExps = currentWeekExpenses.filter(e => {
                      const ed = new Date(e.date || e.expense_date || e.created_date);
                      return format(ed, 'yyyy-MM-dd') === dayStr;
                    });
                    const dayMiles = dayExps.reduce((s, e) => s + parseFloat(e.mileage_distance || e.mileage || 0), 0);
                    const dayAmount = dayExps.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
                    runningAmount += dayAmount;
                    const isToday = format(today, 'yyyy-MM-dd') === dayStr;
                    const isFuture = day > today;
                    days.push({ day, dayStr, dayMiles, dayAmount, hasData: dayExps.length > 0, runningAmount, isToday, isFuture });
                  }
                  return days.map(d => (
                    <React.Fragment key={d.dayStr}>
                      <span className={`py-1.5 border-b border-slate-50 flex items-center gap-1 ${d.isToday ? 'font-semibold text-teal-700' : d.isFuture ? 'text-slate-300' : d.hasData ? 'text-slate-700' : 'text-slate-400'}`}>
                        {format(d.day, 'EEE dd MMM')}
                        {d.isToday && <Badge className="bg-teal-100 text-teal-700 text-[10px] py-0 px-1">Today</Badge>}
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
                    </React.Fragment>
                  ));
                })()}
                <span className="font-semibold text-slate-900 pt-2 border-t border-slate-200">Week Total</span>
                <span className="font-semibold text-slate-900 pt-2 text-right border-t border-slate-200">{currentWeekMiles.toFixed(1)} mi</span>
                <span className="font-bold text-slate-900 pt-2 text-right border-t border-slate-200">£{currentWeekTotal.toFixed(2)}</span>
                <span className="pt-2 border-t border-slate-200"></span>
              </div>
            )}
          </Card>

          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="pt-5 pb-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">This Week</p>
                  <p className="text-2xl font-bold text-blue-600">£{currentWeekTotal.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardContent className="pt-5 pb-4">
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">Total Approved</p>
                  <p className="text-2xl font-bold text-emerald-600">£{totalApprovedExpenses.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6">
          {payrollRecords.length === 0 && (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No payslips available yet</p>
            </Card>
          )}

          {payrollRecords.length > 0 && (() => {
            const grouped = {};
            payrollRecords.forEach(r => {
              const d = new Date(r.period_end);
              const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
              if (!grouped[key]) grouped[key] = { label, records: [] };
              grouped[key].records.push(r);
            });
            const months = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));

            return months.map(([key, { label, records }]) => (
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
                                {(deductions.tax || 0) < 0 ? (
                                  <span className="text-green-600 font-medium">Rebate: +£{Math.abs(deductions.tax).toFixed(2)}</span>
                                ) : (
                                  <span>Tax: £{(deductions.tax || 0).toFixed(2)}</span>
                                )}
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
                        <div className="sm:hidden flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                          <span className="text-xs text-slate-500">Net Pay</span>
                          <span className="text-base font-bold text-green-700">£{(record.net_pay || 0).toFixed(2)}</span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

          <MigratedPayslips user={user} />

          {/* View Payslip Dialog — full-size scrollable preview */}
          {viewRecord && (
            <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
              <DialogContent className="max-w-[95vw] w-[850px] max-h-[95vh] overflow-y-auto p-4">
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
                <div className="overflow-x-auto bg-white">
                  <PrintablePayslip record={viewRecord} settings={slipSettings} />
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
        </TabsContent>
      </Tabs>

      <LeaveCalendarPopup open={calendarOpen} onClose={() => setCalendarOpen(false)} showInitials={true} />
    </div>
  );
}
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isWithinInterval, parseISO } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from '@/components/ui/PageHeader';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  Briefcase,
  GraduationCap,
  Shield,
  Heart,
  LineChart as LineChartIcon,
  ChevronLeft
} from 'lucide-react';

const COLORS = ['#0d9488', '#7c3aed', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

export default function Reports() {
  const [activeSection, setActiveSection] = useState(null);
  const [dateRange, setDateRange] = useState('30');
  
  const startDate = subDays(new Date(), parseInt(dateRange));
  const endDate = new Date();

  const { data: shifts = [] } = useQuery({
    queryKey: ['allShifts'],
    queryFn: () => ShiftApi.list('-date', 1000),
  });

  const { data: incidents = [] } = useQuery({
    queryKey: ['allIncidents'],
    queryFn: () => base44.entities.Incident.list('-incident_date', 500),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.list(),
  });

  const { data: training = [] } = useQuery({
    queryKey: ['training'],
    queryFn: () => base44.entities.Training.list(),
  });

  const { data: leaveRequests = [] } = useQuery({
    queryKey: ['leaveRequests'],
    queryFn: () => base44.entities.LeaveRequest.list(),
  });

  const { data: payroll = [] } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => base44.entities.PayrollRecord.list(),
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list(),
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list(),
  });

  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['workCalendarEvents'],
    queryFn: () => base44.entities.WorkCalendarEvent.list(),
  });

  const { data: trainingMatrixRecords = [] } = useQuery({
    queryKey: ['trainingMatrixRecords'],
    queryFn: () => base44.entities.TrainingMatrixRecord.list(),
  });

  // Filter data by date range
  const filteredShifts = shifts.filter(s => {
    const date = parseISO(s.date);
    return isWithinInterval(date, { start: startDate, end: endDate });
  });

  const filteredIncidents = incidents.filter(i => {
    const date = parseISO(i.incident_date);
    return isWithinInterval(date, { start: startDate, end: endDate });
  });

  // Shift status breakdown
  const shiftStatusData = [
    { name: 'Completed', value: filteredShifts.filter(s => s.status === 'completed').length, color: '#10b981' },
    { name: 'In Progress', value: filteredShifts.filter(s => s.status === 'in_progress').length, color: '#f59e0b' },
    { name: 'Scheduled', value: filteredShifts.filter(s => s.status === 'scheduled').length, color: '#3b82f6' },
    { name: 'Cancelled', value: filteredShifts.filter(s => s.status === 'cancelled').length, color: '#6b7280' },
    { name: 'No Show', value: filteredShifts.filter(s => s.status === 'no_show').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Daily visits chart
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const dailyVisitsData = days.slice(-14).map(day => {
    const dayShifts = shifts.filter(s => s.date === format(day, 'yyyy-MM-dd'));
    return {
      date: format(day, 'dd MMM'),
      total: dayShifts.length,
      completed: dayShifts.filter(s => s.status === 'completed').length
    };
  });

  // Incident types breakdown
  const incidentTypesData = Object.entries(
    filteredIncidents.reduce((acc, inc) => {
      acc[inc.type] = (acc[inc.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value], idx) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    color: COLORS[idx % COLORS.length]
  }));

  // Staff performance
  const staffPerformance = staff.slice(0, 10).map(s => {
    const staffShifts = filteredShifts.filter(sh => sh.staff_id === s.id);
    const completed = staffShifts.filter(sh => sh.status === 'completed').length;
    return {
      name: s.full_name?.split(' ')[0] || 'Unknown',
      shifts: staffShifts.length,
      completed
    };
  }).filter(s => s.shifts > 0).sort((a, b) => b.completed - a.completed);

  // Training compliance
  const validTraining = training.filter(t => t.status === 'valid').length;
  const expiringTraining = training.filter(t => t.status === 'expiring_soon').length;
  const expiredTraining = training.filter(t => t.status === 'expired').length;

  const trainingComplianceData = [
    { name: 'Valid', value: validTraining, color: '#10b981' },
    { name: 'Expiring Soon', value: expiringTraining, color: '#f59e0b' },
    { name: 'Expired', value: expiredTraining, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const totalShifts = filteredShifts.length;
  const completedShifts = filteredShifts.filter(s => s.status === 'completed').length;
  const completionRate = totalShifts > 0 ? Math.round((completedShifts / totalShifts) * 100) : 0;

  // Leave analytics
  const approvedLeave = leaveRequests.filter(l => l.status === 'approved').length;
  const pendingLeave = leaveRequests.filter(l => l.status === 'pending').length;
  const leaveTypeBreakdown = Object.entries(
    leaveRequests.reduce((acc, l) => {
      acc[l.type] = (acc[l.type] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }));

  // Payroll analytics
  const totalPayroll = payroll.reduce((sum, p) => sum + (p.gross_amount || 0), 0);
  const avgPayroll = payroll.length > 0 ? totalPayroll / payroll.length : 0;
  const payrollByMonth = Object.entries(
    payroll.reduce((acc, p) => {
      const month = format(parseISO(p.payment_date), 'MMM');
      acc[month] = (acc[month] || 0) + (p.gross_amount || 0);
      return acc;
    }, {})
  ).map(([month, amount]) => ({
    month,
    amount: Math.round(amount)
  }));

  // Compliance metrics
  const complianceRate = trainingMatrixRecords.length > 0 
    ? Math.round((trainingMatrixRecords.filter(t => t.status === 'completed').length / trainingMatrixRecords.length) * 100)
    : 0;

  // Client metrics
  const activeClients = serviceUsers.filter(s => s.status === 'active').length;
  const onHoldClients = serviceUsers.filter(s => s.status === 'on_hold').length;
  const dischargedClients = serviceUsers.filter(s => s.status === 'discharged').length;

  // Export to CSV function
  const exportToCSV = (data, filename) => {
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportStaffData = () => {
    const data = staff.map(s => ({
      Name: s.full_name,
      Email: s.email,
      Role: s.job_title || 'Staff',
      ShiftsCompleted: filteredShifts.filter(sh => sh.staff_id === s.id && sh.status === 'completed').length,
      TotalShifts: filteredShifts.filter(sh => sh.staff_id === s.id).length,
    }));
    exportToCSV(data, 'staff-report');
  };

  const exportPayrollData = () => {
    const data = payroll.map(p => ({
      EmployeeID: p.employee_id,
      EmployeeName: p.employee_name,
      PaymentDate: format(parseISO(p.payment_date), 'yyyy-MM-dd'),
      GrossAmount: p.gross_amount,
      NetAmount: p.net_amount,
      Status: p.status,
    }));
    exportToCSV(data, 'payroll-report');
  };

  const exportShiftData = () => {
    const data = filteredShifts.map(s => ({
      Date: s.date,
      Staff: s.staff_name,
      StartTime: s.start_time,
      EndTime: s.end_time,
      Status: s.status,
      ServiceUser: s.service_user_name,
    }));
    exportToCSV(data, 'shifts-report');
  };

  const exportIncidentData = () => {
    const data = filteredIncidents.map(i => ({
      Date: i.incident_date,
      Type: i.type,
      Severity: i.severity,
      ReportedBy: i.reported_by_name,
      Status: i.status,
      Description: i.description,
    }));
    exportToCSV(data, 'incidents-report');
  };

  const exportClientData = () => {
    const data = serviceUsers.map(c => ({
      Name: c.full_name,
      Status: c.status,
      Phone: c.phone,
      Address: c.address,
      Postcode: c.postcode,
      MobilityLevel: c.mobility_level,
    }));
    exportToCSV(data, 'clients-report');
  };

  const exportLeaveData = () => {
    const data = leaveRequests.map(l => ({
      StaffName: l.staff_name,
      Type: l.type,
      StartDate: l.start_date,
      EndDate: l.end_date,
      Status: l.status,
      ReviewedBy: l.reviewed_by_name || 'Pending',
    }));
    exportToCSV(data, 'leave-report');
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Reports & Analytics" 
        subtitle="Comprehensive business intelligence and performance metrics"
        icon={LineChartIcon}
      >
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      {!activeSection && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { value: 'overview', label: 'Overview', icon: BarChart3, bg: 'from-cyan-400 to-cyan-600', desc: 'Key metrics & daily trends' },
            { value: 'staff', label: 'Staff', icon: Users, bg: 'from-purple-400 to-purple-600', desc: 'Performance & attendance' },
            { value: 'clients', label: 'Clients', icon: Heart, bg: 'from-green-400 to-green-600', desc: 'Service user analytics' },
            { value: 'training', label: 'Training', icon: GraduationCap, bg: 'from-orange-400 to-orange-600', desc: 'Compliance & certifications' },
            { value: 'payroll', label: 'Payroll', icon: DollarSign, bg: 'from-pink-400 to-pink-600', desc: 'Wages, costs & expenses' },
            { value: 'compliance', label: 'Compliance', icon: Shield, bg: 'from-rose-400 to-rose-600', desc: 'Regulatory & document status' },
          ].map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.value}
                onClick={() => setActiveSection(section.value)}
                className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                  <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                </div>
                <span className="text-sm font-semibold text-slate-700 text-center leading-tight">
                  {section.label}
                </span>
                <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">
                  {section.desc}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <Tabs value={activeSection || 'overview'} onValueChange={setActiveSection} className={`w-full ${!activeSection ? 'hidden' : ''}`}>
        <TabsList className="hidden">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <button onClick={() => setActiveSection(null)} className="flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to Reports
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalShifts}</p>
                  <p className="text-sm text-slate-500">Visits</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{completionRate}%</p>
                  <p className="text-sm text-slate-500">Completion</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{filteredIncidents.length}</p>
                  <p className="text-sm text-slate-500">Incidents</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{activeClients}</p>
                  <p className="text-sm text-slate-500">Active Clients</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">£{totalPayroll.toLocaleString()}</p>
                  <p className="text-sm text-slate-500">Payroll</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-5 bg-white border-0 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Daily Visits (Last 14 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyVisitsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name="Completed" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 bg-white border-0 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Visit Status Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={shiftStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {shiftStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 bg-white border-0 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Top Staff by Completed Visits</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={staffPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip />
                    <Bar dataKey="completed" fill="#0d9488" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-5 bg-white border-0 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Incidents by Type</h3>
              {incidentTypesData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  No incidents in this period
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incidentTypesData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {incidentTypesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-6 mt-6">
          <button onClick={() => setActiveSection(null)} className="flex items-center gap-1.5 text-sm font-medium text-purple-700 hover:text-purple-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to Reports
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{staff.length}</p>
                  <p className="text-sm text-slate-500">Total Staff</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-50 rounded-xl">
                  <Clock className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{filteredShifts.length}</p>
                  <p className="text-sm text-slate-500">Total Shifts</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="p-3 rounded-xl flex items-center justify-between">
                <Button onClick={exportStaffData} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export Staff
                </Button>
              </div>
            </Card>
          </div>
          <Card className="p-5 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Staff Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="shifts" name="Total Shifts" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#0d9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6 mt-6">
          <button onClick={() => setActiveSection(null)} className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to Reports
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-xl">
                  <Heart className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{activeClients}</p>
                  <p className="text-sm text-slate-500">Active</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{onHoldClients}</p>
                  <p className="text-sm text-slate-500">On Hold</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <Users className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{dischargedClients}</p>
                  <p className="text-sm text-slate-500">Discharged</p>
                </div>
              </div>
            </Card>
            <Button onClick={exportClientData} variant="outline" className="gap-2 h-auto py-4">
              <Download className="w-4 h-4" />
              Export Clients
            </Button>
          </div>
          <Card className="p-5 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Client Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: activeClients, color: '#10b981' },
                      { name: 'On Hold', value: onHoldClients, color: '#f59e0b' },
                      { name: 'Discharged', value: dischargedClients, color: '#9ca3af' },
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {[
                      { name: 'Active', value: activeClients, color: '#10b981' },
                      { name: 'On Hold', value: onHoldClients, color: '#f59e0b' },
                      { name: 'Discharged', value: dischargedClients, color: '#9ca3af' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6 mt-6">
          <button onClick={() => setActiveSection(null)} className="flex items-center gap-1.5 text-sm font-medium text-orange-700 hover:text-orange-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to Reports
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{validTraining}</p>
                  <p className="text-sm text-slate-500">Valid</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{expiringTraining}</p>
                  <p className="text-sm text-slate-500">Expiring Soon</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-50 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{expiredTraining}</p>
                  <p className="text-sm text-slate-500">Expired</p>
                </div>
              </div>
            </Card>
            <Button variant="outline" className="gap-2 h-auto py-4">
              <Download className="w-4 h-4" />
              Export Training
            </Button>
          </div>
          <Card className="p-5 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Training Compliance Overview</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={trainingComplianceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {trainingComplianceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-green-700 text-sm font-medium">Valid Training</div>
                  <div className="text-3xl font-bold text-green-700">{validTraining}</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-yellow-700 text-sm font-medium">Expiring Soon</div>
                  <div className="text-3xl font-bold text-yellow-700">{expiringTraining}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-red-700 text-sm font-medium">Expired</div>
                  <div className="text-3xl font-bold text-red-700">{expiredTraining}</div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-6 mt-6">
          <button onClick={() => setActiveSection(null)} className="flex items-center gap-1.5 text-sm font-medium text-pink-700 hover:text-pink-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to Reports
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">£{(totalPayroll / 1000).toFixed(1)}k</p>
                  <p className="text-sm text-slate-500">Total Payroll</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">£{Math.round(avgPayroll)}</p>
                  <p className="text-sm text-slate-500">Avg Payment</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{payroll.length}</p>
                  <p className="text-sm text-slate-500">Payments</p>
                </div>
              </div>
            </Card>
            <Button onClick={exportPayrollData} variant="outline" className="gap-2 h-auto py-4">
              <Download className="w-4 h-4" />
              Export Payroll
            </Button>
          </div>
          <Card className="p-5 bg-white border-0 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Monthly Payroll Trend</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={payrollByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => `£${value}`} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} name="Amount" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6 mt-6">
          <button onClick={() => setActiveSection(null)} className="flex items-center gap-1.5 text-sm font-medium text-rose-700 hover:text-rose-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />Back to Reports
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{complianceRate}%</p>
                  <p className="text-sm text-slate-500">Compliance Rate</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-teal-50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{approvedLeave}</p>
                  <p className="text-sm text-slate-500">Approved Leave</p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-white border-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{pendingLeave}</p>
                  <p className="text-sm text-slate-500">Pending Leave</p>
                </div>
              </div>
            </Card>
            <Button onClick={exportLeaveData} variant="outline" className="gap-2 h-auto py-4">
              <Download className="w-4 h-4" />
              Export Leave
            </Button>
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="p-5 bg-white border-0 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Leave Types Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveTypeBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {leaveTypeBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-5 bg-white border-0 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-4">Leave Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                  <span className="text-emerald-700 font-medium">Approved</span>
                  <span className="text-2xl font-bold text-emerald-700">{approvedLeave}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700 font-medium">Pending</span>
                  <span className="text-2xl font-bold text-yellow-700">{pendingLeave}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-blue-700 font-medium">Compliance Rate</span>
                  <span className="text-2xl font-bold text-blue-700">{complianceRate}%</span>
                </div>
              </div>
            </Card>
          </div>
          <div className="flex gap-2 justify-end">
            <Button onClick={exportShiftData} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Shifts
            </Button>
            <Button onClick={exportIncidentData} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Incidents
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarItemModal from '@/components/calendar/CalendarItemModal';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  Calendar,
  Lock,
  FileText,
  Search,
  Eye,
  Plus,
  BookOpen,
  Filter,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parse,
  startOfWeek,
  endOfWeek,
  addDays,
} from 'date-fns';
import {
  getRegulationsByFramework,
  REGULATION_MAP,
  CATEGORY_LABELS,
  FRAMEWORK_LABELS,
} from '@/config/complianceRegulations';

// ── Regulation Filing Form (dynamic from config) ────────────────────────────

function RegulationFilingForm({ regulation, user, onClose, onSubmit, isPending }) {
  const [formData, setFormData] = useState({});
  const [title, setTitle] = useState(
    `${regulation.shortTitle || regulation.title} - ${format(new Date(), 'MMM yyyy')}`
  );

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const requiredFilled = regulation.fields
    .filter((f) => f.required)
    .every((f) => formData[f.key]?.toString().trim());

  const handleSubmit = (status) => {
    onSubmit({
      regulation_code: regulation.code,
      framework: regulation.framework,
      title,
      status,
      period_start: formData.review_period_start || formData.visit_date || null,
      period_end: formData.review_period_end || formData.visit_date || null,
      filed_date: status === 'filed' ? format(new Date(), 'yyyy-MM-dd') : null,
      filed_by: user?.id,
      filed_by_name: user?.full_name,
      form_data: formData,
    });
  };

  return (
    <div className="space-y-4 py-2">
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700 font-medium">{regulation.legalRef}</p>
        <p className="text-sm text-blue-900 mt-1">{regulation.description}</p>
        {regulation.cycle && (
          <Badge className="mt-2 bg-blue-100 text-blue-700">
            Every {regulation.cycle.months} months
          </Badge>
        )}
      </div>

      <div>
        <Label>Report Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      {regulation.fields.map((field) => (
        <div key={field.key}>
          <Label>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {field.type === 'text' && (
            <Input
              value={formData[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
          )}
          {field.type === 'date' && (
            <Input
              type="date"
              value={formData[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
          )}
          {field.type === 'time' && (
            <Input
              type="time"
              value={formData[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
          )}
          {field.type === 'textarea' && (
            <Textarea
              value={formData[field.key] || ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="min-h-[80px]"
            />
          )}
          {field.type === 'select' && (
            <Select
              value={formData[field.key] || ''}
              onValueChange={(v) => handleFieldChange(field.key, v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}

      <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSubmit('draft')}
          disabled={isPending || !title.trim()}
        >
          Save as Draft
        </Button>
        <Button
          onClick={() => handleSubmit('filed')}
          disabled={isPending || !requiredFilled || !title.trim()}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isPending ? 'Filing...' : 'File Report'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── Filed Report Viewer ─────────────────────────────────────────────────────

function FiledReportViewer({ report, onClose, onStatusChange, isPending }) {
  const regulation = REGULATION_MAP[report.regulation_code];

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          className={
            report.status === 'filed'
              ? 'bg-green-100 text-green-700'
              : report.status === 'submitted'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-yellow-100 text-yellow-700'
          }
        >
          {report.status.toUpperCase()}
        </Badge>
        <Badge className="bg-slate-100 text-slate-700">
          {report.framework.toUpperCase()}
        </Badge>
        {regulation && (
          <Badge className="bg-purple-100 text-purple-700">
            Reg {regulation.number}
          </Badge>
        )}
      </div>

      {regulation && (
        <p className="text-xs text-slate-500">{regulation.legalRef}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {report.period_start && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <Label className="text-slate-500 text-xs">Period Start</Label>
            <p className="font-medium text-sm">{report.period_start}</p>
          </div>
        )}
        {report.period_end && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <Label className="text-slate-500 text-xs">Period End</Label>
            <p className="font-medium text-sm">{report.period_end}</p>
          </div>
        )}
        {report.filed_date && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <Label className="text-slate-500 text-xs">Filed Date</Label>
            <p className="font-medium text-sm">{report.filed_date}</p>
          </div>
        )}
        {report.filed_by_name && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <Label className="text-slate-500 text-xs">Filed By</Label>
            <p className="font-medium text-sm">{report.filed_by_name}</p>
          </div>
        )}
      </div>

      {/* Render form data fields */}
      {regulation &&
        report.form_data &&
        regulation.fields.map((field) => {
          const value = report.form_data[field.key];
          if (!value) return null;
          return (
            <div key={field.key}>
              <Label className="text-slate-500 text-xs">{field.label}</Label>
              <p className="mt-0.5 text-sm whitespace-pre-wrap">{value}</p>
            </div>
          );
        })}

      {/* If no regulation match, show raw JSON */}
      {!regulation && report.form_data && (
        <div>
          <Label className="text-slate-500 text-xs">Form Data</Label>
          <pre className="text-xs bg-slate-50 p-3 rounded overflow-auto max-h-60">
            {JSON.stringify(report.form_data, null, 2)}
          </pre>
        </div>
      )}

      <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        {report.status === 'draft' && (
          <Button
            onClick={() => onStatusChange(report.id, 'filed')}
            disabled={isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Mark as Filed
          </Button>
        )}
      </DialogFooter>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function ComplianceManagement() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState('month');
  const [remindingDocId, setRemindingDocId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);

  // Framework toggle
  const [framework, setFramework] = useState('ciw');

  // Regulation filing
  const [selectedRegulation, setSelectedRegulation] = useState(null);
  const [filingDialogOpen, setFilingDialogOpen] = useState(false);

  // Filed report viewer
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Filed reports filters
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Load framework setting
  const { data: frameworkSettings = [] } = useQuery({
    queryKey: ['complianceFramework'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'compliance_framework' }),
  });

  // Set initial framework from DB
  React.useEffect(() => {
    if (frameworkSettings.length > 0 && frameworkSettings[0].setting_value) {
      setFramework(frameworkSettings[0].setting_value);
    }
  }, [frameworkSettings]);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: hrDocuments = [] } = useQuery({
    queryKey: ['hrDocuments'],
    queryFn: () => base44.entities.HRDocument.list('-expiry_date'),
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.list(),
  });

  const { data: complianceReports = [] } = useQuery({
    queryKey: ['complianceReports'],
    queryFn: () => base44.entities.ComplianceReport.list('-created_at'),
  });

  const { data: documentRequirements = [] } = useQuery({
    queryKey: ['documentRequirements'],
    queryFn: () => base44.entities.DocumentRequirement.list(),
  });

  // ── Mutations ──

  const saveFrameworkMutation = useMutation({
    mutationFn: async (fw) => {
      if (frameworkSettings.length > 0) {
        return base44.entities.SystemSettings.update(frameworkSettings[0].id, {
          setting_value: fw,
        });
      }
      return base44.entities.SystemSettings.create({
        setting_key: 'compliance_framework',
        setting_value: fw,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceFramework'] });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: (data) => base44.entities.ComplianceReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceReports'] });
      setFilingDialogOpen(false);
      setSelectedRegulation(null);
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ComplianceReport.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceReports'] });
      setReportDialogOpen(false);
      setSelectedReport(null);
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (docData) => {
      return await base44.functions.invoke('sendComplianceReminder', {
        documentId: docData.id,
        staffEmail: docData.staff_email,
        documentTitle: docData.title,
        expiryDate: docData.expiry_date,
      });
    },
    onSuccess: () => setRemindingDocId(null),
  });

  const clearDocumentMutation = useMutation({
    mutationFn: (docId) => base44.entities.HRDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hrDocuments'] });
    },
  });

  // ── Framework toggle handler ──

  const handleFrameworkChange = (fw) => {
    setFramework(fw);
    saveFrameworkMutation.mutate(fw);
  };

  // ── Calendar data (same as before) ──

  const tasksAndDocs = useMemo(() => {
    const items = [];
    hrDocuments.forEach((doc) => {
      if (doc.expiry_date) {
        items.push({
          id: `doc-${doc.id}`,
          title: doc.title,
          date: doc.expiry_date,
          type: 'document',
          staff: doc.staff_name,
          status:
            new Date(doc.expiry_date) < new Date()
              ? 'overdue'
              : new Date(doc.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              ? 'due_soon'
              : 'upcoming',
        });
      }
    });
    serviceUsers.forEach((su) => {
      if (su.plan_review_date) {
        items.push({
          id: `carePlan-${su.id}`,
          title: `Care Plan Review - ${su.full_name}`,
          date: su.plan_review_date,
          type: 'care_plan',
          staff: su.full_name,
          status:
            new Date(su.plan_review_date) < new Date()
              ? 'overdue'
              : new Date(su.plan_review_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              ? 'due_soon'
              : 'upcoming',
        });
      }
    });
    return items;
  }, [hrDocuments, serviceUsers]);

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const daysCells = [...Array(startOfMonth(currentDate).getDay()).fill(null), ...monthDays];

  const itemsByDate = useMemo(() => {
    const map = {};
    tasksAndDocs.forEach((item) => {
      const dateStr = format(parse(item.date, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd');
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(item);
    });
    return map;
  }, [tasksAndDocs]);

  const statusColors = {
    overdue: 'bg-red-100 text-red-700 border-red-300',
    due_soon: 'bg-orange-100 text-orange-700 border-orange-300',
    upcoming: 'bg-blue-100 text-blue-700 border-blue-300',
  };

  const overdueDocs = tasksAndDocs.filter((i) => i.status === 'overdue');
  const dueSoonDocs = tasksAndDocs.filter((i) => i.status === 'due_soon');

  // ── Regulations data ──

  const regulations = getRegulationsByFramework(framework);

  // Group regulations by category
  const regulationsByCategory = useMemo(() => {
    const groups = {};
    regulations.forEach((reg) => {
      if (!groups[reg.category]) groups[reg.category] = [];
      groups[reg.category].push(reg);
    });
    return groups;
  }, [regulations]);

  // Last filed date per regulation
  const lastFiledByReg = useMemo(() => {
    const map = {};
    complianceReports
      .filter((r) => r.status === 'filed')
      .forEach((r) => {
        if (!map[r.regulation_code] || r.filed_date > map[r.regulation_code]) {
          map[r.regulation_code] = r.filed_date;
        }
      });
    return map;
  }, [complianceReports]);

  // Next due date per regulation
  const getNextDueDate = (reg) => {
    if (!reg.cycle) return null;
    const lastFiled = lastFiledByReg[reg.code];
    if (!lastFiled) return 'Not yet filed';
    const lastDate = new Date(lastFiled);
    const nextDue = addMonths(lastDate, reg.cycle.months);
    return format(nextDue, 'dd MMM yyyy');
  };

  const getDueStatus = (reg) => {
    if (!reg.cycle) return null;
    const lastFiled = lastFiledByReg[reg.code];
    if (!lastFiled) return 'overdue';
    const lastDate = new Date(lastFiled);
    const nextDue = addMonths(lastDate, reg.cycle.months);
    const now = new Date();
    if (nextDue < now) return 'overdue';
    if (nextDue <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) return 'due_soon';
    return 'upcoming';
  };

  // ── Filed reports filter ──

  const filteredReports = complianceReports.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.regulation_code?.toLowerCase().includes(reportSearch.toLowerCase());
    const matchesStatus = reportStatusFilter === 'all' || r.status === reportStatusFilter;
    const matchesFramework = r.framework === framework;
    return matchesSearch && matchesStatus && matchesFramework;
  });

  // ── Category colors ──
  const categoryColors = {
    governance: 'border-l-blue-500',
    quality: 'border-l-teal-500',
    safeguarding: 'border-l-purple-500',
    staffing: 'border-l-amber-500',
    notifications: 'border-l-red-500',
  };

  const dueStatusBadge = {
    overdue: <Badge className="bg-red-100 text-red-700">Overdue</Badge>,
    due_soon: <Badge className="bg-orange-100 text-orange-700">Due Soon</Badge>,
    upcoming: <Badge className="bg-green-100 text-green-700">Up to Date</Badge>,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Management"
        subtitle="Regulatory compliance, document tracking & reporting"
        icon={Lock}
      >
        {/* Framework Toggle */}
        <div className="flex border border-slate-200 rounded-lg p-1 bg-slate-50">
          <Button
            variant={framework === 'ciw' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFrameworkChange('ciw')}
            className="text-xs"
          >
            CIW
          </Button>
          <Button
            variant={framework === 'cqc' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleFrameworkChange('cqc')}
            className="text-xs"
          >
            CQC
          </Button>
        </div>
      </PageHeader>

      <Tabs defaultValue="regulations" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto bg-transparent p-0 mb-4">
          <TabsTrigger
            value="regulations"
            className="text-xs sm:text-sm font-bold rounded-lg py-2 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all"
          >
            <BookOpen className="w-4 h-4 mr-1.5" />
            Regulations
          </TabsTrigger>
          <TabsTrigger
            value="reports"
            className="text-xs sm:text-sm font-bold rounded-lg py-2 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            Filed Reports
            {complianceReports.filter((r) => r.framework === framework).length > 0 && (
              <Badge className="ml-1.5 bg-teal-600 text-white text-xs">
                {complianceReports.filter((r) => r.framework === framework).length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            className="text-xs sm:text-sm font-bold rounded-lg py-2 px-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-50 data-[state=active]:to-teal-100 data-[state=active]:border data-[state=active]:border-teal-300 data-[state=active]:text-teal-900 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 transition-all"
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            Calendar
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Regulations ── */}
        <TabsContent value="regulations" className="space-y-6 mt-4">
          <div className="p-3 bg-gradient-to-r from-slate-50 to-teal-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-600">
              <strong>{FRAMEWORK_LABELS[framework]}</strong> — Browse regulations below, click to file a compliance report.
            </p>
          </div>

          {Object.entries(regulationsByCategory).map(([category, regs]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                {CATEGORY_LABELS[category] || category}
              </h3>
              <div className="space-y-3">
                {regs.map((reg) => {
                  const dueStatus = getDueStatus(reg);
                  const nextDue = getNextDueDate(reg);
                  const lastFiled = lastFiledByReg[reg.code];

                  return (
                    <Card
                      key={reg.code}
                      className={`p-4 border-l-4 ${categoryColors[reg.category] || 'border-l-slate-300'} hover:shadow-md transition-all cursor-pointer`}
                      onClick={() => {
                        setSelectedRegulation(reg);
                        setFilingDialogOpen(true);
                      }}
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-slate-200 text-slate-700 font-mono text-xs">
                              Reg {reg.number}
                            </Badge>
                            <h4 className="font-semibold text-slate-900">{reg.title}</h4>
                          </div>
                          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                            {reg.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            {reg.cycle && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Every {reg.cycle.months} months
                              </span>
                            )}
                            {!reg.cycle && (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Event-driven
                              </span>
                            )}
                            {lastFiled && (
                              <span>Last filed: {lastFiled}</span>
                            )}
                            {nextDue && nextDue !== 'Not yet filed' && (
                              <span>Next due: {nextDue}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {dueStatus && dueStatusBadge[dueStatus]}
                          {!reg.cycle && (
                            <Badge className="bg-slate-100 text-slate-500">As needed</Badge>
                          )}
                          <Button size="sm" variant="outline" className="text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            File
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── TAB: Filed Reports ── */}
        <TabsContent value="reports" className="space-y-4 mt-4">
          <Card className="p-3 bg-gradient-to-br from-teal-50 to-blue-50 border-teal-200">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search reports..."
                  value={reportSearch}
                  onChange={(e) => setReportSearch(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="filed">Filed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No filed reports yet</p>
              <p className="text-sm mt-1">
                Go to the Regulations tab to file your first compliance report
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReports.map((report) => {
                const reg = REGULATION_MAP[report.regulation_code];
                return (
                  <Card
                    key={report.id}
                    className="p-4 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedReport(report);
                      setReportDialogOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-900 truncate">
                            {report.title}
                          </h4>
                          {reg && (
                            <Badge className="bg-slate-100 text-slate-600 text-xs font-mono">
                              Reg {reg.number}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {report.filed_date && <span>Filed: {report.filed_date}</span>}
                          {report.filed_by_name && <span>By: {report.filed_by_name}</span>}
                          {report.period_start && report.period_end && (
                            <span>
                              Period: {report.period_start} to {report.period_end}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={
                          report.status === 'filed'
                            ? 'bg-green-100 text-green-700'
                            : report.status === 'submitted'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── TAB: Calendar (preserved from original) ── */}
        <TabsContent value="calendar" className="space-y-6 mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{overdueDocs.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </Card>
            <Card className="p-4 border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Due Soon (30 days)</p>
                  <p className="text-2xl font-bold text-orange-600">{dueSoonDocs.length}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Tracked</p>
                  <p className="text-2xl font-bold text-slate-900">{tasksAndDocs.length}</p>
                </div>
                <Shield className="w-8 h-8 text-teal-500" />
              </div>
            </Card>
          </div>

          {/* Calendar */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {viewType === 'day'
                    ? format(currentDate, 'EEEE, MMMM d, yyyy')
                    : viewType === 'week'
                    ? `Week of ${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                    : format(currentDate, 'MMMM yyyy')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div className="flex border border-slate-200 rounded-lg p-1 bg-slate-50">
                    <Button
                      variant={viewType === 'day' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('day')}
                      className="text-xs"
                    >
                      Day
                    </Button>
                    <Button
                      variant={viewType === 'week' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('week')}
                      className="text-xs"
                    >
                      Week
                    </Button>
                    <Button
                      variant={viewType === 'month' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewType('month')}
                      className="text-xs"
                    >
                      Month
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1));
                      else if (viewType === 'week') setCurrentDate(addDays(currentDate, -7));
                      else setCurrentDate(addDays(currentDate, -1));
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1));
                      else if (viewType === 'week') setCurrentDate(addDays(currentDate, 7));
                      else setCurrentDate(addDays(currentDate, 1));
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Day View */}
              {viewType === 'day' && (
                <div className="space-y-4">
                  {(() => {
                    const dateStr = format(currentDate, 'yyyy-MM-dd');
                    const items = itemsByDate[dateStr] || [];
                    return (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-semibold text-slate-900 mb-3">
                          {format(currentDate, 'EEEE, MMMM d')}
                        </h4>
                        {items.length === 0 ? (
                          <p className="text-slate-500 text-center py-6">
                            No compliance items on this day
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowItemModal(true);
                                }}
                                className={`w-full text-left p-3 rounded border ${statusColors[item.status]} hover:opacity-80 transition-opacity`}
                              >
                                <p className="font-medium text-sm">{item.title}</p>
                                {item.staff && <p className="text-xs mt-1">{item.staff}</p>}
                                <p className="text-xs mt-1">Due: {item.date}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Week View */}
              {viewType === 'week' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {weekDays.map((day) => (
                      <div
                        key={format(day, 'yyyy-MM-dd')}
                        className="text-center text-xs font-semibold text-slate-600"
                      >
                        <div>{format(day, 'EEE')}</div>
                        <div className={isSameDay(day, new Date()) ? 'text-teal-600 font-bold' : ''}>
                          {format(day, 'd')}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const items = itemsByDate[dateStr] || [];
                      const isToday = isSameDay(day, new Date());
                      return (
                        <div
                          key={dateStr}
                          className={`min-h-32 p-2 border rounded-lg ${
                            isToday ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="space-y-1">
                            {items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  setSelectedItem(item);
                                  setShowItemModal(true);
                                }}
                                className={`w-full text-left text-xs p-1 rounded border ${statusColors[item.status]} truncate hover:opacity-80 transition-opacity`}
                                title={item.title}
                              >
                                {item.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Month View */}
              {viewType === 'month' && (
                <>
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-semibold text-slate-600 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {daysCells.map((day, idx) => {
                      const isCurrentMonth = day && isSameMonth(day, currentDate);
                      const dateStr = day ? format(day, 'yyyy-MM-dd') : '';
                      const items = itemsByDate[dateStr] || [];
                      const isToday = day && isSameDay(day, new Date());

                      return (
                        <div
                          key={idx}
                          className={`min-h-24 p-2 border rounded-lg ${
                            isCurrentMonth ? 'bg-white' : 'bg-slate-50'
                          } ${isToday ? 'border-teal-500 bg-teal-50' : 'border-slate-200'}`}
                        >
                          {day && (
                            <>
                              <div
                                className={`text-sm font-semibold mb-1 ${
                                  isCurrentMonth ? 'text-slate-900' : 'text-slate-400'
                                }`}
                              >
                                {format(day, 'd')}
                              </div>
                              <div className="space-y-1">
                                {items.slice(0, 2).map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setShowItemModal(true);
                                    }}
                                    className={`w-full text-left text-xs p-1 rounded border ${statusColors[item.status]} truncate hover:opacity-80 transition-opacity`}
                                    title={item.title}
                                  >
                                    {item.title}
                                  </button>
                                ))}
                                {items.length > 2 && (
                                  <div className="text-xs text-slate-600 px-1">
                                    +{items.length - 2} more
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Upcoming Items */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Upcoming Compliance Items
            </h3>
            <div className="space-y-3">
              {overdueDocs.length === 0 && dueSoonDocs.length === 0 && tasksAndDocs.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No compliance items to track</p>
              ) : (
                <>
                  {overdueDocs.map((doc) => {
                    const hrDoc = hrDocuments.find((d) => d.id === doc.id.replace('doc-', ''));
                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{doc.title}</p>
                          {doc.staff && <p className="text-sm text-slate-600">{doc.staff}</p>}
                          <p className="text-sm text-red-600">Overdue: {doc.date}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {(user?.role === 'admin' || user?.role === 'super_admin') && hrDoc && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRemindingDocId(doc.id);
                                  sendReminderMutation.mutate({
                                    id: hrDoc.id,
                                    staff_email: hrDoc.created_by,
                                    title: hrDoc.title,
                                    expiry_date: hrDoc.expiry_date,
                                  });
                                }}
                                disabled={
                                  remindingDocId === doc.id || sendReminderMutation.isPending
                                }
                                className="text-xs"
                              >
                                {remindingDocId === doc.id ? 'Sending...' : 'Remind'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => clearDocumentMutation.mutate(hrDoc.id)}
                                disabled={clearDocumentMutation.isPending}
                                className="text-xs text-slate-600 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Badge className="bg-red-100 text-red-700">OVERDUE</Badge>
                        </div>
                      </div>
                    );
                  })}

                  {dueSoonDocs.map((doc) => {
                    const hrDoc = hrDocuments.find((d) => d.id === doc.id.replace('doc-', ''));
                    return (
                      <div
                        key={doc.id}
                        className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{doc.title}</p>
                          {doc.staff && <p className="text-sm text-slate-600">{doc.staff}</p>}
                          <p className="text-sm text-orange-600">Due: {doc.date}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          {(user?.role === 'admin' || user?.role === 'super_admin') && hrDoc && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => clearDocumentMutation.mutate(hrDoc.id)}
                              disabled={clearDocumentMutation.isPending}
                              className="text-xs text-slate-600 hover:text-orange-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                          <Badge className="bg-orange-100 text-orange-700 flex-shrink-0">
                            DUE SOON
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calendar Item Modal */}
      <CalendarItemModal
        item={selectedItem}
        open={showItemModal}
        onOpenChange={setShowItemModal}
      />

      {/* Regulation Filing Dialog */}
      <Dialog open={filingDialogOpen} onOpenChange={setFilingDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>
              {selectedRegulation
                ? `File Report: Regulation ${selectedRegulation.number} — ${selectedRegulation.title}`
                : 'File Report'}
            </DialogTitle>
          </DialogHeader>
          {selectedRegulation && (
            <RegulationFilingForm
              regulation={selectedRegulation}
              user={user}
              onClose={() => {
                setFilingDialogOpen(false);
                setSelectedRegulation(null);
              }}
              onSubmit={(data) => createReportMutation.mutate(data)}
              isPending={createReportMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Filed Report Viewer Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>{selectedReport?.title || 'Report'}</DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <FiledReportViewer
              report={selectedReport}
              onClose={() => {
                setReportDialogOpen(false);
                setSelectedReport(null);
              }}
              onStatusChange={(id, status) =>
                updateReportMutation.mutate({
                  id,
                  data: { status, filed_date: format(new Date(), 'yyyy-MM-dd') },
                })
              }
              isPending={updateReportMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

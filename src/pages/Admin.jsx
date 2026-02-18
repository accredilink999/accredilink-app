import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import PageHeader from '@/components/ui/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
        Heart,
        UserCog,
        ClipboardCheck,
        Calendar,
        MessageCircle,
        FolderOpen,
        Bell,
        Briefcase,
        PoundSterling,
        BarChart3,
        FileEdit,
        CalendarClock,
        GraduationCap,
        Receipt,
        Shield,
        Users,
        Grid3x3,
        Archive,
        Bot,
        CheckSquare,
        Download,
        Bug,
        FileSpreadsheet
      } from 'lucide-react';

export default function AdminDashboard() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="max-w-6xl mx-auto pb-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 fill-blue-600 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="space-y-4 mb-6">
        {/* Core Management */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Core Management</h2>
          <div className="space-y-2">
            <Link to={createPageUrl('ControlRoom')} className="flex items-center gap-2 text-slate-700 hover:text-slate-800 font-bold text-base py-2">
              <Shield className="w-5 h-5 text-slate-700 fill-slate-700" />
              Control Room
            </Link>
            <Link to={createPageUrl('AIAssistant')} className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-bold text-base py-2">
              <Bot className="w-5 h-5 text-purple-600 fill-purple-600" />
              AI Admin Assistant
            </Link>
          </div>
        </div>

        {/* Client & Care Management */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Client & Care Management</h2>
          <div className="space-y-2">
            <Link to={createPageUrl('ClientManagement')} className="flex items-center gap-2 text-teal-500 hover:text-teal-600 font-bold text-base py-2">
              <Heart className="w-5 h-5 text-teal-500 fill-teal-500" />
              Client Management
            </Link>
            <Link to={createPageUrl('StaffManagement')} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-base py-2">
              <Users className="w-5 h-5 text-blue-600 fill-blue-600" />
              Staff Management
            </Link>
          </div>
        </div>

        {/* Scheduling & Requests */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Scheduling & Requests</h2>
          <div className="space-y-2">
            <Link to={createPageUrl('RotaManagement')} className="flex items-center gap-2 text-orange-500 hover:text-orange-600 font-bold text-base py-2">
              <Calendar className="w-5 h-5 text-orange-500 fill-orange-500" />
              Rota Management
            </Link>
            <Link to={createPageUrl('WorkCalendar')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-base py-2">
              <Calendar className="w-5 h-5 text-indigo-600 fill-indigo-600" />
              Work Calendar
            </Link>
          </div>
        </div>

        {/* HR & Payroll */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">HR & Payroll</h2>
          <div className="space-y-2">
            <Link to={createPageUrl('AdminApprovalsFinancials')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-base py-2">
              <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-600" />
              Approvals & Financials
            </Link>
            <Link to={createPageUrl('Invoicing')} className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-bold text-base py-2">
              <Receipt className="w-5 h-5 text-teal-600 fill-teal-600" />
              Invoicing
            </Link>
            {isSuperAdmin && (
              <Link to={createPageUrl('Payroll')} className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-base py-2">
                <PoundSterling className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                Payroll
              </Link>
            )}
            <Link to={createPageUrl('ComplianceManagement')} className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold text-base py-2">
              <Shield className="w-5 h-5 text-red-600 fill-red-600" />
              Compliance Management
            </Link>
          </div>
        </div>

        {/* Training & Documents */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Training & Documents</h2>
          <div className="space-y-2">
            <Link to={createPageUrl('Training')} className="flex items-center gap-2 text-cyan-600 hover:text-cyan-700 font-bold text-base py-2">
              <GraduationCap className="w-5 h-5 text-cyan-600 fill-cyan-600" />
              Training Management
            </Link>
            <Link to={createPageUrl('DocumentManagement')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-base py-2">
              <FolderOpen className="w-5 h-5 text-indigo-600 fill-indigo-600" />
              Document Management
            </Link>
            <Link to={createPageUrl('Archive')} className="flex items-center gap-2 text-slate-600 hover:text-slate-700 font-bold text-base py-2">
              <Archive className="w-5 h-5 text-slate-600 fill-slate-600" />
              Archive
            </Link>
            <Link to={createPageUrl('FormBuilder')} className="flex items-center gap-2 text-fuchsia-600 hover:text-fuchsia-700 font-bold text-base py-2">
              <FileEdit className="w-5 h-5 text-fuchsia-600 fill-fuchsia-600" />
              Form Builder
            </Link>
          </div>
        </div>

        {/* Communication & Reports */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3">Communication & Reports</h2>
          <div className="space-y-2">
            <Link to={createPageUrl('Messages')} className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-bold text-base py-2">
              <MessageCircle className="w-5 h-5 text-pink-600 fill-pink-600" />
              Communication Management
            </Link>

            <Link to={createPageUrl('PushNotificationManagement')} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-bold text-base py-2">
              <Bell className="w-5 h-5 text-indigo-600 fill-indigo-600" />
              Push Notification System
            </Link>
            <Link to={createPageUrl('Reports')} className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-bold text-base py-2">
              <BarChart3 className="w-5 h-5 text-sky-600 fill-sky-600" />
              Reports & Analytics
            </Link>
            <Link to={createPageUrl('AppDownloads')} className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-base py-2">
              <Download className="w-5 h-5 text-emerald-600 fill-emerald-600" />
              App Downloads Management
            </Link>
            <Link to={createPageUrl('ErrorLog')} className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold text-base py-2">
              <Bug className="w-5 h-5 text-red-500 fill-red-500" />
              Error Log
            </Link>
            <Link to={createPageUrl('DataImport')} className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-bold text-base py-2">
              <FileSpreadsheet className="w-5 h-5 text-amber-600 fill-amber-600" />
              Data Import (CSV)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
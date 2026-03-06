import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import PageHeader from '@/components/ui/PageHeader';
import HelpTip from '@/components/ui/HelpTip';
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
        FileSpreadsheet,
        Video,
        Activity,
        Building2
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
          <HelpTip tip="Central hub for all admin tools. Only visible to admins and managers.">
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          </HelpTip>
        </div>
      </div>

      {/* Core Management */}
      <h2 className="text-lg font-bold text-slate-900 mb-2">Core</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { to: 'OrgAdmin', label: 'Organisation', icon: Building2, bg: 'from-teal-400 to-teal-600', desc: 'Organisation admin' },
          { to: 'ControlRoom', label: 'Control Room', icon: Shield, bg: 'from-slate-500 to-slate-700', desc: 'Live overview' },
          { to: 'AIAssistant', label: 'AI Assistant', icon: Bot, bg: 'from-purple-400 to-purple-600', desc: 'AI admin helper' },
        ].map(section => {
          const Icon = section.icon;
          return (
            <Link key={section.to} to={createPageUrl(section.to)} className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center leading-tight">{section.label}</span>
              <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">{section.desc}</span>
            </Link>
          );
        })}
      </div>

      {/* People & Clinical */}
      <h2 className="text-lg font-bold text-slate-900 mb-2">People & Clinical</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { to: 'ClientManagement', label: 'Clients', icon: Heart, bg: 'from-teal-400 to-teal-600', desc: 'Client management' },
          { to: 'StaffManagement', label: 'Staff', icon: Users, bg: 'from-blue-400 to-blue-600', desc: 'Staff management' },
          { to: 'ClinicalDashboard', label: 'Clinical', icon: Activity, bg: 'from-rose-400 to-rose-600', desc: 'Clinical dashboard' },
        ].map(section => {
          const Icon = section.icon;
          return (
            <Link key={section.to} to={createPageUrl(section.to)} className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center leading-tight">{section.label}</span>
              <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">{section.desc}</span>
            </Link>
          );
        })}
      </div>

      {/* Scheduling */}
      <h2 className="text-lg font-bold text-slate-900 mb-2">Scheduling</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { to: 'RotaManagement', label: 'Rota', icon: Calendar, bg: 'from-orange-400 to-orange-600', desc: 'Rota management' },
          { to: 'WorkCalendar', label: 'Calendar', icon: CalendarClock, bg: 'from-indigo-400 to-indigo-600', desc: 'Work calendar' },
        ].map(section => {
          const Icon = section.icon;
          return (
            <Link key={section.to} to={createPageUrl(section.to)} className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center leading-tight">{section.label}</span>
              <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">{section.desc}</span>
            </Link>
          );
        })}
      </div>

      {/* HR & Finance */}
      <h2 className="text-lg font-bold text-slate-900 mb-2">HR & Finance</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { to: 'AdminApprovalsFinancials', label: 'Approvals', icon: CheckSquare, bg: 'from-indigo-400 to-indigo-600', desc: 'Approvals & financials' },
          { to: 'Invoicing', label: 'Invoicing', icon: Receipt, bg: 'from-teal-400 to-teal-600', desc: 'Invoice management' },
          ...(isSuperAdmin ? [{ to: 'Payroll', label: 'Payroll', icon: PoundSterling, bg: 'from-emerald-400 to-emerald-600', desc: 'Payroll processing' }] : []),
          { to: 'ComplianceManagement', label: 'Compliance', icon: Shield, bg: 'from-red-400 to-red-600', desc: 'CIW/CQC compliance' },
        ].map(section => {
          const Icon = section.icon;
          return (
            <Link key={section.to} to={createPageUrl(section.to)} className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center leading-tight">{section.label}</span>
              <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">{section.desc}</span>
            </Link>
          );
        })}
      </div>

      {/* Training & Documents */}
      <h2 className="text-lg font-bold text-slate-900 mb-2">Training & Documents</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { to: 'Training', label: 'Training', icon: GraduationCap, bg: 'from-cyan-400 to-cyan-600', desc: 'Training management' },
          { to: 'DocumentManagement', label: 'Documents', icon: FolderOpen, bg: 'from-indigo-400 to-indigo-600', desc: 'Document management' },
          { to: 'Archive', label: 'Archive', icon: Archive, bg: 'from-slate-400 to-slate-600', desc: 'Archived records' },
          { to: 'FormBuilder', label: 'Forms', icon: FileEdit, bg: 'from-fuchsia-400 to-fuchsia-600', desc: 'Custom form builder' },
        ].map(section => {
          const Icon = section.icon;
          return (
            <Link key={section.to} to={createPageUrl(section.to)} className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center leading-tight">{section.label}</span>
              <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">{section.desc}</span>
            </Link>
          );
        })}
      </div>

      {/* Communication & Reports */}
      <h2 className="text-lg font-bold text-slate-900 mb-2">Communication & Reports</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {[
          { to: 'Messages', label: 'Messages', icon: MessageCircle, bg: 'from-pink-400 to-pink-600', desc: 'Communication hub' },
          { to: 'Communications', label: 'Video', icon: Video, bg: 'from-blue-400 to-blue-600', desc: 'Video comms' },
          { to: 'PushNotificationManagement', label: 'Push', icon: Bell, bg: 'from-indigo-400 to-indigo-600', desc: 'Push notifications' },
          { to: 'Reports', label: 'Reports', icon: BarChart3, bg: 'from-sky-400 to-sky-600', desc: 'Reports & analytics' },
          { to: 'AppDownloads', label: 'Downloads', icon: Download, bg: 'from-emerald-400 to-emerald-600', desc: 'App downloads' },
          { to: 'ErrorLog', label: 'Errors', icon: Bug, bg: 'from-red-400 to-red-600', desc: 'Error log' },
          { to: 'DataImport', label: 'Import', icon: FileSpreadsheet, bg: 'from-amber-400 to-amber-600', desc: 'CSV data import' },
        ].map(section => {
          const Icon = section.icon;
          return (
            <Link key={section.to} to={createPageUrl(section.to)} className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
              </div>
              <span className="text-sm font-semibold text-slate-700 text-center leading-tight">{section.label}</span>
              <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">{section.desc}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
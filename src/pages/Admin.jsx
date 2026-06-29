import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import {
  Heart, UserCog, ClipboardCheck, Calendar,
  Briefcase, PoundSterling,
  CalendarClock, GraduationCap, Shield, Users, Grid3x3,
  Archive, CheckSquare,
  Activity, Building2, Trophy,
  ChevronDown, ChevronUp, SlidersHorizontal, ListChecks, Smartphone, Send, Loader2,

} from 'lucide-react';

// ─── PRIMARY tiles — shown always ────────────────────────────────────────────
// These are the actions admins need every single day.
const PRIMARY = [
  {
    to: 'OrgAdmin',
    label: 'Organisation',
    icon: Building2,
    bg: 'from-teal-500 to-teal-700',
    desc: 'Setup, permissions, staff, billing',
  },
  {
    to: 'ControlRoom',
    label: 'Control Room',
    icon: Shield,
    bg: 'from-slate-600 to-slate-800',
    desc: 'Live staff & alerts',
  },
  {
    to: 'StaffManagement',
    label: 'Staff',
    icon: Users,
    bg: 'from-blue-500 to-blue-700',
    desc: 'Manage your team',
  },
  {
    to: 'ClientManagement',
    label: 'Clients',
    icon: Heart,
    bg: 'from-rose-400 to-rose-600',
    desc: 'Service users & care',
  },
  {
    to: 'RotaManagement',
    label: 'Rota',
    icon: Calendar,
    bg: 'from-orange-400 to-orange-600',
    desc: 'Scheduling & patterns',
  },
  {
    to: 'AdminApprovalsFinancials',
    label: 'Approvals',
    icon: CheckSquare,
    bg: 'from-indigo-400 to-indigo-600',
    desc: 'Leave, swaps & expenses',
    badgeKey: 'pending',
  },
  {
    to: 'Finance',
    label: 'Finance',
    icon: PoundSterling,
    bg: 'from-emerald-500 to-emerald-700',
    desc: 'Invoicing & payroll',
  },
  {
    to: 'ComplianceManagement',
    label: 'Compliance',
    icon: Shield,
    bg: 'from-red-400 to-red-600',
    desc: 'CQC / CIW readiness',
  },
  {
    to: 'Training',
    label: 'Training',
    icon: GraduationCap,
    bg: 'from-cyan-400 to-cyan-600',
    desc: 'Courses & certificates',
  },
  {
    to: 'ClinicalDashboard',
    label: 'Clinical Tools',
    icon: Activity,
    bg: 'from-rose-500 to-rose-700',
    desc: 'Clinical dashboard',
  },
  {
    to: 'WorkCalendar',
    label: 'Calendar',
    icon: CalendarClock,
    bg: 'from-indigo-300 to-indigo-500',
    desc: 'Work calendar',
  },
  {
    to: 'Archive',
    label: 'Archive',
    icon: Archive,
    bg: 'from-slate-400 to-slate-600',
    desc: 'Archived records',
  },
];

// ─── MORE tiles — collapsed by default ───────────────────────────────────────
const MORE = [
  { to: 'StaffAwards', label: 'Awards', icon: Trophy, bg: 'from-amber-400 to-yellow-500', desc: 'Recognise staff' },
];

// ─── Tile component ───────────────────────────────────────────────────────────
function Tile({ to, label, icon: Icon, bg, desc, badge }) {
  return (
    <Link
      to={createPageUrl(to)}
      className="relative flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 min-h-[100px] active:scale-95"
    >
      {badge > 0 && (
        <span className="absolute top-2 right-2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center mb-2 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
      </div>
      <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{label}</span>
      <span className="text-[10px] text-slate-400 text-center mt-0.5 leading-tight line-clamp-1">{desc}</span>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [showMore, setShowMore] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingSwaps = [] } = useQuery({
    queryKey: ['pendingSwapsAdmin'],
    queryFn: () => base44.entities.ShiftSwapRequest.filter({ status: 'pending_admin' }),
  });
  const { data: pendingLeave = [] } = useQuery({
    queryKey: ['pendingLeaveAdmin'],
    queryFn: () => base44.entities.LeaveRequest.filter({ status: 'pending' }),
  });

  const isSuperAdmin = user?.role === 'super_admin';
  const pendingCount = pendingSwaps.length + pendingLeave.length;
  const moreTiles = MORE.filter(t => !t.superAdminOnly || isSuperAdmin);

  const { data: allStaff = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: () => base44.entities.User.filter({ is_active: true }),
  });

  const notifyApkMutation = useMutation({
    mutationFn: async () => {
      // Get APK URL from system_settings
      const { data: setting } = await supabase
        .from('system_settings')
        .select('setting_value')
        .eq('setting_key', 'app_download_android')
        .limit(1)
        .single();
      let apkUrl = null;
      try {
        const val = setting?.setting_value
          ? (typeof setting.setting_value === 'string' ? JSON.parse(setting.setting_value) : setting.setting_value)
          : null;
        apkUrl = val?.file_url || null;
      } catch {}

      const downloadPage = window.location.origin + '/download';
      const link = apkUrl || downloadPage;

      const staffToNotify = allStaff.filter(s => s.id !== user?.id);
      for (const s of staffToNotify) {
        await base44.entities.Notification.create({
          recipient_id: s.id,
          type: 'system',
          title: '📱 Download the CareCall AI App',
          message: `Your organisation has shared the app download link. Install the APK for the best experience.`,
          link,
          is_read: false,
          send_push: true,
        });
      }
      return staffToNotify.length;
    },
    onSuccess: (count) => toast.success(`APK link sent to ${count} staff member${count !== 1 ? 's' : ''}`),
    onError: () => toast.error('Failed to send notifications'),
  });

  return (
    <div className="max-w-2xl mx-auto pb-8 px-1">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5 pt-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-sm shrink-0">
          <Shield className="w-5 h-5 text-white" strokeWidth={1.8} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 leading-tight">Admin Panel</h1>
          <p className="text-xs text-slate-400">
            {pendingCount > 0
              ? <span className="text-amber-600 font-medium">{pendingCount} item{pendingCount !== 1 ? 's' : ''} need attention</span>
              : 'All clear — no pending actions'}
          </p>
        </div>
        <button
          onClick={() => notifyApkMutation.mutate()}
          disabled={notifyApkMutation.isPending || allStaff.length === 0}
          title="Send APK download link to all staff"
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:opacity-50 transition-colors shrink-0"
        >
          {notifyApkMutation.isPending
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Smartphone className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Share app</span>
          <Send className="w-3 h-3" />
        </button>
      </div>

      {/* Primary grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {PRIMARY.map(t => (
          <Tile
            key={t.to}
            {...t}
            badge={t.badgeKey === 'pending' ? pendingCount : 0}
          />
        ))}
      </div>

      {/* More toggle */}
      <button
        onClick={() => setShowMore(v => !v)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-500 font-medium hover:bg-slate-50 transition-colors mb-2"
      >
        {showMore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {showMore ? 'Show less' : `More tools (${moreTiles.length})`}
      </button>

      {/* More grid */}
      {showMore && (
        <div className="grid grid-cols-3 gap-2.5">
          {moreTiles.map(t => (
            <Tile key={t.to} {...t} />
          ))}
        </div>
      )}
    </div>
  );
}

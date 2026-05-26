import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { ShiftApi } from '@/api/rotaApi';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isToday, parseISO, startOfWeek, endOfWeek, startOfMonth } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import PageHeader from '@/components/ui/PageHeader';
import ShiftDetailModal from '@/components/rota/ShiftDetailModal';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Clock,
  Users,
  AlertTriangle,
  FileText,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Activity,
  Pill,
  GraduationCap,
  TrendingUp,
  Bell,
  Shield,
  Settings,
  Menu,
  MessageSquare,
  ArrowRightLeft,
  Hand,
  PoundSterling,
  CalendarOff,
  Heart,
  Bot,
  Star,
  Trophy,
  ListChecks,
  Share2,
  ClipboardCheck } from
'lucide-react';
import ShiftSwapResponseModal from '@/components/rota/ShiftSwapResponseModal';
import HelpTip from '@/components/ui/HelpTip';

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showCareLogDialog, setShowCareLogDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [showTasksPopup, setShowTasksPopup] = useState(false);
  const [showAwardsPopup, setShowAwardsPopup] = useState(false);
  const [showAwardBanner, setShowAwardBanner] = useState(false);
  const [dismissedAwardIds, setDismissedAwardIds] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const [careLogData, setCareLogData] = useState({
    service_user_id: '',
    visit_date: today,
    visit_time: format(new Date(), 'HH:mm'),
    mood: '',
    food_intake: '',
    fluid_intake: '',
    personal_care_provided: false,
    health_observations: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  const flashStyles = `
    @keyframes flash-red {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }
    @keyframes flash-blue {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 1; }
    }
    .flash-red {
      animation: flash-red 1s infinite;
    }
    .flash-blue {
      animation: flash-blue 1s infinite;
    }
    @keyframes gold-shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes trophy-glow {
      0%, 100% { filter: drop-shadow(0 0 4px rgba(234,179,8,0.4)); }
      50% { filter: drop-shadow(0 0 12px rgba(234,179,8,0.8)); }
    }
    .gold-shimmer {
      background: linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a, #fbbf24, #f59e0b);
      background-size: 200% auto;
      animation: gold-shimmer 3s linear infinite;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .trophy-glow {
      animation: trophy-glow 2s ease-in-out infinite;
    }
  `;

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  const { data: todayShifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ['todayShifts', today, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await ShiftApi.filter({ date: today, staff_id: user.id }, '-start_time', 200);
    },
    enabled: !!user?.id
  });

  const { data: todayClientCalls = [], isLoading: clientCallsLoading } = useQuery({
    queryKey: ['todayClientCalls', today, user?.id],
    queryFn: () => base44.entities.ClientCall.filter({ date: today }, '-call_time', 100),
    enabled: !!user?.id
  });

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.filter({ status: 'active' })
  });

  const { data: openIncidents = [] } = useQuery({
    queryKey: ['openIncidents'],
    queryFn: () => base44.entities.Incident.filter({ status: 'open' })
  });

  const { data: pendingLeave = [] } = useQuery({
    queryKey: ['pendingLeave'],
    queryFn: () => base44.entities.LeaveRequest.filter({ status: 'pending' })
  });

  // Shift swap requests where I'm the target and need to respond
  const { data: incomingSwapRequests = [] } = useQuery({
    queryKey: ['incomingSwapRequests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const all = await base44.entities.ShiftSwapRequest.filter({ swap_with_id: user.id, status: 'pending_target' });
      return all;
    },
    enabled: !!user?.id,
  });

  // Shift swap requests I've made (to show status)
  const { data: mySwapRequests = [] } = useQuery({
    queryKey: ['mySwapRequests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const all = await base44.entities.ShiftSwapRequest.filter({ requester_id: user.id });
      return all.filter(r => ['pending_target', 'pending_admin', 'accepted', 'declined', 'approved', 'rejected'].includes(r.status));
    },
    enabled: !!user?.id,
  });

  const [selectedSwapRequest, setSelectedSwapRequest] = useState(null);

  // Shift claim requests I've made
  const { data: myClaimRequests = [] } = useQuery({
    queryKey: ['myClaimRequests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return base44.entities.ShiftClaimRequest.filter({ staff_id: user.id });
    },
    enabled: !!user?.id,
  });

  // Pending claims for admin
  const { data: pendingClaimsAdmin = [] } = useQuery({
    queryKey: ['pendingClaims'],
    queryFn: () => base44.entities.ShiftClaimRequest.filter({ status: 'pending' }),
    enabled: isAdmin,
  });

  // Pending swap requests needing admin approval
  const { data: pendingSwapsAdmin = [] } = useQuery({
    queryKey: ['pendingSwapsAdmin'],
    queryFn: async () => {
      const all = await base44.entities.ShiftSwapRequest.filter({ status: 'pending_admin' });
      return all;
    },
    enabled: isAdmin,
  });

  const totalAdminTasks = (isAdmin ? pendingLeave.length + pendingClaimsAdmin.length + pendingSwapsAdmin.length : 0) + openIncidents.length;

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const convs = await base44.entities.Conversation.list();
      return convs;
    },
    enabled: !!user?.id,
    staleTime: 0
  });

  const unreadConversations = conversations.filter((conv) => {
    // Handle both object and number formats for unread_count
    let unreadCount = 0;
    if (typeof conv.unread_count === 'object' && conv.unread_count) {
      unreadCount = conv.unread_count[user?.id] || 0;
    } else if (typeof conv.unread_count === 'number') {
      unreadCount = conv.unread_count;
    }
    return unreadCount > 0;
  });

  // Subscribe to conversation and chat message updates
  useEffect(() => {
    if (!user?.id) return;

    const unsubscribeMessages = base44.entities.ChatMessage.subscribe((event) => {
      queryClient.invalidateQueries({
        queryKey: ['conversations', user?.id]
      });
    });

    const unsubscribeConvs = base44.entities.Conversation.subscribe(() => {
      queryClient.invalidateQueries({
        queryKey: ['conversations', user?.id]
      });
    });

    return () => {
      unsubscribeMessages();
      unsubscribeConvs();
    };
  }, [user?.id, queryClient]);

  const { data: unacknowledgedAnnouncements = [] } = useQuery({
    queryKey: ['unacknowledgedAnnouncements', user?.id],
    queryFn: async () => {
      const allAnnouncements = await base44.entities.Message.filter({ type: 'announcement' }, '-created_date', 100);
      const acknowledged = await base44.entities.AnnouncementAcknowledgement.filter({ staff_id: user?.id });
      const acknowledgedIds = acknowledged.map((a) => a.announcement_id);
      return allAnnouncements.filter((a) => !acknowledgedIds.includes(a.id));
    },
    enabled: !!user?.id
  });

  const { data: unreadNotifications = [] } = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () => {
      const all = await base44.entities.Notification.filter({ recipient_id: user?.id }, '-created_date', 50);
      return all.filter(n => !n.is_read);
    },
    enabled: !!user?.id
  });

  // Available shifts to claim in user's areas
  const { data: availableShifts = [] } = useQuery({
    queryKey: ['availableShifts', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return [];
      const myPerms = await base44.entities.RotaPermission.filter({ staff_id: user.id });
      const myAreaIds = myPerms.map(p => p.rota_area_id).filter(Boolean);
      if (myAreaIds.length === 0) return [];

      const { data, error } = await supabase
        .from('shifts')
        .select('id, date, start_time, end_time, shift_type, rota_area_id, area_id, shift_name')
        .is('staff_id', null)
        .eq('status', 'available_cover')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(50);
      if (error) throw error;

      const areaSet = new Set(myAreaIds);
      return (data || []).filter(s => areaSet.has(s.rota_area_id) || areaSet.has(s.area_id));
    },
    enabled: !!user?.id,
  });

  // Today's shift calls for this user (for task counts)
  const { data: myTodayShiftCalls = [] } = useQuery({
    queryKey: ['myShiftCalls', today, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('shift_calls')
        .select('id, tasks, service_user_id, service_user_name, call_type, scheduled_time, status')
        .eq('staff_id', user.id)
        .eq('call_date', today);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Next upcoming shift (for "Next Shift" tile)
  const { data: nextShift } = useQuery({
    queryKey: ['nextShift', user?.id, today],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('shifts')
        .select('id, date, start_time, end_time, shift_type, shift_name, status, rota_area_id')
        .eq('staff_id', user.id)
        .gte('date', today)
        .neq('status', 'completed')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Today's awards for the org
  const { data: todayAwards = [] } = useQuery({
    queryKey: ['todayAwards', today],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase.from('staff_awards').select('*');
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q
        .gte('created_at', today + 'T00:00:00')
        .lte('created_at', today + 'T23:59:59')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  // This month's awards (for star count + leaderboard)
  const { data: monthlyAwards = [] } = useQuery({
    queryKey: ['monthlyAwards', monthStart],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase.from('staff_awards').select('*');
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q
        .gte('created_at', monthStart + 'T00:00:00')
        .order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).filter(a => a.awarded_by_id !== a.recipient_id);
    },
  });

  // My star count this month (capped at 5)
  const myMonthlyStars = Math.min(5, monthlyAwards.filter(a => a.recipient_id === user?.id).length);

  // Monthly leaderboard
  const monthlyLeaderboard = React.useMemo(() => {
    const counts = {};
    monthlyAwards.forEach(a => {
      if (!counts[a.recipient_id]) {
        counts[a.recipient_id] = { name: a.recipient_name, count: 0 };
      }
      counts[a.recipient_id].count++;
    });
    return Object.entries(counts)
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => b.count - a.count);
  }, [monthlyAwards]);

  // My new awards (received, not self-sent)
  const myNewAwards = todayAwards.filter(a => a.recipient_id === user?.id && a.awarded_by_id !== user?.id);
  // Awards to display in popup (exclude self-sent, show only received)
  const displayAwards = todayAwards.filter(a => a.awarded_by_id !== user?.id);

  // Color gradient lookup for award emoji circles
  const AWARD_COLORS = {
    amber: 'from-amber-400 to-yellow-500',
    blue: 'from-blue-400 to-blue-600',
    emerald: 'from-emerald-400 to-emerald-600',
    rose: 'from-rose-400 to-rose-600',
    purple: 'from-purple-400 to-purple-600',
    cyan: 'from-cyan-400 to-cyan-600',
    orange: 'from-orange-400 to-orange-600',
    pink: 'from-pink-400 to-pink-600',
  };

  // Auto-show gold banner when user receives new awards
  const undismissedAwards = myNewAwards.filter(a => !dismissedAwardIds.includes(a.id));
  useEffect(() => {
    if (undismissedAwards.length > 0) {
      setShowAwardBanner(true);
    }
  }, [undismissedAwards.length]);

  // Toggle task completion
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ callId, tasks }) => {
      const { error } = await supabase
        .from('shift_calls')
        .update({ tasks })
        .eq('id', callId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myShiftCalls'] });
    },
  });

  const createCareLogMutation = useMutation({
    mutationFn: (data) => base44.entities.CareLog.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['careLogs'] });
      setShowCareLogDialog(false);
      setCareLogData({
        service_user_id: '',
        visit_date: today,
        visit_time: format(new Date(), 'HH:mm'),
        mood: '',
        food_intake: '',
        fluid_intake: '',
        personal_care_provided: false,
        health_observations: '',
        notes: ''
      });
    }
  });

  const completedShifts = todayShifts.filter((s) => s.status === 'completed').length;
  const inProgressShifts = todayShifts.filter((s) => s.status === 'in_progress').length;
  const scheduledShifts = todayShifts.filter((s) => s.status === 'scheduled').length;

  const myTodayShifts = todayShifts.filter((s) => s.staff_id === user?.id); // Filter to ensure only my shifts
  const myDelegatedClientCalls = user?.id ? todayClientCalls.filter((cc) =>
  Array.isArray(cc.assigned_staff_ids) && cc.assigned_staff_ids.includes(user.id) ||
  Array.isArray(cc.delegated_to) && cc.delegated_to.includes(user.id) ||
  cc.staff_id === user.id
  ) : [];

  return (
    <div className="space-y-6">
      <style>{flashStyles}</style>
      <div className="mb-6 text-center">
         <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
            Good Day {user?.staff_full_name || user?.full_name || 'there'}
          </h1>
         {/* Monthly award stars */}
         <div className="flex items-center justify-center gap-1 mt-1.5 cursor-pointer" onClick={() => setShowLeaderboard(true)}>
           {[1, 2, 3, 4, 5].map(i => (
             <Star key={i} className={`w-5 h-5 transition-all ${i <= myMonthlyStars ? 'text-amber-400 fill-amber-400 drop-shadow-sm' : 'text-slate-800 dark:text-slate-400'}`} strokeWidth={2} />
           ))}
           {myMonthlyStars > 0 && <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold ml-1">{myMonthlyStars}</span>}
         </div>
         <p className="text-slate-500 mt-1 text-sm sm:text-base">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
       </div>

      {/* Gold Award Notification Banner */}
      {showAwardBanner && undismissedAwards.length > 0 && (
        <div
          className="p-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 shadow-lg cursor-pointer animate-pulse hover:animate-none transition-all"
          onClick={() => {
            setShowAwardBanner(false);
            setDismissedAwardIds(prev => [...prev, ...undismissedAwards.map(a => a.id)]);
            setShowAwardsPopup(true);
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
              <span className="text-2xl">{undismissedAwards[0]?.emoji || '⭐'}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">You received an award!</p>
              <p className="text-xs text-amber-800">{undismissedAwards[0]?.title} from {undismissedAwards[0]?.awarded_by_name || 'Admin'}</p>
            </div>
            <span className="text-amber-900 font-bold text-xs">View &rarr;</span>
          </div>
        </div>
      )}

      {/* Unread Notifications & Announcements Banner */}
      {(unreadNotifications.length > 0 || unacknowledgedAnnouncements.length > 0) && (
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-teal-50 to-cyan-50 border-0 shadow-sm">
          <HelpTip tip="Important alerts and announcements that need your attention.">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Bell className="w-4 h-4 text-teal-600 flex-shrink-0" />
              You Have Updates
            </h3>
          </HelpTip>
          <div className="space-y-2">
            {unreadNotifications.length > 0 && (
              <Link to={createPageUrl('Messages')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <Bell className="w-5 h-5 text-teal-500" />
                  <span className="text-sm font-medium flex-1">
                    {unreadNotifications.length} unread notification{unreadNotifications.length > 1 ? 's' : ''}
                  </span>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-700 text-xs flex-shrink-0">View</Badge>
                </div>
              </Link>
            )}
            {unacknowledgedAnnouncements.length > 0 && (
              <Link to={createPageUrl('Messages')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium flex-1">
                    {unacknowledgedAnnouncements.length} announcement{unacknowledgedAnnouncements.length > 1 ? 's' : ''} to acknowledge
                  </span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs flex-shrink-0">Action Needed</Badge>
                </div>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Available Shifts to Claim */}
      {availableShifts.length > 0 && (
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Hand className="w-4 h-4 text-green-600 flex-shrink-0" />
            Cover Shifts Available
            <Badge variant="secondary" className="bg-green-500 text-white text-xs ml-auto">{availableShifts.length}</Badge>
          </h3>
          <div className="space-y-2">
            {Object.entries(
              availableShifts.reduce((acc, s) => {
                if (!acc[s.date]) acc[s.date] = [];
                acc[s.date].push(s);
                return acc;
              }, {})
            ).slice(0, 5).map(([date, shifts]) => (
              <Link key={date} to={createPageUrl('Rota')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <Calendar className="w-5 h-5 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {format(parseISO(date), 'EEE d MMM')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {shifts.length} shift{shifts.length > 1 ? 's' : ''} available
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs flex-shrink-0">Claim</Badge>
                </div>
              </Link>
            ))}
            {Object.keys(availableShifts.reduce((acc, s) => { acc[s.date] = true; return acc; }, {})).length > 5 && (
              <Link to={createPageUrl('Rota')}>
                <div className="text-center text-sm text-green-600 font-medium py-1">
                  View all available shifts
                </div>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Alerts Banner */}
      {totalAdminTasks > 0 &&
      <Card className="bg-gradient-to-br text-card-foreground p-4 rounded-md sm:p-5 from-amber-50 to-orange-50 border-0 shadow-sm">
          <HelpTip tip="Important alerts and announcements that need your attention.">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
              <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
              Attention Required
              <Badge variant="secondary" className="bg-red-500 text-white text-xs ml-auto">{totalAdminTasks}</Badge>
            </h3>
          </HelpTip>
          <div className="space-y-2">
            {openIncidents.length > 0 &&
          <Link to={createPageUrl('Incidents')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium flex-1">{openIncidents.length} open incident{openIncidents.length > 1 ? 's' : ''}</span>
                  <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs flex-shrink-0">{openIncidents.length}</Badge>
                </div>
              </Link>
          }
            {pendingLeave.length > 0 && isAdmin &&
          <Link to={createPageUrl('LeaveRequests')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium flex-1">{pendingLeave.length} pending leave request{pendingLeave.length > 1 ? 's' : ''}</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs flex-shrink-0">{pendingLeave.length}</Badge>
                </div>
              </Link>
          }
            {pendingClaimsAdmin.length > 0 && isAdmin &&
          <Link to={createPageUrl('RequestsManagement')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <Hand className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium flex-1">{pendingClaimsAdmin.length} pending shift claim{pendingClaimsAdmin.length > 1 ? 's' : ''}</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs flex-shrink-0">{pendingClaimsAdmin.length}</Badge>
                </div>
              </Link>
          }
            {pendingSwapsAdmin.length > 0 && isAdmin &&
          <Link to={createPageUrl('RequestsManagement')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium flex-1">{pendingSwapsAdmin.length} shift swap{pendingSwapsAdmin.length > 1 ? 's' : ''} awaiting approval</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs flex-shrink-0">{pendingSwapsAdmin.length}</Badge>
                </div>
              </Link>
          }
          </div>
        </Card>
      }

      {/* Incoming Shift Swap Requests — target staff needs to respond */}
      {incomingSwapRequests.length > 0 && (
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-yellow-50 to-amber-50 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <ArrowRightLeft className="w-4 h-4 text-yellow-600 flex-shrink-0" />
            Shift Swap Request{incomingSwapRequests.length > 1 ? 's' : ''}
          </h3>
          <div className="space-y-2">
            {incomingSwapRequests.map(swap => (
              <div
                key={swap.id}
                onClick={() => setSelectedSwapRequest(swap)}
                className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                <ArrowRightLeft className="w-5 h-5 text-yellow-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {swap.requester_name} wants to swap shifts with you
                  </p>
                  <p className="text-xs text-slate-500">{swap.shift_date} &bull; {swap.shift_time}</p>
                </div>
                <Badge className="bg-yellow-100 text-yellow-700 text-xs flex-shrink-0">Action Needed</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* My outgoing swap request status updates */}
      {mySwapRequests.filter(r => !['approved', 'rejected', 'declined'].includes(r.status)).length > 0 && (
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <ArrowRightLeft className="w-4 h-4 text-blue-600 flex-shrink-0" />
            Your Swap Requests
          </h3>
          <div className="space-y-2">
            {mySwapRequests.filter(r => !['approved', 'rejected', 'declined'].includes(r.status)).map(swap => (
              <div key={swap.id} className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
                <ArrowRightLeft className="w-5 h-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    Swap with {swap.swap_with_name} — {swap.shift_date}
                  </p>
                  <p className="text-xs text-slate-500">
                    {swap.status === 'pending_target' && `Awaiting ${swap.swap_with_name}'s response`}
                    {swap.status === 'pending_admin' && 'Accepted — awaiting admin approval'}
                    {swap.status === 'accepted' && 'Accepted — awaiting admin approval'}
                  </p>
                </div>
                <Badge className={`text-xs flex-shrink-0 ${
                  swap.status === 'pending_target' ? 'bg-orange-100 text-orange-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {swap.status === 'pending_target' ? 'Pending' : 'With Admin'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* My shift claim request status updates */}
      {myClaimRequests.filter(r => r.status === 'pending').length > 0 && (
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-purple-50 to-indigo-50 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Hand className="w-4 h-4 text-purple-600 flex-shrink-0" />
            Your Shift Claims
          </h3>
          <div className="space-y-2">
            {myClaimRequests.filter(r => r.status === 'pending').map(claim => (
              <div key={claim.id} className="flex items-center gap-3 p-3 bg-white/80 rounded-lg">
                <Hand className="w-5 h-5 text-purple-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {claim.shift_name || 'Shift'} — {claim.shift_date}
                  </p>
                  <p className="text-xs text-slate-500">
                    {claim.shift_time} &bull; Awaiting admin approval
                  </p>
                </div>
                <Badge className="bg-purple-100 text-purple-700 text-xs flex-shrink-0">Pending</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Shift Swap Response Modal */}
      {selectedSwapRequest && (
        <ShiftSwapResponseModal
          swapRequest={selectedSwapRequest}
          open={!!selectedSwapRequest}
          onClose={() => setSelectedSwapRequest(null)}
          currentUser={user}
        />
      )}

      {/* Chat Banner */}
      {unreadConversations.length > 0 &&
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
            Unread Messages
          </h3>
          <div className="space-y-2">
            {unreadConversations.slice(0, 2).map((conversation) =>
          <Link key={conversation.id} to={createPageUrl('Chat')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <Avatar name={conversation.participant_names?.[0]} size="xs" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {conversation.name || conversation.participant_names?.join(', ')}
                    </p>
                    <p className="text-xs text-slate-600 truncate">{conversation.unread_count?.[user?.id] || 0} unread message{conversation.unread_count?.[user?.id] > 1 ? 's' : ''}</p>
                  </div>
                </div>
              </Link>
          )}
          </div>
        </Card>
      }


      {/* Quick Actions */}
      <div>
        <HelpTip tip="Shortcuts to your most common tasks. These update based on your role and today's schedule.">
          <h3 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">Quick Actions</h3>
        </HelpTip>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[
            { to: 'Rota', label: 'Shifts', icon: Clock, bg: 'from-orange-400 to-orange-600' },
            { to: 'ClientManagement', label: 'Clients', icon: Heart, bg: 'from-teal-400 to-teal-600' },
            { to: 'Payroll', label: 'Payslips', icon: PoundSterling, bg: 'from-green-400 to-emerald-600' },
            { href: 'https://carecallai.co.uk/forum', label: 'Forum', icon: MessageSquare, bg: 'from-cyan-400 to-teal-600' },
            { to: 'ApprovalsAndFinancials', label: 'My Admin', icon: FileText, bg: 'from-indigo-400 to-indigo-600' },
            { to: 'Feedback', label: 'Feedback', icon: Star, bg: 'from-amber-400 to-yellow-500' },
            { to: 'AIAssistant', label: 'AI', icon: Bot, bg: 'from-purple-400 to-purple-600' },
          ].map(section => {
            const Icon = section.icon;
            const content = (
              <>
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-1.5 shadow-sm`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={1.8} />
                </div>
                <span className="text-xs font-semibold text-slate-700 text-center leading-tight">{section.label}</span>
              </>
            );
            const cls = "flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-3 sm:p-4 min-h-[90px] active:scale-95";
            if (section.href) {
              return (
                <a key={section.label} href={section.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {content}
                </a>
              );
            }
            return (
              <Link key={section.to} to={createPageUrl(section.to)} className={cls}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Overview */}
      <HelpTip tip="Your personal overview — next shift, today's visits, tasks, and staff awards.">
        <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Overview</h3>
      </HelpTip>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Next Shift */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Next Shift</span>
          </div>
          {nextShift ? (
            <div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {nextShift.date === today ? 'Today' : format(parseISO(nextShift.date), 'EEE d MMM')}
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                {(nextShift.start_time || '').slice(0, 5)} - {(nextShift.end_time || '').slice(0, 5)}
              </p>
              {nextShift.shift_name && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{nextShift.shift_name}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming shifts</p>
          )}
        </Card>

        {/* Today's Visits */}
        <Card className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 border-0 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
              <Heart className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Today's Visits</span>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{myTodayShiftCalls.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {myTodayShiftCalls.filter(c => c.status === 'completed').length} completed
          </p>
        </Card>

        {/* Today's Tasks */}
        <Card
          className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
          onClick={() => setShowTasksPopup(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
              <ListChecks className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tasks</span>
          </div>
          {(() => {
            const allTasks = myTodayShiftCalls.flatMap(c => (c.tasks || []).map(t => ({ ...t, callId: c.id, clientName: c.service_user_name })));
            const done = allTasks.filter(t => t.completed).length;
            return (
              <>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{allTasks.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {done} done{allTasks.length > 0 && <span className="text-purple-500 ml-1">Tap to view</span>}
                </p>
              </>
            );
          })()}
        </Card>

        {/* Staff Awards */}
        <Card
          className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] relative overflow-hidden"
          onClick={() => setShowAwardsPopup(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400 trophy-glow" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Awards</span>
          </div>
          <p className="text-3xl font-bold gold-shimmer">{displayAwards.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {myNewAwards.length > 0 ? (
              <span className="text-amber-600 font-semibold">{myNewAwards.length} for you!</span>
            ) : (
              'given today'
            )}
          </p>
          {myNewAwards.length > 0 && (
            <div className="absolute top-2 right-2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Shift Detail Modal */}
      {selectedShift &&
      <ShiftDetailModal
        shift={selectedShift}
        open={!!selectedShift}
        onClose={() => setSelectedShift(null)}
        isAdmin={isAdmin}
        userId={user?.id} />

      }

      {/* Tasks Popup */}
      <Dialog open={showTasksPopup} onOpenChange={setShowTasksPopup}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-purple-600" />
              Today's Tasks
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {myTodayShiftCalls.filter(c => c.tasks && c.tasks.length > 0).length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <ClipboardCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No tasks assigned today</p>
              </div>
            ) : (
              myTodayShiftCalls.filter(c => c.tasks && c.tasks.length > 0).map(call => (
                <div key={call.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{call.service_user_name || 'Client'}</span>
                    {call.scheduled_time && (
                      <Badge variant="outline" className="text-xs ml-auto">{(call.scheduled_time || '').slice(0, 5)}</Badge>
                    )}
                  </div>
                  <div className="space-y-1 pl-6">
                    {(call.tasks || []).map((task, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Checkbox
                          checked={!!task.completed}
                          onCheckedChange={(checked) => {
                            const updatedTasks = [...call.tasks];
                            updatedTasks[idx] = { ...updatedTasks[idx], completed: !!checked };
                            toggleTaskMutation.mutate({ callId: call.id, tasks: updatedTasks });
                          }}
                          className="mt-0.5"
                        />
                        <span className={`text-sm ${task.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {task.text || task}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Awards Popup */}
      <Dialog open={showAwardsPopup} onOpenChange={setShowAwardsPopup}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 trophy-glow" />
              <span className="gold-shimmer text-lg">Staff Awards Today</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {displayAwards.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Trophy className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No awards given today</p>
              </div>
            ) : (
              displayAwards.map(award => (
                <Card key={award.id} className={`p-4 border-0 shadow-sm ${award.recipient_id === user?.id ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 ring-2 ring-amber-300' : 'bg-white dark:bg-slate-900'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AWARD_COLORS[award.color] || AWARD_COLORS.amber} flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <span className="text-lg">{award.emoji || '⭐'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{award.recipient_name}</p>
                      <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">{award.title}</p>
                      {award.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">"{award.message}"</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <span>From {award.awarded_by_name || 'Admin'}</span>
                        <span>&bull;</span>
                        <span>{format(new Date(award.created_at), 'HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-blue-600 hover:bg-blue-50"
                      onClick={async () => {
                        const text = `${award.emoji || '⭐'} ${award.recipient_name} received a "${award.title}" award at CareCallAI! ${award.message || ''}`;
                        if (navigator.share) {
                          try {
                            await navigator.share({ title: 'Staff Award', text, url: window.location.origin });
                          } catch (e) { /* user cancelled */ }
                        } else {
                          // Desktop fallback — open WhatsApp web
                          const encoded = encodeURIComponent(text);
                          window.open(`https://wa.me/?text=${encoded}`, '_blank');
                        }
                      }}
                    >
                      <Share2 className="w-3 h-3 mr-1" /> Share
                    </Button>
                    <Link to={createPageUrl('Chat')}>
                      <Button size="sm" variant="ghost" className="text-xs text-teal-600 hover:bg-teal-50">
                        <MessageSquare className="w-3 h-3 mr-1" /> Send Message
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))
            )}
          </div>
          <div className="flex justify-center pt-1 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" variant="ghost" className="text-xs text-amber-600 hover:bg-amber-50" onClick={() => { setShowAwardsPopup(false); setShowLeaderboard(true); }}>
              <Trophy className="w-3.5 h-3.5 mr-1" /> Monthly Leaderboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monthly Leaderboard Popup */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500 trophy-glow" />
              <span className="gold-shimmer text-lg">Awards Leaderboard</span>
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1">{format(new Date(), 'MMMM yyyy')} &bull; Resets 1st of each month</p>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {monthlyLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Star className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">No awards this month yet</p>
              </div>
            ) : (
              monthlyLeaderboard.map((entry, idx) => (
                <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-lg ${idx === 0 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 ring-1 ring-amber-300' : idx === 1 ? 'bg-slate-50 dark:bg-slate-900' : idx === 2 ? 'bg-orange-50/50 dark:bg-orange-950/30' : 'bg-white dark:bg-slate-900'}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: idx === 0 ? 'linear-gradient(135deg, #f59e0b, #eab308)' : idx === 1 ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' : idx === 2 ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#e2e8f0', color: idx < 3 ? 'white' : '#64748b' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{entry.name}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.min(5, entry.count) ? 'text-amber-400 fill-amber-400' : 'text-slate-700 dark:text-slate-400'}`} strokeWidth={2} />
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold gold-shimmer">{entry.count}</p>
                    <p className="text-xs text-slate-400">award{entry.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-center pt-2">
            <Link to={createPageUrl('StaffAwards')}>
              <Button size="sm" variant="outline" className="text-xs">
                <Trophy className="w-3.5 h-3.5 mr-1" /> View All Awards
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* One-Off Care Log Dialog */}
       <Dialog open={showCareLogDialog} onOpenChange={setShowCareLogDialog}>
         <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quick Care Log Entry</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Service User *</label>
              <Select
                value={careLogData.service_user_id}
                onValueChange={(value) => setCareLogData({ ...careLogData, service_user_id: value })}>

                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select service user" />
                </SelectTrigger>
                <SelectContent>
                  {serviceUsers.map((su) =>
                  <SelectItem key={su.id} value={su.id}>
                      {su.full_name}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={careLogData.visit_date}
                  onChange={(e) => setCareLogData({ ...careLogData, visit_date: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />

              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Time</label>
                <input
                  type="time"
                  value={careLogData.visit_time}
                  onChange={(e) => setCareLogData({ ...careLogData, visit_time: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md text-sm" />

              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Mood</label>
                <Select
                  value={careLogData.mood}
                  onValueChange={(value) => setCareLogData({ ...careLogData, mood: value })}>

                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="happy">Happy</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="anxious">Anxious</SelectItem>
                    <SelectItem value="upset">Upset</SelectItem>
                    <SelectItem value="unwell">Unwell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Food</label>
                <Select
                  value={careLogData.food_intake}
                  onValueChange={(value) => setCareLogData({ ...careLogData, food_intake: value })}>

                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Fluids</label>
                <Select
                  value={careLogData.fluid_intake}
                  onValueChange={(value) => setCareLogData({ ...careLogData, fluid_intake: value })}>

                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="refused">Refused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={careLogData.personal_care_provided}
                onChange={(e) => setCareLogData({ ...careLogData, personal_care_provided: e.target.checked })}
                className="rounded" />

              <label className="text-sm text-slate-700">Personal care provided</label>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Health Observations</label>
              <Textarea
                value={careLogData.health_observations}
                onChange={(e) => setCareLogData({ ...careLogData, health_observations: e.target.value })}
                placeholder="Any health concerns or observations..."
                className="mt-1" />

            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Notes</label>
              <Textarea
                value={careLogData.notes}
                onChange={(e) => setCareLogData({ ...careLogData, notes: e.target.value })}
                placeholder="General notes about the visit..."
                className="mt-1" />

            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCareLogDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createCareLogMutation.mutate({
                ...careLogData,
                shift_id: '',
                staff_id: user?.id,
                staff_name: user?.full_name,
                service_user_name: serviceUsers.find((s) => s.id === careLogData.service_user_id)?.full_name,
                status: 'submitted',
                submitted_at: new Date().toISOString()
              })}
              disabled={!careLogData.service_user_id || createCareLogMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700">

              {createCareLogMutation.isPending ? 'Saving...' : 'Save Care Log'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>);

}
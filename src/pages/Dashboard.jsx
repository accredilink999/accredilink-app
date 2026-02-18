import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, isToday, parseISO, startOfWeek, endOfWeek } from 'date-fns';
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
  Hand } from
'lucide-react';
import ShiftSwapResponseModal from '@/components/rota/ShiftSwapResponseModal';

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [showCareLogDialog, setShowCareLogDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
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
  `;

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const isAdmin = user?.role === 'admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

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

  const totalAdminTasks = openIncidents.length + pendingLeave.length;

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
         <p className="text-slate-500 mt-1 text-sm sm:text-base">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
       </div>

      {/* Alerts Banner */}
      {(openIncidents.length > 0 || (pendingLeave.length > 0 && isAdmin) || (pendingClaimsAdmin.length > 0 && isAdmin)) &&
      <Card className="bg-gradient-to-br text-card-foreground p-4 rounded-md sm:p-5 from-amber-50 to-orange-50 border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
            Attention Required
          </h3>
          <div className="space-y-2">
            {openIncidents.length > 0 &&
          <Link to={createPageUrl('Incidents')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium">{openIncidents.length} open incident{openIncidents.length > 1 ? 's' : ''}</span>
                </div>
              </Link>
          }
            {pendingLeave.length > 0 && isAdmin &&
          <Link to={createPageUrl('LeaveRequests')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <FileText className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium">{pendingLeave.length} pending leave request{pendingLeave.length > 1 ? 's' : ''}</span>
                </div>
              </Link>
          }
            {pendingClaimsAdmin.length > 0 && isAdmin &&
          <Link to={createPageUrl('RequestsManagement')}>
                <div className="flex items-center gap-3 p-3 bg-white/80 rounded-lg hover:bg-white transition-colors">
                  <Hand className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium">{pendingClaimsAdmin.length} pending shift claim{pendingClaimsAdmin.length > 1 ? 's' : ''}</span>
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
      <Card className="bg-orange-200 text-card-foreground p-3 rounded-xl border sm:p-5 from-indigo-50 to-purple-50 border-indigo-200 shadow-sm hover:shadow-md transition-shadow">
        <h3 className="font-semibold text-slate-900 mb-4 text-sm sm:text-base">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <Link to={createPageUrl('Rota')} className="w-full">
            <Button
              variant="outline"
              className="w-full justify-center sm:justify-start h-auto py-4 sm:py-3 flex-col sm:flex-row text-xs sm:text-sm">

              <Clock className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 text-orange-600" />
              <span className="mt-1 sm:mt-0">Today's Shifts</span>
            </Button>
          </Link>


          <Link to={createPageUrl('ClientManagement')} className="w-full">
            <Button variant="outline" className="w-full justify-center sm:justify-start h-auto py-4 sm:py-3 flex-col sm:flex-row text-xs sm:text-sm">
              <Users className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 text-green-600" />
              <span className="mt-1 sm:mt-0">Clients</span>
            </Button>
          </Link>
          <Link to={createPageUrl('Incidents')} className="w-full">
            <Button variant="outline" className="w-full justify-center sm:justify-start h-auto py-4 sm:py-3 flex-col sm:flex-row text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 text-red-600" />
              <span className="mt-1 sm:mt-0">Report</span>
            </Button>
          </Link>
          <Link to={createPageUrl('AIAssistant')} className="w-full">
            <Button variant="outline" className="w-full justify-center sm:justify-start h-auto py-4 sm:py-3 flex-col sm:flex-row text-xs sm:text-sm">
              <Activity className="w-5 h-5 sm:w-4 sm:h-4 sm:mr-2 text-blue-600" />
              <span className="mt-1 sm:mt-0">AI</span>
            </Button>
          </Link>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <StatsCard
          title="Today's Visits"
          value={todayShifts.length}
          subtitle={`${completedShifts} completed`}
          icon={Calendar} />

        <StatsCard
          title="Active Clients"
          value={serviceUsers.length}
          icon={Users}
          iconClassName="bg-purple-50" />

        <StatsCard
          title="Open Incidents"
          value={openIncidents.length}
          icon={AlertTriangle}
          iconClassName={openIncidents.length > 0 ? "bg-red-50" : "bg-emerald-50"} />

        <StatsCard
          title="Pending Leave"
          value={pendingLeave.length}
          icon={FileText}
          iconClassName="bg-amber-50" />

      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Quick Actions & Alerts */}
        <div className="space-y-4">

        </div>
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
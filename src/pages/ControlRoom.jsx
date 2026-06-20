import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi, ShiftCallApi } from '@/api/rotaApi';
import { supabase } from '@/api/supabaseClient';
import { format } from 'date-fns';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation, Search, Check, AlertCircle, ChevronDown, Edit, Loader2, Mail, Clock, Plus, Users, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import CompanyLogoUploader from '@/components/CompanyLogoUploader';
import EmailNotificationCenter from '@/components/admin/EmailNotificationCenter';
import ShiftStatusOverview from '@/components/admin/ShiftStatusOverview';
import ShiftReminderSettings from '@/components/admin/ShiftReminderSettings';
import { Trash2 } from 'lucide-react';

export default function ControlRoom() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tracking');
  const [showLogoUploader, setShowLogoUploader] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.job_title === 'admin' || user?.job_title === 'manager' || user?.job_title === 'supervisor';

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 100),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: acknowledgements = [] } = useQuery({
    queryKey: ['acknowledgements'],
    queryFn: () => base44.entities.AnnouncementAcknowledgement.filter({}, '-acknowledged_at', 1000),
  });

  // Fetch today's shifts (all, not just active)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: todayShifts = [] } = useQuery({
    queryKey: ['todayShifts', todayStr],
    queryFn: () => ShiftApi.filter({ date: todayStr }),
    refetchInterval: 10000,
  });

  // Fetch ALL shift_calls for today's shifts
  const { data: todayCalls = [] } = useQuery({
    queryKey: ['todayCalls', todayShifts.map(s => s.id).join(',')],
    queryFn: async () => {
      if (todayShifts.length === 0) return [];
      const { data, error } = await supabase
        .from('shift_calls')
        .select('*')
        .in('shift_id', todayShifts.map(s => s.id))
        .neq('call_type', 'sitin_cover');
      if (error) throw error;
      return data || [];
    },
    enabled: todayShifts.length > 0,
    refetchInterval: 10000,
  });


  // Subscribe to shift_calls for real-time updates
  useEffect(() => {
    const unsubscribe = ShiftCallApi.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['todayCalls'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // Subscribe to shift updates
  useEffect(() => {
    const unsubscribe = ShiftApi.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['todayShifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftsToday'] });
      queryClient.invalidateQueries({ queryKey: ['allShifts'] });
      queryClient.invalidateQueries({ queryKey: ['shiftStatusData'] });
    });
    return unsubscribe;
  }, [queryClient]);

  const announcements = messages.filter(m => m.type === 'announcement' || m.type === 'weather_warning');

  const getAnnouncementStats = (announcementId) => {
    const acks = acknowledgements.filter(a => a.announcement_id === announcementId);
    const activeStaff = staff.filter(s => s.is_active);
    return {
      total: activeStaff.length,
      acknowledged: acks.length,
      pending: activeStaff.length - acks.length,
      details: acks
    };
  };

  const updateAnnouncementMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.update(editingAnnouncement.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setShowEditDialog(false);
      setEditingAnnouncement(null);
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  // Active staff: staff with shifts today who have activity in last hour
  const activeStaffList = React.useMemo(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const byStaff = new Map();

    for (const shift of todayShifts) {
      if (!shift.staff_id || shift.status === 'cancelled') continue;

      const shiftCalls = todayCalls.filter(c => c.shift_id === shift.id);
      const realCalls = shiftCalls.filter(c => c.call_type !== 'sitin_cover');
      const totalCalls = realCalls.length;
      const completedCalls = realCalls.filter(c => c.status === 'completed').length;
      const hasInProgress = realCalls.some(c => c.status === 'in_progress' && c.clock_in_time);

      const hasRecentActivity = shift.clock_in_time ||
        shiftCalls.some(c =>
          (c.clock_in_time && c.clock_in_time > oneHourAgo) ||
          (c.clock_out_time && c.clock_out_time > oneHourAgo)
        );

      const shouldShow = shift.status !== 'completed' && (hasRecentActivity || shift.status === 'in_progress' || shift.clock_in_time);
      if (!shouldShow) continue;

      let statusLabel = 'Scheduled';
      let statusColor = 'text-slate-500';
      if (shift.status === 'completed') {
        statusLabel = 'Completed';
        statusColor = 'text-green-600';
      } else if (hasInProgress) {
        statusLabel = 'On Call';
        statusColor = 'text-amber-600';
      } else if (shift.status === 'in_progress' || shift.clock_in_time) {
        statusLabel = 'On Shift';
        statusColor = 'text-blue-600';
      }

      if (byStaff.has(shift.staff_id)) {
        const existing = byStaff.get(shift.staff_id);
        existing.totalCalls += totalCalls;
        existing.completedCalls += completedCalls;
        // Keep the more active status
        const priority = { 'On Call': 3, 'On Shift': 2, 'Scheduled': 1 };
        if ((priority[statusLabel] || 0) > (priority[existing.statusLabel] || 0)) {
          existing.statusLabel = statusLabel;
          existing.statusColor = statusColor;
        }
        // Widen the time range
        if (shift.start_time < existing.start_time) existing.start_time = shift.start_time;
        if (shift.end_time > existing.end_time) existing.end_time = shift.end_time;
      } else {
        byStaff.set(shift.staff_id, {
          ...shift,
          totalCalls,
          completedCalls,
          statusLabel,
          statusColor,
          hasRecentActivity,
        });
      }
    }

    return Array.from(byStaff.values())
      .sort((a, b) => (a.staff_name || '').localeCompare(b.staff_name || ''));
  }, [todayShifts, todayCalls]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Control Room"
        subtitle="Staff monitoring & team overview"
        icon={Navigation}
        className="[&_h1]:text-slate-900 [&_svg]:text-slate-700 [&_svg]:fill-slate-700 flex-col sm:flex-row"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link to={createPageUrl('ClientManagement')}>
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all">
              <Users className="w-4 h-4 mr-2" />
              Clients
            </Button>
          </Link>
          {isAdmin && (
            <>
              <Link to={createPageUrl('RotaManagement')}>
                <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </Link>
              <Button
                onClick={() => setShowLogoUploader(!showLogoUploader)}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-sm whitespace-nowrap shadow-md hover:shadow-lg transition-all"
              >
                {showLogoUploader ? 'Hide' : 'Logo'}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {showLogoUploader && <CompanyLogoUploader />}

      {/* Tabs */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
        <button onClick={() => setActiveTab('tracking')} className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'tracking' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white hover:from-blue-500 hover:to-blue-600'}`}>
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Staff Status</span>
          <span className="sm:hidden">Staff</span>
        </button>
        <button onClick={() => setActiveTab('shifts')} className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'shifts' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : 'bg-gradient-to-r from-red-400 to-red-500 text-white hover:from-red-500 hover:to-red-600'}`}>
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Today's Shifts</span>
          <span className="sm:hidden">Shifts</span>
        </button>
        <button onClick={() => setActiveTab('announcements')} className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'announcements' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600'}`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Announcements</span>
          <span className="sm:hidden">Announce</span>
        </button>
        <button onClick={() => setActiveTab('email-settings')} className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'email-settings' ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white' : 'bg-gradient-to-r from-indigo-400 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-600'}`}>
          <Mail className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Email</span>
          <span className="sm:hidden">Mail</span>
        </button>
        {user?.role === 'super_admin' && (
          <button onClick={() => setActiveTab('radio-settings')} className={`flex items-center justify-center sm:justify-start gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg ${activeTab === 'radio-settings' ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white' : 'bg-gradient-to-r from-teal-400 to-teal-500 text-white hover:from-teal-500 hover:to-teal-600'}`}>
            <Radio className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Radio</span>
            <span className="sm:hidden">Radio</span>
          </button>
        )}
      </div>

      {activeTab === 'tracking' && isAdmin && (
      <div className="max-w-4xl space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Active Staff', value: activeStaffList.length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { label: 'On Call', value: activeStaffList.filter(s => s.statusLabel === 'On Call').length, color: 'bg-amber-50 text-amber-700 border-amber-100' },
            { label: 'On Shift', value: activeStaffList.filter(s => s.statusLabel === 'On Shift').length, color: 'bg-green-50 text-green-700 border-green-100' },
          ].map(stat => (
            <Card key={stat.label} className={`p-4 border ${stat.color} shadow-sm`}>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

        {/* Active Staff List */}
        <Card className="p-4 bg-white border-0 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Staff ({activeStaffList.length})
          </h3>
          {activeStaffList.length === 0 ? (
            <p className="text-sm text-slate-500">No active staff at the moment</p>
          ) : (
            <div className="space-y-2">
              {activeStaffList.map(shift => {
                const dotColor = shift.statusLabel === 'On Call' ? 'bg-amber-500 animate-pulse'
                  : shift.statusLabel === 'On Shift' ? 'bg-blue-500'
                  : 'bg-slate-300';
                return (
                  <div key={shift.staff_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{shift.staff_name}</p>
                        <p className="text-xs text-slate-500">{shift.shift_name} &middot; {shift.start_time}–{shift.end_time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-slate-600">{shift.completedCalls}/{shift.totalCalls} calls</span>
                      <span className={`text-xs font-medium ${shift.statusColor}`}>{shift.statusLabel}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
      )}

      {activeTab === 'shifts' && isAdmin && (
      <div className="space-y-6">
        <ShiftStatusOverview />
        <ShiftReminderSettings />
      </div>
      )}

      {activeTab === 'announcements' && (
      <div className="space-y-4">
        {/* Search */}
        <Card className="p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
        </Card>

        {/* Announcements Log */}
        <div className="space-y-2 sm:space-y-4">
          {announcements.filter(a =>
            a.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.content?.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((announcement) => {
            const stats = getAnnouncementStats(announcement.id);
            const isExpanded = expandedId === announcement.id;
            const pendingStaff = staff.filter(s =>
              s.is_active && !stats.details.some(a => a.staff_id === s.id)
            );

            return (
              <Card key={announcement.id} className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : announcement.id)}
                    className="w-full text-left p-3 sm:p-5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                            <h3 className="font-semibold text-sm sm:text-base text-slate-900 flex-1 break-words">
                              {announcement.title || 'Untitled'}
                            </h3>
                            <Badge variant={
                              announcement.priority === 'urgent' ? 'destructive' :
                              announcement.priority === 'high' ? 'secondary' : 'default'
                            } className="text-xs flex-shrink-0">
                              {announcement.priority === 'urgent' ? 'URGENT' : announcement.priority === 'high' ? 'HIGH' : 'NORMAL'}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 line-clamp-1">
                            {announcement.content}
                          </p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(announcement.created_date), 'dd MMM HH:mm')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingAnnouncement(announcement);
                                setShowEditDialog(true);
                              }}
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAnnouncementMutation.mutate(announcement.id);
                              }}
                              className="h-8 w-8 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 sm:gap-4 pt-2 sm:pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Check className="w-3 sm:w-4 h-3 sm:h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-slate-700">
                          {stats.acknowledged}/{stats.total}
                        </span>
                      </div>
                      {stats.pending > 0 && (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <AlertCircle className="w-3 sm:w-4 h-3 sm:h-4 text-amber-600 flex-shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-slate-700">
                            {stats.pending}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  </button>
                  </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 p-3 sm:p-5 bg-slate-50 space-y-4 sm:space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Acknowledged ({stats.acknowledged})
                      </h4>
                      {stats.details.length > 0 ? (
                        <div className="space-y-2">
                          {stats.details.sort((a, b) => new Date(b.acknowledged_at) - new Date(a.acknowledged_at)).map(ack => (
                            <div key={ack.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-emerald-100">
                              <div>
                                <p className="font-medium text-slate-900">{ack.staff_name}</p>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(ack.acknowledged_at), 'dd MMM yyyy • HH:mm')}
                                </p>
                              </div>
                              <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">No acknowledgements yet</p>
                      )}
                    </div>

                    {pendingStaff.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Pending Acknowledgement ({pendingStaff.length})
                        </h4>
                        <div className="space-y-2">
                          {pendingStaff.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                              <div>
                                <p className="font-medium text-slate-900">{s.full_name}</p>
                                <p className="text-xs text-slate-500 capitalize">{s.job_title?.replace(/_/g, ' ')}</p>
                              </div>
                              <Badge variant="outline" className="border-amber-300 text-amber-700">Pending</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
      )}

      {activeTab === 'email-settings' && isAdmin && (
        <EmailNotificationCenter />
      )}

      {activeTab === 'radio-settings' && user?.role === 'super_admin' && (
        <RadioSettingsPanel queryClient={queryClient} />
      )}

      {/* Edit Announcement Dialog */}
      {editingAnnouncement && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingAnnouncement.title || ''}
                  onChange={(e) => setEditingAnnouncement({...editingAnnouncement, title: e.target.value})}
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <Label>Content</Label>
                <Textarea
                  value={editingAnnouncement.content || ''}
                  onChange={(e) => setEditingAnnouncement({...editingAnnouncement, content: e.target.value})}
                  placeholder="Announcement content"
                  rows={4}
                />
              </div>

              <div>
                <Label>Priority</Label>
                <Select value={editingAnnouncement.priority || 'normal'} onValueChange={(value) => setEditingAnnouncement({...editingAnnouncement, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => updateAnnouncementMutation.mutate({
                  title: editingAnnouncement.title,
                  content: editingAnnouncement.content,
                  priority: editingAnnouncement.priority
                })}
                disabled={updateAnnouncementMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updateAnnouncementMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, disabled, color = 'teal' }) {
  const colors = {
    teal:   { on: 'bg-teal-500',   off: 'bg-slate-300' },
    amber:  { on: 'bg-amber-500',  off: 'bg-slate-300' },
    red:    { on: 'bg-red-500',    off: 'bg-slate-300' },
  };
  const c = colors[color] || colors.teal;
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-medium text-slate-900 text-sm">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={onChange}
        disabled={disabled}
        className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none shrink-0 ${checked ? c.on : c.off} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

function RadioSettingsPanel({ queryClient }) {
  const [saving, setSaving] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [testUser, setTestUser] = useState(null); // { email, password, name }
  const [copied, setCopied] = useState(false);

  const { data: currentUser } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['radioSettings'],
    queryFn: async () => {
      const { data } = await supabase.from('radio_settings').select('*').limit(1).single();
      return data;
    },
  });

  const upsert = async (patch) => {
    setSaving(true);
    const orgId = localStorage.getItem('organizationId') || sessionStorage.getItem('organizationId') || '';
    if (settings?.id) {
      await supabase.from('radio_settings').update(patch).eq('id', settings.id);
    } else {
      await supabase.from('radio_settings').insert({ ...patch, organization_id: orgId });
    }
    queryClient.invalidateQueries({ queryKey: ['radioSettings'] });
    setSaving(false);
  };

  const createTestUser = async () => {
    setCreatingTest(true);
    setTestUser(null);
    const password = 'RadioTest' + Math.floor(1000 + Math.random() * 9000) + '!';
    const email    = 'teststaff.radio@carecallai.co.uk';
    try {
      const result = await base44.functions.invoke('createStaffUser', {
        email,
        password,
        full_name: 'Test Staff (Radio)',
        job_title: 'care_worker',
        role: 'user',
      });
      if (result?.error) throw new Error(result.error);
      setTestUser({ name: 'Test Staff (Radio)', email, password });
    } catch (e) {
      // User might already exist — still show credentials they can use
      if (e.message?.includes('already') || e.message?.includes('exists')) {
        setTestUser({ name: 'Test Staff (Radio)', email, password: 'Already exists — check existing password or delete and recreate' });
      } else {
        import('sonner').then(({ toast }) => toast.error('Could not create test user: ' + e.message));
      }
    }
    setCreatingTest(false);
  };

  const copyCredentials = () => {
    if (!testUser) return;
    navigator.clipboard.writeText(`Name: ${testUser.name}\nEmail: ${testUser.email}\nPassword: ${testUser.password}\nLogin at: https://app.carecallai.co.uk`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 max-w-lg space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-teal-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">Team Radio Settings</h3>
          <p className="text-sm text-slate-500">Manage radio features and test tools</p>
        </div>
      </div>

      {/* Enable radio toggle */}
      <ToggleRow
        label="Enable Radio"
        description="Shows the radio icon in the bottom nav for all staff"
        checked={!!settings?.is_enabled}
        onChange={() => upsert({ is_enabled: !settings?.is_enabled })}
        disabled={saving || isLoading}
        color="teal"
      />

      {/* Test mode toggle */}
      <ToggleRow
        label="🧪 Test Mode"
        description="When ON — all radio alerts (All Call, P2P, SOS) only notify you (super admin). Safe to test without disturbing staff."
        checked={!!settings?.test_mode}
        onChange={() => upsert({ test_mode: !settings?.test_mode })}
        disabled={saving || isLoading}
        color="amber"
      />

      {settings?.test_mode && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Test Mode is ON.</strong> All radio notifications will only be sent to your account. Disable before going live.
          </p>
        </div>
      )}

      {/* Create test user */}
      <div className="border border-slate-200 rounded-xl p-4 space-y-3">
        <div>
          <p className="font-medium text-slate-900 text-sm">Test Staff Account</p>
          <p className="text-xs text-slate-500 mt-0.5">Creates a second login so you can test radio on a different device without involving real staff.</p>
        </div>

        {testUser ? (
          <div className="bg-slate-900 rounded-lg p-3 space-y-1 font-mono text-xs">
            <p className="text-green-400">✓ Account ready</p>
            <p className="text-slate-300">Name: <span className="text-white">{testUser.name}</span></p>
            <p className="text-slate-300">Email: <span className="text-white">{testUser.email}</span></p>
            <p className="text-slate-300">Password: <span className="text-white">{testUser.password}</span></p>
            <p className="text-slate-400 text-[10px] mt-1">Login at app.carecallai.co.uk on another device</p>
            <button
              onClick={copyCredentials}
              className="mt-2 px-3 py-1 bg-teal-600 text-white rounded text-xs font-sans font-semibold"
            >
              {copied ? '✓ Copied!' : 'Copy credentials'}
            </button>
          </div>
        ) : (
          <Button
            onClick={createTestUser}
            disabled={creatingTest}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm"
          >
            {creatingTest ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
            ) : (
              'Create Test Staff Account'
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Radio: <strong className={settings?.is_enabled ? 'text-teal-600' : 'text-slate-500'}>
          {isLoading ? 'Loading…' : settings?.is_enabled ? 'ENABLED' : 'DISABLED'}
        </strong>
        {settings?.test_mode && <span className="text-amber-600 ml-2">· TEST MODE ON</span>}
      </p>
    </Card>
  );
}

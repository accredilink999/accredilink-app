import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { usePullToRefresh } from '@/components/hooks/usePullToRefresh';

const playNotificationSound = (priority = 'normal') => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const frequencies = {
      critical: 800,
      high: 600,
      normal: 500,
      low: 400
    };
    
    const durations = {
      critical: 0.5,
      high: 0.3,
      normal: 0.2,
      low: 0.15
    };
    
    oscillator.frequency.value = frequencies[priority] || 500;
    oscillator.type = priority === 'critical' ? 'square' : 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + durations[priority]);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + durations[priority]);
  } catch (error) {
    console.error('Audio notification failed:', error);
  }
};
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';

import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Search, Info } from 'lucide-react';
import { 
          Plus, 
          Send, 
          Bell as BellIcon,
          Megaphone,
          Users,
          User,
          AlertCircle,
          Check,
          CheckCheck,
          Trash2,
          Check as CheckIcon,
          ChevronDown,
          Bell
        } from 'lucide-react';

export default function Messages() {
        const queryClient = useQueryClient();
        const urlParams = new URLSearchParams(window.location.search);
        const [activeTab, setActiveTab] = useState(urlParams.get('tab') || 'announcements');
        const [isDialogOpen, setIsDialogOpen] = useState(false);
        const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
        const [messageToDelete, setMessageToDelete] = useState(null);
        const [searchTerm, setSearchTerm] = useState('');
        const [expandedId, setExpandedId] = useState(null);
        const previousNotificationCountRef = useRef(0);
        const [formData, setFormData] = useState({
          type: 'announcement',
          title: '',
          content: '',
          priority: 'normal',
          recipient_id: ''
        });

        const { data: user } = useQuery({
          queryKey: ['currentUser'],
          queryFn: () => base44.auth.me(),
        });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 100),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: acknowledgements = [] } = useQuery({
    queryKey: ['acknowledgements'],
    queryFn: () => base44.entities.AnnouncementAcknowledgement.list('-acknowledged_at', 1000),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () => {
      if (!user?.id) return [];
      return base44.entities.Notification.filter({ recipient_id: user.id }, '-created_date', 100);
    },
    enabled: !!user?.id,
  });

  const [notificationFilter, setNotificationFilter] = useState('all');

  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.is_read).length;
    if (previousNotificationCountRef.current > 0 && unreadCount > previousNotificationCountRef.current) {
      const newNotification = notifications.find(n => !n.is_read);
      if (newNotification) {
        playNotificationSound(newNotification.priority);
      }
    }
    previousNotificationCountRef.current = unreadCount;
  }, [notifications]);

  useEffect(() => {
    const unsubscribeMessages = base44.entities.Message.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    });

    return unsubscribeMessages;
  }, [queryClient]);

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

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const message = await base44.entities.Message.create(data);
      // Auto-mark creator as acknowledged
      if (data.type === 'announcement') {
        await base44.entities.AnnouncementAcknowledgement.create({
          announcement_id: message.id,
          staff_id: user.id,
          staff_name: user.full_name,
          acknowledged_at: new Date().toISOString()
        });
      }

      // Send push notification to all staff for announcements and weather warnings
      if (data.type === 'announcement' || data.type === 'weather_warning') {
        // Weather warnings go to ALL staff including the creator (they need it on all devices)
        const activeStaff = data.type === 'weather_warning'
          ? staff.filter(s => s.is_active !== false)
          : staff.filter(s => s.is_active !== false && s.id !== user?.id);
        const recipientIds = activeStaff.map(s => s.id);
        console.log(`[Push] Sending ${data.type} push to ${recipientIds.length} recipients`);
        if (recipientIds.length > 0) {
          try {
            const isWeather = data.type === 'weather_warning';
            const result = await base44.functions.invoke('createNotification', {
              recipient_ids: recipientIds,
              type: data.type,
              title: isWeather
                ? `WEATHER WARNING: ${data.title || 'Severe Weather'}`
                : (data.title || 'Announcement'),
              message: data.content || '',
              priority: isWeather ? 'critical' : (data.priority || 'normal'),
              action_url: '/Messages',
              send_push: true,
            });
            console.log('[Push] createNotification result:', result);
          } catch (e) {
            console.warn('Push notification failed:', e);
          }
        }
      }

      return message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['unacknowledgedAnnouncements'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(variables.type === 'weather_warning' ? 'Weather warning sent!' : 'Alert sent!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send alert');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Message.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.refetchQueries({ queryKey: ['messages'], type: 'active' });
    },
  });

  React.useEffect(() => {
    const deleteExpiredWarnings = async () => {
      const expiredWarnings = messages.filter(msg =>
        msg.type === 'weather_warning' &&
        msg.warning_end &&
        new Date() > new Date(msg.warning_end)
      );

      for (const warning of expiredWarnings) {
        try {
          await base44.entities.Message.delete(warning.id);
        } catch (error) {
          console.error('Failed to delete expired warning:', error);
        }
      }
    };

    if (user?.id && messages.length > 0) {
      deleteExpiredWarnings();
    }

    // Check every minute for expired warnings
    const interval = setInterval(() => {
      if (user?.id && messages.length > 0) {
        deleteExpiredWarnings();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [messages, user?.id]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Message.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    },
  });

  const resetForm = () => {
    setFormData({
      type: 'announcement',
      title: '',
      content: '',
      priority: 'normal',
      recipient_id: '',
      met_office_level: '',
      warning_end: ''
    });
  };

  const handleSubmit = () => {
    // Clean empty strings to null for UUID/timestamp columns
    const cleaned = { ...formData };
    if (!cleaned.recipient_id) cleaned.recipient_id = null;
    if (!cleaned.warning_end) cleaned.warning_end = null;
    if (!cleaned.met_office_level) cleaned.met_office_level = null;

    createMutation.mutate({
        ...cleaned,
        sender_id: user?.id,
        sender_name: user?.staff_full_name || user?.full_name,
        read_by: [user?.id]
      });
  };

  const markAsRead = (message) => {
    if (!message.read_by?.includes(user?.id)) {
      updateMutation.mutate({
        id: message.id,
        data: {
          read_by: [...(message.read_by || []), user.id]
        }
      });
      toast.success('Acknowledged');
    }
  };

  const markNotificationAsRead = useMutation({
    mutationFn: (notificationId) => {
      return base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => {
      return base44.entities.Notification.delete(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllNotificationsAsRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      for (const notification of unread) {
        await base44.entities.Notification.update(notification.id, {
          is_read: true,
          read_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markAllAsRead = () => {
    const unreadMessages = messages.filter(msg => 
      !msg.read_by?.includes(user?.id)
    );
    unreadMessages.forEach(message => {
      updateMutation.mutate({
        id: message.id,
        data: {
          read_by: [...(message.read_by || []), user.id]
        }
      });
    });
  };

  const handleDelete = (message) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const cancelAllAlerts = () => {
    const activeWarnings = messages.filter(msg =>
      msg.type === 'weather_warning' && msg.priority === 'urgent' &&
      !msg.is_cancelled && !isWarningExpired(msg)
    );
    if (activeWarnings.length === 0) return;
    activeWarnings.forEach(message => {
      updateMutation.mutate({
        id: message.id,
        data: {
          is_cancelled: true,
          cancelled_by: user.id,
          cancelled_at: new Date().toISOString()
        }
      });
    });
    toast.success(`${activeWarnings.length} weather alert(s) cancelled`);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMutation.mutate(messageToDelete.id);
    }
  };

  const isWarningExpired = (warning) => {
    if (!warning.warning_end) return false;
    return new Date() > new Date(warning.warning_end);
  };

  const { containerRef } = usePullToRefresh(() => {
    queryClient.invalidateQueries({ queryKey: ['messages'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['acknowledgements'] });
  });

  const announcements = messages.filter(m => {
    if (m.type === 'weather_warning') return true;
    if (m.type === 'announcement' && !m.recipient_id) return true; // Broadcast announcements only
    return false;
  });
  
  const privateAnnouncements = messages.filter(m => {
    if (m.type === 'announcement' && m.recipient_id) {
      // Admin sees all private announcements, staff sees received ones
      return isAdmin ? true : m.recipient_id === user?.id;
    }
    return false;
  });

  const directMessages = messages.filter(m => 
    m.type === 'direct' && (m.sender_id === user?.id || m.recipient_id === user?.id)
  );

  const activeWeatherWarnings = messages.filter(msg =>
    msg.type === 'weather_warning' && msg.priority === 'urgent' &&
    !msg.is_cancelled && !isWarningExpired(msg)
  );

  const priorityStyles = {
    normal: '',
    high: 'border-l-4 border-l-amber-400',
    urgent: 'border-l-4 border-l-red-500 bg-red-50'
  };

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-6">
      <PageHeader 
        title="Messaging Centre" 
        subtitle="Manage announcements, alerts, and notifications"
        icon={BellIcon}
        className="[&_h1]:text-red-600 [&_svg]:text-red-600 [&_svg]:fill-red-600"
      />
      
      <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
         {isAdmin && (
           <>
             <Button onClick={() => setIsDialogOpen(true)} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm sm:text-base py-2 sm:py-3">
                   <Plus className="w-4 h-4 mr-2" />
                   New Alert
                 </Button>
                 {activeWeatherWarnings.length > 0 && (
                   <Button onClick={cancelAllAlerts} variant="outline" className="w-full border-red-600 text-red-600 hover:bg-red-50 text-sm py-2 sm:py-3">
                     <CheckCheck className="w-4 h-4 mr-2" />
                     Cancel Alerts
                   </Button>
                 )}
           </>
         )}

       </div>

      <div className="bg-gradient-to-r from-red-100 to-orange-100 border-b-2 border-red-200 w-full grid grid-cols-2 h-auto p-1 shadow-sm rounded-lg">
        <button 
          onClick={() => setActiveTab('announcements')}
          className={`flex flex-col sm:flex-row items-center gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-md transition-colors ${activeTab === 'announcements' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
        >
          <Megaphone className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Announcements</span>
          <span className="sm:hidden">Alerts</span>
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`flex flex-col sm:flex-row items-center gap-1 flex-1 text-xs sm:text-sm py-2 sm:py-3 rounded-md transition-colors ${activeTab === 'notifications' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
        >
          <Bell className="w-4 h-4 flex-shrink-0" />
          <span className="hidden sm:inline">Notifications</span>
          <span className="sm:hidden">Notifications</span>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <span className="text-xs bg-red-500 text-white rounded-full px-1.5 ml-1">{notifications.filter(n => !n.is_read).length}</span>
          )}
        </button>

      </div>

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div className="mt-4 sm:mt-6">
           {isLoading ? (
             <div className="space-y-2 sm:space-y-3">
               {[1, 2, 3].map(i => (
                 <Card key={i} className="p-3 sm:p-4 h-20 sm:h-24 animate-pulse bg-slate-100" />
               ))}
             </div>
           ) : announcements.length === 0 ? (
             <EmptyState
               icon={Megaphone}
               title="No announcements"
               description="Team announcements will appear here."
             />
           ) : (
             <div className="space-y-2 sm:space-y-3">
               {announcements.map((message) => {
                 const isRead = message.read_by?.includes(user?.id);
                 const isExpired = isWarningExpired(message);
                 const isCancelled = message.is_cancelled;
                 const isExpanded = expandedId === message.id;
                 return (
                   <Card
                     key={message.id}
                     onClick={() => setExpandedId(isExpanded ? null : message.id)}
                     className={`p-3 sm:p-4 bg-white border-0 shadow-sm cursor-pointer transition-all hover:shadow-md ${isCancelled ? 'opacity-60 bg-slate-100' : isExpired ? 'opacity-60 bg-slate-100' : priorityStyles[message.priority]} ${!isRead && !isExpired && !isCancelled ? 'ring-2 ring-teal-100' : ''}`}
                   >
                     <div className="space-y-2">
                       <div className="flex items-start gap-2 sm:gap-4">
                         <div className="flex-shrink-0">
                           <Avatar name={message.sender_name} size="sm" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2">
                             <div className="flex-1 min-w-0">
                               {message.title && (
                                 <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate">{message.title}</h3>
                               )}
                               <p className="text-xs sm:text-sm text-slate-500">
                                 {message.sender_name} • {format(new Date(message.created_date), 'dd MMM HH:mm')}
                                 {isExpired && <span className="ml-2 text-amber-600 font-medium">Expired</span>}
                                 {isCancelled && <span className="ml-2 text-slate-600 font-medium">Cancelled</span>}
                               </p>
                             </div>
                             <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                               {message.priority === 'urgent' && !isCancelled && (
                                 <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0">
                                   <AlertCircle className="w-3 h-3" />
                                   <span className="hidden sm:inline">Urgent</span>
                                 </span>
                               )}
                               {!isRead && !isCancelled && !isExpired && (
                                 <Button
                                   size="sm"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     markAsRead(message);
                                   }}
                                   className="bg-teal-600 hover:bg-teal-700 text-white h-7 px-2 sm:h-8 sm:px-3 flex-shrink-0"
                                   title="Mark as read"
                                 >
                                   <Check className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                                   <span className="text-xs sm:text-sm">Acknowledge</span>
                                 </Button>
                               )}
                               {isRead && (
                                 <CheckCheck className="w-3 sm:w-4 h-3 sm:h-4 text-teal-500 flex-shrink-0" />
                               )}
                               {isAdmin && (
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDelete(message);
                                   }}
                                 >
                                   <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                                 </Button>
                               )}
                             </div>
                           </div>
                         </div>
                       </div>
                       {!isExpanded && (
                         <>
                           <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap line-clamp-2">{message.content}</p>
                           <p className="text-xs text-teal-600 font-medium flex items-center gap-1">
                             <ChevronDown className="w-3 h-3" /> Tap to read full {message.type === 'weather_warning' ? 'warning' : 'message'}
                           </p>
                         </>
                       )}
                       {isExpanded && (
                         <div className="space-y-3 border-t pt-3">
                           <div className="bg-white bg-opacity-50 p-3 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                             {message.content}
                           </div>
                           {isAdmin && message.type === 'announcement' && (
                             <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                               {(() => {
                                 const stats = getAnnouncementStats(message.id);
                                 return (
                                   <>
                                     <div className="flex gap-4 text-xs font-medium">
                                       <div>
                                         <span className="text-slate-600">Acknowledged: </span>
                                         <span className="text-teal-600 font-bold">{stats.acknowledged}/{stats.total}</span>
                                       </div>
                                       {stats.pending > 0 && (
                                         <div>
                                           <span className="text-slate-600">Pending: </span>
                                           <span className="text-amber-600 font-bold">{stats.pending}</span>
                                         </div>
                                       )}
                                     </div>
                                     {stats.details.length > 0 && (
                                       <div className="text-xs space-y-1">
                                         <p className="text-slate-600 font-medium">Acknowledged by:</p>
                                         {stats.details.map((ack, idx) => (
                                           <p key={idx} className="text-slate-700">{ack.staff_name} • {format(new Date(ack.acknowledged_at), 'dd MMM HH:mm')}</p>
                                         ))}
                                       </div>
                                     )}
                                   </>
                                 );
                               })()}
                             </div>
                           )}
                           {isAdmin && message.type === 'weather_warning' && (
                             <div className="bg-slate-50 p-3 rounded-lg space-y-2">
                               <div className="flex gap-4 text-xs font-medium">
                                 <div>
                                   <span className="text-slate-600">Acknowledged: </span>
                                   <span className="text-teal-600 font-bold">
                                     {message.read_by?.length || 0}/{staff.filter(s => s.is_active).length}
                                   </span>
                                 </div>
                               </div>
                               {message.read_by?.length > 0 && (
                                 <div className="text-xs space-y-1">
                                   <p className="text-slate-600 font-medium">Acknowledged by:</p>
                                   {message.read_by.map((uid, idx) => {
                                     const s = staff.find(st => st.id === uid);
                                     return (
                                       <p key={idx} className="text-slate-700">{s?.staff_full_name || s?.full_name || uid}</p>
                                     );
                                   })}
                                 </div>
                               )}
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                   </Card>
                   );
                   })}
                   </div>
                   )}
                   </div>
                   )}

                   {/* Notifications Tab */}
                   {activeTab === 'notifications' && (
                   <div className="mt-4 sm:mt-6">
                     {/* Search & Filter */}
                     <Card className="p-3 sm:p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-sm mb-4 sm:mb-6 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <select
                  value={notificationFilter}
                  onChange={(e) => setNotificationFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                >
                  <option value="all">All Types</option>
                  <option value="message">Messages</option>
                  <option value="task_assigned">Tasks</option>
                  <option value="leave_approval">Leave Approvals</option>
                  <option value="incident_report">Incidents</option>
                  <option value="critical_update">Critical Updates</option>
                  <option value="shift_reminder">Shift Reminders</option>
                  <option value="announcement">Announcements</option>
                </select>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <Button
                    onClick={() => markAllNotificationsAsRead.mutate()}
                    disabled={markAllNotificationsAsRead.isPending}
                    variant="outline"
                    className="w-full text-xs sm:text-sm"
                  >
                    <Check className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                    Mark all as read
                  </Button>
                )}
              </Card>

              {/* Notifications List */}
              {notifications.length === 0 && privateAnnouncements.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="No notifications"
                  description="You're all caught up!"
                />
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {/* Private Announcements Section */}
                  {privateAnnouncements.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-700 px-2">Private Announcements</h3>
                      {privateAnnouncements.map(announcement => {
                        const isRead = announcement.read_by?.includes(user?.id);
                        return (
                          <Card 
                            key={announcement.id}
                            className={`p-3 sm:p-4 border-0 shadow-sm bg-purple-50 border-l-4 border-l-purple-400 ${!isRead ? 'ring-2 ring-teal-100' : ''}`}
                          >
                            <div className="flex items-start gap-2 sm:gap-4">
                              <Avatar name={announcement.sender_name} size="sm" />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 mb-2">
                                  <div className="flex-1 min-w-0">
                                    {announcement.title && (
                                      <h3 className="font-semibold text-sm sm:text-base text-slate-900">{announcement.title}</h3>
                                    )}
                                    <p className="text-xs sm:text-sm text-slate-600">{announcement.sender_name} • {format(new Date(announcement.created_date), 'dd MMM HH:mm')}</p>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge className="bg-purple-100 text-purple-800">Private</Badge>
                                    {!isRead && (
                                      <Button
                                        size="sm"
                                        onClick={() => markAsRead(announcement)}
                                        className="bg-teal-600 hover:bg-teal-700 text-white h-7 px-2 sm:h-8 sm:px-3 text-xs sm:text-sm"
                                      >
                                        <Check className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                                        Acknowledge
                                      </Button>
                                    )}
                                    {isRead && <CheckCheck className="w-4 h-4 text-teal-500" />}
                                  </div>
                                </div>
                                <p className="text-xs sm:text-sm text-slate-700">{announcement.content}</p>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Regular Notifications */}
                  {notifications.filter(n => {
                    const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                         n.message.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesFilter = notificationFilter === 'all' || n.type === notificationFilter;
                    return matchesSearch && matchesFilter;
                  }).length > 0 && (
                    <div className="space-y-2">
                      {notifications.length > 0 && privateAnnouncements.length > 0 && (
                        <h3 className="text-sm font-semibold text-slate-700 px-2">System Notifications</h3>
                      )}
                      {notifications.filter(n => {
                        const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                             n.message.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesFilter = notificationFilter === 'all' || n.type === notificationFilter;
                        return matchesSearch && matchesFilter;
                      }).map(notification => {
                    const priorityStyles = {
                      low: 'bg-blue-50 border-l-4 border-l-blue-400',
                      normal: 'bg-white',
                      high: 'bg-yellow-50 border-l-4 border-l-yellow-400',
                      critical: 'bg-red-50 border-l-4 border-l-red-500',
                    };

                    const priorityColors = {
                      low: 'bg-blue-100 text-blue-800',
                      normal: 'bg-slate-100 text-slate-800',
                      high: 'bg-yellow-100 text-yellow-800',
                      critical: 'bg-red-100 text-red-800',
                    };

                    return (
                      <Card 
                        key={notification.id}
                        className={`p-3 sm:p-4 border-0 shadow-sm ${priorityStyles[notification.priority]} ${!notification.is_read ? 'ring-2 ring-teal-100' : ''}`}
                      >
                        <div className="flex items-start gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-2 mb-2">
                              <h3 className="font-semibold text-sm sm:text-base text-slate-900">{notification.title}</h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={priorityColors[notification.priority]}>
                                  {notification.priority}
                                </Badge>
                                <Badge variant="outline">{notification.type.replace(/_/g, ' ')}</Badge>
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 mb-2">{notification.message}</p>
                            <p className="text-xs text-slate-500">
                              {format(new Date(notification.created_date), 'dd MMM HH:mm')}
                            </p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {!notification.is_read && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markNotificationAsRead.mutate(notification.id)}
                                disabled={markNotificationAsRead.isPending}
                                className="h-7 w-7 p-0"
                                title="Mark as read"
                              >
                                <Check className="w-3 sm:w-4 h-3 sm:h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteNotificationMutation.mutate(notification.id)}
                              disabled={deleteNotificationMutation.isPending}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}



      {/* New Alert Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>New Alert</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 overflow-y-auto flex-1">
            <div>
              <Label>Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">Announcement (All Staff)</SelectItem>
                  <SelectItem value="weather_warning">Weather Warning</SelectItem>
                  <SelectItem value="direct">Direct Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'direct' && (
              <div>
                <Label>Recipient</Label>
                <Select 
                  value={formData.recipient_id} 
                  onValueChange={(value) => setFormData(prev => ({...prev, recipient_id: value}))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.filter(s => s.id !== user?.id).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.staff_full_name || s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(formData.type === 'announcement' || formData.type === 'weather_warning') && (
              <>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                    placeholder="Message title"
                  />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({...prev, priority: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.type === 'weather_warning' ? (
                        <>
                          <SelectItem value="normal">Low</SelectItem>
                          <SelectItem value="high">Medium</SelectItem>
                          <SelectItem value="urgent">High</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

              </>
            )}

            <div>
              <Label>Message *</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
                placeholder="Write your message..."
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.content || (formData.type === 'direct' && !formData.recipient_id) || createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Sending...' : 'Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Alert</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to delete this alert? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
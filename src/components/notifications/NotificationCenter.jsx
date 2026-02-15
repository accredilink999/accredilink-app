import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Bell, Check, Trash2, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationCenter({ userId }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => base44.entities.Notification.filter({ recipient_id: userId }, '-created_date', 100),
    enabled: !!userId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => {
      return base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => {
      return base44.entities.Notification.delete(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const markAllAsReadMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      for (const notification of notifications) {
        await base44.entities.Notification.delete(notification.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || n.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const priorityColors = {
    low: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200',
    normal: 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200',
    high: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200',
    critical: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200',
  };

  const priorityBadgeColors = {
    low: 'bg-blue-100 text-blue-800',
    normal: 'bg-purple-100 text-purple-800',
    high: 'bg-amber-100 text-amber-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notification Center</h2>
          <p className="text-slate-500">You have {unreadCount} unread notifications</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => clearAllMutation.mutate()}
              disabled={clearAllMutation.isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-indigo-300 rounded-lg text-sm font-medium bg-white hover:bg-indigo-50 transition-colors"
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
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
          <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No notifications to display</p>
        </Card>
      ) : (
        <div className="space-y-3">
           {filtered.map((notification, idx) => (
             <div key={notification.id}>
               <Card 
                 onClick={() => setExpandedId(expandedId === notification.id ? null : notification.id)}
                 className={`p-4 border cursor-pointer transition-all hover:shadow-lg ${priorityColors[notification.priority]}`}
               >
                 <div className="flex items-start justify-between gap-4">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-semibold text-slate-900">{notification.title}</h3>
                       {!notification.is_read && (
                         <div className="w-2 h-2 rounded-full bg-teal-500" />
                       )}
                       <Badge className={priorityBadgeColors[notification.priority]}>
                         {notification.priority}
                       </Badge>
                       <Badge variant="outline">{notification.type.replace(/_/g, ' ')}</Badge>
                     </div>
                     <p className="text-sm text-slate-700 mb-2">{notification.message}</p>
                     {expandedId === notification.id && notification.description && (
                       <div className="bg-white bg-opacity-50 p-3 rounded-lg mt-3 mb-2 text-sm text-slate-700 whitespace-pre-wrap">
                         {notification.description}
                       </div>
                     )}
                     {expandedId === notification.id && notification.details && (
                       <div className="bg-white bg-opacity-50 p-3 rounded-lg mt-3 mb-2 text-sm space-y-2">
                         {typeof notification.details === 'string' ? (
                           <p className="whitespace-pre-wrap text-slate-700">{notification.details}</p>
                         ) : (
                           Object.entries(notification.details).map(([key, value]) => (
                             <div key={key} className="flex justify-between">
                               <span className="font-medium text-slate-600">{key}:</span>
                               <span className="text-slate-900">{String(value)}</span>
                             </div>
                           ))
                         )}
                       </div>
                     )}
                     <p className="text-xs text-slate-500">
                       {formatDistanceToNow(new Date(notification.created_date), { addSuffix: true })}
                     </p>
                   </div>
                   <div className="flex gap-2 flex-shrink-0">
                     {!notification.is_read && (
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={(e) => {
                           e.stopPropagation();
                           markAsReadMutation.mutate(notification.id);
                         }}
                         disabled={markAsReadMutation.isPending}
                       >
                         <Check className="w-4 h-4" />
                       </Button>
                     )}
                     <Button
                       size="sm"
                       variant="outline"
                       onClick={(e) => {
                         e.stopPropagation();
                         deleteNotificationMutation.mutate(notification.id);
                       }}
                       disabled={deleteNotificationMutation.isPending}
                       className="text-red-600 hover:text-red-700"
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                 </div>
               </Card>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
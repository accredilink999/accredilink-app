import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCircle2, XCircle, Clock, TrendingUp, Smartphone } from 'lucide-react';
import { format } from 'date-fns';

export default function PushNotificationDashboard() {
  const [timeRange, setTimeRange] = useState('7d');

  const { data: logs = [] } = useQuery({
    queryKey: ['pushLogs', timeRange],
    queryFn: () => base44.entities.PushNotificationLog.list('-created_date', 500)
  });

  const { data: users = [] } = useQuery({
    queryKey: ['usersWithTokens'],
    queryFn: () => base44.entities.User.list()
  });

  // Calculate statistics
  const totalSent = logs.length;
  const delivered = logs.filter(l => l.status === 'delivered').length;
  const failed = logs.filter(l => l.status === 'failed').length;
  const opened = logs.filter(l => l.status === 'opened').length;
  
  const deliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(1) : 0;
  const openRate = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : 0;

  const iosUsers = users.filter(u => u.apns_device_token).length;
  const androidUsers = users.filter(u => u.firebase_messaging_token).length;
  const totalWithPush = users.filter(u => u.apns_device_token || u.firebase_messaging_token).length;

  const platformStats = {
    ios: logs.filter(l => l.platform === 'ios').length,
    android: logs.filter(l => l.platform === 'android').length,
    web: logs.filter(l => l.platform === 'web').length
  };

  const statusColors = {
    sent: 'bg-blue-100 text-blue-800',
    delivered: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    opened: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Push Notification Analytics</h2>
        <p className="text-slate-500">Monitor delivery and engagement metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Sent</p>
                <p className="text-2xl font-bold text-slate-900">{totalSent}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Delivery Rate</p>
                <p className="text-2xl font-bold text-green-600">{deliveryRate}%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Open Rate</p>
                <p className="text-2xl font-bold text-purple-600">{openRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Users w/ Push</p>
                <p className="text-2xl font-bold text-slate-900">{totalWithPush}</p>
              </div>
              <Smartphone className="w-8 h-8 text-teal-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Platform Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">iOS (APNS)</span>
                <div className="flex items-center gap-2">
                  <Badge>{iosUsers} users</Badge>
                  <Badge variant="outline">{platformStats.ios} sent</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Android (FCM)</span>
                <div className="flex items-center gap-2">
                  <Badge>{androidUsers} users</Badge>
                  <Badge variant="outline">{platformStats.android} sent</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Web Push</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{platformStats.web} sent</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Delivered</span>
                <Badge className="bg-green-100 text-green-800">
                  {delivered} ({deliveryRate}%)
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Opened</span>
                <Badge className="bg-purple-100 text-purple-800">
                  {opened} ({openRate}%)
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Failed</span>
                <Badge className="bg-red-100 text-red-800">{failed}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Push Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.slice(0, 20).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    Notification #{log.notification_id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(new Date(log.sent_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{log.platform}</Badge>
                  <Badge className={statusColors[log.status]}>
                    {log.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
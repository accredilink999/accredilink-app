import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Volume2, Settings, BarChart3, Book, Key, SlidersHorizontal } from 'lucide-react';
import NotificationSettingsAdmin from '@/components/admin/NotificationSettingsAdmin';
import NotificationSoundManager from '@/components/admin/NotificationSoundManager';
import NotificationRulesManager from '@/components/admin/NotificationRulesManager';
import PushNotificationDashboard from '@/components/admin/PushNotificationDashboard';
import NotificationSetupGuide from '@/components/notifications/NotificationSetupGuide';
import PushCredentialsManager from '@/components/admin/PushCredentialsManager';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function PushNotificationManagement() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Push Notification System"
        subtitle="Manage notifications, sounds, and delivery settings"
        icon={Bell}
      />

      <Tabs defaultValue="credentials" className="space-y-6">
        <TabsList className="w-full grid grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="credentials" className="flex flex-col items-center gap-1 px-1 py-2 text-xs">
            <Key className="w-4 h-4 flex-shrink-0" />
            <span className="truncate w-full text-center">Creds</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex flex-col items-center gap-1 px-1 py-2 text-xs">
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span className="truncate w-full text-center">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="sounds" className="flex flex-col items-center gap-1 px-1 py-2 text-xs">
            <Volume2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate w-full text-center">Sounds</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex flex-col items-center gap-1 px-1 py-2 text-xs">
            <BarChart3 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate w-full text-center">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="flex flex-col items-center gap-1 px-1 py-2 text-xs">
            <Book className="w-4 h-4 flex-shrink-0" />
            <span className="truncate w-full text-center">Guide</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="credentials">
          <PushCredentialsManager />
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettingsAdmin />
        </TabsContent>

        <TabsContent value="sounds">
          <div className="space-y-8">
            {/* Sound Library — built-in presets + uploaded sounds */}
            <NotificationSoundManager />

            {/* Event Rules — assign sounds to each event type */}
            <Card className="border-l-4 border-l-violet-500">
              <CardContent className="p-5">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-violet-600" />
                  Assign Sounds to Events
                </h3>
                <NotificationRulesManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <PushNotificationDashboard />
        </TabsContent>

        <TabsContent value="guide">
          <NotificationSetupGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}
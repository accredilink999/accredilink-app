import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Mail, Settings, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const NOTIFICATION_TYPES = [
  { id: 'new_message', label: 'New Messages', category: 'Communications' },
  { id: 'group_message', label: 'Group Messages', category: 'Communications' },
  { id: 'announcement', label: 'Announcements', category: 'Communications' },
  { id: 'urgent_alert', label: 'Urgent Alerts', category: 'Alerts' },
  { id: 'weather_warning', label: 'Weather Warnings', category: 'Alerts' },
  { id: 'incident_notification', label: 'Incident Notifications', category: 'Alerts' },
  { id: 'shift_reminder', label: 'Shift Reminders', category: 'Schedule' },
  { id: 'leave_decision', label: 'Leave Decisions', category: 'HR' },
  { id: 'incident_report', label: 'Incident Reports', category: 'Compliance' },
  { id: 'care_plan_review', label: 'Care Plan Reviews', category: 'Care' },
  { id: 'training_reminder', label: 'Training Reminders', category: 'Training' },
  { id: 'course_reminder', label: 'Course Reminders', category: 'Training' },
  { id: 'compliance_reminder', label: 'Compliance Reminders', category: 'Compliance' },
  { id: 'general_notification', label: 'General Notifications', category: 'General' },
];

export default function EmailNotificationCenter() {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [editingSettings, setEditingSettings] = useState(null);
  const queryClient = useQueryClient();

  const { data: emailSettings = [], isLoading } = useQuery({
    queryKey: ['emailNotificationSettings'],
    queryFn: () => base44.entities.EmailNotificationSetting.list(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const existing = emailSettings.find(s => s.notification_type === data.notification_type);
      if (existing) {
        return base44.entities.EmailNotificationSetting.update(existing.id, data);
      } else {
        return base44.entities.EmailNotificationSetting.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emailNotificationSettings'] });
      toast.success('Email settings updated');
      setEditingSettings(null);
    },
  });

  const getNotificationSetting = (notificationType) => {
    return emailSettings.find(s => s.notification_type === notificationType) || {};
  };

  const groupedNotifications = NOTIFICATION_TYPES.reduce((acc, notif) => {
    if (!acc[notif.category]) acc[notif.category] = [];
    acc[notif.category].push(notif);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="p-6 text-center text-slate-500">Loading email settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Mail className="w-6 h-6 text-teal-600" />
          Email Notification Center
        </h2>
        <p className="text-slate-600">Configure which notifications are sent via email to users</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Detailed Settings</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="quiet-hours">Quiet Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedNotifications).map(([category, notifications]) => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {notifications.map(notif => {
                    const setting = getNotificationSetting(notif.id);
                    return (
                      <div key={notif.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                        <span className="text-sm text-slate-700">{notif.label}</span>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={setting.enabled !== false}
                            onCheckedChange={(checked) => {
                              updateSettingsMutation.mutate({
                                notification_type: notif.id,
                                enabled: checked,
                                send_to_admins: setting.send_to_admins !== false,
                                send_to_staff: setting.send_to_staff !== false,
                                send_to_recipients: setting.send_to_recipients !== false,
                              });
                            }}
                          />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSettings(notif.id)}
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <EditNotificationDialog
                                notificationType={notif.id}
                                notificationLabel={notif.label}
                                setting={setting}
                                onSave={(data) => updateSettingsMutation.mutate(data)}
                                isLoading={updateSettingsMutation.isPending}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Notification Settings</CardTitle>
              <CardDescription>Configure each notification type in detail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(groupedNotifications).map(([category, notifications]) => (
                <div key={category}>
                  <h3 className="font-semibold text-slate-900 mb-3">{category}</h3>
                  <div className="space-y-3">
                    {notifications.map(notif => {
                      const setting = getNotificationSetting(notif.id);
                      return (
                        <div key={notif.id} className="p-4 border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">{notif.label}</Label>
                            <Switch
                              checked={setting.enabled !== false}
                              onCheckedChange={(checked) => {
                                updateSettingsMutation.mutate({
                                  ...setting,
                                  notification_type: notif.id,
                                  enabled: checked,
                                });
                              }}
                            />
                          </div>

                          {setting.enabled !== false && (
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Send to Admins</span>
                                <Switch
                                  checked={setting.send_to_admins !== false}
                                  onCheckedChange={(checked) => {
                                    updateSettingsMutation.mutate({
                                      ...setting,
                                      notification_type: notif.id,
                                      send_to_admins: checked,
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Send to Staff</span>
                                <Switch
                                  checked={setting.send_to_staff !== false}
                                  onCheckedChange={(checked) => {
                                    updateSettingsMutation.mutate({
                                      ...setting,
                                      notification_type: notif.id,
                                      send_to_staff: checked,
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Priority Only</span>
                                <Switch
                                  checked={setting.priority_only === true}
                                  onCheckedChange={(checked) => {
                                    updateSettingsMutation.mutate({
                                      ...setting,
                                      notification_type: notif.id,
                                      priority_only: checked,
                                    });
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Include Details</span>
                                <Switch
                                  checked={setting.include_details !== false}
                                  onCheckedChange={(checked) => {
                                    updateSettingsMutation.mutate({
                                      ...setting,
                                      notification_type: notif.id,
                                      include_details: checked,
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>Customize email subject and body templates for each notification type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {NOTIFICATION_TYPES.map(notif => (
                <TemplateEditor
                  key={notif.id}
                  notif={notif}
                  setting={getNotificationSetting(notif.id)}
                  onSave={(data) => updateSettingsMutation.mutate(data)}
                  isLoading={updateSettingsMutation.isPending}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiet-hours" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiet Hours Settings</CardTitle>
              <CardDescription>Set times when emails should not be sent to users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {NOTIFICATION_TYPES.map(notif => {
                  const setting = getNotificationSetting(notif.id);
                  return (
                    <Card key={notif.id} className="p-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900">{notif.label}</h4>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={setting.quiet_hours_enabled === true}
                            onCheckedChange={(checked) => {
                              updateSettingsMutation.mutate({
                                ...setting,
                                notification_type: notif.id,
                                quiet_hours_enabled: checked,
                              });
                            }}
                          />
                          <span className="text-sm text-slate-600">Enable Quiet Hours</span>
                        </div>
                        {setting.quiet_hours_enabled && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div>
                              <Label className="text-xs">Start Time</Label>
                              <Input
                                type="time"
                                value={setting.quiet_hours_start || '22:00'}
                                onChange={(e) => {
                                  updateSettingsMutation.mutate({
                                    ...setting,
                                    notification_type: notif.id,
                                    quiet_hours_start: e.target.value,
                                  });
                                }}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">End Time</Label>
                              <Input
                                type="time"
                                value={setting.quiet_hours_end || '08:00'}
                                onChange={(e) => {
                                  updateSettingsMutation.mutate({
                                    ...setting,
                                    notification_type: notif.id,
                                    quiet_hours_end: e.target.value,
                                  });
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateEditor({ notif, setting, onSave, isLoading }) {
  const [subject, setSubject] = useState(setting.subject_template || '');
  const [body, setBody] = useState(setting.body_template || '');

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <h3 className="font-medium text-slate-900">{notif.label}</h3>
      <div className="space-y-2">
        <Label className="text-sm">Email Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="E.g., [Alert] New message from {{sender}}"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm">Email Body</Label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Enter email body template..."
          className="min-h-24"
        />
      </div>
      <Button
        size="sm"
        onClick={() => {
          onSave({
            ...setting,
            notification_type: notif.id,
            subject_template: subject,
            body_template: body,
          });
        }}
        disabled={isLoading}
      >
        Save Template
      </Button>
    </div>
  );
}

function EditNotificationDialog({ notificationType, notificationLabel, setting, onSave, isLoading }) {
  const [formData, setFormData] = React.useState({
    send_to_admins: setting.send_to_admins !== false,
    send_to_staff: setting.send_to_staff !== false,
    send_to_recipients: setting.send_to_recipients !== false,
    priority_only: setting.priority_only === true,
    include_details: setting.include_details !== false,
    batch_emails: setting.batch_emails === true,
    batch_frequency: setting.batch_frequency || 'immediate',
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Configure {notificationLabel}</DialogTitle>
        <DialogDescription>Set who receives emails for this notification type</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-2 border rounded-lg">
            <Label>Send to Admins</Label>
            <Switch
              checked={formData.send_to_admins}
              onCheckedChange={(checked) => setFormData({ ...formData, send_to_admins: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 border rounded-lg">
            <Label>Send to Staff</Label>
            <Switch
              checked={formData.send_to_staff}
              onCheckedChange={(checked) => setFormData({ ...formData, send_to_staff: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 border rounded-lg">
            <Label>Send Only to Recipients</Label>
            <Switch
              checked={formData.send_to_recipients}
              onCheckedChange={(checked) => setFormData({ ...formData, send_to_recipients: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 border rounded-lg">
            <Label>Priority Only</Label>
            <Switch
              checked={formData.priority_only}
              onCheckedChange={(checked) => setFormData({ ...formData, priority_only: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 border rounded-lg">
            <Label>Include Full Details</Label>
            <Switch
              checked={formData.include_details}
              onCheckedChange={(checked) => setFormData({ ...formData, include_details: checked })}
            />
          </div>
          <div className="flex items-center justify-between p-2 border rounded-lg">
            <Label>Batch Emails</Label>
            <Switch
              checked={formData.batch_emails}
              onCheckedChange={(checked) => setFormData({ ...formData, batch_emails: checked })}
            />
          </div>
          {formData.batch_emails && (
            <div className="pl-2">
              <Label className="text-sm">Batch Frequency</Label>
              <Select value={formData.batch_frequency} onValueChange={(value) => setFormData({ ...formData, batch_frequency: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Button
          onClick={() => onSave({ notification_type: notificationType, ...formData })}
          disabled={isLoading}
          className="w-full"
        >
          Save Settings
        </Button>
      </div>
    </>
  );
}
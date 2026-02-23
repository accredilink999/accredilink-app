import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Bell, Save, ChevronDown, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationPreferences({ userId }) {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: existingPreferences } = useQuery({
    queryKey: ['notificationPreferences', userId],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({ user_id: userId });
      return prefs[0] || null;
    },
    enabled: !!userId,
  });

  const { data: rotaAreas = [] } = useQuery({
    queryKey: ['rotaAreas'],
    queryFn: () => base44.entities.RotaArea.filter({ is_active: true }, 'name'),
  });

  useEffect(() => {
    if (existingPreferences) {
      setPreferences(existingPreferences);
    } else {
      setPreferences({
        user_id: userId,
        notification_types: {
          message: true,
          task_assigned: true,
          leave_approval: true,
          leave_rejection: true,
          incident_report: true,
          critical_update: true,
          shift_reminder: true,
          team_update: true,
          training_due: true,
          document_shared: true,
          announcement: true,
        },
        delivery_methods: {
          in_app: true,
          banner: true,
          email: false,
          push: false,
        },
        quiet_hours_enabled: false,
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        notification_retention_days: 30,
        notification_areas: [],
      });
    }
  }, [existingPreferences, userId]);

  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      if (existingPreferences) {
        return base44.entities.NotificationPreference.update(existingPreferences.id, preferences);
      } else {
        return base44.entities.NotificationPreference.create(preferences);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences', userId] });
      setHasChanges(false);
      toast.success('Notification preferences saved');
    },
  });

  const handleNotificationTypeChange = (type, value) => {
    setPreferences(prev => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: value
      }
    }));
    setHasChanges(true);
  };

  const handleDeliveryMethodChange = (method, value) => {
    setPreferences(prev => ({
      ...prev,
      delivery_methods: {
        ...prev.delivery_methods,
        [method]: value
      }
    }));
    setHasChanges(true);
  };

  const handleQuietHoursChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  if (!preferences) return null;

  const notificationTypes = [
    { key: 'message', label: 'New Messages' },
    { key: 'task_assigned', label: 'Task Assignments' },
    { key: 'leave_approval', label: 'Leave Approvals' },
    { key: 'leave_rejection', label: 'Leave Rejections' },
    { key: 'incident_report', label: 'Incident Reports' },
    { key: 'critical_update', label: 'Critical Updates' },
    { key: 'shift_reminder', label: 'Shift Reminders' },
    { key: 'team_update', label: 'Team Updates' },
    { key: 'training_due', label: 'Training Due' },
    { key: 'document_shared', label: 'Documents Shared' },
    { key: 'announcement', label: 'Announcements' },
  ];

  return (
    <div className="space-y-6">
      {hasChanges && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-amber-800">You have unsaved changes</p>
            <Button
              onClick={() => savePreferencesMutation.mutate()}
              disabled={savePreferencesMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </CardContent>
        </Card>
      )}

      <Collapsible defaultOpen={false}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer bg-teal-50 hover:bg-teal-100 transition-colors rounded-t-xl">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-teal-600" />
                  Notification Types
                </span>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform [[data-state=open]_&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notificationTypes.map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                    <Checkbox
                      checked={preferences.notification_types[key] || false}
                      onCheckedChange={(value) => handleNotificationTypeChange(key, value)}
                    />
                    <label className="text-sm text-slate-700 cursor-pointer" onClick={() => handleNotificationTypeChange(key, !preferences.notification_types[key])}>
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {rotaAreas.length > 0 && (
        <Collapsible defaultOpen={false}>
          <Card>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer bg-green-50 hover:bg-green-100 transition-colors rounded-t-xl">
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    Area Notifications
                  </span>
                  <ChevronDown className="w-5 h-5 text-slate-400 transition-transform [[data-state=open]_&]:rotate-180" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <p className="text-xs text-slate-500 mb-3">Select which rota areas you want to receive notifications for. Leave all unchecked to receive notifications for all areas.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rotaAreas.map((area) => (
                    <div key={area.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                      <Checkbox
                        checked={(preferences.notification_areas || []).includes(area.id)}
                        onCheckedChange={(checked) => {
                          const current = preferences.notification_areas || [];
                          const updated = checked
                            ? [...current, area.id]
                            : current.filter(id => id !== area.id);
                          setPreferences(prev => ({ ...prev, notification_areas: updated }));
                          setHasChanges(true);
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: area.color || '#0d9488' }} />
                        <label className="text-sm text-slate-700 cursor-pointer">{area.name}</label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      <Collapsible defaultOpen={false}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors rounded-t-xl">
              <CardTitle className="flex items-center justify-between">
                <span>Delivery Methods</span>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform [[data-state=open]_&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                <Checkbox
                  checked={preferences.delivery_methods.in_app}
                  onCheckedChange={(value) => handleDeliveryMethodChange('in_app', value)}
                />
                <label className="text-sm text-slate-700 cursor-pointer" onClick={() => handleDeliveryMethodChange('in_app', !preferences.delivery_methods.in_app)}>
                  In-App Notifications
                </label>
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                <Checkbox
                  checked={preferences.delivery_methods.banner}
                  onCheckedChange={(value) => handleDeliveryMethodChange('banner', value)}
                />
                <label className="text-sm text-slate-700 cursor-pointer" onClick={() => handleDeliveryMethodChange('banner', !preferences.delivery_methods.banner)}>
                  Banner Alerts
                </label>
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                <Checkbox
                  checked={preferences.delivery_methods.email}
                  onCheckedChange={(value) => handleDeliveryMethodChange('email', value)}
                  disabled
                />
                <label className="text-sm text-slate-500 cursor-not-allowed">
                  Email (Coming Soon)
                </label>
              </div>
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                <Checkbox
                  checked={preferences.delivery_methods.push}
                  onCheckedChange={(value) => handleDeliveryMethodChange('push', value)}
                />
                <label className="text-sm text-slate-700 cursor-pointer" onClick={() => handleDeliveryMethodChange('push', !preferences.delivery_methods.push)}>
                  Push Notifications (Mobile)
                </label>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible defaultOpen={false}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer bg-purple-50 hover:bg-purple-100 transition-colors rounded-t-xl">
              <CardTitle className="flex items-center justify-between">
                <span>Quiet Hours</span>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform [[data-state=open]_&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded">
                <Checkbox
                  checked={preferences.quiet_hours_enabled}
                  onCheckedChange={(value) => handleQuietHoursChange('quiet_hours_enabled', value)}
                />
                <label className="text-sm text-slate-700 cursor-pointer" onClick={() => handleQuietHoursChange('quiet_hours_enabled', !preferences.quiet_hours_enabled)}>
                  Enable Quiet Hours
                </label>
              </div>
              {preferences.quiet_hours_enabled && (
                <div className="grid grid-cols-2 gap-4 pl-8">
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">Start Time</label>
                    <Input
                      type="time"
                      value={preferences.quiet_hours_start}
                      onChange={(e) => handleQuietHoursChange('quiet_hours_start', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 block mb-2">End Time</label>
                    <Input
                      type="time"
                      value={preferences.quiet_hours_end}
                      onChange={(e) => handleQuietHoursChange('quiet_hours_end', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible defaultOpen={false}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer bg-amber-50 hover:bg-amber-100 transition-colors rounded-t-xl">
              <CardTitle className="flex items-center justify-between">
                <span>Notification Retention</span>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform [[data-state=open]_&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Keep notifications for (days)</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={preferences.notification_retention_days}
                  onChange={(e) => handleQuietHoursChange('notification_retention_days', parseInt(e.target.value))}
                />
                <p className="text-xs text-slate-500 mt-1">Old notifications will be automatically deleted</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
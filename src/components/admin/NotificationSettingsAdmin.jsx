import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, Plus, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettingsAdmin() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showManualNotify, setShowManualNotify] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [manualForm, setManualForm] = useState({
    recipient_ids: [],
    type: 'announcement',
    title: '',
    message: '',
    priority: 'normal',
    action_url: ''
  });

  const { data: settings = [] } = useQuery({
    queryKey: ['notificationSettings'],
    queryFn: () => base44.entities.NotificationSettings.list('-created_date')
  });

  const { data: sounds = [] } = useQuery({
    queryKey: ['notificationSounds'],
    queryFn: () => base44.entities.NotificationSound.filter({ is_active: true })
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list()
  });

  const updateSettingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.NotificationSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success('Settings updated');
    }
  });

  const createSettingMutation = useMutation({
    mutationFn: (data) => base44.entities.NotificationSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSettings'] });
      toast.success('Setting created');
      setShowAddDialog(false);
      setSelectedSetting(null);
    }
  });

  const sendManualNotificationMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('createNotification', data),
    onSuccess: (response) => {
      toast.success(`Sent ${response.data.notifications_created} notifications`);
      if (response.data.failed > 0) {
        toast.error(`Failed to send ${response.data.failed} notifications`);
      }
      setShowManualNotify(false);
      setManualForm({
        recipient_ids: [],
        type: 'announcement',
        title: '',
        message: '',
        priority: 'normal',
        action_url: ''
      });
    },
    onError: (error) => {
      toast.error('Failed to send notifications: ' + error.message);
    }
  });

  const notificationTypes = [
    'message',
    'task_assigned',
    'leave_approval',
    'leave_rejection',
    'incident_report',
    'critical_update',
    'shift_reminder',
    'team_update',
    'training_due',
    'document_shared',
    'announcement'
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notification System Control</h2>
          <p className="text-slate-500">Configure notification behavior and permissions</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setShowManualNotify(true)}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            Send Manual Notification
          </Button>
          <Button
            onClick={() => {
              setSelectedSetting({
                setting_key: '',
                enabled_globally: true,
                allow_user_override: true,
                notification_type: '',
                default_sound_id: null,
                priority_override: null,
                mandatory: false
              });
              setShowAddDialog(true);
            }}
            className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Setting
          </Button>
        </div>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">System-Wide Control:</p>
              <ul className="list-disc ml-5 space-y-1 text-amber-800">
                <li>Enable/disable notification types globally</li>
                <li>Override user preferences for critical notifications</li>
                <li>Assign custom sounds to specific notification types</li>
                <li>Mark notifications as mandatory (cannot be disabled by users)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900">
                      {setting.notification_type || setting.setting_key}
                    </h3>
                    {setting.mandatory && (
                      <Badge className="bg-red-100 text-red-800">
                        <Shield className="w-3 h-3 mr-1" />
                        Mandatory
                      </Badge>
                    )}
                    {setting.enabled_globally ? (
                      <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                    ) : (
                      <Badge variant="outline">Disabled</Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.enabled_globally}
                        onCheckedChange={(checked) =>
                          updateSettingMutation.mutate({
                            id: setting.id,
                            data: { enabled_globally: checked }
                          })
                        }
                      />
                      <span>Enabled Globally</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.allow_user_override}
                        onCheckedChange={(checked) =>
                          updateSettingMutation.mutate({
                            id: setting.id,
                            data: { allow_user_override: checked }
                          })
                        }
                      />
                      <span>Allow User Override</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={setting.mandatory}
                        onCheckedChange={(checked) =>
                          updateSettingMutation.mutate({
                            id: setting.id,
                            data: { mandatory: checked }
                          })
                        }
                      />
                      <span>Mandatory (Cannot be disabled)</span>
                    </div>
                    {setting.priority_override && (
                      <p className="text-xs">Priority Override: <strong>{setting.priority_override}</strong></p>
                    )}
                    {setting.default_sound_id && (
                      <p className="text-xs">Custom Sound Assigned</p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSetting(setting);
                    setShowAddDialog(true);
                  }}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Setting Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSetting?.id ? 'Edit Notification Setting' : 'Add Notification Setting'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Setting Key *
              </label>
              <Input
                value={selectedSetting?.setting_key || ''}
                onChange={(e) =>
                  setSelectedSetting({ ...selectedSetting, setting_key: e.target.value })
                }
                placeholder="e.g., shift_reminders"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Notification Type *
              </label>
              <Select
                value={selectedSetting?.notification_type || ''}
                onValueChange={(value) =>
                  setSelectedSetting({ ...selectedSetting, notification_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Default Sound
              </label>
              <Select
                value={selectedSetting?.default_sound_id || ''}
                onValueChange={(value) =>
                  setSelectedSetting({ ...selectedSetting, default_sound_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sound (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {sounds.map((sound) => (
                    <SelectItem key={sound.id} value={sound.id}>
                      {sound.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Priority Override
              </label>
              <Select
                value={selectedSetting?.priority_override || ''}
                onValueChange={(value) =>
                  setSelectedSetting({ ...selectedSetting, priority_override: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedSetting?.id) {
                  updateSettingMutation.mutate({
                    id: selectedSetting.id,
                    data: selectedSetting
                  });
                  setShowAddDialog(false);
                } else {
                  createSettingMutation.mutate(selectedSetting);
                }
              }}
              disabled={!selectedSetting?.setting_key || !selectedSetting?.notification_type}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {selectedSetting?.id ? 'Update' : 'Create'} Setting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Notification Dialog */}
      <Dialog open={showManualNotify} onOpenChange={setShowManualNotify}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Manual Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Recipients *
              </label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value === 'all') {
                    setManualForm({
                      ...manualForm,
                      recipient_ids: allUsers.map(u => u.id)
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`${manualForm.recipient_ids.length} selected`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                {manualForm.recipient_ids.length} recipients selected
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Type *</label>
              <Select
                value={manualForm.type}
                onValueChange={(value) => setManualForm({ ...manualForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ').toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Priority *</label>
              <Select
                value={manualForm.priority}
                onValueChange={(value) => setManualForm({ ...manualForm, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Title *</label>
              <Input
                value={manualForm.title}
                onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Message *</label>
              <Textarea
                value={manualForm.message}
                onChange={(e) => setManualForm({ ...manualForm, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Action URL (Optional)
              </label>
              <Input
                value={manualForm.action_url}
                onChange={(e) => setManualForm({ ...manualForm, action_url: e.target.value })}
                placeholder="/page/PageName"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualNotify(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendManualNotificationMutation.mutate(manualForm)}
              disabled={
                !manualForm.title ||
                !manualForm.message ||
                manualForm.recipient_ids.length === 0 ||
                sendManualNotificationMutation.isPending
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {sendManualNotificationMutation.isPending ? 'Sending...' : 'Send Notifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
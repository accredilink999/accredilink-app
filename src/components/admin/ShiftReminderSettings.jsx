import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Mail, Clock, AlertCircle } from 'lucide-react';

export default function ShiftReminderSettings() {
  const [showDialog, setShowDialog] = useState(false);
  const [settings, setSettings] = useState({
    bookOnReminder: true,
    bookOnTime: '08:00',
    bookOffReminder: true,
    bookOffTime: '18:00',
    logReminder: true,
    logReminderMins: '30',
  });
  const [saveStatus, setSaveStatus] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings) => {
      return base44.auth.updateMe({
        ...user,
        shift_reminder_settings: newSettings
      });
    },
    onSuccess: () => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 2000);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 2000);
    },
  });

  React.useEffect(() => {
    if (user?.shift_reminder_settings) {
      setSettings(user.shift_reminder_settings);
    }
  }, [user]);

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
    setShowDialog(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Shift Reminders & Notifications
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDialog(true)}
          className="text-blue-600"
        >
          Configure
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className={`p-4 border-2 ${settings.bookOnReminder ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-start gap-3">
            <Clock className={`w-5 h-5 flex-shrink-0 ${settings.bookOnReminder ? 'text-blue-600' : 'text-slate-400'}`} />
            <div>
              <p className="text-sm font-medium text-slate-900">Book On Reminder</p>
              <p className="text-xs text-slate-600">
                {settings.bookOnReminder ? `Daily at ${settings.bookOnTime}` : 'Disabled'}
              </p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 border-2 ${settings.bookOffReminder ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-start gap-3">
            <Clock className={`w-5 h-5 flex-shrink-0 ${settings.bookOffReminder ? 'text-green-600' : 'text-slate-400'}`} />
            <div>
              <p className="text-sm font-medium text-slate-900">Book Off Reminder</p>
              <p className="text-xs text-slate-600">
                {settings.bookOffReminder ? `Daily at ${settings.bookOffTime}` : 'Disabled'}
              </p>
            </div>
          </div>
        </Card>

        <Card className={`p-4 border-2 ${settings.logReminder ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${settings.logReminder ? 'text-orange-600' : 'text-slate-400'}`} />
            <div>
              <p className="text-sm font-medium text-slate-900">Complete Log Reminder</p>
              <p className="text-xs text-slate-600">
                {settings.logReminder ? `${settings.logReminderMins} mins after shift ends` : 'Disabled'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Shift Reminders</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Book On Reminder */}
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Book On Reminder</Label>
                <Switch
                  checked={settings.bookOnReminder}
                  onCheckedChange={(checked) =>
                    setSettings({...settings, bookOnReminder: checked})
                  }
                />
              </div>
              {settings.bookOnReminder && (
                <div>
                  <Label className="text-xs text-slate-600">Reminder Time</Label>
                  <Input
                    type="time"
                    value={settings.bookOnTime}
                    onChange={(e) =>
                      setSettings({...settings, bookOnTime: e.target.value})
                    }
                  />
                </div>
              )}
            </div>

            {/* Book Off Reminder */}
            <div className="space-y-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Book Off Reminder</Label>
                <Switch
                  checked={settings.bookOffReminder}
                  onCheckedChange={(checked) =>
                    setSettings({...settings, bookOffReminder: checked})
                  }
                />
              </div>
              {settings.bookOffReminder && (
                <div>
                  <Label className="text-xs text-slate-600">Reminder Time</Label>
                  <Input
                    type="time"
                    value={settings.bookOffTime}
                    onChange={(e) =>
                      setSettings({...settings, bookOffTime: e.target.value})
                    }
                  />
                </div>
              )}
            </div>

            {/* Complete Log Reminder */}
            <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Complete Log Reminder</Label>
                <Switch
                  checked={settings.logReminder}
                  onCheckedChange={(checked) =>
                    setSettings({...settings, logReminder: checked})
                  }
                />
              </div>
              {settings.logReminder && (
                <div>
                  <Label className="text-xs text-slate-600">Reminder After (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.logReminderMins}
                    onChange={(e) =>
                      setSettings({...settings, logReminderMins: e.target.value})
                    }
                    min="5"
                    max="120"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>

          {saveStatus === 'success' && (
            <p className="text-xs text-green-600 text-center">Settings saved successfully</p>
          )}
          {saveStatus === 'error' && (
            <p className="text-xs text-red-600 text-center">Failed to save settings</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
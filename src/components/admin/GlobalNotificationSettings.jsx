import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Bell, Save, ChevronDown, Volume2, Volume, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function GlobalNotificationSettings() {
  const queryClient = useQueryClient();
  const [globalSettings, setGlobalSettings] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [alertSoundPlaying, setAlertSoundPlaying] = useState(null);

  const { data: notificationSounds = [] } = useQuery({
    queryKey: ['notificationSounds'],
    queryFn: () => base44.entities.NotificationSound.list(),
  });

  const { data: existingSettings } = useQuery({
    queryKey: ['globalNotificationSettings'],
    queryFn: async () => {
      const settings = await base44.entities.SystemSettings.filter({ setting_key: 'global_notification_settings' });
      return settings[0] || null;
    },
  });

  useEffect(() => {
    if (existingSettings?.setting_value) {
      try {
        const parsed = typeof existingSettings.setting_value === 'string' 
          ? JSON.parse(existingSettings.setting_value) 
          : existingSettings.setting_value;
        setGlobalSettings(parsed);
      } catch (e) {
        initializeSettings();
      }
    } else {
      initializeSettings();
    }
  }, [existingSettings]);

  const initializeSettings = () => {
    setGlobalSettings({
      notification_types: {
        message: { enabled: true, alert_sound: true, email: true, voice: false },
        task_assigned: { enabled: true, alert_sound: true, email: true, voice: false },
        leave_approval: { enabled: true, alert_sound: true, email: true, voice: false },
        leave_rejection: { enabled: true, alert_sound: true, email: true, voice: true },
        incident_report: { enabled: true, alert_sound: true, email: true, voice: true },
        critical_update: { enabled: true, alert_sound: true, email: true, voice: true },
        shift_reminder: { enabled: true, alert_sound: true, email: false, voice: false },
        team_update: { enabled: true, alert_sound: false, email: true, voice: false },
        training_due: { enabled: true, alert_sound: false, email: true, voice: false },
        document_shared: { enabled: true, alert_sound: false, email: true, voice: false },
        announcement: { enabled: true, alert_sound: false, email: true, voice: false },
      },
      default_alert_sound_id: null,
      voice_enabled: false,
      enforce_globally: true,
    });
  };

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (existingSettings) {
        return base44.entities.SystemSettings.update(existingSettings.id, {
          setting_value: JSON.stringify(globalSettings)
        });
      } else {
        return base44.entities.SystemSettings.create({
          setting_key: 'global_notification_settings',
          setting_value: JSON.stringify(globalSettings),
          description: 'Global notification settings enforced across all devices'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalNotificationSettings'] });
      setHasChanges(false);
      toast.success('Global notification settings saved and enforced');
    },
    onError: (error) => {
      toast.error('Failed to save settings: ' + error.message);
    }
  });

  const handleNotificationTypeChange = (type, field, value) => {
    setGlobalSettings(prev => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: {
          ...prev.notification_types[type],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const handleDefaultAlertSoundChange = (soundId) => {
    setGlobalSettings(prev => ({
      ...prev,
      default_alert_sound_id: soundId || null
    }));
    setHasChanges(true);
  };

  const handleVoiceToggle = (value) => {
    setGlobalSettings(prev => ({
      ...prev,
      voice_enabled: value
    }));
    setHasChanges(true);
  };

  const playAlertSound = (soundId) => {
    setAlertSoundPlaying(soundId);
    setTimeout(() => setAlertSoundPlaying(null), 3000);

    // System sounds
    const systemSounds = {
      'system_bell': () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      },
      'system_ding': () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = 1000;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      },
      'system_chime': () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;
        const freqs = [800, 1000, 1200];
        freqs.forEach((freq, i) => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.2, now + (i * 0.1));
          gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.1) + 0.15);
          osc.start(now + (i * 0.1));
          osc.stop(now + (i * 0.1) + 0.15);
        });
      },
      'system_alert': () => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;
        for (let i = 0; i < 2; i++) {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = 600 + (i * 200);
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, now + (i * 0.2));
          gain.gain.exponentialRampToValueAtTime(0.01, now + (i * 0.2) + 0.15);
          osc.start(now + (i * 0.2));
          osc.stop(now + (i * 0.2) + 0.15);
        }
      }
    };

    // Play system sound or custom sound
    if (systemSounds[soundId]) {
      try {
        systemSounds[soundId]();
      } catch (err) {
        console.log('Error playing system sound:', err);
      }
    } else {
      const sound = notificationSounds.find(s => s.id === soundId);
      if (sound?.file_url) {
        const audio = new Audio(sound.file_url);
        audio.play().catch(err => console.log('Error playing sound:', err));
      }
    }
  };

  if (!globalSettings) return null;

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
    <div className="space-y-6 max-w-3xl">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800 font-medium">
          ⚙️ These settings will be enforced globally across all user devices. Individual users cannot override these preferences.
        </p>
      </div>

      {hasChanges && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-amber-800">You have unsaved changes</p>
            <Button
              onClick={() => saveSettingsMutation.mutate()}
              disabled={saveSettingsMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save & Enforce
            </Button>
          </CardContent>
        </Card>
      )}

      <Collapsible defaultOpen={true}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer bg-teal-50 hover:bg-teal-100 transition-colors rounded-t-xl">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-teal-600" />
                  Notification Types & Delivery Methods
                </span>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform [[data-state=open]_&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              {notificationTypes.map(({ key, label }) => {
                const settings = globalSettings.notification_types[key];
                return (
                  <div key={key} className="border border-slate-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={settings?.enabled || false}
                        onCheckedChange={(value) => handleNotificationTypeChange(key, 'enabled', value)}
                      />
                      <label className="text-sm font-medium text-slate-700 cursor-pointer flex-1" onClick={() => handleNotificationTypeChange(key, 'enabled', !settings?.enabled)}>
                        {label}
                      </label>
                    </div>
                    {settings?.enabled && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                          <Checkbox
                            checked={settings?.alert_sound || false}
                            onCheckedChange={(value) => handleNotificationTypeChange(key, 'alert_sound', value)}
                          />
                          <Volume2 className="w-4 h-4 text-slate-500" />
                          <label className="text-xs text-slate-600 cursor-pointer flex-1" onClick={() => handleNotificationTypeChange(key, 'alert_sound', !settings?.alert_sound)}>
                            Alert Sound
                          </label>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                          <Checkbox
                            checked={settings?.email || false}
                            onCheckedChange={(value) => handleNotificationTypeChange(key, 'email', value)}
                          />
                          <Mail className="w-4 h-4 text-slate-500" />
                          <label className="text-xs text-slate-600 cursor-pointer flex-1" onClick={() => handleNotificationTypeChange(key, 'email', !settings?.email)}>
                            Send Email
                          </label>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-slate-50 rounded">
                          <Checkbox
                            checked={settings?.voice || false}
                            onCheckedChange={(value) => handleNotificationTypeChange(key, 'voice', value)}
                            disabled={!globalSettings.voice_enabled}
                          />
                          <Volume className="w-4 h-4 text-slate-500" />
                          <label className={`text-xs ${globalSettings.voice_enabled ? 'text-slate-600 cursor-pointer' : 'text-slate-400'} flex-1`} onClick={() => globalSettings.voice_enabled && handleNotificationTypeChange(key, 'voice', !settings?.voice)}>
                            Voice Announcement
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Collapsible defaultOpen={false}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors rounded-t-xl">
              <CardTitle className="flex items-center justify-between">
                <span>Global Voice Announcements</span>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform [[data-state=open]_&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-900">Enable Voice Announcements</p>
                  <p className="text-xs text-slate-600 mt-1">Allow voice notifications to be announced to users</p>
                </div>
                <Checkbox
                  checked={globalSettings.voice_enabled}
                  onCheckedChange={handleVoiceToggle}
                />
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
                <span className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-purple-600" />
                  Default Alert Sound
                </span>
                <ChevronDown className="w-5 h-5 text-slate-400 transition-transform [[data-state=open]_&]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Select Default Alert Sound</label>
                <Select value={globalSettings.default_alert_sound_id || 'system_default'} onValueChange={(val) => handleDefaultAlertSoundChange(val === 'system_default' ? null : val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose default alert sound" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system_default">System Default</SelectItem>
                    <SelectItem value="system_bell">Bell</SelectItem>
                    <SelectItem value="system_ding">Ding</SelectItem>
                    <SelectItem value="system_chime">Chime</SelectItem>
                    <SelectItem value="system_alert">Alert</SelectItem>
                    {notificationSounds.map(sound => (
                      <SelectItem key={sound.id} value={String(sound.id)}>
                        {sound.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {globalSettings.default_alert_sound_id && (
                <div>
                  <Button
                    onClick={() => playAlertSound(globalSettings.default_alert_sound_id)}
                    variant="outline"
                    size="sm"
                    disabled={alertSoundPlaying === globalSettings.default_alert_sound_id}
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    {alertSoundPlaying === globalSettings.default_alert_sound_id ? 'Playing...' : 'Test Sound'}
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <Button
        onClick={() => saveSettingsMutation.mutate()}
        disabled={!hasChanges || saveSettingsMutation.isPending}
        className="w-full bg-teal-600 hover:bg-teal-700"
      >
        <Save className="w-4 h-4 mr-2" />
        Save & Enforce Globally
      </Button>
    </div>
  );
}
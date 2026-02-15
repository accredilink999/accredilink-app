/**
 * NotificationRulesManager
 *
 * Admin UI to configure per-event notification rules:
 *  - Enable/disable each event type
 *  - Choose sound from built-in presets OR uploaded custom sounds
 *  - Upload custom sound files inline
 *  - Preview any sound
 *  - Toast style (info / warning / error)
 *  - Toast duration
 *
 * Rules are stored in SystemSettings with key 'notification_rules'.
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Bell, Play, Save, RotateCcw, MessageSquare, AlertTriangle, Calendar, GraduationCap, Megaphone, Zap, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { TONE_PRESETS, playTone, playSound } from '@/hooks/useNotifications';

// ---------------------------------------------------------------------------
// Event type definitions
// ---------------------------------------------------------------------------

const EVENT_TYPES = [
  {
    key: 'new_chat_message',
    label: 'New Chat Message',
    icon: MessageSquare,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    description: 'Someone sends you a direct or group chat message',
  },
  {
    key: 'incident_created',
    label: 'Incident Reported',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    description: 'A new incident is logged in the system',
  },
  {
    key: 'leave_request',
    label: 'Leave Request',
    icon: Calendar,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    description: 'A staff member submits or updates a leave request',
  },
  {
    key: 'shift_reminder',
    label: 'Shift Reminder',
    icon: Calendar,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    description: 'Upcoming shift or rota change notifications',
  },
  {
    key: 'training_deadline',
    label: 'Training Deadline',
    icon: GraduationCap,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    description: 'Training completion deadline approaching',
  },
  {
    key: 'announcement',
    label: 'Announcement',
    icon: Megaphone,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    description: 'An organisation-wide announcement is posted',
  },
  {
    key: 'high_priority',
    label: 'High Priority Alert',
    icon: Zap,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    description: 'Any high-priority notification requiring immediate attention',
  },
  {
    key: 'general',
    label: 'General Notification',
    icon: Bell,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    description: 'All other notification types',
  },
];

// Built-in synthesized tone presets
const BUILT_IN_SOUNDS = [
  { value: 'none',        label: 'Silent' },
  { value: 'gentle',      label: 'Gentle Beep' },
  { value: 'alert',       label: 'Alert Tone' },
  { value: 'urgent',      label: 'Urgent Alarm' },
  { value: 'message',     label: 'Message Chime' },
  { value: 'critical',    label: 'Critical Alarm' },
  { value: 'soft_bell',   label: 'Soft Bell' },
  { value: 'doorbell',    label: 'Doorbell' },
  { value: 'triple_beep', label: 'Triple Beep' },
  { value: 'ascending',   label: 'Ascending' },
  { value: 'descending',  label: 'Descending' },
  { value: 'ping',        label: 'Ping' },
  { value: 'double_ping', label: 'Double Ping' },
  { value: 'warble',      label: 'Warble' },
  { value: 'horn',        label: 'Horn' },
  { value: 'siren',       label: 'Short Siren' },
  { value: 'xylophone',   label: 'Xylophone' },
  { value: 'bubble',      label: 'Bubble' },
];

const VARIANT_OPTIONS = [
  { value: 'info',    label: 'Info (default)' },
  { value: 'warning', label: 'Warning (amber)' },
  { value: 'error',   label: 'Error (red)' },
  { value: 'success', label: 'Success (green)' },
];

const DEFAULT_RULES = {
  new_chat_message:  { enabled: true,  sound: 'message',  variant: 'info',    toastDuration: 8000 },
  incident_created:  { enabled: true,  sound: 'urgent',   variant: 'error',   toastDuration: 12000 },
  leave_request:     { enabled: true,  sound: 'alert',    variant: 'warning', toastDuration: 8000 },
  shift_reminder:    { enabled: true,  sound: 'gentle',   variant: 'info',    toastDuration: 7000 },
  training_deadline: { enabled: true,  sound: 'gentle',   variant: 'warning', toastDuration: 8000 },
  announcement:      { enabled: true,  sound: 'alert',    variant: 'info',    toastDuration: 10000 },
  high_priority:     { enabled: true,  sound: 'critical', variant: 'error',   toastDuration: 15000 },
  general:           { enabled: true,  sound: 'gentle',   variant: 'info',    toastDuration: 6000 },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NotificationRulesManager() {
  const queryClient = useQueryClient();
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [isDirty, setIsDirty] = useState(false);
  const [uploadingSound, setUploadingSound] = useState(false);

  const { data: savedSettingRows = [] } = useQuery({
    queryKey: ['notificationRules'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'notification_rules' }),
  });

  // Load uploaded custom sounds
  const { data: customSounds = [] } = useQuery({
    queryKey: ['notificationSounds'],
    queryFn: () => base44.entities.NotificationSound.list('-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Hydrate from saved rules
  const safeRows = savedSettingRows ?? [];
  useEffect(() => {
    const row = safeRows[0];
    if (row?.setting_value) {
      try {
        const parsed = typeof row.setting_value === 'string'
          ? JSON.parse(row.setting_value)
          : row.setting_value;
        setRules({ ...DEFAULT_RULES, ...parsed });
        setIsDirty(false);
      } catch { /* ignore */ }
    }
  }, [safeRows]);

  const saveMutation = useMutation({
    mutationFn: async (rulesData) => {
      const value = JSON.stringify(rulesData);
      const existing = safeRows[0];
      if (existing) {
        return base44.entities.SystemSettings.update(existing.id, { setting_value: value });
      }
      return base44.entities.SystemSettings.create({
        setting_key: 'notification_rules',
        setting_value: value,
        description: 'Per-event in-app notification rules',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationRules'] });
      toast.success('Notification rules saved');
      setIsDirty(false);
    },
    onError: (e) => toast.error('Failed to save rules: ' + e.message),
  });

  const updateRule = (key, field, value) => {
    setRules(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
    setIsDirty(true);
  };

  const resetToDefaults = () => {
    setRules(DEFAULT_RULES);
    setIsDirty(true);
  };

  // Handle inline sound upload
  const handleSoundUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload MP3, WAV, M4A, or OGG');
      return;
    }

    if (file.size > 500 * 1024) {
      toast.error('File too large. Maximum size is 500KB');
      return;
    }

    setUploadingSound(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const name = file.name.replace(/\.[^.]+$/, '');
      const fileType = file.name.split('.').pop().toLowerCase();

      await base44.entities.NotificationSound.create({
        name: name,
        description: '',
        file_url: file_url,
        file_type: fileType,
        duration_ms: 0,
        is_default: false,
        is_active: true,
        assigned_to_types: [],
        uploaded_by: user?.id,
      });

      queryClient.invalidateQueries({ queryKey: ['notificationSounds'] });
      toast.success(`Sound "${name}" uploaded`);
    } catch (error) {
      toast.error('Failed to upload sound: ' + error.message);
    }
    setUploadingSound(false);
    // Reset file input
    e.target.value = '';
  };

  // Build the combined sound options list
  const activeCustomSounds = customSounds.filter(s => s.is_active);

  // Get the label for the currently selected sound
  const getSoundLabel = (soundValue) => {
    if (!soundValue || soundValue === 'none') return 'Silent';
    const builtIn = BUILT_IN_SOUNDS.find(s => s.value === soundValue);
    if (builtIn) return builtIn.label;
    if (soundValue.startsWith('custom:')) {
      const url = soundValue.slice(7);
      const custom = activeCustomSounds.find(s => s.file_url === url);
      return custom?.name || 'Custom Sound';
    }
    return soundValue;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">
          Configure sounds and toast alerts for each event type. Changes apply to all users.
        </p>
        <div className="flex gap-2">
          {/* Upload Sound Button */}
          <div className="relative">
            <input
              type="file"
              accept=".mp3,.wav,.m4a,.ogg,audio/*"
              onChange={handleSoundUpload}
              className="hidden"
              id="inline-sound-upload"
              disabled={uploadingSound}
            />
            <label htmlFor="inline-sound-upload">
              <Button asChild variant="outline" size="sm" className="cursor-pointer" disabled={uploadingSound}>
                <span>
                  {uploadingSound ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {uploadingSound ? 'Uploading...' : 'Upload Sound'}
                </span>
              </Button>
            </label>
          </div>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate(rules)}
            disabled={!isDirty || saveMutation.isPending}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saveMutation.isPending ? 'Saving...' : 'Save Rules'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {EVENT_TYPES.map((evt) => {
          const rule = rules[evt.key] || DEFAULT_RULES[evt.key];
          const Icon = evt.icon;
          return (
            <Card key={evt.key} className={`border ${rule.enabled ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg ${evt.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${evt.color}`} />
                  </div>

                  {/* Info + Controls */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div>
                        <p className="font-medium text-sm text-slate-900">{evt.label}</p>
                        <p className="text-xs text-slate-500">{evt.description}</p>
                      </div>
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(v) => updateRule(evt.key, 'enabled', v)}
                      />
                    </div>

                    {rule.enabled && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Sound */}
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">Sound</p>
                          <div className="flex gap-1.5">
                            <Select
                              value={rule.sound}
                              onValueChange={(v) => updateRule(evt.key, 'sound', v)}
                            >
                              <SelectTrigger className="h-8 text-xs flex-1">
                                <SelectValue>{getSoundLabel(rule.sound)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent className="max-h-64">
                                <SelectGroup>
                                  <SelectLabel className="text-[10px] uppercase tracking-wider text-slate-400">Built-in Sounds</SelectLabel>
                                  {BUILT_IN_SOUNDS.map(o => (
                                    <SelectItem key={o.value} value={o.value} className="text-xs">
                                      {o.label}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                                {activeCustomSounds.length > 0 && (
                                  <SelectGroup>
                                    <SelectLabel className="text-[10px] uppercase tracking-wider text-slate-400">Uploaded Sounds</SelectLabel>
                                    {activeCustomSounds.map(s => (
                                      <SelectItem key={s.id} value={`custom:${s.file_url}`} className="text-xs">
                                        {s.name}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                )}
                              </SelectContent>
                            </Select>
                            {rule.sound !== 'none' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => playSound(rule.sound)}
                                title="Preview sound"
                              >
                                <Play className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Toast style */}
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">Toast style</p>
                          <Select
                            value={rule.variant}
                            onValueChange={(v) => updateRule(evt.key, 'variant', v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VARIANT_OPTIONS.map(o => (
                                <SelectItem key={o.value} value={o.value} className="text-xs">
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Duration */}
                        <div>
                          <p className="text-xs font-medium text-slate-600 mb-1">
                            Duration: {Math.round(rule.toastDuration / 1000)}s
                          </p>
                          <Slider
                            min={3000}
                            max={30000}
                            step={1000}
                            value={[rule.toastDuration]}
                            onValueChange={([v]) => updateRule(evt.key, 'toastDuration', v)}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

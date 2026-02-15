import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Upload, Play, Pause, Trash2, Plus, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { TONE_PRESETS, playTone } from '@/hooks/useNotifications';

// Built-in sound definitions for display
const BUILT_IN_SOUNDS = [
  { key: 'gentle',      label: 'Gentle Beep',   desc: 'Soft two-tone beep' },
  { key: 'alert',       label: 'Alert Tone',    desc: 'Three-tone alert' },
  { key: 'urgent',      label: 'Urgent Alarm',  desc: 'Four-tone urgent pattern' },
  { key: 'message',     label: 'Message Chime', desc: 'Ascending chime' },
  { key: 'critical',    label: 'Critical Alarm',desc: 'Repeating alarm pattern' },
  { key: 'soft_bell',   label: 'Soft Bell',     desc: 'Gentle three-note bell' },
  { key: 'doorbell',    label: 'Doorbell',      desc: 'Classic ding-dong' },
  { key: 'triple_beep', label: 'Triple Beep',   desc: 'Three quick beeps' },
  { key: 'ascending',   label: 'Ascending',     desc: 'Rising five-note scale' },
  { key: 'descending',  label: 'Descending',    desc: 'Falling five-note scale' },
  { key: 'ping',        label: 'Ping',          desc: 'Single high-pitched ping' },
  { key: 'double_ping', label: 'Double Ping',   desc: 'Two quick pings' },
  { key: 'warble',      label: 'Warble',        desc: 'Alternating warble pattern' },
  { key: 'horn',        label: 'Horn',          desc: 'Sawtooth horn blast' },
  { key: 'siren',       label: 'Short Siren',   desc: 'Quick siren burst' },
  { key: 'xylophone',   label: 'Xylophone',     desc: 'Musical scale on triangle wave' },
  { key: 'bubble',      label: 'Bubble',        desc: 'Rising bubble effect' },
];

export default function NotificationSoundManager() {
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    file: null,
    is_default: false
  });

  const { data: sounds = [] } = useQuery({
    queryKey: ['notificationSounds'],
    queryFn: () => base44.entities.NotificationSound.list('-created_date')
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const uploadSoundMutation = useMutation({
    mutationFn: async (data) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: data.file });
      const fileType = data.file.name.split('.').pop().toLowerCase();

      return base44.entities.NotificationSound.create({
        name: data.name,
        description: data.description,
        file_url: file_url,
        file_type: fileType,
        duration_ms: 0,
        is_default: data.is_default,
        is_active: true,
        assigned_to_types: [],
        uploaded_by: user?.id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSounds'] });
      toast.success('Sound uploaded successfully');
      setShowAddDialog(false);
      setFormData({ name: '', description: '', file: null, is_default: false });
    },
    onError: (error) => {
      toast.error('Failed to upload sound: ' + error.message);
    }
  });

  const deleteSoundMutation = useMutation({
    mutationFn: (id) => base44.entities.NotificationSound.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSounds'] });
      toast.success('Sound deleted');
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) =>
      base44.entities.NotificationSound.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationSounds'] });
    }
  });

  const playUploadedSound = (soundUrl, soundId) => {
    if (playingId === soundId) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(soundUrl);
    audio.play();
    setPlayingId(soundId);
    audio.onended = () => setPlayingId(null);
  };

  const playBuiltInSound = (key) => {
    if (playingId === key) {
      setPlayingId(null);
      return;
    }
    setPlayingId(key);
    playTone(TONE_PRESETS[key]);
    // Built-in sounds are short, auto-clear after max duration
    setTimeout(() => setPlayingId(null), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload MP3, WAV, M4A, or OGG');
        return;
      }

      if (file.size > 500 * 1024) {
        toast.error('File too large. Maximum size is 500KB');
        return;
      }

      setFormData({ ...formData, file });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notification Sounds</h2>
          <p className="text-slate-500">Built-in sounds and custom uploads</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Upload Sound
        </Button>
      </div>

      {/* Built-in Sounds Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-teal-600" />
          Built-in Sounds ({BUILT_IN_SOUNDS.length})
        </h3>
        <div className="grid gap-2">
          {BUILT_IN_SOUNDS.map((sound) => (
            <Card key={sound.key} className="border border-slate-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => playBuiltInSound(sound.key)}
                    className="rounded-full h-9 w-9 flex-shrink-0"
                  >
                    {playingId === sound.key ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                  </Button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-slate-900">{sound.label}</p>
                      <Badge variant="outline" className="text-[10px]">Built-in</Badge>
                    </div>
                    <p className="text-xs text-slate-500">{sound.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Uploaded Sounds Section */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-purple-600" />
          Uploaded Sounds ({sounds.length})
        </h3>

        {sounds.length === 0 ? (
          <Card className="border border-dashed border-slate-300">
            <CardContent className="p-6 text-center">
              <Volume2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No custom sounds uploaded yet</p>
              <p className="text-xs text-slate-400 mt-1">Click "Upload Sound" to add your own</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-2">
            {sounds.map((sound) => (
              <Card key={sound.id} className={`border ${!sound.is_active ? 'opacity-60 border-slate-100' : 'border-slate-200'}`}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => playUploadedSound(sound.file_url, sound.id)}
                      className="rounded-full h-9 w-9 flex-shrink-0"
                    >
                      {playingId === sound.id ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-slate-900">{sound.name}</p>
                        {sound.is_default && (
                          <Badge className="bg-blue-100 text-blue-800 text-[10px]">Default</Badge>
                        )}
                        {!sound.is_active && (
                          <Badge variant="outline" className="text-[10px]">Inactive</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px]">{sound.file_type?.toUpperCase()}</Badge>
                      </div>
                      {sound.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{sound.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => toggleActiveMutation.mutate({
                          id: sound.id,
                          is_active: !sound.is_active
                        })}
                      >
                        {sound.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      {!sound.is_default && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => deleteSoundMutation.mutate(sound.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Upload requirements info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Volume2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Upload Requirements:</p>
              <ul className="list-disc ml-5 space-y-1 text-blue-800 text-xs">
                <li>Format: MP3, WAV, M4A, or OGG</li>
                <li>Max size: 500KB</li>
                <li>Recommended duration: 2-5 seconds</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Notification Sound</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Sound Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Alert Chime"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the sound..."
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                Sound File *
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.ogg,audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="sound-upload"
                />
                <label htmlFor="sound-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    {formData.file ? formData.file.name : 'Click to upload sound file'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">MP3, WAV, M4A, or OGG (max 500KB)</p>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="rounded"
              />
              <label className="text-sm text-slate-700">Mark as default sound</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => uploadSoundMutation.mutate(formData)}
              disabled={!formData.name || !formData.file || uploadSoundMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {uploadSoundMutation.isPending ? 'Uploading...' : 'Upload Sound'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

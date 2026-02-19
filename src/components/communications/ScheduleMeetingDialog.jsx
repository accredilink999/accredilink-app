import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { invokeFunction } from '@/api/functions';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Avatar from '@/components/ui/Avatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Search, X, Video, Mic, Loader2 } from 'lucide-react';

export default function ScheduleMeetingDialog({
  open,
  onOpenChange,
  meeting, // optional — for editing
  currentUser,
  allUsers = [],
}) {
  const queryClient = useQueryClient();
  const isEdit = !!meeting;

  const [formData, setFormData] = useState({
    title: meeting?.title || '',
    description: meeting?.description || '',
    date: meeting?.scheduled_at ? format(new Date(meeting.scheduled_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    time: meeting?.scheduled_at ? format(new Date(meeting.scheduled_at), 'HH:mm') : format(new Date(Date.now() + 3600000), 'HH:mm'),
    duration: String(meeting?.duration_minutes || 60),
    meeting_type: meeting?.meeting_type || 'video',
    recording_enabled: meeting?.recording_enabled || false,
    agenda: meeting?.agenda || '',
  });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter users for staff selection
  const filteredUsers = useMemo(() => {
    const active = allUsers.filter(u =>
      u.id !== currentUser?.id &&
      (u.is_active !== false) &&
      (u.employment_status !== 'terminated')
    );
    if (!searchQuery.trim()) return active.sort((a, b) =>
      (a.staff_full_name || a.full_name || '').localeCompare(b.staff_full_name || b.full_name || '')
    );
    const q = searchQuery.toLowerCase();
    return active.filter(u =>
      (u.staff_full_name || u.full_name || '').toLowerCase().includes(q) ||
      (u.job_title || '').toLowerCase().includes(q)
    ).sort((a, b) =>
      (a.staff_full_name || a.full_name || '').localeCompare(b.staff_full_name || b.full_name || '')
    );
  }, [allUsers, currentUser?.id, searchQuery]);

  // Group by first letter
  const groupedUsers = useMemo(() => {
    const groups = {};
    filteredUsers.forEach(u => {
      const letter = (u.staff_full_name || u.full_name || '?')[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(u);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredUsers]);

  const toggleUser = (userId) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectedUsers = allUsers.filter(u => selectedUserIds.includes(u.id));

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a meeting title');
      return;
    }
    if (selectedUserIds.length === 0) {
      toast.error('Please select at least one participant');
      return;
    }

    setSaving(true);
    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString();

      if (isEdit) {
        // Update existing meeting
        await base44.entities.Meeting.update(meeting.id, {
          title: formData.title,
          description: formData.description,
          scheduled_at: scheduledAt,
          duration_minutes: parseInt(formData.duration),
          meeting_type: formData.meeting_type,
          recording_enabled: formData.recording_enabled,
          agenda: formData.agenda,
        });
        toast.success('Meeting updated');
      } else {
        // Create new meeting
        const newMeeting = await base44.entities.Meeting.create({
          title: formData.title,
          description: formData.description,
          scheduled_at: scheduledAt,
          duration_minutes: parseInt(formData.duration),
          created_by: currentUser.id,
          created_by_name: currentUser.staff_full_name || currentUser.full_name,
          status: 'scheduled',
          meeting_type: formData.meeting_type,
          recording_enabled: formData.recording_enabled,
          agenda: formData.agenda,
        });

        // Add organizer as participant
        await base44.entities.MeetingParticipant.create({
          meeting_id: newMeeting.id,
          user_id: currentUser.id,
          user_name: currentUser.staff_full_name || currentUser.full_name,
          user_email: currentUser.email,
          role: 'organizer',
          status: 'accepted',
        });

        // Add selected participants
        for (const userId of selectedUserIds) {
          const u = allUsers.find(x => x.id === userId);
          await base44.entities.MeetingParticipant.create({
            meeting_id: newMeeting.id,
            user_id: userId,
            user_name: u?.staff_full_name || u?.full_name || 'Unknown',
            user_email: u?.email,
            role: 'participant',
            status: 'invited',
          });
        }

        // Create the Daily.co room
        try {
          await invokeFunction('createDailyRoom', {
            meeting_id: newMeeting.id,
            title: formData.title,
            enable_recording: formData.recording_enabled,
            duration_minutes: parseInt(formData.duration),
          });
        } catch (err) {
          console.error('Failed to create Daily room:', err);
          // Meeting still created, room can be created when starting
        }

        // Send push notifications to invited participants
        try {
          await invokeFunction('createNotification', {
            recipient_ids: selectedUserIds,
            type: 'meeting_invite',
            title: 'Meeting Invitation',
            message: `${currentUser.staff_full_name || currentUser.full_name} invited you to "${formData.title}" on ${format(new Date(scheduledAt), 'EEE d MMM')} at ${format(new Date(scheduledAt), 'HH:mm')}`,
            priority: 'normal',
            action_url: '/Communications',
            send_push: true,
          });
        } catch (err) {
          console.error('Failed to send notifications:', err);
        }

        toast.success('Meeting scheduled');
      }

      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meetingParticipants'] });
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving meeting:', err);
      toast.error('Failed to save meeting');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Meeting' : 'Schedule Meeting'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <label className="text-sm font-medium text-slate-700">Meeting Title *</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Team Standup, Care Review..."
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-slate-700">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the meeting..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Date *</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Time *</label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Duration</label>
              <Select
                value={formData.duration}
                onValueChange={(v) => setFormData({ ...formData, duration: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Meeting type + Recording */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-700">Type:</label>
              <Select
                value={formData.meeting_type}
                onValueChange={(v) => setFormData({ ...formData, meeting_type: v })}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <span className="flex items-center gap-1"><Video className="w-3 h-3" /> Video</span>
                  </SelectItem>
                  <SelectItem value="audio_only">
                    <span className="flex items-center gap-1"><Mic className="w-3 h-3" /> Audio Only</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.recording_enabled}
                onCheckedChange={(v) => setFormData({ ...formData, recording_enabled: v })}
              />
              <label className="text-sm text-slate-700">Record meeting</label>
            </div>
          </div>

          {/* Agenda */}
          <div>
            <label className="text-sm font-medium text-slate-700">Agenda</label>
            <Textarea
              value={formData.agenda}
              onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
              placeholder="Meeting agenda items..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Staff selection */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Invite Participants * ({selectedUserIds.length} selected)
            </label>

            {/* Selected chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {selectedUsers.map(u => (
                  <Badge
                    key={u.id}
                    variant="secondary"
                    className="bg-teal-100 text-teal-700 cursor-pointer hover:bg-teal-200"
                    onClick={() => toggleUser(u.id)}
                  >
                    {u.staff_full_name || u.full_name}
                    <X className="w-3 h-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff..."
                className="pl-9"
              />
            </div>

            {/* User list */}
            <div className="max-h-48 overflow-y-auto border rounded-lg">
              {groupedUsers.map(([letter, users]) => (
                <div key={letter}>
                  <div className="px-3 py-1 bg-slate-50 text-xs font-semibold text-slate-500 sticky top-0">
                    {letter}
                  </div>
                  {users.map(u => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-teal-50' : ''
                        }`}
                        onClick={() => toggleUser(u.id)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300"
                        />
                        <Avatar name={u.staff_full_name || u.full_name} size="xs" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {u.staff_full_name || u.full_name}
                          </p>
                          {u.job_title && (
                            <p className="text-xs text-slate-500">{u.job_title}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              {groupedUsers.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">No staff found</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEdit ? 'Updating...' : 'Scheduling...'}
              </>
            ) : (
              isEdit ? 'Update Meeting' : 'Schedule Meeting'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

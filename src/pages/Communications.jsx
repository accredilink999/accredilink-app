import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { invokeFunction } from '@/api/functions';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import MeetingCard from '@/components/communications/MeetingCard';
import ScheduleMeetingDialog from '@/components/communications/ScheduleMeetingDialog';
import MeetingRoom from '@/components/communications/MeetingRoom';
import PastMeetingDetail from '@/components/communications/PastMeetingDetail';
import MeetingWhiteboard from '@/components/communications/MeetingWhiteboard';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from 'sonner';
import {
  Video, Plus, Search, Loader2, Presentation, Calendar, Clock
} from 'lucide-react';

export default function Communications() {
  const queryClient = useQueryClient();
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [editMeeting, setEditMeeting] = useState(null);
  const [activeMeetingRoom, setActiveMeetingRoom] = useState(null);
  const [selectedPastMeeting, setSelectedPastMeeting] = useState(null);
  const [whiteboardMeeting, setWhiteboardMeeting] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startingMeeting, setStartingMeeting] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => base44.entities.Meeting.list('-scheduled_at', 200),
  });

  const { data: allParticipants = [] } = useQuery({
    queryKey: ['meetingParticipants'],
    queryFn: () => base44.entities.MeetingParticipant.list('-created_at', 1000),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsersForMeetings'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!user?.id) return;
    const unsub1 = base44.entities.Meeting.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    });
    const unsub2 = base44.entities.MeetingParticipant.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['meetingParticipants'] });
    });
    return () => { unsub1(); unsub2(); };
  }, [user?.id, queryClient]);

  // Get participants for a meeting
  const getParticipants = (meetingId) =>
    allParticipants.filter(p => p.meeting_id === meetingId);

  // Filter meetings where user is a participant or creator
  const myMeetings = useMemo(() => {
    if (!user?.id) return [];
    return meetings.filter(m => {
      if (m.created_by === user.id) return true;
      return allParticipants.some(p => p.meeting_id === m.id && p.user_id === user.id);
    });
  }, [meetings, allParticipants, user?.id]);

  // Search filter
  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return myMeetings;
    const q = searchQuery.toLowerCase();
    return myMeetings.filter(m =>
      m.title?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q) ||
      m.created_by_name?.toLowerCase().includes(q)
    );
  }, [myMeetings, searchQuery]);

  const activeMeetings = filteredMeetings.filter(m => m.status === 'active');
  const scheduledMeetings = filteredMeetings.filter(m => m.status === 'scheduled');
  const pastMeetings = filteredMeetings.filter(m => m.status === 'completed' || m.status === 'cancelled');

  // Start a scheduled meeting
  const handleStartMeeting = async (meeting) => {
    setStartingMeeting(meeting.id);
    try {
      // Create room if not already created
      if (!meeting.daily_room_url) {
        await invokeFunction('createDailyRoom', {
          meeting_id: meeting.id,
          title: meeting.title,
          enable_recording: meeting.recording_enabled,
          duration_minutes: meeting.duration_minutes || 60,
        });
        // Refetch to get room URL
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
        const updated = await base44.entities.Meeting.read(meeting.id);
        meeting = { ...meeting, ...updated };
      }

      // Update status to active
      await base44.entities.Meeting.update(meeting.id, {
        status: 'active',
      });

      // Notify participants
      const participants = getParticipants(meeting.id);
      const recipientIds = participants
        .filter(p => p.user_id !== user.id)
        .map(p => p.user_id);

      if (recipientIds.length > 0) {
        try {
          await invokeFunction('createNotification', {
            recipient_ids: recipientIds,
            type: 'meeting_started',
            title: 'Meeting Started',
            message: `"${meeting.title}" has started. Join now!`,
            priority: 'high',
            action_url: '/Communications',
            send_push: true,
          });
        } catch (err) {
          console.error('Failed to send start notifications:', err);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      setActiveMeetingRoom(meeting);
    } catch (err) {
      console.error('Failed to start meeting:', err);
      toast.error('Failed to start meeting');
    } finally {
      setStartingMeeting(null);
    }
  };

  // Join an active meeting
  const handleJoinMeeting = (meeting) => {
    setActiveMeetingRoom(meeting);
  };

  // Leave meeting
  const handleLeaveMeeting = async () => {
    const meeting = activeMeetingRoom;
    setActiveMeetingRoom(null);

    // Check if all participants have left — if organizer left, maybe end the meeting
    if (meeting && meeting.created_by === user?.id) {
      // Organizer left — end the meeting
      try {
        await base44.entities.Meeting.update(meeting.id, {
          status: 'completed',
          ended_at: new Date().toISOString(),
        });
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
      } catch (err) {
        console.error('Failed to end meeting:', err);
      }
    }
  };

  // Cancel a scheduled meeting
  const handleCancelMeeting = async (meeting) => {
    try {
      if (meeting.daily_room_name) {
        await invokeFunction('deleteDailyRoom', {
          room_name: meeting.daily_room_name,
          meeting_id: meeting.id,
        });
      } else {
        await base44.entities.Meeting.update(meeting.id, { status: 'cancelled' });
      }
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting cancelled');
    } catch (err) {
      console.error('Failed to cancel meeting:', err);
      toast.error('Failed to cancel meeting');
    }
    setCancelConfirm(null);
  };

  // Start instant meeting
  const handleInstantMeeting = async () => {
    setStartingMeeting('instant');
    try {
      const now = new Date();
      const newMeeting = await base44.entities.Meeting.create({
        title: `Instant Meeting — ${user?.staff_full_name || user?.full_name || 'Meeting'}`,
        scheduled_at: now.toISOString(),
        duration_minutes: 60,
        created_by: user.id,
        created_by_name: user.staff_full_name || user.full_name,
        status: 'active',
        meeting_type: 'video',
        recording_enabled: false,
      });

      // Add creator as participant
      await base44.entities.MeetingParticipant.create({
        meeting_id: newMeeting.id,
        user_id: user.id,
        user_name: user.staff_full_name || user.full_name,
        user_email: user.email,
        role: 'organizer',
        status: 'joined',
        joined_at: now.toISOString(),
      });

      // Create Daily room
      await invokeFunction('createDailyRoom', {
        meeting_id: newMeeting.id,
        title: newMeeting.title,
        enable_recording: false,
        duration_minutes: 60,
      });

      // Refetch to get room URL
      const updated = await base44.entities.Meeting.read(newMeeting.id);
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meetingParticipants'] });

      setActiveMeetingRoom({ ...newMeeting, ...updated });
    } catch (err) {
      console.error('Failed to create instant meeting:', err);
      toast.error('Failed to start meeting');
    } finally {
      setStartingMeeting(null);
    }
  };

  const handleEditMeeting = (meeting) => {
    setEditMeeting(meeting);
    setShowScheduleDialog(true);
  };

  const MeetingGrid = ({ meetings: meetingList, emptyMessage }) => {
    if (meetingsLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-200 rounded w-1/2 mb-3" />
              <div className="h-3 bg-slate-200 rounded w-1/3" />
            </Card>
          ))}
        </div>
      );
    }

    if (meetingList.length === 0) {
      return (
        <div className="text-center py-12 text-slate-400">
          <Video className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {meetingList.map(m => (
          <MeetingCard
            key={m.id}
            meeting={m}
            participants={getParticipants(m.id)}
            currentUser={user}
            onJoin={handleJoinMeeting}
            onStart={handleStartMeeting}
            onEdit={handleEditMeeting}
            onCancel={(m) => setCancelConfirm(m)}
            onViewDetails={(m) => setSelectedPastMeeting(m)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-6">
      <PageHeader
        title="Video Communications"
        subtitle="Schedule and join video meetings with your team"
        icon={Video}
      />

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleInstantMeeting}
          disabled={!!startingMeeting}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {startingMeeting === 'instant' ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</>
          ) : (
            <><Video className="w-4 h-4 mr-2" />Start Instant Meeting</>
          )}
        </Button>
        <Button
          onClick={() => { setEditMeeting(null); setShowScheduleDialog(true); }}
          variant="outline"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Meeting
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search meetings..."
          className="pl-9 max-w-sm"
        />
      </div>

      {/* Meeting tabs */}
      <Tabs defaultValue="active">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="active" className="text-sm">
            Active {activeMeetings.length > 0 && `(${activeMeetings.length})`}
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="text-sm">
            Scheduled {scheduledMeetings.length > 0 && `(${scheduledMeetings.length})`}
          </TabsTrigger>
          <TabsTrigger value="past" className="text-sm">
            Past {pastMeetings.length > 0 && `(${pastMeetings.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <MeetingGrid
            meetings={activeMeetings}
            emptyMessage="No active meetings right now"
          />
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4">
          <MeetingGrid
            meetings={scheduledMeetings}
            emptyMessage="No upcoming meetings scheduled"
          />
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          <MeetingGrid
            meetings={pastMeetings}
            emptyMessage="No past meetings"
          />
        </TabsContent>
      </Tabs>

      {/* Schedule meeting dialog */}
      <ScheduleMeetingDialog
        open={showScheduleDialog}
        onOpenChange={(open) => {
          setShowScheduleDialog(open);
          if (!open) setEditMeeting(null);
        }}
        meeting={editMeeting}
        currentUser={user}
        allUsers={allUsers}
      />

      {/* Meeting room overlay */}
      {activeMeetingRoom && (
        <MeetingRoom
          meeting={activeMeetingRoom}
          currentUser={user}
          onLeave={handleLeaveMeeting}
        />
      )}

      {/* Past meeting detail */}
      {selectedPastMeeting && (
        <PastMeetingDetail
          meeting={selectedPastMeeting}
          participants={getParticipants(selectedPastMeeting.id)}
          open={!!selectedPastMeeting}
          onClose={() => setSelectedPastMeeting(null)}
        />
      )}

      {/* Whiteboard */}
      {whiteboardMeeting && (
        <MeetingWhiteboard
          meeting={whiteboardMeeting}
          onClose={() => setWhiteboardMeeting(null)}
        />
      )}

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={!!cancelConfirm}
        onOpenChange={(open) => !open && setCancelConfirm(null)}
        title="Cancel Meeting?"
        description={`Are you sure you want to cancel "${cancelConfirm?.title}"? This action cannot be undone.`}
        confirmLabel="Yes, Cancel Meeting"
        variant="destructive"
        onConfirm={() => handleCancelMeeting(cancelConfirm)}
      />
    </div>
  );
}

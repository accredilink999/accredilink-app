import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { invokeFunction } from '@/api/functions';
import { Phone, Maximize2, Minimize2, Loader2 } from 'lucide-react';

export default function MeetingRoom({ meeting, currentUser, onLeave }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // Get participant token on mount
  useEffect(() => {
    async function getToken() {
      try {
        setLoading(true);
        const result = await invokeFunction('getDailyToken', {
          meeting_id: meeting.id,
          room_name: meeting.daily_room_name,
          user_name: currentUser?.staff_full_name || currentUser?.full_name || 'Participant',
        });

        if (result.error) {
          setError(result.error);
          return;
        }

        setToken(result.token);

        // Update participant status to joined
        const participants = await base44.entities.MeetingParticipant.filter({
          meeting_id: meeting.id,
          user_id: currentUser.id,
        });
        if (participants.length > 0) {
          await base44.entities.MeetingParticipant.update(participants[0].id, {
            status: 'joined',
            joined_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Failed to get meeting token:', err);
        setError('Failed to join meeting. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (meeting?.daily_room_name) {
      getToken();
    }
  }, [meeting?.id, meeting?.daily_room_name, currentUser?.id]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const handleLeave = async () => {
    try {
      // Update participant status
      const participants = await base44.entities.MeetingParticipant.filter({
        meeting_id: meeting.id,
        user_id: currentUser.id,
      });
      if (participants.length > 0) {
        await base44.entities.MeetingParticipant.update(participants[0].id, {
          status: 'left',
          left_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error updating participant status:', err);
    }
    onLeave?.();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
          <p className="text-lg font-medium">Joining meeting...</p>
          <p className="text-sm text-slate-400 mt-1">{meeting.title}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md px-4">
          <p className="text-lg font-medium text-red-400 mb-2">Unable to join meeting</p>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <Button variant="outline" className="text-white border-white" onClick={onLeave}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const iframeUrl = token
    ? `${meeting.daily_room_url}?t=${token}`
    : meeting.daily_room_url;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h3 className="text-white font-medium text-sm truncate max-w-[200px] sm:max-w-none">
            {meeting.title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm font-mono">{formatTime(elapsed)}</span>
          <Button
            size="sm"
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={handleLeave}
          >
            <Phone className="w-4 h-4 mr-1 rotate-[135deg]" />
            Leave
          </Button>
        </div>
      </div>

      {/* Daily.co iframe */}
      <div className="flex-1">
        <iframe
          src={iframeUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="w-full h-full border-none"
          title="Video Meeting"
        />
      </div>
    </div>
  );
}

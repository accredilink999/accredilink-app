import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Avatar from '@/components/ui/Avatar';
import { format, parseISO, isAfter, isBefore, addMinutes } from 'date-fns';
import {
  Video, Calendar, Clock, Users, Play, X, Eye, Pencil, Mic
} from 'lucide-react';

const statusConfig = {
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  active: { label: 'Live', className: 'bg-green-100 text-green-700 animate-pulse' },
  completed: { label: 'Completed', className: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-600' },
};

export default function MeetingCard({
  meeting,
  participants = [],
  currentUser,
  onJoin,
  onStart,
  onEdit,
  onCancel,
  onViewDetails,
}) {
  const config = statusConfig[meeting.status] || statusConfig.scheduled;
  const scheduledAt = meeting.scheduled_at ? parseISO(meeting.scheduled_at) : new Date();
  const meetingEnd = addMinutes(scheduledAt, meeting.duration_minutes || 60);
  const now = new Date();
  const isCreator = meeting.created_by === currentUser?.id;
  const canStart = meeting.status === 'scheduled' && isCreator;
  const canJoin = meeting.status === 'active';
  const canEdit = meeting.status === 'scheduled' && isCreator;
  const isCompleted = meeting.status === 'completed';

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Video className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <h4 className="font-semibold text-slate-900 truncate text-sm">
              {meeting.title}
            </h4>
            <Badge variant="secondary" className={`${config.className} text-xs flex-shrink-0`}>
              {config.label}
            </Badge>
          </div>

          {meeting.description && (
            <p className="text-xs text-slate-500 mb-2 line-clamp-2">{meeting.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(scheduledAt, 'EEE, d MMM yyyy')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(scheduledAt, 'HH:mm')} ({meeting.duration_minutes || 60} min)
            </span>
            {meeting.meeting_type === 'audio_only' && (
              <span className="flex items-center gap-1">
                <Mic className="w-3 h-3" />
                Audio only
              </span>
            )}
          </div>

          {/* Participant avatars */}
          {participants.length > 0 && (
            <div className="flex items-center gap-1 mt-2">
              <Users className="w-3 h-3 text-slate-400" />
              <div className="flex -space-x-2">
                {participants.slice(0, 5).map((p) => (
                  <div key={p.id} title={p.user_name}>
                    <Avatar name={p.user_name} size="xs" />
                  </div>
                ))}
              </div>
              {participants.length > 5 && (
                <span className="text-xs text-slate-400 ml-1">+{participants.length - 5}</span>
              )}
              <span className="text-xs text-slate-400 ml-1">
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {meeting.created_by_name && (
            <p className="text-xs text-slate-400 mt-1">
              Organised by {meeting.created_by_name}
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
        {canJoin && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => onJoin?.(meeting)}
          >
            <Play className="w-3 h-3 mr-1" />
            Join
          </Button>
        )}
        {canStart && (
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onStart?.(meeting)}
          >
            <Play className="w-3 h-3 mr-1" />
            Start
          </Button>
        )}
        {canEdit && (
          <Button size="sm" variant="outline" onClick={() => onEdit?.(meeting)}>
            <Pencil className="w-3 h-3 mr-1" />
            Edit
          </Button>
        )}
        {isCompleted && (
          <Button size="sm" variant="outline" onClick={() => onViewDetails?.(meeting)}>
            <Eye className="w-3 h-3 mr-1" />
            View Details
          </Button>
        )}
        {canEdit && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => onCancel?.(meeting)}
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
        )}
      </div>
    </Card>
  );
}

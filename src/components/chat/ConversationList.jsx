import React from 'react';
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from 'date-fns';
import Avatar from '@/components/ui/Avatar';
import { Users, Pin, VolumeX, Check, CheckCheck, Image, Mic } from 'lucide-react';

export default function ConversationList({ conversations, selectedId, onSelect, currentUserId, typingUsers = {} }) {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'dd/MM/yy');
  };

  // Sort: pinned first, then by last_message_at
  const sorted = [...conversations].sort((a, b) => {
    const aPinned = a.pinned_by?.includes(currentUserId);
    const bPinned = b.pinned_by?.includes(currentUserId);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    return new Date(b.last_message_at || b.created_date || 0) - new Date(a.last_message_at || a.created_date || 0);
  });

  return (
    <div className="divide-y divide-slate-100/50">
      {sorted.map((conversation) => {
        const isSelected = conversation.id === selectedId;
        const unreadCount = Math.max(0, parseInt(conversation.unread_count?.[currentUserId]) || 0);
        const hasUnread = unreadCount > 0;
        const isPinned = conversation.pinned_by?.includes(currentUserId);
        const isMuted = conversation.is_muted_by?.includes(currentUserId);

        const otherParticipant = conversation.type === 'direct'
          ? conversation.participant_names?.find((_, idx) => conversation.participants[idx] !== currentUserId)
          : null;
        const displayName = conversation.type === 'group' ? conversation.name : (otherParticipant || 'Unknown');

        // Format last message preview
        let lastMessagePreview = conversation.last_message || 'No messages yet';
        const isOwnLastMessage = conversation.last_message_by === currentUserId;

        // Detect message types
        if (lastMessagePreview === '🎤 Voice Note') {
          lastMessagePreview = '🎤 Voice message';
        }

        // Typing indicator for this conversation
        const typingInConv = typingUsers[conversation.id];
        const typingText = typingInConv?.length > 0
          ? typingInConv.length === 1
            ? `${typingInConv[0]} is typing...`
            : `${typingInConv[0]} and ${typingInConv.length - 1} other${typingInConv.length > 2 ? 's' : ''} typing...`
          : null;

        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={cn(
              "w-full px-4 py-3 flex items-center gap-3 transition-all text-left",
              isSelected
                ? "bg-[#f0f2f5]"
                : "hover:bg-[#f5f6f6]",
              isPinned && "bg-[#fafafa]"
            )}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {conversation.type === 'group' ? (
                conversation.group_photo_url ? (
                  <img src={conversation.group_photo_url} alt={displayName} className="w-[50px] h-[50px] rounded-full object-cover" />
                ) : (
                  <div className="w-[50px] h-[50px] rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                )
              ) : (
                <Avatar name={displayName} size="lg" className="w-[50px] h-[50px]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Top row: name + time */}
              <div className="flex items-center justify-between mb-0.5">
                <span className={cn(
                  "truncate text-[16px]",
                  hasUnread ? "font-semibold text-slate-900" : "font-normal text-slate-900"
                )}>
                  {displayName}
                </span>
                <span className={cn(
                  "text-xs flex-shrink-0 ml-2",
                  hasUnread ? "text-[#25d366] font-medium" : "text-slate-500"
                )}>
                  {formatTime(conversation.last_message_at)}
                </span>
              </div>

              {/* Bottom row: last message + badges */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  {/* Read receipt ticks for own messages */}
                  {isOwnLastMessage && !typingText && (
                    <CheckCheck className="w-4 h-4 flex-shrink-0 text-[#53bdeb]" />
                  )}
                  <p className={cn(
                    "text-sm truncate",
                    typingText
                      ? "text-[#25d366] italic"
                      : hasUnread ? "text-slate-700 font-medium" : "text-slate-500"
                  )}>
                    {typingText || (isOwnLastMessage ? `You: ${lastMessagePreview}` : lastMessagePreview)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isPinned && <Pin className="w-3.5 h-3.5 text-slate-400 rotate-45" />}
                  {isMuted && <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                  {hasUnread && (
                    <span className={cn(
                      "min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center text-white",
                      isMuted ? "bg-slate-400" : "bg-[#25d366]"
                    )}>
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

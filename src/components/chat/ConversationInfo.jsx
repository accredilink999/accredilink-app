import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { X, Users, Bell, BellOff, Pin, LogOut, Trash2, MessageSquare } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

export default function ConversationInfo({
  conversation,
  currentUserId,
  isAdmin,
  onClose,
  onMute,
  onPin,
  onDelete,
  onStartDirectChat,
}) {
  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
  });

  if (!conversation) return null;

  const isGroup = conversation.type === 'group';
  const isMuted = conversation.is_muted_by?.includes(currentUserId);
  const isPinned = conversation.pinned_by?.includes(currentUserId);

  const otherParticipant = !isGroup
    ? conversation.participant_names?.find((_, idx) => conversation.participants[idx] !== currentUserId)
    : null;
  const displayName = isGroup ? conversation.name : otherParticipant;

  const members = conversation.participants
    ?.filter((id, idx, arr) => arr.indexOf(id) === idx)
    .map(id => allUsers.find(u => u.id === id))
    .filter(Boolean) || [];

  return (
    <div className="w-full lg:w-[340px] h-full bg-[#f0f2f5] border-l border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#f0f2f5] px-4 py-4 flex items-center gap-3 border-b border-slate-200">
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full">
          <X className="w-5 h-5 text-[#54656f]" />
        </button>
        <h3 className="font-medium text-slate-900">
          {isGroup ? 'Group info' : 'Contact info'}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Profile section */}
        <div className="bg-white px-6 py-8 text-center">
          {isGroup ? (
            conversation.group_photo_url ? (
              <img src={conversation.group_photo_url} alt={displayName} className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-4">
                <Users className="w-12 h-12 text-white" />
              </div>
            )
          ) : (
            <div className="mx-auto mb-4 w-24 h-24">
              <Avatar name={displayName} size="xl" className="w-24 h-24 text-2xl" />
            </div>
          )}
          <h2 className="text-xl font-semibold text-slate-900">{displayName}</h2>
          {isGroup && (
            <p className="text-sm text-[#667781] mt-1">Group · {members.length} members</p>
          )}
          {!isGroup && (
            <p className="text-sm text-[#667781] mt-1">
              {allUsers.find(u => u.id === conversation.participants?.find(id => id !== currentUserId))?.job_title || 'Staff'}
            </p>
          )}
          {conversation.description && (
            <p className="text-sm text-slate-600 mt-3 px-4">{conversation.description}</p>
          )}
        </div>

        <div className="h-2 bg-[#f0f2f5]" />

        {/* Actions */}
        <div className="bg-white">
          <button
            onClick={onMute}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#f5f6f6] transition-colors text-left"
          >
            {isMuted ? <Bell className="w-5 h-5 text-[#54656f]" /> : <BellOff className="w-5 h-5 text-[#54656f]" />}
            <span className="text-slate-900">{isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
          </button>
          <button
            onClick={onPin}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#f5f6f6] transition-colors text-left"
          >
            <Pin className="w-5 h-5 text-[#54656f]" />
            <span className="text-slate-900">{isPinned ? 'Unpin chat' : 'Pin chat'}</span>
          </button>
        </div>

        {/* Members section (for groups) */}
        {isGroup && (
          <>
            <div className="h-2 bg-[#f0f2f5]" />
            <div className="bg-white">
              <div className="px-6 py-3">
                <p className="text-sm text-[#667781]">{members.length} members</p>
              </div>
              {members.map(member => {
                const name = member.staff_full_name || member.full_name || 'Unknown';
                const isMe = member.id === currentUserId;
                return (
                  <button
                    key={member.id}
                    onClick={() => !isMe && onStartDirectChat?.(member.id)}
                    className="w-full flex items-center gap-3 px-6 py-3 hover:bg-[#f5f6f6] transition-colors text-left"
                    disabled={isMe}
                  >
                    <Avatar name={name} size="md" src={member.photo_url} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{isMe ? 'You' : name}</p>
                      <p className="text-xs text-[#667781]">{member.job_title || member.role || 'Staff'}</p>
                    </div>
                    {!isMe && (
                      <MessageSquare className="w-4 h-4 text-[#54656f]" />
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="h-2 bg-[#f0f2f5]" />

        {/* Danger zone */}
        <div className="bg-white">
          {(isAdmin || conversation.created_by === currentUserId) && (
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors text-left"
            >
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="text-red-500">{isGroup ? 'Delete group' : 'Delete chat'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

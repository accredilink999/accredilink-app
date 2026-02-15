import React, { useState, useRef, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { Check, CheckCheck, Reply, Forward, Copy, Trash2, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Avatar from '@/components/ui/Avatar';
import VoiceNotePlayer from './VoiceNotePlayer';
import { base44 } from '@/api/base44Client';

const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageBubble = React.memo(({
  message,
  isOwn,
  showAvatar,
  showSenderName,
  senderName,
  senderPhotoUrl,
  isAdmin,
  onDelete,
  onReply,
  onForward,
  currentUserId,
  conversationParticipants,
  participantNames,
  replyToMessage,
  isGroup,
}) => {
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef(null);
  const touchStartRef = useRef(null);
  const queryClient = useQueryClient();
  const menuRef = useRef(null);

  const safeParticipants = conversationParticipants || [];
  const readCount = message.read_by?.filter(id => id !== message.sender_id).length || 0;
  const totalOthers = Math.max(0, safeParticipants.length - 1);
  const isRead = readCount >= totalOthers && totalOthers > 0;
  const isDelivered = readCount > 0;
  const canDelete = message.sender_id === currentUserId || isAdmin;

  // Close context menu on outside click
  useEffect(() => {
    if (!showContextMenu) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowContextMenu(false);
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showContextMenu]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPosition({ x: e.clientX || e.touches?.[0]?.clientX || 0, y: e.clientY || e.touches?.[0]?.clientY || 0 });
    setShowContextMenu(true);
  };

  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimerRef.current = setTimeout(() => {
      setMenuPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setShowContextMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const addReactionMutation = useMutation({
    mutationFn: async (emoji) => {
      const reactions = { ...(message.emoji_reactions || {}) };
      const userIds = reactions[emoji] || [];
      if (userIds.includes(currentUserId)) {
        reactions[emoji] = userIds.filter(id => id !== currentUserId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...userIds, currentUserId];
      }
      return base44.entities.ChatMessage.update(message.id, {
        emoji_reactions: Object.keys(reactions).length > 0 ? reactions : null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages'] });
      setShowReactions(false);
      setShowContextMenu(false);
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || '');
    setShowContextMenu(false);
  };

  const timeString = format(new Date(message.created_date || message.created_at), 'HH:mm');

  return (
    <div className={cn("flex gap-1.5 mb-0.5 px-2 relative group max-w-full overflow-hidden", isOwn ? "justify-end" : "justify-start")}>
      {/* Avatar for others */}
      {!isOwn && isGroup && showAvatar && (
        <Avatar name={senderName} size="xs" className="mt-auto mb-1 flex-shrink-0" src={senderPhotoUrl} />
      )}
      {!isOwn && isGroup && !showAvatar && <div className="w-6 flex-shrink-0" />}

      <div className={cn("max-w-[75%] sm:max-w-[65%] relative min-w-0")}>
        {/* Sender name in groups */}
        {!isOwn && isGroup && showSenderName && (
          <p className="text-xs font-semibold px-1 mb-0.5" style={{ color: getNameColor(senderName) }}>
            {senderName}
          </p>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "relative rounded-lg px-2.5 py-1.5 shadow-sm select-text",
            isOwn
              ? "bg-[#d9fdd3] rounded-tr-none"
              : "bg-white rounded-tl-none",
          )}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchMove}
        >
          {/* Bubble tail */}
          <div className={cn(
            "absolute top-0 w-2 h-3 overflow-hidden",
            isOwn ? "-right-2" : "-left-2"
          )}>
            <div className={cn(
              "w-4 h-4 rotate-45 transform origin-bottom-left",
              isOwn ? "bg-[#d9fdd3] -translate-x-2.5" : "bg-white translate-x-0.5"
            )} />
          </div>

          {/* Reply-to preview */}
          {replyToMessage && (
            <div className={cn(
              "border-l-4 rounded px-2 py-1 mb-1.5 text-xs",
              replyToMessage.sender_id === currentUserId
                ? "border-[#06cf9c] bg-[#d1f4cc]"
                : "border-[#53bdeb] bg-[#e7f8fd]"
            )}>
              <p className="font-semibold text-[#06cf9c] truncate">
                {replyToMessage.sender_id === currentUserId ? 'You' : replyToMessage.sender_name}
              </p>
              <p className="text-slate-600 truncate">{replyToMessage.content}</p>
            </div>
          )}

          {/* Forwarded label */}
          {message.forwarded_from && (
            <div className="flex items-center gap-1 mb-1">
              <Forward className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400 italic">Forwarded</span>
            </div>
          )}

          {/* Attachment */}
          {message.attachment_url && (
            <div className="mb-1.5">
              {message.attachment_type === 'image' ? (
                <img
                  src={message.attachment_url}
                  alt="attachment"
                  className="rounded-md max-w-full max-h-64 object-cover cursor-pointer"
                  onClick={() => window.open(message.attachment_url, '_blank')}
                />
              ) : message.attachment_type === 'audio' ? (
                <VoiceNotePlayer url={message.attachment_url} isOwn={isOwn} />
              ) : (
                <a
                  href={message.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded bg-white/50 border border-slate-200 hover:bg-white/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                    DOC
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{message.content}</p>
                    <p className="text-xs text-slate-500">Document</p>
                  </div>
                </a>
              )}
            </div>
          )}

          {/* Message content */}
          {(!message.attachment_url || message.attachment_type === 'audio' || (message.content && message.content !== '🎤 Voice Note')) && (
            <div className="flex items-end gap-2">
              <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words text-slate-900 flex-1" style={{ overflowWrap: 'anywhere' }}>
                {message.attachment_type === 'audio' ? null : message.content}
              </p>
              {/* Time + read receipt inline */}
              <span className={cn(
                "text-[11px] flex items-center gap-0.5 flex-shrink-0 translate-y-1",
                isOwn ? "text-[#667781]" : "text-[#667781]"
              )}>
                {timeString}
                {isOwn && (
                  isRead ? (
                    <CheckCheck className="w-4 h-4 text-[#53bdeb] ml-0.5" />
                  ) : isDelivered ? (
                    <CheckCheck className="w-4 h-4 text-[#667781] ml-0.5" />
                  ) : (
                    <Check className="w-4 h-4 text-[#667781] ml-0.5" />
                  )
                )}
              </span>
            </div>
          )}

          {/* Time for image-only messages */}
          {message.attachment_url && message.attachment_type === 'image' && (
            <div className="flex justify-end mt-0.5">
              <span className={cn(
                "text-[11px] flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
                "bg-black/30 text-white"
              )}>
                {timeString}
                {isOwn && (
                  isRead ? (
                    <CheckCheck className="w-4 h-4 text-[#53bdeb] ml-0.5" />
                  ) : (
                    <Check className="w-4 h-4 text-white ml-0.5" />
                  )
                )}
              </span>
            </div>
          )}
        </div>

        {/* Emoji reactions */}
        {message.emoji_reactions && Object.keys(message.emoji_reactions).length > 0 && (
          <div className={cn("flex flex-wrap gap-1 mt-0.5", isOwn ? "justify-end" : "justify-start")}>
            {Object.entries(message.emoji_reactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                onClick={() => addReactionMutation.mutate(emoji)}
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border shadow-sm transition-colors",
                  userIds.includes(currentUserId)
                    ? "bg-[#e7ffdb] border-[#25d366]"
                    : "bg-white border-slate-200 hover:bg-slate-50"
                )}
              >
                <span>{emoji}</span>
                {userIds.length > 1 && <span className="text-[10px] text-slate-600">{userIds.length}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu — centered on mobile, positioned on desktop */}
      {showContextMenu && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 w-[240px] sm:w-auto"
          style={{
            left: window.innerWidth < 640
              ? Math.max(8, (window.innerWidth - 240) / 2)
              : Math.max(8, Math.min(menuPosition.x, window.innerWidth - 220)),
            top: window.innerWidth < 640
              ? Math.max(80, Math.min(menuPosition.y - 40, window.innerHeight - 280))
              : Math.max(8, Math.min(menuPosition.y - 60, window.innerHeight - 300)),
          }}
        >
          {/* Quick reactions */}
          <div className="flex gap-1 p-2 border-b border-slate-100 justify-center">
            {quickReactions.map(emoji => (
              <button
                key={emoji}
                onClick={() => addReactionMutation.mutate(emoji)}
                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-100 rounded-full transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="py-1">
            <ContextMenuItem icon={Reply} label="Reply" onClick={() => { onReply?.(message); setShowContextMenu(false); }} />
            <ContextMenuItem icon={Forward} label="Forward" onClick={() => { onForward?.(message); setShowContextMenu(false); }} />
            <ContextMenuItem icon={Copy} label="Copy" onClick={handleCopy} />
            {canDelete && (
              <ContextMenuItem
                icon={Trash2}
                label="Delete"
                onClick={() => { onDelete?.(message.id); setShowContextMenu(false); }}
                danger
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
});

function ContextMenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// Generate consistent color from name for group chat sender names
function getNameColor(name) {
  const colors = [
    '#e17076', '#7bc862', '#e5a64e', '#65aadd',
    '#a695e7', '#ee7aae', '#6ec9cb', '#faa774',
  ];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

MessageBubble.displayName = 'MessageBubble';
export default MessageBubble;

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import {
  Send, Paperclip, ArrowLeft, MoreVertical, Users, UserPlus,
  Smile, X, ArrowDown, Pin, VolumeX, Volume2, Trash2
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import VoiceRecorder from './VoiceRecorder';
import Avatar from '@/components/ui/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

const emojiList = ['😀', '😂', '😍', '🥳', '😭', '😡', '🤔', '👍', '❤️', '🔥', '✨', '👏', '🎉', '😴', '🤢', '😱', '🙏', '💪', '🍕', '🎮', '📱', '🚀', '⚡', '🌟', '💯', '🎯', '🏆', '🎸', '🍷', '☕', '🍉', '🦁', '🐶', '🐱', '🦋', '🐢', '🦊', '🐻', '🎨', '📚'];

export default function ChatWindow({ conversation, currentUserId, currentUserName, isAdmin, onBack, onDeleteConversation, onOpenInfo }) {
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [deleteMessageDialogOpen, setDeleteMessageDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [showAddMembersDialog, setShowAddMembersDialog] = useState(false);
  const [selectedNewMembers, setSelectedNewMembers] = useState([]);
  const [showMembersDialog, setShowMembersDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const presenceChannelRef = useRef(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['chatMessages', conversation?.id],
    queryFn: () => base44.entities.ChatMessage.filter({ conversation_id: conversation.id }, 'created_date', 500),
    enabled: !!conversation,
  });

  // Build a lookup for reply-to messages
  const messagesById = useMemo(() => {
    const map = {};
    messages.forEach(m => { map[m.id] = m; });
    return map;
  }, [messages]);

  // ── Typing indicators via Supabase Presence ──
  useEffect(() => {
    if (!conversation?.id || !currentUserId) return;

    let channel;
    try {
      channel = supabase.channel(`typing:${conversation.id}`, {
        config: { presence: { key: currentUserId } },
      });

      channel.on('presence', { event: 'sync' }, () => {
        try {
          const state = channel.presenceState();
          const typing = [];
          Object.entries(state).forEach(([userId, data]) => {
            if (userId !== currentUserId && data?.[0]?.typing) {
              typing.push(data[0].name || 'Someone');
            }
          });
          setTypingUsers(typing);
        } catch (e) {
          // Presence sync error - non-critical
        }
      });

      channel.subscribe();
      presenceChannelRef.current = channel;
    } catch (e) {
      console.warn('Presence channel setup failed:', e);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch (e) {}
      presenceChannelRef.current = null;
    };
  }, [conversation?.id, currentUserId]);

  const broadcastTyping = useCallback((isTyping) => {
    presenceChannelRef.current?.track({
      typing: isTyping,
      name: currentUserName || 'Someone',
    });
  }, [currentUserName]);

  const playSendSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      // Quick ascending "whoosh" — two short tones
      [600, 900].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.1);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.1);
      });
    } catch (e) {}
  }, []);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    broadcastTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => broadcastTyping(false), 3000);
  };

  // ── Send message ──
  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      const chatMessage = await base44.entities.ChatMessage.create(data);

      // All other participants get their unread count incremented
      const otherParticipants = (conversation.participants || []).filter(p => p !== currentUserId);

      await base44.entities.Conversation.update(conversation.id, {
        last_message: data.content,
        last_message_at: new Date().toISOString(),
        last_message_by: currentUserId,
        unread_count: {
          ...(typeof conversation.unread_count === 'object' ? conversation.unread_count : {}),
          [currentUserId]: 0, // Sender is in the chat — always 0
          ...otherParticipants.reduce((acc, p) => ({
            ...acc,
            [p]: ((conversation.unread_count?.[p] || 0) + 1)
          }), {})
        }
      });

      // Trigger push notification (non-blocking)
      try {
        const pushResult = await base44.functions.invoke('sendChatMessagePushNotification', {
          event: { type: 'create' },
          data: chatMessage,
        });
        console.log('[Chat Push] Result:', pushResult);
      } catch (e) {
        console.warn('[Chat Push] Failed:', e?.message || e);
      }

      return chatMessage;
    },
    onMutate: async (data) => {
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = { id: tempId, ...data, created_date: new Date().toISOString() };
      queryClient.setQueryData(['chatMessages', conversation.id], (old = []) => [...old, optimisticMessage]);
      return { tempId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
      setReplyTo(null);
      broadcastTyping(false);
      playSendSound();
    },
  });

  // ── Mark as read ──
  useEffect(() => {
    if (!conversation?.id || !currentUserId || messages.length === 0) return;

    const unreadMessages = messages.filter(m =>
      m.sender_id !== currentUserId && !m.read_by?.includes(currentUserId)
    );

    // Only update when there are actually unread messages from others.
    // Running this unconditionally causes a race condition with the send mutation
    // (it overwrites the recipient's freshly-incremented count back to 0).
    if (unreadMessages.length === 0) return;

    Promise.all(unreadMessages.map(msg =>
      base44.entities.ChatMessage.update(msg.id, { read_by: [...(msg.read_by || []), currentUserId] })
    )).then(() => {
      // Refetch conversation to get latest unread_count before updating
      return base44.entities.Conversation.filter({ id: conversation.id });
    }).then((freshConvs) => {
      const freshConv = freshConvs?.[0] || conversation;
      return base44.entities.Conversation.update(conversation.id, {
        unread_count: {
          ...(typeof freshConv.unread_count === 'object' ? freshConv.unread_count : {}),
          [currentUserId]: 0
        }
      });
    }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversation.id], exact: true });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
  }, [conversation?.id, currentUserId, messages.length]);

  // ── Realtime subscriptions ──
  useEffect(() => {
    if (!conversation?.id || !currentUserId) return;

    const unsubMessages = base44.entities.ChatMessage.subscribe((event) => {
      // Always refetch for the current conversation.
      // UPDATE events (e.g. read_by changes) may not include conversation_id
      // unless REPLICA IDENTITY FULL is set, so don't gate on it.
      const matchesConv = !event.data?.conversation_id || event.data.conversation_id === conversation.id;
      if (matchesConv) {
        queryClient.refetchQueries({ queryKey: ['chatMessages', conversation.id], exact: true });
      }
    });

    const unsubConvs = base44.entities.Conversation.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'], exact: false });
    });

    return () => { unsubMessages(); unsubConvs(); };
  }, [conversation?.id, currentUserId, queryClient]);

  // ── Scroll management ──
  useEffect(() => {
    if (conversation?.id) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (messages.length > 0 && conversation) {
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
        if (isNearBottom) {
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
          setNewMessageCount(prev => prev + 1);
        }
      }
    }
  }, [messages.length]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollButton(distFromBottom > 300);
    if (distFromBottom < 50) setNewMessageCount(0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setNewMessageCount(0);
  };

  // ── Delete message ──
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId) => {
      await base44.entities.ChatMessage.delete(messageId);
      const remaining = messages.filter(m => m.id !== messageId);
      const newLast = remaining[remaining.length - 1];
      await base44.entities.Conversation.update(conversation.id, {
        last_message: newLast?.content || '',
        last_message_at: newLast?.created_date || new Date().toISOString(),
        last_message_by: newLast?.sender_id || ''
      });
    },
    onMutate: (messageId) => {
      queryClient.setQueryData(['chatMessages', conversation.id], (old = []) =>
        old.filter(m => m.id !== messageId)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setDeleteMessageDialogOpen(false);
      setMessageToDelete(null);
    },
  });

  // ── Edit message ──
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }) => {
      await base44.entities.ChatMessage.update(messageId, {
        content,
        is_edited: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatMessages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setEditingMessage(null);
      setMessage('');
    },
  });

  // ── Add members ──
  const addMembersMutation = useMutation({
    mutationFn: async (newMemberIds) => {
      const newParticipants = [...conversation.participants, ...newMemberIds];
      const newParticipantNames = [
        ...conversation.participant_names,
        ...newMemberIds.map(id => {
          const u = allUsers.find(u => u.id === id);
          return u?.staff_full_name || u?.full_name;
        })
      ];
      return base44.entities.Conversation.update(conversation.id, {
        participants: newParticipants,
        participant_names: newParticipantNames,
        unread_count: newParticipants.reduce((acc, p) => ({
          ...acc, [p]: conversation.unread_count?.[p] || 0
        }), {})
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowAddMembersDialog(false);
      setSelectedNewMembers([]);
    },
  });

  // ── Pin / Mute ──
  const togglePin = async () => {
    const pinned = conversation.pinned_by || [];
    const newPinned = pinned.includes(currentUserId)
      ? pinned.filter(id => id !== currentUserId)
      : [...pinned, currentUserId];
    await base44.entities.Conversation.update(conversation.id, { pinned_by: newPinned });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  const toggleMute = async () => {
    const muted = conversation.is_muted_by || [];
    const newMuted = muted.includes(currentUserId)
      ? muted.filter(id => id !== currentUserId)
      : [...muted, currentUserId];
    await base44.entities.Conversation.update(conversation.id, { is_muted_by: newMuted });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  };

  // ── Send handlers ──
  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // If editing, update the existing message
    if (editingMessage) {
      if (editMessageMutation.isPending) return;
      editMessageMutation.mutate({ messageId: editingMessage.id, content: message.trim() });
      return;
    }

    if (sendMessageMutation.isPending) return;
    const user = await base44.auth.me();
    sendMessageMutation.mutate({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      sender_name: user.staff_full_name || user.full_name,
      sender_photo_url: user.photo_url,
      content: message.trim(),
      read_by: [currentUserId],
      reply_to_id: replyTo?.id || null,
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const user = await base44.auth.me();
      sendMessageMutation.mutate({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        sender_name: user.staff_full_name || user.full_name,
        sender_photo_url: user.photo_url,
        content: file.name,
        attachment_url: file_url,
        attachment_type: file.type.startsWith('image/') ? 'image' : 'document',
        read_by: [currentUserId],
        reply_to_id: replyTo?.id || null,
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVoiceMessageSend = async (voiceData) => {
    const user = await base44.auth.me();
    sendMessageMutation.mutate({
      conversation_id: conversation.id,
      sender_id: currentUserId,
      sender_name: user.staff_full_name || user.full_name,
      sender_photo_url: user.photo_url,
      content: voiceData.content,
      attachment_url: voiceData.attachment_url || null,
      attachment_type: voiceData.attachment_type || null,
      read_by: [currentUserId],
    });
  };

  // ── Derived values (must be before any early return so hooks stay stable) ──
  const isGroup = conversation?.type === 'group';
  const participants = conversation?.participants || [];
  const participantNames = conversation?.participant_names || [];
  const otherParticipant = !isGroup
    ? participantNames.find((_, idx) => participants[idx] !== currentUserId)
    : null;
  const displayName = isGroup ? (conversation?.name || 'Group') : (otherParticipant || 'Chat');
  const isPinned = conversation?.pinned_by?.includes(currentUserId);
  const isMuted = conversation?.is_muted_by?.includes(currentUserId);
  const availableToAdd = allUsers.filter(u => !participants.includes(u.id));

  // ── Group messages by date (must be called unconditionally — React hooks rule) ──
  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;
    messages.forEach((msg, idx) => {
      const msgDate = new Date(msg.created_date || msg.created_at);
      if (!lastDate || !isSameDay(lastDate, msgDate)) {
        groups.push({ type: 'date', date: msgDate, id: `date-${idx}` });
        lastDate = msgDate;
      }
      const prevMsg = idx > 0 ? messages[idx - 1] : null;
      const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id ||
        !isSameDay(new Date(prevMsg.created_date || prevMsg.created_at), msgDate);
      const showSenderName = isGroup && showAvatar && msg.sender_id !== currentUserId;

      groups.push({ type: 'message', message: msg, showAvatar, showSenderName, id: msg.id });
    });
    return groups;
  }, [messages, isGroup, currentUserId]);

  const formatDateSeparator = (date) => {
    if (isToday(date)) return 'TODAY';
    if (isYesterday(date)) return 'YESTERDAY';
    return format(date, 'EEEE, d MMMM yyyy').toUpperCase();
  };

  // Typing text for header
  const typingText = typingUsers.length > 0
    ? typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.slice(0, 2).join(', ')} are typing...`
    : null;

  // ── Empty state ──
  if (!conversation) {
    return (
      <div className="flex-1 hidden lg:flex flex-col items-center justify-center bg-[#f0f2f5]">
        <div className="w-[320px] text-center">
          <div className="w-[200px] h-[200px] mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
            <svg className="w-24 h-24 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-2xl font-light text-slate-700 mb-2">Accredilink Chat</h3>
          <p className="text-sm text-slate-500">Send and receive messages. Select a conversation to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#efeae2] min-w-0 overflow-hidden" style={{ maxWidth: '100%' }}>
      {/* ── Header ── */}
      <div className="bg-[#f0f2f5] border-b border-slate-200 px-3 py-2 flex items-center gap-3 z-10">
        <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden h-9 w-9">
          <ArrowLeft className="w-5 h-5 text-[#54656f]" />
        </Button>

        <div className="cursor-pointer flex items-center gap-3 flex-1 min-w-0" onClick={() => onOpenInfo?.()}>
          {isGroup ? (
            conversation.group_photo_url ? (
              <img src={conversation.group_photo_url} alt={displayName} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
            )
          ) : (
            <Avatar name={displayName} size="md" />
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-slate-900 text-[16px] truncate">{displayName}</h3>
            {typingText ? (
              <p className="text-xs text-[#25d366] font-medium animate-pulse">{typingText}</p>
            ) : isGroup ? (
              <p className="text-xs text-[#667781] truncate">
                {conversation.participant_names?.slice(0, 4).join(', ')}
                {conversation.participant_names?.length > 4 && ` +${conversation.participant_names.length - 4}`}
              </p>
            ) : null}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="w-5 h-5 text-[#54656f]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setShowMembersDialog(true)}>
              <Users className="w-4 h-4 mr-2" /> View Members
            </DropdownMenuItem>
            {isGroup && (
              <DropdownMenuItem onClick={() => setShowAddMembersDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" /> Add Members
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={togglePin}>
              <Pin className="w-4 h-4 mr-2" /> {isPinned ? 'Unpin' : 'Pin'} Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleMute}>
              {isMuted ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
              {isMuted ? 'Unmute' : 'Mute'} Notifications
            </DropdownMenuItem>
            {(isAdmin || conversation.created_by === currentUserId) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDeleteConversation(conversation)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Conversation
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden py-2 relative"
        onScroll={handleScroll}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8b89a' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundColor: '#efeae2',
        }}
      >
        {groupedMessages.map((item) => {
          if (item.type === 'date') {
            return (
              <div key={item.id} className="flex justify-center my-3">
                <span className="bg-white/90 backdrop-blur-sm text-[#54656f] text-[12.5px] px-3 py-1 rounded-lg shadow-sm font-medium">
                  {formatDateSeparator(item.date)}
                </span>
              </div>
            );
          }

          const msg = item.message;
          const isOwn = msg.sender_id === currentUserId;
          const replyToMsg = msg.reply_to_id ? messagesById[msg.reply_to_id] : null;

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={isOwn}
              showAvatar={item.showAvatar}
              showSenderName={item.showSenderName}
              senderName={msg.sender_name}
              senderPhotoUrl={msg.sender_photo_url}
              isAdmin={isAdmin}
              currentUserId={currentUserId}
              conversationParticipants={conversation.participants}
              participantNames={conversation.participant_names}
              replyToMessage={replyToMsg}
              isGroup={isGroup}
              onDelete={(msgId) => {
                setMessageToDelete(msgId);
                setDeleteMessageDialogOpen(true);
              }}
              onEdit={(msg) => {
                setEditingMessage(msg);
                setMessage(msg.content || '');
                setReplyTo(null);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              onReply={(msg) => {
                setReplyTo(msg);
                setEditingMessage(null);
                inputRef.current?.focus();
              }}
              onForward={() => {}}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Scroll to bottom FAB ── */}
      {showScrollButton && (
        <div className="absolute bottom-24 right-6 z-20">
          <button
            onClick={scrollToBottom}
            className="w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors relative"
          >
            <ArrowDown className="w-5 h-5 text-[#54656f]" />
            {newMessageCount > 0 && (
              <span className="absolute -top-2 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-[#25d366] text-white text-xs font-bold flex items-center justify-center">
                {newMessageCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* ── Reply bar ── */}
      {replyTo && (
        <div className="bg-[#f0f2f5] border-t border-slate-200 px-4 py-2 flex items-center gap-3">
          <div className="flex-1 border-l-4 border-[#25d366] bg-white rounded px-3 py-2">
            <p className="text-xs font-semibold text-[#06cf9c]">
              {replyTo.sender_id === currentUserId ? 'You' : replyTo.sender_name}
            </p>
            <p className="text-sm text-slate-600 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      )}

      {/* ── Edit bar ── */}
      {editingMessage && (
        <div className="bg-[#f0f2f5] border-t border-slate-200 px-4 py-2 flex items-center gap-3">
          <div className="flex-1 border-l-4 border-blue-500 bg-white rounded px-3 py-2">
            <p className="text-xs font-semibold text-blue-600">Editing message</p>
            <p className="text-sm text-slate-600 truncate">{editingMessage.content}</p>
          </div>
          <button onClick={() => { setEditingMessage(null); setMessage(''); }} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="bg-[#f0f2f5] px-3 py-2 max-w-full">
        <form onSubmit={handleSend} className="flex items-end gap-2 max-w-full">
          <div className="flex items-center gap-1 flex-shrink-0">
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <button type="button" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <Smile className="w-6 h-6 text-[#54656f]" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" side="top" align="start">
                <div className="grid grid-cols-8 gap-1.5">
                  {emojiList.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { setMessage(m => m + emoji); setShowEmojiPicker(false); inputRef.current?.focus(); }}
                      className="text-2xl hover:bg-slate-100 p-1 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <input type="file" id="chat-file-upload" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
            <button
              type="button"
              onClick={() => document.getElementById('chat-file-upload').click()}
              disabled={uploading}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <Paperclip className="w-6 h-6 text-[#54656f] rotate-45" />
            </button>
          </div>

          <div className="flex-1 min-w-0 bg-white rounded-lg border border-slate-200 px-3 py-2">
            <input
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              placeholder="Type a message"
              className="w-full text-[15px] text-slate-900 placeholder:text-[#667781] outline-none bg-transparent"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSend(e);
                }
              }}
            />
          </div>

          {message.trim() ? (
            <button
              type="submit"
              disabled={sendMessageMutation.isPending}
              className="p-2.5 bg-[#00a884] hover:bg-[#008f72] rounded-full transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          ) : (
            <VoiceRecorder
              onVoiceMessageSend={handleVoiceMessageSend}
              disabled={sendMessageMutation.isPending}
            />
          )}
        </form>
      </div>

      {/* ── Delete Message Dialog ── */}
      <Dialog open={deleteMessageDialogOpen} onOpenChange={setDeleteMessageDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete message?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">This message will be permanently deleted.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setDeleteMessageDialogOpen(false); setMessageToDelete(null); }}>
              Cancel
            </Button>
            <Button onClick={() => deleteMessageMutation.mutate(messageToDelete)} className="bg-red-500 hover:bg-red-600">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── View Members Dialog ── */}
      <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isGroup ? conversation.name : 'Chat'} - Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {conversation.participants
              ?.filter((id, idx, arr) => allUsers.find(u => u.id === id) && arr.indexOf(id) === idx)
              .map((participantId) => {
                const user = allUsers.find(u => u.id === participantId);
                const name = user?.staff_full_name || user?.full_name || 'Unknown';
                return (
                  <div key={participantId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                    <Avatar name={name} size="md" src={user?.photo_url} />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{name}</p>
                      <p className="text-xs text-slate-500">{user?.job_title || user?.role || 'Staff'}</p>
                    </div>
                    {participantId === currentUserId && (
                      <span className="text-xs text-teal-600 font-medium bg-teal-50 px-2 py-0.5 rounded-full">You</span>
                    )}
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add Members Dialog ── */}
      <Dialog open={showAddMembersDialog} onOpenChange={setShowAddMembersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Members</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
              {availableToAdd.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">All users are already in this group</div>
              ) : (
                availableToAdd.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelectedNewMembers(prev =>
                      prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]
                    )}
                  >
                    <Checkbox checked={selectedNewMembers.includes(u.id)} onCheckedChange={() => {}} />
                    <Avatar name={u.staff_full_name || u.full_name} size="sm" />
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 text-sm">{u.staff_full_name || u.full_name}</p>
                      <p className="text-xs text-slate-500">{u.job_title || u.role}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowAddMembersDialog(false); setSelectedNewMembers([]); }} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => selectedNewMembers.length > 0 && addMembersMutation.mutate(selectedNewMembers)}
                disabled={selectedNewMembers.length === 0 || addMembersMutation.isPending}
                className="flex-1 bg-[#00a884] hover:bg-[#008f72]"
              >
                {addMembersMutation.isPending ? 'Adding...' : 'Add Members'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

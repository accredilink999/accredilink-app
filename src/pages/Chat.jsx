import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Plus, MessageSquare, ArrowLeft, Camera, Loader2 } from 'lucide-react';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import Avatar from '@/components/ui/Avatar';
import EmptyState from '@/components/ui/EmptyState';

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [chatType, setChatType] = useState('private');
  const [newChatStep, setNewChatStep] = useState(1);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);
  const [filterTab, setFilterTab] = useState('all');
  const [groupPhotoUrl, setGroupPhotoUrl] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const groupPhotoInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allConversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const convs = await base44.entities.Conversation.list('-last_message_at', 500);
      return convs.map(conv => ({
        ...conv,
        unread_count: typeof conv.unread_count === 'object' ? conv.unread_count : {}
      }));
    },
    staleTime: 0,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 1000),
  });

  const isAdmin = user?.role === 'admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const participants = [...selectedUsers, user.id];
      const participantNames = [
        ...selectedUsers.map(id => {
          const u = allUsers.find(u => u.id === id);
          return u?.staff_full_name || u?.full_name || 'Unknown';
        }).filter(Boolean),
        user.staff_full_name || user.full_name
      ].filter(name => name && name !== 'Unknown');

      return base44.entities.Conversation.create({
        type: chatType === 'private' ? 'direct' : 'group',
        name: chatType !== 'private' ? groupName : null,
        participants,
        participant_names: participantNames,
        unread_count: participants.reduce((acc, p) => ({ ...acc, [p]: 0 }), {}),
        created_by: user.id,
        ...(groupPhotoUrl && { group_photo_url: groupPhotoUrl }),
      });
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(newConversation);
      closeNewChat();
    },
    onError: (error) => {
      console.error('Failed to create conversation:', error);
    }
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId) => {
      const messages = await base44.entities.ChatMessage.filter({ conversation_id: conversationId });
      for (const msg of messages) {
        await base44.entities.ChatMessage.delete(msg.id);
      }
      await base44.entities.Conversation.delete(conversationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedConversation(null);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    },
  });

  React.useEffect(() => {
    if (!user?.id) return;
    const unsub1 = base44.entities.Conversation.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    const unsub2 = base44.entities.ChatMessage.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });
    return () => { unsub1(); unsub2(); };
  }, [user?.id, queryClient]);

  const closeNewChat = () => {
    setShowNewChat(false);
    setSelectedUsers([]);
    setGroupName('');
    setChatType('private');
    setNewChatStep(1);
    setNewChatSearch('');
    setGroupPhotoUrl(null);
  };

  const handleGroupPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setGroupPhotoUrl(file_url);
    } catch (err) {
      console.error('Failed to upload group photo:', err);
    }
    setUploadingPhoto(false);
    e.target.value = '';
  };

  const myConversations = allConversations.filter(conv =>
    conv.participants?.includes(user?.id)
  );

  const filteredConversations = myConversations.filter(conv => {
    const query = searchQuery.toLowerCase();
    let matchesSearch = true;
    if (query) {
      if (conv.type === 'group') {
        matchesSearch = conv.name?.toLowerCase().includes(query);
      } else {
        const otherName = conv.participant_names?.find((_, idx) =>
          conv.participants[idx] !== user?.id
        );
        matchesSearch = otherName?.toLowerCase().includes(query);
      }
    }
    if (!matchesSearch) return false;
    if (filterTab === 'unread') {
      return (conv.unread_count?.[user?.id] || 0) > 0;
    } else if (filterTab === 'groups') {
      return conv.type === 'group';
    }
    return true;
  });

  const unreadCount = myConversations.filter(conv =>
    (conv.unread_count?.[user?.id] || 0) > 0
  ).length;

  const availableUsers = useMemo(() => {
    if (!user?.id) return [];
    return allUsers.filter(u => u.id !== user.id);
  }, [allUsers, user?.id]);

  const filteredUsers = useMemo(() => {
    let users = availableUsers;
    if (newChatSearch) {
      const q = newChatSearch.toLowerCase();
      users = users.filter(u =>
        (u.staff_full_name || u.full_name || '').toLowerCase().includes(q) ||
        (u.job_title || '').toLowerCase().includes(q)
      );
    }
    return users.sort((a, b) =>
      (a.staff_full_name || a.full_name || '').localeCompare(b.staff_full_name || b.full_name || '')
    );
  }, [availableUsers, newChatSearch]);

  const groupedUsers = useMemo(() => {
    const groups = {};
    filteredUsers.forEach(u => {
      const letter = (u.staff_full_name || u.full_name || '?')[0].toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(u);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredUsers]);

  const handleSelectContact = (contactId) => {
    if (chatType === 'private') {
      const existing = myConversations.find(conv =>
        conv.type === 'direct' &&
        conv.participants?.includes(contactId) &&
        conv.participants?.includes(user.id)
      );
      if (existing) {
        setSelectedConversation(existing);
        closeNewChat();
        return;
      }
      // Auto-create direct conversation
      const contact = allUsers.find(u => u.id === contactId);
      const participants = [contactId, user.id];
      const participantNames = [
        contact?.staff_full_name || contact?.full_name || 'Unknown',
        user.staff_full_name || user.full_name
      ];

      base44.entities.Conversation.create({
        type: 'direct',
        participants,
        participant_names: participantNames,
        unread_count: participants.reduce((acc, p) => ({ ...acc, [p]: 0 }), {}),
        created_by: user.id,
      }).then((newConv) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        setSelectedConversation(newConv);
        closeNewChat();
      });
    } else {
      setSelectedUsers(prev =>
        prev.includes(contactId)
          ? prev.filter(id => id !== contactId)
          : [...prev, contactId]
      );
    }
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length === 0 || !groupName.trim()) return;
    createConversationMutation.mutate();
  };

  return (
    <div className="space-y-0 w-full overflow-hidden" style={{ maxWidth: '100%' }}>
      <div
        className="flex bg-white rounded-none lg:rounded-xl shadow-lg border border-slate-200 overflow-hidden w-full"
        style={{ height: 'calc(100dvh - 12rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))', maxWidth: '100%' }}
      >
        {/* ── Sidebar ── */}
        <div className={`w-full lg:w-[400px] border-r border-slate-200 flex flex-col bg-white ${selectedConversation ? 'hidden lg:flex' : 'flex'}`}>
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[22px] font-bold text-slate-900">Chats</h2>
              <Button
                size="icon"
                onClick={() => setShowNewChat(true)}
                className="bg-[#00a884] hover:bg-[#008f72] h-10 w-10 rounded-full shadow-md"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#54656f]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search or start new chat"
                className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] rounded-lg text-sm text-slate-900 placeholder:text-[#667781] outline-none focus:bg-white focus:ring-1 focus:ring-[#00a884] transition-colors"
              />
            </div>

            <div className="flex gap-2 mt-3">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread', count: unreadCount },
                { key: 'groups', label: 'Groups' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    filterTab === tab.key
                      ? 'bg-[#00a884] text-white'
                      : 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9ebee]'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && ` (${tab.count})`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No conversations"
                description={filterTab !== 'all' ? `No ${filterTab} conversations` : 'Start a new chat to begin messaging'}
              />
            ) : (
              <ConversationList
                conversations={filteredConversations}
                selectedId={selectedConversation?.id}
                onSelect={(conv) => setSelectedConversation(conv)}
                currentUserId={user?.id}
              />
            )}
          </div>
        </div>

        {/* ── Chat Window ── */}
        <ChatWindow
          conversation={selectedConversation}
          currentUserId={user?.id}
          currentUserName={user?.staff_full_name || user?.full_name}
          isAdmin={isAdmin}
          onBack={() => setSelectedConversation(null)}
          onDeleteConversation={(conv) => {
            setConversationToDelete(conv.id);
            setDeleteDialogOpen(true);
          }}
        />
      </div>

      {/* ── New Chat Dialog ── */}
      <Dialog open={showNewChat} onOpenChange={(open) => { if (!open) closeNewChat(); else setShowNewChat(true); }}>
        <DialogContent className="max-w-md p-0 overflow-hidden max-h-[85vh]">
          {newChatStep === 1 && (
            <div className="flex flex-col h-full max-h-[85vh]">
              <div className="px-4 pt-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={closeNewChat} className="p-1 hover:bg-slate-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">New chat</h3>
                    {chatType !== 'private' && selectedUsers.length > 0 && (
                      <p className="text-xs text-[#00a884]">{selectedUsers.length} selected</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  {[
                    { key: 'private', label: 'Private' },
                    { key: 'group', label: 'New Group' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => { setChatType(tab.key); setSelectedUsers([]); }}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                        chatType === tab.key
                          ? 'bg-[#00a884] text-white'
                          : 'bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9ebee]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#54656f]" />
                  <input
                    value={newChatSearch}
                    onChange={(e) => setNewChatSearch(e.target.value)}
                    placeholder="Search contacts"
                    className="w-full pl-10 pr-4 py-2 bg-[#f0f2f5] rounded-lg text-sm outline-none focus:bg-white focus:ring-1 focus:ring-[#00a884]"
                    autoFocus
                  />
                </div>

                {chatType !== 'private' && selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {selectedUsers.map(id => {
                      const u = allUsers.find(u => u.id === id);
                      const name = u?.staff_full_name || u?.full_name || 'Unknown';
                      return (
                        <span key={id} className="inline-flex items-center gap-1 bg-[#e7fce3] text-[#111b21] text-xs px-2.5 py-1 rounded-full">
                          <Avatar name={name} size="xs" className="w-4 h-4 text-[8px]" />
                          {name.split(' ')[0]}
                          <button onClick={() => setSelectedUsers(prev => prev.filter(uid => uid !== id))} className="ml-0.5 hover:text-red-500">
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto">
                {groupedUsers.map(([letter, users]) => (
                  <div key={letter}>
                    <div className="sticky top-0 bg-white px-6 py-1">
                      <span className="text-xs font-semibold text-[#00a884]">{letter}</span>
                    </div>
                    {users.map(u => {
                      const name = u.staff_full_name || u.full_name || 'Unknown';
                      const isSelected = selectedUsers.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          onClick={() => handleSelectContact(u.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f5f6f6] transition-colors text-left"
                        >
                          <div className="relative">
                            <Avatar name={name} size="md" src={u.photo_url} className="w-[46px] h-[46px]" />
                            {chatType !== 'private' && isSelected && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#00a884] rounded-full flex items-center justify-center border-2 border-white">
                                <span className="text-white text-xs font-bold">&#10003;</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 border-b border-slate-100 pb-3">
                            <p className="font-medium text-slate-900 text-[15px]">{name}</p>
                            <p className="text-sm text-[#667781] truncate">{u.job_title || u.role || 'Staff'}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="py-12 text-center text-sm text-slate-500">No contacts found</div>
                )}
              </div>

              {chatType !== 'private' && selectedUsers.length > 0 && (
                <div className="p-4 border-t border-slate-100">
                  <Button onClick={() => setNewChatStep(2)} className="w-full bg-[#00a884] hover:bg-[#008f72]">
                    Next ({selectedUsers.length} selected)
                  </Button>
                </div>
              )}
            </div>
          )}

          {newChatStep === 2 && (
            <div className="flex flex-col">
              <div className="px-4 pt-5 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <button onClick={() => setNewChatStep(1)} className="p-1 hover:bg-slate-100 rounded-full">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <h3 className="font-semibold text-slate-900 text-lg">New group</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <input
                    ref={groupPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleGroupPhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => groupPhotoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="w-16 h-16 rounded-full bg-[#dfe5e7] flex items-center justify-center flex-shrink-0 hover:bg-[#d1d7db] transition-colors overflow-hidden"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="w-6 h-6 text-[#54656f] animate-spin" />
                    ) : groupPhotoUrl ? (
                      <img src={groupPhotoUrl} alt="Group" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-[#54656f]" />
                    )}
                  </button>
                  <div className="flex-1">
                    <input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="Group name"
                      className="w-full text-lg border-b-2 border-[#00a884] pb-2 outline-none placeholder:text-[#667781]"
                      autoFocus
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#667781] mb-2">Members: {selectedUsers.length}</p>
                  <div className="flex flex-wrap gap-3">
                    {selectedUsers.map(id => {
                      const u = allUsers.find(u => u.id === id);
                      const name = u?.staff_full_name || u?.full_name || 'Unknown';
                      return (
                        <div key={id} className="flex flex-col items-center w-16">
                          <Avatar name={name} size="md" src={u?.photo_url} />
                          <p className="text-xs text-slate-600 truncate w-full text-center mt-1">{name.split(' ')[0]}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || createConversationMutation.isPending}
                  className="w-full bg-[#00a884] hover:bg-[#008f72] h-11"
                >
                  {createConversationMutation.isPending ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Conversation Dialog ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete conversation?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will permanently delete all messages in this conversation. This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setConversationToDelete(null); }}>
              Cancel
            </Button>
            <Button onClick={() => deleteConversationMutation.mutate(conversationToDelete)} className="bg-red-500 hover:bg-red-600">
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { getCurrentOrgId } from '@/lib/orgContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Trophy, Send, Search, ChevronDown, Plus, Trash2, Star, Settings } from 'lucide-react';

const COLOR_OPTIONS = [
  { name: 'amber',   bg: 'from-amber-400 to-yellow-500',   ring: 'ring-amber-400',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  { name: 'blue',    bg: 'from-blue-400 to-blue-600',      ring: 'ring-blue-400',     badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' },
  { name: 'emerald', bg: 'from-emerald-400 to-emerald-600', ring: 'ring-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  { name: 'rose',    bg: 'from-rose-400 to-rose-600',      ring: 'ring-rose-400',     badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' },
  { name: 'purple',  bg: 'from-purple-400 to-purple-600',  ring: 'ring-purple-400',   badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' },
  { name: 'cyan',    bg: 'from-cyan-400 to-cyan-600',      ring: 'ring-cyan-400',     badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-400' },
  { name: 'orange',  bg: 'from-orange-400 to-orange-600',  ring: 'ring-orange-400',   badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' },
  { name: 'pink',    bg: 'from-pink-400 to-pink-600',      ring: 'ring-pink-400',     badge: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400' },
];

const EMOJI_OPTIONS = [
  // Awards & trophies
  '⭐', '🏆', '🎖️', '🥇', '🥈', '🥉', '💎', '🌟',
  '🔥', '💪', '👏', '❤️', '🎯', '🦸', '🌈', '🎉',
  '🙌', '💡', '🕊️', '🧡', '✨', '🎗️', '🏅', '👑',
  // Fun & faces
  '😂', '🤣', '😴', '😎', '🥳', '🤩', '😇', '🫡',
  '🤗', '😍', '🥰', '🤪', '😜', '🫶', '🤝', '🫣',
  // Animals & nature
  '🦁', '🐐', '🦄', '🐝', '🦋', '🌻', '🍀', '🌊',
  // Objects & symbols
  '🚀', '⚡', '🎵', '📣', '🛡️', '🧠', '❤️‍🔥', '💯',
];

const SUGGESTED_AWARDS = [
  { name: 'Star Performer',       emoji: '⭐', color: 'amber' },
  { name: 'Team Player',          emoji: '🤝', color: 'blue' },
  { name: 'Above & Beyond',       emoji: '🚀', color: 'purple' },
  { name: 'Compassionate Care',   emoji: '❤️', color: 'rose' },
  { name: 'Client Feedback Star', emoji: '🌟', color: 'amber' },
  { name: 'Punctuality Champion', emoji: '⏰', color: 'emerald' },
  { name: 'Great Teamwork',       emoji: '🙌', color: 'cyan' },
  { name: 'Problem Solver',       emoji: '🧠', color: 'purple' },
  { name: 'Brightest Smile',      emoji: '😁', color: 'orange' },
  { name: 'Most Improved',        emoji: '📈', color: 'emerald' },
  { name: 'Night Owl',            emoji: '🦉', color: 'blue' },
  { name: 'Mentor of the Month',  emoji: '🎓', color: 'cyan' },
  { name: 'Safety Champion',      emoji: '🛡️', color: 'emerald' },
  { name: 'GOAT',                 emoji: '🐐', color: 'amber' },
  { name: 'Kindness Award',       emoji: '🫶', color: 'pink' },
  { name: 'Early Bird',           emoji: '🐝', color: 'orange' },
];

function getColorDef(name) {
  return COLOR_OPTIONS.find(c => c.name === name) || COLOR_OPTIONS[0];
}

export default function StaffAwards() {
  const queryClient = useQueryClient();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [awardMessage, setAwardMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');

  // Dialogs
  const [showCreateType, setShowCreateType] = useState(false);
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeEmoji, setNewTypeEmoji] = useState('⭐');
  const [newTypeColor, setNewTypeColor] = useState('amber');

  // Current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Staff list
  const { data: staffList = [] } = useQuery({
    queryKey: ['allStaffForAwards'],
    queryFn: () => base44.entities.User.list('full_name', 500),
  });

  // Custom award types for this org
  const { data: awardTypes = [] } = useQuery({
    queryKey: ['awardTypes'],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase.from('award_types').select('*').order('created_at', { ascending: true });
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q;
      if (error) { console.warn('award_types query:', error.message); return []; }
      return data || [];
    },
  });

  // All awards for the org (last 90 days)
  const { data: allAwards = [], isLoading: awardsLoading } = useQuery({
    queryKey: ['allStaffAwards'],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      const since = new Date();
      since.setDate(since.getDate() - 90);
      let q = supabase.from('staff_awards').select('*').order('created_at', { ascending: false });
      if (orgId) q = q.eq('organization_id', orgId);
      q = q.gte('created_at', since.toISOString());
      const { data, error } = await q;
      if (error) { console.warn('staff_awards query:', error.message); return []; }
      return data || [];
    },
  });

  // Quick-add a suggested award type
  const addSuggestedMutation = useMutation({
    mutationFn: async (suggestion) => {
      const { error } = await supabase.from('award_types').insert({
        organization_id: getCurrentOrgId(),
        name: suggestion.name,
        emoji: suggestion.emoji,
        color: suggestion.color,
      });
      if (error) throw error;
    },
    onSuccess: (_, suggestion) => {
      toast.success(`"${suggestion.name}" added!`);
      queryClient.invalidateQueries({ queryKey: ['awardTypes'] });
    },
    onError: (err) => toast.error(err.message),
  });

  // Add all suggested awards at once
  const addAllSuggestedMutation = useMutation({
    mutationFn: async () => {
      const orgId = getCurrentOrgId();
      const existingNames = new Set(awardTypes.map(t => t.name.toLowerCase()));
      const toAdd = SUGGESTED_AWARDS
        .filter(s => !existingNames.has(s.name.toLowerCase()))
        .map(s => ({ organization_id: orgId, name: s.name, emoji: s.emoji, color: s.color }));
      if (toAdd.length === 0) throw new Error('All suggested awards already added');
      const { error } = await supabase.from('award_types').insert(toAdd);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('All suggested awards added!');
      queryClient.invalidateQueries({ queryKey: ['awardTypes'] });
    },
    onError: (err) => toast.error(err.message),
  });

  // Create award type
  const createTypeMutation = useMutation({
    mutationFn: async () => {
      if (!newTypeName.trim()) throw new Error('Enter an award name');
      const { error } = await supabase.from('award_types').insert({
        organization_id: getCurrentOrgId(),
        name: newTypeName.trim(),
        emoji: newTypeEmoji,
        color: newTypeColor,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Award type created!');
      queryClient.invalidateQueries({ queryKey: ['awardTypes'] });
      setNewTypeName('');
      setNewTypeEmoji('⭐');
      setNewTypeColor('amber');
      setShowCreateType(false);
    },
    onError: (err) => toast.error(err.message),
  });

  // Delete award type
  const deleteTypeMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('award_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Award type deleted');
      queryClient.invalidateQueries({ queryKey: ['awardTypes'] });
    },
    onError: (err) => toast.error(err.message),
  });

  // Give award mutation
  const giveAwardMutation = useMutation({
    mutationFn: async () => {
      const staff = staffList.find(s => s.id === selectedStaffId);
      if (!staff) throw new Error('Select a staff member');
      if (!selectedType) throw new Error('Select an award type');

      const { error } = await supabase.from('staff_awards').insert({
        organization_id: getCurrentOrgId(),
        recipient_id: selectedStaffId,
        recipient_name: staff.full_name || staff.email,
        awarded_by_id: currentUser?.id,
        awarded_by_name: currentUser?.full_name || currentUser?.email,
        award_type: 'custom',
        title: selectedType.name,
        emoji: selectedType.emoji,
        color: selectedType.color,
        message: awardMessage.trim() || null,
      });
      if (error) throw error;

      try {
        await base44.entities.Notification.create({
          recipient_id: selectedStaffId,
          type: 'award',
          title: `${selectedType.emoji} You received a Staff Award!`,
          message: `${currentUser?.full_name || 'Admin'} gave you a "${selectedType.name}" award`,
          link: '/Dashboard',
          is_read: false,
        });
      } catch {}
    },
    onSuccess: () => {
      toast.success('Award given successfully!');
      queryClient.invalidateQueries({ queryKey: ['allStaffAwards'] });
      queryClient.invalidateQueries({ queryKey: ['todayAwards'] });
      queryClient.invalidateQueries({ queryKey: ['staffAwards'] });
      setAwardMessage('');
      setSelectedStaffId('');
      setSelectedType(null);
    },
    onError: (err) => toast.error(err.message),
  });

  // Filter awards for history
  const filteredAwards = allAwards.filter(a => {
    if (historyFilter !== 'all' && a.recipient_id !== historyFilter) return false;
    if (searchFilter) {
      const s = searchFilter.toLowerCase();
      return (a.recipient_name || '').toLowerCase().includes(s) ||
        (a.title || '').toLowerCase().includes(s) ||
        (a.awarded_by_name || '').toLowerCase().includes(s);
    }
    return true;
  });

  // Leaderboard
  const leaderboard = {};
  allAwards.forEach(a => {
    if (!leaderboard[a.recipient_id]) {
      leaderboard[a.recipient_id] = { name: a.recipient_name, count: 0, id: a.recipient_id };
    }
    leaderboard[a.recipient_id].count++;
  });
  const sortedLeaderboard = Object.values(leaderboard).sort((a, b) => b.count - a.count);

  return (
    <div className="max-w-4xl mx-auto pb-6">
      <PageHeader
        title="Staff Awards"
        icon={Trophy}
        subtitle="Recognise and reward your team"
      />

      {/* Award Types Grid */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Award Types</h2>
          <button
            onClick={() => setShowManageTypes(true)}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" /> Manage
          </button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {awardTypes.map(type => {
            const c = getColorDef(type.color);
            const isSelected = selectedType?.id === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(isSelected ? null : type)}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 min-h-[100px] transition-all active:scale-95 ${
                  isSelected
                    ? `${c.ring} ring-2 border-transparent bg-white dark:bg-slate-800 shadow-lg scale-[1.02]`
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center mb-1.5 shadow-sm`}>
                  <span className="text-2xl">{type.emoji}</span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center leading-tight line-clamp-2">{type.name}</span>
              </button>
            );
          })}

          {/* Add new type button */}
          <button
            onClick={() => setShowCreateType(true)}
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-3 min-h-[100px] hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all active:scale-95"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-1.5">
              <Plus className="w-6 h-6 text-slate-400" />
            </div>
            <span className="text-xs font-medium text-slate-400">New Award</span>
          </button>
        </div>

        {/* Suggested Awards — show when org has fewer than 16 custom types */}
        {awardTypes.length < 16 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400">Suggested Awards — tap to add</h3>
              {awardTypes.length === 0 && (
                <button
                  onClick={() => addAllSuggestedMutation.mutate()}
                  disabled={addAllSuggestedMutation.isPending}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  {addAllSuggestedMutation.isPending ? 'Adding...' : 'Add all'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {SUGGESTED_AWARDS
                .filter(s => !awardTypes.some(t => t.name.toLowerCase() === s.name.toLowerCase()))
                .map(s => {
                  const c = getColorDef(s.color);
                  return (
                    <button
                      key={s.name}
                      onClick={() => addSuggestedMutation.mutate(s)}
                      disabled={addSuggestedMutation.isPending}
                      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-2 min-h-[70px] hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all active:scale-95"
                      title={s.name}
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${c.bg} flex items-center justify-center mb-1 shadow-sm opacity-70`}>
                        <span className="text-lg">{s.emoji}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 text-center leading-tight line-clamp-2">{s.name}</span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Give Award Section — only visible when a type is selected */}
      {selectedType && (
        <Card className={`p-5 mb-6 border-2 ${getColorDef(selectedType.color).ring} bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800`}>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">{selectedType.emoji}</span>
            Give "{selectedType.name}" Award
          </h2>

          {/* Staff dropdown */}
          <div className="mb-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Staff Member</label>
            <div className="relative">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 text-sm appearance-none pr-8"
              >
                <option value="">Select staff member...</option>
                {staffList
                  .filter(s => s.full_name)
                  .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
                  .map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Message (optional)</label>
            <Textarea
              value={awardMessage}
              onChange={(e) => setAwardMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={2}
              className="dark:bg-slate-800 dark:border-slate-600"
            />
          </div>

          <Button
            onClick={() => giveAwardMutation.mutate()}
            disabled={!selectedStaffId || giveAwardMutation.isPending}
            className={`w-full bg-gradient-to-r ${getColorDef(selectedType.color).bg} hover:opacity-90 text-white font-semibold`}
          >
            <Send className="w-4 h-4 mr-2" />
            {giveAwardMutation.isPending ? 'Giving Award...' : `Give ${selectedType.name} Award`}
          </Button>
        </Card>
      )}

      {/* Leaderboard */}
      {sortedLeaderboard.length > 0 && (
        <Card className="p-5 mb-6 dark:bg-slate-900 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Leaderboard (Last 90 Days)
          </h2>
          <div className="space-y-2">
            {sortedLeaderboard.slice(0, 10).map((entry, idx) => (
              <div
                key={entry.id}
                onClick={() => setHistoryFilter(historyFilter === entry.id ? 'all' : entry.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  historyFilter === entry.id
                    ? 'bg-amber-100 dark:bg-amber-900/30 ring-2 ring-amber-400'
                    : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  idx === 0 ? 'bg-amber-400 text-white' :
                  idx === 1 ? 'bg-slate-300 text-slate-700' :
                  idx === 2 ? 'bg-orange-300 text-orange-800' :
                  'bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-300'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{entry.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy className={`w-4 h-4 ${idx < 3 ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{entry.count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Award History */}
      <Card className="p-5 dark:bg-slate-900 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Award History
            {historyFilter !== 'all' && (
              <button onClick={() => setHistoryFilter('all')} className="text-xs text-amber-600 underline ml-2">Show all</button>
            )}
          </h2>
          <span className="text-xs text-slate-400">{filteredAwards.length} awards</span>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search awards..."
            className="pl-9 dark:bg-slate-800 dark:border-slate-600"
          />
        </div>

        {awardsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm text-slate-400">Loading awards...</p>
          </div>
        ) : filteredAwards.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No awards found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredAwards.map(award => {
              const c = getColorDef(award.color || 'amber');
              return (
                <div key={award.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <span className="text-lg">{award.emoji || '⭐'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{award.recipient_name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{award.title}</span>
                    </div>
                    {award.message && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">"{award.message}"</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-1">
                      From {award.awarded_by_name || 'Admin'} &bull; {format(new Date(award.created_at), 'd MMM yyyy \'at\' HH:mm')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create Award Type Dialog */}
      <Dialog open={showCreateType} onOpenChange={setShowCreateType}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Award Type</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Preview */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getColorDef(newTypeColor).bg} flex items-center justify-center shadow-lg`}>
                  <span className="text-3xl">{newTypeEmoji}</span>
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-2 text-center">
                  {newTypeName || 'Award Name'}
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Award Name</label>
              <Input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g. Star Performer"
                className="dark:bg-slate-800 dark:border-slate-600"
              />
            </div>

            {/* Emoji picker */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Icon</label>
              <div className="grid grid-cols-8 gap-1.5">
                {EMOJI_OPTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => setNewTypeEmoji(e)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl transition-all ${
                      newTypeEmoji === e
                        ? 'bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-400 scale-110'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Colour</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setNewTypeColor(c.name)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.bg} transition-all ${
                      newTypeColor === c.name ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateType(false)}>Cancel</Button>
            <Button
              onClick={() => createTypeMutation.mutate()}
              disabled={!newTypeName.trim() || createTypeMutation.isPending}
              className={`bg-gradient-to-r ${getColorDef(newTypeColor).bg} text-white`}
            >
              {createTypeMutation.isPending ? 'Creating...' : 'Create Award'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Award Types Dialog */}
      <Dialog open={showManageTypes} onOpenChange={setShowManageTypes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Award Types</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2 max-h-[400px] overflow-y-auto">
            {awardTypes.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No award types created yet</p>
            ) : (
              awardTypes.map(type => {
                const c = getColorDef(type.color);
                return (
                  <div key={type.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xl">{type.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{type.name}</p>
                      <p className="text-[11px] text-slate-400">Created {format(new Date(type.created_at), 'd MMM yyyy')}</p>
                    </div>
                    <button
                      onClick={() => { if (confirm(`Delete "${type.name}"?`)) deleteTypeMutation.mutate(type.id); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManageTypes(false)}>Done</Button>
            <Button onClick={() => { setShowManageTypes(false); setShowCreateType(true); }}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white">
              <Plus className="w-4 h-4 mr-1" /> New Award Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

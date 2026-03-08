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
import { Trophy, Send, Search, Filter, ChevronDown, Award, Star, User } from 'lucide-react';

export default function StaffAwards() {
  const queryClient = useQueryClient();
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [awardTitle, setAwardTitle] = useState('');
  const [awardMessage, setAwardMessage] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all'); // all | staff id

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
      if (error) throw error;
      return data || [];
    },
  });

  // Give award mutation
  const giveAwardMutation = useMutation({
    mutationFn: async () => {
      const staff = staffList.find(s => s.id === selectedStaffId);
      if (!staff) throw new Error('Select a staff member');
      if (!awardTitle.trim()) throw new Error('Enter an award title');

      const { error } = await supabase.from('staff_awards').insert({
        organization_id: getCurrentOrgId(),
        recipient_id: selectedStaffId,
        recipient_name: staff.full_name || staff.email,
        awarded_by_id: currentUser?.id,
        awarded_by_name: currentUser?.full_name || currentUser?.email,
        award_type: 'star',
        title: awardTitle.trim(),
        message: awardMessage.trim() || null,
      });
      if (error) throw error;

      // Send notification
      try {
        await base44.entities.Notification.create({
          recipient_id: selectedStaffId,
          type: 'award',
          title: 'You received a Staff Award!',
          message: `${currentUser?.full_name || 'Admin'} gave you a "${awardTitle.trim()}" award`,
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
      setAwardTitle('');
      setAwardMessage('');
      setSelectedStaffId('');
    },
    onError: (err) => toast.error(err.message),
  });

  // Quick award presets
  const presets = [
    'Star Performer',
    'Great Teamwork',
    'Above & Beyond',
    'Client Feedback Star',
    'Punctuality Champion',
    'Compassionate Care',
  ];

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

  // Award counts per staff (leaderboard)
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
        icon={<Trophy className="w-7 h-7 text-amber-500" />}
        subtitle="Recognise and reward your team"
      />

      {/* Give Award Section */}
      <Card className="p-5 mb-6 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          Give an Award
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

        {/* Award title */}
        <div className="mb-3">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Award Title</label>
          <Input
            value={awardTitle}
            onChange={(e) => setAwardTitle(e.target.value)}
            placeholder="e.g. Star Performer"
            className="dark:bg-slate-800 dark:border-slate-600"
          />
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setAwardTitle(p)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                  awardTitle === p
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-amber-300'
                }`}
              >
                {p}
              </button>
            ))}
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
          disabled={!selectedStaffId || !awardTitle.trim() || giveAwardMutation.isPending}
          className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold"
        >
          <Send className="w-4 h-4 mr-2" />
          {giveAwardMutation.isPending ? 'Giving Award...' : 'Give Award'}
        </Button>
      </Card>

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

        {/* Search */}
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
            {filteredAwards.map(award => (
              <div key={award.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{award.recipient_name}</p>
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">{award.title}</span>
                  </div>
                  {award.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">"{award.message}"</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1">
                    From {award.awarded_by_name || 'Admin'} &bull; {format(new Date(award.created_at), 'd MMM yyyy \'at\' HH:mm')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Star,
  Send,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
  Users,
  TrendingUp,
  Filter,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function Feedback() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'owner';

  const [tab, setTab] = useState('overview');
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // New feedback form
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    reviewer_name: '',
    reviewer_email: '',
    reviewer_relationship: '',
    rating: 5,
    comment: '',
    source: 'internal',
  });
  const [saving, setSaving] = useState(false);

  // Filter
  const [ratingFilter, setRatingFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function loadFeedback() {
    setLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('client_feedback')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          setFeedback(data);
        }
      }
    } catch (err) {
      console.error('Load feedback:', err);
    }
    setLoading(false);
  }

  async function saveFeedback() {
    if (!formData.client_name || !formData.reviewer_name || !formData.comment) return;
    setSaving(true);
    try {
      if (supabase) {
        const { error } = await supabase.from('client_feedback').insert({
          client_name: formData.client_name,
          reviewer_name: formData.reviewer_name,
          reviewer_email: formData.reviewer_email,
          reviewer_relationship: formData.reviewer_relationship,
          rating: formData.rating,
          comment: formData.comment,
          source: formData.source,
          status: 'published',
          created_by: user?.id || null,
        });
        if (error) throw error;
      }
      showToast('Feedback saved successfully');
      setFormData({ client_name: '', reviewer_name: '', reviewer_email: '', reviewer_relationship: '', rating: 5, comment: '', source: 'internal' });
      setShowForm(false);
      loadFeedback();
    } catch (err) {
      showToast('Error: ' + err.message);
    }
    setSaving(false);
  }

  // Stats
  const totalFeedback = feedback.length;
  const avgRating = totalFeedback > 0 ? (feedback.reduce((s, f) => s + (f.rating || 0), 0) / totalFeedback).toFixed(1) : '—';
  const fiveStarCount = feedback.filter(f => f.rating === 5).length;
  const recentCount = feedback.filter(f => {
    const d = new Date(f.created_at);
    const now = new Date();
    return (now - d) < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const filtered = ratingFilter === 'all'
    ? feedback
    : feedback.filter(f => f.rating === parseInt(ratingFilter));

  const StarDisplay = ({ rating, size = 'w-4 h-4' }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${size} ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  );

  const StarPicker = ({ value, onChange }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            className={`w-7 h-7 transition-colors ${star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-300 hover:text-amber-300'}`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-6">
      <PageHeader title="Client Feedback" icon={MessageSquare} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'all', label: 'All Feedback' },
          ...(isAdmin ? [{ key: 'add', label: 'Record Feedback' }] : []),
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); if (t.key === 'add') setShowForm(true); }}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- OVERVIEW ---- */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{totalFeedback}</p>
              <p className="text-xs text-slate-500">Total Feedback</p>
            </Card>
            <Card className="p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="text-2xl font-bold text-slate-900">{avgRating}</span>
              </div>
              <p className="text-xs text-slate-500">Average Rating</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{fiveStarCount}</p>
              <p className="text-xs text-slate-500">5-Star Reviews</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{recentCount}</p>
              <p className="text-xs text-slate-500">Last 30 Days</p>
            </Card>
          </div>

          {/* Rating Breakdown */}
          {totalFeedback > 0 && (
            <Card className="p-5">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Rating Breakdown</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = feedback.filter(f => f.rating === star).length;
                  const pct = totalFeedback > 0 ? Math.round((count / totalFeedback) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 w-12">{star} star</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${star >= 4 ? 'bg-amber-400' : star === 3 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-16 text-right">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recent Feedback */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Recent Feedback</h3>
              <button onClick={() => setTab('all')} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                View all &rarr;
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            ) : feedback.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400 mb-3">No feedback recorded yet.</p>
                {isAdmin && (
                  <Button size="sm" onClick={() => { setTab('add'); setShowForm(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Record First Feedback
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {feedback.slice(0, 5).map(fb => (
                  <div key={fb.id} className="border border-slate-100 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <StarDisplay rating={fb.rating} size="w-3.5 h-3.5" />
                      <span className="text-[10px] text-slate-400">
                        {fb.created_at ? new Date(fb.created_at).toLocaleDateString('en-GB') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{fb.comment}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">— {fb.reviewer_name}</span>
                      {fb.client_name && <span className="text-[10px] text-slate-400">re: {fb.client_name}</span>}
                      {fb.source && fb.source !== 'internal' && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">{fb.source}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick link to homecare.co.uk */}
          <div className="text-center">
            <a
              href="https://www.homecare.co.uk/memberarea/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Manage reviews on homecare.co.uk
            </a>
          </div>
        </div>
      )}

      {/* ---- ALL FEEDBACK ---- */}
      {tab === 'all' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              {['all', '5', '4', '3', '2', '1'].map(f => (
                <button
                  key={f}
                  onClick={() => setRatingFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    ratingFilter === f
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f === 'all' ? 'All' : `${f} Star`}
                </button>
              ))}
            </div>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => { setTab('add'); setShowForm(true); }}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-slate-400">
                {ratingFilter === 'all' ? 'No feedback recorded.' : `No ${ratingFilter}-star feedback.`}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">{filtered.length} feedback item{filtered.length !== 1 ? 's' : ''}</p>
              {filtered.map(fb => {
                const isExpanded = expandedId === fb.id;
                return (
                  <Card key={fb.id} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : fb.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <StarDisplay rating={fb.rating} size="w-3.5 h-3.5" />
                          <Badge variant={fb.rating >= 4 ? 'default' : fb.rating >= 3 ? 'secondary' : 'destructive'} className="text-[10px]">
                            {fb.rating}/5
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-1">{fb.comment}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{fb.reviewer_name}</span>
                          {fb.client_name && <span className="text-xs text-slate-400">re: {fb.client_name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs text-slate-400">
                          {fb.created_at ? new Date(fb.created_at).toLocaleDateString('en-GB') : ''}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-2">
                        <p className="text-sm text-slate-700">{fb.comment}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                          <div><span className="font-medium">Reviewer:</span> {fb.reviewer_name}</div>
                          <div><span className="font-medium">Client:</span> {fb.client_name || '—'}</div>
                          {fb.reviewer_email && <div><span className="font-medium">Email:</span> {fb.reviewer_email}</div>}
                          {fb.reviewer_relationship && <div><span className="font-medium">Relationship:</span> {fb.reviewer_relationship}</div>}
                          <div><span className="font-medium">Source:</span> {fb.source || 'Internal'}</div>
                          <div><span className="font-medium">Date:</span> {fb.created_at ? new Date(fb.created_at).toLocaleString('en-GB') : '—'}</div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---- ADD FEEDBACK ---- */}
      {tab === 'add' && isAdmin && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-1">Record Client Feedback</h3>
            <p className="text-xs text-slate-500 mb-4">
              Record feedback received from service users, family members, or professionals.
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Client Name *</label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) => setFormData(d => ({ ...d, client_name: e.target.value }))}
                    placeholder="Service user name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Reviewer Name *</label>
                  <Input
                    value={formData.reviewer_name}
                    onChange={(e) => setFormData(d => ({ ...d, reviewer_name: e.target.value }))}
                    placeholder="Who gave the feedback"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.reviewer_email}
                    onChange={(e) => setFormData(d => ({ ...d, reviewer_email: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Relationship</label>
                  <Select value={formData.reviewer_relationship} onValueChange={(v) => setFormData(d => ({ ...d, reviewer_relationship: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Service User">Service User</SelectItem>
                      <SelectItem value="Family Member">Family Member</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Rating *</label>
                <StarPicker value={formData.rating} onChange={(v) => setFormData(d => ({ ...d, rating: v }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
                <Select value={formData.source} onValueChange={(v) => setFormData(d => ({ ...d, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal / In Person</SelectItem>
                    <SelectItem value="homecare.co.uk">homecare.co.uk</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="letter">Letter / Card</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Feedback / Comment *</label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => setFormData(d => ({ ...d, comment: e.target.value }))}
                  rows={4}
                  placeholder="What did they say..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setShowForm(false); setTab('overview'); }}>
                  Cancel
                </Button>
                <Button
                  onClick={saveFeedback}
                  disabled={!formData.client_name || !formData.reviewer_name || !formData.comment || saving}
                >
                  {saving ? 'Saving...' : 'Save Feedback'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

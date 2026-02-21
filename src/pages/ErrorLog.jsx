import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { invokeFunction } from '@/api/functions';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import {
  Bug,
  Copy,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  MessageSquare,
  Lightbulb,
  RefreshCw,
  CheckCheck,
  Calendar,
  Sparkles,
  Loader2,
  X,
} from 'lucide-react';

const SOURCE_LABELS = {
  'window.onerror': { label: 'JS Error', color: 'bg-red-100 text-red-700' },
  'unhandledrejection': { label: 'Promise Error', color: 'bg-orange-100 text-orange-700' },
  'console.error': { label: 'Console Error', color: 'bg-yellow-100 text-yellow-700' },
  'user_report': { label: 'User Report', color: 'bg-blue-100 text-blue-700' },
  'unknown': { label: 'Unknown', color: 'bg-slate-100 text-slate-700' },
};

function getReportTypeIcon(metadata) {
  if (!metadata) return Bug;
  try {
    const m = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    if (m.report_type === 'help') return MessageSquare;
    if (m.report_type === 'suggestion') return Lightbulb;
  } catch {}
  return Bug;
}

export default function ErrorLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, unresolved, resolved, user_report
  const [dateFilter, setDateFilter] = useState(''); // '' = all dates, or 'YYYY-MM-DD'
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [aiAnalysis, setAiAnalysis] = useState(null); // { text, loading, error }
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.job_title === 'admin' || user?.job_title === 'manager';

  const { data: errors = [], isLoading } = useQuery({
    queryKey: ['errorLogs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
  });

  const toggleResolved = useMutation({
    mutationFn: async ({ id, resolved }) => {
      const { error } = await supabase
        .from('app_error_logs')
        .update({ is_resolved: resolved })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['errorLogs'] }),
  });

  const batchResolve = useMutation({
    mutationFn: async (ids) => {
      // Batch in groups of 100
      const idArray = [...ids];
      for (let i = 0; i < idArray.length; i += 100) {
        const batch = idArray.slice(i, i + 100);
        const { error } = await supabase
          .from('app_error_logs')
          .update({ is_resolved: true })
          .in('id', batch);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      const count = selectedIds.size;
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['errorLogs'] });
      toast.success(`Resolved ${count} error${count !== 1 ? 's' : ''}`);
    },
  });

  const batchResolveFiltered = useMutation({
    mutationFn: async (ids) => {
      const idArray = [...ids];
      for (let i = 0; i < idArray.length; i += 100) {
        const batch = idArray.slice(i, i + 100);
        const { error } = await supabase
          .from('app_error_logs')
          .update({ is_resolved: true })
          .in('id', batch);
        if (error) throw error;
      }
    },
    onSuccess: (_, ids) => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['errorLogs'] });
      toast.success(`Resolved ${ids.length} error${ids.length !== 1 ? 's' : ''}`);
    },
  });

  const clearResolved = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('app_error_logs')
        .delete()
        .eq('is_resolved', true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['errorLogs'] });
      toast.success('Cleared resolved errors');
    },
  });

  // Get unique dates from errors for the date filter
  const availableDates = useMemo(() => {
    const dates = new Set();
    for (const err of errors) {
      if (err.created_at) {
        dates.add(err.created_at.split('T')[0]);
      }
    }
    return [...dates].sort().reverse();
  }, [errors]);

  const filteredErrors = useMemo(() => {
    return errors.filter((err) => {
      if (filter === 'unresolved' && err.is_resolved) return false;
      if (filter === 'resolved' && !err.is_resolved) return false;
      if (filter === 'user_report' && err.error_source !== 'user_report') return false;
      if (dateFilter && err.created_at && !err.created_at.startsWith(dateFilter)) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          err.error_message?.toLowerCase().includes(s) ||
          err.page_url?.toLowerCase().includes(s) ||
          err.user_email?.toLowerCase().includes(s) ||
          err.error_source?.toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [errors, filter, dateFilter, search]);

  const unresolvedCount = errors.filter(e => !e.is_resolved).length;
  const userReportCount = errors.filter(e => e.error_source === 'user_report').length;
  const filteredUnresolvedIds = filteredErrors.filter(e => !e.is_resolved).map(e => e.id);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredErrors.map(e => e.id);
    const allSelected = visibleIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleIds));
    }
  };

  const copyForClaude = () => {
    const unresolvedErrors = errors.filter(e => !e.is_resolved);
    if (unresolvedErrors.length === 0) {
      toast.error('No unresolved errors to copy');
      return;
    }

    const formatted = unresolvedErrors.map((err, i) => {
      const lines = [
        `--- Error ${i + 1} ---`,
        `Source: ${err.error_source}`,
        `Page: ${err.page_url}`,
        `User: ${err.user_email}`,
        `Time: ${new Date(err.created_at).toLocaleString()}`,
        `Message: ${err.error_message}`,
      ];
      if (err.error_stack) {
        lines.push(`Stack: ${err.error_stack}`);
      }
      if (err.metadata) {
        try {
          const meta = JSON.parse(err.metadata);
          if (meta.report_type) lines.push(`Type: ${meta.report_type}`);
          if (meta.reported_by) lines.push(`Reported by: ${meta.reported_by}`);
        } catch {}
      }
      return lines.join('\n');
    }).join('\n\n');

    const header = `CARE CALL AI - Error Log (${unresolvedErrors.length} unresolved errors)\nExported: ${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;

    navigator.clipboard.writeText(header + formatted).then(() => {
      toast.success(`Copied ${unresolvedErrors.length} errors to clipboard — paste to Claude Code`);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = header + formatted;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast.success(`Copied ${unresolvedErrors.length} errors to clipboard`);
    });
  };

  const analyzeWithAI = async () => {
    const errorsToAnalyze = filteredErrors.filter(e => !e.is_resolved);
    if (errorsToAnalyze.length === 0) {
      toast.error('No unresolved errors to analyze');
      return;
    }

    setAiAnalysis({ text: null, loading: true, error: null });

    // Format errors for the AI (limit to 30 to stay within token limits)
    const sample = errorsToAnalyze.slice(0, 30);
    const formatted = sample.map((err, i) => {
      const lines = [`Error ${i + 1}: [${err.error_source}] ${err.error_message}`];
      if (err.page_url) lines.push(`  Page: ${err.page_url}`);
      if (err.error_stack) lines.push(`  Stack: ${err.error_stack?.slice(0, 300)}`);
      return lines.join('\n');
    }).join('\n\n');

    try {
      const result = await invokeFunction('invokeLLM', {
        systemPrompt: `You are a senior developer analyzing error logs from a care management web app (React + Supabase).
Provide a clear, concise analysis:
1. Group similar errors together and count them
2. Identify the root causes (not just symptoms)
3. Rate severity (Critical / Warning / Noise)
4. Suggest specific fixes for each group
5. Flag any errors that are harmless noise and can be safely resolved

Keep your response under 500 words. Use plain language the app admin can understand.
Format with clear headings and bullet points.`,
        prompt: `Analyze these ${errorsToAnalyze.length} error logs (showing ${sample.length}):\n\n${formatted}`,
      });

      setAiAnalysis({ text: result.reply, loading: false, error: null });
    } catch (err) {
      setAiAnalysis({ text: null, loading: false, error: err.message });
      toast.error('AI analysis failed: ' + err.message);
    }
  };

  if (!isAdmin) {
    return <div className="p-6 text-center text-slate-500">Admin access required.</div>;
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <PageHeader
        title="Error Log"
        subtitle={`${unresolvedCount} unresolved error${unresolvedCount !== 1 ? 's' : ''} · ${userReportCount} user report${userReportCount !== 1 ? 's' : ''}`}
      />

      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={analyzeWithAI}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
          disabled={aiAnalysis?.loading}
        >
          {aiAnalysis?.loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {aiAnalysis?.loading ? 'Analyzing...' : `Analyze with AI (${filteredErrors.filter(e => !e.is_resolved).length})`}
        </Button>
        <Button onClick={copyForClaude} variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
          <Copy className="w-4 h-4 mr-2" />
          Copy for Claude ({unresolvedCount})
        </Button>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['errorLogs'] })}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
        {errors.some(e => e.is_resolved) && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => clearResolved.mutate()}
            disabled={clearResolved.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Resolved
          </Button>
        )}
      </div>

      {/* AI Analysis Panel */}
      {aiAnalysis && !aiAnalysis.loading && (aiAnalysis.text || aiAnalysis.error) && (
        <Card className="p-4 border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50 relative">
          <button
            onClick={() => setAiAnalysis(null)}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-purple-100 text-purple-400"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">AI Analysis</h3>
          </div>
          {aiAnalysis.error ? (
            <p className="text-sm text-red-600">{aiAnalysis.error}</p>
          ) : (
            <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {aiAnalysis.text}
            </div>
          )}
        </Card>
      )}

      {/* Batch actions bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSelectAll}
          className="text-xs"
        >
          <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
          {filteredErrors.length > 0 && filteredErrors.every(e => selectedIds.has(e.id))
            ? 'Deselect All'
            : `Select All (${filteredErrors.length})`}
        </Button>
        {selectedIds.size > 0 && (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-xs"
            onClick={() => batchResolve.mutate(selectedIds)}
            disabled={batchResolve.isPending}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Resolve Selected ({selectedIds.size})
          </Button>
        )}
        {filteredUnresolvedIds.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 hover:bg-green-50 text-xs"
            onClick={() => batchResolveFiltered.mutate(filteredUnresolvedIds)}
            disabled={batchResolveFiltered.isPending}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Resolve All Visible ({filteredUnresolvedIds.length})
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search errors..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'unresolved', label: 'Unresolved' },
            { id: 'user_report', label: 'User Reports' },
            { id: 'resolved', label: 'Resolved' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === f.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <Calendar className="w-4 h-4 text-slate-400" />
        <button
          onClick={() => setDateFilter('')}
          className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
            !dateFilter ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Dates
        </button>
        {availableDates.slice(0, 7).map(d => {
          const dateObj = new Date(d + 'T12:00:00');
          const label = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
          const count = errors.filter(e => e.created_at?.startsWith(d)).length;
          return (
            <button
              key={d}
              onClick={() => setDateFilter(d)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
                dateFilter === d ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Error list */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading errors...</div>
      ) : filteredErrors.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No errors found</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter !== 'all' || dateFilter ? 'Try changing the filter' : 'The app is running smoothly'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-400">{filteredErrors.length} error{filteredErrors.length !== 1 ? 's' : ''} shown</p>
          {filteredErrors.map((err) => {
            const sourceInfo = SOURCE_LABELS[err.error_source] || SOURCE_LABELS.unknown;
            const Icon = getReportTypeIcon(err.metadata);
            const isSelected = selectedIds.has(err.id);
            return (
              <Card
                key={err.id}
                className={`p-4 border-0 shadow-sm transition-colors ${
                  err.is_resolved ? 'opacity-50' : ''
                } ${isSelected ? 'ring-2 ring-teal-400 bg-teal-50/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex items-center gap-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(err.id)}
                      className="data-[state=checked]:bg-teal-600"
                    />
                    <Icon className={`w-4 h-4 ${err.is_resolved ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceInfo.color}`}>
                        {sourceInfo.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {err.page_url}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(err.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium break-words">
                      {err.error_message?.slice(0, 300)}
                      {err.error_message?.length > 300 ? '...' : ''}
                    </p>
                    {err.error_stack && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                          Stack trace
                        </summary>
                        <pre className="text-xs text-slate-500 mt-1 p-2 bg-slate-50 rounded overflow-x-auto max-h-32 whitespace-pre-wrap">
                          {err.error_stack}
                        </pre>
                      </details>
                    )}
                    <div className="text-xs text-slate-400 mt-1">
                      {err.user_email}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleResolved.mutate({ id: err.id, resolved: !err.is_resolved })}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                      err.is_resolved
                        ? 'bg-green-100 text-green-600 hover:bg-green-200'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    }`}
                    title={err.is_resolved ? 'Mark as unresolved' : 'Mark as resolved'}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

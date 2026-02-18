import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';
import {
  Bug,
  Copy,
  CheckCircle2,
  Clock,
  Search,
  Trash2,
  Filter,
  MessageSquare,
  Lightbulb,
  AlertTriangle,
  RefreshCw,
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
    refetchInterval: 30000, // Auto-refresh every 30s
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

  const filteredErrors = errors.filter((err) => {
    if (filter === 'unresolved' && err.is_resolved) return false;
    if (filter === 'resolved' && !err.is_resolved) return false;
    if (filter === 'user_report' && err.error_source !== 'user_report') return false;
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

  const unresolvedCount = errors.filter(e => !e.is_resolved).length;
  const userReportCount = errors.filter(e => e.error_source === 'user_report').length;

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
      // Fallback: create a text area for manual copy
      const ta = document.createElement('textarea');
      ta.value = header + formatted;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      toast.success(`Copied ${unresolvedErrors.length} errors to clipboard`);
    });
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
        <Button onClick={copyForClaude} className="bg-purple-600 hover:bg-purple-700">
          <Copy className="w-4 h-4 mr-2" />
          Copy All for Claude ({unresolvedCount})
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

      {/* Error list */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Loading errors...</div>
      ) : filteredErrors.length === 0 ? (
        <Card className="p-8 text-center border-0 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">No errors found</p>
          <p className="text-sm text-slate-400 mt-1">
            {filter !== 'all' ? 'Try changing the filter' : 'The app is running smoothly'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredErrors.map((err) => {
            const sourceInfo = SOURCE_LABELS[err.error_source] || SOURCE_LABELS.unknown;
            const Icon = getReportTypeIcon(err.metadata);
            return (
              <Card
                key={err.id}
                className={`p-4 border-0 shadow-sm ${err.is_resolved ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
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

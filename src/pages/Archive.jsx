import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId } from '@/lib/orgContext';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, RotateCcw, Trash2, Eye, Archive as ArchiveIcon,
  Search, Clock, CalendarClock, Loader2
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { format, parseISO, addMonths, addYears } from 'date-fns';
import { toast } from 'sonner';

const RETENTION_OPTIONS = [
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year' },
  { value: '2y', label: '2 years' },
  { value: '3y', label: '3 years' },
  { value: '4y', label: '4 years' },
  { value: '5y', label: '5 years' },
  { value: 'forever', label: 'Keep forever' },
];

function calcKeepUntil(value) {
  const now = new Date();
  if (value === '6m') return addMonths(now, 6).toISOString();
  if (value === '1y') return addYears(now, 1).toISOString();
  if (value === '2y') return addYears(now, 2).toISOString();
  if (value === '3y') return addYears(now, 3).toISOString();
  if (value === '4y') return addYears(now, 4).toISOString();
  if (value === '5y') return addYears(now, 5).toISOString();
  return null; // forever
}

function retentionLabel(keepUntil) {
  if (!keepUntil) return 'Forever';
  try {
    return format(parseISO(keepUntil), 'dd MMM yyyy');
  } catch {
    return 'Unknown';
  }
}

const TYPE_COLORS = {
  document: 'bg-blue-100 text-blue-700',
  staff: 'bg-purple-100 text-purple-700',
  rota: 'bg-orange-100 text-orange-700',
  client: 'bg-green-100 text-green-700',
  incident: 'bg-red-100 text-red-700',
  training: 'bg-cyan-100 text-cyan-700',
  leave_request: 'bg-amber-100 text-amber-700',
  message: 'bg-pink-100 text-pink-700',
  care_log: 'bg-teal-100 text-teal-700',
  form_submission: 'bg-indigo-100 text-indigo-700',
  assessment: 'bg-rose-100 text-rose-700',
  photo: 'bg-violet-100 text-violet-700',
};

const ITEM_TYPES = [
  'all', 'client', 'staff', 'document', 'message', 'care_log',
  'training', 'incident', 'rota', 'leave_request', 'form_submission',
  'assessment', 'photo'
];

export default function Archive() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Fetch archived items
  const { data: archivedItems = [], isLoading } = useQuery({
    queryKey: ['archives'],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase.from('archives').select('*');
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q.order('created_at', { ascending: false }).limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  // Restore item
  const restoreMutation = useMutation({
    mutationFn: async (item) => {
      // Try to re-insert the original data
      if (item.data && item.entity_type) {
        const tableMap = {
          client: 'service_users',
          staff: 'users',
          document: 'shared_files',
          message: 'messages',
          care_log: 'care_logs',
          training: 'training_records',
          incident: 'incidents',
          rota: 'shifts',
          leave_request: 'leave_requests',
          form_submission: 'form_submissions',
          assessment: 'assessments',
          photo: 'org_photos',
        };
        const table = tableMap[item.entity_type];
        if (table) {
          const rowData = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          // Remove any fields that might cause conflicts
          const { created_at, updated_at, ...restoreData } = rowData;
          const { error: insertErr } = await supabase.from(table).upsert(restoreData);
          if (insertErr) {
            console.error('Restore insert error:', insertErr);
            throw new Error(`Could not restore: ${insertErr.message}`);
          }
        }
      }

      // Mark as restored
      const { error } = await supabase
        .from('archives')
        .update({ is_restored: true, restored_at: new Date().toISOString() })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item restored successfully');
      queryClient.invalidateQueries({ queryKey: ['archives'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to restore item'),
  });

  // Permanent delete
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('archives').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Permanently deleted');
      queryClient.invalidateQueries({ queryKey: ['archives'] });
    },
    onError: () => toast.error('Failed to delete'),
  });

  // Update retention period
  const updateRetentionMutation = useMutation({
    mutationFn: async ({ id, keepUntil }) => {
      const { error } = await supabase
        .from('archives')
        .update({ keep_until: keepUntil })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Retention period updated');
      queryClient.invalidateQueries({ queryKey: ['archives'] });
    },
    onError: () => toast.error('Failed to update retention'),
  });

  // Clear all (permanently delete all non-restored items)
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase.from('archives').delete().eq('is_restored', false);
      if (orgId) q = q.eq('organization_id', orgId);
      const { error } = await q;
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Archive cleared');
      queryClient.invalidateQueries({ queryKey: ['archives'] });
      setConfirmClearAll(false);
    },
    onError: () => toast.error('Failed to clear archive'),
  });

  // Filter
  const activeItems = archivedItems.filter(i => !i.is_restored);
  const restoredItems = archivedItems.filter(i => i.is_restored);

  const filtered = activeItems.filter(item => {
    const matchesType = selectedType === 'all' || item.entity_type === selectedType;
    if (!matchesType) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (item.item_name || '').toLowerCase().includes(q) ||
             (item.entity_type || '').toLowerCase().includes(q) ||
             (item.archive_reason || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Check for expired items
  const expiredCount = activeItems.filter(i =>
    i.keep_until && new Date(i.keep_until) < new Date()
  ).length;

  return (
    <div className="max-w-4xl mx-auto pb-8 space-y-5">
      <PageHeader
        title="Archive"
        subtitle="Recover deleted items or permanently remove them"
        icon={ArchiveIcon}
      />

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search archived items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setConfirmClearAll(true)}
            disabled={activeItems.length === 0}
            className="gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>

        {/* Type filter chips */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {ITEM_TYPES.map(type => {
            const count = type === 'all'
              ? activeItems.length
              : activeItems.filter(i => i.entity_type === type).length;
            if (type !== 'all' && count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type === 'all' ? 'All' : type.replace(/_/g, ' ')}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Expired items warning */}
      {expiredCount > 0 && (
        <Card className="p-3 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-2 text-amber-700 text-sm">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{expiredCount} item{expiredCount > 1 ? 's have' : ' has'} passed their retention period</span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto text-amber-700 border-amber-300 hover:bg-amber-100"
              onClick={() => {
                const expired = activeItems.filter(i => i.keep_until && new Date(i.keep_until) < new Date());
                setPendingAction(async () => {
                  for (const item of expired) {
                    await supabase.from('archives').delete().eq('id', item.id);
                  }
                  queryClient.invalidateQueries({ queryKey: ['archives'] });
                  toast.success(`${expired.length} expired item${expired.length > 1 ? 's' : ''} removed`);
                });
                setConfirmOpen(true);
              }}
            >
              Remove Expired
            </Button>
          </div>
        </Card>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {!isLoading && (
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Deleted ({filtered.length})</TabsTrigger>
            <TabsTrigger value="restored">Restored ({restoredItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-3 mt-3">
            {filtered.length === 0 ? (
              <Card className="p-12 text-center">
                <ArchiveIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No archived items</p>
                <p className="text-slate-400 text-sm mt-1">
                  Items you delete from the app will appear here for recovery
                </p>
              </Card>
            ) : (
              filtered.map(item => (
                <ArchiveCard
                  key={item.id}
                  item={item}
                  onRestore={() => restoreMutation.mutate(item)}
                  onDelete={() => {
                    setPendingAction(() => () => permanentDeleteMutation.mutate(item.id));
                    setConfirmOpen(true);
                  }}
                  onRetentionChange={(val) => {
                    updateRetentionMutation.mutate({
                      id: item.id,
                      keepUntil: calcKeepUntil(val),
                    });
                  }}
                  isRestoring={restoreMutation.isPending}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="restored" className="space-y-3 mt-3">
            {restoredItems.length === 0 ? (
              <Card className="p-12 text-center">
                <RotateCcw className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">No restored items yet</p>
                <p className="text-slate-400 text-sm mt-1">
                  Items you restore will be shown here as a record
                </p>
              </Card>
            ) : (
              restoredItems.map(item => (
                <Card key={item.id} className="p-4 opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={TYPE_COLORS[item.entity_type] || 'bg-gray-100 text-gray-700'}>
                          {(item.entity_type || 'other').replace(/_/g, ' ')}
                        </Badge>
                        <Badge className="bg-green-100 text-green-700">Restored</Badge>
                      </div>
                      <p className="font-medium text-slate-800 truncate">{item.item_name || 'Untitled'}</p>
                      <p className="text-xs text-slate-400">
                        Restored {item.restored_at ? format(parseISO(item.restored_at), 'dd MMM yyyy HH:mm') : ''}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => {
                        setPendingAction(() => () => permanentDeleteMutation.mutate(item.id));
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Confirm permanent delete */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Permanently delete?"
        description="This cannot be undone. The item will be permanently removed."
        confirmLabel="Yes, Delete"
        variant="destructive"
        onConfirm={() => pendingAction?.()}
      />

      {/* Confirm clear all */}
      <ConfirmDialog
        open={confirmClearAll}
        onOpenChange={setConfirmClearAll}
        title="Clear entire archive?"
        description={`This will permanently delete all ${activeItems.length} archived item${activeItems.length !== 1 ? 's' : ''}. This cannot be undone.`}
        confirmLabel="Yes, Clear All"
        variant="destructive"
        onConfirm={() => clearAllMutation.mutate()}
      />
    </div>
  );
}

/** Single archive item card */
function ArchiveCard({ item, onRestore, onDelete, onRetentionChange, isRestoring }) {
  const isExpired = item.keep_until && new Date(item.keep_until) < new Date();

  return (
    <Card className={`p-4 ${isExpired ? 'border-amber-200 bg-amber-50/50' : ''}`}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge className={TYPE_COLORS[item.entity_type] || 'bg-gray-100 text-gray-700'}>
              {(item.entity_type || 'other').replace(/_/g, ' ')}
            </Badge>
            {isExpired && (
              <Badge className="bg-amber-100 text-amber-700">Expired</Badge>
            )}
          </div>
          <h3 className="font-semibold text-slate-900 truncate">{item.item_name || 'Untitled'}</h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
            <span>Deleted by: {item.deleted_by_name || 'Unknown'}</span>
            <span>Deleted: {format(parseISO(item.created_at), 'dd MMM yyyy HH:mm')}</span>
            {item.keep_until && (
              <span className={`flex items-center gap-1 ${isExpired ? 'text-amber-600 font-medium' : ''}`}>
                <CalendarClock className="w-3 h-3" />
                Keep until: {retentionLabel(item.keep_until)}
              </span>
            )}
          </div>

          {item.archive_reason && (
            <p className="text-xs text-slate-500 mt-1">
              Reason: {item.archive_reason}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex sm:flex-col items-center gap-2 flex-shrink-0">
          {/* Retention dropdown */}
          <Select
            value=""
            onValueChange={onRetentionChange}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Keep until..." />
            </SelectTrigger>
            <SelectContent>
              {RETENTION_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1.5">
            {/* Preview */}
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{item.item_name || 'Archived Item'}</DialogTitle>
                </DialogHeader>
                <div className="max-h-96 overflow-auto">
                  <pre className="bg-slate-50 p-4 rounded text-xs text-slate-700 whitespace-pre-wrap break-words">
                    {JSON.stringify(
                      typeof item.data === 'string' ? JSON.parse(item.data) : item.data,
                      null,
                      2
                    )}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>

            {/* Restore */}
            <Button
              size="sm"
              onClick={onRestore}
              disabled={isRestoring}
              className="h-8 bg-green-600 hover:bg-green-700 gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restore</span>
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="destructive"
              onClick={onDelete}
              className="h-8 gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

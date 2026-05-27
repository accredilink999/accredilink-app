import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Loader2, Upload, FileText, ExternalLink, X,
  CheckCircle2, AlertTriangle, XCircle, Plus
} from 'lucide-react';
import { format, parseISO, addMonths } from 'date-fns';
import { toast } from 'sonner';

// ── Matrix types ──────────────────────────────────────────────────────────────
const MATRIX_TYPES = [
  { key: 'onboarding', label: 'Onboarding', fullLabel: 'Onboarding Documents', emoji: '📋', accent: '#3b82f6' },
  { key: 'training',   label: 'Training',   fullLabel: 'Training & Development', emoji: '🎓', accent: '#8b5cf6' },
  { key: 'compliance', label: 'Compliance', fullLabel: 'Compliance',             emoji: '✅', accent: '#0d9488' },
];

// ── Status helpers ────────────────────────────────────────────────────────────
function getStatus(entry) {
  if (!entry) return 'empty';
  if (!entry.expiry_date) return 'valid';
  const today = new Date(); today.setHours(0,0,0,0);
  const exp   = new Date(entry.expiry_date);
  if (exp < today) return 'expired';
  if (exp < addMonths(today, 2)) return 'expiring';
  return 'valid';
}

const STATUS = {
  empty:    { bg: '#f8fafc', border: '#e2e8f0', color: '#94a3b8', label: 'Not yet added',   Icon: null },
  valid:    { bg: '#f0fdf4', border: '#86efac', color: '#15803d', label: 'Valid',            Icon: CheckCircle2 },
  expiring: { bg: '#fffbeb', border: '#fde68a', color: '#a16207', label: 'Expiring soon',   Icon: AlertTriangle },
  expired:  { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626', label: 'Expired',         Icon: XCircle },
};

// ── Main component ────────────────────────────────────────────────────────────
export default function StaffMyMatrix({ userId }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const orgId = getCurrentOrgId();

  const [matrixType, setMatrixType] = useState('onboarding');
  const [editDialog, setEditDialog] = useState(null); // { column, entry | null }
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: columns = [], isLoading: colLoading, error: colError } = useQuery({
    queryKey: ['matrix-columns', matrixType, orgId],
    queryFn: async () => {
      let q = supabase.from('staff_matrix_columns')
        .select('*')
        .eq('matrix_type', matrixType)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    retry: false,
  });

  const { data: entries = [], isLoading: entryLoading } = useQuery({
    queryKey: ['my-matrix-entries', matrixType, userId, orgId],
    queryFn: async () => {
      if (!userId || !columns.length) return [];
      const colIds = columns.map(c => c.id);
      const { data, error } = await supabase
        .from('staff_matrix_entries')
        .select('*')
        .eq('staff_id', userId)
        .in('column_id', colIds);
      if (error) throw error;
      return data || [];
    },
    enabled: !!userId && columns.length > 0,
  });

  const entryMap = useMemo(() => {
    const m = {};
    entries.forEach(e => { m[e.column_id] = e; });
    return m;
  }, [entries]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async ({ columnId }) => {
      const payload = {
        organization_id: orgId,
        staff_id: userId,
        column_id: columnId,
        matrix_type: matrixType,
        record_date:        form.record_date        || null,
        expiry_date:        form.expiry_date        || null,
        certificate_number: form.certificate_number || null,
        document_url:       form.document_url       || null,
        document_name:      form.document_name      || null,
        notes:              form.notes              || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('staff_matrix_entries')
        .upsert(payload, { onConflict: 'staff_id,column_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-matrix-entries'] });
      queryClient.invalidateQueries({ queryKey: ['matrix-entries'] }); // refresh admin view too
      setEditDialog(null);
      toast.success('Saved ✓');
    },
    onError: (e) => toast.error('Save failed: ' + e.message),
  });

  // ── Document upload ────────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, document_url: file_url, document_name: file.name }));
      toast.success('Document uploaded — click Save to confirm');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const openEdit = (column) => {
    const entry = entryMap[column.id] || null;
    setForm({
      record_date:        entry?.record_date        || '',
      expiry_date:        entry?.expiry_date        || '',
      certificate_number: entry?.certificate_number || '',
      document_url:       entry?.document_url       || '',
      document_name:      entry?.document_name      || '',
      notes:              entry?.notes              || '',
    });
    setEditDialog({ column, entry });
  };

  // ── Derived totals ─────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    let valid = 0, expiring = 0, expired = 0, empty = 0;
    columns.forEach(col => {
      const s = getStatus(entryMap[col.id]);
      if (s === 'valid') valid++;
      else if (s === 'expiring') expiring++;
      else if (s === 'expired') expired++;
      else empty++;
    });
    return { valid, expiring, expired, empty };
  }, [columns, entryMap]);

  const activeType = MATRIX_TYPES.find(t => t.key === matrixType);
  const isLoading  = colLoading || entryLoading;
  const tableMissing = colError?.message?.includes('does not exist') || colError?.code === '42P01';

  if (tableMissing) {
    return (
      <div className="p-6 text-center text-slate-500">
        <p className="text-sm">The compliance matrix hasn't been set up yet.</p>
        <p className="text-xs mt-1 text-slate-400">Ask your administrator to enable it.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Matrix type tabs */}
      <div className="flex gap-2 flex-wrap">
        {MATRIX_TYPES.map(type => (
          <button
            key={type.key}
            onClick={() => setMatrixType(type.key)}
            style={{
              padding: '7px 14px', borderRadius: 10, fontSize: 13, fontWeight: 500,
              border: `2px solid ${matrixType === type.key ? type.accent : '#e2e8f0'}`,
              background: matrixType === type.key ? type.accent : '#fff',
              color: matrixType === type.key ? '#fff' : '#64748b',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>{type.emoji}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>

      {/* Summary strip */}
      {!isLoading && columns.length > 0 && (
        <div className="flex gap-2 flex-wrap text-xs">
          {totals.expired  > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">{totals.expired} expired</span>}
          {totals.expiring > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{totals.expiring} expiring soon</span>}
          {totals.empty    > 0 && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{totals.empty} not yet added</span>}
          {totals.expired === 0 && totals.expiring === 0 && totals.empty === 0 && (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">✓ All up to date</span>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        </div>
      )}

      {/* No columns yet */}
      {!isLoading && columns.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
          <div className="text-3xl mb-2">{activeType.emoji}</div>
          <p className="text-sm font-medium text-slate-600">{activeType.fullLabel}</p>
          <p className="text-xs text-slate-400 mt-1">No sections added yet. Your administrator will set these up.</p>
        </div>
      )}

      {/* Cards grid */}
      {!isLoading && columns.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {columns.map(col => {
            const entry  = entryMap[col.id] || null;
            const status = getStatus(entry);
            const { bg, border, color, label, Icon } = STATUS[status];

            return (
              <button
                key={col.id}
                onClick={() => openEdit(col)}
                style={{
                  textAlign: 'left', padding: '14px 16px',
                  borderRadius: 14, border: `2px solid ${border}`,
                  background: bg, cursor: 'pointer',
                  transition: 'box-shadow 0.15s, transform 0.1s',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {/* Title row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, lineHeight: 1.3 }}>
                    {col.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {Icon
                      ? <Icon style={{ width: 16, height: 16, color }} />
                      : <Plus style={{ width: 14, height: 14, color: '#94a3b8' }} />
                    }
                    <span style={{ fontSize: 10, fontWeight: 600, color, whiteSpace: 'nowrap' }}>
                      {label}
                    </span>
                  </div>
                </div>

                {/* Entry details */}
                {entry ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {entry.record_date && (
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        Obtained: {format(parseISO(entry.record_date), 'dd MMM yyyy')}
                      </span>
                    )}
                    {entry.expiry_date && (
                      <span style={{ fontSize: 11, color, fontWeight: status !== 'valid' ? 600 : 400 }}>
                        Expires: {format(parseISO(entry.expiry_date), 'dd MMM yyyy')}
                      </span>
                    )}
                    {entry.certificate_number && (
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        Ref: {entry.certificate_number}
                      </span>
                    )}
                    {entry.document_url && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <FileText style={{ width: 12, height: 12, color: '#0d9488' }} />
                        <span style={{ fontSize: 11, color: '#0d9488', fontWeight: 500 }}>
                          {entry.document_name || 'Document attached'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    Tap to add details or upload a document
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Edit / Upload Dialog ───────────────────────────────────────────── */}
      {editDialog && (
        <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base leading-snug">
                {editDialog.column.title}
                <span className="block text-xs font-normal text-slate-400 mt-0.5">
                  {activeType.fullLabel}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Date Obtained</Label>
                  <Input
                    type="date"
                    className="mt-1 text-sm"
                    value={form.record_date}
                    onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Expiry Date</Label>
                  <Input
                    type="date"
                    className="mt-1 text-sm"
                    value={form.expiry_date}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Certificate / Registration Number */}
              <div>
                <Label className="text-xs">Certificate / Registration Number</Label>
                <Input
                  className="mt-1 text-sm"
                  value={form.certificate_number}
                  onChange={e => setForm(f => ({ ...f, certificate_number: e.target.value }))}
                  placeholder="e.g. DBS-2024-XXXXX"
                />
              </div>

              {/* Document upload */}
              <div>
                <Label className="text-xs">Upload Document / Certificate</Label>
                <div className="mt-1">
                  {form.document_url ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-700 flex-1 truncate">
                        {form.document_name || 'Document uploaded'}
                      </span>
                      <a
                        href={form.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 flex-shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setForm(f => ({ ...f, document_url: '', document_name: '' }))}
                        className="text-slate-400 hover:text-red-500 flex-shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 text-sm hover:border-teal-400 hover:text-teal-600 transition-colors"
                    >
                      {uploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Upload document or certificate</>
                      )}
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea
                  className="mt-1 text-sm resize-none"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional information..."
                />
              </div>

              {/* Status preview */}
              {(form.expiry_date || form.record_date) && (() => {
                const s = getStatus({ expiry_date: form.expiry_date });
                const { bg, border, color, label } = STATUS[form.expiry_date ? s : 'valid'];
                return (
                  <div style={{
                    padding: '8px 12px', background: bg,
                    border: `1px solid ${border}`, borderRadius: 8,
                    fontSize: 12, color, fontWeight: 600,
                  }}>
                    {label}
                    {form.expiry_date && ` · Expires ${format(parseISO(form.expiry_date), 'dd MMM yyyy')}`}
                  </div>
                );
              })()}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button
                onClick={() => saveMutation.mutate({ columnId: editDialog.column.id })}
                disabled={saveMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

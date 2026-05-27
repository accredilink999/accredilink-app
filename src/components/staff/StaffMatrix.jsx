import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { base44 } from '@/api/base44Client';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, FileText, Upload, ExternalLink, CheckCircle2, AlertTriangle, XCircle, X, ChevronDown } from 'lucide-react';
import { format, parseISO, addMonths } from 'date-fns';
import { toast } from 'sonner';

// ── Matrix type definitions ───────────────────────────────────────────────────
const MATRIX_TYPES = [
  { key: 'onboarding',  label: 'Onboarding Documents',   emoji: '📋', accent: '#3b82f6' },
  { key: 'compliance',  label: 'Compliance',              emoji: '✅', accent: '#0d9488', yearly: true },
  { key: 'training',    label: 'Training & Development',  emoji: '🎓', accent: '#8b5cf6' },
];

// ── Cell status helpers ────────────────────────────────────────────────────────
function getStatus(entry, matrixType) {
  if (!entry) return 'empty';
  const today = new Date(); today.setHours(0,0,0,0);

  // Compliance: yearly cycle — expires Dec 31 of the year it was completed
  if (matrixType === 'compliance') {
    let exp;
    if (entry.expiry_date) {
      exp = new Date(entry.expiry_date);
    } else if (entry.record_date) {
      exp = new Date(`${new Date(entry.record_date).getFullYear()}-12-31`);
    } else {
      return 'valid'; // entry exists but no dates yet
    }
    if (exp < today) return 'expired';
    if (exp < addMonths(today, 2)) return 'expiring';
    return 'valid';
  }

  // Standard: use expiry_date if present
  if (!entry.expiry_date) return 'valid';          // filed, no expiry
  const exp = new Date(entry.expiry_date);
  if (exp < today) return 'expired';
  if (exp < addMonths(today, 2)) return 'expiring';
  return 'valid';
}

const STATUS = {
  empty:    { bg: '#f8fafc', border: '#e2e8f0', dot: '#cbd5e1', label: 'Not set',        Icon: null },
  valid:    { bg: '#f0fdf4', border: '#86efac', dot: '#22c55e', label: 'Valid',           Icon: CheckCircle2 },
  expiring: { bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', label: 'Expiring soon',  Icon: AlertTriangle },
  expired:  { bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444', label: 'Expired',        Icon: XCircle },
};

// ── SQL shown when tables haven't been created yet ───────────────────────────
const SETUP_SQL = `-- Run this in your Supabase SQL editor (Database > SQL Editor)

CREATE TABLE IF NOT EXISTS staff_matrix_columns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  matrix_type     TEXT NOT NULL DEFAULT 'training',
  title           TEXT NOT NULL,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_matrix_entries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id    UUID,
  staff_id           UUID NOT NULL,
  column_id          UUID NOT NULL REFERENCES staff_matrix_columns(id) ON DELETE CASCADE,
  matrix_type        TEXT NOT NULL,
  record_date        DATE,
  expiry_date        DATE,
  certificate_number TEXT,
  document_url       TEXT,
  document_name      TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(staff_id, column_id)
);

ALTER TABLE staff_matrix_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_matrix_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "matrix_cols_all" ON staff_matrix_columns
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "matrix_entries_all" ON staff_matrix_entries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);`;

// ── Cell component ────────────────────────────────────────────────────────────
function MatrixCell({ entry, column, staff, isAdmin, onClick }) {
  const status = getStatus(entry, column.matrix_type);
  const { bg, border, dot, Icon } = STATUS[status];

  return (
    <div
      onClick={() => onClick({ staff, column, entry })}
      title={
        entry
          ? [
              column.title,
              entry.record_date ? `Obtained: ${format(parseISO(entry.record_date), 'dd MMM yyyy')}` : null,
              entry.expiry_date ? `Expires: ${format(parseISO(entry.expiry_date), 'dd MMM yyyy')}` : null,
              entry.certificate_number ? `Ref: ${entry.certificate_number}` : null,
              STATUS[status].label,
            ].filter(Boolean).join('\n')
          : `${column.title} — click to add`
      }
      style={{
        width: 64, height: 56,
        background: bg, border: `2px solid ${border}`,
        borderRadius: 10, cursor: 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 2, flexShrink: 0,
        transition: 'transform 0.1s, box-shadow 0.1s',
        position: 'relative',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {status === 'empty' ? (
        isAdmin
          ? <Plus style={{ width: 18, height: 18, color: '#94a3b8' }} />
          : <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>
      ) : (
        <>
          {Icon && <Icon style={{ width: 16, height: 16, color: dot, flexShrink: 0 }} />}
          {entry?.expiry_date && (
            <span style={{ fontSize: 9, color: dot, fontWeight: 600, letterSpacing: '-0.2px' }}>
              {format(parseISO(entry.expiry_date), 'MMM yy')}
            </span>
          )}
          {entry?.document_url && (
            <FileText style={{ width: 10, height: 10, color: dot, opacity: 0.7 }} />
          )}
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StaffMatrix({ isAdmin }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [matrixType, setMatrixType] = useState('onboarding');
  const [editDialog, setEditDialog] = useState(null); // { staff, column, entry }
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [form, setForm] = useState({});
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);

  const orgId = getCurrentOrgId();

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: allStaff = [] } = useQuery({
    queryKey: ['allStaff'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: columns = [], error: colError, isLoading: colLoading } = useQuery({
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
    queryKey: ['matrix-entries', matrixType, orgId],
    queryFn: async () => {
      if (!columns.length) return [];
      const colIds = columns.map(c => c.id);
      let q = supabase.from('staff_matrix_entries')
        .select('*')
        .in('column_id', colIds);
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: columns.length > 0,
  });

  // ── Derived: O(1) entry lookup ─────────────────────────────────────────────
  const entryMap = useMemo(() => {
    const m = {};
    entries.forEach(e => { m[`${e.staff_id}:${e.column_id}`] = e; });
    return m;
  }, [entries]);

  // ── Status summary for a staff member in this matrix ──────────────────────
  function staffSummary(staffId) {
    let valid = 0, expiring = 0, expired = 0, empty = 0;
    columns.forEach(col => {
      const s = getStatus(entryMap[`${staffId}:${col.id}`], matrixType);
      if (s === 'valid') valid++;
      else if (s === 'expiring') expiring++;
      else if (s === 'expired') expired++;
      else empty++;
    });
    return { valid, expiring, expired, empty };
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  const addColumnMutation = useMutation({
    mutationFn: async (title) => {
      const { data, error } = await supabase.from('staff_matrix_columns').insert({
        organization_id: orgId,
        matrix_type: matrixType,
        title: title.trim(),
        sort_order: columns.length,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-columns'] });
      setShowAddColumn(false);
      setNewColumnTitle('');
      toast.success('Column added for all staff');
    },
    onError: (e) => toast.error('Failed to add column: ' + e.message),
  });

  const deleteColumnMutation = useMutation({
    mutationFn: async (colId) => {
      const { error } = await supabase.from('staff_matrix_columns').delete().eq('id', colId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-columns'] });
      queryClient.invalidateQueries({ queryKey: ['matrix-entries'] });
      toast.success('Column removed');
    },
    onError: (e) => toast.error('Failed to delete: ' + e.message),
  });

  const saveEntryMutation = useMutation({
    mutationFn: async ({ staffId, columnId, data }) => {
      const payload = {
        organization_id: orgId,
        staff_id: staffId,
        column_id: columnId,
        matrix_type: matrixType,
        record_date: data.record_date || null,
        expiry_date: data.expiry_date || null,
        certificate_number: data.certificate_number || null,
        document_url: data.document_url || null,
        document_name: data.document_name || null,
        notes: data.notes || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('staff_matrix_entries')
        .upsert(payload, { onConflict: 'staff_id,column_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-entries'] });
      setEditDialog(null);
      toast.success('Entry saved');
    },
    onError: (e) => toast.error('Failed to save: ' + e.message),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId) => {
      const { error } = await supabase.from('staff_matrix_entries').delete().eq('id', entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-entries'] });
      setEditDialog(null);
      toast.success('Entry removed');
    },
    onError: (e) => toast.error('Failed to remove: ' + e.message),
  });

  // ── Document upload ────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, document_url: file_url, document_name: file.name }));
      toast.success('Document uploaded');
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ── Open entry dialog ──────────────────────────────────────────────────────
  const openEdit = ({ staff, column, entry }) => {
    if (!isAdmin) return;
    const isCompliance = column.matrix_type === 'compliance';
    const currentYear  = new Date().getFullYear();
    setForm({
      record_date:        entry?.record_date        || '',
      expiry_date:        entry?.expiry_date        || (isCompliance ? `${currentYear}-12-31` : ''),
      certificate_number: entry?.certificate_number || '',
      document_url:       entry?.document_url       || '',
      document_name:      entry?.document_name      || '',
      notes:              entry?.notes              || '',
    });
    setEditDialog({ staff, column, entry });
  };

  const handleSave = () => {
    saveEntryMutation.mutate({
      staffId: editDialog.staff.id,
      columnId: editDialog.column.id,
      data: form,
    });
  };

  // ── Table-missing state ────────────────────────────────────────────────────
  const tablesMissing = colError?.code === '42P01' || colError?.message?.includes('does not exist');

  if (tablesMissing) {
    return (
      <div className="space-y-4 p-4">
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-6">
          <h3 className="font-bold text-amber-800 text-lg mb-2">⚙️ One-time setup required</h3>
          <p className="text-amber-700 text-sm mb-4">
            The Staff Matrix needs two database tables. Copy the SQL below and run it in your
            <strong> Supabase dashboard → Database → SQL Editor</strong>, then refresh.
          </p>
          <div className="relative">
            <pre className="bg-slate-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap font-mono">
              {SETUP_SQL}
            </pre>
            <Button
              size="sm"
              className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white text-xs"
              onClick={() => { navigator.clipboard.writeText(SETUP_SQL); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            >
              {copied ? '✓ Copied' : 'Copy SQL'}
            </Button>
          </div>
          <Button className="mt-4 bg-amber-600 hover:bg-amber-700" onClick={() => window.location.reload()}>
            Refresh after running SQL
          </Button>
        </div>
      </div>
    );
  }

  const activeType = MATRIX_TYPES.find(t => t.key === matrixType);
  const isLoading = colLoading || entryLoading;

  return (
    <div className="space-y-4">

      {/* Matrix type tabs */}
      <div className="flex gap-2 flex-wrap">
        {MATRIX_TYPES.map(type => (
          <button
            key={type.key}
            onClick={() => setMatrixType(type.key)}
            style={{
              padding: '8px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
              border: `2px solid ${matrixType === type.key ? type.accent : '#e2e8f0'}`,
              background: matrixType === type.key ? type.accent : '#fff',
              color: matrixType === type.key ? '#fff' : '#64748b',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>{type.emoji}</span>
            <span className="hidden sm:inline">{type.label}</span>
            <span className="sm:hidden">{type.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">
            {activeType.emoji} {activeType.label}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {columns.length} column{columns.length !== 1 ? 's' : ''} · {allStaff.length} staff
          </p>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => setShowAddColumn(true)}
            className="bg-teal-600 hover:bg-teal-700 flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Add Column</span>
            <span className="sm:hidden">Column</span>
          </Button>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap text-xs">
        {Object.entries(STATUS).map(([key, { dot, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: dot, flexShrink: 0 }} />
            <span className="text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      )}

      {/* Empty columns state */}
      {!isLoading && columns.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <div className="text-4xl mb-3">{activeType.emoji}</div>
          <p className="font-semibold text-slate-700">No columns yet</p>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Click "Add Column" to create the first section. It will appear for all staff.'
              : 'No sections have been set up for this matrix yet.'}
          </p>
          {isAdmin && (
            <Button
              className="mt-4 bg-teal-600 hover:bg-teal-700"
              onClick={() => setShowAddColumn(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Column
            </Button>
          )}
        </div>
      )}

      {/* Matrix grid */}
      {!isLoading && columns.length > 0 && allStaff.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 'max-content', width: '100%' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {/* Sticky name column header */}
                  <th style={{
                    position: 'sticky', left: 0, zIndex: 10,
                    background: '#f8fafc', padding: '12px 16px',
                    textAlign: 'left', fontSize: 12, fontWeight: 600,
                    color: '#64748b', borderBottom: '1px solid #e2e8f0',
                    minWidth: 180, whiteSpace: 'nowrap',
                  }}>
                    Staff Member
                  </th>
                  {/* Column headers */}
                  {columns.map(col => (
                    <th key={col.id} style={{
                      padding: '8px 8px 8px',
                      textAlign: 'center', fontSize: 11, fontWeight: 600,
                      color: '#475569', borderBottom: '1px solid #e2e8f0',
                      minWidth: 80, maxWidth: 80,
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{
                          wordBreak: 'break-word', lineHeight: 1.3,
                          maxWidth: 70, display: 'block',
                        }}>
                          {col.title}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Remove "${col.title}" column for all staff?`)) {
                                deleteColumnMutation.mutate(col.id);
                              }
                            }}
                            style={{
                              width: 16, height: 16, borderRadius: '50%',
                              background: '#fee2e2', border: 'none',
                              cursor: 'pointer', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              opacity: 0.6, transition: 'opacity 0.1s',
                            }}
                            title={`Remove ${col.title}`}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.6'}
                          >
                            <X style={{ width: 9, height: 9, color: '#dc2626' }} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                  {/* Summary column */}
                  <th style={{
                    padding: '12px 16px', textAlign: 'center',
                    fontSize: 12, fontWeight: 600, color: '#64748b',
                    borderBottom: '1px solid #e2e8f0', minWidth: 90,
                  }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {allStaff.map((staff, idx) => {
                  const name = staff.staff_full_name || staff.full_name || staff.email;
                  const summary = staffSummary(staff.id);
                  return (
                    <tr
                      key={staff.id}
                      style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                    >
                      {/* Sticky staff name */}
                      <td style={{
                        position: 'sticky', left: 0, zIndex: 5,
                        background: idx % 2 === 0 ? '#fff' : '#fafafa',
                        padding: '10px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        minWidth: 180,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: `hsl(${(name.charCodeAt(0) * 47) % 360}, 55%, 60%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                          }}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                              {name}
                            </p>
                            {staff.job_title && (
                              <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
                                {staff.job_title.replace(/_/g, ' ')}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cells */}
                      {columns.map(col => (
                        <td key={col.id} style={{
                          padding: '8px 8px',
                          borderBottom: '1px solid #f1f5f9',
                          textAlign: 'center',
                        }}>
                          <MatrixCell
                            entry={entryMap[`${staff.id}:${col.id}`]}
                            column={col}
                            staff={staff}
                            isAdmin={isAdmin}
                            onClick={openEdit}
                          />
                        </td>
                      ))}

                      {/* Summary badges */}
                      <td style={{
                        padding: '8px 16px', borderBottom: '1px solid #f1f5f9',
                        textAlign: 'center',
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                          {summary.expired > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#dc2626', background: '#fee2e2', borderRadius: 4, padding: '1px 5px' }}>
                              {summary.expired} expired
                            </span>
                          )}
                          {summary.expiring > 0 && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#a16207', background: '#fef9c3', borderRadius: 4, padding: '1px 5px' }}>
                              {summary.expiring} soon
                            </span>
                          )}
                          {summary.empty > 0 && (
                            <span style={{ fontSize: 10, color: '#94a3b8', background: '#f1f5f9', borderRadius: 4, padding: '1px 5px' }}>
                              {summary.empty} missing
                            </span>
                          )}
                          {summary.expired === 0 && summary.expiring === 0 && summary.empty === 0 && (
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#15803d', background: '#dcfce7', borderRadius: 4, padding: '1px 5px' }}>
                              ✓ All set
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add Column Dialog ─────────────────────────────────────────────── */}
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Column — {activeType.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">
              This column will be added for <strong>all {allStaff.length} staff members</strong>. Cells start empty (grey) until filled.
            </p>
            <div>
              <Label>Column Title *</Label>
              <Input
                className="mt-1"
                value={newColumnTitle}
                onChange={e => setNewColumnTitle(e.target.value)}
                placeholder={
                  matrixType === 'onboarding' ? 'e.g. DBS Certificate, Right to Work...' :
                  matrixType === 'training' ? 'e.g. Manual Handling, First Aid...' :
                  'e.g. Annual Appraisal, Supervision...'
                }
                onKeyDown={e => e.key === 'Enter' && newColumnTitle.trim() && addColumnMutation.mutate(newColumnTitle)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddColumn(false)}>Cancel</Button>
            <Button
              onClick={() => addColumnMutation.mutate(newColumnTitle)}
              disabled={!newColumnTitle.trim() || addColumnMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {addColumnMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              <span className="ml-1">Add Column</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Entry Edit Dialog ─────────────────────────────────────────────── */}
      {editDialog && (
        <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base leading-snug">
                {editDialog.column.title}
                <span className="block text-sm font-normal text-slate-500 mt-0.5">
                  {editDialog.staff.staff_full_name || editDialog.staff.full_name || editDialog.staff.email}
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">

              {/* Compliance yearly note */}
              {editDialog.column.matrix_type === 'compliance' && (
                <div className="text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
                  📅 Compliance items renew every January — expiry defaults to 31 Dec of the current year.
                </div>
              )}

              {/* Date & Expiry */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Date Obtained</Label>
                  <Input
                    type="date"
                    className="mt-1 text-sm"
                    value={form.record_date || ''}
                    onChange={e => setForm(f => ({ ...f, record_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Expiry Date</Label>
                  <Input
                    type="date"
                    className="mt-1 text-sm"
                    value={form.expiry_date || ''}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Certificate / Registration Number */}
              <div>
                <Label className="text-xs">Certificate / Registration Number</Label>
                <Input
                  className="mt-1 text-sm"
                  value={form.certificate_number || ''}
                  onChange={e => setForm(f => ({ ...f, certificate_number: e.target.value }))}
                  placeholder="e.g. DBS-2024-XXXXX"
                />
              </div>

              {/* Document upload */}
              <div>
                <Label className="text-xs">Document / Certificate Upload</Label>
                <div className="mt-1 space-y-2">
                  {form.document_url ? (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-xs text-green-700 flex-1 truncate">{form.document_name || 'Document uploaded'}</span>
                      <a href={form.document_url} target="_blank" rel="noopener noreferrer" className="text-teal-600">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => setForm(f => ({ ...f, document_url: '', document_name: '' }))}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 text-sm hover:border-teal-400 hover:text-teal-600 transition-colors"
                    >
                      {uploading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                        : <><Upload className="w-4 h-4" /> Upload document or certificate</>
                      }
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea
                  className="mt-1 text-sm resize-none"
                  rows={2}
                  value={form.notes || ''}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                />
              </div>

              {/* Status preview */}
              {(() => {
                const preview = getStatus({ expiry_date: form.expiry_date, record_date: form.record_date }, editDialog?.column?.matrix_type);
                const { bg, border, dot, label } = STATUS[form.expiry_date || form.record_date ? preview : 'valid'];
                if (!form.expiry_date && !form.record_date) return null;
                return (
                  <div style={{ padding: '8px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 8, fontSize: 12, color: dot, fontWeight: 600 }}>
                    Status preview: {label}
                    {form.expiry_date && ` · Expires ${format(parseISO(form.expiry_date), 'dd MMM yyyy')}`}
                  </div>
                );
              })()}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {editDialog.entry && (
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 sm:mr-auto"
                  onClick={() => deleteEntryMutation.mutate(editDialog.entry.id)}
                  disabled={deleteEntryMutation.isPending}
                >
                  {deleteEntryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span className="ml-1">Remove</span>
                </Button>
              )}
              <Button variant="outline" onClick={() => setEditDialog(null)}>Cancel</Button>
              <Button
                onClick={handleSave}
                disabled={saveEntryMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saveEntryMutation.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  : null
                }
                Save Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

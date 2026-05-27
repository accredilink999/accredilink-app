import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Calendar, Pencil, Check, X, Briefcase } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';

// ── Inline text / email / tel / number field ──────────────────────────────────
function EditableField({ label, value, field, icon: Icon, staffId, isAdmin, placeholder = 'Not provided', type = 'text' }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setEditValue(value || '');
  }, [value, editing]);

  const updateMutation = useMutation({
    mutationFn: (newValue) => base44.entities.User.update(staffId, { [field]: newValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', staffId] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
      toast.success(`${label} updated`);
      setEditing(false);
    },
    onError: (err) => {
      toast.error(`Failed to update ${label}: ${err.message || 'Unknown error'}`);
    },
  });

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed === (value || '')) { setEditing(false); return; }
    updateMutation.mutate(trimmed || null);
  };

  const handleCancel = () => { setEditValue(value || ''); setEditing(false); };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />}
        <span className="text-slate-600 flex-shrink-0">{label}:</span>
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={updateMutation.isPending}
          className="flex-1 min-w-0 px-2 py-0.5 text-sm border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          placeholder={placeholder}
        />
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleSave} disabled={updateMutation.isPending} className="text-teal-600 hover:text-teal-700 flex-shrink-0" title="Save">
          <Check className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleCancel} className="text-slate-400 hover:text-slate-600 flex-shrink-0" title="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      {Icon && <Icon className="w-4 h-4 text-slate-400" />}
      <span className="text-slate-600">{label}:</span>
      <span className="text-slate-900 flex-1">{value || placeholder}</span>
      {isAdmin && (
        <button type="button" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-teal-600 flex-shrink-0" title={`Edit ${label.toLowerCase()}`}>
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Right-aligned row field (label left, value right) ────────────────────────
function EditableRowField({ label, value, field, staffId, isAdmin, placeholder = 'Not provided', type = 'text', suffix = '' }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  useEffect(() => {
    if (!editing) setEditValue(value ?? '');
  }, [value, editing]);

  const updateMutation = useMutation({
    mutationFn: (newValue) => base44.entities.User.update(staffId, { [field]: newValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', staffId] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
      toast.success(`${label} updated`);
      setEditing(false);
    },
    onError: (err) => {
      toast.error(`Failed to update ${label}: ${err.message || 'Unknown error'}`);
    },
  });

  const handleSave = () => {
    const val = type === 'number' ? (editValue === '' ? null : parseFloat(editValue)) : (editValue.trim() || null);
    if (val === value) { setEditing(false); return; }
    updateMutation.mutate(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { setEditValue(value ?? ''); setEditing(false); }
  };

  if (editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 flex-shrink-0">{label}:</span>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type={type}
            step={type === 'number' ? '1' : undefined}
            min={type === 'number' ? '0' : undefined}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={updateMutation.isPending}
            className="w-32 px-2 py-0.5 text-sm text-right border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            placeholder={placeholder}
          />
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleSave} disabled={updateMutation.isPending} className="text-teal-600 hover:text-teal-700 flex-shrink-0"><Check className="w-4 h-4" /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setEditValue(value ?? ''); setEditing(false); }} className="text-slate-400 hover:text-slate-600 flex-shrink-0"><X className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <span className="text-slate-600">{label}:</span>
      <div className="flex items-center gap-1">
        <span className={value != null ? 'text-slate-900' : 'text-slate-400'}>
          {value != null ? `${value}${suffix}` : placeholder}
        </span>
        {isAdmin && (
          <button type="button" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-teal-600 flex-shrink-0" title={`Edit ${label.toLowerCase()}`}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Date field (stored as YYYY-MM-DD string) ──────────────────────────────────
function EditableDateField({ label, value, field, staffId, isAdmin, placeholder = 'Not set' }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  useEffect(() => {
    if (!editing) setEditValue(value || '');
  }, [value, editing]);

  const updateMutation = useMutation({
    mutationFn: (newValue) => base44.entities.User.update(staffId, { [field]: newValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', staffId] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
      toast.success(`${label} updated`);
      setEditing(false);
    },
    onError: (err) => toast.error(`Failed to update ${label}: ${err.message}`),
  });

  const handleSave = () => {
    if (editValue === (value || '')) { setEditing(false); return; }
    updateMutation.mutate(editValue || null);
  };

  const displayValue = value
    ? (() => { try { return format(parseISO(value), 'dd MMM yyyy'); } catch { return value; } })()
    : placeholder;

  if (editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 flex-shrink-0">{label}:</span>
        <div className="flex items-center gap-1">
          <input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            disabled={updateMutation.isPending}
            className="px-2 py-0.5 text-sm border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          />
          <button type="button" onClick={handleSave} disabled={updateMutation.isPending} className="text-teal-600 hover:text-teal-700"><Check className="w-4 h-4" /></button>
          <button type="button" onClick={() => { setEditValue(value || ''); setEditing(false); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between group">
      <span className="text-slate-600">{label}:</span>
      <div className="flex items-center gap-1">
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>{displayValue}</span>
        {isAdmin && (
          <button type="button" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-teal-600 flex-shrink-0" title={`Edit ${label.toLowerCase()}`}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function StaffBasicInfo({ staff, isAdmin, isOwnProfile }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <EditableField
            label="Full Name"
            value={staff?.full_name}
            field="full_name"
            staffId={staff?.id}
            isAdmin={isAdmin}
            placeholder="Not provided"
          />
          <EditableField
            label="Job Title"
            value={staff?.job_title}
            field="job_title"
            icon={Briefcase}
            staffId={staff?.id}
            isAdmin={isAdmin}
            placeholder="Not provided"
          />
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <EditableField
            label="Email"
            value={staff?.email}
            field="email"
            icon={Mail}
            staffId={staff?.id}
            isAdmin={isAdmin}
            type="email"
            placeholder="Not provided"
          />
          <EditableField
            label="Phone"
            value={staff?.phone}
            field="phone"
            icon={Phone}
            staffId={staff?.id}
            isAdmin={isAdmin}
            type="tel"
            placeholder="Not provided"
          />
          <EditableField
            label="Address"
            value={staff?.address}
            field="address"
            icon={MapPin}
            staffId={staff?.id}
            isAdmin={isAdmin}
            placeholder="Not provided"
          />
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <EditableRowField
            label="Name"
            value={staff?.emergency_contact_name}
            field="emergency_contact_name"
            staffId={staff?.id}
            isAdmin={isAdmin}
            placeholder="Not provided"
          />
          <EditableRowField
            label="Phone"
            value={staff?.emergency_contact_phone}
            field="emergency_contact_phone"
            staffId={staff?.id}
            isAdmin={isAdmin}
            type="tel"
            placeholder="Not provided"
          />
        </CardContent>
      </Card>

      {/* Employment Dates — editable for admin */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment Dates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <EditableDateField
            label="Start Date"
            value={staff?.start_date}
            field="start_date"
            staffId={staff?.id}
            isAdmin={isAdmin}
          />
          <EditableDateField
            label="End Date"
            value={staff?.end_date}
            field="end_date"
            staffId={staff?.id}
            isAdmin={isAdmin}
          />
        </CardContent>
      </Card>

      {/* Leave Balances — allowance editable for admin */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leave Balances</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <EditableRowField
            label="Holiday Allowance"
            value={staff?.holiday_allowance_days ?? null}
            field="holiday_allowance_days"
            staffId={staff?.id}
            isAdmin={isAdmin}
            type="number"
            suffix=" days"
            placeholder="Not set"
          />
          <div className="flex justify-between">
            <span className="text-slate-600">Used:</span>
            <span className="text-slate-900">{staff?.holiday_used_days || 0} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Remaining:</span>
            <span className="font-semibold text-teal-600">
              {(staff?.holiday_allowance_days || 0) - (staff?.holiday_used_days || 0)} days
            </span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { TAX_CODES, NI_CATEGORIES } from '@/config/ukPayroll';

function EditableRowField({ label, value, field, staffId, placeholder = 'Not set', type = 'text', prefix = '', suffix = '' }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }
  }, [editing]);

  useEffect(() => { if (!editing) setEditValue(value ?? ''); }, [value, editing]);

  const updateMutation = useMutation({
    mutationFn: (newValue) => base44.entities.User.update(staffId, { [field]: newValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', staffId] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`${label} updated`);
      setEditing(false);
    },
    onError: (err) => toast.error(`Failed to update: ${err.message}`),
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
            step={type === 'number' ? '0.01' : undefined}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={updateMutation.isPending}
            className="w-32 px-2 py-0.5 text-sm text-right border border-teal-300 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            placeholder={placeholder}
          />
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleSave} className="text-teal-600 hover:text-teal-700"><Check className="w-4 h-4" /></button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { setEditValue(value ?? ''); setEditing(false); }} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
      </div>
    );
  }

  const displayVal = value != null ? `${prefix}${value}${suffix}` : placeholder;

  return (
    <div className="flex items-center justify-between group">
      <span className="text-slate-600">{label}:</span>
      <div className="flex items-center gap-1">
        <span className={value != null ? 'font-semibold text-slate-900' : 'text-slate-400'}>{displayVal}</span>
        <button type="button" onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-teal-600"><Pencil className="w-3.5 h-3.5" /></button>
      </div>
    </div>
  );
}

export default function StaffEmployment({ staff, isAdmin }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ field, value }) => base44.entities.User.update(staff.id, { [field]: value }),
    onSuccess: (_, { label }) => {
      queryClient.invalidateQueries({ queryKey: ['staff', staff.id] });
      queryClient.invalidateQueries({ queryKey: ['allStaff'] });
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`${label || 'Field'} updated`);
    },
    onError: (err) => toast.error(`Update failed: ${err.message}`),
  });

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">You don't have permission to view employment details</p>
      </Card>
    );
  }

  const payType = staff?.pay_type || (staff?.salary ? 'salaried' : 'hourly');

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Employment Type:</span>
            <Select
              value={staff?.employment_type || 'full_time'}
              onValueChange={(v) => updateMutation.mutate({ field: 'employment_type', value: v, label: 'Employment type' })}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full Time</SelectItem>
                <SelectItem value="part_time">Part Time</SelectItem>
                <SelectItem value="zero_hours">Zero Hours</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="agency">Agency</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Status:</span>
            <Badge className={staff?.employment_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}>
              {staff?.employment_status?.replace(/_/g, ' ')}
            </Badge>
          </div>
          <EditableRowField label="NI Number" value={staff?.ni_number} field="ni_number" staffId={staff?.id} placeholder="Not provided" />
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Tax Code:</span>
            <Select
              value={staff?.tax_code || '1257L'}
              onValueChange={(v) => updateMutation.mutate({ field: 'tax_code', value: v, label: 'Tax code' })}
            >
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAX_CODES.map(tc => (
                  <SelectItem key={tc.value} value={tc.value} className="text-xs">{tc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600">NI Category:</span>
            <Select
              value={staff?.ni_category || 'A'}
              onValueChange={(v) => updateMutation.mutate({ field: 'ni_category', value: v, label: 'NI category' })}
            >
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NI_CATEGORIES.map(nc => (
                  <SelectItem key={nc.value} value={nc.value} className="text-xs">{nc.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compensation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-600">Pay Type:</span>
            <Select
              value={payType}
              onValueChange={(v) => updateMutation.mutate({ field: 'pay_type', value: v, label: 'Pay type' })}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly Rate</SelectItem>
                <SelectItem value="salaried">Annual Salary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <EditableRowField label="Hourly Rate" value={staff?.hourly_rate} field="hourly_rate" staffId={staff?.id} type="number" prefix="£" suffix="/hour" placeholder="Not set" />
          <EditableRowField label="Annual Salary" value={staff?.salary} field="salary" staffId={staff?.id} type="number" prefix="£" placeholder="Not set" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">View Payroll:</span>
            <Badge variant={staff?.permissions?.can_view_payroll ? 'default' : 'outline'}>
              {staff?.permissions?.can_view_payroll ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Manage Staff:</span>
            <Badge variant={staff?.permissions?.can_manage_staff ? 'default' : 'outline'}>
              {staff?.permissions?.can_manage_staff ? 'Yes' : 'No'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Approve Leave:</span>
            <Badge variant={staff?.permissions?.can_approve_leave ? 'default' : 'outline'}>
              {staff?.permissions?.can_approve_leave ? 'Yes' : 'No'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Sick Days Taken:</span>
            <span className="text-slate-900">{staff?.sick_days_taken || 0} days</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

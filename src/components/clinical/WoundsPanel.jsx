import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Plus, ArrowLeft, Edit, CheckCircle2, Clock, AlertTriangle, Calendar
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';

// ─── Configuration ───────────────────────────────────────────────────────────

const WOUND_TYPES = {
  pressure_sore: 'Pressure Sore',
  surgical: 'Surgical',
  skin_tear: 'Skin Tear',
  leg_ulcer: 'Leg Ulcer',
  burn: 'Burn',
  other: 'Other',
};

const BODY_LOCATIONS = {
  head: 'Head',
  left_shoulder: 'Left Shoulder',
  right_shoulder: 'Right Shoulder',
  left_arm: 'Left Arm',
  right_arm: 'Right Arm',
  left_hand: 'Left Hand',
  right_hand: 'Right Hand',
  chest: 'Chest',
  abdomen: 'Abdomen',
  upper_back: 'Upper Back',
  lower_back: 'Lower Back',
  sacrum: 'Sacrum',
  left_hip: 'Left Hip',
  right_hip: 'Right Hip',
  left_thigh: 'Left Thigh',
  right_thigh: 'Right Thigh',
  left_knee: 'Left Knee',
  right_knee: 'Right Knee',
  left_shin: 'Left Shin',
  right_shin: 'Right Shin',
  left_foot: 'Left Foot',
  right_foot: 'Right Foot',
  left_heel: 'Left Heel',
  right_heel: 'Right Heel',
};

const GRADES = {
  grade_1: 'Grade 1 - Non-blanching redness',
  grade_2: 'Grade 2 - Partial thickness',
  grade_3: 'Grade 3 - Full thickness',
  grade_4: 'Grade 4 - Full thickness with bone/tendon',
};

const WOUND_BED_OPTIONS = {
  granulating: 'Granulating',
  sloughy: 'Sloughy',
  necrotic: 'Necrotic',
  epithelialising: 'Epithelialising',
  mixed: 'Mixed',
};

const EXUDATE_OPTIONS = {
  none: 'None',
  low: 'Low',
  moderate: 'Moderate',
  heavy: 'Heavy',
};

const SURROUNDING_SKIN_OPTIONS = {
  healthy: 'Healthy',
  red: 'Red',
  macerated: 'Macerated',
  dry: 'Dry',
};

const STATUS_OPTIONS = {
  active: 'Active',
  healing: 'Healing',
  healed: 'Healed',
  referred: 'Referred',
};

const STATUS_COLORS = {
  active: 'bg-red-100 text-red-700 border-red-200',
  healing: 'bg-amber-100 text-amber-700 border-amber-200',
  healed: 'bg-green-100 text-green-700 border-green-200',
  referred: 'bg-blue-100 text-blue-700 border-blue-200',
};

const TYPE_COLORS = {
  pressure_sore: 'bg-purple-100 text-purple-700',
  surgical: 'bg-blue-100 text-blue-700',
  skin_tear: 'bg-rose-100 text-rose-700',
  leg_ulcer: 'bg-amber-100 text-amber-700',
  burn: 'bg-orange-100 text-orange-700',
  other: 'bg-slate-100 text-slate-700',
};

const EMPTY_FORM = {
  wound_type: 'pressure_sore',
  location_body: 'sacrum',
  grade: '',
  length_cm: '',
  width_cm: '',
  depth_cm: '',
  wound_bed: 'granulating',
  exudate: 'none',
  surrounding_skin: 'healthy',
  pain_level: 0,
  treatment: '',
  dressing_type: '',
  next_dressing_date: '',
  status: 'active',
  notes: '',
};

// ─── Pain Bar Component ──────────────────────────────────────────────────────

function PainBar({ level, compact = false }) {
  const segments = 10;
  const getColor = (i) => {
    if (i >= level) return 'bg-slate-200';
    if (level <= 3) return 'bg-green-400';
    if (level <= 6) return 'bg-amber-400';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={`${compact ? 'h-2 w-2' : 'h-3 w-3'} rounded-sm ${getColor(i)} transition-colors`}
        />
      ))}
      <span className={`ml-1 font-semibold ${compact ? 'text-[10px]' : 'text-xs'} ${
        level <= 3 ? 'text-green-600' : level <= 6 ? 'text-amber-600' : 'text-red-600'
      }`}>
        {level}/10
      </span>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function WoundsPanel({ serviceUser }) {
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedWound, setSelectedWound] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: wounds = [], isLoading } = useQuery({
    queryKey: ['woundRecords', serviceUser?.id],
    queryFn: () => base44.entities.WoundRecord.filter(
      { service_user_id: serviceUser.id },
      '-recorded_at',
      500
    ),
    enabled: !!serviceUser?.id,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // ── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.WoundRecord.create({
      ...data,
      service_user_id: serviceUser.id,
      staff_id: user?.id,
      staff_name: user?.full_name,
      recorded_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woundRecords', serviceUser.id] });
      toast.success('Wound record created');
      setShowNewForm(false);
      resetForm();
    },
    onError: (err) => {
      toast.error('Failed to save wound record: ' + (err.message || 'Unknown error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WoundRecord.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woundRecords', serviceUser.id] });
      toast.success('Wound record updated');
      setShowUpdateForm(false);
      setSelectedWound(null);
      resetForm();
    },
    onError: (err) => {
      toast.error('Failed to update wound: ' + (err.message || 'Unknown error'));
    },
  });

  const healMutation = useMutation({
    mutationFn: (id) => base44.entities.WoundRecord.update(id, {
      status: 'healed',
      healed_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['woundRecords', serviceUser.id] });
      toast.success('Wound marked as healed');
      setShowDetail(false);
      setSelectedWound(null);
    },
    onError: (err) => {
      toast.error('Failed to update wound: ' + (err.message || 'Unknown error'));
    },
  });

  // ── Derived data ─────────────────────────────────────────────────────────

  const activeWounds = useMemo(
    () => wounds.filter(w => w.status !== 'healed'),
    [wounds]
  );

  const healedWounds = useMemo(
    () => wounds.filter(w => w.status === 'healed'),
    [wounds]
  );

  // ── Helpers ──────────────────────────────────────────────────────────────

  function resetForm() {
    setFormData({ ...EMPTY_FORM });
  }

  function openUpdateForm(wound) {
    setSelectedWound(wound);
    setFormData({
      wound_type: wound.wound_type || 'other',
      location_body: wound.location_body || 'sacrum',
      grade: wound.grade || '',
      length_cm: wound.length_cm || '',
      width_cm: wound.width_cm || '',
      depth_cm: wound.depth_cm || '',
      wound_bed: wound.wound_bed || 'granulating',
      exudate: wound.exudate || 'none',
      surrounding_skin: wound.surrounding_skin || 'healthy',
      pain_level: wound.pain_level || 0,
      treatment: wound.treatment || '',
      dressing_type: wound.dressing_type || '',
      next_dressing_date: wound.next_dressing_date || '',
      status: wound.status || 'active',
      notes: wound.notes || '',
    });
    setShowUpdateForm(true);
  }

  function handleCreate(e) {
    e.preventDefault();
    const payload = { ...formData };
    payload.length_cm = payload.length_cm ? parseFloat(payload.length_cm) : null;
    payload.width_cm = payload.width_cm ? parseFloat(payload.width_cm) : null;
    payload.depth_cm = payload.depth_cm ? parseFloat(payload.depth_cm) : null;
    payload.pain_level = parseInt(payload.pain_level, 10) || 0;
    if (!payload.grade) delete payload.grade;
    if (!payload.next_dressing_date) delete payload.next_dressing_date;
    createMutation.mutate(payload);
  }

  function handleUpdate(e) {
    e.preventDefault();
    if (!selectedWound) return;
    const payload = { ...formData };
    payload.length_cm = payload.length_cm ? parseFloat(payload.length_cm) : null;
    payload.width_cm = payload.width_cm ? parseFloat(payload.width_cm) : null;
    payload.depth_cm = payload.depth_cm ? parseFloat(payload.depth_cm) : null;
    payload.pain_level = parseInt(payload.pain_level, 10) || 0;
    if (!payload.grade) delete payload.grade;
    if (!payload.next_dressing_date) delete payload.next_dressing_date;
    payload.staff_id = user?.id;
    payload.staff_name = user?.full_name;
    payload.recorded_at = new Date().toISOString();
    updateMutation.mutate({ id: selectedWound.id, data: payload });
  }

  function setField(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function isDressingOverdue(wound) {
    if (!wound.next_dressing_date) return false;
    try {
      return isPast(parseISO(wound.next_dressing_date));
    } catch {
      return false;
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        Loading wound records...
      </div>
    );
  }

  // ── Detail view ──────────────────────────────────────────────────────────

  if (showDetail && selectedWound) {
    const w = selectedWound;
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowDetail(false); setSelectedWound(null); }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h3 className="text-lg font-semibold text-slate-800">Wound Detail</h3>
        </div>

        <Card className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={TYPE_COLORS[w.wound_type] || TYPE_COLORS.other}>
              {WOUND_TYPES[w.wound_type] || w.wound_type}
            </Badge>
            <Badge variant="outline" className={STATUS_COLORS[w.status] || ''}>
              {STATUS_OPTIONS[w.status] || w.status}
            </Badge>
            {w.grade && (
              <Badge variant="outline" className="text-[10px]">
                {GRADES[w.grade] || w.grade}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500 text-xs">Location</span>
              <p className="font-medium">{BODY_LOCATIONS[w.location_body] || w.location_body}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Size (L x W)</span>
              <p className="font-medium">
                {w.length_cm && w.width_cm
                  ? `${w.length_cm} x ${w.width_cm} cm`
                  : '\u2014'}
              </p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Depth</span>
              <p className="font-medium">{w.depth_cm ? `${w.depth_cm} cm` : '\u2014'}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Wound Bed</span>
              <p className="font-medium">{WOUND_BED_OPTIONS[w.wound_bed] || w.wound_bed || '\u2014'}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Exudate</span>
              <p className="font-medium">{EXUDATE_OPTIONS[w.exudate] || w.exudate || '\u2014'}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Surrounding Skin</span>
              <p className="font-medium">{SURROUNDING_SKIN_OPTIONS[w.surrounding_skin] || w.surrounding_skin || '\u2014'}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Dressing Type</span>
              <p className="font-medium">{w.dressing_type || '\u2014'}</p>
            </div>
            <div>
              <span className="text-slate-500 text-xs">Next Dressing</span>
              <p className={`font-medium ${isDressingOverdue(w) ? 'text-red-600' : ''}`}>
                {w.next_dressing_date
                  ? format(parseISO(w.next_dressing_date), 'dd MMM yyyy')
                  : '\u2014'}
                {isDressingOverdue(w) && ' (OVERDUE)'}
              </p>
            </div>
          </div>

          <div>
            <span className="text-slate-500 text-xs">Pain Level</span>
            <PainBar level={w.pain_level || 0} />
          </div>

          {w.treatment && (
            <div>
              <span className="text-slate-500 text-xs">Treatment</span>
              <p className="text-sm">{w.treatment}</p>
            </div>
          )}

          {w.notes && (
            <div>
              <span className="text-slate-500 text-xs">Notes</span>
              <p className="text-sm">{w.notes}</p>
            </div>
          )}

          <div className="text-[10px] text-slate-400">
            Recorded: {w.recorded_at ? format(new Date(w.recorded_at), 'dd MMM yyyy HH:mm') : '\u2014'}
            {w.staff_name && ` by ${w.staff_name}`}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
            <Button size="sm" variant="outline" onClick={() => openUpdateForm(w)}>
              <Edit className="w-3 h-3 mr-1" /> Reassess
            </Button>
            {w.status !== 'healed' && (
              <Button
                size="sm"
                variant="outline"
                className="text-green-700 border-green-300 hover:bg-green-50"
                onClick={() => healMutation.mutate(w.id)}
                disabled={healMutation.isPending}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Healed
              </Button>
            )}
          </div>
        </Card>

        {/* Timeline of all records for this wound location + type */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-slate-700">Assessment History</h4>
          <div className="space-y-2">
            {wounds
              .filter(r => r.wound_type === w.wound_type && r.location_body === w.location_body)
              .map((record) => (
                <Card key={record.id} className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">
                      {record.recorded_at
                        ? format(new Date(record.recorded_at), 'dd MMM yyyy HH:mm')
                        : format(new Date(record.created_at), 'dd MMM yyyy HH:mm')}
                    </span>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[record.status] || ''}`}>
                      {STATUS_OPTIONS[record.status] || record.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    {record.length_cm && record.width_cm && (
                      <p>Size: {record.length_cm} x {record.width_cm} cm</p>
                    )}
                    {record.wound_bed && (
                      <p>Wound bed: {WOUND_BED_OPTIONS[record.wound_bed] || record.wound_bed}</p>
                    )}
                    {record.pain_level != null && (
                      <div className="flex items-center gap-1">
                        <span>Pain:</span>
                        <PainBar level={record.pain_level} compact />
                      </div>
                    )}
                    {record.treatment && <p>Treatment: {record.treatment}</p>}
                    {record.notes && <p className="italic text-slate-400">{record.notes}</p>}
                  </div>
                  {record.staff_name && (
                    <p className="text-[10px] text-slate-400 mt-1">By {record.staff_name}</p>
                  )}
                </Card>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Main list view ───────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Wound Management</h3>
        <Button size="sm" onClick={() => { resetForm(); setShowNewForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> New Wound
        </Button>
      </div>

      {/* Active wounds */}
      {activeWounds.length === 0 && healedWounds.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          No wound records for this service user
        </div>
      )}

      {activeWounds.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700">
            Active Wounds ({activeWounds.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeWounds.map((w) => {
              const overdue = isDressingOverdue(w);
              return (
                <Card
                  key={w.id}
                  className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                    overdue ? 'border-red-300 bg-red-50/50' : ''
                  }`}
                  onClick={() => { setSelectedWound(w); setShowDetail(true); }}
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <Badge className={`text-[10px] ${TYPE_COLORS[w.wound_type] || TYPE_COLORS.other}`}>
                      {WOUND_TYPES[w.wound_type] || w.wound_type}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[w.status] || ''}`}>
                      {STATUS_OPTIONS[w.status] || w.status}
                    </Badge>
                    {w.grade && (
                      <Badge variant="outline" className="text-[10px]">
                        {w.grade.replace('_', ' ').toUpperCase()}
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {BODY_LOCATIONS[w.location_body] || w.location_body}
                  </p>

                  {w.length_cm && w.width_cm && (
                    <p className="text-xs text-slate-500">
                      Size: {w.length_cm} x {w.width_cm} cm
                    </p>
                  )}

                  <div className="mt-2">
                    <PainBar level={w.pain_level || 0} compact />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      Last: {w.recorded_at
                        ? format(new Date(w.recorded_at), 'dd MMM yyyy')
                        : '\u2014'}
                    </span>
                    {w.next_dressing_date && (
                      <span className={`flex items-center gap-0.5 ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        Dressing: {format(parseISO(w.next_dressing_date), 'dd MMM')}
                        {overdue && (
                          <>
                            {' '}
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            OVERDUE
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Healed wounds */}
      {healedWounds.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-500">
            Healed Wounds ({healedWounds.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {healedWounds.map((w) => (
              <Card
                key={w.id}
                className="p-3 cursor-pointer hover:shadow-md transition-shadow opacity-70"
                onClick={() => { setSelectedWound(w); setShowDetail(true); }}
              >
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <Badge className={`text-[10px] ${TYPE_COLORS[w.wound_type] || TYPE_COLORS.other}`}>
                    {WOUND_TYPES[w.wound_type] || w.wound_type}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS.healed}`}>
                    Healed
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  {BODY_LOCATIONS[w.location_body] || w.location_body}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Healed: {w.healed_at ? format(new Date(w.healed_at), 'dd MMM yyyy') : '\u2014'}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── New wound dialog ─────────────────────────────────────────────── */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record New Wound</DialogTitle>
          </DialogHeader>
          <WoundForm
            formData={formData}
            setField={setField}
            onSubmit={handleCreate}
            onCancel={() => { setShowNewForm(false); resetForm(); }}
            isPending={createMutation.isPending}
            submitLabel="Save"
          />
        </DialogContent>
      </Dialog>

      {/* ── Update wound dialog ──────────────────────────────────────────── */}
      <Dialog open={showUpdateForm} onOpenChange={(open) => {
        setShowUpdateForm(open);
        if (!open) { setSelectedWound(null); resetForm(); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reassess Wound</DialogTitle>
          </DialogHeader>
          <WoundForm
            formData={formData}
            setField={setField}
            onSubmit={handleUpdate}
            onCancel={() => { setShowUpdateForm(false); setSelectedWound(null); resetForm(); }}
            isPending={updateMutation.isPending}
            submitLabel="Update"
            isUpdate
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Shared wound form component ─────────────────────────────────────────────

function WoundForm({ formData, setField, onSubmit, onCancel, isPending, submitLabel, isUpdate = false }) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Section: Wound Details */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">
          Wound Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Wound Type</Label>
            <Select value={formData.wound_type} onValueChange={(v) => setField('wound_type', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(WOUND_TYPES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Body Location</Label>
            <Select value={formData.location_body} onValueChange={(v) => setField('location_body', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BODY_LOCATIONS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {formData.wound_type === 'pressure_sore' && (
          <div>
            <Label className="text-xs">Grade</Label>
            <Select value={formData.grade} onValueChange={(v) => setField('grade', v)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select grade" /></SelectTrigger>
              <SelectContent>
                {Object.entries(GRADES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Section: Measurements */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">
          Measurements
        </h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">Length (cm)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={formData.length_cm}
              onChange={(e) => setField('length_cm', e.target.value)}
              className="mt-1"
              placeholder="0.0"
            />
          </div>
          <div>
            <Label className="text-xs">Width (cm)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={formData.width_cm}
              onChange={(e) => setField('width_cm', e.target.value)}
              className="mt-1"
              placeholder="0.0"
            />
          </div>
          <div>
            <Label className="text-xs">Depth (cm)</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={formData.depth_cm}
              onChange={(e) => setField('depth_cm', e.target.value)}
              className="mt-1"
              placeholder="0.0"
            />
          </div>
        </div>
      </div>

      {/* Section: Wound Assessment */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">
          Wound Assessment
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Wound Bed</Label>
            <Select value={formData.wound_bed} onValueChange={(v) => setField('wound_bed', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(WOUND_BED_OPTIONS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Exudate</Label>
            <Select value={formData.exudate} onValueChange={(v) => setField('exudate', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EXUDATE_OPTIONS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Surrounding Skin</Label>
            <Select value={formData.surrounding_skin} onValueChange={(v) => setField('surrounding_skin', v)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SURROUNDING_SKIN_OPTIONS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pain Level Slider */}
        <div>
          <Label className="text-xs">Pain Level: {formData.pain_level}/10</Label>
          <div className="mt-2 px-1">
            <Slider
              value={[formData.pain_level]}
              onValueChange={([val]) => setField('pain_level', val)}
              min={0}
              max={10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
              <span>No pain</span>
              <span>Worst pain</span>
            </div>
          </div>
          <div className="mt-1">
            <PainBar level={formData.pain_level} />
          </div>
        </div>
      </div>

      {/* Section: Treatment */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-1">
          Treatment
        </h4>
        <div>
          <Label className="text-xs">Treatment Description</Label>
          <textarea
            rows={2}
            className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            placeholder="Describe treatment applied..."
            value={formData.treatment}
            onChange={(e) => setField('treatment', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Dressing Type</Label>
            <Input
              type="text"
              value={formData.dressing_type}
              onChange={(e) => setField('dressing_type', e.target.value)}
              className="mt-1"
              placeholder="e.g. Mepilex Border"
            />
          </div>
          <div>
            <Label className="text-xs">Next Dressing Date</Label>
            <Input
              type="date"
              value={formData.next_dressing_date}
              onChange={(e) => setField('next_dressing_date', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Status (for updates) */}
      {isUpdate && (
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={formData.status} onValueChange={(v) => setField('status', v)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_OPTIONS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
      <div>
        <Label className="text-xs">Additional Notes</Label>
        <textarea
          rows={2}
          className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          placeholder="Any additional notes..."
          value={formData.notes}
          onChange={(e) => setField('notes', e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}

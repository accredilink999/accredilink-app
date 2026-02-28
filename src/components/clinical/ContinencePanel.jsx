import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import {
  Droplets, ClipboardCheck, Toilet, Activity, CheckCircle,
  Clock, Calendar, AlertTriangle
} from 'lucide-react';

const RECORD_TYPES = [
  { value: 'pad_check', label: 'Pad Check', icon: ClipboardCheck, colour: 'bg-blue-500' },
  { value: 'toileting', label: 'Toileting', icon: Toilet, colour: 'bg-green-500' },
  { value: 'bowel', label: 'Bowel Record', icon: Activity, colour: 'bg-amber-500' },
];

const PAD_STATUS_OPTIONS = [
  { value: 'dry', label: 'Dry', style: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'damp', label: 'Damp', style: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'wet', label: 'Wet', style: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'soiled', label: 'Soiled', style: 'bg-red-100 text-red-700 border-red-200' },
];

const BOWEL_TYPE_OPTIONS = [
  { value: 'type_1', label: 'Type 1 - Hard lumps', shortLabel: 'Type 1' },
  { value: 'type_2', label: 'Type 2 - Lumpy sausage', shortLabel: 'Type 2' },
  { value: 'type_3', label: 'Type 3 - Cracked sausage', shortLabel: 'Type 3' },
  { value: 'type_4', label: 'Type 4 - Smooth snake (normal)', shortLabel: 'Type 4' },
  { value: 'type_5', label: 'Type 5 - Soft blobs', shortLabel: 'Type 5' },
  { value: 'type_6', label: 'Type 6 - Fluffy/mushy', shortLabel: 'Type 6' },
  { value: 'type_7', label: 'Type 7 - Liquid', shortLabel: 'Type 7' },
];

const OUTPUT_AMOUNT_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'large', label: 'Large' },
];

const SKIN_CONDITION_OPTIONS = [
  { value: 'healthy', label: 'Healthy', style: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'redness', label: 'Redness', style: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'broken', label: 'Broken', style: 'bg-red-100 text-red-700 border-red-200' },
];

const RECORD_TYPE_BADGE_STYLES = {
  pad_check: 'bg-blue-100 text-blue-700 border-blue-200',
  toileting: 'bg-green-100 text-green-700 border-green-200',
  bowel: 'bg-amber-100 text-amber-700 border-amber-200',
};

function formatTimeShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toISOString().split('T')[0] === now.toISOString().split('T')[0];
}

function daysAgoLabel(dateStr) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const dStr = new Date(dateStr).toISOString().split('T')[0];
  if (dStr === todayStr) return 'Today';
  const diff = Math.floor((new Date(todayStr) - new Date(dStr)) / (1000 * 60 * 60 * 24));
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

const EMPTY_PAD_FORM = {
  record_type: 'pad_check',
  pad_status: '',
  pad_changed: false,
  skin_condition: 'healthy',
  personal_care_given: false,
  notes: '',
};

const EMPTY_TOILETING_FORM = {
  record_type: 'toileting',
  output_amount: '',
  skin_condition: 'healthy',
  personal_care_given: false,
  notes: '',
};

const EMPTY_BOWEL_FORM = {
  record_type: 'bowel',
  bowel_type: '',
  output_amount: '',
  notes: '',
};

export default function ContinencePanel({ serviceUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState(null);
  const [form, setForm] = useState({});

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['continenceRecords', serviceUser?.id],
    queryFn: () => base44.entities.ContinenceRecord.filter({ service_user_id: serviceUser.id }, '-recorded_at', 500),
    enabled: !!serviceUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ContinenceRecord.create({
      ...data,
      service_user_id: serviceUser.id,
      staff_id: user?.id,
      staff_name: user?.full_name || user?.email || 'Unknown',
      recorded_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['continenceRecords', serviceUser.id] });
      toast.success('Continence record saved');
      setShowForm(false);
      setFormType(null);
      setForm({});
    },
    onError: (err) => {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    },
  });

  const openForm = (type) => {
    setFormType(type);
    if (type === 'pad_check') setForm({ ...EMPTY_PAD_FORM });
    else if (type === 'toileting') setForm({ ...EMPTY_TOILETING_FORM });
    else if (type === 'bowel') setForm({ ...EMPTY_BOWEL_FORM });
    setShowForm(true);
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formType === 'pad_check' && !form.pad_status) {
      toast.error('Please select pad status');
      return;
    }
    if (formType === 'toileting' && !form.output_amount) {
      toast.error('Please select output amount');
      return;
    }
    if (formType === 'bowel' && !form.bowel_type) {
      toast.error('Please select bowel type');
      return;
    }
    createMutation.mutate(form);
  };

  // Today's records
  const todayRecords = useMemo(() => {
    return records.filter(r => isToday(r.recorded_at));
  }, [records]);

  // Daily summary
  const dailySummary = useMemo(() => {
    const padChecks = todayRecords.filter(r => r.record_type === 'pad_check');
    const bowelRecords = todayRecords.filter(r => r.record_type === 'bowel');
    const toiletingRecords = todayRecords.filter(r => r.record_type === 'toileting');

    const padCounts = { dry: 0, damp: 0, wet: 0, soiled: 0 };
    padChecks.forEach(r => {
      if (r.pad_status && padCounts[r.pad_status] !== undefined) {
        padCounts[r.pad_status]++;
      }
    });

    const bowelTypes = bowelRecords
      .map(r => BOWEL_TYPE_OPTIONS.find(b => b.value === r.bowel_type)?.shortLabel)
      .filter(Boolean);

    return {
      padChecks: padChecks.length,
      padCounts,
      toiletingCount: toiletingRecords.length,
      bowelCount: bowelRecords.length,
      bowelTypes,
    };
  }, [todayRecords]);

  // Past 7 days history
  const historyByDate = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const pastRecords = records.filter(r => {
      const d = new Date(r.recorded_at);
      return d >= cutoff && !isToday(r.recorded_at);
    });
    const grouped = {};
    pastRecords.forEach(r => {
      const dateKey = new Date(r.recorded_at).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(r);
    });
    return Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, recs]) => ({
        date,
        label: daysAgoLabel(date),
        dateFormatted: formatDateShort(date),
        records: recs.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at)),
      }));
  }, [records]);

  const getRecordTypeConfig = (type) => RECORD_TYPES.find(t => t.value === type) || RECORD_TYPES[0];
  const getPadStatusConfig = (status) => PAD_STATUS_OPTIONS.find(s => s.value === status);
  const getSkinConfig = (condition) => SKIN_CONDITION_OPTIONS.find(s => s.value === condition);

  const getStatusLabel = (rec) => {
    if (rec.record_type === 'pad_check') {
      return getPadStatusConfig(rec.pad_status)?.label || rec.pad_status || '-';
    }
    if (rec.record_type === 'toileting') {
      return rec.output_amount ? `${rec.output_amount.charAt(0).toUpperCase() + rec.output_amount.slice(1)} output` : '-';
    }
    if (rec.record_type === 'bowel') {
      const bt = BOWEL_TYPE_OPTIONS.find(b => b.value === rec.bowel_type);
      return bt ? bt.shortLabel : rec.bowel_type || '-';
    }
    return '-';
  };

  const getStatusBadgeStyle = (rec) => {
    if (rec.record_type === 'pad_check') {
      return getPadStatusConfig(rec.pad_status)?.style || 'bg-slate-100 text-slate-600 border-slate-200';
    }
    if (rec.record_type === 'bowel') {
      // Colour code Bristol types: 1-2 amber (constipation), 3-5 green (normal), 6-7 red (loose)
      const typeNum = parseInt((rec.bowel_type || '').replace('type_', ''), 10);
      if (typeNum <= 2) return 'bg-amber-100 text-amber-700 border-amber-200';
      if (typeNum <= 5) return 'bg-green-100 text-green-700 border-green-200';
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <Droplets className="w-4 h-4" />
          Continence Chart
        </h3>
      </div>

      {/* Quick Log Buttons */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Log</p>
        <div className="grid grid-cols-3 gap-2">
          {RECORD_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => openForm(type.value)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 border-slate-200 hover:border-slate-400 bg-white active:scale-95 transition-all touch-manipulation"
              >
                <div className={`w-9 h-9 rounded-full ${type.colour} flex items-center justify-center`}>
                  <Icon className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="text-xs font-medium text-slate-700">{type.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Summary */}
      <Card className="p-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Today's Summary</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Pad Checks */}
          <div className="bg-slate-50 rounded-md p-2 border border-slate-100">
            <p className="font-medium text-slate-600 mb-1">Pad Checks ({dailySummary.padChecks})</p>
            {dailySummary.padChecks > 0 ? (
              <div className="flex flex-wrap gap-1">
                {Object.entries(dailySummary.padCounts).map(([status, count]) => {
                  if (count === 0) return null;
                  const config = getPadStatusConfig(status);
                  return (
                    <Badge key={status} className={`text-[10px] px-1.5 py-0 border ${config?.style || ''}`}>
                      {count} {config?.label || status}
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-400 italic">None recorded</p>
            )}
          </div>

          {/* Toileting */}
          <div className="bg-slate-50 rounded-md p-2 border border-slate-100">
            <p className="font-medium text-slate-600 mb-1">Toileting</p>
            <p className={`font-semibold ${dailySummary.toiletingCount > 0 ? 'text-green-700' : 'text-slate-400 italic'}`}>
              {dailySummary.toiletingCount > 0 ? `${dailySummary.toiletingCount} recorded` : 'None recorded'}
            </p>
          </div>

          {/* Bowel */}
          <div className="bg-slate-50 rounded-md p-2 border border-slate-100 col-span-2">
            <p className="font-medium text-slate-600 mb-1">Bowel ({dailySummary.bowelCount})</p>
            {dailySummary.bowelCount > 0 ? (
              <div className="flex flex-wrap gap-1">
                {dailySummary.bowelTypes.map((type, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0">{type}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">None recorded</p>
            )}
          </div>
        </div>
      </Card>

      {/* Today's Records */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Today's Records ({todayRecords.length})
        </p>
        {todayRecords.length === 0 ? (
          <Card className="p-4 text-center">
            <Droplets className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-500">No continence records today</p>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {todayRecords.map((rec) => {
              const typeConfig = getRecordTypeConfig(rec.record_type);
              const Icon = typeConfig.icon;

              return (
                <Card key={rec.id} className="p-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full ${typeConfig.colour} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] px-1.5 py-0 border ${RECORD_TYPE_BADGE_STYLES[rec.record_type]}`}>
                          {typeConfig.label}
                        </Badge>
                        <Badge className={`text-[10px] px-1.5 py-0 border ${getStatusBadgeStyle(rec)}`}>
                          {getStatusLabel(rec)}
                        </Badge>
                        {rec.pad_changed && (
                          <Badge className="text-[10px] px-1.5 py-0 border bg-green-100 text-green-700 border-green-200">
                            Changed
                          </Badge>
                        )}
                        {rec.personal_care_given && (
                          <Badge className="text-[10px] px-1.5 py-0 border bg-blue-100 text-blue-700 border-blue-200">
                            Personal Care
                          </Badge>
                        )}
                        {rec.skin_condition && rec.skin_condition !== 'healthy' && (
                          <Badge className={`text-[10px] px-1.5 py-0 border ${getSkinConfig(rec.skin_condition)?.style || ''}`}>
                            Skin: {getSkinConfig(rec.skin_condition)?.label || rec.skin_condition}
                          </Badge>
                        )}
                      </div>
                      {rec.notes && (
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{rec.notes}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-slate-600">{formatTimeShort(rec.recorded_at)}</p>
                      <p className="text-[10px] text-slate-400">{rec.staff_name}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* History — Past 7 Days */}
      {historyByDate.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Past 7 Days</p>
          <div className="space-y-3">
            {historyByDate.map(({ date, label, dateFormatted, records: dayRecs }) => (
              <div key={date}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-slate-600">{dateFormatted} - {label}</p>
                  <Badge variant="outline" className="text-[10px]">{dayRecs.length} entries</Badge>
                </div>
                <Card className="overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {dayRecs.map((rec) => {
                      const typeConfig = getRecordTypeConfig(rec.record_type);
                      const Icon = typeConfig.icon;

                      return (
                        <div key={rec.id} className="flex items-center gap-2 px-3 py-2">
                          <div className={`w-6 h-6 rounded-full ${typeConfig.colour} flex items-center justify-center shrink-0`}>
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-slate-700 w-14 shrink-0">{formatTimeShort(rec.recorded_at)}</span>
                          <Badge className={`text-[9px] px-1 py-0 border ${RECORD_TYPE_BADGE_STYLES[rec.record_type]}`}>
                            {typeConfig.label}
                          </Badge>
                          <span className="text-xs text-slate-600 flex-1 truncate">{getStatusLabel(rec)}</span>
                          {rec.pad_changed && (
                            <Badge className="text-[9px] px-1 py-0 border bg-green-100 text-green-700 border-green-200">Changed</Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Entry Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setFormType(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              {formType && (() => {
                const config = getRecordTypeConfig(formType);
                const Icon = config.icon;
                return (
                  <>
                    <div className={`w-6 h-6 rounded-full ${config.colour} flex items-center justify-center`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    {config.label}
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Pad Check Form */}
            {formType === 'pad_check' && (
              <>
                <div>
                  <Label className="text-xs">Pad Status *</Label>
                  <Select value={form.pad_status || ''} onValueChange={(v) => updateField('pad_status', v)}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue placeholder="Select pad status" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAD_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pad_changed"
                    checked={form.pad_changed || false}
                    onCheckedChange={(v) => updateField('pad_changed', !!v)}
                  />
                  <Label htmlFor="pad_changed" className="text-sm cursor-pointer">Pad changed</Label>
                </div>
                <div>
                  <Label className="text-xs">Skin Condition</Label>
                  <Select value={form.skin_condition || 'healthy'} onValueChange={(v) => updateField('skin_condition', v)}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue placeholder="Select skin condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKIN_CONDITION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="personal_care_pad"
                    checked={form.personal_care_given || false}
                    onCheckedChange={(v) => updateField('personal_care_given', !!v)}
                  />
                  <Label htmlFor="personal_care_pad" className="text-sm cursor-pointer">Personal care given</Label>
                </div>
              </>
            )}

            {/* Toileting Form */}
            {formType === 'toileting' && (
              <>
                <div>
                  <Label className="text-xs">Output Amount *</Label>
                  <Select value={form.output_amount || ''} onValueChange={(v) => updateField('output_amount', v)}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue placeholder="Select output amount" />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTPUT_AMOUNT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Skin Condition</Label>
                  <Select value={form.skin_condition || 'healthy'} onValueChange={(v) => updateField('skin_condition', v)}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue placeholder="Select skin condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {SKIN_CONDITION_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="personal_care_toilet"
                    checked={form.personal_care_given || false}
                    onCheckedChange={(v) => updateField('personal_care_given', !!v)}
                  />
                  <Label htmlFor="personal_care_toilet" className="text-sm cursor-pointer">Personal care given</Label>
                </div>
              </>
            )}

            {/* Bowel Form */}
            {formType === 'bowel' && (
              <>
                <div>
                  <Label className="text-xs">Bristol Stool Type *</Label>
                  <Select value={form.bowel_type || ''} onValueChange={(v) => updateField('bowel_type', v)}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue placeholder="Select stool type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOWEL_TYPE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Output Amount</Label>
                  <Select value={form.output_amount || ''} onValueChange={(v) => updateField('output_amount', v)}>
                    <SelectTrigger className="h-10 mt-1">
                      <SelectValue placeholder="Select output amount" />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTPUT_AMOUNT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Notes (shared across all types) */}
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                value={form.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Any observations..."
                rows={2}
                className="text-sm mt-1"
              />
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11"
                onClick={() => { setShowForm(false); setFormType(null); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  'Saving...'
                ) : (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Save
                  </span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

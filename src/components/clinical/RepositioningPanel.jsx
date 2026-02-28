import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import {
  RotateCcw, AlertTriangle, Clock, ArrowLeft, ArrowRight,
  ArrowUp, Armchair, PersonStanding, Activity, CheckCircle
} from 'lucide-react';

const POSITION_OPTIONS = [
  { value: 'left_side', label: 'Left Side', icon: ArrowLeft, colour: 'bg-blue-500' },
  { value: 'right_side', label: 'Right Side', icon: ArrowRight, colour: 'bg-purple-500' },
  { value: 'back', label: 'Back', icon: ArrowUp, colour: 'bg-green-500' },
  { value: 'sitting', label: 'Sitting', icon: Armchair, colour: 'bg-amber-500' },
  { value: 'standing', label: 'Standing', icon: PersonStanding, colour: 'bg-teal-500' },
];

const SKIN_CHECK_OPTIONS = [
  { value: 'clear', label: 'Clear', style: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'redness', label: 'Redness', style: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'blanching', label: 'Blanching', style: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'non_blanching', label: 'Non-blanching', style: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'broken', label: 'Broken', style: 'bg-red-200 text-red-800 border-red-300' },
];

const COMFORT_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable', style: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'mild_discomfort', label: 'Mild Discomfort', style: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'pain', label: 'Pain', style: 'bg-red-100 text-red-700 border-red-200' },
];

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function formatTimeShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function hoursSince(dateStr) {
  if (!dateStr) return Infinity;
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.toISOString().split('T')[0] === now.toISOString().split('T')[0];
}

function daysAgoLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const dStr = d.toISOString().split('T')[0];
  if (dStr === todayStr) return 'Today';
  const diff = Math.floor((new Date(todayStr) - new Date(dStr)) / (1000 * 60 * 60 * 24));
  if (diff === 1) return 'Yesterday';
  return `${diff} days ago`;
}

export default function RepositioningPanel({ serviceUser }) {
  const queryClient = useQueryClient();
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickPosition, setQuickPosition] = useState('');
  const [quickSkin, setQuickSkin] = useState('clear');
  const [quickComfort, setQuickComfort] = useState('comfortable');
  const [quickNotes, setQuickNotes] = useState('');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['repositioningRecords', serviceUser?.id],
    queryFn: () => base44.entities.RepositioningRecord.filter({ service_user_id: serviceUser.id }, '-recorded_at', 500),
    enabled: !!serviceUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RepositioningRecord.create({
      ...data,
      service_user_id: serviceUser.id,
      staff_id: user?.id,
      staff_name: user?.full_name || user?.email || 'Unknown',
      recorded_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositioningRecords', serviceUser.id] });
      toast.success('Repositioning recorded');
      setShowQuickForm(false);
      resetQuickForm();
    },
    onError: (err) => {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    },
  });

  const resetQuickForm = () => {
    setQuickPosition('');
    setQuickSkin('clear');
    setQuickComfort('comfortable');
    setQuickNotes('');
  };

  const handleQuickLog = (positionValue) => {
    setQuickPosition(positionValue);
    setQuickSkin('clear');
    setQuickComfort('comfortable');
    setQuickNotes('');
    setShowQuickForm(true);
  };

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickPosition) {
      toast.error('Please select a position');
      return;
    }
    createMutation.mutate({
      position: quickPosition,
      skin_check: quickSkin,
      comfort_level: quickComfort,
      notes: quickNotes || null,
    });
  };

  // Split records
  const todayRecords = useMemo(() => {
    return records.filter(r => isToday(r.recorded_at));
  }, [records]);

  const last7DaysRecords = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return records.filter(r => {
      const d = new Date(r.recorded_at);
      return d >= cutoff && !isToday(r.recorded_at);
    });
  }, [records]);

  // Gap detection
  const lastRecord = todayRecords.length > 0 ? todayRecords[0] : null;
  const gapHours = lastRecord ? hoursSince(lastRecord.recorded_at) : Infinity;
  const hasGap = gapHours > 4;

  // Timeline gaps within today
  const timelineGaps = useMemo(() => {
    if (todayRecords.length < 2) return [];
    const sorted = [...todayRecords].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    const gaps = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i].recorded_at) - new Date(sorted[i - 1].recorded_at)) / (1000 * 60 * 60);
      if (diff > 4) {
        gaps.push({
          from: formatTimeShort(sorted[i - 1].recorded_at),
          to: formatTimeShort(sorted[i].recorded_at),
          hours: diff.toFixed(1),
        });
      }
    }
    return gaps;
  }, [todayRecords]);

  // Group history by date
  const historyByDate = useMemo(() => {
    const grouped = {};
    last7DaysRecords.forEach(r => {
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
  }, [last7DaysRecords]);

  const getPositionConfig = (pos) => POSITION_OPTIONS.find(p => p.value === pos) || POSITION_OPTIONS[0];
  const getSkinConfig = (skin) => SKIN_CHECK_OPTIONS.find(s => s.value === skin) || SKIN_CHECK_OPTIONS[0];
  const getComfortConfig = (comfort) => COMFORT_OPTIONS.find(c => c.value === comfort) || COMFORT_OPTIONS[0];

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
          <RotateCcw className="w-4 h-4" />
          Repositioning Chart
        </h3>
        {lastRecord && (
          <span className="text-[11px] text-slate-500">
            Last: {formatTimeShort(lastRecord.recorded_at)}
          </span>
        )}
      </div>

      {/* Gap Alert */}
      {hasGap && (
        <Card className="p-3 bg-red-50 border-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">Repositioning Overdue</p>
              <p className="text-xs text-red-600">
                {lastRecord
                  ? `Last repositioned ${gapHours.toFixed(1)} hours ago at ${formatTimeShort(lastRecord.recorded_at)}`
                  : 'No repositioning recorded today'
                }
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Log Buttons */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Log Position</p>
        <div className="grid grid-cols-5 gap-2">
          {POSITION_OPTIONS.map((pos) => {
            const Icon = pos.icon;
            return (
              <button
                key={pos.value}
                onClick={() => handleQuickLog(pos.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 border-slate-200 hover:border-slate-400 bg-white active:scale-95 transition-all touch-manipulation`}
              >
                <div className={`w-8 h-8 rounded-full ${pos.colour} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[10px] font-medium text-slate-700 leading-tight text-center">{pos.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Today's Timeline */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Today's Timeline ({todayRecords.length} entries)
        </p>

        {/* Timeline gaps warning */}
        {timelineGaps.length > 0 && (
          <div className="mb-2 space-y-1">
            {timelineGaps.map((gap, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-md px-2 py-1 border border-red-200">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>{gap.hours}hr gap between {gap.from} and {gap.to}</span>
              </div>
            ))}
          </div>
        )}

        {todayRecords.length === 0 ? (
          <Card className="p-4 text-center">
            <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-500">No repositioning recorded today</p>
          </Card>
        ) : (
          <div className="space-y-1.5">
            {todayRecords.map((rec) => {
              const posConfig = getPositionConfig(rec.position);
              const skinConfig = getSkinConfig(rec.skin_check);
              const comfortConfig = getComfortConfig(rec.comfort_level);
              const Icon = posConfig.icon;

              return (
                <Card key={rec.id} className="p-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full ${posConfig.colour} flex items-center justify-center shrink-0`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-800">{posConfig.label}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 border ${skinConfig.style}`}>
                          {skinConfig.label}
                        </Badge>
                        <Badge className={`text-[10px] px-1.5 py-0 border ${comfortConfig.style}`}>
                          {comfortConfig.label}
                        </Badge>
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
                      const posConfig = getPositionConfig(rec.position);
                      const skinConfig = getSkinConfig(rec.skin_check);
                      const comfortConfig = getComfortConfig(rec.comfort_level);
                      const Icon = posConfig.icon;

                      return (
                        <div key={rec.id} className="flex items-center gap-2 px-3 py-2">
                          <div className={`w-6 h-6 rounded-full ${posConfig.colour} flex items-center justify-center shrink-0`}>
                            <Icon className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-medium text-slate-700 w-14 shrink-0">{formatTimeShort(rec.recorded_at)}</span>
                          <span className="text-xs text-slate-600 flex-1">{posConfig.label}</span>
                          <Badge className={`text-[9px] px-1 py-0 border ${skinConfig.style}`}>{skinConfig.label}</Badge>
                          <Badge className={`text-[9px] px-1 py-0 border ${comfortConfig.style}`}>{comfortConfig.label}</Badge>
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

      {/* Quick Log Dialog */}
      <Dialog open={showQuickForm} onOpenChange={(open) => { if (!open) { setShowQuickForm(false); resetQuickForm(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-rose-600" />
              Log Repositioning
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleQuickSubmit} className="space-y-3">
            {/* Position (pre-selected) */}
            <div>
              <Label className="text-xs">Position</Label>
              <div className="grid grid-cols-5 gap-1.5 mt-1">
                {POSITION_OPTIONS.map((pos) => {
                  const Icon = pos.icon;
                  const isSelected = quickPosition === pos.value;
                  return (
                    <button
                      type="button"
                      key={pos.value}
                      onClick={() => setQuickPosition(pos.value)}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 transition-all touch-manipulation ${
                        isSelected
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${pos.colour} flex items-center justify-center`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[9px] font-medium text-slate-700 leading-tight text-center">{pos.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skin Check */}
            <div>
              <Label className="text-xs">Skin Check</Label>
              <Select value={quickSkin} onValueChange={setQuickSkin}>
                <SelectTrigger className="h-10 mt-1">
                  <SelectValue placeholder="Select skin check" />
                </SelectTrigger>
                <SelectContent>
                  {SKIN_CHECK_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Comfort Level */}
            <div>
              <Label className="text-xs">Comfort Level</Label>
              <Select value={quickComfort} onValueChange={setQuickComfort}>
                <SelectTrigger className="h-10 mt-1">
                  <SelectValue placeholder="Select comfort level" />
                </SelectTrigger>
                <SelectContent>
                  {COMFORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
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
                onClick={() => { setShowQuickForm(false); resetQuickForm(); }}
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

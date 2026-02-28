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
import {
  Scale, Heart, Thermometer, Wind, Droplets, Activity,
  Plus, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// ─── Observation type configuration ──────────────────────────────────────────
const OBSERVATION_TYPES = {
  weight: {
    label: 'Weight',
    unit: 'kg',
    icon: Scale,
    inputType: 'numeric',
    normalMin: null,
    normalMax: null,
    color: 'blue',
  },
  blood_pressure: {
    label: 'Blood Pressure',
    unit: 'mmHg',
    icon: Activity,
    inputType: 'text',
    normalMin: '90/60',
    normalMax: '140/90',
    color: 'purple',
  },
  temperature: {
    label: 'Temperature',
    unit: '\u00B0C',
    icon: Thermometer,
    inputType: 'numeric',
    normalMin: 36.1,
    normalMax: 37.2,
    color: 'red',
  },
  pulse: {
    label: 'Pulse',
    unit: 'bpm',
    icon: Heart,
    inputType: 'numeric',
    normalMin: 60,
    normalMax: 100,
    color: 'pink',
  },
  o2_sats: {
    label: 'O2 Sats',
    unit: '%',
    icon: Wind,
    inputType: 'numeric',
    normalMin: 95,
    normalMax: 100,
    color: 'cyan',
  },
  blood_sugar: {
    label: 'Blood Sugar',
    unit: 'mmol/L',
    icon: Droplets,
    inputType: 'numeric',
    normalMin: 4.0,
    normalMax: 7.0,
    color: 'orange',
  },
};

const TYPE_KEYS = Object.keys(OBSERVATION_TYPES);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getValue(obs) {
  if (obs.observation_type === 'blood_pressure') return obs.value_text;
  return obs.value_numeric;
}

function parseBP(val) {
  if (!val || typeof val !== 'string') return null;
  const parts = val.split('/');
  if (parts.length !== 2) return null;
  const sys = parseFloat(parts[0]);
  const dia = parseFloat(parts[1]);
  if (isNaN(sys) || isNaN(dia)) return null;
  return { sys, dia };
}

function isOutOfRange(type, value) {
  const cfg = OBSERVATION_TYPES[type];
  if (!cfg) return false;

  if (type === 'blood_pressure') {
    const bp = parseBP(value);
    if (!bp) return false;
    const minBP = parseBP(cfg.normalMin);
    const maxBP = parseBP(cfg.normalMax);
    if (!minBP || !maxBP) return false;
    return bp.sys < minBP.sys || bp.dia < minBP.dia || bp.sys > maxBP.sys || bp.dia > maxBP.dia;
  }

  if (type === 'weight') return false; // no fixed range

  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (cfg.normalMin !== null && num < cfg.normalMin) return true;
  if (cfg.normalMax !== null && num > cfg.normalMax) return true;
  return false;
}

function isWarningRange(type, value) {
  // amber: within 10% of boundary
  const cfg = OBSERVATION_TYPES[type];
  if (!cfg || type === 'weight' || type === 'blood_pressure') return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (cfg.normalMin !== null && cfg.normalMax !== null) {
    const range = cfg.normalMax - cfg.normalMin;
    const margin = range * 0.15;
    if (num >= cfg.normalMin && num < cfg.normalMin + margin) return true;
    if (num <= cfg.normalMax && num > cfg.normalMax - margin) return true;
  }
  return false;
}

function getTrend(latest, previous) {
  if (!latest || !previous) return 'stable';
  const latestType = latest.observation_type;

  if (latestType === 'blood_pressure') {
    const bpLatest = parseBP(latest.value_text);
    const bpPrevious = parseBP(previous.value_text);
    if (!bpLatest || !bpPrevious) return 'stable';
    const diff = bpLatest.sys - bpPrevious.sys;
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }

  const latestVal = parseFloat(latest.value_numeric);
  const prevVal = parseFloat(previous.value_numeric);
  if (isNaN(latestVal) || isNaN(prevVal)) return 'stable';
  const diff = latestVal - prevVal;
  const threshold = prevVal * 0.02 || 0.5;
  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'stable';
}

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4 text-rose-500" />;
  if (trend === 'down') return <TrendingDown className="w-4 h-4 text-blue-500" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ObservationsPanel({ serviceUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [formData, setFormData] = useState({
    observation_type: 'weight',
    value_numeric: '',
    value_text: '',
    notes: '',
  });

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: observations = [], isLoading } = useQuery({
    queryKey: ['clinicalObservations', serviceUser?.id],
    queryFn: () => base44.entities.ClinicalObservation.filter(
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
    mutationFn: (data) => base44.entities.ClinicalObservation.create({
      ...data,
      service_user_id: serviceUser.id,
      staff_id: user?.id,
      staff_name: user?.full_name,
      recorded_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinicalObservations', serviceUser.id] });
      toast.success('Observation recorded');
      setShowForm(false);
      resetForm();
    },
    onError: (err) => {
      toast.error('Failed to save observation: ' + (err.message || 'Unknown error'));
    },
  });

  // ── Derived data ─────────────────────────────────────────────────────────

  const groupedByType = useMemo(() => {
    const groups = {};
    for (const key of TYPE_KEYS) groups[key] = [];
    for (const obs of observations) {
      if (groups[obs.observation_type]) {
        groups[obs.observation_type].push(obs);
      }
    }
    return groups;
  }, [observations]);

  const filteredHistory = useMemo(() => {
    let list = [...observations];
    if (filterType !== 'all') {
      list = list.filter(o => o.observation_type === filterType);
    }
    if (filterDateFrom) {
      list = list.filter(o => (o.recorded_at || o.created_at) >= filterDateFrom);
    }
    if (filterDateTo) {
      list = list.filter(o => (o.recorded_at || o.created_at) <= filterDateTo + 'T23:59:59');
    }
    return list;
  }, [observations, filterType, filterDateFrom, filterDateTo]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function resetForm() {
    setFormData({ observation_type: 'weight', value_numeric: '', value_text: '', notes: '' });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const cfg = OBSERVATION_TYPES[formData.observation_type];
    if (!cfg) return;

    const payload = {
      observation_type: formData.observation_type,
      notes: formData.notes || null,
    };

    if (cfg.inputType === 'text') {
      if (!formData.value_text.trim()) {
        toast.error('Please enter a value');
        return;
      }
      payload.value_text = formData.value_text.trim();
      payload.unit = cfg.unit;
    } else {
      const num = parseFloat(formData.value_numeric);
      if (isNaN(num)) {
        toast.error('Please enter a valid number');
        return;
      }
      payload.value_numeric = num;
      payload.unit = cfg.unit;
    }

    createMutation.mutate(payload);
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-500">
        Loading observations...
      </div>
    );
  }

  const selectedTypeCfg = OBSERVATION_TYPES[formData.observation_type];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">Vital Signs / Observations</h3>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-1" /> Record
        </Button>
      </div>

      {/* ── Latest readings grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {TYPE_KEYS.map((typeKey) => {
          const cfg = OBSERVATION_TYPES[typeKey];
          const Icon = cfg.icon;
          const readings = groupedByType[typeKey] || [];
          const latest = readings[0] || null;
          const previous = readings[1] || null;
          const value = latest ? getValue(latest) : null;
          const outOfRange = latest ? isOutOfRange(typeKey, value) : false;
          const warning = latest && !outOfRange ? isWarningRange(typeKey, value) : false;
          const trend = getTrend(latest, previous);

          let borderColor = 'border-slate-200';
          let bgColor = 'bg-white';
          if (outOfRange) {
            borderColor = 'border-red-300';
            bgColor = 'bg-red-50';
          } else if (warning) {
            borderColor = 'border-amber-300';
            bgColor = 'bg-amber-50';
          }

          return (
            <Card
              key={typeKey}
              className={`p-3 ${borderColor} ${bgColor} transition-colors`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-medium text-slate-600">{cfg.label}</span>
                </div>
                {latest && <TrendIcon trend={trend} />}
              </div>
              {latest ? (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-xl font-bold ${outOfRange ? 'text-red-700' : 'text-slate-800'}`}>
                      {value}
                    </span>
                    <span className="text-xs text-slate-500">{cfg.unit}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {format(new Date(latest.recorded_at || latest.created_at), 'dd MMM yyyy HH:mm')}
                  </div>
                  {outOfRange && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      <span className="text-[10px] text-red-600 font-medium">Outside normal range</span>
                    </div>
                  )}
                  {warning && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] text-amber-600 font-medium">Near boundary</span>
                    </div>
                  )}
                  {cfg.normalMin !== null && cfg.normalMax !== null && (
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Normal: {cfg.normalMin}&ndash;{cfg.normalMax} {cfg.unit}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-slate-400 italic mt-1">No reading</div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── History table ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700">History</h4>

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[140px]">
            <Label className="text-xs text-slate-500 mb-1 block">Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {TYPE_KEYS.map(k => (
                  <SelectItem key={k} value={k}>{OBSERVATION_TYPES[k].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">From</Label>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-8 text-xs w-[130px]"
            />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">To</Label>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-8 text-xs w-[130px]"
            />
          </div>
          {(filterType !== 'all' || filterDateFrom || filterDateTo) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={() => { setFilterType('all'); setFilterDateFrom(''); setFilterDateTo(''); }}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="text-left px-3 py-2 font-medium">Date</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-left px-3 py-2 font-medium">Value</th>
                <th className="text-left px-3 py-2 font-medium hidden sm:table-cell">Notes</th>
                <th className="text-left px-3 py-2 font-medium hidden md:table-cell">Recorded by</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    No observations recorded
                  </td>
                </tr>
              )}
              {filteredHistory.map((obs) => {
                const cfg = OBSERVATION_TYPES[obs.observation_type];
                const val = getValue(obs);
                const oor = isOutOfRange(obs.observation_type, val);
                return (
                  <tr key={obs.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {format(new Date(obs.recorded_at || obs.created_at), 'dd/MM/yy HH:mm')}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="outline" className="text-[10px] font-medium">
                        {cfg?.label || obs.observation_type}
                      </Badge>
                    </td>
                    <td className={`px-3 py-2 font-semibold ${oor ? 'text-red-600' : 'text-slate-800'}`}>
                      {val} {cfg?.unit || obs.unit}
                    </td>
                    <td className="px-3 py-2 text-slate-500 max-w-[200px] truncate hidden sm:table-cell">
                      {obs.notes || '\u2014'}
                    </td>
                    <td className="px-3 py-2 text-slate-500 hidden md:table-cell">
                      {obs.staff_name || '\u2014'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Quick entry dialog ───────────────────────────────────────────── */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Observation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Observation type */}
            <div>
              <Label className="text-sm">Observation Type</Label>
              <Select
                value={formData.observation_type}
                onValueChange={(val) => setFormData(prev => ({
                  ...prev,
                  observation_type: val,
                  value_numeric: '',
                  value_text: '',
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_KEYS.map(k => (
                    <SelectItem key={k} value={k}>{OBSERVATION_TYPES[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value input */}
            <div>
              <Label className="text-sm">
                Value ({selectedTypeCfg?.unit})
              </Label>
              {selectedTypeCfg?.inputType === 'text' ? (
                <Input
                  type="text"
                  placeholder="e.g. 120/80"
                  value={formData.value_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, value_text: e.target.value }))}
                  className="mt-1"
                  required
                />
              ) : (
                <Input
                  type="number"
                  step="0.1"
                  placeholder={`e.g. ${selectedTypeCfg?.normalMin || ''}`}
                  value={formData.value_numeric}
                  onChange={(e) => setFormData(prev => ({ ...prev, value_numeric: e.target.value }))}
                  className="mt-1"
                  required
                />
              )}
              {selectedTypeCfg?.normalMin !== null && selectedTypeCfg?.normalMax !== null && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Normal range: {selectedTypeCfg.normalMin}&ndash;{selectedTypeCfg.normalMax} {selectedTypeCfg.unit}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label className="text-sm">Notes (optional)</Label>
              <textarea
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setShowForm(false); resetForm(); }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import {
  PersonStanding, Plus, AlertTriangle, ChevronDown, ChevronUp,
  Calendar, Clock, MapPin, Eye, TrendingUp, Activity
} from 'lucide-react';

const LOCATION_OPTIONS = [
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'living_room', label: 'Living Room' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'garden', label: 'Garden' },
  { value: 'stairs', label: 'Stairs' },
  { value: 'other', label: 'Other' },
];

const INJURY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'minor_bruise', label: 'Minor Bruise' },
  { value: 'cut', label: 'Cut' },
  { value: 'head_injury', label: 'Head Injury' },
  { value: 'fracture', label: 'Fracture' },
  { value: 'sprain', label: 'Sprain' },
  { value: 'other', label: 'Other' },
];

const CONTRIBUTING_FACTORS = [
  { value: 'medication', label: 'Medication' },
  { value: 'footwear', label: 'Footwear' },
  { value: 'lighting', label: 'Lighting' },
  { value: 'wet_floor', label: 'Wet Floor' },
  { value: 'mobility_issues', label: 'Mobility Issues' },
  { value: 'confusion', label: 'Confusion' },
  { value: 'rushing', label: 'Rushing' },
  { value: 'clutter', label: 'Clutter' },
  { value: 'dizziness', label: 'Dizziness' },
  { value: 'low_blood_pressure', label: 'Low Blood Pressure' },
  { value: 'unfamiliar_environment', label: 'Unfamiliar Environment' },
];

const INJURY_BADGE_STYLES = {
  none: 'bg-green-100 text-green-700 border-green-200',
  minor_bruise: 'bg-amber-100 text-amber-700 border-amber-200',
  cut: 'bg-amber-100 text-amber-700 border-amber-200',
  head_injury: 'bg-red-100 text-red-700 border-red-200',
  fracture: 'bg-red-200 text-red-800 border-red-300',
  sprain: 'bg-amber-100 text-amber-700 border-amber-200',
  other: 'bg-slate-100 text-slate-700 border-slate-200',
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  return (timeStr || '').slice(0, 5);
}

function getTimeOfDay(timeStr) {
  if (!timeStr) return null;
  const hour = parseInt(timeStr.slice(0, 2), 10);
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfQuarter() {
  const d = new Date();
  const q = Math.floor(d.getMonth() / 3) * 3;
  return new Date(d.getFullYear(), q, 1);
}

const EMPTY_FORM = {
  fall_date: todayISO(),
  fall_time: '',
  location: '',
  description: '',
  witnessed: false,
  witness_name: '',
  injuries: 'none',
  injury_details: '',
  contributing_factors: [],
  immediate_action: '',
  medical_attention: false,
  medical_details: '',
  ambulance_called: false,
  family_notified: false,
  gp_notified: false,
  follow_up_actions: '',
  risk_assessment_updated: false,
};

export default function FallsPanel({ serviceUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [expandedId, setExpandedId] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: falls = [], isLoading } = useQuery({
    queryKey: ['fallsRecords', serviceUser?.id],
    queryFn: () => base44.entities.FallsRecord.filter({ service_user_id: serviceUser.id }, '-fall_date', 200),
    enabled: !!serviceUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FallsRecord.create({
      ...data,
      service_user_id: serviceUser.id,
      staff_id: user?.id,
      staff_name: user?.full_name || user?.email || 'Unknown',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fallsRecords', serviceUser.id] });
      toast.success('Fall record saved');
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
    },
    onError: (err) => {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    },
  });

  // Stats
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth();
    const quarterStart = startOfQuarter();
    const thisMonth = falls.filter(f => new Date(f.fall_date) >= monthStart);
    const thisQuarter = falls.filter(f => new Date(f.fall_date) >= quarterStart);
    return {
      total: falls.length,
      month: thisMonth.length,
      quarter: thisQuarter.length,
    };
  }, [falls]);

  // Patterns analysis
  const patterns = useMemo(() => {
    if (falls.length < 4) return null;

    // Most common location
    const locCounts = {};
    falls.forEach(f => {
      if (f.location) locCounts[f.location] = (locCounts[f.location] || 0) + 1;
    });
    const topLocation = Object.entries(locCounts).sort((a, b) => b[1] - a[1])[0];

    // Most common contributing factor
    const factorCounts = {};
    falls.forEach(f => {
      (f.contributing_factors || []).forEach(cf => {
        factorCounts[cf] = (factorCounts[cf] || 0) + 1;
      });
    });
    const topFactor = Object.entries(factorCounts).sort((a, b) => b[1] - a[1])[0];

    // Most common time of day
    const todCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    falls.forEach(f => {
      const tod = getTimeOfDay(f.fall_time);
      if (tod) todCounts[tod]++;
    });
    const topTod = Object.entries(todCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      location: topLocation ? { name: LOCATION_OPTIONS.find(l => l.value === topLocation[0])?.label || topLocation[0], count: topLocation[1] } : null,
      factor: topFactor ? { name: CONTRIBUTING_FACTORS.find(f => f.value === topFactor[0])?.label || topFactor[0], count: topFactor[1] } : null,
      timeOfDay: topTod && topTod[1] > 0 ? { name: topTod[0].charAt(0).toUpperCase() + topTod[0].slice(1), count: topTod[1] } : null,
    };
  }, [falls]);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleFactor = (factor) => {
    setForm(prev => {
      const current = prev.contributing_factors || [];
      const next = current.includes(factor)
        ? current.filter(f => f !== factor)
        : [...current, factor];
      return { ...prev, contributing_factors: next };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fall_date || !form.location) {
      toast.error('Please fill in date and location');
      return;
    }
    createMutation.mutate(form);
  };

  const openNewForm = () => {
    setForm({ ...EMPTY_FORM, fall_date: todayISO() });
    setShowForm(true);
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
          <PersonStanding className="w-4 h-4" />
          Falls Record
        </h3>
        <Button
          size="sm"
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8"
          onClick={openNewForm}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Log Fall
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-[11px] text-slate-500">Total Falls</p>
        </Card>
        <Card className={`p-3 text-center ${stats.month > 0 ? 'border-amber-300 bg-amber-50' : ''}`}>
          <p className={`text-2xl font-bold ${stats.month > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{stats.month}</p>
          <p className="text-[11px] text-slate-500">This Month</p>
          {stats.month > 0 && (
            <div className="flex items-center justify-center gap-0.5 mt-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span className="text-[10px] text-amber-600 font-medium">Attention</span>
            </div>
          )}
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{stats.quarter}</p>
          <p className="text-[11px] text-slate-500">This Quarter</p>
        </Card>
      </div>

      {/* Common Patterns */}
      {patterns && (
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs font-semibold text-blue-800 flex items-center gap-1 mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Common Patterns ({falls.length} falls analysed)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {patterns.location && (
              <div className="bg-white rounded-md p-2 border border-blue-100">
                <p className="text-slate-500">Most common location</p>
                <p className="font-semibold text-slate-800">{patterns.location.name} ({patterns.location.count}x)</p>
              </div>
            )}
            {patterns.factor && (
              <div className="bg-white rounded-md p-2 border border-blue-100">
                <p className="text-slate-500">Top contributing factor</p>
                <p className="font-semibold text-slate-800">{patterns.factor.name} ({patterns.factor.count}x)</p>
              </div>
            )}
            {patterns.timeOfDay && (
              <div className="bg-white rounded-md p-2 border border-blue-100">
                <p className="text-slate-500">Most common time</p>
                <p className="font-semibold text-slate-800">{patterns.timeOfDay.name} ({patterns.timeOfDay.count}x)</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Falls Log */}
      {falls.length === 0 ? (
        <Card className="p-6 text-center">
          <PersonStanding className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No falls recorded</p>
          <p className="text-xs text-slate-400 mt-1">Tap "Log Fall" to record a fall incident</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {falls.map((fall) => {
            const isExpanded = expandedId === fall.id;
            const injuryLabel = INJURY_OPTIONS.find(i => i.value === fall.injuries)?.label || fall.injuries || 'Unknown';
            const locationLabel = LOCATION_OPTIONS.find(l => l.value === fall.location)?.label || fall.location || 'Unknown';

            return (
              <Card key={fall.id} className="overflow-hidden">
                <button
                  className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : fall.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formatDate(fall.fall_date)}
                          </span>
                          {fall.fall_time && (
                            <span className="text-xs text-slate-500 flex items-center gap-0.5">
                              <Clock className="w-3 h-3" />
                              {formatTime(fall.fall_time)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className="text-xs text-slate-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            {locationLabel}
                          </span>
                          <Badge className={`text-[10px] px-1.5 py-0 border ${INJURY_BADGE_STYLES[fall.injuries] || INJURY_BADGE_STYLES.other}`}>
                            {injuryLabel}
                          </Badge>
                          {fall.witnessed && (
                            <Badge className="text-[10px] px-1.5 py-0 border bg-blue-100 text-blue-700 border-blue-200">
                              <Eye className="w-2.5 h-2.5 mr-0.5" />
                              Witnessed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400">{fall.staff_name}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-3 space-y-2 text-xs">
                    {fall.description && (
                      <div>
                        <p className="font-semibold text-slate-600">Description</p>
                        <p className="text-slate-700 mt-0.5">{fall.description}</p>
                      </div>
                    )}
                    {fall.witnessed && fall.witness_name && (
                      <div>
                        <p className="font-semibold text-slate-600">Witness</p>
                        <p className="text-slate-700 mt-0.5">{fall.witness_name}</p>
                      </div>
                    )}
                    {fall.injuries !== 'none' && fall.injury_details && (
                      <div>
                        <p className="font-semibold text-slate-600">Injury Details</p>
                        <p className="text-slate-700 mt-0.5">{fall.injury_details}</p>
                      </div>
                    )}
                    {(fall.contributing_factors || []).length > 0 && (
                      <div>
                        <p className="font-semibold text-slate-600">Contributing Factors</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {fall.contributing_factors.map(cf => (
                            <Badge key={cf} variant="outline" className="text-[10px] px-1.5 py-0">
                              {CONTRIBUTING_FACTORS.find(f => f.value === cf)?.label || cf}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {fall.immediate_action && (
                      <div>
                        <p className="font-semibold text-slate-600">Immediate Action</p>
                        <p className="text-slate-700 mt-0.5">{fall.immediate_action}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3 pt-1 border-t border-slate-200">
                      {fall.medical_attention && (
                        <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">Medical Attention</Badge>
                      )}
                      {fall.ambulance_called && (
                        <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200">Ambulance Called</Badge>
                      )}
                      {fall.family_notified && (
                        <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200">Family Notified</Badge>
                      )}
                      {fall.gp_notified && (
                        <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200">GP Notified</Badge>
                      )}
                      {fall.risk_assessment_updated && (
                        <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">Risk Assessment Updated</Badge>
                      )}
                    </div>
                    {fall.medical_details && (
                      <div>
                        <p className="font-semibold text-slate-600">Medical Details</p>
                        <p className="text-slate-700 mt-0.5">{fall.medical_details}</p>
                      </div>
                    )}
                    {fall.follow_up_actions && (
                      <div>
                        <p className="font-semibold text-slate-600">Follow-up Actions</p>
                        <p className="text-slate-700 mt-0.5">{fall.follow_up_actions}</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* New Fall Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) setShowForm(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <PersonStanding className="w-5 h-5 text-rose-600" />
              Log New Fall
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* When & Where */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">When & Where</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Date *</Label>
                  <Input
                    type="date"
                    value={form.fall_date}
                    onChange={(e) => updateField('fall_date', e.target.value)}
                    className="h-10 text-sm"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Time</Label>
                  <Input
                    type="time"
                    value={form.fall_time}
                    onChange={(e) => updateField('fall_time', e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Location *</Label>
                <Select value={form.location} onValueChange={(v) => updateField('location', v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* What Happened */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">What Happened</p>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe how the fall occurred..."
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="witnessed"
                  checked={form.witnessed}
                  onCheckedChange={(v) => updateField('witnessed', !!v)}
                />
                <Label htmlFor="witnessed" className="text-sm cursor-pointer">Fall was witnessed</Label>
              </div>
              {form.witnessed && (
                <div>
                  <Label className="text-xs">Witness Name</Label>
                  <Input
                    value={form.witness_name}
                    onChange={(e) => updateField('witness_name', e.target.value)}
                    placeholder="Name of witness"
                    className="h-10 text-sm"
                  />
                </div>
              )}
            </div>

            {/* Injuries */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Injuries</p>
              <div>
                <Label className="text-xs">Injury Type</Label>
                <Select value={form.injuries} onValueChange={(v) => updateField('injuries', v)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select injury type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INJURY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.injuries && form.injuries !== 'none' && (
                <div>
                  <Label className="text-xs">Injury Details</Label>
                  <Textarea
                    value={form.injury_details}
                    onChange={(e) => updateField('injury_details', e.target.value)}
                    placeholder="Describe injuries..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            {/* Contributing Factors */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Contributing Factors</p>
              <div className="grid grid-cols-2 gap-2">
                {CONTRIBUTING_FACTORS.map(cf => (
                  <div key={cf.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`cf-${cf.value}`}
                      checked={(form.contributing_factors || []).includes(cf.value)}
                      onCheckedChange={() => toggleFactor(cf.value)}
                    />
                    <Label htmlFor={`cf-${cf.value}`} className="text-xs cursor-pointer">{cf.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Immediate Action */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Immediate Action</p>
              <Textarea
                value={form.immediate_action}
                onChange={(e) => updateField('immediate_action', e.target.value)}
                placeholder="What action was taken immediately after the fall?"
                rows={2}
                className="text-sm"
              />
            </div>

            {/* Medical */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Medical</p>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="medical_attention"
                  checked={form.medical_attention}
                  onCheckedChange={(v) => updateField('medical_attention', !!v)}
                />
                <Label htmlFor="medical_attention" className="text-sm cursor-pointer">Medical attention required</Label>
              </div>
              {form.medical_attention && (
                <div>
                  <Label className="text-xs">Medical Details</Label>
                  <Textarea
                    value={form.medical_details}
                    onChange={(e) => updateField('medical_details', e.target.value)}
                    placeholder="Details of medical attention..."
                    rows={2}
                    className="text-sm"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="ambulance_called"
                  checked={form.ambulance_called}
                  onCheckedChange={(v) => updateField('ambulance_called', !!v)}
                />
                <Label htmlFor="ambulance_called" className="text-sm cursor-pointer">Ambulance called</Label>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notifications</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="family_notified"
                    checked={form.family_notified}
                    onCheckedChange={(v) => updateField('family_notified', !!v)}
                  />
                  <Label htmlFor="family_notified" className="text-sm cursor-pointer">Family notified</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="gp_notified"
                    checked={form.gp_notified}
                    onCheckedChange={(v) => updateField('gp_notified', !!v)}
                  />
                  <Label htmlFor="gp_notified" className="text-sm cursor-pointer">GP notified</Label>
                </div>
              </div>
            </div>

            {/* Follow Up */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Follow Up</p>
              <Textarea
                value={form.follow_up_actions}
                onChange={(e) => updateField('follow_up_actions', e.target.value)}
                placeholder="Follow-up actions required..."
                rows={2}
                className="text-sm"
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="risk_assessment_updated"
                  checked={form.risk_assessment_updated}
                  onCheckedChange={(v) => updateField('risk_assessment_updated', !!v)}
                />
                <Label htmlFor="risk_assessment_updated" className="text-sm cursor-pointer">Risk assessment updated</Label>
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10 bg-rose-600 hover:bg-rose-700 text-white"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Saving...' : 'Save Fall Record'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

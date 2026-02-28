import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, Info, AlertTriangle } from 'lucide-react';

// NEWS2 parameters and scoring
const RESP_RATE_RANGES = [
  { label: '≤8', value: 3, range: [0, 8] },
  { label: '9-11', value: 1, range: [9, 11] },
  { label: '12-20', value: 0, range: [12, 20] },
  { label: '21-24', value: 2, range: [21, 24] },
  { label: '≥25', value: 3, range: [25, 999] },
];

const SPO2_SCALE1 = [
  { label: '≤91%', value: 3 },
  { label: '92-93%', value: 2 },
  { label: '94-95%', value: 1 },
  { label: '≥96%', value: 0 },
];

const SPO2_SCALE2 = [
  { label: '≤83%', value: 3 },
  { label: '84-85%', value: 2 },
  { label: '86-87%', value: 1 },
  { label: '88-92% (on air) or ≥93 on O₂', value: 0 },
  { label: '93-94% on O₂', value: 1, uniqueKey: 's2_93_94' },
  { label: '95-96% on O₂', value: 2, uniqueKey: 's2_95_96' },
  { label: '≥97% on O₂', value: 3, uniqueKey: 's2_97' },
];

const SYSTOLIC_BP = [
  { label: '≤90', value: 3 },
  { label: '91-100', value: 2 },
  { label: '101-110', value: 1 },
  { label: '111-219', value: 0 },
  { label: '≥220', value: 3, uniqueKey: 'bp_high' },
];

const PULSE_RANGES = [
  { label: '≤40', value: 3 },
  { label: '41-50', value: 1 },
  { label: '51-90', value: 0 },
  { label: '91-110', value: 1, uniqueKey: 'pulse_91' },
  { label: '111-130', value: 2 },
  { label: '≥131', value: 3, uniqueKey: 'pulse_131' },
];

const TEMP_RANGES = [
  { label: '≤35.0°C', value: 3 },
  { label: '35.1-36.0°C', value: 1 },
  { label: '36.1-38.0°C', value: 0 },
  { label: '38.1-39.0°C', value: 1, uniqueKey: 'temp_38' },
  { label: '≥39.1°C', value: 2 },
];

const CONSCIOUSNESS_ACVPU = [
  { label: 'Alert', value: 0 },
  { label: 'Confusion (new)', value: 3, uniqueKey: 'confusion' },
  { label: 'Voice responsive', value: 3, uniqueKey: 'voice' },
  { label: 'Pain responsive', value: 3, uniqueKey: 'pain' },
  { label: 'Unresponsive', value: 3, uniqueKey: 'unresponsive' },
];

const AIR_O2 = [
  { label: 'Air', value: 0 },
  { label: 'Supplemental O₂', value: 2 },
];

const PARAMETERS = [
  { key: 'respiration_rate', label: 'Respiration Rate (breaths/min)', options: RESP_RATE_RANGES, hasInput: true, unit: 'breaths/min' },
  { key: 'spo2_scale', label: 'SpO₂ Scale', isScaleSelector: true },
  { key: 'spo2', label: 'SpO₂ (%)', options: null, hasInput: true, unit: '%' }, // dynamically set
  { key: 'air_or_oxygen', label: 'Air or Oxygen', options: AIR_O2 },
  { key: 'systolic_bp', label: 'Systolic Blood Pressure (mmHg)', options: SYSTOLIC_BP, hasInput: true, unit: 'mmHg' },
  { key: 'pulse', label: 'Pulse (bpm)', options: PULSE_RANGES, hasInput: true, unit: 'bpm' },
  { key: 'consciousness', label: 'Consciousness (ACVPU)', options: CONSCIOUSNESS_ACVPU },
  { key: 'temperature', label: 'Temperature (°C)', options: TEMP_RANGES, hasInput: true, unit: '°C' },
];

function getRiskLevel(totalScore, hasIndividual3) {
  if (totalScore >= 7) return { level: 'high', label: 'High', action: 'Emergency response — urgent clinical review, consider transfer to higher level of care' };
  if (totalScore >= 5) return { level: 'high', label: 'Medium-High', action: 'Urgent response — clinician assessment, consider transfer, increase monitoring frequency to at least hourly' };
  if (hasIndividual3) return { level: 'medium', label: 'Low-Medium', action: 'Urgent ward-based response — clinician to assess within 30 minutes, decide if increased monitoring or urgent escalation needed' };
  if (totalScore >= 1) return { level: 'low', label: 'Low', action: 'Inform registered nurse — continue routine monitoring, minimum 4-6 hourly' };
  return { level: 'low', label: 'Low', action: 'Continue routine monitoring — minimum 12 hourly' };
}

export default function NEWS2Assessment({ serviceUser, onSave, onCancel, existingAssessment }) {
  const existing = existingAssessment?.assessment_data || {};

  const [scores, setScores] = useState(existing.scores || {});
  const [rawValues, setRawValues] = useState(existing.raw_values || {});
  const [spo2Scale, setSpo2Scale] = useState(existing.spo2_scale || 1); // 1 = Scale 1, 2 = Scale 2
  const [notes, setNotes] = useState(existing.notes || '');

  const setScore = (key, value, uniqueKey) => {
    setScores(prev => ({ ...prev, [key]: { value, uniqueKey: uniqueKey || String(value) } }));
  };

  const setRawValue = (key, val) => {
    setRawValues(prev => ({ ...prev, [key]: val }));
  };

  const spo2Options = spo2Scale === 1 ? SPO2_SCALE1 : SPO2_SCALE2;

  const totalScore = useMemo(() => {
    const keys = ['respiration_rate', 'spo2', 'air_or_oxygen', 'systolic_bp', 'pulse', 'consciousness', 'temperature'];
    let total = 0;
    let allAnswered = true;
    for (const key of keys) {
      if (scores[key] !== undefined) {
        total += scores[key].value;
      } else {
        allAnswered = false;
      }
    }
    return { total, allAnswered };
  }, [scores]);

  const hasIndividual3 = useMemo(() => {
    return Object.values(scores).some(s => s.value === 3);
  }, [scores]);

  const risk = totalScore.allAnswered ? getRiskLevel(totalScore.total, hasIndividual3) : null;
  const riskLevel = risk ? (totalScore.total >= 5 ? 'high' : totalScore.total >= 1 || hasIndividual3 ? 'medium' : 'low') : null;

  const canSave = totalScore.allAnswered;

  const handleSave = () => {
    const scoreBreakdown = Object.entries(scores).map(([key, s]) => {
      const param = PARAMETERS.find(p => p.key === key);
      return `${param?.label || key}: ${s.value}`;
    }).join(', ');

    const findings = `NEWS2 Total Score: ${totalScore.total}/20. ${risk.label} clinical risk. ${scoreBreakdown}`;
    const recommendations = risk.action;

    const mappedRisk = totalScore.total >= 7 ? 'very_high' : totalScore.total >= 5 ? 'high' : (hasIndividual3 || totalScore.total >= 1) ? 'medium' : 'low';

    onSave({
      assessment_type: 'news2',
      score: totalScore.total,
      risk_level: mappedRisk,
      findings,
      recommendations,
      next_review_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // Review weekly for NEWS2
      assessment_data: {
        scores,
        raw_values: rawValues,
        spo2_scale: spo2Scale,
        total: totalScore.total,
        has_individual_3: hasIndividual3,
        clinical_response: risk.action,
        notes,
      },
      staff_name: 'Current User',
    });
  };

  const riskBorder = !risk ? 'border-slate-200' :
    totalScore.total >= 7 ? 'border-red-600 bg-red-100' :
    totalScore.total >= 5 ? 'border-red-400 bg-red-50' :
    (hasIndividual3 || totalScore.total >= 1) ? 'border-amber-400 bg-amber-50' :
    'border-green-400 bg-green-50';

  const getParamColour = (key) => {
    if (!scores[key]) return '';
    const v = scores[key].value;
    if (v === 0) return 'text-green-700';
    if (v === 1) return 'text-amber-700';
    if (v === 2) return 'text-orange-700';
    return 'text-red-700';
  };

  return (
    <div className="space-y-4 py-2">
      {/* Info banner */}
      <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">NEWS2 — National Early Warning Score 2</p>
          <p className="mt-0.5">Standardised NHS assessment for detecting acute illness deterioration. Scores 7 physiological parameters to determine clinical risk and escalation response.</p>
        </div>
      </div>

      {/* SpO2 Scale selector */}
      <Card className="p-3">
        <Label className="text-xs font-semibold text-slate-700">SpO₂ Scale Selection</Label>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-2">Use Scale 2 for patients with confirmed hypercapnic respiratory failure (e.g. COPD with target SpO₂ 88-92%)</p>
        <div className="flex gap-2">
          {[1, 2].map(scale => (
            <button key={scale} onClick={() => { setSpo2Scale(scale); setScores(prev => { const n = { ...prev }; delete n.spo2; return n; }); }}
              className={`text-xs px-4 py-2 rounded-lg border transition-all font-medium ${spo2Scale === scale ? 'bg-rose-100 border-rose-300 text-rose-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              Scale {scale} {scale === 1 ? '(Standard)' : '(Hypercapnic)'}
            </button>
          ))}
        </div>
      </Card>

      {/* Parameter cards */}
      {PARAMETERS.filter(p => !p.isScaleSelector).map(param => {
        const options = param.key === 'spo2' ? spo2Options : param.options;
        if (!options) return null;

        return (
          <Card key={param.key} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold text-slate-700">{param.label}</Label>
              {scores[param.key] !== undefined && (
                <Badge className={`text-[10px] px-1.5 py-0 ${
                  scores[param.key].value === 0 ? 'bg-green-100 text-green-700 border-green-200' :
                  scores[param.key].value === 1 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                  scores[param.key].value === 2 ? 'bg-orange-100 text-orange-700 border-orange-200' :
                  'bg-red-100 text-red-700 border-red-200'
                } border`}>
                  Score: {scores[param.key].value}
                </Badge>
              )}
            </div>

            {/* Raw value input */}
            {param.hasInput && (
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={rawValues[param.key] || ''}
                    onChange={e => setRawValue(param.key, e.target.value)}
                    placeholder={`Enter ${param.unit}`}
                    className="h-8 text-xs w-32"
                    step={param.key === 'temperature' ? '0.1' : '1'}
                  />
                  <span className="text-xs text-slate-500">{param.unit}</span>
                </div>
              </div>
            )}

            {/* Score options */}
            <div className="flex flex-wrap gap-1.5">
              {options.map((opt, idx) => {
                const optKey = opt.uniqueKey || String(opt.value);
                const isSelected = scores[param.key]?.uniqueKey === optKey;
                return (
                  <button key={optKey + idx} onClick={() => setScore(param.key, opt.value, optKey)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${isSelected
                      ? opt.value === 0 ? 'bg-green-100 border-green-400 text-green-800 font-medium'
                      : opt.value === 1 ? 'bg-amber-100 border-amber-400 text-amber-800 font-medium'
                      : opt.value === 2 ? 'bg-orange-100 border-orange-400 text-orange-800 font-medium'
                      : 'bg-red-100 border-red-400 text-red-800 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="font-semibold mr-1">{opt.value}</span> {opt.label}
                  </button>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Notes */}
      <div>
        <Label className="text-xs font-medium">Clinical Notes</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional clinical observations..." className="text-xs min-h-[60px] mt-1" />
      </div>

      {/* Score summary */}
      <Card className={`p-3 border-2 ${riskBorder}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-700">NEWS2 Total Score</p>
            <p className={`text-2xl font-bold mt-0.5 ${getParamColour('_total') || (totalScore.total >= 7 ? 'text-red-700' : totalScore.total >= 5 ? 'text-red-600' : totalScore.total >= 1 ? 'text-amber-700' : 'text-green-700')}`}>
              {totalScore.allAnswered ? totalScore.total : '—'} <span className="text-sm font-normal text-slate-400">/ 20</span>
            </p>
            {risk && (
              <>
                <p className="text-xs font-medium mt-1 text-slate-700">Clinical Response:</p>
                <p className="text-xs text-slate-600 mt-0.5">{risk.action}</p>
              </>
            )}
            {hasIndividual3 && totalScore.total < 5 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-700 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Individual parameter score of 3 — triggers urgent response
              </div>
            )}
          </div>
          {risk && (
            <Badge className={`text-xs px-2 py-0.5 ${
              totalScore.total >= 7 ? 'bg-red-200 text-red-800' :
              totalScore.total >= 5 ? 'bg-red-100 text-red-700' :
              (hasIndividual3 || totalScore.total >= 1) ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700'
            }`}>
              {risk.label} Risk
            </Badge>
          )}
        </div>

        {/* Parameter breakdown */}
        {totalScore.allAnswered && (
          <div className="mt-3 pt-2 border-t border-slate-200">
            <div className="grid grid-cols-4 gap-x-3 gap-y-1 text-[11px]">
              {Object.entries(scores).map(([key, s]) => {
                const param = PARAMETERS.find(p => p.key === key);
                const shortLabel = param?.label?.split('(')[0]?.trim() || key;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-slate-500 truncate">{shortLabel}</span>
                    <span className={`font-bold ml-1 ${
                      s.value === 0 ? 'text-green-600' : s.value === 1 ? 'text-amber-600' : s.value === 2 ? 'text-orange-600' : 'text-red-600'
                    }`}>{s.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" onClick={onCancel} className="text-xs h-8">
          <X className="w-3.5 h-3.5 mr-1" /> Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!canSave} className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8">
          <Save className="w-3.5 h-3.5 mr-1" /> Save Assessment
        </Button>
      </div>
    </div>
  );
}

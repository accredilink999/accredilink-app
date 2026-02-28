import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Footprints, Save, X } from 'lucide-react';

const FACTORS = [
  {
    key: 'previous_falls',
    label: 'Previous Falls (last 12 months)',
    description: 'Number of falls in the past 12 months',
    options: [
      { label: 'No falls', value: 0 },
      { label: 'One fall', value: 1 },
      { label: 'Two or more falls', value: 2 },
    ],
  },
  {
    key: 'medication',
    label: 'Medication',
    description: 'Risk medications: sedatives, antihypertensives, diuretics, antidepressants',
    options: [
      { label: 'No risk medications', value: 0 },
      { label: '1-3 risk medications', value: 1 },
      { label: '4+ risk medications', value: 2 },
    ],
  },
  {
    key: 'mobility',
    label: 'Mobility',
    description: 'Current mobility status and aids used',
    options: [
      { label: 'Fully mobile', value: 0 },
      { label: 'Uses walking aid', value: 1 },
      { label: 'Requires assistance to mobilise', value: 2 },
      { label: 'Bedbound / chairbound', value: 3 },
    ],
  },
  {
    key: 'cognition',
    label: 'Cognition',
    description: 'Mental state and orientation',
    options: [
      { label: 'Orientated', value: 0 },
      { label: 'Mild confusion at times', value: 1 },
      { label: 'Significant confusion / dementia', value: 2 },
    ],
  },
  {
    key: 'vision',
    label: 'Vision',
    description: 'Visual acuity including with glasses if worn',
    options: [
      { label: 'Adequate (with or without glasses)', value: 0 },
      { label: 'Impaired', value: 1 },
      { label: 'Severely impaired', value: 2 },
    ],
  },
  {
    key: 'environment',
    label: 'Environment',
    description: 'Home or care environment hazards',
    options: [
      { label: 'Safe environment', value: 0 },
      { label: 'Some hazards identified', value: 1 },
      { label: 'Significant hazards', value: 2 },
    ],
  },
  {
    key: 'continence',
    label: 'Continence',
    description: 'Urinary and/or faecal continence status',
    options: [
      { label: 'Continent', value: 0 },
      { label: 'Occasionally incontinent', value: 1 },
      { label: 'Frequently incontinent', value: 2 },
    ],
  },
];

const RISK_STYLES = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200',
  very_high: 'bg-red-200 text-red-800 border-red-300',
};

const RISK_LABELS = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  very_high: 'Very High Risk',
};

function getRiskLevel(score) {
  if (score <= 3) return 'low';
  if (score <= 7) return 'medium';
  if (score <= 11) return 'high';
  return 'very_high';
}

export default function FallsRiskAssessment({ serviceUser, onSave, onCancel, existingAssessment }) {
  const existingData = existingAssessment?.assessment_data || {};

  const defaults = {};
  FACTORS.forEach(f => { defaults[f.key] = existingData[f.key] ?? null; });
  const defaultNotes = {};
  FACTORS.forEach(f => { defaultNotes[f.key] = existingData[`${f.key}_notes`] || ''; });

  const [scores, setScores] = useState(defaults);
  const [factorNotes, setFactorNotes] = useState(defaultNotes);
  const [generalNotes, setGeneralNotes] = useState(existingAssessment?.findings || '');

  const totalScore = useMemo(() => {
    return FACTORS.reduce((sum, f) => {
      const val = scores[f.key];
      return sum + (val !== null && val !== undefined ? Number(val) : 0);
    }, 0);
  }, [scores]);

  const riskLevel = useMemo(() => getRiskLevel(totalScore), [totalScore]);

  const handleScoreChange = (factorKey, value) => {
    setScores(prev => ({ ...prev, [factorKey]: Number(value) }));
  };

  const handleNoteChange = (factorKey, value) => {
    setFactorNotes(prev => ({ ...prev, [factorKey]: value }));
  };

  const handleSave = () => {
    const assessmentData = {};
    FACTORS.forEach(f => {
      assessmentData[f.key] = scores[f.key] ?? 0;
      if (factorNotes[f.key]) {
        assessmentData[`${f.key}_notes`] = factorNotes[f.key];
      }
    });

    const riskLabel = RISK_LABELS[riskLevel];
    const identifiedRisks = FACTORS
      .filter(f => (scores[f.key] || 0) > 0)
      .map(f => f.label)
      .join(', ');
    const autoFindings = `Falls risk score: ${totalScore} - ${riskLabel}. ${identifiedRisks ? 'Risk factors: ' + identifiedRisks + '.' : 'No risk factors identified.'} ${generalNotes ? 'Notes: ' + generalNotes : ''}`.trim();

    onSave({
      assessment_type: 'falls_risk',
      score: totalScore,
      risk_level: riskLevel,
      assessment_data: assessmentData,
      findings: autoFindings,
      recommendations: riskLevel === 'low' ? 'Continue general falls prevention advice. Encourage regular exercise and safe footwear.' :
        riskLevel === 'medium' ? 'Implement falls prevention care plan. Review medications. Consider referral to physiotherapy. Ensure adequate lighting and remove trip hazards.' :
        riskLevel === 'high' ? 'Urgent falls prevention interventions required. Multidisciplinary review. Physiotherapy referral. Medication review. Environmental assessment. Consider sensor mats/alarms.' :
        'Immediate multidisciplinary review. Maximum falls prevention interventions. 1:1 supervision may be required. Urgent GP/specialist referral. Full environmental risk assessment.',
      next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const allAnswered = FACTORS.every(f => scores[f.key] !== null && scores[f.key] !== undefined);

  return (
    <div className="space-y-3">
      {/* Factor Cards */}
      {FACTORS.map((factor, idx) => (
        <Card key={factor.key} className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              {idx + 1}
            </div>
            <Label className="text-sm font-semibold text-slate-700">{factor.label}</Label>
            {scores[factor.key] !== null && scores[factor.key] !== undefined && (
              <Badge className="ml-auto text-[10px] px-1.5 py-0 border bg-slate-100 text-slate-600">
                {scores[factor.key]}
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-2 ml-7">{factor.description}</p>

          <div className="space-y-1 ml-7">
            {factor.options.map((opt) => (
              <label
                key={`${factor.key}-${opt.value}-${opt.label}`}
                className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer border transition-colors
                  ${scores[factor.key] === opt.value ? 'border-rose-200 bg-rose-50' : 'border-transparent hover:bg-slate-50'}`}
                onClick={() => handleScoreChange(factor.key, opt.value)}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                  ${scores[factor.key] === opt.value ? 'border-rose-600' : 'border-slate-300'}`}>
                  {scores[factor.key] === opt.value && <div className="w-2 h-2 rounded-full bg-rose-600" />}
                </div>
                <span className="text-sm text-slate-700 flex-1">{opt.label}</span>
                <span className="text-xs font-mono text-slate-400">({opt.value})</span>
              </label>
            ))}
          </div>

          {/* Per-factor notes */}
          <div className="mt-2 ml-7">
            <Input
              value={factorNotes[factor.key]}
              onChange={(e) => handleNoteChange(factor.key, e.target.value)}
              placeholder="Notes for this factor (optional)..."
              className="text-xs h-7 border-dashed"
            />
          </div>
        </Card>
      ))}

      {/* General Notes */}
      <Card className="p-3">
        <Label className="text-sm font-semibold text-slate-700 mb-2 block">General Notes</Label>
        <Textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="Any additional observations about falls risk..."
          className="text-sm min-h-[60px]"
        />
      </Card>

      {/* Running Total */}
      <Card className={`p-3 border-2 ${
        riskLevel === 'low' ? 'border-green-300 bg-green-50' :
        riskLevel === 'medium' ? 'border-amber-300 bg-amber-50' :
        riskLevel === 'high' ? 'border-red-300 bg-red-50' :
        'border-red-400 bg-red-100'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Total Falls Risk Score</p>
            <p className="text-2xl font-bold mt-0.5">{totalScore}</p>
          </div>
          <div className="text-right">
            <Badge className={`text-xs px-2 py-0.5 border ${RISK_STYLES[riskLevel]}`}>
              {RISK_LABELS[riskLevel]}
            </Badge>
            <p className="text-[11px] text-slate-500 mt-1">
              {riskLevel === 'low' && '0-3: Low risk'}
              {riskLevel === 'medium' && '4-7: Medium risk'}
              {riskLevel === 'high' && '8-11: High risk'}
              {riskLevel === 'very_high' && '12+: Very high risk'}
            </p>
          </div>
        </div>

        {/* Identified risks summary */}
        {FACTORS.some(f => (scores[f.key] || 0) > 0) && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Identified risk factors:</p>
            <div className="flex flex-wrap gap-1">
              {FACTORS.filter(f => (scores[f.key] || 0) > 0).map(f => (
                <Badge key={f.key} className="text-[10px] px-1.5 py-0 border bg-red-50 text-red-600 border-red-200">
                  {f.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1 pb-2">
        <Button
          variant="outline"
          className="flex-1 h-10 text-sm"
          onClick={onCancel}
        >
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button
          className="flex-1 h-10 text-sm bg-rose-600 hover:bg-rose-700 text-white"
          onClick={handleSave}
          disabled={!allAnswered}
        >
          <Save className="w-4 h-4 mr-1" />
          Save Assessment
        </Button>
      </div>
    </div>
  );
}


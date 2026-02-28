import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Save, X } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'age',
    label: 'Age',
    options: [
      { label: '14-49', value: 1 },
      { label: '50-64', value: 2 },
      { label: '65-74', value: 3 },
      { label: '75-80', value: 4 },
      { label: '81+', value: 5 },
    ],
  },
  {
    key: 'build',
    label: 'Build / Weight for Height',
    options: [
      { label: 'Average', value: 0 },
      { label: 'Above average', value: 1 },
      { label: 'Obese', value: 2 },
      { label: 'Below average', value: 3 },
    ],
  },
  {
    key: 'skin_type',
    label: 'Skin Type / Visual Risk Areas',
    options: [
      { label: 'Healthy', value: 0 },
      { label: 'Tissue paper', value: 1 },
      { label: 'Dry', value: 1, uniqueKey: 'dry' },
      { label: 'Oedematous', value: 1, uniqueKey: 'oedematous' },
      { label: 'Clammy / pyrexia', value: 1, uniqueKey: 'clammy' },
      { label: 'Discoloured (Grade 1)', value: 2 },
      { label: 'Broken / spot (Grade 2-4)', value: 3 },
    ],
  },
  {
    key: 'mobility',
    label: 'Mobility',
    options: [
      { label: 'Fully mobile', value: 0 },
      { label: 'Restless / fidgety', value: 1 },
      { label: 'Apathetic', value: 2 },
      { label: 'Restricted', value: 3 },
      { label: 'Bedbound (e.g. traction)', value: 4 },
      { label: 'Chairbound', value: 5 },
    ],
  },
  {
    key: 'appetite',
    label: 'Appetite / Nutritional Intake',
    options: [
      { label: 'Average', value: 0 },
      { label: 'Poor', value: 1 },
      { label: 'NG tube / fluids only', value: 2 },
      { label: 'NBM / anorexic', value: 3 },
    ],
  },
  {
    key: 'continence',
    label: 'Continence',
    options: [
      { label: 'Complete / catheterised', value: 0 },
      { label: 'Occasionally incontinent', value: 1 },
      { label: 'Catheter / incontinent of faeces', value: 2 },
      { label: 'Doubly incontinent', value: 3 },
    ],
  },
  {
    key: 'tissue_malnutrition',
    label: 'Tissue Malnutrition',
    options: [
      { label: 'None', value: 0 },
      { label: 'Smoking', value: 1 },
      { label: 'Anaemia (Hb < 8)', value: 2 },
      { label: 'Cardiac failure', value: 5 },
      { label: 'Peripheral vascular disease', value: 5, uniqueKey: 'pvd' },
      { label: 'Terminal cachexia', value: 8 },
    ],
  },
  {
    key: 'neurological',
    label: 'Neurological Deficit',
    options: [
      { label: 'None', value: 0 },
      { label: 'Diabetes / MS / CVA (mild)', value: 4 },
      { label: 'Diabetes / MS / CVA (moderate)', value: 5 },
      { label: 'Motor / sensory / paraplegia', value: 6 },
    ],
  },
  {
    key: 'surgery_trauma',
    label: 'Major Surgery / Trauma',
    options: [
      { label: 'None', value: 0 },
      { label: 'Orthopaedic below waist / spinal', value: 5 },
      { label: 'On operating table > 2 hours', value: 5, uniqueKey: 'table' },
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
  low: 'Not at Risk',
  medium: 'At Risk',
  high: 'High Risk',
  very_high: 'Very High Risk',
};

function getRiskLevel(score) {
  if (score <= 9) return 'low';
  if (score <= 14) return 'medium';
  if (score <= 19) return 'high';
  return 'very_high';
}

export default function WaterlowAssessment({ serviceUser, onSave, onCancel, existingAssessment }) {
  const defaults = {};
  CATEGORIES.forEach(c => { defaults[c.key] = null; });

  const [scores, setScores] = useState(existingAssessment?.assessment_data || defaults);
  const [notes, setNotes] = useState(existingAssessment?.findings || '');

  const totalScore = useMemo(() => {
    return CATEGORIES.reduce((sum, cat) => {
      const val = scores[cat.key];
      return sum + (val !== null && val !== undefined ? Number(val) : 0);
    }, 0);
  }, [scores]);

  const riskLevel = useMemo(() => getRiskLevel(totalScore), [totalScore]);

  const handleChange = (categoryKey, value) => {
    setScores(prev => ({ ...prev, [categoryKey]: Number(value) }));
  };

  const handleSave = () => {
    const breakdown = {};
    CATEGORIES.forEach(cat => {
      breakdown[cat.key] = scores[cat.key] ?? 0;
    });

    const riskLabel = RISK_LABELS[riskLevel];
    const autoFindings = `Waterlow score: ${totalScore} - ${riskLabel}. ${notes ? 'Notes: ' + notes : ''}`.trim();

    onSave({
      assessment_type: 'waterlow',
      score: totalScore,
      risk_level: riskLevel,
      assessment_data: { ...scores, breakdown },
      findings: autoFindings,
      recommendations: riskLevel === 'low' ? 'Continue routine skin checks.' :
        riskLevel === 'medium' ? 'Implement pressure area care plan. Consider pressure-relieving equipment.' :
        riskLevel === 'high' ? 'Urgent pressure area care plan required. Pressure-relieving mattress and cushion. Increase repositioning frequency.' :
        'Immediate specialist referral. Maximum pressure relief interventions. 2-hourly repositioning minimum.',
      next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const allAnswered = CATEGORIES.every(c => scores[c.key] !== null && scores[c.key] !== undefined);

  return (
    <div className="space-y-3">
      {/* Category Cards */}
      {CATEGORIES.map((category) => (
        <Card key={category.key} className="p-3">
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">{category.label}</Label>
          <RadioGroup
            value={scores[category.key] !== null && scores[category.key] !== undefined ? String(scores[category.key]) : undefined}
            onValueChange={(val) => handleChange(category.key, val)}
            className="gap-1.5"
          >
            {category.options.map((opt, idx) => {
              const radioValue = String(opt.value) + (opt.uniqueKey ? `_${opt.uniqueKey}` : idx > 0 && category.options[idx - 1]?.value === opt.value && !opt.uniqueKey ? `_${idx}` : '');
              // Use a stable unique value for radio that maps back to the numeric score
              const uniqueRadioValue = `${opt.value}_${opt.uniqueKey || opt.label.replace(/\s/g, '_')}`;
              return (
                <label
                  key={uniqueRadioValue}
                  className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer border transition-colors
                    ${scores[category.key] === opt.value && (scores[`${category.key}_selected`] === uniqueRadioValue || (!scores[`${category.key}_selected`] && scores[category.key] === opt.value))
                      ? 'border-rose-200 bg-rose-50'
                      : 'border-transparent hover:bg-slate-50'
                    }`}
                  onClick={() => {
                    setScores(prev => ({
                      ...prev,
                      [category.key]: opt.value,
                      [`${category.key}_selected`]: uniqueRadioValue,
                    }));
                  }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                    ${scores[`${category.key}_selected`] === uniqueRadioValue
                      ? 'border-rose-600'
                      : 'border-slate-300'
                    }`}
                  >
                    {scores[`${category.key}_selected`] === uniqueRadioValue && (
                      <div className="w-2 h-2 rounded-full bg-rose-600" />
                    )}
                  </div>
                  <span className="text-sm text-slate-700 flex-1">{opt.label}</span>
                  <span className="text-xs font-mono text-slate-400 shrink-0">({opt.value})</span>
                </label>
              );
            })}
          </RadioGroup>
        </Card>
      ))}

      {/* Additional Notes */}
      <Card className="p-3">
        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Additional Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional observations or context..."
          className="text-sm min-h-[60px]"
        />
      </Card>

      {/* Running Total & Risk */}
      <Card className={`p-3 border-2 ${RISK_STYLES[riskLevel]?.includes('bg-') ? '' : ''} ${riskLevel === 'low' ? 'border-green-300 bg-green-50' : riskLevel === 'medium' ? 'border-amber-300 bg-amber-50' : riskLevel === 'high' ? 'border-red-300 bg-red-50' : 'border-red-400 bg-red-100'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Total Score</p>
            <p className="text-2xl font-bold mt-0.5">{totalScore}</p>
          </div>
          <div className="text-right">
            <Badge className={`text-xs px-2 py-0.5 border ${RISK_STYLES[riskLevel]}`}>
              {RISK_LABELS[riskLevel]}
            </Badge>
            <p className="text-[11px] text-slate-500 mt-1">
              {riskLevel === 'low' && '0-9: Not at risk'}
              {riskLevel === 'medium' && '10-14: At risk'}
              {riskLevel === 'high' && '15-19: High risk'}
              {riskLevel === 'very_high' && '20+: Very high risk'}
            </p>
          </div>
        </div>
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

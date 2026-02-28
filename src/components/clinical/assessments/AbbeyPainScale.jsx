import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Frown, Save, X } from 'lucide-react';

const INDICATORS = [
  {
    key: 'vocalisation',
    label: '1. Vocalisation',
    description: 'Whimpering, groaning, crying',
    examples: {
      0: 'Absent - no vocalisation',
      1: 'Mild - occasional whimper or groan',
      2: 'Moderate - frequent moaning or calling out',
      3: 'Severe - continuous crying, screaming',
    },
  },
  {
    key: 'facial_expression',
    label: '2. Facial Expression',
    description: 'Looking tense, frowning, grimacing, looking frightened',
    examples: {
      0: 'Absent - relaxed face',
      1: 'Mild - occasional frown or tense expression',
      2: 'Moderate - frequent frowning or grimacing',
      3: 'Severe - continuous grimace, frightened look',
    },
  },
  {
    key: 'body_language',
    label: '3. Change in Body Language',
    description: 'Fidgeting, rocking, guarding part of body, withdrawn',
    examples: {
      0: 'Absent - relaxed body position',
      1: 'Mild - occasional fidgeting or guarding',
      2: 'Moderate - frequent restless movement, guarding',
      3: 'Severe - rigid, clenched fists, knees drawn up, withdrawn',
    },
  },
  {
    key: 'behavioural_change',
    label: '4. Behavioural Change',
    description: 'Increased confusion, refusing to eat, alteration in usual patterns',
    examples: {
      0: 'Absent - no change from usual behaviour',
      1: 'Mild - minor changes in routine behaviour',
      2: 'Moderate - refusing food/drink, increased confusion',
      3: 'Severe - major behaviour change, aggression, complete withdrawal',
    },
  },
  {
    key: 'physiological_change',
    label: '5. Physiological Change',
    description: 'Temperature, pulse or blood pressure outside normal limits, perspiring, flushing or pallor',
    examples: {
      0: 'Absent - all observations within normal limits',
      1: 'Mild - slight changes in one observation',
      2: 'Moderate - changes in two or more observations',
      3: 'Severe - significant changes, perspiring, flushing or pallor',
    },
  },
  {
    key: 'physical_changes',
    label: '6. Physical Changes',
    description: 'Skin tears, pressure areas, arthritis, contractures, previous injuries',
    examples: {
      0: 'Absent - no physical issues identified',
      1: 'Mild - minor issues noted',
      2: 'Moderate - several physical issues contributing to pain',
      3: 'Severe - major physical issues likely causing significant pain',
    },
  },
];

const SCORE_LABELS = ['Absent (0)', 'Mild (1)', 'Moderate (2)', 'Severe (3)'];

const RISK_STYLES = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200',
  very_high: 'bg-red-200 text-red-800 border-red-300',
};

const RISK_LABELS = {
  low: 'No Pain',
  medium: 'Mild Pain',
  high: 'Moderate Pain',
  very_high: 'Severe Pain',
};

function getRiskLevel(score) {
  if (score <= 2) return 'low';
  if (score <= 7) return 'medium';
  if (score <= 13) return 'high';
  return 'very_high';
}

export default function AbbeyPainScale({ serviceUser, onSave, onCancel, existingAssessment }) {
  const existingData = existingAssessment?.assessment_data || {};

  const defaults = {};
  INDICATORS.forEach(i => { defaults[i.key] = existingData[i.key] ?? null; });

  const [scores, setScores] = useState(defaults);
  const [notes, setNotes] = useState(existingAssessment?.findings || '');
  const [painType, setPainType] = useState(existingData.pain_type || '');

  const totalScore = useMemo(() => {
    return INDICATORS.reduce((sum, i) => {
      const val = scores[i.key];
      return sum + (val !== null && val !== undefined ? Number(val) : 0);
    }, 0);
  }, [scores]);

  const riskLevel = useMemo(() => getRiskLevel(totalScore), [totalScore]);

  const handleScoreChange = (indicatorKey, value) => {
    setScores(prev => ({ ...prev, [indicatorKey]: Number(value) }));
  };

  const handleSave = () => {
    const assessmentData = {};
    INDICATORS.forEach(i => {
      assessmentData[i.key] = scores[i.key] ?? 0;
    });
    assessmentData.pain_type = painType;

    const riskLabel = RISK_LABELS[riskLevel];
    const autoFindings = `Abbey Pain Scale score: ${totalScore}/18 - ${riskLabel}. ${painType ? 'Pain type: ' + painType + '.' : ''} ${notes ? 'Notes: ' + notes : ''}`.trim();

    onSave({
      assessment_type: 'abbey_pain',
      score: totalScore,
      risk_level: riskLevel,
      assessment_data: assessmentData,
      findings: autoFindings,
      recommendations: riskLevel === 'low' ? 'No pain indicators observed. Continue to monitor and reassess regularly.' :
        riskLevel === 'medium' ? 'Mild pain indicators present. Consider non-pharmacological interventions. Reassess after intervention. Discuss with GP if persistent.' :
        riskLevel === 'high' ? 'Moderate pain indicators. Discuss pain management with GP. Consider analgesic review. Implement comfort measures. Reassess after intervention.' :
        'Severe pain indicators. Urgent GP review required. Consider emergency pain relief. Close monitoring. Reassess within 24 hours of intervention.',
      next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const allAnswered = INDICATORS.every(i => scores[i.key] !== null && scores[i.key] !== undefined);

  return (
    <div className="space-y-3">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Abbey Pain Scale</span> is designed for assessing pain in people who cannot verbalise their pain,
          including those with dementia or cognitive impairment. Observe the person at rest and during movement.
        </p>
      </div>

      {/* Pain Type */}
      <Card className="p-3">
        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Type of Pain</Label>
        <div className="flex flex-wrap gap-2">
          {['Chronic', 'Acute', 'Acute on chronic'].map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={painType === type ? "default" : "outline"}
              className={`text-xs h-7 ${painType === type ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
              onClick={() => setPainType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      </Card>

      {/* Indicator Cards */}
      {INDICATORS.map((indicator) => (
        <Card key={indicator.key} className="p-3">
          <Label className="text-sm font-semibold text-slate-700 block">{indicator.label}</Label>
          <p className="text-xs text-slate-500 mb-2">{indicator.description}</p>

          <div className="space-y-1">
            {[0, 1, 2, 3].map((value) => (
              <label
                key={`${indicator.key}-${value}`}
                className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer border transition-colors
                  ${scores[indicator.key] === value ? 'border-rose-200 bg-rose-50' : 'border-transparent hover:bg-slate-50'}`}
                onClick={() => handleScoreChange(indicator.key, value)}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                  ${scores[indicator.key] === value ? 'border-rose-600' : 'border-slate-300'}`}>
                  {scores[indicator.key] === value && <div className="w-2 h-2 rounded-full bg-rose-600" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm text-slate-700 font-medium">{SCORE_LABELS[value]}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{indicator.examples[value]}</p>
                </div>
              </label>
            ))}
          </div>
        </Card>
      ))}

      {/* Additional Notes */}
      <Card className="p-3">
        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Additional Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Context about the observation, time of day, activity during assessment..."
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
            <p className="text-sm font-semibold text-slate-700">Total Pain Score</p>
            <p className="text-2xl font-bold mt-0.5">{totalScore} <span className="text-sm font-normal text-slate-500">/ 18</span></p>
          </div>
          <div className="text-right">
            <Badge className={`text-xs px-2 py-0.5 border ${RISK_STYLES[riskLevel]}`}>
              {RISK_LABELS[riskLevel]}
            </Badge>
            <p className="text-[11px] text-slate-500 mt-1">
              {riskLevel === 'low' && '0-2: No pain'}
              {riskLevel === 'medium' && '3-7: Mild pain'}
              {riskLevel === 'high' && '8-13: Moderate pain'}
              {riskLevel === 'very_high' && '14-18: Severe pain'}
            </p>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-x-2 gap-y-1 text-[11px] text-slate-500">
          {INDICATORS.map(i => (
            <div key={i.key}>
              {i.label.replace(/^\d+\.\s*/, '')}: <span className="font-medium text-slate-700">{scores[i.key] ?? '-'}</span>
            </div>
          ))}
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

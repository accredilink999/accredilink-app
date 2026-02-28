import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Accessibility, Save, X } from 'lucide-react';

const ACTIVITIES = [
  {
    key: 'feeding',
    label: '1. Feeding',
    options: [
      { label: 'Unable', value: 0 },
      { label: 'Needs help cutting, spreading butter, etc.', value: 5 },
      { label: 'Independent', value: 10 },
    ],
  },
  {
    key: 'bathing',
    label: '2. Bathing',
    options: [
      { label: 'Dependent', value: 0 },
      { label: 'Independent (or in shower)', value: 5 },
    ],
  },
  {
    key: 'grooming',
    label: '3. Grooming',
    options: [
      { label: 'Needs help with personal care', value: 0 },
      { label: 'Independent (face/hair/teeth/shaving)', value: 5 },
    ],
  },
  {
    key: 'dressing',
    label: '4. Dressing',
    options: [
      { label: 'Dependent', value: 0 },
      { label: 'Needs help but can do about half unaided', value: 5 },
      { label: 'Independent (including buttons, zips, laces)', value: 10 },
    ],
  },
  {
    key: 'bowels',
    label: '5. Bowels',
    options: [
      { label: 'Incontinent (or needs to be given enema)', value: 0 },
      { label: 'Occasional accident', value: 5 },
      { label: 'Continent', value: 10 },
    ],
  },
  {
    key: 'bladder',
    label: '6. Bladder',
    options: [
      { label: 'Incontinent or catheterised and unable to manage alone', value: 0 },
      { label: 'Occasional accident', value: 5 },
      { label: 'Continent (or able to manage catheter independently)', value: 10 },
    ],
  },
  {
    key: 'toilet_use',
    label: '7. Toilet Use',
    options: [
      { label: 'Dependent', value: 0 },
      { label: 'Needs some help but can do something alone', value: 5 },
      { label: 'Independent (on and off, dressing, wiping)', value: 10 },
    ],
  },
  {
    key: 'transfers',
    label: '8. Transfers (bed to chair and back)',
    options: [
      { label: 'Unable, no sitting balance', value: 0 },
      { label: 'Major help (1-2 people, physical), can sit', value: 5 },
      { label: 'Minor help (verbal or physical)', value: 10 },
      { label: 'Independent', value: 15 },
    ],
  },
  {
    key: 'mobility',
    label: '9. Mobility (on level surfaces)',
    options: [
      { label: 'Immobile or less than 50 yards', value: 0 },
      { label: 'Wheelchair independent, including corners, >50 yards', value: 5 },
      { label: 'Walks with help of one person (verbal or physical) >50 yards', value: 10 },
      { label: 'Independent (but may use aid e.g. stick) >50 yards', value: 15 },
    ],
  },
  {
    key: 'stairs',
    label: '10. Stairs',
    options: [
      { label: 'Unable', value: 0 },
      { label: 'Needs help (verbal, physical, carrying aid)', value: 5 },
      { label: 'Independent', value: 10 },
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
  low: 'Slight / Independent',
  medium: 'Moderate Dependence',
  high: 'Severe Dependence',
  very_high: 'Total Dependence',
};

// Barthel: lower score = more dependent = higher risk
function getRiskLevel(score) {
  if (score >= 91) return 'low';
  if (score >= 61) return 'medium';
  if (score >= 21) return 'high';
  return 'very_high';
}

function getDependencyLabel(score) {
  if (score >= 91) return 'Slight dependence or independent';
  if (score >= 61) return 'Moderate dependence';
  if (score >= 21) return 'Severe dependence';
  return 'Total dependence';
}

export default function BarthelIndex({ serviceUser, onSave, onCancel, existingAssessment }) {
  const existingData = existingAssessment?.assessment_data || {};

  const defaults = {};
  ACTIVITIES.forEach(a => { defaults[a.key] = existingData[a.key] ?? null; });

  const [scores, setScores] = useState(defaults);
  const [notes, setNotes] = useState(existingAssessment?.findings || '');

  const totalScore = useMemo(() => {
    return ACTIVITIES.reduce((sum, a) => {
      const val = scores[a.key];
      return sum + (val !== null && val !== undefined ? Number(val) : 0);
    }, 0);
  }, [scores]);

  const riskLevel = useMemo(() => getRiskLevel(totalScore), [totalScore]);

  const handleScoreChange = (activityKey, value) => {
    setScores(prev => ({ ...prev, [activityKey]: Number(value) }));
  };

  const handleSave = () => {
    const assessmentData = {};
    ACTIVITIES.forEach(a => {
      assessmentData[a.key] = scores[a.key] ?? 0;
    });

    const depLabel = getDependencyLabel(totalScore);
    const lowScoreAreas = ACTIVITIES
      .filter(a => {
        const maxScore = Math.max(...a.options.map(o => o.value));
        return (scores[a.key] ?? 0) < maxScore;
      })
      .map(a => a.label.replace(/^\d+\.\s*/, '').replace(/\s*\(.*\)/, ''));

    const autoFindings = `Barthel Index score: ${totalScore}/100 - ${depLabel}. ${
      lowScoreAreas.length > 0
        ? 'Areas needing support: ' + lowScoreAreas.join(', ') + '.'
        : 'Independent in all areas.'
    } ${notes ? 'Notes: ' + notes : ''}`.trim();

    onSave({
      assessment_type: 'barthel',
      score: totalScore,
      risk_level: riskLevel,
      assessment_data: assessmentData,
      findings: autoFindings,
      recommendations: riskLevel === 'low' ? 'Largely independent. Encourage maintenance of current abilities. Review support needs periodically.' :
        riskLevel === 'medium' ? 'Moderate support needs. Care plan should focus on maintaining independence where possible. Consider occupational therapy referral for aids/adaptations.' :
        riskLevel === 'high' ? 'Significant support needs. Comprehensive care plan required. OT and physiotherapy referrals. Regular reassessment of care package.' :
        'Full assistance required for most/all activities. Maximum care package. Consider specialist placements. Multidisciplinary team involvement essential.',
      next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const allAnswered = ACTIVITIES.every(a => scores[a.key] !== null && scores[a.key] !== undefined);

  // Calculate completion progress
  const answeredCount = ACTIVITIES.filter(a => scores[a.key] !== null && scores[a.key] !== undefined).length;

  return (
    <div className="space-y-3">
      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Barthel Index</span> measures functional independence in activities of daily living.
          Score 0-100 where higher scores indicate greater independence. Base the score on what the person actually does, not what they can do.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-100 rounded-full h-1.5">
          <div
            className="bg-rose-500 rounded-full h-1.5 transition-all"
            style={{ width: `${(answeredCount / ACTIVITIES.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 shrink-0">{answeredCount}/{ACTIVITIES.length}</span>
      </div>

      {/* Activity Cards */}
      {ACTIVITIES.map((activity) => (
        <Card key={activity.key} className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Label className="text-sm font-semibold text-slate-700">{activity.label}</Label>
            {scores[activity.key] !== null && scores[activity.key] !== undefined && (
              <Badge className="ml-auto text-[10px] px-1.5 py-0 border bg-slate-100 text-slate-600">
                {scores[activity.key]}/{Math.max(...activity.options.map(o => o.value))}
              </Badge>
            )}
          </div>

          <div className="space-y-1">
            {activity.options.map((opt) => (
              <label
                key={`${activity.key}-${opt.value}`}
                className={`flex items-center gap-2.5 p-2 rounded-md cursor-pointer border transition-colors
                  ${scores[activity.key] === opt.value ? 'border-rose-200 bg-rose-50' : 'border-transparent hover:bg-slate-50'}`}
                onClick={() => handleScoreChange(activity.key, opt.value)}
              >
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                  ${scores[activity.key] === opt.value ? 'border-rose-600' : 'border-slate-300'}`}>
                  {scores[activity.key] === opt.value && <div className="w-2 h-2 rounded-full bg-rose-600" />}
                </div>
                <span className="text-sm text-slate-700 flex-1">{opt.label}</span>
                <span className="text-xs font-mono text-slate-400 shrink-0">({opt.value})</span>
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
          placeholder="Any additional observations about functional ability..."
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
            <p className="text-sm font-semibold text-slate-700">Total Barthel Score</p>
            <p className="text-2xl font-bold mt-0.5">{totalScore} <span className="text-sm font-normal text-slate-500">/ 100</span></p>
          </div>
          <div className="text-right">
            <Badge className={`text-xs px-2 py-0.5 border ${RISK_STYLES[riskLevel]}`}>
              {RISK_LABELS[riskLevel]}
            </Badge>
            <p className="text-[11px] text-slate-500 mt-1">
              {riskLevel === 'low' && '91-100: Slight / independent'}
              {riskLevel === 'medium' && '61-90: Moderate dependence'}
              {riskLevel === 'high' && '21-60: Severe dependence'}
              {riskLevel === 'very_high' && '0-20: Total dependence'}
            </p>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-500">
          {ACTIVITIES.map(a => {
            const maxScore = Math.max(...a.options.map(o => o.value));
            const current = scores[a.key] ?? 0;
            const shortLabel = a.label.replace(/^\d+\.\s*/, '').replace(/\s*\(.*\)/, '');
            return (
              <div key={a.key} className="flex items-center justify-between">
                <span className="truncate mr-1">{shortLabel}:</span>
                <span className={`font-medium shrink-0 ${current < maxScore ? 'text-red-600' : 'text-green-700'}`}>
                  {scores[a.key] !== null && scores[a.key] !== undefined ? current : '-'}/{maxScore}
                </span>
              </div>
            );
          })}
        </div>

        {/* Areas needing support */}
        {allAnswered && (
          <div className="mt-2 pt-2 border-t border-slate-200">
            {ACTIVITIES.some(a => {
              const maxScore = Math.max(...a.options.map(o => o.value));
              return (scores[a.key] ?? 0) < maxScore;
            }) ? (
              <>
                <p className="text-xs text-slate-500 mb-1">Areas needing support:</p>
                <div className="flex flex-wrap gap-1">
                  {ACTIVITIES.filter(a => {
                    const maxScore = Math.max(...a.options.map(o => o.value));
                    return (scores[a.key] ?? 0) < maxScore;
                  }).map(a => (
                    <Badge key={a.key} className="text-[10px] px-1.5 py-0 border bg-red-50 text-red-600 border-red-200">
                      {a.label.replace(/^\d+\.\s*/, '').replace(/\s*\(.*\)/, '')}
                    </Badge>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-green-600 font-medium">Independent in all activities</p>
            )}
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

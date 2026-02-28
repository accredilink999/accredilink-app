import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Scale, Save, X, Calculator } from 'lucide-react';

const RISK_STYLES = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200',
};

const RISK_LABELS = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
};

function getRiskLevel(score) {
  if (score === 0) return 'low';
  if (score === 1) return 'medium';
  return 'high';
}

function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
  const heightM = heightCm / 100;
  return (weightKg / (heightM * heightM)).toFixed(1);
}

function getBMIScore(bmi) {
  if (bmi === null || bmi === undefined) return null;
  const val = Number(bmi);
  if (val > 20) return 0;
  if (val >= 18.5) return 1;
  return 2;
}

const WEIGHT_LOSS_OPTIONS = [
  { label: 'Less than 5%', value: 0 },
  { label: '5% to 10%', value: 1 },
  { label: 'More than 10%', value: 2 },
];

const ACUTE_DISEASE_OPTIONS = [
  { label: 'No', value: 0, description: 'Patient is not acutely ill, or has been eating normally' },
  { label: 'Yes', value: 2, description: 'Acutely ill AND no nutritional intake for >5 days (or likely)' },
];

export default function MUSTAssessment({ serviceUser, onSave, onCancel, existingAssessment }) {
  const existingData = existingAssessment?.assessment_data || {};

  const [heightCm, setHeightCm] = useState(existingData.height_cm || '');
  const [weightKg, setWeightKg] = useState(existingData.weight_kg || '');
  const [manualBMI, setManualBMI] = useState(existingData.manual_bmi || '');
  const [useManualBMI, setUseManualBMI] = useState(existingData.use_manual_bmi || false);
  const [weightLossScore, setWeightLossScore] = useState(existingData.weight_loss_score ?? null);
  const [acuteDiseaseScore, setAcuteDiseaseScore] = useState(existingData.acute_disease_score ?? null);
  const [notes, setNotes] = useState(existingAssessment?.findings || '');

  const calculatedBMI = useMemo(() => calculateBMI(Number(heightCm), Number(weightKg)), [heightCm, weightKg]);
  const effectiveBMI = useManualBMI ? Number(manualBMI) : Number(calculatedBMI);
  const bmiScore = useMemo(() => getBMIScore(effectiveBMI), [effectiveBMI]);

  const totalScore = useMemo(() => {
    if (bmiScore === null || weightLossScore === null || acuteDiseaseScore === null) return null;
    return bmiScore + weightLossScore + acuteDiseaseScore;
  }, [bmiScore, weightLossScore, acuteDiseaseScore]);

  const riskLevel = useMemo(() => totalScore !== null ? getRiskLevel(totalScore) : null, [totalScore]);

  const handleSave = () => {
    const riskLabel = RISK_LABELS[riskLevel];
    const autoFindings = `MUST score: ${totalScore} - ${riskLabel}. BMI: ${effectiveBMI}. ${notes ? 'Notes: ' + notes : ''}`.trim();

    onSave({
      assessment_type: 'must',
      score: totalScore,
      risk_level: riskLevel,
      assessment_data: {
        height_cm: heightCm,
        weight_kg: weightKg,
        manual_bmi: manualBMI,
        use_manual_bmi: useManualBMI,
        calculated_bmi: calculatedBMI,
        effective_bmi: effectiveBMI,
        bmi_score: bmiScore,
        weight_loss_score: weightLossScore,
        acute_disease_score: acuteDiseaseScore,
      },
      findings: autoFindings,
      recommendations: riskLevel === 'low' ? 'Routine screening. Repeat in 1-3 months (or as per local policy).' :
        riskLevel === 'medium' ? 'Observe. Document dietary intake for 3 days. If adequate, repeat screening. If not improving, follow local policy for clinical concern.' :
        'Treat. Refer to dietitian. Improve and increase overall nutritional intake. Monitor and review care plan. Unless detrimental or no benefit expected from nutritional support.',
      next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const isComplete = totalScore !== null;

  return (
    <div className="space-y-3">
      {/* Step 1: BMI Score */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">1</div>
          <Label className="text-sm font-semibold text-slate-700">BMI Score</Label>
          {bmiScore !== null && (
            <Badge className="ml-auto text-[10px] px-1.5 py-0 border bg-slate-100 text-slate-600">
              Score: {bmiScore}
            </Badge>
          )}
        </div>

        {/* Toggle between calculate and manual */}
        <div className="flex gap-2 mb-3">
          <Button
            type="button"
            size="sm"
            variant={!useManualBMI ? "default" : "outline"}
            className={`text-xs h-7 ${!useManualBMI ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
            onClick={() => setUseManualBMI(false)}
          >
            <Calculator className="w-3 h-3 mr-1" />
            Calculate BMI
          </Button>
          <Button
            type="button"
            size="sm"
            variant={useManualBMI ? "default" : "outline"}
            className={`text-xs h-7 ${useManualBMI ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
            onClick={() => setUseManualBMI(true)}
          >
            Enter BMI directly
          </Button>
        </div>

        {!useManualBMI ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-500">Height (cm)</Label>
              <Input
                type="number"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="e.g. 165"
                className="text-sm h-9 mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500">Weight (kg)</Label>
              <Input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 70"
                className="text-sm h-9 mt-1"
              />
            </div>
            {calculatedBMI && (
              <div className="col-span-2 bg-slate-50 rounded-md px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">Calculated BMI:</span>
                <span className="text-sm font-semibold">{calculatedBMI}</span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Label className="text-xs text-slate-500">BMI Value</Label>
            <Input
              type="number"
              step="0.1"
              value={manualBMI}
              onChange={(e) => setManualBMI(e.target.value)}
              placeholder="e.g. 22.5"
              className="text-sm h-9 mt-1 max-w-[160px]"
            />
          </div>
        )}

        {effectiveBMI > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            BMI {'>'}20 = 0 | 18.5-20 = 1 | {'<'}18.5 = 2 | <span className="font-medium">Your score: {bmiScore}</span>
          </div>
        )}
      </Card>

      {/* Step 2: Weight Loss Score */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">2</div>
          <Label className="text-sm font-semibold text-slate-700">Unplanned Weight Loss (past 3-6 months)</Label>
          {weightLossScore !== null && (
            <Badge className="ml-auto text-[10px] px-1.5 py-0 border bg-slate-100 text-slate-600">
              Score: {weightLossScore}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          {WEIGHT_LOSS_OPTIONS.map((opt) => (
            <label
              key={opt.value + opt.label}
              className={`flex items-center gap-2.5 p-2.5 rounded-md cursor-pointer border transition-colors
                ${weightLossScore === opt.value ? 'border-rose-200 bg-rose-50' : 'border-transparent hover:bg-slate-50'}`}
              onClick={() => setWeightLossScore(opt.value)}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                ${weightLossScore === opt.value ? 'border-rose-600' : 'border-slate-300'}`}>
                {weightLossScore === opt.value && <div className="w-2 h-2 rounded-full bg-rose-600" />}
              </div>
              <span className="text-sm text-slate-700 flex-1">{opt.label}</span>
              <span className="text-xs font-mono text-slate-400">({opt.value})</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Step 3: Acute Disease Effect */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-xs font-bold">3</div>
          <Label className="text-sm font-semibold text-slate-700">Acute Disease Effect</Label>
          {acuteDiseaseScore !== null && (
            <Badge className="ml-auto text-[10px] px-1.5 py-0 border bg-slate-100 text-slate-600">
              Score: {acuteDiseaseScore}
            </Badge>
          )}
        </div>

        <p className="text-xs text-slate-500 mb-2">
          Is the patient acutely ill AND has there been or is there likely to be no nutritional intake for more than 5 days?
        </p>

        <div className="space-y-1.5">
          {ACUTE_DISEASE_OPTIONS.map((opt) => (
            <label
              key={opt.value + opt.label}
              className={`flex items-start gap-2.5 p-2.5 rounded-md cursor-pointer border transition-colors
                ${acuteDiseaseScore === opt.value ? 'border-rose-200 bg-rose-50' : 'border-transparent hover:bg-slate-50'}`}
              onClick={() => setAcuteDiseaseScore(opt.value)}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5
                ${acuteDiseaseScore === opt.value ? 'border-rose-600' : 'border-slate-300'}`}>
                {acuteDiseaseScore === opt.value && <div className="w-2 h-2 rounded-full bg-rose-600" />}
              </div>
              <div className="flex-1">
                <span className="text-sm text-slate-700 font-medium">{opt.label}</span>
                <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
              </div>
              <span className="text-xs font-mono text-slate-400 shrink-0">({opt.value})</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Additional Notes */}
      <Card className="p-3">
        <Label className="text-sm font-semibold text-slate-700 mb-2 block">Additional Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional observations about nutritional status..."
          className="text-sm min-h-[60px]"
        />
      </Card>

      {/* Running Total */}
      <Card className={`p-3 border-2 ${
        riskLevel === 'low' ? 'border-green-300 bg-green-50' :
        riskLevel === 'medium' ? 'border-amber-300 bg-amber-50' :
        riskLevel === 'high' ? 'border-red-300 bg-red-50' :
        'border-slate-200 bg-slate-50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-700">Total MUST Score</p>
            <p className="text-2xl font-bold mt-0.5">{totalScore !== null ? totalScore : '...'}</p>
          </div>
          <div className="text-right">
            {riskLevel ? (
              <>
                <Badge className={`text-xs px-2 py-0.5 border ${RISK_STYLES[riskLevel]}`}>
                  {RISK_LABELS[riskLevel]}
                </Badge>
                <p className="text-[11px] text-slate-500 mt-1">
                  {riskLevel === 'low' && '0 = Low risk (routine care)'}
                  {riskLevel === 'medium' && '1 = Medium risk (observe)'}
                  {riskLevel === 'high' && '2+ = High risk (treat)'}
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">Complete all steps</p>
            )}
          </div>
        </div>

        {/* Score breakdown */}
        {totalScore !== null && (
          <div className="mt-2 pt-2 border-t border-slate-200 grid grid-cols-3 gap-2 text-xs text-slate-500">
            <div>BMI: <span className="font-medium text-slate-700">{bmiScore}</span></div>
            <div>Weight Loss: <span className="font-medium text-slate-700">{weightLossScore}</span></div>
            <div>Acute Disease: <span className="font-medium text-slate-700">{acuteDiseaseScore}</span></div>
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
          disabled={!isComplete}
        >
          <Save className="w-4 h-4 mr-1" />
          Save Assessment
        </Button>
      </div>
    </div>
  );
}

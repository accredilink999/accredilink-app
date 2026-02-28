import React, { useState, useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, X, Info, Utensils, MessageCircle } from 'lucide-react';

// IDDSI Framework levels
const FOOD_LEVELS = [
  { value: 7, label: 'Level 7 — Regular / Easy to Chew', colour: 'bg-slate-700', desc: 'Normal everyday foods, no modification' },
  { value: 6, label: 'Level 6 — Soft & Bite-Sized', colour: 'bg-blue-500', desc: '15mm pieces, can be mashed with fork' },
  { value: 5, label: 'Level 5 — Minced & Moist', colour: 'bg-orange-500', desc: '4mm particle size, minimal chewing' },
  { value: 4, label: 'Level 4 — Pureed', colour: 'bg-green-500', desc: 'Smooth, no lumps, holds shape on spoon' },
  { value: 3, label: 'Level 3 — Liquidised', colour: 'bg-yellow-500', desc: 'Smooth, pourable, no chewing required' },
];

const DRINK_LEVELS = [
  { value: 0, label: 'Level 0 — Thin', colour: 'bg-white border', desc: 'Normal fluids, no thickening' },
  { value: 1, label: 'Level 1 — Slightly Thick', colour: 'bg-slate-300', desc: 'Thicker than water, still pourable' },
  { value: 2, label: 'Level 2 — Mildly Thick', colour: 'bg-pink-400', desc: 'Flows off spoon, sippable from cup' },
  { value: 3, label: 'Level 3 — Moderately Thick', colour: 'bg-yellow-500', desc: 'Can be drunk from cup, not through straw' },
  { value: 4, label: 'Level 4 — Extremely Thick', colour: 'bg-green-500', desc: 'Holds shape on spoon, cannot be drunk' },
];

const SWALLOWING_SIGNS = [
  { key: 'coughing_before', label: 'Coughing before swallowing' },
  { key: 'coughing_during', label: 'Coughing during swallowing' },
  { key: 'coughing_after', label: 'Coughing after swallowing' },
  { key: 'wet_voice', label: 'Wet / gurgly voice after swallowing' },
  { key: 'throat_clearing', label: 'Frequent throat clearing' },
  { key: 'nasal_regurgitation', label: 'Nasal regurgitation' },
  { key: 'food_pocketing', label: 'Food pocketing in cheeks' },
  { key: 'multiple_swallows', label: 'Multiple swallows needed per mouthful' },
  { key: 'choking_episodes', label: 'Choking episodes' },
  { key: 'meal_fatigue', label: 'Fatigue during meals' },
  { key: 'food_refusal', label: 'Refusing food / drink' },
  { key: 'watery_eyes', label: 'Watery eyes during eating' },
];

const COMMUNICATION_AREAS = [
  { key: 'speech_intelligibility', label: 'Speech Intelligibility', options: [
    { label: 'Fully intelligible', value: 0 },
    { label: 'Mostly intelligible', value: 1 },
    { label: 'Sometimes intelligible', value: 2 },
    { label: 'Rarely / unintelligible', value: 3 },
  ]},
  { key: 'receptive_language', label: 'Understanding (Receptive)', options: [
    { label: 'Understands complex instructions', value: 0 },
    { label: 'Understands simple sentences', value: 1 },
    { label: 'Understands single words only', value: 2 },
    { label: 'Significant difficulty understanding', value: 3 },
  ]},
  { key: 'expressive_language', label: 'Expression (Expressive)', options: [
    { label: 'Full sentences / narrative', value: 0 },
    { label: 'Short phrases / sentences', value: 1 },
    { label: 'Single words only', value: 2 },
    { label: 'No verbal output', value: 3 },
  ]},
  { key: 'voice_quality', label: 'Voice Quality', options: [
    { label: 'Normal', value: 0 },
    { label: 'Hoarse / breathy', value: 1 },
    { label: 'Wet / gurgly', value: 2 },
    { label: 'Very weak / absent', value: 3 },
  ]},
];

function getRiskLevel(dysphagiaSeverity, commSeverity) {
  const maxScore = Math.max(dysphagiaSeverity, commSeverity);
  if (maxScore <= 1) return 'low';
  if (maxScore <= 2) return 'medium';
  if (maxScore <= 3) return 'high';
  return 'very_high';
}

const DYSPHAGIA_LABELS = ['No dysphagia', 'Mild dysphagia', 'Moderate dysphagia', 'Severe dysphagia'];
const COMM_LABELS = ['No difficulty', 'Mild difficulty', 'Moderate difficulty', 'Severe difficulty'];

export default function SALTAssessment({ serviceUser, onSave, onCancel, existingAssessment }) {
  const existing = existingAssessment?.assessment_data || {};

  const [alertness, setAlertness] = useState(existing.alertness || '');
  const [posture, setPosture] = useState(existing.posture || '');
  const [currentDiet, setCurrentDiet] = useState(existing.current_diet ?? 7);
  const [currentDrink, setCurrentDrink] = useState(existing.current_drink ?? 0);
  const [dentureStatus, setDentureStatus] = useState(existing.denture_status || '');
  const [oralHygiene, setOralHygiene] = useState(existing.oral_hygiene || '');

  // Swallowing signs (checkboxes)
  const [swallowingSigns, setSwallowingSigns] = useState(existing.swallowing_signs || {});

  // Dysphagia severity
  const [dysphagiaSeverity, setDysphagiaSeverity] = useState(existing.dysphagia_severity ?? null);

  // Recommended IDDSI levels
  const [recFood, setRecFood] = useState(existing.recommended_food ?? 7);
  const [recDrink, setRecDrink] = useState(existing.recommended_drink ?? 0);
  const [thickenerProduct, setThickenerProduct] = useState(existing.thickener_product || '');
  const [thickenerDosage, setThickenerDosage] = useState(existing.thickener_dosage || '');
  const [supervisionLevel, setSupervisionLevel] = useState(existing.supervision_level || '');
  const [positioningRec, setPositioningRec] = useState(existing.positioning_recommendation || '');
  const [foodsToAvoid, setFoodsToAvoid] = useState(existing.foods_to_avoid || '');
  const [pacingInstructions, setPacingInstructions] = useState(existing.pacing_instructions || '');

  // Communication
  const [commScores, setCommScores] = useState(existing.communication_scores || {});
  const [commStrategies, setCommStrategies] = useState(existing.communication_strategies || '');
  const [commAidsUsed, setCommAidsUsed] = useState(existing.communication_aids || '');

  // Overall
  const [additionalNotes, setAdditionalNotes] = useState(existing.additional_notes || '');
  const [referralNeeded, setReferralNeeded] = useState(existing.referral_needed || false);
  const [referralDetails, setReferralDetails] = useState(existing.referral_details || '');

  const toggleSign = (key) => {
    setSwallowingSigns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const signsCount = Object.values(swallowingSigns).filter(Boolean).length;
  const commTotal = Object.values(commScores).reduce((s, v) => s + (v || 0), 0);
  const commSeverity = commTotal <= 1 ? 0 : commTotal <= 4 ? 1 : commTotal <= 8 ? 2 : 3;

  const totalScore = (dysphagiaSeverity ?? 0) + commSeverity;
  const riskLevel = dysphagiaSeverity !== null ? getRiskLevel(dysphagiaSeverity, commSeverity) : null;

  const canSave = dysphagiaSeverity !== null && alertness;

  const handleSave = () => {
    const findings = [
      `Dysphagia: ${DYSPHAGIA_LABELS[dysphagiaSeverity]}`,
      `Communication: ${COMM_LABELS[commSeverity]}`,
      `Recommended food: IDDSI Level ${recFood}`,
      `Recommended drink: IDDSI Level ${recDrink}`,
      signsCount > 0 ? `Swallowing signs observed: ${signsCount}` : null,
      supervisionLevel ? `Supervision: ${supervisionLevel}` : null,
    ].filter(Boolean).join('. ');

    const recommendations = [];
    if (dysphagiaSeverity >= 2) recommendations.push('Refer to SLT for full instrumental assessment');
    if (recFood < 7) recommendations.push(`Modified diet: IDDSI Level ${recFood} (${FOOD_LEVELS.find(f => f.value === recFood)?.label.split('—')[1]?.trim() || ''})`);
    if (recDrink > 0) recommendations.push(`Thickened fluids: IDDSI Level ${recDrink}`);
    if (supervisionLevel) recommendations.push(`Mealtime supervision: ${supervisionLevel}`);
    if (foodsToAvoid) recommendations.push(`Avoid: ${foodsToAvoid}`);
    if (commSeverity >= 2) recommendations.push('Communication passport recommended');

    onSave({
      assessment_type: 'salt',
      score: totalScore,
      risk_level: riskLevel,
      findings,
      recommendations: recommendations.join('. ') || 'Continue current management plan',
      next_review_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      assessment_data: {
        alertness, posture, current_diet: currentDiet, current_drink: currentDrink,
        denture_status: dentureStatus, oral_hygiene: oralHygiene,
        swallowing_signs: swallowingSigns, dysphagia_severity: dysphagiaSeverity,
        recommended_food: recFood, recommended_drink: recDrink,
        thickener_product: thickenerProduct, thickener_dosage: thickenerDosage,
        supervision_level: supervisionLevel, positioning_recommendation: positioningRec,
        foods_to_avoid: foodsToAvoid, pacing_instructions: pacingInstructions,
        communication_scores: commScores, communication_strategies: commStrategies,
        communication_aids: commAidsUsed,
        additional_notes: additionalNotes, referral_needed: referralNeeded,
        referral_details: referralDetails,
      },
      staff_name: 'Current User',
    });
  };

  const riskBorder = riskLevel === 'low' ? 'border-green-400 bg-green-50' :
    riskLevel === 'medium' ? 'border-amber-400 bg-amber-50' :
    riskLevel === 'high' ? 'border-red-400 bg-red-50' :
    riskLevel === 'very_high' ? 'border-red-600 bg-red-100' : 'border-slate-200';

  return (
    <div className="space-y-4 py-2">
      {/* Info banner */}
      <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">SALT — Speech and Language Therapy Assessment</p>
          <p className="mt-0.5">Covers swallowing (dysphagia) screening with IDDSI levels and communication assessment. Full SLT assessment should be conducted by a qualified Speech and Language Therapist.</p>
        </div>
      </div>

      {/* Section A: Pre-assessment */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">A</span>
          Pre-Assessment
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Alertness Level *</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['Alert', 'Drowsy', 'Fluctuating', 'Unresponsive'].map(opt => (
                <button key={opt} onClick={() => setAlertness(opt)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${alertness === opt ? 'bg-rose-100 border-rose-300 text-rose-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Posture / Positioning</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['Upright', 'Reclined', 'Bed-bound', 'Wheelchair'].map(opt => (
                <button key={opt} onClick={() => setPosture(opt)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${posture === opt ? 'bg-rose-100 border-rose-300 text-rose-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Denture Status</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['Own teeth', 'Upper dentures', 'Lower dentures', 'Both dentures', 'Edentulous', 'Ill-fitting'].map(opt => (
                <button key={opt} onClick={() => setDentureStatus(opt)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${dentureStatus === opt ? 'bg-rose-100 border-rose-300 text-rose-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Oral Hygiene</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['Good', 'Fair', 'Poor'].map(opt => (
                <button key={opt} onClick={() => setOralHygiene(opt)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${oralHygiene === opt ? 'bg-rose-100 border-rose-300 text-rose-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >{opt}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Current diet & drink levels */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <Label className="text-xs font-medium">Current Food Level (IDDSI)</Label>
            <div className="space-y-1 mt-1">
              {FOOD_LEVELS.map(f => (
                <button key={f.value} onClick={() => setCurrentDiet(f.value)}
                  className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${currentDiet === f.value ? 'bg-rose-100 border-rose-300 text-rose-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${f.colour}`} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">Current Drink Level (IDDSI)</Label>
            <div className="space-y-1 mt-1">
              {DRINK_LEVELS.map(d => (
                <button key={d.value} onClick={() => setCurrentDrink(d.value)}
                  className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${currentDrink === d.value ? 'bg-rose-100 border-rose-300 text-rose-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${d.colour}`} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section B: Swallowing Signs */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">B</span>
          <Utensils className="w-3.5 h-3.5" />
          Swallowing Signs Observed
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {SWALLOWING_SIGNS.map(sign => (
            <button key={sign.key} onClick={() => toggleSign(sign.key)}
              className={`text-left text-[11px] px-2.5 py-2 rounded-lg border transition-all ${swallowingSigns[sign.key] ? 'bg-red-100 border-red-300 text-red-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <span className={`inline-block w-3 h-3 rounded border mr-1.5 align-middle ${swallowingSigns[sign.key] ? 'bg-red-500 border-red-500' : 'border-slate-300'}`} />
              {sign.label}
            </button>
          ))}
        </div>
        {signsCount > 0 && (
          <p className="text-xs text-red-600 mt-1.5 font-medium">{signsCount} sign{signsCount !== 1 ? 's' : ''} observed — consider SLT referral</p>
        )}
      </div>

      {/* Section C: Dysphagia Severity */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">C</span>
          Dysphagia Severity *
        </h4>
        <div className="grid grid-cols-2 gap-1.5">
          {DYSPHAGIA_LABELS.map((label, idx) => (
            <button key={idx} onClick={() => setDysphagiaSeverity(idx)}
              className={`text-[11px] px-3 py-2 rounded-lg border transition-all font-medium ${dysphagiaSeverity === idx
                ? idx === 0 ? 'bg-green-100 border-green-400 text-green-800'
                : idx === 1 ? 'bg-amber-100 border-amber-400 text-amber-800'
                : idx === 2 ? 'bg-orange-100 border-orange-400 text-orange-800'
                : 'bg-red-100 border-red-400 text-red-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Section D: Recommendations (IDDSI) */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">D</span>
          Recommendations
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs font-medium">Recommended Food Level (IDDSI)</Label>
            <div className="space-y-1 mt-1">
              {FOOD_LEVELS.map(f => (
                <button key={f.value} onClick={() => setRecFood(f.value)}
                  className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${recFood === f.value ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${f.colour}`} />
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">Recommended Drink Level (IDDSI)</Label>
            <div className="space-y-1 mt-1">
              {DRINK_LEVELS.map(d => (
                <button key={d.value} onClick={() => setRecDrink(d.value)}
                  className={`w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${recDrink === d.value ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${d.colour}`} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {recDrink > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label className="text-xs">Thickener Product</Label>
              <Input value={thickenerProduct} onChange={e => setThickenerProduct(e.target.value)} placeholder="e.g. Resource ThickenUp Clear" className="h-8 text-xs mt-1" />
            </div>
            <div>
              <Label className="text-xs">Thickener Dosage</Label>
              <Input value={thickenerDosage} onChange={e => setThickenerDosage(e.target.value)} placeholder="e.g. 2 scoops per 200ml" className="h-8 text-xs mt-1" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label className="text-xs">Supervision Level</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {['Independent', 'General supervision', 'Direct supervision', '1:1 assistance'].map(opt => (
                <button key={opt} onClick={() => setSupervisionLevel(opt)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${supervisionLevel === opt ? 'bg-green-100 border-green-300 text-green-800 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Positioning Recommendation</Label>
            <Input value={positioningRec} onChange={e => setPositioningRec(e.target.value)} placeholder="e.g. Upright 90°, remain upright 30 mins after" className="h-8 text-xs mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label className="text-xs">Foods to Avoid</Label>
            <Textarea value={foodsToAvoid} onChange={e => setFoodsToAvoid(e.target.value)} placeholder="e.g. Mixed consistencies, nuts, crusty bread, raw vegetables" className="text-xs min-h-[60px]" />
          </div>
          <div>
            <Label className="text-xs">Pacing Instructions</Label>
            <Textarea value={pacingInstructions} onChange={e => setPacingInstructions(e.target.value)} placeholder="e.g. Small mouthfuls, alternate food and fluid" className="text-xs min-h-[60px]" />
          </div>
        </div>
      </div>

      {/* Section E: Communication */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">E</span>
          <MessageCircle className="w-3.5 h-3.5" />
          Communication Assessment
        </h4>
        <div className="space-y-3">
          {COMMUNICATION_AREAS.map(area => (
            <Card key={area.key} className="p-2.5">
              <Label className="text-xs font-medium text-slate-700">{area.label}</Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {area.options.map(opt => (
                  <button key={opt.value} onClick={() => setCommScores(prev => ({ ...prev, [area.key]: opt.value }))}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border transition-all ${commScores[area.key] === opt.value
                      ? opt.value === 0 ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                      : opt.value === 1 ? 'bg-amber-100 border-amber-300 text-amber-800 font-medium'
                      : opt.value === 2 ? 'bg-orange-100 border-orange-300 text-orange-800 font-medium'
                      : 'bg-red-100 border-red-300 text-red-800 font-medium'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >{opt.label}</button>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <Label className="text-xs">Communication Strategies for Carers</Label>
            <Textarea value={commStrategies} onChange={e => setCommStrategies(e.target.value)} placeholder="e.g. Use short sentences, yes/no questions, allow processing time, face the person" className="text-xs min-h-[60px]" />
          </div>
          <div>
            <Label className="text-xs">Communication Aids Used</Label>
            <Textarea value={commAidsUsed} onChange={e => setCommAidsUsed(e.target.value)} placeholder="e.g. Picture board, pen and paper, electronic device" className="text-xs min-h-[60px]" />
          </div>
        </div>
      </div>

      {/* Section F: Additional & Referral */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">F</span>
          Additional Notes & Referrals
        </h4>
        <Textarea value={additionalNotes} onChange={e => setAdditionalNotes(e.target.value)} placeholder="Any additional observations, re-referral triggers, etc." className="text-xs min-h-[60px] mb-2" />
        <div className="flex items-center gap-3">
          <button onClick={() => setReferralNeeded(!referralNeeded)}
            className={`text-[11px] px-3 py-1.5 rounded-lg border transition-all ${referralNeeded ? 'bg-amber-100 border-amber-300 text-amber-800 font-medium' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            <span className={`inline-block w-3 h-3 rounded border mr-1.5 align-middle ${referralNeeded ? 'bg-amber-500 border-amber-500' : 'border-slate-300'}`} />
            SLT / Dietitian referral needed
          </button>
          {referralNeeded && (
            <Input value={referralDetails} onChange={e => setReferralDetails(e.target.value)} placeholder="Referral details..." className="h-8 text-xs flex-1" />
          )}
        </div>
      </div>

      {/* Score summary */}
      {riskLevel && (
        <Card className={`p-3 border-2 ${riskBorder}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700">SALT Assessment Summary</p>
              <p className="text-sm font-bold mt-0.5">
                Swallowing: {DYSPHAGIA_LABELS[dysphagiaSeverity]} | Communication: {COMM_LABELS[commSeverity]}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Diet: IDDSI {recFood} | Drink: IDDSI {recDrink}
                {supervisionLevel ? ` | ${supervisionLevel}` : ''}
              </p>
            </div>
            <Badge className={`text-xs px-2 py-0.5 ${
              riskLevel === 'low' ? 'bg-green-100 text-green-700' :
              riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
              riskLevel === 'high' ? 'bg-red-100 text-red-700' :
              'bg-red-200 text-red-800'
            }`}>
              {riskLevel === 'very_high' ? 'Very High Risk' : `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk`}
            </Badge>
          </div>
        </Card>
      )}

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

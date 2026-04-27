import React, { useState, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { generateAssessmentPDF } from '@/utils/assessmentPDF';
import MARChart from '@/components/medications/MARChart';
import ExpandableTextarea from '@/components/ui/ExpandableTextarea';
import {
  ChevronLeft, ChevronRight, Check, Download, Loader2, X,
  User, Phone, Heart, FileText, Clock, Pill, AlertTriangle, MapPin
} from 'lucide-react';

const STEPS = [
  { key: 'personal', label: 'Personal', icon: User },
  { key: 'emergency', label: 'Emergency', icon: AlertTriangle },
  { key: 'medical', label: 'Medical', icon: Heart },
  { key: 'care_plan', label: 'Care Plan', icon: FileText },
  { key: 'calls', label: 'Calls', icon: Clock },
  { key: 'meds', label: 'Meds & MAR', icon: Pill },
];

function loadProgress(serviceUserId) {
  try {
    const raw = localStorage.getItem(`assessment-progress:${serviceUserId}`);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`assessment-progress:${serviceUserId}`);
      return null;
    }
    return data;
  } catch { return null; }
}

function saveProgress(serviceUserId, data) {
  try {
    localStorage.setItem(`assessment-progress:${serviceUserId}`, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {}
}

function clearProgress(serviceUserId) {
  try { localStorage.removeItem(`assessment-progress:${serviceUserId}`); } catch {}
}

export default function AssessmentWizard({ serviceUser, open, onClose, onComplete, existingAssessments = [] }) {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [sectionsReviewed, setSectionsReviewed] = useState({});
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pdfBlob, setPdfBlob] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Determine assessment type
  const assessmentType = existingAssessments.length === 0 ? 'initial' : 'reassessment';

  // Load saved progress on open
  useEffect(() => {
    if (open && serviceUser?.id) {
      const saved = loadProgress(serviceUser.id);
      if (saved) {
        setCurrentStep(saved.currentStep || 0);
        setSectionsReviewed(saved.sectionsReviewed || {});
        toast.info('Resuming from where you left off');
      } else {
        setCurrentStep(0);
        setSectionsReviewed({});
      }
      setEditing(false);
      setEditData({});
      setShowSuccess(false);
      setPdfBlob(null);
    }
  }, [open, serviceUser?.id]);

  // Auto-save progress when step changes
  useEffect(() => {
    if (open && serviceUser?.id && !showSuccess) {
      saveProgress(serviceUser.id, { currentStep, sectionsReviewed });
    }
  }, [currentStep, sectionsReviewed, open, serviceUser?.id, showSuccess]);

  const startEditing = () => {
    const su = serviceUser;
    setEditData({
      full_name: su.full_name || '',
      date_of_birth: su.date_of_birth || '',
      address: su.address || '',
      postcode: su.postcode || '',
      phone: su.phone || '',
      key_safe_code: su.key_safe_code || '',
      emergency_contact_name: su.emergency_contact_name || '',
      emergency_contact_phone: su.emergency_contact_phone || '',
      emergency_contact_relationship: su.emergency_contact_relationship || '',
      gp_name: su.gp_name || '',
      gp_phone: su.gp_phone || '',
      nhs_number: su.nhs_number || '',
      allergies: su.allergies || '',
      dietary_requirements: su.dietary_requirements || '',
      mobility_level: su.mobility_level || 'independent',
      quick_reference: su.quick_reference || '',
      what_matters_to_me: su.what_matters_to_me || '',
      brief_history: su.brief_history || '',
      communication_needs: su.communication_needs || '',
      medical_history: su.medical_history || '',
      personal_plan_aims: su.personal_plan_aims || '',
      assistance_equipment: su.assistance_equipment || '',
      emergency_shutoff_water: su.emergency_shutoff_water || '',
      emergency_shutoff_electricity: su.emergency_shutoff_electricity || '',
      emergency_shutoff_gas: su.emergency_shutoff_gas || '',
      pets_in_property: su.pets_in_property || '',
      risk_management: su.risk_management || '',
      dna_cpr_in_place: su.dna_cpr_in_place || '',
      notes: su.notes || '',
    });
    setEditing(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const stepKey = STEPS[currentStep].key;
      let fieldsToUpdate = {};

      if (stepKey === 'personal') {
        fieldsToUpdate = {
          full_name: editData.full_name, date_of_birth: editData.date_of_birth || null,
          address: editData.address, postcode: editData.postcode,
          phone: editData.phone, key_safe_code: editData.key_safe_code,
        };
      } else if (stepKey === 'emergency') {
        fieldsToUpdate = {
          emergency_contact_name: editData.emergency_contact_name,
          emergency_contact_phone: editData.emergency_contact_phone,
          emergency_contact_relationship: editData.emergency_contact_relationship,
        };
      } else if (stepKey === 'medical') {
        fieldsToUpdate = {
          gp_name: editData.gp_name, gp_phone: editData.gp_phone,
          nhs_number: editData.nhs_number, allergies: editData.allergies,
          dietary_requirements: editData.dietary_requirements,
          mobility_level: editData.mobility_level,
        };
      } else if (stepKey === 'care_plan') {
        fieldsToUpdate = {
          quick_reference: editData.quick_reference, what_matters_to_me: editData.what_matters_to_me,
          brief_history: editData.brief_history, communication_needs: editData.communication_needs,
          medical_history: editData.medical_history, personal_plan_aims: editData.personal_plan_aims,
          assistance_equipment: editData.assistance_equipment,
          emergency_shutoff_water: editData.emergency_shutoff_water,
          emergency_shutoff_electricity: editData.emergency_shutoff_electricity,
          emergency_shutoff_gas: editData.emergency_shutoff_gas,
          pets_in_property: editData.pets_in_property, risk_management: editData.risk_management,
          dna_cpr_in_place: editData.dna_cpr_in_place, notes: editData.notes,
        };
      }

      if (Object.keys(fieldsToUpdate).length > 0) {
        await base44.entities.ServiceUser.update(serviceUser.id, fieldsToUpdate);
        queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
        toast.success(`${STEPS[currentStep].label} updated`);
      }

      setSectionsReviewed(prev => ({ ...prev, [stepKey]: 'updated' }));
      setEditing(false);
      advanceStep();
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const skipStep = () => {
    const stepKey = STEPS[currentStep].key;
    setSectionsReviewed(prev => ({ ...prev, [stepKey]: 'no_changes' }));
    setEditing(false);
    advanceStep();
  };

  const advanceStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeAssessment();
    }
  };

  const completeAssessment = async () => {
    setCompleting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const twelveWeeks = new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const userName = currentUser?.full_name || currentUser?.email || 'Admin';

      // Update service user with new review date
      await base44.entities.ServiceUser.update(serviceUser.id, {
        plan_review_date: twelveWeeks,
        care_plan_date: today,
        plan_completed_by: userName,
      });

      // Re-fetch service user for PDF
      const updatedUser = await base44.entities.ServiceUser.get(serviceUser.id);

      // Generate PDF
      const blob = await generateAssessmentPDF(updatedUser, {
        type: assessmentType,
        completedBy: userName,
        date: today,
        nextReassessment: twelveWeeks,
        sectionsReviewed,
      });
      setPdfBlob(blob);

      // Upload PDF to storage
      let pdfUrl = null;
      try {
        const file = new File([blob], `assessment-${serviceUser.full_name.replace(/\s+/g, '-')}-${today}.pdf`, { type: 'application/pdf' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        pdfUrl = file_url;
      } catch { /* PDF upload optional */ }

      // Create assessment record
      await base44.entities.NeedsAssessment.create({
        service_user_id: serviceUser.id,
        service_user_name: serviceUser.full_name,
        assessment_type: assessmentType,
        completed_by_id: currentUser?.id,
        completed_by_name: userName,
        next_reassessment_date: twelveWeeks,
        sections_reviewed: sectionsReviewed,
        pdf_url: pdfUrl,
      });

      queryClient.invalidateQueries({ queryKey: ['serviceUsers'] });
      queryClient.invalidateQueries({ queryKey: ['needsAssessments', serviceUser.id] });
      clearProgress(serviceUser.id);
      setShowSuccess(true);
    } catch (err) {
      toast.error('Failed to complete assessment: ' + err.message);
    } finally {
      setCompleting(false);
    }
  };

  const downloadPdf = () => {
    if (!pdfBlob) return;
    const url = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Assessment-${serviceUser.full_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    window.URL.revokeObjectURL(url);
    link.remove();
  };

  const completedSteps = Object.keys(sectionsReviewed).length;
  const progressPercent = Math.round((completedSteps / STEPS.length) * 100);

  const renderField = (label, value, fallback = 'Not provided') => (
    <div className="py-1.5">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <p className="text-sm text-slate-900 mt-0.5">{value || fallback}</p>
    </div>
  );

  const renderEditField = (label, field, type = 'text', options) => {
    if (type === 'select' && options) {
      return (
        <div className="space-y-1">
          <Label className="text-xs">{label}</Label>
          <Select value={editData[field] || ''} onValueChange={(v) => setEditData({ ...editData, [field]: v })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    }
    if (type === 'textarea') {
      return (
        <div className="space-y-1">
          <Label className="text-xs">{label}</Label>
          <Textarea value={editData[field] || ''} onChange={(e) => setEditData({ ...editData, [field]: e.target.value })} rows={3} className="text-sm" />
        </div>
      );
    }
    return (
      <div className="space-y-1">
        <Label className="text-xs">{label}</Label>
        <Input type={type} value={editData[field] || ''} onChange={(e) => setEditData({ ...editData, [field]: e.target.value })} className="h-9 text-sm" />
      </div>
    );
  };

  const renderStepContent = () => {
    const su = serviceUser;
    const stepKey = STEPS[currentStep].key;

    if (editing) {
      // Edit mode
      switch (stepKey) {
        case 'personal':
          return (
            <div className="space-y-3">
              {renderEditField('Full Name', 'full_name')}
              <div className="grid grid-cols-2 gap-3">
                {renderEditField('Date of Birth', 'date_of_birth', 'date')}
                {renderEditField('Phone', 'phone', 'tel')}
              </div>
              {renderEditField('Address', 'address')}
              <div className="grid grid-cols-2 gap-3">
                {renderEditField('Postcode', 'postcode')}
                {renderEditField('Key Safe Code', 'key_safe_code')}
              </div>
            </div>
          );
        case 'emergency':
          return (
            <div className="space-y-3">
              {renderEditField('Emergency Contact Name', 'emergency_contact_name')}
              {renderEditField('Emergency Contact Phone', 'emergency_contact_phone', 'tel')}
              {renderEditField('Relationship', 'emergency_contact_relationship')}
            </div>
          );
        case 'medical':
          return (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {renderEditField('GP Name', 'gp_name')}
                {renderEditField('GP Phone', 'gp_phone', 'tel')}
              </div>
              {renderEditField('NHS Number', 'nhs_number')}
              {renderEditField('Allergies', 'allergies', 'textarea')}
              {renderEditField('Dietary Requirements', 'dietary_requirements', 'textarea')}
              {renderEditField('Mobility Level', 'mobility_level', 'select', [
                { value: 'independent', label: 'Independent' },
                { value: 'needs_assistance', label: 'Needs Assistance' },
                { value: 'wheelchair_user', label: 'Wheelchair User' },
                { value: 'bedbound', label: 'Bedbound' },
              ])}
            </div>
          );
        case 'care_plan':
          return (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {renderEditField('Quick Reference & Preferences', 'quick_reference', 'textarea')}
              {renderEditField('What Matters To Me', 'what_matters_to_me', 'textarea')}
              {renderEditField('Brief History', 'brief_history', 'textarea')}
              {renderEditField('Communication Needs', 'communication_needs', 'textarea')}
              {renderEditField('Medical History', 'medical_history', 'textarea')}
              {renderEditField('Overall Aims', 'personal_plan_aims', 'textarea')}
              {renderEditField('DNA CPR In Place', 'dna_cpr_in_place', 'select', [
                { value: '', label: 'Not specified' },
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ])}
              {renderEditField('Assistance Equipment', 'assistance_equipment', 'textarea')}
              <div className="grid grid-cols-3 gap-3">
                {renderEditField('Water Shutoff', 'emergency_shutoff_water')}
                {renderEditField('Electricity Shutoff', 'emergency_shutoff_electricity')}
                {renderEditField('Gas Shutoff', 'emergency_shutoff_gas')}
              </div>
              {renderEditField('Pets In Property', 'pets_in_property', 'textarea')}
              {renderEditField('Risk Management', 'risk_management', 'textarea')}
              {renderEditField('Notes', 'notes', 'textarea')}
            </div>
          );
        default:
          return null;
      }
    }

    // Read-only mode
    switch (stepKey) {
      case 'personal':
        return (
          <Card className="p-4 space-y-1 divide-y divide-slate-100">
            {renderField('Full Name', su.full_name)}
            {renderField('Date of Birth', su.date_of_birth)}
            {renderField('Address', su.address)}
            {renderField('Postcode', su.postcode)}
            {renderField('Phone', su.phone)}
            {renderField('Key Safe Code', su.key_safe_code)}
          </Card>
        );
      case 'emergency':
        return (
          <Card className="p-4 space-y-1 divide-y divide-slate-100">
            {renderField('Emergency Contact Name', su.emergency_contact_name)}
            {renderField('Emergency Contact Phone', su.emergency_contact_phone)}
            {renderField('Relationship', su.emergency_contact_relationship)}
          </Card>
        );
      case 'medical':
        return (
          <Card className="p-4 space-y-1 divide-y divide-slate-100">
            {renderField('GP Name', su.gp_name)}
            {renderField('GP Phone', su.gp_phone)}
            {renderField('NHS Number', su.nhs_number)}
            {renderField('Allergies', su.allergies)}
            {renderField('Dietary Requirements', su.dietary_requirements)}
            {renderField('Mobility Level', su.mobility_level ? su.mobility_level.replace('_', ' ') : null)}
          </Card>
        );
      case 'care_plan':
        return (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            <Card className="p-4 space-y-1 divide-y divide-slate-100">
              {renderField('Quick Reference & Preferences', su.quick_reference)}
              {renderField('What Matters To Me', su.what_matters_to_me)}
              {renderField('Brief History', su.brief_history)}
              {renderField('Communication Needs', su.communication_needs)}
              {renderField('Medical History', su.medical_history)}
              {renderField('Overall Aims', su.personal_plan_aims)}
              {renderField('DNA CPR In Place', su.dna_cpr_in_place)}
              {renderField('Assistance Equipment', su.assistance_equipment)}
            </Card>
            <Card className="p-4 space-y-1 divide-y divide-slate-100">
              <h4 className="text-xs font-semibold text-slate-600 pb-1">Emergency Shut Offs</h4>
              {renderField('Water', su.emergency_shutoff_water)}
              {renderField('Electricity', su.emergency_shutoff_electricity)}
              {renderField('Gas', su.emergency_shutoff_gas)}
            </Card>
            <Card className="p-4 space-y-1 divide-y divide-slate-100">
              {renderField('Pets In Property', su.pets_in_property)}
              {renderField('Risk Management', su.risk_management)}
              {renderField('Notes', su.notes)}
            </Card>
          </div>
        );
      case 'calls':
        return (
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" /> Scheduled Calls
            </h4>
            {su.call_times?.length > 0 ? (
              <div className="space-y-2">
                {su.call_times.map((call, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium">{call.time}</span>
                      <span className="text-slate-500 ml-2">{call.duration} mins</span>
                      {call.type && <Badge className="ml-2 text-xs" variant="outline">{call.type}</Badge>}
                    </div>
                    {call.notes && <span className="text-xs text-slate-400 truncate max-w-[200px]">{call.notes}</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No scheduled calls</p>
            )}
          </Card>
        );
      case 'meds':
        return (
          <Card className="p-4">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Pill className="w-4 h-4 text-rose-600" /> Medications & eMAR
            </h4>
            <p className="text-sm text-slate-500 mb-3">Review the client's current medications below. Use the main Meds & eMAR section to make changes.</p>
            <div className="border rounded-lg overflow-hidden">
              <MARChart serviceUser={serviceUser} isAdmin={false} />
            </div>
          </Card>
        );
      default:
        return null;
    }
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900 mb-2">Assessment Complete</DialogTitle>
            <p className="text-sm text-slate-500 mb-1">
              {assessmentType === 'initial' ? 'Initial Assessment' : 'Re-Assessment'} of Needs for <strong>{serviceUser.full_name}</strong> has been completed.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Next re-assessment due: <strong>{new Date(Date.now() + 84 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</strong>
            </p>
            <div className="flex gap-3 justify-center">
              {pdfBlob && (
                <Button onClick={downloadPdf} className="bg-teal-600 hover:bg-teal-700">
                  <Download className="w-4 h-4 mr-2" /> Download PDF
                </Button>
              )}
              <Button variant="outline" onClick={() => { onComplete?.(); onClose(); }}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { saveProgress(serviceUser?.id, { currentStep, sectionsReviewed }); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex-shrink-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle className="text-lg font-bold text-slate-900">
              {assessmentType === 'initial' ? 'Initial' : 'Re-'} Assessment of Needs
            </DialogTitle>
            <button onClick={() => { saveProgress(serviceUser?.id, { currentStep, sectionsReviewed }); onClose(); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}</span>
              <span>{progressPercent}% complete</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-teal-500 to-teal-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex gap-1">
            {STEPS.map((step, idx) => {
              const StepIcon = step.icon;
              const reviewed = sectionsReviewed[step.key];
              const isCurrent = idx === currentStep;
              return (
                <button
                  key={step.key}
                  onClick={() => { if (idx <= completedSteps) { setEditing(false); setCurrentStep(idx); } }}
                  disabled={idx > completedSteps}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-medium transition-all
                    ${isCurrent ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                      reviewed ? 'bg-green-50 text-green-700' :
                      'text-slate-400 opacity-50'}
                  `}
                >
                  <StepIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">{step.label}</span>
                  {reviewed && <Check className="w-3 h-3 text-green-600" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              {React.createElement(STEPS[currentStep].icon, { className: 'w-4 h-4 text-teal-600' })}
              {STEPS[currentStep].label}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review the information below. Update anything that has changed or click "No Changes Needed" to continue.
            </p>
          </div>
          {renderStepContent()}
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t px-5 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            {currentStep > 0 && !editing && (
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setCurrentStep(prev => prev - 1); }}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={saveChanges} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                  Save & Continue
                </Button>
              </>
            ) : (
              <>
                {STEPS[currentStep].key !== 'calls' && STEPS[currentStep].key !== 'meds' && (
                  <Button variant="outline" size="sm" onClick={startEditing}>
                    Save/Update Changes
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-teal-600 hover:bg-teal-700"
                  onClick={skipStep}
                  disabled={completing}
                >
                  {completing ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Completing...</>
                  ) : currentStep === STEPS.length - 1 ? (
                    <><Check className="w-4 h-4 mr-1" /> Complete Assessment</>
                  ) : (
                    <>No Changes Needed <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

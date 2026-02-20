import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Description of each built-in section's fields for the preview
const BUILTIN_PREVIEWS = {
  core_observations: {
    title: 'Essential Observations',
    fields: [
      { label: 'Mood *', type: 'select', options: ['Happy', 'Content', 'Anxious', 'Upset', 'Unwell'] },
      { label: 'Food Intake *', type: 'select', options: ['Good', 'Fair', 'Poor', 'Refused', 'None'] },
      { label: 'Fluid Intake *', type: 'select', options: ['Good', 'Fair', 'Poor', 'Refused', 'None'] },
      { label: 'Welfare Impression on Arrival? *', type: 'select', options: ['Safe With No Concerns', 'Safe With Minor Concerns', 'Unsafe Interventions Required', 'Safe With Interventions Required'] },
    ],
    layout: 'grid-3',
  },
  personal_care: {
    title: 'Personal Care',
    fields: [
      { label: 'Personal Care Provided? *', type: 'yes_no' },
      { label: 'What Personal Care was provided during Visit?', type: 'textarea', conditional: 'If Yes' },
    ],
  },
  continence_care: {
    title: 'Continence Care',
    fields: [
      { label: 'Continence Care Provided? *', type: 'yes_no' },
      { label: 'Continence Care Monitoring', type: 'checkbox', conditional: 'If Yes', options: ['Passed Urine', 'Bowels Opened', 'Pad Dry', 'Pad Wet/Changed', 'Pad Wet & Soiled/Changed', 'Bed/Chair Wet', 'Bed/Chair Wet & Soiled', 'No Output'] },
    ],
  },
  catheter_care: {
    title: 'Catheter Care',
    fields: [
      { label: 'Catheter Care Provided Or Output? *', type: 'yes_no' },
      { label: 'Catheter Care Details', type: 'textarea', conditional: 'If Yes' },
    ],
  },
  repositioning: {
    title: 'Repositioning',
    fields: [
      { label: 'Was the Citizen Repositioned? *', type: 'yes_no' },
      { label: 'Repositioning Details', type: 'textarea', conditional: 'If Yes' },
    ],
  },
  skincare: {
    title: 'Skincare',
    fields: [
      { label: 'Was Any Skincare Provided? *', type: 'yes_no' },
      { label: 'Skincare Details', type: 'textarea', conditional: 'If Yes' },
    ],
  },
  skin_integrity: {
    title: 'Skin Integrity',
    fields: [
      { label: 'Any Skin Integrity Concerns? *', type: 'yes_no' },
      { label: 'Skin Integrity Concerns Details', type: 'textarea', conditional: 'If Yes' },
    ],
  },
  food_management: {
    title: 'Food Management',
    fields: [
      { label: 'Food Offered?', type: 'yes_no' },
      { label: 'Accepted?', type: 'select', conditional: 'If Yes', options: ['Yes', 'Refused'] },
      { label: 'What Was Given', type: 'text', conditional: 'If Accepted' },
      { label: 'Outcome', type: 'select', conditional: 'If Accepted', options: ['Full Meal Consumed', 'Half Meal Consumed', 'Little Consumed', 'Left With Citizen'] },
    ],
  },
  drinks_management: {
    title: 'Drinks Management',
    fields: [
      { label: 'Drinks Offered?', type: 'yes_no' },
      { label: 'Accepted?', type: 'select', conditional: 'If Yes', options: ['Yes', 'Refused'] },
      { label: 'What Was Given', type: 'text', conditional: 'If Accepted' },
      { label: 'Outcome', type: 'select', conditional: 'If Accepted', options: ['Full Drink Taken', 'Half Drink Taken', 'Small Amount Taken', 'Left With Citizen'] },
    ],
  },
  medication_round: {
    title: 'Medication Round',
    fields: [
      { label: 'Add A Medication Round? *', type: 'yes_no' },
      { label: 'Medication Round Outcome *', type: 'radio', conditional: 'If Yes', options: ['Accepted & Consumed', 'Left With Citizen Or Family', 'Refused By Citizen', 'Not Offered (See Notes)'] },
    ],
  },
  medication_concerns: {
    title: 'Medication Concerns',
    fields: [
      { label: 'Any Medication Concerns? *', type: 'yes_no' },
      { label: 'Detail Issues, Concerns, Witness...', type: 'textarea', conditional: 'If Yes' },
    ],
  },
  further_concerns: {
    title: 'Further Concerns',
    fields: [
      { label: 'Any Further Concerns To Raise? *', type: 'yes_no' },
      { label: 'Further Concerns Details', type: 'textarea', conditional: 'If Yes' },
    ],
  },
  healthcare_visit: {
    title: 'Healthcare Visit',
    fields: [
      { label: 'Is A Healthcare Visit Required? *', type: 'yes_no' },
      { label: 'Type of Healthcare Professional', type: 'radio', conditional: 'If Yes', options: ['Doctor GP', 'Nurse', 'Occupational Therapist', 'Ambulance Non Urgent', 'Ambulance Urgent', 'Mental Health Advisor', 'Social Worker', 'Podiatrist', 'Dentist', 'Optician', 'Audiology'] },
    ],
  },
  extended_notes: {
    title: 'Extended Notes',
    fields: [
      { label: 'Extended Notes For This Visit? *', type: 'textarea' },
    ],
  },
  staff_information: {
    title: 'Staff Information',
    fields: [
      { label: 'Grade Of Staff Member *', type: 'radio', options: ['Care Practitioner', 'Manager', 'Medic', 'Trainee', 'RI', 'RM'] },
      { label: 'Was This A Double Handed Call? *', type: 'yes_no' },
      { label: 'Staff 1 *', type: 'select', options: ['(Staff list)'] },
      { label: 'Staff 2 *', type: 'select', conditional: 'If Double Handed', options: ['(Staff list)'] },
    ],
  },
};

const TYPE_COLORS = {
  select: 'bg-purple-100 text-purple-700',
  yes_no: 'bg-blue-100 text-blue-700',
  textarea: 'bg-teal-100 text-teal-700',
  text: 'bg-slate-100 text-slate-600',
  radio: 'bg-rose-100 text-rose-700',
  checkbox: 'bg-amber-100 text-amber-700',
  checkbox_group: 'bg-amber-100 text-amber-700',
};

const TYPE_LABELS = {
  select: 'Dropdown',
  yes_no: 'Yes / No',
  textarea: 'Text Area',
  text: 'Text',
  radio: 'Radio',
  checkbox: 'Checkboxes',
  checkbox_group: 'Checkboxes',
};

function FieldPreview({ field }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{field.label}</p>
        {field.conditional && (
          <p className="text-xs text-slate-400 italic">{field.conditional}</p>
        )}
        {field.options && field.options.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {field.options.slice(0, 4).map((opt, i) => (
              <span key={i} className="text-xs bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">
                {opt}
              </span>
            ))}
            {field.options.length > 4 && (
              <span className="text-xs text-slate-400">+{field.options.length - 4} more</span>
            )}
          </div>
        )}
      </div>
      <Badge className={`${TYPE_COLORS[field.type] || 'bg-slate-100 text-slate-600'} text-xs shrink-0`}>
        {TYPE_LABELS[field.type] || field.type}
      </Badge>
    </div>
  );
}

function SectionPreview({ section, isBuiltin }) {
  const preview = isBuiltin ? BUILTIN_PREVIEWS[section.id] : null;
  const title = preview?.title || section.label || section.name;
  const fields = isBuiltin
    ? (preview?.fields || [])
    : (section.fields || []).map(f => ({
        label: f.label + (f.required ? ' *' : ''),
        type: f.type,
        options: f.options,
      }));

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className={`px-4 py-2.5 flex items-center gap-2 ${isBuiltin ? 'bg-slate-50' : 'bg-teal-50'}`}>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <Badge
          variant="secondary"
          className={`text-xs ${isBuiltin ? 'bg-slate-200 text-slate-600' : 'bg-teal-200 text-teal-700'}`}
        >
          {isBuiltin ? 'Built-in' : 'Custom'}
        </Badge>
      </div>
      <div className="px-4 py-1 divide-y divide-slate-100">
        {fields.length > 0 ? (
          fields.map((field, i) => <FieldPreview key={i} field={field} />)
        ) : (
          <p className="text-xs text-slate-400 py-3">No fields defined</p>
        )}
      </div>
    </div>
  );
}

export default function CareLogFormPreview({ open, onClose, sections }) {
  const enabledSections = sections.filter(s => s.enabled);
  const BUILTIN_IDS = new Set(Object.keys(BUILTIN_PREVIEWS));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-slate-900">Form Preview</DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                {enabledSections.length} section{enabledSections.length !== 1 ? 's' : ''} enabled
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {enabledSections.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No sections enabled</p>
              <p className="text-xs mt-1">Toggle sections on in the builder to see them here</p>
            </div>
          ) : (
            enabledSections.map(section => (
              <SectionPreview
                key={section.id}
                section={section}
                isBuiltin={BUILTIN_IDS.has(section.id) || section.type === 'builtin'}
              />
            ))
          )}

          {enabledSections.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50">
                <h4 className="text-sm font-semibold text-slate-900">Time of Log Submission</h4>
              </div>
              <div className="px-4 py-2">
                <div className="flex items-start gap-3 py-2">
                  <p className="text-sm font-medium text-slate-800 flex-1">Time of Log Submission *</p>
                  <Badge className="bg-slate-100 text-slate-600 text-xs">Date/Time</Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Default care log form configuration.
 * Used when no admin config has been saved to system_settings yet.
 */

export const BUILTIN_SECTIONS = [
  { id: 'core_observations', label: 'Essential Observations' },
  { id: 'personal_care', label: 'Personal Care' },
  { id: 'continence_care', label: 'Continence Care' },
  { id: 'catheter_care', label: 'Catheter Care' },
  { id: 'repositioning', label: 'Repositioning' },
  { id: 'skincare', label: 'Skincare' },
  { id: 'skin_integrity', label: 'Skin Integrity' },
  { id: 'food_management', label: 'Food Management' },
  { id: 'drinks_management', label: 'Drinks Management' },
  { id: 'medication_round', label: 'Medication Round' },
  { id: 'medication_concerns', label: 'Medication Concerns' },
  { id: 'further_concerns', label: 'Further Concerns' },
  { id: 'healthcare_visit', label: 'Healthcare Visit' },
  { id: 'extended_notes', label: 'Extended Notes' },
  { id: 'staff_information', label: 'Staff Information' },
];

export const DEFAULT_CARE_LOG_FORM_CONFIG = {
  version: 1,
  sections: BUILTIN_SECTIONS.map((s, i) => ({
    ...s,
    type: 'builtin',
    enabled: true,
    order: i,
  })),
};

/** Map of section ID → required field keys for validation */
export const SECTION_REQUIRED_FIELDS = {
  core_observations: {
    mood: 'Mood',
    food_intake: 'Food Intake',
    fluid_intake: 'Fluid Intake',
    welfare_impression_on_arrival: 'Welfare Impression',
  },
  personal_care: { personal_care: 'Personal Care' },
  continence_care: { continence_care_provided: 'Continence Care' },
  catheter_care: { catheter_care_provided: 'Catheter Care' },
  repositioning: { repositioned_on_visit: 'Repositioning' },
  skincare: { skincare_provided: 'Skincare' },
  skin_integrity: { skin_integrity_concerns: 'Skin Integrity' },
  food_management: {},
  drinks_management: {},
  medication_round: { add_medication_round: 'Medication Round' },
  medication_concerns: { medication_concerns: 'Medication Concerns' },
  further_concerns: {},
  healthcare_visit: { healthcare_visit_required: 'Healthcare Visit' },
  extended_notes: { extended_notes: 'Extended Notes' },
  staff_information: { staff_grade: 'Staff Grade', double_handed_call: 'Double Handed Call' },
};

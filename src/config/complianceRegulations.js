/**
 * Compliance Regulations Config
 *
 * Static definitions for CIW (Wales) and CQC (England) regulations.
 * Each regulation defines its form fields so the UI can render filing forms dynamically.
 * Adding a new regulation = adding an object here — no DB migration needed.
 */

// ── CIW Regulations (Wales) ─────────────────────────────────────────────────

const CIW_REGULATIONS = [
  {
    code: 'ciw_reg_73',
    framework: 'ciw',
    number: '73',
    title: 'Responsible Individual Visits',
    shortTitle: 'RI Visits',
    description:
      'The responsible individual must visit the service at least every 3 months to check on the wellbeing of service users and the running of the service.',
    legalRef: 'Regulated Services (Service Providers and Responsible Individuals) (Wales) Regulations 2017, Reg 73',
    cycle: { months: 3 },
    category: 'governance',
    fields: [
      { key: 'visit_date', label: 'Visit Date', type: 'date', required: true },
      { key: 'visit_type', label: 'Visit Type', type: 'select', options: ['In-person visit', 'Virtual visit', 'Office-based review', 'Service user home visit'], required: true },
      { key: 'locations_visited', label: 'Locations / Service Users Visited', type: 'textarea', placeholder: 'List locations or service user homes visited' },
      { key: 'staff_consulted', label: 'Staff Members Consulted', type: 'textarea', required: true, placeholder: 'Names and roles of staff spoken with' },
      { key: 'service_users_consulted', label: 'Service Users / Relatives Consulted', type: 'textarea', placeholder: 'Names of individuals or families spoken with' },
      { key: 'observations', label: 'Key Observations', type: 'textarea', required: true, placeholder: 'What was observed about care quality, staff conduct, environment...' },
      { key: 'feedback_received', label: 'Feedback Received', type: 'textarea', placeholder: 'Summary of feedback from staff, service users and relatives' },
      { key: 'issues_identified', label: 'Issues Identified', type: 'textarea', placeholder: 'Any concerns or issues noted during the visit' },
      { key: 'actions_required', label: 'Actions Required', type: 'textarea', placeholder: 'Specific actions with ownership and deadlines' },
      { key: 'overall_assessment', label: 'Overall Assessment', type: 'select', options: ['Satisfactory', 'Minor improvements needed', 'Significant improvements needed', 'Urgent action required'], required: true },
    ],
  },
  {
    code: 'ciw_reg_80',
    framework: 'ciw',
    number: '80',
    title: 'Quality of Care Review',
    shortTitle: 'Quality Review',
    description:
      'The responsible individual must establish a system for monitoring, reviewing and improving quality of care. A written report must be prepared at least every 6 months.',
    legalRef: 'Regulated Services (Service Providers and Responsible Individuals) (Wales) Regulations 2017, Reg 80',
    cycle: { months: 6 },
    category: 'quality',
    fields: [
      { key: 'review_period_start', label: 'Review Period Start', type: 'date', required: true },
      { key: 'review_period_end', label: 'Review Period End', type: 'date', required: true },
      { key: 'incidents_summary', label: 'Incidents Summary', type: 'textarea', required: true, placeholder: 'Total incidents, types, severity breakdown, trends...' },
      { key: 'safeguarding_referrals', label: 'Safeguarding Referrals', type: 'textarea', placeholder: 'Number of referrals, outcomes, any patterns' },
      { key: 'complaints_summary', label: 'Complaints Received & Resolution', type: 'textarea', placeholder: 'Number of complaints, nature, how resolved, lessons learned' },
      { key: 'whistleblowing', label: 'Whistleblowing Concerns', type: 'textarea', placeholder: 'Any whistleblowing concerns raised and actions taken' },
      { key: 'staff_feedback', label: 'Staff Engagement & Feedback', type: 'textarea', placeholder: 'Summary of staff feedback, supervision records, training uptake' },
      { key: 'service_user_feedback', label: 'Service User & Family Feedback', type: 'textarea', placeholder: 'Surveys, reviews, direct feedback summary' },
      { key: 'audit_findings', label: 'Audit Findings', type: 'textarea', required: true, placeholder: 'Results of care log audits, medication audits, record accuracy checks' },
      { key: 'care_plan_compliance', label: 'Care Plan Compliance', type: 'textarea', placeholder: 'Are care plans up to date? Review dates met?' },
      { key: 'improvement_recommendations', label: 'Improvement Recommendations', type: 'textarea', required: true, placeholder: 'Specific recommendations for improving the service' },
      { key: 'action_plan', label: 'Action Plan', type: 'textarea', required: true, placeholder: 'Actions, responsible person, deadlines, review dates' },
      { key: 'overall_quality_rating', label: 'Overall Quality Assessment', type: 'select', options: ['Excellent', 'Good', 'Adequate', 'Needs improvement', 'Inadequate'], required: true },
    ],
  },
  {
    code: 'ciw_reg_68',
    framework: 'ciw',
    number: '68',
    title: 'Fit & Proper Person (Manager)',
    shortTitle: 'Fit Person',
    description:
      'The service provider must ensure the manager is a fit and proper person. This includes checks on qualifications, DBS, registration and conduct.',
    legalRef: 'Regulated Services (Service Providers and Responsible Individuals) (Wales) Regulations 2017, Reg 68',
    cycle: { months: 12 },
    category: 'staffing',
    fields: [
      { key: 'manager_name', label: 'Manager Name', type: 'text', required: true },
      { key: 'manager_role', label: 'Role / Title', type: 'text', required: true },
      { key: 'qualifications', label: 'Qualifications Held', type: 'textarea', required: true, placeholder: 'List relevant qualifications (QCF/NVQ Level 5, etc.)' },
      { key: 'dbs_date', label: 'DBS Certificate Date', type: 'date', required: true },
      { key: 'dbs_update_service', label: 'Registered with DBS Update Service?', type: 'select', options: ['Yes', 'No'], required: true },
      { key: 'scw_registration', label: 'Social Care Wales Registration Number', type: 'text', placeholder: 'SCW registration number' },
      { key: 'scw_expiry', label: 'SCW Registration Expiry', type: 'date' },
      { key: 'references_verified', label: 'References Verified?', type: 'select', options: ['Yes', 'No', 'In progress'], required: true },
      { key: 'health_declaration', label: 'Health Declaration Received?', type: 'select', options: ['Yes', 'No'], required: true },
      { key: 'declaration_notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any notes on fitness assessment, conditions, etc.' },
    ],
  },
  {
    code: 'ciw_reg_72',
    framework: 'ciw',
    number: '72',
    title: 'Manager Absence Cover',
    shortTitle: 'Absence Cover',
    description:
      'If the manager is absent for 28 days or more, the responsible individual must make suitable cover arrangements and notify CIW.',
    legalRef: 'Regulated Services (Service Providers and Responsible Individuals) (Wales) Regulations 2017, Reg 72',
    cycle: null, // event-driven
    category: 'governance',
    fields: [
      { key: 'manager_name', label: 'Absent Manager Name', type: 'text', required: true },
      { key: 'absence_reason', label: 'Reason for Absence', type: 'select', options: ['Sickness', 'Annual leave', 'Maternity/Paternity', 'Suspension', 'Resignation', 'Other'], required: true },
      { key: 'absence_start', label: 'Absence Start Date', type: 'date', required: true },
      { key: 'expected_return', label: 'Expected Return Date', type: 'date' },
      { key: 'cover_name', label: 'Cover Manager Name', type: 'text', required: true },
      { key: 'cover_qualifications', label: 'Cover Manager Qualifications', type: 'textarea', placeholder: 'Relevant qualifications and experience' },
      { key: 'ciw_notified_date', label: 'Date CIW Notified', type: 'date', required: true },
      { key: 'cover_arrangements', label: 'Cover Arrangements Details', type: 'textarea', required: true, placeholder: 'How service continuity will be maintained' },
    ],
  },
  {
    code: 'ciw_reg_60',
    framework: 'ciw',
    number: '60',
    title: 'Notifications to CIW',
    shortTitle: 'CIW Notification',
    description:
      'The service provider must notify CIW of specific events including safeguarding incidents, serious injuries, deaths, allegations against staff, and enforcement actions.',
    legalRef: 'Regulated Services (Service Providers and Responsible Individuals) (Wales) Regulations 2017, Reg 60',
    cycle: null, // event-driven
    category: 'notifications',
    fields: [
      { key: 'event_type', label: 'Event Type', type: 'select', options: ['Safeguarding incident', 'Serious injury', 'Death of service user', 'Allegation against staff', 'Whistleblowing concern', 'Enforcement action', 'Significant complaint', 'Other notifiable event'], required: true },
      { key: 'event_date', label: 'Event Date', type: 'date', required: true },
      { key: 'event_time', label: 'Event Time', type: 'time' },
      { key: 'people_involved', label: 'People Involved', type: 'textarea', required: true, placeholder: 'Names and roles of all people involved' },
      { key: 'description', label: 'Description of Event', type: 'textarea', required: true, placeholder: 'Detailed description of what happened' },
      { key: 'immediate_actions', label: 'Immediate Actions Taken', type: 'textarea', required: true, placeholder: 'What was done immediately in response' },
      { key: 'agencies_notified', label: 'External Agencies Notified', type: 'textarea', placeholder: 'Police, local authority, CSSIW, etc. with dates' },
      { key: 'ciw_notification_method', label: 'CIW Notification Method', type: 'select', options: ['CIW Online', 'Email', 'Phone', 'Letter'], required: true },
      { key: 'ciw_notification_date', label: 'Date Notified to CIW', type: 'date', required: true },
      { key: 'follow_up', label: 'Follow-up Actions', type: 'textarea', placeholder: 'Ongoing investigation, support measures, reviews planned' },
    ],
  },
];

// ── CQC Regulations (England) ───────────────────────────────────────────────

const CQC_REGULATIONS = [
  {
    code: 'cqc_reg_17',
    framework: 'cqc',
    number: '17',
    title: 'Good Governance',
    shortTitle: 'Governance',
    description:
      'Systems and processes must be established to assess, monitor and improve the quality and safety of the services provided, including risk assessment and audit.',
    legalRef: 'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, Reg 17',
    cycle: { months: 6 },
    category: 'quality',
    fields: [
      { key: 'review_period_start', label: 'Review Period Start', type: 'date', required: true },
      { key: 'review_period_end', label: 'Review Period End', type: 'date', required: true },
      { key: 'governance_structure', label: 'Governance Structure Review', type: 'textarea', placeholder: 'Current governance arrangements, any changes' },
      { key: 'risk_assessment', label: 'Risk Assessment Summary', type: 'textarea', required: true, placeholder: 'Key risks identified, mitigation measures' },
      { key: 'incidents_analysis', label: 'Incidents & Accidents Analysis', type: 'textarea', required: true, placeholder: 'Total incidents, trends, lessons learned' },
      { key: 'complaints_analysis', label: 'Complaints Analysis', type: 'textarea', placeholder: 'Complaints received, themes, resolution, learning' },
      { key: 'audit_results', label: 'Audit Results', type: 'textarea', required: true, placeholder: 'Results of care audits, medication audits, record audits' },
      { key: 'staff_feedback', label: 'Staff Feedback & Engagement', type: 'textarea', placeholder: 'Staff survey results, supervision feedback, training' },
      { key: 'service_user_feedback', label: 'Service User & Carer Feedback', type: 'textarea', placeholder: 'Feedback mechanisms, survey results, actions taken' },
      { key: 'quality_improvement_plan', label: 'Quality Improvement Plan', type: 'textarea', required: true, placeholder: 'Specific improvements, responsible persons, timelines' },
      { key: 'overall_rating', label: 'Self-Assessment Rating', type: 'select', options: ['Outstanding', 'Good', 'Requires improvement', 'Inadequate'], required: true },
    ],
  },
  {
    code: 'cqc_reg_13',
    framework: 'cqc',
    number: '13',
    title: 'Safeguarding',
    shortTitle: 'Safeguarding',
    description:
      'Service users must be protected from abuse and improper treatment. Systems and processes must be established to prevent abuse and investigate concerns.',
    legalRef: 'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, Reg 13',
    cycle: { months: 6 },
    category: 'safeguarding',
    fields: [
      { key: 'review_period_start', label: 'Review Period Start', type: 'date', required: true },
      { key: 'review_period_end', label: 'Review Period End', type: 'date', required: true },
      { key: 'safeguarding_referrals', label: 'Safeguarding Referrals Made', type: 'textarea', required: true, placeholder: 'Number, types, outcomes of referrals' },
      { key: 'training_compliance', label: 'Staff Safeguarding Training Compliance', type: 'textarea', required: true, placeholder: 'Percentage trained, any gaps, refresher schedule' },
      { key: 'policies_review', label: 'Safeguarding Policy Review', type: 'textarea', placeholder: 'When last reviewed, any updates, next review date' },
      { key: 'mental_capacity', label: 'Mental Capacity & DoLS', type: 'textarea', placeholder: 'MCA assessments, DoLS applications, best interest decisions' },
      { key: 'restraint_review', label: 'Restraint / Restrictive Practice Review', type: 'textarea', placeholder: 'Any restrictive practices, justification, alternatives explored' },
      { key: 'whistleblowing', label: 'Whistleblowing', type: 'textarea', placeholder: 'Any concerns raised, how handled, outcomes' },
      { key: 'actions', label: 'Actions & Improvements', type: 'textarea', required: true, placeholder: 'Steps to strengthen safeguarding' },
    ],
  },
  {
    code: 'cqc_reg_19',
    framework: 'cqc',
    number: '19',
    title: 'Fit & Proper Persons Employed',
    shortTitle: 'Fit Persons',
    description:
      'Persons employed must be of good character, have the qualifications and skills necessary, and be physically and mentally fit for the work.',
    legalRef: 'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, Reg 19',
    cycle: { months: 12 },
    category: 'staffing',
    fields: [
      { key: 'staff_member_name', label: 'Staff Member Name', type: 'text', required: true },
      { key: 'role', label: 'Role / Position', type: 'text', required: true },
      { key: 'dbs_date', label: 'DBS Certificate Date', type: 'date', required: true },
      { key: 'dbs_level', label: 'DBS Level', type: 'select', options: ['Enhanced', 'Enhanced with barred list', 'Standard'], required: true },
      { key: 'qualifications', label: 'Qualifications', type: 'textarea', required: true, placeholder: 'Relevant qualifications (Care Certificate, NVQ, etc.)' },
      { key: 'references', label: 'References Obtained', type: 'select', options: ['Yes - 2 references', 'Yes - 1 reference', 'Pending', 'Not yet obtained'], required: true },
      { key: 'right_to_work', label: 'Right to Work Verified', type: 'select', options: ['Yes', 'No', 'Pending'], required: true },
      { key: 'health_declaration', label: 'Health Declaration', type: 'select', options: ['Received - fit', 'Received - adjustments needed', 'Not yet received'], required: true },
      { key: 'conduct_check', label: 'Previous Conduct / Disciplinary Check', type: 'textarea', placeholder: 'Any previous employers contacted re conduct' },
      { key: 'notes', label: 'Additional Notes', type: 'textarea' },
    ],
  },
  {
    code: 'cqc_reg_20',
    framework: 'cqc',
    number: '20',
    title: 'Duty of Candour',
    shortTitle: 'Duty of Candour',
    description:
      'When a notifiable safety incident occurs, the provider must act in an open and transparent way, notify the relevant person, and provide a written account.',
    legalRef: 'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, Reg 20',
    cycle: null, // event-driven
    category: 'notifications',
    fields: [
      { key: 'incident_date', label: 'Incident Date', type: 'date', required: true },
      { key: 'incident_description', label: 'Description of Notifiable Safety Incident', type: 'textarea', required: true, placeholder: 'What happened, who was affected, what harm occurred' },
      { key: 'person_affected', label: 'Person Affected', type: 'text', required: true },
      { key: 'harm_level', label: 'Level of Harm', type: 'select', options: ['Moderate harm', 'Severe harm', 'Death'], required: true },
      { key: 'verbal_notification_date', label: 'Date of Verbal Notification', type: 'date', required: true },
      { key: 'verbal_notification_to', label: 'Verbal Notification Given To', type: 'text', required: true, placeholder: 'Name and relationship of person notified' },
      { key: 'written_notification_date', label: 'Date of Written Notification', type: 'date', required: true },
      { key: 'apology_given', label: 'Apology Given?', type: 'select', options: ['Yes', 'No'], required: true },
      { key: 'investigation_summary', label: 'Investigation Summary', type: 'textarea', required: true, placeholder: 'Findings, root cause, contributing factors' },
      { key: 'actions_taken', label: 'Actions Taken to Prevent Recurrence', type: 'textarea', required: true, placeholder: 'Steps taken, system changes, training' },
      { key: 'cqc_notified', label: 'CQC Notified?', type: 'select', options: ['Yes', 'No', 'Not applicable'], required: true },
      { key: 'cqc_notification_date', label: 'CQC Notification Date', type: 'date' },
    ],
  },
  {
    code: 'cqc_reg_16',
    framework: 'cqc',
    number: '16',
    title: 'Complaints Handling',
    shortTitle: 'Complaints',
    description:
      'An accessible system must be established for identifying, receiving, recording, handling and responding to complaints.',
    legalRef: 'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, Reg 16',
    cycle: { months: 6 },
    category: 'quality',
    fields: [
      { key: 'review_period_start', label: 'Review Period Start', type: 'date', required: true },
      { key: 'review_period_end', label: 'Review Period End', type: 'date', required: true },
      { key: 'total_complaints', label: 'Total Complaints Received', type: 'text', required: true },
      { key: 'complaint_themes', label: 'Common Themes', type: 'textarea', required: true, placeholder: 'Most frequent complaint categories, patterns' },
      { key: 'resolution_summary', label: 'Resolution Summary', type: 'textarea', required: true, placeholder: 'How complaints were resolved, average resolution time' },
      { key: 'upheld_complaints', label: 'Complaints Upheld / Partially Upheld', type: 'text', placeholder: 'Number upheld' },
      { key: 'escalated', label: 'Complaints Escalated', type: 'textarea', placeholder: 'Any escalated to ombudsman or external body' },
      { key: 'lessons_learned', label: 'Lessons Learned', type: 'textarea', required: true, placeholder: 'Changes made as a result of complaints' },
      { key: 'policy_review', label: 'Complaints Policy Review', type: 'textarea', placeholder: 'Last reviewed, any changes, accessibility' },
    ],
  },
  {
    code: 'cqc_reg_18',
    framework: 'cqc',
    number: '18',
    title: 'Staffing',
    shortTitle: 'Staffing',
    description:
      'Sufficient numbers of suitably qualified, competent, skilled and experienced staff must be deployed to meet care needs at all times.',
    legalRef: 'Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, Reg 18',
    cycle: { months: 6 },
    category: 'staffing',
    fields: [
      { key: 'review_period_start', label: 'Review Period Start', type: 'date', required: true },
      { key: 'review_period_end', label: 'Review Period End', type: 'date', required: true },
      { key: 'total_staff', label: 'Total Staff Count', type: 'text', required: true },
      { key: 'vacancies', label: 'Current Vacancies', type: 'text' },
      { key: 'turnover_rate', label: 'Staff Turnover Rate', type: 'text', placeholder: 'e.g. 15%' },
      { key: 'sickness_absence', label: 'Sickness Absence Rate', type: 'text', placeholder: 'e.g. 3.5%' },
      { key: 'training_compliance', label: 'Mandatory Training Compliance', type: 'textarea', required: true, placeholder: 'Percentage completion for each mandatory course' },
      { key: 'supervision_compliance', label: 'Supervision Compliance', type: 'textarea', placeholder: 'Staff receiving regular supervision, frequency' },
      { key: 'recruitment_activity', label: 'Recruitment Activity', type: 'textarea', placeholder: 'Roles recruited, safe recruitment process compliance' },
      { key: 'staffing_concerns', label: 'Staffing Concerns', type: 'textarea', placeholder: 'Any gaps, risks, planned mitigations' },
      { key: 'actions', label: 'Actions & Improvements', type: 'textarea', required: true },
    ],
  },
];

// ── Exports ─────────────────────────────────────────────────────────────────

export const REGULATIONS = [...CIW_REGULATIONS, ...CQC_REGULATIONS];

export const REGULATION_MAP = Object.fromEntries(REGULATIONS.map((r) => [r.code, r]));

export const getRegulationsByFramework = (framework) =>
  REGULATIONS.filter((r) => r.framework === framework);

export const CATEGORY_LABELS = {
  governance: 'Governance',
  quality: 'Quality Assurance',
  safeguarding: 'Safeguarding',
  staffing: 'Staffing',
  notifications: 'Notifications',
};

export const FRAMEWORK_LABELS = {
  ciw: 'CIW (Care Inspectorate Wales)',
  cqc: 'CQC (Care Quality Commission)',
};

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId, getCurrentOrg } from '@/lib/orgContext';
import { createPageUrl } from '@/utils';
import OwnerWelcomeModal from '@/components/OwnerWelcomeModal';
import {
  CheckCircle2, Circle, ChevronDown, ChevronRight,
  Building2, Users, Calendar, Radio,
  Briefcase, PoundSterling, GraduationCap,
  Shield, FileText, Database, Cpu,
  ExternalLink, AlertCircle, Wand2, SlidersHorizontal,
} from 'lucide-react';

// ─── Manual checkbox persistence ─────────────────────────────────────────────
function getManual(orgId) {
  try { return JSON.parse(localStorage.getItem(`setuphub_${orgId}`) || '{}'); } catch { return {}; }
}
function saveManual(orgId, next) {
  localStorage.setItem(`setuphub_${orgId}`, JSON.stringify(next));
}

// ─── Data fetcher ─────────────────────────────────────────────────────────────
async function fetchHubData(orgId) {
  const cnt = (table) =>
    supabase.from(table).select('*', { count: 'exact', head: true }).eq('organization_id', orgId);

  const [
    { count: areasCount },
    { count: shiftTypesCount },
    { count: callTypesCount },
    { data: users },
    { count: careTeamsCount },
    { count: serviceUsersCount },
    { count: serviceUsersWithArea },
    { count: clientCallsCount },
    { count: shiftsCount },
    { count: shiftTemplatesCount },
    { count: shiftPatternsCount },
    { count: careLogConfigsCount },
    { count: medRecordsCount },
    { count: radioChannelsCount },
    { count: holidayAllowancesCount },
    { count: docReqsCount },
    { data: invoicingData },
    { count: payPeriodsCount },
    { count: coursesCount },
    { count: courseAssignmentsCount },
    { data: competencyFrameworks },
    { count: matrixItemsCount },
    { count: complianceCount },
    { count: formsCount },
    { count: assetsCount },
    { count: rotaPermsCount },
    { count: supervisionCount },
    { count: hrDocsCount },
  ] = await Promise.all([
    cnt('rota_areas'),
    cnt('shift_types'),
    cnt('call_types'),
    supabase.from('users').select('id, role, job_title, radio_channel_id, is_control_device, alerter_area_ids').eq('organization_id', orgId),
    cnt('care_teams'),
    cnt('service_users'),
    supabase.from('service_users').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).not('area_id', 'is', null),
    cnt('client_calls'),
    cnt('shifts'),
    cnt('base_shift_templates'),
    cnt('shift_patterns'),
    cnt('care_log_form_configs'),
    cnt('medication_records'),
    cnt('radio_channels'),
    cnt('holiday_allowances'),
    cnt('document_requirements'),
    supabase.from('invoicing_settings').select('is_configured').eq('organization_id', orgId).limit(1),
    cnt('pay_periods'),
    cnt('courses'),
    cnt('course_assignments'),
    supabase.from('competency_frameworks').select('is_active').eq('organization_id', orgId),
    supabase.from('training_matrix_items').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true),
    cnt('compliance_reports'),
    cnt('forms'),
    cnt('assets'),
    cnt('rota_permissions'),
    cnt('supervision_records'),
    cnt('hr_documents'),
  ]);

  // Feature permissions row
  const { data: permRow } = await supabase
    .from('system_settings')
    .select('setting_value')
    .eq('organization_id', orgId)
    .eq('setting_key', 'feature_permissions')
    .maybeSingle();

  let hasPermissionsRow = false;
  let radioLive = false;
  let alerterLive = false;
  if (permRow?.setting_value) {
    try {
      const p = JSON.parse(permRow.setting_value);
      hasPermissionsRow = true;
      radioLive   = p.radio_live?.enabled  !== false;
      alerterLive = p.alerter?.enabled     !== false;
    } catch {}
  }

  const allUsers  = users || [];
  const staffOnly = allUsers.filter(u => !['admin', 'super_admin'].includes(u.role));

  return {
    org: getCurrentOrg(),
    hasPermissionsRow,
    radioLive,
    alerterLive,
    areasCount:          areasCount  || 0,
    shiftTypesCount:     shiftTypesCount || 0,
    callTypesCount:      callTypesCount  || 0,
    staffCount:          allUsers.length,
    staffWithJobTitle:   allUsers.filter(u => u.job_title).length,
    rotaPermsCount:      rotaPermsCount || 0,
    careTeamsCount:      careTeamsCount || 0,
    serviceUsersCount:   serviceUsersCount || 0,
    serviceUsersWithArea: serviceUsersWithArea || 0,
    clientCallsCount:    clientCallsCount || 0,
    shiftsCount:         shiftsCount || 0,
    shiftTemplatesCount: shiftTemplatesCount || 0,
    shiftPatternsCount:  shiftPatternsCount  || 0,
    careLogConfigsCount: careLogConfigsCount || 0,
    medRecordsCount:     medRecordsCount || 0,
    radioChannelsCount:  radioChannelsCount  || 0,
    usersWithRadio:      allUsers.filter(u => u.radio_channel_id).length,
    hasControlDevice:    allUsers.some(u => u.is_control_device),
    hasAlerterAreas:     allUsers.some(u => (u.alerter_area_ids || []).length > 0),
    holidayAllowancesCount: holidayAllowancesCount || 0,
    docReqsCount:        docReqsCount || 0,
    invoicingConfigured: (invoicingData || [])[0]?.is_configured === true,
    payPeriodsCount:     payPeriodsCount || 0,
    coursesCount:        coursesCount || 0,
    courseAssignmentsCount: courseAssignmentsCount || 0,
    hasActiveFramework:  (competencyFrameworks || []).some(f => f.is_active),
    matrixItemsCount:    matrixItemsCount || 0,
    complianceCount:     complianceCount || 0,
    formsCount:          formsCount || 0,
    assetsCount:         assetsCount || 0,
    supervisionCount:    supervisionCount || 0,
    hrDocsCount:         hrDocsCount || 0,
  };
}

// ─── Group definitions ────────────────────────────────────────────────────────
// optional: true  →  not counted in the core % score; shown with "Optional" tag
function buildGroups(d, manual, toggle) {
  if (!d) return [];

  const m = (id, extra = {}) => ({
    done: !!manual[id],
    manual: true,
    onToggle: () => toggle(id),
    ...extra,
  });

  return [
    {
      id: 'organisation',
      label: 'Organisation',
      icon: Building2,
      color: 'teal',
      items: [
        { id: 'org_name', label: 'Company name set',   done: !!d.org?.name,                                        action: 'Settings' },
        { id: 'org_logo', label: 'Logo uploaded',       done: !!d.org?.logo_url,                                    action: 'Settings',  optional: true, note: 'Appears on PDFs and the app header' },
        { id: 'billing',  label: 'Subscription active', done: !!(d.org?.is_active && d.org?.plan !== 'pending'),    action: 'Settings',  note: '£99/month · unlimited staff · all features' },
      ],
    },
    {
      id: 'people',
      label: 'People & Structure',
      icon: Users,
      color: 'blue',
      items: [
        { id: 'areas',        label: `Rota areas created (${d.areasCount})`,                          done: d.areasCount > 0,              action: 'RotaManagement' },
        { id: 'shift_types',  label: `Shift types configured (${d.shiftTypesCount})`,                 done: d.shiftTypesCount > 0,         action: 'ShiftTypesManagement' },
        { id: 'call_types',   label: `Call types defined (${d.callTypesCount})`,                      done: d.callTypesCount > 0,          action: 'CallTypesManagement' },
        { id: 'staff',        label: `Staff added (${d.staffCount} member${d.staffCount !== 1 ? 's' : ''})`, done: d.staffCount > 1,       action: 'StaffManagement' },
        { id: 'roles',        label: 'Staff roles & job titles assigned',                              done: d.staffWithJobTitle > 0,       action: 'StaffManagement', optional: true },
        { id: 'rota_perms',   label: 'Rota area permissions set per staff',                           done: d.rotaPermsCount > 0,          action: 'StaffManagement', optional: true, note: 'Controls which areas each staff member can work in' },
        { id: 'clients',      label: `Clients / service users added (${d.serviceUsersCount})`,        done: d.serviceUsersCount > 0,       action: 'ClientManagement' },
        { id: 'clients_area', label: `Clients assigned to rota areas (${d.serviceUsersWithArea}/${d.serviceUsersCount})`, done: d.serviceUsersWithArea > 0, action: 'ClientManagement' },
        { id: 'client_calls', label: `Client call schedules configured (${d.clientCallsCount})`,      done: d.clientCallsCount > 0,        action: 'ClientManagement', note: 'Scheduled care times per client that drive the rota' },
        { id: 'care_teams',   label: `Care teams created (${d.careTeamsCount})`,                      done: d.careTeamsCount > 0,          action: 'CareTeamManagement', optional: true, note: 'Groups staff into teams per client or area' },
      ],
    },
    {
      id: 'permissions',
      label: 'Feature Permissions',
      icon: SlidersHorizontal,
      color: 'teal',
      items: [
        { id: 'perms_saved',   label: 'Feature permissions configured',   done: d.hasPermissionsRow,  action: 'permissions', note: 'Admin → Organisation → Permissions tab — control radio, alerter, LMA, training, AI and more per role' },
        { id: 'radio_live',    label: 'Radio system marked live',          done: d.radioLive,          action: 'permissions' },
        { id: 'alerter_live',  label: 'Alerter monitoring enabled',        done: d.alerterLive,        action: 'permissions' },
      ],
    },
    {
      id: 'scheduling',
      label: 'Scheduling & Care',
      icon: Calendar,
      color: 'indigo',
      items: [
        { id: 'shifts',     label: `Rota published (${d.shiftsCount} shifts)`,                        done: d.shiftsCount > 0,             action: 'Rota' },
        { id: 'templates',  label: `Base shift templates created (${d.shiftTemplatesCount})`,         done: d.shiftTemplatesCount > 0,     action: 'RotaManagement', optional: true, note: 'Recurring care needs per client — used for auto-rota generation' },
        { id: 'patterns',   label: `Shift patterns set up (${d.shiftPatternsCount})`,                 done: d.shiftPatternsCount > 0,      action: 'RotaManagement', optional: true },
        { id: 'care_log',   label: 'Care log form customised',                                        done: d.careLogConfigsCount > 0,     action: 'CareLogFormBuilder', optional: true, note: 'Default fields work out of the box — customise only if needed' },
        { id: 'meds',       label: `eMAR / medication records added (${d.medRecordsCount})`,          done: d.medRecordsCount > 0,         action: 'MedicationManagement', optional: true, note: 'Only needed for clients who receive medication support' },
        { id: 'photo_log',  label: 'Care log photo capture tested',                                  ...m('photo_log', { optional: true, note: 'Staff can take a photo directly on checkout — uploaded to care record, not saved to device' }) },
        { id: 'dash_tasks', label: 'Dashboard task approvals confirmed',                             ...m('dash_tasks', { action: 'Dashboard', optional: true, note: 'Admins can approve/reject leave, claims & swaps directly from the Tasks bar on Dashboard' }) },
      ],
    },
    {
      id: 'radio',
      label: 'Radio & Alerter',
      icon: Radio,
      color: 'violet',
      items: [
        { id: 'radio_channels', label: `Radio channels created (${d.radioChannelsCount})`,            done: d.radioChannelsCount > 0,      action: 'TwoWayRadio' },
        { id: 'radio_staff',    label: `Staff assigned to channels (${d.usersWithRadio})`,            done: d.usersWithRadio > 0,          action: 'TwoWayRadio' },
        { id: 'control_device', label: 'Control device designated',                                   done: d.hasControlDevice,            action: 'TwoWayRadio', note: 'The handset that receives alerter notifications' },
        { id: 'alerter_areas',  label: 'Alerter areas assigned to control device',                   done: d.hasAlerterAreas,             action: 'TwoWayRadio' },
        { id: 'radio_apk',      label: 'Radio APK installed on handset(s)',                          ...m('radio_apk', { action: 'download', note: 'Download from carecallai.co.uk/download' }) },
        { id: 'battery_opt',    label: 'Battery optimisation exemption accepted',                    ...m('battery_opt', { note: 'Required for alerter to wake screen when app is idle' }) },
        { id: 'radio_test_p2p', label: 'P2P call tested (handset ↔ handset)',                       ...m('radio_test_p2p', { optional: true }) },
        { id: 'radio_test_miss',label: 'Missed call & callback tested',                             ...m('radio_test_miss', { optional: true }) },
        { id: 'radio_test_5h',  label: 'Call received after 5+ hours idle',                        ...m('radio_test_5h',  { optional: true, note: 'Confirms foreground service keeps process alive' }) },
      ],
    },
    {
      id: 'hr',
      label: 'Leave, HR & Workforce',
      icon: Briefcase,
      color: 'rose',
      allOptional: true,
      items: [
        { id: 'holiday',      label: `Holiday allowances set (${d.holidayAllowancesCount} records)`, done: d.holidayAllowancesCount > 0, action: 'LeaveManagement',    optional: true },
        { id: 'doc_reqs',     label: `Staff document requirements defined (${d.docReqsCount})`,      done: d.docReqsCount > 0,          action: 'DocumentManagement', optional: true, note: 'DBS, references, ID, right to work, contract per role' },
        { id: 'hr_docs',      label: `HR documents uploaded (${d.hrDocsCount})`,                     done: d.hrDocsCount > 0,           action: 'DocumentManagement', optional: true, note: 'Contracts, handbooks, policies' },
        { id: 'supervisions', label: `Supervision records started (${d.supervisionCount})`,          done: d.supervisionCount > 0,      action: 'StaffSupervisions',  optional: true, note: 'CQC requires formal 1-to-1 every 12 weeks' },
        { id: 'onboarding',   label: 'Bulk staff onboarding completed',                             ...m('onboarding', { action: 'Admin', optional: true, note: 'Admin → Bulk Onboard — for migrating an existing team' }) },
      ],
    },
    {
      id: 'finance',
      label: 'Finance & Payroll',
      icon: PoundSterling,
      color: 'emerald',
      allOptional: true,
      items: [
        { id: 'invoicing',   label: 'Invoicing configured',                                           done: d.invoicingConfigured,        action: 'Invoicing',  optional: true, note: 'Company details, payment terms, tax, billing rates' },
        { id: 'pay_periods', label: `Payroll pay periods set up (${d.payPeriodsCount})`,              done: d.payPeriodsCount > 0,        action: 'Payroll',    optional: true },
        { id: 'pay_rates',   label: 'Staff pay rates entered',                                       ...m('pay_rates',  { action: 'Payroll',   optional: true }) },
        { id: 'mileage',     label: 'Mileage / HMRC rate confirmed',                                 ...m('mileage',    { action: 'Expenses',  optional: true, note: 'Current HMRC rate: 45p/mile first 10,000 miles' }) },
      ],
    },
    {
      id: 'training',
      label: 'Training & LMS',
      icon: GraduationCap,
      color: 'sky',
      allOptional: true,
      items: [
        { id: 'courses',      label: `Courses created (${d.coursesCount})`,                          done: d.coursesCount > 0,           action: 'Training',      optional: true },
        { id: 'assignments',  label: `Courses assigned to staff (${d.courseAssignmentsCount})`,      done: d.courseAssignmentsCount > 0, action: 'Training',      optional: true },
        { id: 'matrix',       label: `Training matrix items active (${d.matrixItemsCount})`,         done: d.matrixItemsCount > 0,       action: 'TrainingMatrix',optional: true },
        { id: 'competency',   label: 'Competency framework active',                                   done: d.hasActiveFramework,         action: 'CompetencyHub', optional: true },
        { id: 'certs',        label: 'Auto-certificate generation confirmed',                        ...m('certs', { optional: true, note: 'Complete a course and check a certificate is generated' }) },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance & Incidents',
      icon: Shield,
      color: 'orange',
      allOptional: true,
      items: [
        { id: 'compliance_setup', label: `Compliance regulations enabled (${d.complianceCount})`,    done: d.complianceCount > 0,        action: 'ComplianceManagement', optional: true, note: 'CQC, GDPR, Health & Safety etc.' },
        { id: 'incident_types',   label: 'Incident types & severity levels defined',               ...m('incident_types', { action: 'IncidentManagement',  optional: true }) },
        { id: 'safeguarding',     label: 'Safeguarding protocols configured',                      ...m('safeguarding',   { action: 'SafeguardingManagement', optional: true }) },
        { id: 'virtual_inspect',  label: 'Virtual inspection tool reviewed',                       ...m('virtual_inspect',{ action: 'Admin',                optional: true, note: 'Checks CQC readiness across all areas' }) },
      ],
    },
    {
      id: 'documents',
      label: 'Documents & Forms',
      icon: FileText,
      color: 'cyan',
      allOptional: true,
      items: [
        { id: 'policies',     label: 'Policies & procedures uploaded',                              ...m('policies',      { action: 'DocumentManagement', optional: true }) },
        { id: 'policy_assign',label: 'Policies assigned to staff roles',                           ...m('policy_assign', { action: 'StaffMatrix',         optional: true, note: 'Who must read and sign what' }) },
        { id: 'forms',        label: `Custom forms created (${d.formsCount})`,                      done: d.formsCount > 0,             action: 'FormBuilder', optional: true },
      ],
    },
    {
      id: 'assets',
      label: 'Assets & Data',
      icon: Database,
      color: 'slate',
      allOptional: true,
      items: [
        { id: 'assets_rec',  label: `Assets recorded (${d.assetsCount})`,                           done: d.assetsCount > 0,            action: 'AssetManagement', optional: true, note: 'Equipment, vehicles, property' },
        { id: 'data_import', label: 'Data import completed (if migrating)',                         ...m('data_import', { action: 'Admin',     optional: true, note: 'Admin → Data Import — for migrating from another system' }) },
        { id: 'retention',   label: 'Archive & data retention policies set',                       ...m('retention',   { action: 'Archives',  optional: true }) },
      ],
    },
    {
      id: 'engagement',
      label: 'Staff Engagement',
      icon: Shield,
      color: 'amber',
      allOptional: true,
      items: [
        { id: 'leaderboard',  label: 'Star leaderboard reviewed by staff',           ...m('leaderboard',  { action: 'StaffLeaderboard', optional: true, note: 'All staff earn stars: feedback submitted, awards received, full-attendance months, no late check-ins' }) },
        { id: 'awards_live',  label: 'Staff awards given to team',                   ...m('awards_live',  { action: 'StaffAwards',      optional: true, note: '1 star per award — staff profiles and leaderboard update automatically' }) },
        { id: 'feedback_live',label: 'Client feedback prompt active on care logs',   ...m('feedback_live',{ action: 'Feedback',          optional: true, note: 'Feedback prompt auto-appears after care log save — visible in Feedback page' }) },
      ],
    },
    {
      id: 'advanced',
      label: 'Advanced & APK',
      icon: Cpu,
      color: 'purple',
      allOptional: true,
      items: [
        { id: 'apk_staff',   label: 'Android staff switched to native APK',        ...m('apk_staff',    { action: 'download',    optional: true, note: 'carecallai.co.uk/download — full alerter, radio, GPS, biometrics' }) },
        { id: 'biometrics',  label: 'Biometric login enabled',                     ...m('biometrics',   { action: 'Settings',    optional: true }) },
        { id: 'control_room',label: 'Control Room GPS tracking confirmed live',    ...m('control_room', { action: 'ControlRoom', optional: true }) },
        { id: 'ai_enabled',  label: 'AI Assistant enabled',                        ...m('ai_enabled',   { action: 'Settings',    optional: true, note: 'Admin → Settings → AI features' }) },
      ],
    },
  ];
}

// ─── Colour map ────────────────────────────────────────────────────────────────
const COLORS = {
  teal:    { ring: 'ring-teal-200',   bg: 'bg-teal-50',   icon: 'text-teal-600',   badge: 'bg-teal-100 text-teal-700',   bar: 'bg-teal-500'   },
  blue:    { ring: 'ring-blue-200',   bg: 'bg-blue-50',   icon: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700',   bar: 'bg-blue-500'   },
  indigo:  { ring: 'ring-indigo-200', bg: 'bg-indigo-50', icon: 'text-indigo-600', badge: 'bg-indigo-100 text-indigo-700', bar: 'bg-indigo-500' },
  violet:  { ring: 'ring-violet-200', bg: 'bg-violet-50', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700', bar: 'bg-violet-500' },
  amber:   { ring: 'ring-amber-200',  bg: 'bg-amber-50',  icon: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700',  bar: 'bg-amber-500'  },
  rose:    { ring: 'ring-rose-200',   bg: 'bg-rose-50',   icon: 'text-rose-600',   badge: 'bg-rose-100 text-rose-700',   bar: 'bg-rose-500'   },
  emerald: { ring: 'ring-emerald-200',bg: 'bg-emerald-50',icon: 'text-emerald-600',badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  sky:     { ring: 'ring-sky-200',    bg: 'bg-sky-50',    icon: 'text-sky-600',    badge: 'bg-sky-100 text-sky-700',     bar: 'bg-sky-500'    },
  orange:  { ring: 'ring-orange-200', bg: 'bg-orange-50', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  cyan:    { ring: 'ring-cyan-200',   bg: 'bg-cyan-50',   icon: 'text-cyan-600',   badge: 'bg-cyan-100 text-cyan-700',   bar: 'bg-cyan-500'   },
  slate:   { ring: 'ring-slate-200',  bg: 'bg-slate-50',  icon: 'text-slate-600',  badge: 'bg-slate-100 text-slate-700', bar: 'bg-slate-500'  },
  purple:  { ring: 'ring-purple-200', bg: 'bg-purple-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
};

// ─── Component ─────────────────────────────────────────────────────────────────
export default function SetupHub() {
  const orgId   = getCurrentOrgId();
  const navigate = useNavigate();

  const [manual, setManual]       = useState(() => getManual(orgId));
  const [collapsed, setCollapsed] = useState({});
  const [showWizard, setShowWizard] = useState(false);

  const toggleManual = (id) => {
    const next = { ...manual, [id]: !manual[id] };
    setManual(next);
    saveManual(orgId, next);
  };

  const toggleGroup = (id) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  const { data, isLoading } = useQuery({
    queryKey: ['setupHub', orgId],
    queryFn:  () => fetchHubData(orgId),
    enabled:  !!orgId,
    staleTime: 30_000,
  });

  const groups = buildGroups(data, manual, toggleManual);

  // Core score: only required (non-optional) items
  const allItems     = groups.flatMap(g => g.items);
  const coreItems    = allItems.filter(i => !i.optional);
  const optItems     = allItems.filter(i => i.optional);
  const coreDone     = coreItems.filter(i => i.done).length;
  const optDone      = optItems.filter(i => i.done).length;
  const pct          = coreItems.length > 0 ? Math.round((coreDone / coreItems.length) * 100) : 0;
  const optRemaining = optItems.length - optDone;

  const handleAction = (action) => {
    if (!action) return;
    if (action === 'download') {
      window.open('https://carecallai.co.uk/download', '_blank');
    } else if (action === 'permissions') {
      // Navigate to OrgAdmin and open the Permissions tab
      navigate(createPageUrl('OrgAdmin') + '?tab=permissions');
    } else {
      navigate(createPageUrl(action));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400 text-sm">
        Loading setup status…
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-8">

      {/* ── Wizard modal ── */}
      {showWizard && (
        <OwnerWelcomeModal
          onComplete={() => setShowWizard(false)}
          onSkip={() => setShowWizard(false)}
        />
      )}

      {/* ── Header ── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold">Setup Hub</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Core setup: {coreDone} of {coreItems.length} tasks done
              {optRemaining > 0 && <span className="text-slate-500"> · {optRemaining} optional tasks available</span>}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-3xl font-extrabold text-white">{pct}%</span>
            <p className="text-slate-400 text-xs">core complete</p>
          </div>
        </div>
        <div className="h-2.5 rounded-full bg-slate-700 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20 w-full justify-center"
        >
          <Wand2 className="w-4 h-4 text-teal-400" />
          Launch Setup Wizard
          <span className="text-slate-400 text-xs ml-1">— guided walkthrough, skip any step</span>
        </button>
        {pct === 100 && (
          <p className="mt-3 text-teal-400 text-sm font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Core setup complete — explore optional features below to go further!
          </p>
        )}
      </div>

      {/* ── Groups ── */}
      {groups.map((group) => {
        const c          = COLORS[group.color];
        const Icon       = group.icon;
        const reqItems   = group.items.filter(i => !i.optional);
        const reqDone    = reqItems.filter(i => i.done).length;
        const allDone    = group.items.every(i => i.done);
        const coreDone_g = reqItems.length > 0 && reqItems.every(i => i.done);
        const isAllOpt   = group.allOptional || reqItems.length === 0;
        // Auto-collapse when all required items are done; optional sections start collapsed
        const isOpen     = collapsed[group.id] !== undefined
          ? !collapsed[group.id]
          : !(isAllOpt ? true : coreDone_g);

        return (
          <div
            key={group.id}
            className={`rounded-xl border overflow-hidden transition-all ${
              allDone ? 'border-green-200 bg-green-50' : `border-slate-200 bg-white`
            }`}
          >
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                allDone ? 'hover:bg-green-100' : 'hover:bg-slate-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                allDone ? 'bg-green-100' : c.bg
              }`}>
                {allDone
                  ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                  : <Icon className={`w-5 h-5 ${c.icon}`} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-semibold text-sm ${allDone ? 'text-green-700' : 'text-slate-800'}`}>
                    {group.label}
                  </span>
                  {isAllOpt
                    ? <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">Optional</span>
                    : <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coreDone_g ? 'bg-green-100 text-green-700' : c.badge}`}>
                        {reqDone}/{reqItems.length} required
                      </span>
                  }
                </div>
                {/* Mini progress bar — required items only */}
                {!coreDone_g && reqItems.length > 0 && (
                  <div className="h-1 rounded-full bg-slate-100 overflow-hidden mt-1.5 w-full max-w-xs">
                    <div className={`h-full rounded-full ${c.bar} transition-all`} style={{ width: `${(reqDone / reqItems.length) * 100}%` }} />
                  </div>
                )}
              </div>

              <div className="shrink-0 text-slate-400">
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>

            {/* Items */}
            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 px-4 py-3 ${
                      item.done ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                  >
                    {/* Status / manual checkbox */}
                    {item.manual ? (
                      <button
                        onClick={item.onToggle}
                        className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          item.done
                            ? 'bg-green-500 border-green-500'
                            : 'border-slate-300 hover:border-teal-400'
                        }`}
                        title="Click to mark as done"
                      >
                        {item.done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ) : (
                      <div className="mt-0.5 shrink-0">
                        {item.done
                          ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                          : <Circle className="w-5 h-5 text-slate-300" />
                        }
                      </div>
                    )}

                    {/* Label + note */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-sm font-medium leading-snug ${
                          item.done ? 'text-slate-400 line-through' : 'text-slate-700'
                        }`}>
                          {item.label}
                        </p>
                        {item.optional && !item.done && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 font-medium shrink-0">optional</span>
                        )}
                      </div>
                      {item.note && !item.done && (
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.note}</p>
                      )}
                    </div>

                    {/* Action button */}
                    {item.action && !item.done && (
                      <button
                        onClick={() => handleAction(item.action)}
                        className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${c.bg} ${c.icon} hover:opacity-80`}
                      >
                        {item.action === 'download'
                          ? <><ExternalLink className="w-3 h-3" /> Download</>
                          : <>Set up <ChevronRight className="w-3 h-3" /></>
                        }
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Footer tip ── */}
      <div className="flex items-start gap-2.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Ticked items (manual checkboxes) are saved per device. Auto-detected items update live from your data.
          Sections collapse automatically once all tasks are complete.
        </p>
      </div>
    </div>
  );
}

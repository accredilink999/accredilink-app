import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId } from '@/lib/orgContext';
import { toast } from 'sonner';
import {
  Radio, Bell, Calendar, GraduationCap, Shield, PoundSterling,
  Cpu, MapPin, Pill, FileText, Users, Stethoscope, Bot,
  LayoutDashboard, Save, Info, CheckCircle2,
} from 'lucide-react';

// ─── ROLES ────────────────────────────────────────────────────────────────────
// These match the role values stored on users.role / is_control_device
const ALL_ROLES = [
  { id: 'staff',          label: 'Staff',          color: 'bg-slate-100 text-slate-700 border-slate-300' },
  { id: 'admin',          label: 'Admin',          color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'super_admin',    label: 'Super Admin',    color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'control_device', label: 'Control Device', color: 'bg-violet-100 text-violet-700 border-violet-300' },
];

// ─── FEATURE DEFINITIONS ──────────────────────────────────────────────────────
// defaultRoles: what access looks like when NO settings row exists (safe default = everything on)
// noRoles: true → feature is just on/off, no per-role control needed
const SECTIONS = [
  {
    id: 'radio',
    label: 'Radio & Alerter',
    icon: Radio,
    color: 'violet',
    features: [
      {
        id: 'radio_p2p',
        label: 'Two-Way Radio (P2P calls)',
        desc: 'Staff can make direct voice calls to each other via radio channels',
        defaultRoles: ['staff', 'admin', 'super_admin', 'control_device'],
      },
      {
        id: 'radio_live',
        label: 'Radio system active',
        desc: 'Master switch — disabling this stops all radio activity for the org',
        defaultRoles: ['staff', 'admin', 'super_admin', 'control_device'],
        noRoles: true,
      },
      {
        id: 'alerter',
        label: 'Alerter monitoring',
        desc: 'Lone worker check-in alerts delivered to the control device',
        defaultRoles: ['admin', 'super_admin', 'control_device'],
      },
      {
        id: 'lma',
        label: 'Lone Mobile Alerter (LMA)',
        desc: 'Staff-side alert triggers — which roles can raise and receive LMA alerts',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
    ],
  },
  {
    id: 'scheduling',
    label: 'Scheduling & Rota',
    icon: Calendar,
    color: 'indigo',
    features: [
      {
        id: 'self_booking',
        label: 'Shift self-booking',
        desc: 'Staff can claim and book onto available open shifts',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
      {
        id: 'shift_swaps',
        label: 'Shift swap requests',
        desc: 'Staff can request to swap a shift with a colleague',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
      {
        id: 'gps_tracking',
        label: 'GPS clock-in required',
        desc: 'Enforce GPS location verification on clock in and clock out',
        defaultRoles: ['staff', 'admin', 'super_admin'],
        noRoles: true,
      },
    ],
  },
  {
    id: 'care',
    label: 'Care & Clinical',
    icon: Stethoscope,
    color: 'rose',
    features: [
      {
        id: 'care_logs',
        label: 'Care log submission',
        desc: 'Staff can submit care logs at the end of a shift',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
      {
        id: 'eMar',
        label: 'eMAR (medication administration)',
        desc: 'Which roles can record medication administration',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
      {
        id: 'clinical',
        label: 'Clinical features',
        desc: 'NEWS2, Waterlow, vitals, wound care, continence, repositioning records',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
    ],
  },
  {
    id: 'staff_features',
    label: 'Staff Features',
    icon: Users,
    color: 'blue',
    features: [
      {
        id: 'leave_requests',
        label: 'Leave requests',
        desc: 'Staff can submit and view their own leave requests',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
      {
        id: 'expenses',
        label: 'Expense claims',
        desc: 'Staff can submit mileage and expense claims',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
      {
        id: 'payslips',
        label: 'Payslip viewing',
        desc: 'Staff can view their own payslips and pay history',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
      {
        id: 'documents_self',
        label: 'Personal documents',
        desc: 'Staff can view and upload their own HR documents (DBS, contract etc.)',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
    ],
  },
  {
    id: 'training',
    label: 'Training & LMS',
    icon: GraduationCap,
    color: 'sky',
    features: [
      {
        id: 'training_access',
        label: 'Training access',
        desc: 'Which roles can access courses, modules and training certificates',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
      {
        id: 'training_management',
        label: 'Training management',
        desc: 'Create courses, assign to staff, manage the training matrix',
        defaultRoles: ['admin', 'super_admin'],
      },
    ],
  },
  {
    id: 'admin_tools',
    label: 'Admin Tools',
    icon: Shield,
    color: 'orange',
    features: [
      {
        id: 'control_room',
        label: 'Control Room',
        desc: 'Live view of staff locations, shifts, and active alerts',
        defaultRoles: ['admin', 'super_admin', 'control_device'],
      },
      {
        id: 'compliance',
        label: 'Compliance module',
        desc: 'CQC/CIW regulations, incidents, safeguarding, virtual inspection',
        defaultRoles: ['admin', 'super_admin'],
      },
      {
        id: 'invoicing',
        label: 'Invoicing',
        desc: 'Create and send client invoices',
        defaultRoles: ['admin', 'super_admin'],
      },
      {
        id: 'payroll',
        label: 'Payroll management',
        desc: 'Process payroll, view all staff pay',
        defaultRoles: ['super_admin'],
      },
      {
        id: 'ai_assistant',
        label: 'AI Assistant',
        desc: 'AI-powered admin help, policy writer and care advice',
        defaultRoles: ['admin', 'super_admin'],
      },
      {
        id: 'ai_staff',
        label: 'AI Assistant (staff)',
        desc: 'Allow regular staff to access the AI assistant',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
    ],
  },
  {
    id: 'documents',
    label: 'Documents & Forms',
    icon: FileText,
    color: 'cyan',
    features: [
      {
        id: 'org_documents',
        label: 'Organisation documents',
        desc: 'Policies, procedures and shared org files',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
      {
        id: 'form_builder',
        label: 'Custom forms',
        desc: 'Access to custom forms and form submissions',
        defaultRoles: ['staff', 'admin', 'super_admin'],
      },
    ],
  },
];

// ─── Colour map ───────────────────────────────────────────────────────────────
const COLORS = {
  violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-200', head: 'bg-violet-100' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-200', head: 'bg-indigo-100' },
  rose:   { bg: 'bg-rose-50',   icon: 'text-rose-600',   border: 'border-rose-200',   head: 'bg-rose-100'   },
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-200',   head: 'bg-blue-100'   },
  sky:    { bg: 'bg-sky-50',    icon: 'text-sky-600',    border: 'border-sky-200',    head: 'bg-sky-100'    },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200', head: 'bg-orange-100' },
  cyan:   { bg: 'bg-cyan-50',   icon: 'text-cyan-600',   border: 'border-cyan-200',   head: 'bg-cyan-100'   },
};

// ─── Default full-access permissions (used when no settings row exists) ────────
// SAFE: if no row in DB, every feature is ON for every role — no existing org is affected
function buildDefaults() {
  const out = {};
  SECTIONS.forEach(s => s.features.forEach(f => {
    out[f.id] = { enabled: true, roles: [...f.defaultRoles] };
  }));
  return out;
}

// ─── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        on ? 'bg-teal-500' : 'bg-slate-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        on ? 'translate-x-6' : 'translate-x-1'
      }`} />
    </button>
  );
}

// ─── Role pill ─────────────────────────────────────────────────────────────────
function RolePill({ role, active, onChange }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
        active
          ? role.color + ' opacity-100'
          : 'bg-white text-slate-400 border-slate-200 opacity-60'
      }`}
    >
      {role.label}
    </button>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function FeaturePermissions() {
  const orgId = getCurrentOrgId();
  const queryClient = useQueryClient();
  const [perms, setPerms] = useState(null); // null = not loaded yet
  const [isDirty, setIsDirty] = useState(false);
  const [hasExistingRow, setHasExistingRow] = useState(false);

  // Load settings
  const { isLoading } = useQuery({
    queryKey: ['featurePermissions', orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from('system_settings')
        .select('id, setting_value')
        .eq('organization_id', orgId)
        .eq('setting_key', 'feature_permissions')
        .maybeSingle();

      if (data?.setting_value) {
        try {
          const parsed = JSON.parse(data.setting_value);
          // Merge with defaults so any new feature IDs are always present
          const defaults = buildDefaults();
          const merged = { ...defaults, ...parsed };
          setPerms(merged);
          setHasExistingRow(true);
          return merged;
        } catch {}
      }
      // No row → use full-access defaults (safe — no existing org is affected)
      const defaults = buildDefaults();
      setPerms(defaults);
      setHasExistingRow(false);
      return defaults;
    },
    enabled: !!orgId,
    staleTime: 60_000,
  });

  // Save mutation
  const saveMut = useMutation({
    mutationFn: async (newPerms) => {
      const value = JSON.stringify(newPerms);
      if (hasExistingRow) {
        await supabase
          .from('system_settings')
          .update({ setting_value: value })
          .eq('organization_id', orgId)
          .eq('setting_key', 'feature_permissions');
      } else {
        await supabase
          .from('system_settings')
          .insert({ organization_id: orgId, setting_key: 'feature_permissions', setting_value: value });
        setHasExistingRow(true);
      }
    },
    onSuccess: () => {
      toast.success('Feature permissions saved');
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['featurePermissions', orgId] });
    },
    onError: () => toast.error('Failed to save — please try again'),
  });

  const update = (featureId, patch) => {
    setPerms(prev => ({ ...prev, [featureId]: { ...prev[featureId], ...patch } }));
    setIsDirty(true);
  };

  const toggleRole = (featureId, roleId) => {
    const current = perms[featureId]?.roles || [];
    const next = current.includes(roleId)
      ? current.filter(r => r !== roleId)
      : [...current, roleId];
    update(featureId, { roles: next });
  };

  if (isLoading || !perms) {
    return <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading permissions…</div>;
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-8">

      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Feature Permissions</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Control which features are active and which roles can access them
            </p>
          </div>
          <button
            onClick={() => saveMut.mutate(perms)}
            disabled={!isDirty || saveMut.isPending}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 ${
              isDirty
                ? 'bg-teal-500 hover:bg-teal-400 text-white'
                : 'bg-white/10 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {saveMut.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>

        {/* Safe-default notice */}
        {!hasExistingRow && (
          <div className="mt-4 flex items-start gap-2.5 bg-white/10 rounded-xl p-3">
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-white">No custom permissions saved yet.</strong>{' '}
              All features are fully active for all roles — this is the default.
              Changes only take effect after you tap <strong className="text-white">Save changes</strong>.
            </p>
          </div>
        )}
        {hasExistingRow && !isDirty && (
          <div className="mt-4 flex items-center gap-2 text-xs text-teal-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Custom permissions active for this organisation
          </div>
        )}
      </div>

      {/* Feature sections */}
      {SECTIONS.map(section => {
        const c    = COLORS[section.color];
        const Icon = section.icon;

        return (
          <div key={section.id} className={`rounded-xl border ${c.border} overflow-hidden`}>
            {/* Section header */}
            <div className={`flex items-center gap-2.5 px-4 py-3 ${c.head}`}>
              <Icon className={`w-4 h-4 ${c.icon} shrink-0`} />
              <span className={`text-sm font-semibold ${c.icon}`}>{section.label}</span>
            </div>

            {/* Feature rows */}
            <div className="divide-y divide-slate-100 bg-white">
              {section.features.map(feature => {
                const fp      = perms[feature.id] ?? { enabled: true, roles: [...feature.defaultRoles] };
                const enabled = fp.enabled;

                return (
                  <div key={feature.id} className={`px-4 py-3.5 ${!enabled ? 'opacity-50' : ''}`}>
                    <div className="flex items-start gap-3">
                      {/* Toggle */}
                      <div className="mt-0.5 shrink-0">
                        <Toggle on={enabled} onChange={val => update(feature.id, { enabled: val })} />
                      </div>

                      {/* Label + desc + roles */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800">{feature.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5 mb-2.5 leading-relaxed">{feature.desc}</p>

                        {/* Role pills — only shown if feature has role control and is enabled */}
                        {!feature.noRoles && enabled && (
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_ROLES.map(role => (
                              <RolePill
                                key={role.id}
                                role={role}
                                active={fp.roles.includes(role.id)}
                                onChange={() => toggleRole(feature.id, role.id)}
                              />
                            ))}
                          </div>
                        )}

                        {feature.noRoles && enabled && (
                          <span className="inline-flex items-center gap-1 text-xs text-teal-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active for all staff
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Sticky save bar when dirty */}
      {isDirty && (
        <div className="sticky bottom-4 flex items-center justify-between gap-3 bg-slate-900 text-white rounded-xl px-4 py-3 shadow-2xl border border-slate-700">
          <p className="text-sm text-slate-300">You have unsaved changes</p>
          <button
            onClick={() => saveMut.mutate(perms)}
            disabled={saveMut.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saveMut.isPending ? 'Saving…' : 'Save now'}
          </button>
        </div>
      )}
    </div>
  );
}

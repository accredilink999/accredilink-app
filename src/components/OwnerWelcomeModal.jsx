import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId, getCurrentOrg } from '@/lib/orgContext';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, Copy, Check, ArrowRight, ArrowLeft, Sparkles,
  Users, Calendar, Heart, Shield, CreditCard, GraduationCap,
  ClipboardList, MapPin, Pill, Bot, Home, Settings,
  UserPlus, Building2, KeyRound, ChevronRight, AlertTriangle,
  Clock, Grid3X3, LayoutGrid
} from 'lucide-react';

const SETUP_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to CareCallAI!',
    subtitle: 'Your all-in-one care management platform',
    icon: Sparkles,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    content: ({ org, trialDaysLeft }) => (
      <div className="space-y-4">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <p className="text-sm font-medium text-teal-800">
            Your 30-day free trial is active — {trialDaysLeft} days remaining
          </p>
          <p className="text-xs text-teal-600 mt-1">
            All features unlocked. No credit card required. Cancel anytime from Settings.
          </p>
        </div>
        <p className="text-sm text-slate-600">
          As the <strong>organisation owner</strong>, you have full control over {org?.name || 'your organisation'}.
          This guide will walk you through setting up everything in the <strong>correct order</strong>.
        </p>
        <div className="bg-slate-50 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 mb-2">YOUR ACCOUNT TYPE</p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
              <Shield className="w-3 h-3" /> Super Admin
            </span>
            <span className="text-xs text-slate-500">Full access to all features and settings</span>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>Important:</strong> Follow these steps in order. Each step depends on the previous one being completed first.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'areas',
    title: 'Step 1: Create Your Areas',
    subtitle: 'Define the geographic areas your agency covers',
    icon: MapPin,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Areas are the locations your staff work in. <strong>Everything else is organised by area</strong> — shifts, rotas, staff teams, and clients.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-800 mb-1">How to do it:</p>
          <p className="text-xs text-green-700">Go to <strong>Settings</strong> &gt; scroll to <strong>Rota Settings</strong> &gt; <strong>Areas</strong></p>
        </div>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="p-3">
            <p className="text-xs font-medium text-slate-500">EXAMPLES</p>
          </div>
          <div className="p-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm text-slate-700">Denbigh</span>
          </div>
          <div className="p-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-sm text-slate-700">Llangollen</span>
          </div>
          <div className="p-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-sm text-slate-700">Ruthin</span>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <p className="text-xs text-amber-700">
            <strong>Why first?</strong> Shift types, staff teams, service users, and rotas all need an area assigned to them.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'shift-types',
    title: 'Step 2: Create Shift Types',
    subtitle: 'Define the different shifts your staff work',
    icon: Clock,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Shift types define <strong>what kinds of shifts</strong> exist (morning, afternoon, night, etc.) with their start and end times. Each shift type belongs to an area.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm font-medium text-orange-800 mb-1">How to do it:</p>
          <p className="text-xs text-orange-700">Go to <strong>Settings</strong> &gt; <strong>Rota Settings</strong> &gt; <strong>Shift Types</strong></p>
        </div>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="p-3">
            <p className="text-xs font-medium text-slate-500">COMMON SHIFT TYPES</p>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm text-slate-700">Early Morning</span>
            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">07:00 — 14:00</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm text-slate-700">Afternoon</span>
            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">14:00 — 22:00</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm text-slate-700">Night</span>
            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">22:00 — 07:00</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm text-slate-700">Tea Call</span>
            <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">16:30 — 18:30</span>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <p className="text-xs text-amber-700">
            <strong>Why next?</strong> Blank schedules and rota patterns are built from shift types.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'blank-schedules',
    title: 'Step 3: Create Blank Schedules',
    subtitle: 'Build your base rota template before assigning staff',
    icon: Grid3X3,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Blank schedules are the <strong>empty shift slots</strong> that make up your weekly rota. They define <em>which shifts exist on which days</em> — before any staff are assigned.
        </p>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-sm font-medium text-indigo-800 mb-1">How to do it:</p>
          <p className="text-xs text-indigo-700">Go to <strong>Rota</strong> &gt; <strong>Base Templates</strong> tab &gt; <strong>Deploy Template</strong></p>
        </div>
        <div className="border border-slate-200 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-500 mb-2">HOW IT WORKS</p>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal ml-4">
            <li>Select an area (e.g. Denbigh)</li>
            <li>Choose a date range (e.g. next month)</li>
            <li>The system creates blank shift slots for each day using your shift types</li>
            <li>These blank slots are then ready to be filled with staff</li>
          </ol>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          <p className="text-xs text-amber-700">
            <strong>Why before staff?</strong> You need blank slots in the rota before you can assign staff to them via patterns.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'staff',
    title: 'Step 4: Add Staff & Set Roles',
    subtitle: 'Invite your team and assign permissions',
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    content: ({ org, copied, onCopy }) => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Add your staff members. You can either <strong>invite them with a code</strong> (they sign up themselves) or <strong>create their accounts directly</strong>.
        </p>

        {/* Method 1: Invite code */}
        <div className="border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 mb-2">OPTION A: INVITE CODE</p>
          {org?.invite_code && (
            <div className="flex items-center gap-2 mb-2">
              <code className="flex-1 bg-slate-100 px-3 py-2 rounded text-lg font-mono font-bold text-slate-900 tracking-[0.2em] text-center">
                {org.invite_code}
              </code>
              <button onClick={onCopy} className="p-2 rounded-md hover:bg-slate-100 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
          )}
          <p className="text-xs text-slate-500">
            Staff go to <strong>carecallai.co.uk/signup</strong> &gt; "Join Existing Team" &gt; enter this code
          </p>
        </div>

        {/* Method 2: Create directly */}
        <div className="border border-slate-200 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-500 mb-2">OPTION B: CREATE STAFF ACCOUNTS</p>
          <p className="text-xs text-slate-500">
            Go to <strong>Settings</strong> &gt; <strong>Staff Management</strong> to create accounts directly
          </p>
        </div>

        {/* Roles + teams */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800 mb-2">After adding staff:</p>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal ml-4">
            <li><strong>Set their role</strong> — admin (full access) or staff (limited access)</li>
            <li><strong>Assign them to an area/team</strong> — so they appear on the right rota</li>
            <li><strong>Set their job title</strong> — carer, senior carer, manager, etc.</li>
          </ol>
        </div>
      </div>
    ),
  },
  {
    id: 'clients',
    title: 'Step 5: Add Service Users',
    subtitle: 'Add the people your agency provides care to',
    icon: Heart,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Add your service users (clients) with their details, care plans, and medication info. <strong>Assign each client to an area</strong> so they appear on the right rota.
        </p>
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
          <p className="text-sm font-medium text-pink-800 mb-1">How to do it:</p>
          <p className="text-xs text-pink-700">Go to <strong>Service Users</strong> from the main menu &gt; <strong>Add Service User</strong></p>
        </div>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="p-3">
            <p className="text-xs font-medium text-slate-500">FOR EACH SERVICE USER, ADD:</p>
          </div>
          <div className="p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Name, address, and emergency contacts</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Assign to an area (e.g. Denbigh)</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Care plans and risk assessments</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Medication charts (eMAR) if applicable</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'patterns',
    title: 'Step 6: Create Rota Patterns',
    subtitle: 'Assign staff to shifts using repeating patterns',
    icon: LayoutGrid,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Patterns are the final step — they <strong>assign staff to the blank shift slots</strong> you created earlier. A pattern repeats weekly so you don't have to manually assign shifts every week.
        </p>
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
          <p className="text-sm font-medium text-violet-800 mb-1">How to do it:</p>
          <p className="text-xs text-violet-700">Go to <strong>Rota</strong> &gt; <strong>Patterns</strong> tab &gt; <strong>Create Pattern</strong></p>
        </div>
        <div className="border border-slate-200 rounded-lg p-3">
          <p className="text-xs font-medium text-slate-500 mb-2">HOW PATTERNS WORK</p>
          <ol className="text-sm text-slate-600 space-y-2 list-decimal ml-4">
            <li>Select a staff member</li>
            <li>Choose which days and shift types they work</li>
            <li>Deploy the pattern to fill in the blank rota slots</li>
            <li>The pattern repeats automatically each week</li>
          </ol>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs text-green-700">
            <strong>That's it!</strong> Once patterns are deployed, your rota is live. Staff can see their shifts in the app, check in via GPS, and start logging care.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'features',
    title: 'Step 7: Explore All Features',
    subtitle: 'Everything included in your plan',
    icon: Sparkles,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    content: () => (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Once your rota is set up, explore everything else available to you:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Calendar, label: 'Rota & Scheduling', desc: 'Shifts, patterns, templates' },
            { icon: Heart, label: 'Care Logging', desc: 'Daily notes, visit records' },
            { icon: Users, label: 'Staff Management', desc: 'HR, documents, leave' },
            { icon: Pill, label: 'eMAR Charts', desc: 'Medication management' },
            { icon: GraduationCap, label: 'Training', desc: 'Courses & certificates' },
            { icon: Shield, label: 'Compliance', desc: 'CIW/CQC inspection tools' },
            { icon: Bot, label: 'AI Assistant', desc: 'Policy writer, care advice' },
            { icon: MapPin, label: 'GPS Check-in', desc: 'Staff location tracking' },
            { icon: ClipboardList, label: 'Invoicing', desc: 'Generate & send invoices' },
            { icon: Home, label: 'Family Portal', desc: 'Updates for families' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="border border-slate-200 rounded-lg p-2.5">
              <div className="flex items-center gap-2 mb-0.5">
                <Icon className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                <span className="text-xs font-medium text-slate-900">{label}</span>
              </div>
              <p className="text-[10px] text-slate-400 ml-5.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'billing',
    title: 'Billing & Subscription',
    subtitle: 'Manage your plan and invite code anytime',
    icon: CreditCard,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Your subscription, billing, and invite code are all in one place:
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800">
            Settings &gt; scroll down to "Subscription & Billing"
          </p>
        </div>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">View your current plan and trial countdown</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Copy your staff invite code</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Upgrade or change your plan</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Manage payment method via Stripe</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">View invoices and cancel anytime</span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">QUICK SETUP SUMMARY</p>
          <ol className="text-xs text-slate-600 space-y-1.5 list-decimal ml-4">
            <li><strong>Areas</strong> — Settings &gt; Rota Settings &gt; Areas</li>
            <li><strong>Shift Types</strong> — Settings &gt; Rota Settings &gt; Shift Types</li>
            <li><strong>Blank Schedules</strong> — Rota &gt; Base Templates &gt; Deploy</li>
            <li><strong>Add Staff</strong> — invite code or Settings &gt; Staff Management</li>
            <li><strong>Set Roles & Teams</strong> — assign admin/staff, assign areas</li>
            <li><strong>Add Service Users</strong> — Service Users &gt; Add</li>
            <li><strong>Create Patterns</strong> — Rota &gt; Patterns &gt; Create</li>
          </ol>
        </div>
      </div>
    ),
  },
];

export default function OwnerWelcomeModal({ onComplete }) {
  const navigate = useNavigate();
  const org = getCurrentOrg();
  const orgId = getCurrentOrgId();
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [completing, setCompleting] = useState(false);

  const trialEnds = org?.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds - Date.now()) / 86400000)) : 7;

  const currentStep = SETUP_STEPS[step];
  const isLast = step === SETUP_STEPS.length - 1;
  const Icon = currentStep.icon;

  const handleCopy = () => {
    if (org?.invite_code) {
      navigator.clipboard.writeText(org.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await supabase
        .from('organizations')
        .update({ owner_onboarded: true })
        .eq('id', orgId);
      onComplete?.();
    } catch {
      onComplete?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg ${currentStep.iconBg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${currentStep.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 truncate">{currentStep.title}</h2>
              <p className="text-xs text-slate-500">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1">
            {SETUP_STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                title={s.title}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-teal-600' : i < step ? 'w-2 bg-teal-300' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-auto flex-1">
          {currentStep.content({ org, trialDaysLeft, copied, onCopy: handleCopy })}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
          <div>
            {step > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(step - 1)}
                className="text-slate-500"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{step + 1} / {SETUP_STEPS.length}</span>

            {isLast ? (
              <Button
                onClick={handleComplete}
                disabled={completing}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {completing ? 'Starting...' : "Start Setting Up"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={() => setStep(step + 1)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

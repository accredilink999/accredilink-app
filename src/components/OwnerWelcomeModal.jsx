import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId, getCurrentOrg } from '@/lib/orgContext';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, Copy, Check, ArrowRight, ArrowLeft, Sparkles,
  Users, Calendar, Heart, Shield, CreditCard, GraduationCap,
  ClipboardList, MapPin, Pill, Bot, Home, Settings,
  UserPlus, Building2, KeyRound, ChevronRight
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
            Your 7-day free trial is active — {trialDaysLeft} days remaining
          </p>
          <p className="text-xs text-teal-600 mt-1">
            You won't be charged until your trial ends. Cancel anytime from Settings.
          </p>
        </div>
        <p className="text-sm text-slate-600">
          As the <strong>organisation owner</strong>, you have full control over {org?.name || 'your organisation'}.
          This guide will walk you through setting up everything you need.
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
      </div>
    ),
  },
  {
    id: 'invite',
    title: 'Step 1: Invite Your Staff',
    subtitle: 'Share your invite code so staff can create accounts',
    icon: UserPlus,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    content: ({ org, copied, onCopy }) => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Your staff need to sign up at the app and enter this invite code to join your organisation:
        </p>
        {org?.invite_code && (
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-4 text-center">
            <p className="text-xs text-slate-500 mb-2">YOUR INVITE CODE</p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-2xl font-mono font-bold text-slate-900 tracking-[0.3em]">
                {org.invite_code}
              </code>
              <button
                onClick={onCopy}
                className="p-2 rounded-md hover:bg-slate-200 transition-colors"
              >
                {copied ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-slate-400" />}
              </button>
            </div>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm font-medium text-blue-800 mb-1">How staff join:</p>
          <ol className="text-xs text-blue-700 space-y-1 list-decimal ml-4">
            <li>Staff go to carecallai.co.uk/signup</li>
            <li>Choose "Join Existing Team"</li>
            <li>Enter this invite code</li>
            <li>Create their account with email and password</li>
            <li>They'll automatically join your organisation</li>
          </ol>
        </div>
        <p className="text-xs text-slate-400">
          You can also create staff accounts directly in Staff Management (Settings &gt; Staff).
          The invite code is always available in Settings &gt; Billing.
        </p>
      </div>
    ),
  },
  {
    id: 'areas',
    title: 'Step 2: Set Up Your Areas',
    subtitle: 'Define the geographic areas your organisation covers',
    icon: MapPin,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    navTo: '/Settings',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Areas are the locations your staff work in (e.g. "Denbigh", "Llangollen", "Cardiff North").
          Shifts and rotas are organised by area.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm font-medium text-green-800 mb-1">Where to set up:</p>
          <p className="text-xs text-green-700">Settings &gt; Rota Settings &gt; Areas</p>
        </div>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Add each area your agency covers</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Assign area colours for easy identification</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'shift-types',
    title: 'Step 3: Create Shift Types',
    subtitle: 'Define your shift patterns (morning, afternoon, etc.)',
    icon: Calendar,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    navTo: '/Settings',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Shift types define the different shifts your staff work. Each has a name, start time, and end time.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm font-medium text-orange-800 mb-1">Where to set up:</p>
          <p className="text-xs text-orange-700">Settings &gt; Rota Settings &gt; Shift Types</p>
        </div>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="p-3">
            <p className="text-sm font-medium text-slate-700">Common shift types:</p>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Early Morning</span>
            <span className="text-xs text-slate-400 font-mono">07:00 - 14:00</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Afternoon</span>
            <span className="text-xs text-slate-400 font-mono">14:00 - 22:00</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Night</span>
            <span className="text-xs text-slate-400 font-mono">22:00 - 07:00</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Tea Call</span>
            <span className="text-xs text-slate-400 font-mono">16:30 - 18:30</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'service-users',
    title: 'Step 4: Add Service Users',
    subtitle: 'Add the people your organisation provides care to',
    icon: Heart,
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    navTo: '/ServiceUsers',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Service users are the people receiving care. Add their details, care plans, risk assessments, and medication information.
        </p>
        <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
          <p className="text-sm font-medium text-pink-800 mb-1">Where to set up:</p>
          <p className="text-xs text-pink-700">Service Users (from main navigation)</p>
        </div>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Add each service user's name, address, and contact</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Upload care plans and risk assessments</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Set up medication charts (eMAR) if needed</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'features',
    title: 'Step 5: Explore Your Features',
    subtitle: 'Everything included in your plan',
    icon: Sparkles,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    content: () => (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Here's everything available to you:
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
    title: 'Step 6: Manage Billing',
    subtitle: 'View your subscription and manage payments',
    icon: CreditCard,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    navTo: '/Settings',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Your subscription and billing are managed in Settings. You can:
        </p>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">View your current plan and trial status</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Upgrade or change your plan</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Update payment method via Stripe portal</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">View invoices and payment history</span>
          </div>
          <div className="p-3 flex items-start gap-2">
            <ChevronRight className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-slate-600">Cancel subscription at any time</span>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm font-medium text-amber-800">
            Settings &gt; scroll down to "Subscription & Billing"
          </p>
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
      // Still complete even if DB update fails
      onComplete?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-slate-900/80 via-slate-800/80 to-slate-900/80 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg ${currentStep.iconBg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${currentStep.iconColor}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-900">{currentStep.title}</h2>
              <p className="text-xs text-slate-500">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {SETUP_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-teal-600' : i < step ? 'w-3 bg-teal-300' : 'w-3 bg-slate-200'
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
        <div className="p-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
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
            <span className="text-xs text-slate-400">{step + 1} of {SETUP_STEPS.length}</span>

            {isLast ? (
              <Button
                onClick={handleComplete}
                disabled={completing}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {completing ? 'Finishing...' : "Let's Go!"}
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

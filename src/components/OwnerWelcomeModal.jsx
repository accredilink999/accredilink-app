import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { getCurrentOrgId, getCurrentOrg } from '@/lib/orgContext';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  ArrowRight, ArrowLeft, Sparkles, X,
  Building2, Users, Calendar, Radio, Bell,
  Briefcase, PoundSterling, GraduationCap, Shield, FileText,
  MapPin, Clock, Heart, CheckCircle2, ChevronRight,
  Copy, Check, ExternalLink, ListChecks,
} from 'lucide-react';

// Each step maps to a Setup Hub group.
// action: { label, page } — navigates and closes wizard.
// skip appears on every step.
const STEPS = [
  {
    id: 'welcome',
    icon: Sparkles,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    title: 'Welcome to the Setup Wizard',
    subtitle: 'A guided walk through every section of the app',
    content: ({ org }) => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          This wizard walks you through setting up <strong>{org?.name || 'your organisation'}</strong> step by step.
          Each screen matches a section in the <strong>Setup Hub</strong> so you can come back and track progress any time.
        </p>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2">
          {[
            'Organisation — name, logo, billing',
            'People — areas, staff, clients, call types',
            'Scheduling — rota, shifts, care logs',
            'Radio & Alerter — channels, APK, alerter setup',
            'Notifications — push setup & testing',
            'Optional extras — HR, finance, training, compliance',
          ].map(t => (
            <div key={t} className="flex items-center gap-2 text-xs text-teal-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              {t}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          You can skip any step and come back to it later via the Setup Hub.
        </p>
      </div>
    ),
  },
  {
    id: 'organisation',
    icon: Building2,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    title: 'Organisation',
    subtitle: 'Name, logo and billing — the foundation of everything',
    actions: [
      { label: 'Go to Settings', page: 'Settings' },
    ],
    content: ({ org }) => (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Set your company name and logo first — they appear on care reports, invoices, and staff communications.
          Then activate your subscription to unlock full access.
        </p>
        <CheckList items={[
          { label: 'Company name set', done: !!org?.name },
          { label: 'Logo uploaded', done: !!org?.logo_url },
          { label: 'Subscription active (£99/month)', done: !!(org?.is_active && org?.plan !== 'pending') },
        ]} />
        <Tip>Settings → scroll to <strong>Organisation</strong> for name & logo, and <strong>Billing</strong> for the subscription.</Tip>
      </div>
    ),
  },
  {
    id: 'people',
    icon: Users,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'People & Structure',
    subtitle: 'Areas, staff, clients and call schedules',
    actions: [
      { label: 'Rota Areas & Types', page: 'RotaManagement' },
      { label: 'Staff Management', page: 'StaffManagement' },
      { label: 'Client Management', page: 'ClientManagement' },
    ],
    content: ({ org, copied, onCopy }) => (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Do these in order — areas first, then staff, then clients, then call schedules.
          Everything in the rota is organised by area.
        </p>
        <ol className="space-y-2">
          {[
            { n: 1, label: 'Create rota areas', where: 'Admin → Rota Management', desc: 'Geographic zones — Denbigh, Llangollen, etc.' },
            { n: 2, label: 'Add shift types & call types', where: 'Admin → Rota Management', desc: 'Morning, afternoon, night, tea call…' },
            { n: 3, label: 'Invite or create staff', where: 'Admin → Staff Management', desc: 'Email invite or manual account creation' },
            { n: 4, label: 'Add clients & assign to areas', where: 'Admin → Client Management', desc: 'Care plans, medication, risk assessments' },
            { n: 5, label: 'Set up client call schedules', where: 'Admin → Client Management → Calls', desc: 'Scheduled visit times that drive the rota' },
          ].map(({ n, label, where, desc }) => (
            <div key={n} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-[11px] text-slate-400">{where}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </ol>
        {org?.invite_code && (
          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-[11px] font-medium text-slate-400 mb-1.5">STAFF INVITE CODE</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-slate-100 px-3 py-1.5 rounded text-base font-mono font-bold text-slate-900 tracking-widest text-center">
                {org.invite_code}
              </code>
              <button onClick={onCopy} className="p-1.5 rounded hover:bg-slate-100 transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 text-center">carecallai.co.uk/signup → Join Existing Team</p>
          </div>
        )}
      </div>
    ),
  },
  {
    id: 'scheduling',
    icon: Calendar,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    title: 'Scheduling & Care',
    subtitle: 'Rota, shifts, patterns and care logs',
    actions: [
      { label: 'Open Rota', page: 'Rota' },
      { label: 'Rota Management', page: 'RotaManagement' },
    ],
    content: () => (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Once areas, staff and clients are set up, build the rota. Base templates generate the blank shift slots;
          patterns assign staff to them automatically each week.
        </p>
        <ol className="space-y-2">
          {[
            { n: 1, label: 'Create base shift templates', where: 'Rota → Base Templates', desc: 'Recurring care needs per client — Morning, Evening, Night for each client' },
            { n: 2, label: 'Deploy templates to generate shifts', where: 'Rota → Base Templates → Deploy', desc: 'Creates blank shift slots for your chosen date range' },
            { n: 3, label: 'Create shift patterns for staff', where: 'Rota Management → Patterns', desc: 'Which days each staff member works — repeats automatically' },
            { n: 4, label: 'Review care log form fields', where: 'Admin → Care Log Builder', desc: 'Defaults work out of the box — customise only if needed' },
          ].map(({ n, label, where, desc }) => (
            <div key={n} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-[11px] text-slate-400">{where}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </ol>
        <Tip>Once patterns are deployed, staff see their shifts in the app and can clock in via GPS.</Tip>
      </div>
    ),
  },
  {
    id: 'radio',
    icon: Radio,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    title: 'Radio & Alerter',
    subtitle: 'Two-way radio, P2P calls and lone worker alerts',
    actions: [
      { label: 'Open Two-Way Radio', page: 'TwoWayRadio' },
      { label: 'Download APK', href: 'https://carecallai.co.uk/download' },
    ],
    content: () => (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          The radio system lets staff communicate and the alerter notifies the control device when a lone worker check-in is missed.
          The dedicated <strong>Radio APK</strong> keeps the app alive permanently and wakes the screen on incoming calls.
        </p>
        <ol className="space-y-2">
          {[
            { n: 1, label: 'Create radio channels', where: 'Admin → Two-Way Radio', desc: 'One channel per team or area' },
            { n: 2, label: 'Assign staff to channels', where: 'Two-Way Radio → Channel members', desc: 'Staff appear in their channel and can P2P call each other' },
            { n: 3, label: 'Designate a control device', where: 'Two-Way Radio → Control Device', desc: 'The handset that receives alerter notifications' },
            { n: 4, label: 'Assign alerter areas to control device', where: 'Two-Way Radio → Alerter Settings', desc: 'Which areas the control device monitors' },
            { n: 5, label: 'Download & install Radio APK', where: 'carecallai.co.uk/download', desc: 'Native Android app — wake screen, pop-over other apps, foreground service' },
            { n: 6, label: 'Accept battery optimisation exemption', where: 'Android Settings → Battery', desc: 'Prevents Android from killing the radio process when idle' },
          ].map(({ n, label, where, desc }) => (
            <div key={n} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-[11px] text-slate-400">{where}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </ol>
      </div>
    ),
  },
  {
    id: 'notifications',
    icon: Bell,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'Notifications',
    subtitle: 'Push alerts for clock-in, clock-out, shift bookings and more',
    actions: [
      { label: 'Push Notification Dashboard', page: 'PushNotificationDashboard' },
      { label: 'Notification Settings', page: 'NotificationSettings' },
    ],
    content: () => (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Admins receive a push notification every time a staff member clocks in, clocks out, books onto a shift, or submits a care log.
          This requires FCM credentials to be configured once.
        </p>
        <ol className="space-y-2">
          {[
            { n: 1, label: 'Configure FCM credentials', where: 'Admin → Push Notification Dashboard', desc: 'Firebase Cloud Messaging — one-time setup, credentials provided by CareCall support if needed' },
            { n: 2, label: 'Confirm notifications are enabled globally', where: 'Admin → Notification Settings', desc: 'enabled_globally must be ON' },
            { n: 3, label: 'Open the app on your phone', where: 'app.carecallai.co.uk or APK', desc: 'Push token registers automatically when you open the app on a mobile device' },
            { n: 4, label: 'Test: ask a staff member to clock in', where: 'Live test', desc: 'You should receive a push notification within 5 seconds — tick this off in the Setup Hub' },
          ].map(({ n, label, where, desc }) => (
            <div key={n} className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{label}</p>
                <p className="text-[11px] text-slate-400">{where}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </ol>
        <Tip>Care log submissions notify the shift partner only, not admins — this is by design.</Tip>
      </div>
    ),
  },
  {
    id: 'optional',
    icon: Sparkles,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    title: 'Optional Features',
    subtitle: 'HR, finance, training, compliance and more — explore at your own pace',
    content: () => (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          The core app is live once scheduling and notifications are done. These features are optional extras
          that you can set up whenever you're ready — all tracked in the <strong>Setup Hub</strong>.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Briefcase,       label: 'Leave & HR',          desc: 'Allowances, sickness, supervisions, appraisals, policies' },
            { icon: PoundSterling,   label: 'Finance & Payroll',    desc: 'Invoicing, pay periods, expenses, mileage' },
            { icon: GraduationCap,   label: 'Training & LMS',       desc: 'Courses, matrix, competency frameworks, auto-certificates' },
            { icon: Shield,          label: 'Compliance',           desc: 'CQC/CIW regulations, incidents, safeguarding, virtual inspection' },
            { icon: FileText,        label: 'Documents & Forms',    desc: 'Policies, custom forms, filing cabinets' },
            { icon: MapPin,          label: 'Assets & Data',        desc: 'Equipment, vehicles, data import, retention' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="border border-slate-200 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-800">{label}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400">
          All of these are available now — just use the Setup Hub to track what's been configured.
        </p>
      </div>
    ),
  },
  {
    id: 'done',
    icon: CheckCircle2,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: "You're all set!",
    subtitle: 'Head to the Setup Hub to track your progress',
    content: () => (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          The wizard is complete. The <strong>Setup Hub</strong> in this tab shows your live progress —
          required tasks are auto-detected from your data, manual items can be ticked off as you complete them.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
          {[
            'Core score updates automatically as you add data',
            'Optional tasks are tracked separately — they never lower your core %',
            'Sections collapse once all required items are done',
            'Come back to this wizard any time from the Setup Hub',
          ].map(t => (
            <div key={t} className="flex items-center gap-2 text-xs text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" /> {t}
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

// ── Small shared components ────────────────────────────────────────────────────
function CheckList({ items }) {
  return (
    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
      {items.map(({ label, done }) => (
        <div key={label} className="flex items-center gap-2.5 px-3 py-2.5">
          {done
            ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            : <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />}
          <span className={`text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{label}</span>
          {done && <span className="ml-auto text-[10px] text-green-600 font-medium">Done</span>}
        </div>
      ))}
    </div>
  );
}

function Tip({ children }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
      <p className="text-xs text-amber-700">{children}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function OwnerWelcomeModal({ onComplete, onSkip }) {
  const navigate  = useNavigate();
  const org       = getCurrentOrg();
  const orgId     = getCurrentOrgId();
  const [step, setStep]       = useState(0);
  const [copied, setCopied]   = useState(false);
  const [saving, setSaving]   = useState(false);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const Icon    = current.icon;

  const handleCopy = () => {
    if (org?.invite_code) {
      navigator.clipboard.writeText(org.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const markOnboarded = async () => {
    try {
      await supabase.from('organizations').update({ owner_onboarded: true }).eq('id', orgId);
    } catch {}
  };

  const handleFinish = async () => {
    setSaving(true);
    await markOnboarded();
    onComplete?.();
  };

  const handleSkip = async () => {
    await markOnboarded();
    onSkip?.();
  };

  const handleAction = (action) => {
    if (action.href) {
      window.open(action.href, '_blank');
    } else if (action.page) {
      navigate(createPageUrl(action.page));
      handleSkip();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl ${current.iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${current.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-slate-900 leading-tight">{current.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{current.subtitle}</p>
            </div>
            <button
              onClick={handleSkip}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
              title="Close wizard"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                title={s.title}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-teal-600' : i < step ? 'w-2 bg-teal-300' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
            <span className="ml-auto text-[11px] text-slate-400">{step + 1}/{STEPS.length}</span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-auto flex-1 space-y-4">
          {current.content({ org, copied, onCopy: handleCopy })}

          {/* Action buttons (go-there shortcuts) */}
          {current.actions?.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Go there now</p>
              <div className="flex flex-wrap gap-2">
                {current.actions.map(a => (
                  <button
                    key={a.label}
                    onClick={() => handleAction(a)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
                  >
                    {a.href ? <ExternalLink className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)} className="text-slate-500">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
            )}
            <button
              onClick={handleSkip}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1.5"
            >
              Skip for now
            </button>
          </div>

          {isLast ? (
            <Button onClick={handleFinish} disabled={saving} className="bg-teal-600 hover:bg-teal-700 gap-1.5">
              <ListChecks className="w-4 h-4" />
              {saving ? 'Saving…' : 'Go to Setup Hub'}
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)} className="bg-teal-600 hover:bg-teal-700 gap-1.5">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  MapPin, Tag, LayoutTemplate, Rocket, UserCheck, Settings,
  Eye, CalendarCheck, Clock, ClipboardList, LogOut, Plane,
  ChevronRight, Info, AlertTriangle, CheckCircle2, Repeat2,
} from 'lucide-react';

// ─── Shared building blocks ────────────────────────────────────────────────────

function StepCard({ number, icon: Icon, iconColor, title, children, tip, warning }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${iconColor || 'bg-teal-600'}`}>
          {number}
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-2 mb-0" />
      </div>
      <div className="pb-6 flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="w-4 h-4 text-slate-500 shrink-0" />}
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        </div>
        <div className="text-sm text-slate-600 space-y-2">{children}</div>
        {tip && (
          <div className="mt-2 flex gap-2 bg-teal-50 border border-teal-100 rounded-lg p-2.5">
            <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <p className="text-xs text-teal-700">{tip}</p>
          </div>
        )}
        {warning && (
          <div className="mt-2 flex gap-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{warning}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ children, color = 'slate' }) {
  const colors = {
    teal:   'bg-teal-100 text-teal-800',
    slate:  'bg-slate-100 text-slate-700',
    violet: 'bg-violet-100 text-violet-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    orange: 'bg-orange-100 text-orange-800',
    amber:  'bg-amber-100 text-amber-800',
    green:  'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}

function SectionHeading({ children }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{children}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

// ─── Admin tab ────────────────────────────────────────────────────────────────

function AdminGuide() {
  return (
    <div className="space-y-0 text-sm">

      {/* Intro banner */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-xl p-4 mb-5 text-white">
        <p className="font-semibold text-base mb-1">Rota Setup — Follow Steps 1 → 6</p>
        <p className="text-teal-100 text-xs leading-relaxed">
          First-time setup takes about 10 minutes. Once your base shifts are deployed you just allocate staff and the system handles the rest.
        </p>
      </div>

      <SectionHeading>Initial Setup</SectionHeading>

      <StepCard
        number="1"
        icon={MapPin}
        iconColor="bg-orange-500"
        title="Create Rota Areas"
        tip='Open "Setup / Edit Rotas" → "1. Create / Manage Rota Areas". Create one area per geographic team or care run — e.g. "Denbigh Late", "Town Early".'
      >
        <p>
          A <strong>Rota Area</strong> is a team zone — it groups together the shifts, clients, and staff for one run or location.
          Every shift and client belongs to exactly one area.
        </p>
        <p>Create all your areas before doing anything else.</p>
      </StepCard>

      <StepCard
        number="2"
        icon={Tag}
        iconColor="bg-violet-500"
        title="Create Shift Types"
        tip='Open "Setup / Edit Rotas" → "2. Create / Manage Shift Types". Set a default start and end time for each type — these auto-fill when creating shifts.'
      >
        <p>
          A <strong>Shift Type</strong> is a named, timed template — e.g.{' '}
          <Pill color="violet">Late Denbigh 15:15–21:15</Pill>{' '}
          or{' '}
          <Pill color="violet">Early Town 07:00–14:30</Pill>.
        </p>
        <p>Shift types drive auto-pairing and live call resolution. Create one for every distinct shift pattern in each area.</p>
      </StepCard>

      <StepCard
        number="3"
        icon={LayoutTemplate}
        iconColor="bg-indigo-500"
        title="Build Base Shift Templates"
        tip='Open "Setup / Edit Rotas" → "3. Create / Manage / Deploy Base Shifts". Build one template per area — add each shift type that runs in a typical week.'
      >
        <p>
          A <strong>Base Shift Template</strong> is a blank week blueprint for one area.
          You add each shift slot (by shift type) once — Monday Late, Tuesday Late, etc.
        </p>
        <p>
          Client calls are <em>not</em> set here — they live on the client record and are resolved automatically when staff open a shift.
          The template is purely about which shifts exist on which days of the week.
        </p>
      </StepCard>

      <StepCard
        number="4"
        icon={Rocket}
        iconColor="bg-teal-600"
        title="Deploy Base Shifts"
        tip="Inside the Base Shifts manager, choose a start date and how many weeks to deploy. The system stamps out blank shifts across the rota for that period."
        warning="Never re-deploy over weeks that already have shifts — it creates duplicates. Deploy once for the whole period, then extend when you need more."
      >
        <p>
          <strong>Deploy</strong> rolls your template out into real calendar days as{' '}
          <Pill color="slate">blank</Pill> shifts — visible on the rota in grey, ready for staff to be allocated.
        </p>
        <p>
          Clients' scheduled calls are automatically linked when a blank shift is opened or allocated — no manual work needed.
        </p>
      </StepCard>

      <SectionHeading>Day-to-Day Management</SectionHeading>

      <StepCard
        number="5"
        icon={UserCheck}
        iconColor="bg-teal-600"
        title="Allocate Staff to Blank Shifts"
        tip="Tip: choose a recurring option (every week, every 2 weeks, etc.) to fill all future blanks in that pattern at once — saves you doing each shift individually."
      >
        <p>
          Click any <Pill color="slate">grey blank shift</Pill> on the rota → search or pick a staff member → click <strong>Allocate</strong>.
        </p>
        <p>You will be asked:</p>
        <ul className="list-none space-y-1 mt-1 ml-1">
          {[
            ['One-off', 'Just this date'],
            ['Every week', 'Same day every week going forward'],
            ['Every 2 weeks', 'Fortnightly — great for alternating staff'],
            ['Every 3 / 4 weeks', 'Less frequent rotas'],
          ].map(([label, desc]) => (
            <li key={label} className="flex items-start gap-1.5">
              <ChevronRight className="w-3 h-3 text-teal-500 mt-0.5 shrink-0" />
              <span><strong>{label}</strong> — {desc}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Only <Pill color="slate">blank</Pill> future shifts in the same pattern are updated — staffed shifts and past shifts are never touched.
        </p>
      </StepCard>

      <StepCard
        number="6"
        icon={Settings}
        iconColor="bg-slate-600"
        title="Ongoing Rota Management"
      >
        <p>Click any <strong>filled (coloured) shift</strong> to open the Shift Detail panel where you can:</p>
        <ul className="list-none space-y-1 mt-1 ml-1">
          {[
            'Change staff member (this shift, all future, or by interval)',
            'View and edit client calls on the shift',
            'End a recurring pattern from a specific date',
            'Add a sit-in cover requirement',
            'Delete or reset a shift back to blank',
          ].map(item => (
            <li key={item} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          For <strong>ad hoc shifts</strong> (one-off visits, cover, meetings) — click any empty day slot directly on the rota grid to open the shift creation panel.
          These start with no client calls by default; tick <em>"Include client calls"</em> if the shift needs them.
        </p>
      </StepCard>

      <SectionHeading>Quick Reference</SectionHeading>

      <div className="grid grid-cols-2 gap-2 pb-4">
        {[
          { color: 'bg-slate-200', label: 'Grey shift', desc: 'Blank — no staff yet' },
          { color: 'bg-teal-500', label: 'Teal shift', desc: 'Staffed & scheduled' },
          { color: 'bg-amber-400', label: 'Amber shift', desc: 'In progress / clocked in' },
          { color: 'bg-green-500', label: 'Green shift', desc: 'Completed' },
        ].map(({ color, label, desc }) => (
          <div key={label} className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <div className={`w-3 h-8 rounded ${color} shrink-0`} />
            <div>
              <p className="text-xs font-semibold text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Staff tab ────────────────────────────────────────────────────────────────

function StaffGuide() {
  return (
    <div className="space-y-0 text-sm">

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-5 text-white">
        <p className="font-semibold text-base mb-1">Your Rota — How It Works</p>
        <p className="text-blue-100 text-xs leading-relaxed">
          Everything you need for your shift is in one place — from viewing your schedule to completing client visits and clocking off.
        </p>
      </div>

      <SectionHeading>Finding Your Shifts</SectionHeading>

      <StepCard
        number="1"
        icon={Eye}
        iconColor="bg-blue-500"
        title="View Your Schedule"
        tip='Use the "My Shifts" toggle to filter only your shifts. Switch between Day, Week, and Month views to plan ahead.'
      >
        <p>
          The rota defaults to showing all shifts in your area. Tap{' '}
          <Pill color="teal">My Shifts</Pill> in the top-right to see only yours.
        </p>
        <p>
          Your shifts are colour-coded:
        </p>
        <ul className="list-none space-y-1 mt-1 ml-1">
          {[
            ['Teal', 'Scheduled — your name is on it'],
            ['Amber', 'Active — you are clocked in'],
            ['Green', 'Completed'],
            ['Grey', 'Available — no one allocated yet (see Step 2)'],
          ].map(([col, desc]) => (
            <li key={col} className="flex items-start gap-1.5">
              <ChevronRight className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
              <span><strong>{col}</strong> — {desc}</span>
            </li>
          ))}
        </ul>
      </StepCard>

      <StepCard
        number="2"
        icon={CalendarCheck}
        iconColor="bg-teal-600"
        title="Claiming an Available Shift"
        tip="Your claim goes to an admin for approval. You'll get a notification once it's confirmed. You can only claim shifts in your assigned area."
      >
        <p>
          See a <Pill color="slate">grey shift</Pill> you can cover? Tap it → tap <strong>Claim Shift</strong> → add an optional note → submit.
        </p>
        <p>
          Admin will review and approve. Once approved the shift turns teal and shows your name.
        </p>
      </StepCard>

      <SectionHeading>Working Your Shift</SectionHeading>

      <StepCard
        number="3"
        icon={Clock}
        iconColor="bg-amber-500"
        title="Starting Your Shift — Clock In"
        tip="You must clock in before you can start completing client visits. The system records your exact start time."
      >
        <p>
          Tap your shift → tap <strong>Clock In</strong>. Your shift turns amber to show it is live.
        </p>
        <p>
          You will see the full list of client visits scheduled for your shift, ordered by time.
        </p>
      </StepCard>

      <StepCard
        number="4"
        icon={ClipboardList}
        iconColor="bg-indigo-500"
        title="Completing Client Visits"
        tip="Always complete the task list fully and add notes for anything out of the ordinary — this forms the care record."
      >
        <p>
          Tap any client visit on your shift to open it. For each visit:
        </p>
        <ul className="list-none space-y-1 mt-2 ml-1">
          {[
            'Tick each care task as you complete it',
            'Add any notes or observations',
            'Record medication administered if prompted',
            'Mark the visit as Complete when you leave',
          ].map(item => (
            <li key={item} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </StepCard>

      <StepCard
        number="5"
        icon={LogOut}
        iconColor="bg-green-600"
        title="Ending Your Shift — Clock Off"
        tip="You cannot clock off until all visits are marked complete. If a visit could not be done, mark it as missed with a reason."
        warning="Never clock off a shift without completing or explaining every visit — this affects the client's care record."
      >
        <p>
          Once all visits are done, tap <strong>Clock Off</strong> on your shift. Add any handover notes for the next carer.
        </p>
        <p>
          Your shift turns green and the record is saved. Well done!
        </p>
      </StepCard>

      <SectionHeading>Time Off &amp; Swaps</SectionHeading>

      <StepCard
        number="6"
        icon={Plane}
        iconColor="bg-sky-500"
        title="Requesting Annual Leave or Swaps"
        tip="Submit requests as early as possible — admin needs enough time to cover the shift before approving leave."
      >
        <p>
          Go to the <strong>Leave</strong> section of the app (bottom navigation) to:
        </p>
        <ul className="list-none space-y-1 mt-1 ml-1">
          {[
            'Request annual leave (chosen dates)',
            'Request a shift swap with a colleague',
            'View your remaining leave balance',
            'Check the status of past requests',
          ].map(item => (
            <li key={item} className="flex items-start gap-1.5">
              <ChevronRight className="w-3 h-3 text-sky-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          You will receive a push notification when your request is approved or declined.
        </p>
      </StepCard>

      <StepCard
        number="7"
        icon={Repeat2}
        iconColor="bg-slate-600"
        title="Paired Shifts"
      >
        <p>
          Some shifts are <strong>paired</strong> — two staff work the same run together.
          On the rota you will see your co-worker's name shown alongside yours.
        </p>
        <p>
          If your partner changes or goes on leave, admin will update the pairing. Your schedule is not affected.
        </p>
      </StepCard>

    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function RotaTutorialModal({ open, onClose, defaultTab = 'admin' }) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="text-lg">Rota Guide</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="grid grid-cols-2 mx-5 shrink-0">
            <TabsTrigger value="admin" className="text-sm">Admin Setup</TabsTrigger>
            <TabsTrigger value="staff" className="text-sm">Staff Guide</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
            <TabsContent value="admin" className="mt-0">
              <AdminGuide />
            </TabsContent>
            <TabsContent value="staff" className="mt-0">
              <StaffGuide />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/**
 * pageTutorials.jsx
 * Tutorial content for every page in CareCall AI.
 * Each key maps to { title, adminContent, staffContent, staffOnly? }
 * Imported by TutorialModal and PageHeader.
 */

import {
  Users, UserCheck, UserPlus, Calendar, Clock, ClipboardList, FileText,
  Settings, Bell, Shield, MessageSquare, BookOpen, AlertTriangle,
  TrendingUp, PoundSterling, Plane, Star, Bot, Building2, Heart,
  MapPin, Tag, LayoutTemplate, Rocket, LogOut, Eye, Repeat2,
  CalendarCheck, ListChecks, CheckCircle2, Upload, Download,
  Lock, Key, Smartphone, Activity, BarChart3, CreditCard,
  Stethoscope, Archive, Radio, HelpCircle, GraduationCap, Wallet,
  Receipt, CalendarOff, ClipboardCheck, Siren, Database, Wrench, Phone,
} from 'lucide-react';
import { StepCard } from '@/components/TutorialModal';

// ─── Shared pill helper ─────────────────────────────────────────────────────
function Pill({ children, color = 'teal' }) {
  const colors = {
    teal:   'bg-teal-100 text-teal-800',
    blue:   'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    violet: 'bg-violet-100 text-violet-800',
    amber:  'bg-amber-100 text-amber-800',
    green:  'bg-green-100 text-green-800',
    rose:   'bg-rose-100 text-rose-800',
    slate:  'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${colors[color] || colors.teal}`}>
      {children}
    </span>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
const Dashboard = {
  title: 'Dashboard Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="Overview Stats">
        <p>The top cards show <strong>today's key metrics</strong> for your organisation — visits scheduled, tasks outstanding, shifts running, and awards given.</p>
        <p>These update in real time as staff clock in and complete visits.</p>
      </StepCard>
      <StepCard number={2} icon={AlertTriangle} iconColor="bg-amber-500" title="Admin Task Tray"
        tip="Tap the tray to expand pending items — leave requests, shift swaps, claim requests, and open incidents all appear here.">
        <p>The amber tray at the top shows everything needing your attention. Expand it and action each item directly from this page without navigating away.</p>
      </StepCard>
      <StepCard number={3} icon={Calendar} iconColor="bg-teal-500" title="Today's Shifts">
        <p>The shifts panel lists every shift running today, colour-coded by status. Tap any shift to open the full detail modal.</p>
      </StepCard>
      <StepCard number={4} icon={Star} iconColor="bg-amber-400" title="Awards & Leaderboard">
        <p>Give a staff member a star by tapping the <Pill color="amber">⭐ Give Award</Pill> button. Stars appear on their dashboard and feed the monthly leaderboard.</p>
      </StepCard>
      <StepCard number={5} icon={Activity} iconColor="bg-slate-500" title="Quick Actions">
        <p>Use the quick action tiles at the bottom to jump to the most common admin tasks — Shifts, Clients, Approvals, and more.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Calendar} iconColor="bg-teal-500" title="Your Shifts Today">
        <p>Your shifts for today are listed near the top. Each card shows the area, start/end time, and current status.</p>
        <p>Tap a shift to clock in, view your client visit list, and log care.</p>
      </StepCard>
      <StepCard number={2} icon={Heart} iconColor="bg-rose-500" title="Today's Visits">
        <p>The <strong>Today's Visits</strong> card shows how many client care calls are planned in your shifts today, and how many you've completed.</p>
      </StepCard>
      <StepCard number={3} icon={ListChecks} iconColor="bg-purple-500" title="Tasks">
        <p>The Tasks card counts outstanding care tasks across all your visits today. Tap it to see the full list and check items off as you go.</p>
      </StepCard>
      <StepCard number={4} icon={Star} iconColor="bg-amber-400" title="Awards">
        <p>Stars given to you or your team today appear on the Awards card. Tap to see who gave them and what for.</p>
      </StepCard>
      <StepCard number={5} icon={Bell} iconColor="bg-blue-500" title="Available Shifts">
        <p>If there are available shifts in your rota areas, they appear below your shifts. Tap <Pill>Claim</Pill> to request to cover.</p>
      </StepCard>
    </>
  ),
};

// ─── STAFF MANAGEMENT ────────────────────────────────────────────────────────
const StaffManagement = {
  title: 'Staff Management Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={UserPlus} iconColor="bg-teal-500" title="Inviting New Staff">
        <p>Tap <Pill color="teal">+ Invite Staff</Pill> and enter the new team member's email address. They'll receive an email with a sign-up link.</p>
        <p>They'll be automatically joined to your organisation when they register.</p>
        tip="Send the invite code from Settings → Organisation if they register manually."
      </StepCard>
      <StepCard number={2} icon={Shield} iconColor="bg-violet-500" title="Setting Roles">
        <p>Open a staff profile and change their <strong>Role</strong> to <Pill color="violet">Admin</Pill>, <Pill>Manager</Pill>, or <Pill color="slate">Staff</Pill>.</p>
        <p>Admins can manage rotas, approve leave, and access all settings. Staff can only see their own data.</p>
      </StepCard>
      <StepCard number={3} icon={MapPin} iconColor="bg-orange-500" title="Rota Permissions">
        <p>Assign staff to rota areas under the <strong>Permissions</strong> tab of their profile. Staff will only see shifts and clients in areas they're assigned to.</p>
      </StepCard>
      <StepCard number={4} icon={GraduationCap} iconColor="bg-indigo-500" title="Training Records">
        <p>Each staff profile has a <strong>Training</strong> tab showing their completed courses and expiry dates. You can add records manually or they update automatically from the Training page.</p>
      </StepCard>
      <StepCard number={5} icon={UserCheck} iconColor="bg-green-500" title="Archiving Staff">
        <p>When a staff member leaves, set their status to <Pill color="slate">Inactive</Pill> from their profile. This retains all their records for compliance but removes them from active lists.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="Your Profile">
        <p>Go to your profile to update your contact details, upload a photo, and view your role and permissions.</p>
      </StepCard>
      <StepCard number={2} icon={Users} iconColor="bg-teal-500" title="Viewing Colleagues">
        <p>The staff list shows active team members. Tap any name to view their contact details and role — useful for cover requests.</p>
      </StepCard>
    </>
  ),
};

// ─── CLIENT MANAGEMENT ───────────────────────────────────────────────────────
const ClientManagement = {
  title: 'Client Management Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={UserPlus} iconColor="bg-teal-500" title="Adding a New Client">
        <p>Tap <Pill color="teal">+ Add Client</Pill> and fill in the client's personal details, address, emergency contacts, and care requirements.</p>
        <p>All fields marked with <strong>*</strong> are required for compliance records.</p>
      </StepCard>
      <StepCard number={2} icon={Heart} iconColor="bg-rose-500" title="Care Plan">
        <p>Each client profile has a <strong>Care Plan</strong> tab. Record their preferred routines, medication needs, mobility status, and specific care instructions here.</p>
        <tip>Keep care plans up to date — staff see these before every visit.</tip>
      </StepCard>
      <StepCard number={3} icon={Clock} iconColor="bg-orange-500" title="Call Times">
        <p>Set the client's <strong>scheduled call times</strong> (morning, lunch, tea, bedtime) in their profile. These feed directly into the rota when shifts are built.</p>
      </StepCard>
      <StepCard number={4} icon={Shield} iconColor="bg-violet-500" title="Assigning to Rota Areas">
        <p>Set the client's <strong>Rota Area</strong> so they appear in the correct shift lists. Only staff assigned to that area will see this client's visits.</p>
      </StepCard>
      <StepCard number={5} icon={Archive} iconColor="bg-slate-500" title="Archiving Clients">
        <p>If a client leaves your service, set them to <Pill color="slate">Inactive</Pill>. Their full history remains for compliance — they just disappear from active lists and new shift scheduling.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="Viewing a Client">
        <p>Find the client you're visiting and tap their name to see their care plan, emergency contacts, and any special instructions.</p>
        <p><strong>Always read the care notes</strong> before your first visit with a new client.</p>
      </StepCard>
      <StepCard number={2} icon={Heart} iconColor="bg-rose-500" title="Care Plan">
        <p>The care plan tab shows exactly what to do on each visit — routines, preferences, medications, and mobility needs. Follow these instructions carefully.</p>
      </StepCard>
      <StepCard number={3} icon={AlertTriangle} iconColor="bg-amber-500" title="Reporting Changes">
        <p>If you notice changes in a client's condition, record it in the care log notes and report it to your manager immediately. Use the <strong>Incidents</strong> page for any concerns.</p>
      </StepCard>
    </>
  ),
};

// ─── ROTA ────────────────────────────────────────────────────────────────────
const Rota = {
  title: 'Rota Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={MapPin} iconColor="bg-orange-500" title="Create Rota Areas">
        <p>Go to <strong>Rota Management → Areas</strong> and create named areas (e.g. <Pill color="orange">North Team</Pill>, <Pill color="orange">South Team</Pill>). Each area groups clients and staff together.</p>
      </StepCard>
      <StepCard number={2} icon={Tag} iconColor="bg-violet-500" title="Create Shift Types">
        <p>Add shift types (e.g. <Pill color="violet">Morning</Pill>, <Pill color="violet">Afternoon</Pill>, <Pill color="violet">Night</Pill>) in <strong>Rota Management → Shift Types</strong>. These define time blocks used in templates.</p>
      </StepCard>
      <StepCard number={3} icon={LayoutTemplate} iconColor="bg-indigo-500" title="Build Shift Templates">
        <p>Create a base template for each area — this is a repeating weekly pattern of shifts. Assign client call times to each shift in the template.</p>
      </StepCard>
      <StepCard number={4} icon={Rocket} iconColor="bg-teal-500" title="Deploy the Rota">
        <p>Use <Pill color="teal">Deploy Rota</Pill> to generate actual shifts from your templates for a chosen date range. This creates all the shift records at once.</p>
      </StepCard>
      <StepCard number={5} icon={UserCheck} iconColor="bg-green-500" title="Allocate Staff">
        <p>Once shifts are deployed, tap any blank shift to assign a staff member. You can also drag and swap shifts between staff from the rota grid view.</p>
      </StepCard>
      <StepCard number={6} icon={Settings} iconColor="bg-slate-500" title="Ongoing Management"
        tip="Use the 'Available Cover' status to flag shifts staff can claim themselves — reducing admin work.">
        <p>Mark shifts as <Pill color="slate">Available Cover</Pill> if they need filling. Approve shift swap and claim requests from the Dashboard admin tray.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="View Your Schedule">
        <p>The rota shows your assigned shifts in a weekly grid. Tap any shift to see its full detail — area, client visits, start/end time.</p>
      </StepCard>
      <StepCard number={2} icon={CalendarCheck} iconColor="bg-teal-500" title="Claiming Available Shifts">
        <p>Shifts marked <Pill color="teal">Available Cover</Pill> can be claimed by you. Tap the shift and select <Pill>Claim Shift</Pill>. Your manager will approve or decline.</p>
      </StepCard>
      <StepCard number={3} icon={Clock} iconColor="bg-amber-500" title="Clocking In">
        <p>When your shift starts, tap your shift and press <Pill color="amber">Clock In</Pill>. This records your start time and makes your visit list active.</p>
      </StepCard>
      <StepCard number={4} icon={ClipboardList} iconColor="bg-indigo-500" title="Completing Client Visits">
        <p>Tap each client visit within your shift to mark it as complete and write a care log. Always add a note even for uneventful visits.</p>
      </StepCard>
      <StepCard number={5} icon={LogOut} iconColor="bg-green-500" title="Clocking Out">
        <p>At the end of your shift press <Pill color="green">Clock Off</Pill>. You'll be prompted to confirm all visits are complete before you can clock out.</p>
      </StepCard>
      <StepCard number={6} icon={Repeat2} iconColor="bg-slate-500" title="Requesting a Shift Swap">
        <p>Tap a shift you want to swap, choose <Pill>Request Swap</Pill>, and select a colleague. They'll be notified to accept, then your manager approves.</p>
      </StepCard>
    </>
  ),
};

// ─── ROTA MANAGEMENT ─────────────────────────────────────────────────────────
const RotaManagement = {
  title: 'Rota Management Guide',
  staffOnly: false,
  adminContent: (
    <>
      <StepCard number={1} icon={MapPin} iconColor="bg-orange-500" title="Rota Areas">
        <p>Areas group your staff and clients into geographic or operational teams. Create one area per team. Staff are assigned to areas in their profile.</p>
      </StepCard>
      <StepCard number={2} icon={Tag} iconColor="bg-violet-500" title="Shift Types">
        <p>Shift types are the named time blocks used when building templates (e.g. <Pill color="violet">AM</Pill> 07:00–14:00, <Pill color="violet">PM</Pill> 14:00–22:00). Create one for each recurring time pattern.</p>
      </StepCard>
      <StepCard number={3} icon={LayoutTemplate} iconColor="bg-indigo-500" title="Base Templates">
        <p>A base template is a repeating weekly shift pattern for an area. Add client call slots to each shift in the template — these carry over when you deploy.</p>
      </StepCard>
      <StepCard number={4} icon={Rocket} iconColor="bg-teal-500" title="Deploying Shifts">
        <p>Select a template, choose a date range (usually 2–4 weeks ahead), and tap <Pill color="teal">Deploy</Pill>. The system creates all shift records — ready to be staffed.</p>
        <p>Deployed shifts appear blank until you assign staff to them.</p>
      </StepCard>
      <StepCard number={5} icon={Settings} iconColor="bg-slate-500" title="Editing Deployed Shifts">
        <p>After deployment, you can edit individual shifts — change times, add notes, or reassign staff — without affecting the base template.</p>
      </StepCard>
    </>
  ),
  staffContent: null,
};

// ─── CARE LOGS ───────────────────────────────────────────────────────────────
const CareLogs = {
  title: 'Care Logs Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="Reviewing Care Logs">
        <p>All submitted care logs appear here, sorted by date. Filter by client, staff member, or date range to find specific records.</p>
      </StepCard>
      <StepCard number={2} icon={CheckCircle2} iconColor="bg-green-500" title="Approving Logs">
        <p>Logs marked <Pill color="amber">Pending Review</Pill> need your attention. Open the log, review the content, and mark it <Pill color="green">Approved</Pill> or flag it for follow-up.</p>
      </StepCard>
      <StepCard number={3} icon={AlertTriangle} iconColor="bg-amber-500" title="Escalation Flags">
        <p>If a log contains a concern (e.g. client not eating, fall, medication issue), it may be auto-flagged. Always action these same day.</p>
      </StepCard>
      <StepCard number={4} icon={Download} iconColor="bg-slate-500" title="Exporting Records">
        <p>Use the export button to download care logs as a PDF or CSV — useful for CQC inspections, GP handovers, or family reviews.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={ClipboardList} iconColor="bg-teal-500" title="Writing a Care Log">
        <p>After completing a client visit, tap the visit in your shift and select <Pill color="teal">Write Care Log</Pill>. Fill in all sections — this is a legal record.</p>
      </StepCard>
      <StepCard number={2} icon={Heart} iconColor="bg-rose-500" title="What to Record">
        <p>Always record: mood, food/fluid intake, personal care given, any health observations, medication administered, and general notes.</p>
        <p><strong>If something unusual happened</strong>, describe it clearly in the notes section.</p>
      </StepCard>
      <StepCard number={3} icon={AlertTriangle} iconColor="bg-amber-500" title="Concerns & Safeguarding">
        <p>If you notice anything concerning — unexplained bruising, confusion, refusal of care — record it in the log notes AND report it to your manager immediately. Then raise an incident.</p>
      </StepCard>
      <StepCard number={4} icon={Clock} iconColor="bg-indigo-500" title="Submit Before You Leave">
        <p>Submit the care log before leaving the client's property. Late submissions can create compliance gaps.</p>
        <tip>Even a brief "no concerns" note is better than nothing.</tip>
      </StepCard>
    </>
  ),
};

// ─── TRAINING ────────────────────────────────────────────────────────────────
const Training = {
  title: 'Training Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={BookOpen} iconColor="bg-indigo-500" title="Managing Training Courses">
        <p>Add training courses in the <strong>Courses</strong> tab. Set the course name, category, duration, and whether it expires (and how often).</p>
      </StepCard>
      <StepCard number={2} icon={UserCheck} iconColor="bg-teal-500" title="Assigning to Staff">
        <p>Mark a course as <Pill color="teal">Required</Pill> for your organisation. All staff will then appear on the Training Matrix until they complete it.</p>
      </StepCard>
      <StepCard number={3} icon={GraduationCap} iconColor="bg-green-500" title="Recording Completions">
        <p>Open a staff member's training record and add a completion entry — include the date, certificate reference, and expiry date if applicable.</p>
      </StepCard>
      <StepCard number={4} icon={AlertTriangle} iconColor="bg-amber-500" title="Expiry Alerts"
        tip="The Training Matrix gives you a colour-coded view of who is compliant at a glance.">
        <p>Courses with expiry dates show amber warnings 30 days before expiry and red when expired. Arrange refresher training before the expiry date.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={GraduationCap} iconColor="bg-indigo-500" title="Your Training Record">
        <p>The Training page shows all courses required for your role, which you've completed, and which are coming up for renewal.</p>
      </StepCard>
      <StepCard number={2} icon={CheckCircle2} iconColor="bg-green-500" title="Marking Complete">
        <p>After completing a course, your manager will add the record. You can also upload your own certificate from the training record screen.</p>
      </StepCard>
      <StepCard number={3} icon={Bell} iconColor="bg-amber-500" title="Renewals">
        <p>You'll receive a notification when a qualification is approaching expiry. Contact your manager to arrange renewal before the date passes.</p>
      </StepCard>
    </>
  ),
};

// ─── INCIDENTS ───────────────────────────────────────────────────────────────
const Incidents = {
  title: 'Incidents Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="Managing Incidents">
        <p>All open incidents appear here. Review each one, assign an investigator if needed, and track through to resolution.</p>
      </StepCard>
      <StepCard number={2} icon={CheckCircle2} iconColor="bg-green-500" title="Closing Incidents">
        <p>Once investigated and resolved, add a <strong>resolution note</strong> and change status to <Pill color="green">Closed</Pill>. All incident records are kept permanently for compliance.</p>
      </StepCard>
      <StepCard number={3} icon={AlertTriangle} iconColor="bg-rose-500" title="Notifiable Incidents"
        warning="Certain incidents (serious injury, death, safeguarding) must be reported to the CQC and local authority within 24 hours.">
        <p>Flag incidents as <Pill color="rose">Notifiable</Pill> if they require external reporting. The system will remind you of reporting deadlines.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Siren} iconColor="bg-rose-500" title="Reporting an Incident">
        <p>Tap <Pill color="rose">+ New Incident</Pill> and select the incident type. Fill in what happened, when, who was involved, and any immediate actions you took.</p>
        <p><strong>Report immediately</strong> — do not wait until the end of your shift for serious incidents.</p>
      </StepCard>
      <StepCard number={2} icon={AlertTriangle} iconColor="bg-amber-500" title="What Counts as an Incident">
        <p>Report: falls, medication errors, client injuries, aggression, safeguarding concerns, near-misses, property damage, or anything unusual.</p>
        <p>If in doubt — report it. It's always better to over-report.</p>
      </StepCard>
      <StepCard number={3} icon={Eye} iconColor="bg-blue-500" title="Following Up">
        <p>Your manager will review your incident report and may contact you for more information. Check the incident status — <Pill color="amber">Under Review</Pill> means action is being taken.</p>
      </StepCard>
    </>
  ),
};

// ─── MESSAGES / CHAT ─────────────────────────────────────────────────────────
const Messages = {
  title: 'Messages Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Bell} iconColor="bg-blue-500" title="Announcements">
        <p>Send an announcement to <strong>all staff</strong> or a selected group. Announcements appear in every recipient's dashboard and send a push notification.</p>
        <p>Use for shift changes, policy updates, or urgent notices.</p>
      </StepCard>
      <StepCard number={2} icon={MessageSquare} iconColor="bg-teal-500" title="Direct Messages">
        <p>Send a private message to any staff member. They'll receive a push notification and it appears in their Chat inbox.</p>
      </StepCard>
      <StepCard number={3} icon={Users} iconColor="bg-violet-500" title="Group Messages">
        <p>Create a group conversation by selecting multiple recipients. Useful for team briefings or area-specific communications.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={MessageSquare} iconColor="bg-teal-500" title="Sending a Message">
        <p>Tap <Pill color="teal">New Message</Pill> and choose a recipient from the staff list. Type your message and send — they'll get a push notification.</p>
      </StepCard>
      <StepCard number={2} icon={Bell} iconColor="bg-blue-500" title="Announcements">
        <p>Announcements from management appear at the top of your messages. Tap to read and acknowledge — your manager can see who has read each announcement.</p>
      </StepCard>
      <StepCard number={3} icon={Shield} iconColor="bg-amber-500" title="Professional Use">
        <p>All messages are stored and visible to administrators. Keep all communications professional and work-related.</p>
      </StepCard>
    </>
  ),
};

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
const Documents = {
  title: 'Documents Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Upload} iconColor="bg-teal-500" title="Uploading Documents">
        <p>Tap <Pill color="teal">+ Upload</Pill> and select a file. Add a title, category (Policy, Procedure, Form, etc.) and set who can view it — all staff, specific roles, or just admins.</p>
      </StepCard>
      <StepCard number={2} icon={Lock} iconColor="bg-violet-500" title="Access Control">
        <p>Set documents as <Pill color="violet">Admin Only</Pill> for internal policies, or <Pill color="teal">All Staff</Pill> for handbooks and procedure guides.</p>
      </StepCard>
      <StepCard number={3} icon={FileText} iconColor="bg-indigo-500" title="Categories & Search">
        <p>Use categories and tags so staff can find documents quickly. A well-organised document library reduces calls to the office.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="Finding a Document">
        <p>Use the search bar or filter by category to find the document you need. Tap to view it directly in the app.</p>
      </StepCard>
      <StepCard number={2} icon={Download} iconColor="bg-teal-500" title="Downloading">
        <p>Tap the download icon to save a document to your device for offline access. Useful for care plans or procedure guides you need in the field.</p>
      </StepCard>
    </>
  ),
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
const Settings = {
  title: 'Settings Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Building2} iconColor="bg-teal-500" title="Organisation Profile">
        <p>Update your organisation name, logo, and contact details. These appear on certificates, documents, and the staff app header.</p>
      </StepCard>
      <StepCard number={2} icon={Key} iconColor="bg-orange-500" title="Invite Code">
        <p>Your unique invite code lets new staff join your organisation during registration. Share it securely — anyone with it can join.</p>
        <tip>Regenerate the code if it's been shared too widely.</tip>
      </StepCard>
      <StepCard number={3} icon={Bell} iconColor="bg-blue-500" title="Push Notifications">
        <p>Add your Firebase service account JSON here to enable push notifications for all staff. Without this, notifications won't work on any device.</p>
      </StepCard>
      <StepCard number={4} icon={Smartphone} iconColor="bg-violet-500" title="Radio / Two-Way Comms">
        <p>Enable or disable the two-way radio feature from Settings → Radio. When enabled, staff see the radio button and can make push-to-talk calls.</p>
      </StepCard>
      <StepCard number={5} icon={CreditCard} iconColor="bg-green-500" title="Subscription">
        <p>View your current plan, billing status, and upgrade options under the Subscription tab.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={UserCheck} iconColor="bg-teal-500" title="Your Profile">
        <p>Update your name, contact number, address, and emergency contacts from Settings → Profile.</p>
      </StepCard>
      <StepCard number={2} icon={Bell} iconColor="bg-blue-500" title="Notification Preferences">
        <p>Control which push notifications you receive — shift reminders, messages, and alerts can each be toggled on or off.</p>
      </StepCard>
      <StepCard number={3} icon={Key} iconColor="bg-violet-500" title="PIN Lock">
        <p>Set a PIN to lock the app when not in use — useful if you share a device. Go to Settings → Security → Set PIN.</p>
      </StepCard>
    </>
  ),
};

// ─── LEAVE MANAGEMENT ────────────────────────────────────────────────────────
const LeaveManagement = {
  title: 'Leave Management Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={CalendarCheck} iconColor="bg-teal-500" title="Approving Leave Requests">
        <p>Pending leave requests appear in your Dashboard admin tray and on this page. Open each request to see the dates, reason, and current cover situation.</p>
        <p>Approve or decline with an optional note — the staff member is notified immediately.</p>
      </StepCard>
      <StepCard number={2} icon={CalendarOff} iconColor="bg-orange-500" title="Checking Cover">
        <p>Before approving, check the rota for that period. If the staff member is scheduled, you'll need to arrange cover or mark their shifts as available.</p>
      </StepCard>
      <StepCard number={3} icon={TrendingUp} iconColor="bg-violet-500" title="Leave Balances">
        <p>View each staff member's annual leave entitlement and remaining days from their profile. Track usage across the leave year.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Plane} iconColor="bg-blue-500" title="Requesting Leave">
        <p>Tap <Pill color="blue">+ New Request</Pill>, select your leave type (Annual, Sick, Compassionate), choose dates, and add a reason. Your manager will approve or decline.</p>
      </StepCard>
      <StepCard number={2} icon={Bell} iconColor="bg-teal-500" title="Status Updates">
        <p>You'll receive a push notification when your request is approved or declined. Check the status on this page.</p>
      </StepCard>
      <StepCard number={3} icon={Calendar} iconColor="bg-orange-500" title="Planning Ahead">
        <p>Submit leave requests as early as possible — your manager needs time to arrange cover. Holiday requests during busy periods may be declined if cover isn't available.</p>
      </StepCard>
    </>
  ),
};

// ─── PAYROLL ─────────────────────────────────────────────────────────────────
const Payroll = {
  title: 'Payroll / Payslips Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={PoundSterling} iconColor="bg-green-500" title="Setting Pay Rates">
        <p>Assign hourly or salaried pay rates to each staff member from their profile → Payroll tab. Set different rates for standard, overtime, and bank holiday shifts.</p>
      </StepCard>
      <StepCard number={2} icon={Receipt} iconColor="bg-teal-500" title="Generating Payslips">
        <p>At the end of each pay period, go to <strong>Reports → Payroll</strong> to review hours and generate payslips. Export to CSV for your payroll provider.</p>
      </StepCard>
      <StepCard number={3} icon={CheckCircle2} iconColor="bg-indigo-500" title="Publishing Payslips">
        <p>Once payroll is processed, publish payslips so staff can view them in the app. They'll receive a notification when their payslip is available.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={PoundSterling} iconColor="bg-green-500" title="Viewing Your Payslip">
        <p>Your latest payslip appears here when published by your manager. Tap to view the full breakdown — hours, rate, deductions, and net pay.</p>
      </StepCard>
      <StepCard number={2} icon={Download} iconColor="bg-teal-500" title="Downloading">
        <p>Tap the download icon to save a copy as a PDF — useful for proof of income or mortgage applications.</p>
      </StepCard>
      <StepCard number={3} icon={AlertTriangle} iconColor="bg-amber-500" title="Queries">
        <p>If anything looks wrong on your payslip, message your manager through the app with the specific dates and amounts in question.</p>
      </StepCard>
    </>
  ),
};

// ─── EXPENSES ────────────────────────────────────────────────────────────────
const Expenses = {
  title: 'Expenses Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Receipt} iconColor="bg-teal-500" title="Reviewing Claims">
        <p>Staff expense claims appear here for approval. Review the category, amount, and attached receipt before approving.</p>
      </StepCard>
      <StepCard number={2} icon={CheckCircle2} iconColor="bg-green-500" title="Approving & Paying">
        <p>Mark approved claims as <Pill color="green">Paid</Pill> once they've been reimbursed. This updates the staff member's record and removes it from the pending list.</p>
      </StepCard>
      <StepCard number={3} icon={Download} iconColor="bg-slate-500" title="Exporting">
        <p>Export approved expenses to CSV for your accounts team or to reconcile against mileage logs.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Wallet} iconColor="bg-teal-500" title="Submitting an Expense">
        <p>Tap <Pill color="teal">+ Add Expense</Pill>, select the category (Mileage, Parking, Supplies, etc.), enter the amount, and upload a photo of your receipt.</p>
      </StepCard>
      <StepCard number={2} icon={Clock} iconColor="bg-amber-500" title="Submission Deadlines">
        <p>Submit expenses promptly — most organisations have a cut-off for each pay period. Late submissions may be held until the next period.</p>
      </StepCard>
      <StepCard number={3} icon={Bell} iconColor="bg-blue-500" title="Approval Status">
        <p>You'll be notified when your expense is approved and when it's marked as paid. Check the status on this page.</p>
      </StepCard>
    </>
  ),
};

// ─── INVOICING ───────────────────────────────────────────────────────────────
const Invoicing = {
  title: 'Invoicing Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Receipt} iconColor="bg-green-500" title="Creating an Invoice">
        <p>Tap <Pill color="green">+ New Invoice</Pill>, select the client or funding body, choose the billing period, and the system will populate hours from completed care logs automatically.</p>
      </StepCard>
      <StepCard number={2} icon={Eye} iconColor="bg-blue-500" title="Reviewing Before Sending">
        <p>Always review the invoice before sending — check hours match the rota, rates are correct, and any additional charges are included.</p>
      </StepCard>
      <StepCard number={3} icon={CheckCircle2} iconColor="bg-teal-500" title="Marking as Paid">
        <p>When payment is received, open the invoice and mark it <Pill color="green">Paid</Pill> with the payment date. This keeps your accounts reconciled.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="Your Invoices">
        <p>If you're a self-employed carer, your invoices to the organisation appear here. View and download PDF copies for your records.</p>
      </StepCard>
    </>
  ),
};

// ─── COMPLIANCE ──────────────────────────────────────────────────────────────
const Compliance = {
  title: 'Compliance Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Shield} iconColor="bg-violet-500" title="Compliance Overview">
        <p>The compliance dashboard shows your organisation's status across key regulatory areas — DBS checks, mandatory training, insurance, and policy reviews.</p>
      </StepCard>
      <StepCard number={2} icon={AlertTriangle} iconColor="bg-amber-500" title="Expiry Tracking">
        <p>Items turning amber are expiring within 30 days. Items in red have already expired. Action these urgently to maintain your compliance rating.</p>
      </StepCard>
      <StepCard number={3} icon={Upload} iconColor="bg-teal-500" title="Uploading Evidence">
        <p>Upload certificates, policies, and audits directly to each compliance item. These are stored securely and accessible during inspections.</p>
      </StepCard>
      <StepCard number={4} icon={Download} iconColor="bg-slate-500" title="CQC Preparation">
        <p>Use the export feature to generate a compliance summary report — useful for CQC inspections, audits, and commissioner reviews.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="Your Compliance Status">
        <p>The compliance page shows your personal compliance items — DBS expiry, mandatory training, and any documents you need to sign.</p>
      </StepCard>
      <StepCard number={2} icon={AlertTriangle} iconColor="bg-amber-500" title="Action Required">
        <p>Red or amber items need your attention. Contact your manager if you need help renewing a qualification or updating a document.</p>
      </StepCard>
    </>
  ),
};

// ─── REPORTS ─────────────────────────────────────────────────────────────────
const Reports = {
  title: 'Reports Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={BarChart3} iconColor="bg-blue-500" title="Available Reports">
        <p>Reports cover: staff hours, visit completion rates, care log submissions, incident summaries, training compliance, and payroll exports.</p>
      </StepCard>
      <StepCard number={2} icon={Calendar} iconColor="bg-teal-500" title="Date Filters">
        <p>Set a date range for any report. For weekly payroll use a 7-day range; for CQC reviews use quarterly or annual ranges.</p>
      </StepCard>
      <StepCard number={3} icon={Download} iconColor="bg-indigo-500" title="Exporting">
        <p>Download reports as CSV (for spreadsheet analysis) or PDF (for sharing with managers, commissioners, or inspectors).</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={BarChart3} iconColor="bg-blue-500" title="Your Personal Reports">
        <p>View your own hours worked, visits completed, and training completion from the Reports page. Useful for checking your hours before payroll.</p>
      </StepCard>
    </>
  ),
};

// ─── AI ASSISTANT ────────────────────────────────────────────────────────────
const AIAssistant = {
  title: 'AI Assistant Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Bot} iconColor="bg-purple-500" title="What the AI Can Do">
        <p>The AI Assistant can help with: writing care plans, drafting policies, summarising incident reports, answering care questions, and more.</p>
      </StepCard>
      <StepCard number={2} icon={MessageSquare} iconColor="bg-teal-500" title="How to Ask">
        <p>Type your question or request clearly. For best results, give context — e.g. "Write a manual handling policy for a domiciliary care provider".</p>
      </StepCard>
      <StepCard number={3} icon={Shield} iconColor="bg-amber-500" title="Data Safety"
        warning="Never paste personal client or staff data into the AI assistant. Use it for templates and general guidance only.">
        <p>The AI uses anonymised prompts. Do not include names, addresses, or NHS numbers in your queries.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Bot} iconColor="bg-purple-500" title="Using the AI Assistant">
        <p>Ask the AI anything related to your work — care best practices, how to handle a situation, what to write in a care log, or how to use the app.</p>
      </StepCard>
      <StepCard number={2} icon={Shield} iconColor="bg-amber-500" title="Confidentiality"
        warning="Do not include client names or identifying information in your AI queries.">
        <p>Keep queries general — "How do I support someone with dementia refusing medication?" not "Mr Smith at 12 Oak Lane won't take his tablets".</p>
      </StepCard>
    </>
  ),
};

// ─── CLOCK IN/OUT ────────────────────────────────────────────────────────────
const ClockInOut = {
  title: 'Clock In / Out Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Eye} iconColor="bg-blue-500" title="Monitoring Staff">
        <p>The Clock In/Out page shows who is currently clocked in, how long they've been on shift, and any staff who are late or haven't clocked out.</p>
      </StepCard>
      <StepCard number={2} icon={Settings} iconColor="bg-slate-500" title="Manual Adjustments">
        <p>If a staff member forgot to clock in or out, you can manually record their times here. Always add a note explaining the manual entry.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Clock} iconColor="bg-amber-500" title="Clocking In">
        <p>At the start of your shift, tap your shift card and press <Pill color="amber">Clock In</Pill>. Your location may be recorded to confirm you're at the correct address.</p>
      </StepCard>
      <StepCard number={2} icon={LogOut} iconColor="bg-green-500" title="Clocking Out">
        <p>At the end of your shift, press <Pill color="green">Clock Out</Pill>. You'll be asked to confirm all visits are complete. You cannot clock out with outstanding mandatory tasks.</p>
      </StepCard>
      <StepCard number={3} icon={AlertTriangle} iconColor="bg-amber-500" title="Forgot to Clock In?">
        <p>Contact your manager immediately — they can add a manual entry. Do this the same day so your pay isn't affected.</p>
      </StepCard>
    </>
  ),
};

// ─── WORK CALENDAR ───────────────────────────────────────────────────────────
const WorkCalendar = {
  title: 'Work Calendar Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Calendar} iconColor="bg-blue-500" title="Organisation Calendar">
        <p>The Work Calendar shows all shifts, leave, and events across your organisation in a monthly/weekly view. Use it to spot coverage gaps and plan ahead.</p>
      </StepCard>
      <StepCard number={2} icon={CalendarOff} iconColor="bg-orange-500" title="Leave Overview">
        <p>Approved leave appears as coloured blocks. Hover or tap to see who's off. Use this view when reviewing new leave requests.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Calendar} iconColor="bg-blue-500" title="Your Calendar">
        <p>The calendar shows your upcoming shifts, approved leave, and any team events. Use it to plan your month and check future shifts.</p>
      </StepCard>
      <StepCard number={2} icon={Repeat2} iconColor="bg-teal-500" title="Adding to Device Calendar">
        <p>Tap a shift and select <Pill>Add to Calendar</Pill> to sync it with your phone's calendar app for reminders.</p>
      </StepCard>
    </>
  ),
};

// ─── APPROVALS & FINANCIALS ──────────────────────────────────────────────────
const ApprovalsAndFinancials = {
  title: 'Approvals & My Admin Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={CheckCircle2} iconColor="bg-teal-500" title="Pending Approvals">
        <p>All items needing your sign-off appear here — leave requests, expense claims, shift swaps, and claim requests. Work through the list to clear the queue.</p>
      </StepCard>
      <StepCard number={2} icon={PoundSterling} iconColor="bg-green-500" title="Financial Overview">
        <p>The financials tab shows outstanding invoices, approved expenses, and payroll summaries for the current period.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={FileText} iconColor="bg-blue-500" title="My Requests">
        <p>All your submitted requests appear here — leave, expenses, shift swaps, and claims. Check the status of each one and see manager notes.</p>
      </StepCard>
      <StepCard number={2} icon={Bell} iconColor="bg-teal-500" title="Notifications">
        <p>You'll receive a push notification when any request is actioned. Always check the app for updates rather than chasing your manager directly.</p>
      </StepCard>
    </>
  ),
};

// ─── CONTROL ROOM ────────────────────────────────────────────────────────────
const ControlRoom = {
  title: 'Control Room Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Activity} iconColor="bg-teal-500" title="Live Overview">
        <p>The Control Room is your real-time operations dashboard. See all active shifts, staff positions, alerts, and incidents on a single screen.</p>
      </StepCard>
      <StepCard number={2} icon={Bell} iconColor="bg-rose-500" title="Alerts Panel">
        <p>Urgent alerts (missed visits, late clock-ins, incidents) flash at the top. Tap any alert to go directly to the relevant record and action it.</p>
      </StepCard>
      <StepCard number={3} icon={Radio} iconColor="bg-green-500" title="Radio Monitoring">
        <p>If radio is enabled, active radio sessions appear here. You can join or monitor any active call from the Control Room.</p>
      </StepCard>
    </>
  ),
  staffContent: null,
};

// ─── CLINICAL DASHBOARD ──────────────────────────────────────────────────────
const ClinicalDashboard = {
  title: 'Clinical Dashboard Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Stethoscope} iconColor="bg-teal-500" title="Clinical Overview">
        <p>The Clinical Dashboard aggregates health-related data across all clients — medication reviews, health observations from care logs, and clinical alerts.</p>
      </StepCard>
      <StepCard number={2} icon={AlertTriangle} iconColor="bg-rose-500" title="Health Flags">
        <p>Clients with recurring concerns (weight loss, mood changes, repeated falls) are flagged automatically. Review these weekly with your clinical lead.</p>
      </StepCard>
      <StepCard number={3} icon={FileText} iconColor="bg-indigo-500" title="Handover Reports">
        <p>Generate clinical handover summaries for GP visits, hospital admissions, or MDT meetings directly from this page.</p>
      </StepCard>
    </>
  ),
  staffContent: null,
};

// ─── PROFILE ─────────────────────────────────────────────────────────────────
const Profile = {
  title: 'Profile Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={UserCheck} iconColor="bg-teal-500" title="Your Details">
        <p>Keep your personal details up to date — name, mobile number, and emergency contact. These are visible to administrators and used for communications.</p>
      </StepCard>
      <StepCard number={2} icon={Key} iconColor="bg-violet-500" title="Security">
        <p>Change your password and set up a PIN lock from the Security section. Enable 2FA if your organisation requires it.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={UserCheck} iconColor="bg-teal-500" title="Your Details">
        <p>Update your contact number, address, and emergency contacts. Your manager needs this information to be current.</p>
      </StepCard>
      <StepCard number={2} icon={Key} iconColor="bg-violet-500" title="PIN Lock">
        <p>Set a 4-digit PIN to protect the app on your device. If you forget it, your manager can reset it from the staff management page.</p>
      </StepCard>
      <StepCard number={3} icon={Bell} iconColor="bg-blue-500" title="Notification Settings">
        <p>Control which alerts you receive — you can mute non-urgent notifications outside working hours.</p>
      </StepCard>
    </>
  ),
};

// ─── TWO-WAY RADIO ───────────────────────────────────────────────────────────
const TwoWayRadio = {
  title: 'Two-Way Radio Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Radio} iconColor="bg-green-600" title="Enabling Radio">
        <p>Enable the radio feature in <strong>Settings → Radio</strong>. All staff will then see the radio button. You can restrict access by role.</p>
      </StepCard>
      <StepCard number={2} icon={Users} iconColor="bg-teal-500" title="Monitoring Calls">
        <p>From the Control Room you can see active radio sessions. Join any call to listen in or assist.</p>
      </StepCard>
      <StepCard number={3} icon={Bell} iconColor="bg-blue-500" title="Missed Calls">
        <p>Missed radio calls show as a badge on the radio button. Staff see the caller's name and can call back with one tap.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Radio} iconColor="bg-green-600" title="Making a Call">
        <p>Tap the floating radio button (bottom-right of screen) to open the radio. Select a colleague and hold the <Pill color="green">PTT</Pill> button to speak.</p>
      </StepCard>
      <StepCard number={2} icon={Users} iconColor="bg-teal-500" title="Receiving Calls">
        <p>Incoming radio calls show a notification even when the app is in the background. Tap the notification to join the call immediately.</p>
      </StepCard>
      <StepCard number={3} icon={Bell} iconColor="bg-amber-500" title="Missed Calls">
        <p>If you miss a call, a red badge appears on the radio button. Tap it to see who called and call them back.</p>
        <p>Keep your volume up and notifications enabled to not miss calls in the field.</p>
      </StepCard>
    </>
  ),
};

// ─── ALERTER / PAGER ─────────────────────────────────────────────────────────
const Alerter = {
  title: 'Alerter / Pager Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Bell} iconColor="bg-rose-500" title="Sending an Alert">
        <p>Open the Alerter from the navigation. Select one or more recipients, type your urgent message, and tap <Pill color="rose">Send Alert</Pill>. The recipient's app will sound an alert tone and vibrate.</p>
      </StepCard>
      <StepCard number={2} icon={Eye} iconColor="bg-blue-500" title="Delivery Confirmation">
        <p>The alert panel shows when each recipient has seen your message. Follow up with a phone call if an alert remains unread after 5 minutes in an emergency.</p>
      </StepCard>
      <StepCard number={3} icon={Shield} iconColor="bg-amber-500" title="Use for Urgency Only">
        <p>The alerter is designed for urgent messages that need immediate attention. For non-urgent communication use Messages or Chat.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Bell} iconColor="bg-rose-500" title="Receiving an Alert">
        <p>Alerts arrive with a loud tone and vibration even when your screen is off. The pager panel slides in automatically — read and acknowledge the message immediately.</p>
      </StepCard>
      <StepCard number={2} icon={CheckCircle2} iconColor="bg-green-500" title="Acknowledging">
        <p>Tap <Pill color="green">Acknowledge</Pill> to confirm you've received and read the alert. Your manager can see this confirmation.</p>
      </StepCard>
      <StepCard number={3} icon={Phone} iconColor="bg-blue-500" title="If You're Driving">
        <p>Pull over safely before reading alerts. Do not read or acknowledge alerts whilst driving.</p>
      </StepCard>
    </>
  ),
};

// ─── TRAINING MATRIX ─────────────────────────────────────────────────────────
const TrainingMatrix = {
  title: 'Training Matrix Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={BarChart3} iconColor="bg-indigo-500" title="Reading the Matrix">
        <p>The matrix shows every staff member (rows) against every required course (columns). <Pill color="green">Green</Pill> = complete, <Pill color="amber">Amber</Pill> = expiring soon, <Pill color="rose">Red</Pill> = expired or missing.</p>
      </StepCard>
      <StepCard number={2} icon={UserPlus} iconColor="bg-teal-500" title="Adding Records">
        <p>Tap any cell to add or update a training record for that staff member and course. Upload the certificate if available.</p>
      </StepCard>
      <StepCard number={3} icon={Download} iconColor="bg-slate-500" title="Exporting">
        <p>Export the full matrix to PDF or CSV for CQC inspections, commissioner audits, or your own records.</p>
      </StepCard>
    </>
  ),
  staffContent: null,
};

// ─── ASSETS ──────────────────────────────────────────────────────────────────
const Assets = {
  title: 'Assets Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Wrench} iconColor="bg-slate-500" title="Managing Assets">
        <p>Record all organisation assets — vehicles, equipment, devices. Set service/calibration due dates and assign them to staff or locations.</p>
      </StepCard>
      <StepCard number={2} icon={AlertTriangle} iconColor="bg-amber-500" title="Maintenance Alerts">
        <p>Assets with upcoming service dates appear in amber. Action them before they turn red (overdue).</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Wrench} iconColor="bg-slate-500" title="Your Assigned Assets">
        <p>Any assets assigned to you (company phone, vehicle, equipment) appear here. Report faults or damage immediately using the asset detail screen.</p>
      </StepCard>
    </>
  ),
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
const NotificationCenter = {
  title: 'Notifications Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Bell} iconColor="bg-blue-500" title="Notification Centre">
        <p>All system notifications — shift updates, leave decisions, incident alerts, and messages — appear here in chronological order.</p>
      </StepCard>
      <StepCard number={2} icon={Settings} iconColor="bg-slate-500" title="Push Notifications Setup">
        <p>For push notifications to work on staff devices, you must add a Firebase service account in <strong>Settings → Push Notifications</strong>. Without this, notifications only show inside the app.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={Bell} iconColor="bg-blue-500" title="Your Notifications">
        <p>All notifications sent to you appear here — shift changes, messages, leave updates, and alerts. Tap any notification to jump to the relevant page.</p>
      </StepCard>
      <StepCard number={2} icon={Smartphone} iconColor="bg-teal-500" title="Enable Push Notifications">
        <p>For alerts to reach you when the app is closed, tap <Pill color="teal">Enable Notifications</Pill> when prompted. This is essential for receiving urgent alerts in the field.</p>
      </StepCard>
    </>
  ),
};

// ─── FORM BUILDER ────────────────────────────────────────────────────────────
const FormBuilder = {
  title: 'Form Builder Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={FileText} iconColor="bg-violet-500" title="Creating a Form">
        <p>Tap <Pill color="violet">+ New Form</Pill> and add a title and description. Then add fields — text, checkboxes, dropdowns, signatures, and date pickers are all available.</p>
      </StepCard>
      <StepCard number={2} icon={Users} iconColor="bg-teal-500" title="Assigning Forms">
        <p>Once published, assign the form to staff roles or specific team members. They'll see it in their Forms inbox and can complete it on any device.</p>
      </StepCard>
      <StepCard number={3} icon={Download} iconColor="bg-slate-500" title="Reviewing Submissions">
        <p>All completed forms appear in the Submissions tab. Export to PDF or CSV for your records.</p>
      </StepCard>
    </>
  ),
  staffContent: (
    <>
      <StepCard number={1} icon={FileText} iconColor="bg-violet-500" title="Completing a Form">
        <p>Forms assigned to you appear in your inbox. Tap to open, fill in all required fields, and submit. Some forms require a signature — draw it with your finger or stylus.</p>
      </StepCard>
    </>
  ),
};

// ─── DATA IMPORT ─────────────────────────────────────────────────────────────
const DataImport = {
  title: 'Data Import Guide',
  adminContent: (
    <>
      <StepCard number={1} icon={Upload} iconColor="bg-teal-500" title="Importing Data">
        <p>Use Data Import to bulk-upload staff, clients, or training records from a CSV file. Download the template first to ensure your data is in the right format.</p>
      </StepCard>
      <StepCard number={2} icon={Eye} iconColor="bg-blue-500" title="Review Before Importing">
        <p>After uploading, the system shows a preview of what will be created. Review carefully — any errors in your CSV will be highlighted here.</p>
      </StepCard>
      <StepCard number={3} icon={CheckCircle2} iconColor="bg-green-500" title="Confirming the Import"
        warning="Imports cannot be bulk-undone. If you import incorrect data, you'll need to manually correct each record.">
        <p>Once you're satisfied the preview is correct, tap <Pill color="green">Confirm Import</Pill> to create all records.</p>
      </StepCard>
    </>
  ),
  staffContent: null,
};

// ─── MASTER EXPORT ───────────────────────────────────────────────────────────
export const PAGE_TUTORIALS = {
  Dashboard,
  StaffManagement,
  ClientManagement,
  Rota,
  RotaManagement,
  CareLogs,
  Training,
  TrainingMatrix,
  Incidents,
  Messages,
  Chat: Messages,
  Documents,
  Settings,
  LeaveManagement,
  LeaveRequests: LeaveManagement,
  Payroll,
  Expenses,
  Invoicing,
  Compliance,
  Reports,
  AIAssistant,
  ClockInOut,
  WorkCalendar,
  ApprovalsAndFinancials,
  ControlRoom,
  ClinicalDashboard,
  Profile,
  TwoWayRadio,
  Alerter,
  Assets,
  NotificationCenter,
  FormBuilder,
  DataImport,
};

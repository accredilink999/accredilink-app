import Link from 'next/link';
import AnimateOnScroll from '@/components/AnimateOnScroll';

export const metadata = {
  title: 'CareCall AI | All-in-One Domiciliary Care Management Platform',
  description: 'CareCall AI is a comprehensive staff management and care operations platform built specifically for domiciliary care agencies. GPS tracking, rota management, care documentation, incident reporting, training, and CIW compliance — all in one app.',
};

const features = [
  {
    title: 'Real-Time GPS Control Room',
    description: 'Track your entire care team in real-time on an interactive map. See who\u2019s on shift, where they are, and which service users they\u2019re visiting. The control room gives coordinators complete operational visibility with live location updates every 15 seconds.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    title: 'Integrated Care Documentation',
    description: 'Carers clock in and out of visits with automatic GPS verification. Each visit captures mood assessments, food and fluid intake, personal care tasks, and detailed notes — creating a comprehensive care record that satisfies CIW requirements.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'from-green-500 to-emerald-500',
    bg: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    title: 'Incident & Safeguarding Hub',
    description: 'Structured incident reporting covering falls, medication errors, injuries, near misses, safeguarding concerns, and complaints. Each report captures severity, witnesses, medical attention, and whether the incident is CQC/CIW notifiable — with full audit trails.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    title: 'Intelligent Rota Management',
    description: 'Build and manage rotas with month, week, and day views. Create recurring shift patterns, assign staff to areas, and manage allocations. Staff see their schedules instantly on mobile with real-time updates when changes are made.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-purple-500 to-violet-500',
    bg: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    title: 'Training Academy & AI Course Builder',
    description: 'A built-in learning management system with course library, assignment tracking, completion analytics, and certificate management. The AI Course Builder lets managers create professional training courses in minutes — no instructional design expertise needed.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    title: 'Advanced Analytics & Reporting',
    description: 'Comprehensive dashboards with bar charts, pie charts, line graphs, and scatter plots covering shifts, incidents, staff performance, training completion, leave patterns, payroll, and expenses. Filter by 7, 30, or 90-day periods with export capabilities.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: 'from-teal-500 to-cyan-500',
    bg: 'bg-teal-50',
    textColor: 'text-teal-600',
  },
  {
    title: 'Priority Messaging & Announcements',
    description: 'Built-in communication hub with personal messaging, team chat, and priority-based announcements. Managers can broadcast critical, high, normal, or low priority messages with acknowledgement tracking to ensure important updates are read by every team member.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: 'from-indigo-500 to-blue-500',
    bg: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    title: 'Leave, Expenses & Payroll',
    description: 'Integrated leave request system with approval workflows, expense claim tracking, and payroll period management. Managers can approve or reject requests, track hours worked, manage pay rates, and maintain complete financial oversight of their team.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'from-emerald-500 to-green-500',
    bg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    title: 'Mobile App — Works Offline',
    description: 'Carers access everything from their phone with our Progressive Web App that also runs natively on iOS and Android. Biometric login, offline capability, push notifications, GPS tracking, and a clean mobile-first interface designed for use in the field.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-slate-500 to-slate-700',
    bg: 'bg-slate-100',
    textColor: 'text-slate-600',
  },
  {
    title: 'CIW Compliance Suite',
    description: 'Purpose-built for Welsh care providers. Incident reporting follows CIW notification requirements, training tracking meets regulatory standards, care documentation captures everything inspectors look for, and full audit trails provide evidence of compliance.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'from-welsh-red to-rose-600',
    bg: 'bg-red-50',
    textColor: 'text-welsh-red',
  },
];

const screenshots = [
  {
    title: 'Staff Dashboard',
    description: 'At-a-glance view of today\u2019s shifts, client calls, open incidents, and pending tasks. Staff see exactly what they need to do and when.',
    image: '/images/app/dashboard.png',
  },
  {
    title: 'GPS Control Room',
    description: 'Live map showing all active staff and service user locations. Coordinators can see shift status, send messages, and manage operations in real-time.',
    image: '/images/app/control-room.png',
  },
  {
    title: 'Rota Management',
    description: 'Month, week, and day views for building and managing staff schedules. Create recurring patterns, assign areas, and allocate shifts with drag-and-drop simplicity.',
    image: '/images/app/rota.png',
  },
  {
    title: 'Care Logs',
    description: 'Detailed care visit records capturing mood, nutrition, personal care, and carer notes. Searchable and filterable for easy access during audits.',
    image: '/images/app/care-logs.png',
  },
  {
    title: 'Analytics & Reports',
    description: 'Multi-metric dashboards with interactive charts covering every aspect of your care operations — from shift coverage to incident trends.',
    image: '/images/app/reports.png',
  },
  {
    title: 'Mobile Experience',
    description: 'Clean, intuitive mobile interface for carers in the field. Clock in with GPS, log care notes, report incidents, and check schedules — all from their phone.',
    image: '/images/app/mobile.png',
  },
];

const ciwFeatures = [
  {
    title: 'Incident Reporting & Notifications',
    description: 'Every incident is categorised, timestamped, and stored with full details including severity, witnesses, and whether it requires CIW notification. Managers receive instant alerts for serious incidents.',
  },
  {
    title: 'Care Documentation Trail',
    description: 'Every care visit is documented with clock-in/out times, GPS location verification, care tasks completed, and detailed notes. This creates the evidence trail that CIW inspectors expect to see.',
  },
  {
    title: 'Training Compliance Tracking',
    description: 'Track mandatory training requirements, completion dates, expiry dates, and renewal schedules for every staff member. The system flags when training is due or overdue.',
  },
  {
    title: 'Staff Qualification Records',
    description: 'Maintain digital records of DBS checks, qualifications, certifications, and right-to-work documentation. Everything is stored securely and accessible for inspection.',
  },
  {
    title: 'Safeguarding Protocols',
    description: 'Dedicated safeguarding incident category with escalation workflows. Log concerns, track family and GP notifications, and maintain a complete safeguarding audit trail.',
  },
  {
    title: 'Audit-Ready Reporting',
    description: 'Generate compliance reports covering incidents, training status, care delivery metrics, and staff performance. Be inspection-ready at all times, not just when CIW is coming.',
  },
];

const faqs = [
  {
    q: 'What is CareCall AI?',
    a: 'CareCall AI is an all-in-one staff management and care operations platform built specifically for domiciliary care agencies. It combines real-time GPS tracking, rota management, care documentation, incident reporting, training, messaging, payroll, and compliance tools into a single application.',
  },
  {
    q: 'Who is CareCall AI designed for?',
    a: 'CareCall AI is designed for domiciliary care agencies, home care providers, and supported living services — particularly those operating in Wales who need to meet Care Inspectorate Wales (CIW) requirements. It\u2019s used by care coordinators, managers, supervisors, and frontline carers.',
  },
  {
    q: 'Does it work on mobile phones?',
    a: 'Yes. CareCall AI is a Progressive Web App (PWA) that works on any device with a web browser. It also runs natively on iOS and Android devices. Carers can use it in the field with offline support — data syncs automatically when connectivity returns.',
  },
  {
    q: 'How does the GPS tracking work?',
    a: 'When carers clock in and out of visits, their GPS location is captured automatically. The control room displays all active staff on a live map with updates every 15 seconds, giving coordinators complete visibility of operations.',
  },
  {
    q: 'Is our data secure?',
    a: 'Absolutely. CareCall AI uses enterprise-grade security with encrypted data storage, role-based access controls, and secure authentication including biometric login. All data is hosted on secure cloud infrastructure.',
  },
  {
    q: 'Can we try it before committing?',
    a: 'Yes! We offer a free demo where we\u2019ll set you up with your own dedicated instance of CareCall AI so you can explore all features with sample data. Contact us to arrange your demo.',
  },
  {
    q: 'How is CareCall AI different from other care management systems?',
    a: 'CareCall AI is built by carers, for carers. Our development team includes experienced care professionals who understand the daily realities of domiciliary care. It\u2019s designed from the ground up for CIW compliance, not retrofitted. And it\u2019s a complete all-in-one platform — not a collection of separate tools bolted together.',
  },
];

export default function CareCallAIPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-96 h-96 bg-welsh-green rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="fade-up">
              <div>
                <Link href="/apps-that-care" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Apps That Care
                </Link>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  CareCall <span className="bg-gradient-to-r from-welsh-green to-emerald-400 bg-clip-text text-transparent">AI</span>
                </h1>
                <p className="text-xl text-slate-300 mb-4">
                  The All-in-One Domiciliary Care Management Platform
                </p>
                <p className="text-base text-slate-400 mb-8 leading-relaxed max-w-lg">
                  Everything your care agency needs in one powerful app. Real-time GPS tracking, intelligent rota management, integrated care documentation, CIW compliance tools, AI-powered training, and so much more.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/contact"
                    className="px-8 py-4 bg-welsh-green text-white font-semibold rounded-xl hover:bg-welsh-green-light transition-colors text-base text-center"
                  >
                    Request a Free Demo
                  </Link>
                  <a
                    href="#features"
                    className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base text-center"
                  >
                    Explore Features
                  </a>
                </div>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={200}>
              <div className="relative">
                <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 backdrop-blur rounded-3xl border border-white/10 p-8 shadow-2xl">
                  <div className="bg-slate-800 rounded-2xl p-6 mb-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-slate-500 ml-2">CareCall AI Dashboard</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Active Staff</span>
                        <span className="text-sm font-bold text-welsh-green">12 on shift</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Today&apos;s Calls</span>
                        <span className="text-sm font-bold text-blue-400">47 scheduled</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Incidents</span>
                        <span className="text-sm font-bold text-amber-400">2 open</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Training Due</span>
                        <span className="text-sm font-bold text-rose-400">3 overdue</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-green-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-welsh-green">98%</p>
                      <p className="text-xs text-slate-400">Shift Coverage</p>
                    </div>
                    <div className="bg-blue-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-blue-400">156</p>
                      <p className="text-xs text-slate-400">Calls This Week</p>
                    </div>
                    <div className="bg-amber-500/20 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-amber-400">24</p>
                      <p className="text-xs text-slate-400">Staff Members</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* What is CareCall AI */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">What is CareCall AI?</h2>
              <div className="text-lg text-slate-600 leading-relaxed space-y-6">
                <p>
                  CareCall AI is a <strong>comprehensive care management platform</strong> that brings together every tool a domiciliary care agency needs into one unified system. No more juggling separate apps for scheduling, care logs, incident reports, and messaging — CareCall AI does it all.
                </p>
                <p>
                  Developed in Denbighshire by <strong>Accredilink Community Response Taskforce</strong>, CareCall AI was born from real experience delivering domiciliary care across North Wales. Every feature exists because a real carer or coordinator needed it. From the GPS control room that gives coordinators live operational visibility, to the mobile app that lets carers document visits with a few taps — this platform was built by people who truly understand the job.
                </p>
                <p>
                  Unlike generic care management software, CareCall AI is designed specifically for <strong>Care Inspectorate Wales (CIW) compliance</strong>. Incident reporting, care documentation, training tracking, and audit trails all follow Welsh regulatory requirements from day one.
                </p>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-welsh-green/10 text-welsh-green text-sm font-medium mb-4">
                10 Powerful Modules
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Everything You Need, In One Place</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                CareCall AI combines ten integrated modules that work together seamlessly — no integrations needed, no data silos, no switching between systems.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <AnimateOnScroll key={feature.title} animation="fade-up" delay={i * 50}>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all hover:border-slate-300 h-full">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${feature.bg} ${feature.textColor} flex items-center justify-center flex-shrink-0`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg mb-2">{feature.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots / App Preview */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">See It in Action</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                A glimpse inside CareCall AI — from the coordinator&apos;s control room to the carer&apos;s mobile interface.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {screenshots.map((screen, i) => (
              <AnimateOnScroll key={screen.title} animation="fade-up" delay={i * 100}>
                <div className="group">
                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl overflow-hidden mb-4 aspect-video flex items-center justify-center border border-slate-200 group-hover:shadow-lg transition-shadow">
                    <div className="text-center p-6">
                      <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500 font-medium">{screen.title}</p>
                      <p className="text-xs text-slate-400 mt-1">Screenshot coming soon</p>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{screen.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{screen.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Domiciliary Care */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="fade-up">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-welsh-red/20 text-welsh-red text-sm font-medium mb-6">
                  Purpose-Built
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  Built Specifically for Domiciliary Care
                </h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                  CareCall AI isn&apos;t a generic business tool adapted for care. It was designed from scratch for the unique challenges of domiciliary care delivery — where your team is spread across the community, visiting people in their homes, and needs tools that work in the real world.
                </p>
                <ul className="space-y-4">
                  {[
                    { title: 'Community-Based Operations', desc: 'GPS tracking and location-aware features built for teams that work across a wide geographic area, not in a single building.' },
                    { title: 'Visit-Centric Workflows', desc: 'Clock in/out at each visit with automatic care documentation. Every interaction is captured in the context of the visit.' },
                    { title: 'Person-Centred Care Records', desc: 'Mood tracking, food/fluid intake, personal care tasks — the holistic care data that matters for domiciliary care.' },
                    { title: 'Emergency Response Ready', desc: 'Incident reporting with severity levels, safeguarding protocols, and notification workflows for when things don\u2019t go to plan.' },
                    { title: 'Lone Worker Safety', desc: 'Real-time GPS visibility means coordinators always know where their carers are, supporting lone worker safety policies.' },
                  ].map((item) => (
                    <li key={item.title} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-welsh-green flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="text-sm text-slate-400">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="fade-up" delay={200}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { number: '24/7', label: 'Operations Support' },
                  { number: '15s', label: 'GPS Update Interval' },
                  { number: '42+', label: 'Integrated Features' },
                  { number: '100%', label: 'Welsh CIW Focused' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center">
                    <p className="text-3xl font-bold bg-gradient-to-r from-welsh-green to-emerald-400 bg-clip-text text-transparent">{stat.number}</p>
                    <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* CIW Compliance */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-welsh-green/10 text-welsh-green text-sm font-medium mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Welsh Compliance
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">CIW Compliance, Built In</h2>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                Care Inspectorate Wales expects care providers to maintain comprehensive records, report incidents promptly, ensure staff are trained, and demonstrate person-centred care. CareCall AI makes this effortless.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ciwFeatures.map((feature, i) => (
              <AnimateOnScroll key={feature.title} animation="fade-up" delay={i * 80}>
                <div className="bg-green-50/50 rounded-2xl border border-green-200/50 p-6 h-full">
                  <div className="w-10 h-10 rounded-lg bg-welsh-green/10 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-welsh-green" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Who Is It For */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Who Is CareCall AI For?</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Whether you&apos;re a growing agency or an established provider, CareCall AI scales with your needs.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Domiciliary Care Agencies', desc: 'The core use case — manage staff, visits, and compliance across your community care operations.', icon: '🏠' },
              { title: 'Care Coordinators', desc: 'The GPS control room and rota tools give you real-time visibility and complete operational control.', icon: '📡' },
              { title: 'Care Managers', desc: 'Analytics, reports, approval workflows, and compliance tracking — everything you need to manage effectively.', icon: '📊' },
              { title: 'Frontline Carers', desc: 'A simple, intuitive mobile app that makes documentation quick and keeps you connected to your team.', icon: '💚' },
            ].map((role, i) => (
              <AnimateOnScroll key={role.title} animation="fade-up" delay={i * 100}>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center hover:shadow-lg transition-shadow h-full">
                  <span className="text-4xl mb-4 block">{role.icon}</span>
                  <h3 className="font-semibold text-slate-900 mb-2">{role.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{role.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Demo / Trial CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-welsh-green to-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll animation="fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">See CareCall AI for Yourself</h2>
            <p className="text-xl text-white/80 mb-4">
              Request a free demo and we&apos;ll set you up with your own dedicated instance.
            </p>
            <p className="text-base text-white/60 mb-10 max-w-2xl mx-auto">
              Explore every feature with sample data — no commitment, no credit card, no pressure. Just a chance to see how CareCall AI can transform your care operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-welsh-green font-semibold rounded-xl hover:bg-slate-100 transition-colors text-base"
              >
                Request a Free Demo
              </Link>
              <a
                href="mailto:enquiries@accredilinkcare.co.uk?subject=CareCall AI Demo Request"
                className="px-8 py-4 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base"
              >
                Email Us Directly
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
            </div>
          </AnimateOnScroll>

          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <AnimateOnScroll key={i} animation="fade-up" delay={i * 50}>
                <div className="border border-slate-200 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-3">{faq.q}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll animation="fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform How You Deliver Care?
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
              CareCall AI is more than software — it&apos;s a complete operational platform built by people who understand care. Let us show you what it can do for your agency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="px-8 py-4 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors text-base"
              >
                Request a Demo Today
              </Link>
              <Link
                href="/apps-that-care"
                className="px-8 py-4 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base"
              >
                Back to Apps That Care
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  );
}

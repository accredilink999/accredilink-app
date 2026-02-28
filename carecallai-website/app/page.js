import Link from "next/link";
import {
  Calendar,
  ClipboardList,
  Pill,
  Users,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Star,
  Building2,
  Sparkles,
  Receipt,
  Bot,
  MapPin,
  QrCode,
  Clock,
  FileSearch,
  BarChart3,
  Zap,
  Globe,
  Lock,
  CheckCircle,
  AlertTriangle,
  Heart,
  Activity,
  Languages,
  FileText,
  BadgeCheck,
  CircleDollarSign,
  X,
} from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeatureCard from "@/components/FeatureCard";
import CTABanner from "@/components/CTABanner";
import FAQ from "@/components/FAQ";
import PhoneMockup, { PhoneScreenRota, PhoneScreenMAR, PhoneScreenCheckIn, PhoneScreenCareLog, PhoneScreenIncident } from "@/components/PhoneMockup";
import BrowserMockup, { DashboardScreen, ComplianceScreen, StaffManagementScreen, TrainingScreen, InvoicingScreen } from "@/components/BrowserMockup";
import { OrganizationJsonLd, SoftwareApplicationJsonLd, FAQJsonLd } from "@/components/SEO/JsonLd";

const features = [
  { icon: Calendar, title: "Scheduling & Rota", description: "Multi-area rotas, shift patterns, one-off calls and drag-and-drop scheduling for your entire team.", href: "/features/scheduling" },
  { icon: ClipboardList, title: "Care Logging", description: "Digital care logs with timestamps, evidence and real-time visibility for managers and families.", href: "/features/care-logging" },
  { icon: Pill, title: "Medication / MAR Charts", description: "Electronic MAR charts with PRN support, refused/destroyed tracking and full audit trails.", href: "/features/medication-management" },
  { icon: Users, title: "Staff Management", description: "Leave requests, training tracking, DBS expiry alerts, expenses and emergency contacts in one place.", href: "/features/staff-management" },
  { icon: ShieldCheck, title: "Compliance & Virtual Inspector", description: "CIW and CQC compliant. 50+ automated inspection checks, live scoring and inspection-ready reports.", href: "/features/compliance" },
  { icon: Smartphone, title: "Mobile App", description: "Native iOS and Android app for carers — care logging, MAR charts and rota access on the go.", href: "/features/mobile-app" },
  { icon: MapPin, title: "GPS Check-In & Live Tracking", description: "Carers check in and out of calls with GPS verification. Live location tracking and mileage for fuel expenses.", href: "/features/gps-tracking" },
  { icon: Receipt, title: "Invoicing & Payroll", description: "Invoice councils and private clients directly. Connects to QuickBooks, Sage and Xero.", href: "/features/invoicing-payroll" },
  { icon: Bot, title: "AI Assistant", description: "AI-powered care plan drafting, risk assessments and compliance documentation.", href: "/features/ai-assistant" },
];

const steps = [
  { number: "1", title: "Sign up in minutes", description: "Create your account, add your staff and clients. Import existing data or start fresh.", icon: Zap },
  { number: "2", title: "Set up your rota", description: "Create shift patterns, assign carers to areas and build your weekly schedule with templates.", icon: Calendar },
  { number: "3", title: "Go live", description: "Your team downloads the mobile app and starts logging care visits, medications and incidents in real time.", icon: Globe },
];

const faqs = [
  { question: "Is CareCallAI compliant with CIW and CQC?", answer: "Yes. CareCallAI is built specifically for UK domiciliary care agencies and includes all the features required for CIW (Wales) and CQC (England) compliance, including care logging, medication management, incident reporting and audit trails. The Virtual Care Inspector runs 50+ automated compliance checks against CIW RISCA and CQC HSCA regulations." },
  { question: "What does the Virtual Care Inspector do?", answer: "The Virtual Care Inspector runs a full automated inspection across 8 categories: staff compliance (DBS, ID, references), supervisions, training certificates, service users (care plans, assessments), medication (MAR charts), care delivery, incidents and governance. It gives you a live compliance score and flags every gap before a real inspector finds it." },
  { question: "How long does it take to set up?", answer: "Most agencies are fully set up within a day. You can import your existing staff and client data, and our team is available to help with onboarding if needed." },
  { question: "Can my carers use it on their phones?", answer: "Yes. CareCallAI has native iOS and Android apps that carers use to view their rota, log care visits, complete MAR charts and report incidents — all from their phone." },
  { question: "Is there a free trial?", answer: "Yes. We offer a free 7-day trial on all plans with no credit card required. You get full access to every feature during the trial." },
  { question: "How does pricing work?", answer: "CareCallAI is priced per month based on your team size. Plans start from £99/month for up to 15 staff. Annual billing saves 20%. See our pricing page for full details." },
  { question: "Does it support Welsh language?", answer: "Yes. CareCallAI is built in Wales and includes full bilingual Welsh/English compliance support. All CIW regulations, guidance and forms are available in both languages — essential for Welsh-registered care providers." },
  { question: "Does it connect to my accounting software?", answer: "Yes. CareCallAI integrates with QuickBooks, Sage and Xero for seamless invoice and payroll export. You can also invoice councils and private clients directly from the platform." },
];

const stats = [
  { value: "500+", label: "Care visits logged daily", icon: ClipboardList },
  { value: "99.9%", label: "Uptime reliability", icon: Zap },
  { value: "50+", label: "Automated compliance checks", icon: ShieldCheck },
  { value: "4.8/5", label: "User satisfaction rating", icon: Star },
];

const comparisonFeatures = [
  { feature: "Electronic MAR Charts", us: true, typical: true, basic: false },
  { feature: "GPS Check-In / Check-Out", us: true, typical: true, basic: false },
  { feature: "Care Logging (Mobile)", us: true, typical: true, basic: true },
  { feature: "Staff Rota & Scheduling", us: true, typical: true, basic: true },
  { feature: "Incident Reporting", us: true, typical: true, basic: false },
  { feature: "Virtual Care Inspector", us: true, typical: false, basic: false },
  { feature: "Live Compliance Scoring", us: true, typical: false, basic: false },
  { feature: "CIW RISCA Regulation Mapping", us: true, typical: false, basic: false },
  { feature: "CQC HSCA Regulation Mapping", us: true, typical: false, basic: false },
  { feature: "Bilingual Welsh/English", us: true, typical: false, basic: false },
  { feature: "12-Weekly Supervision Tracking", us: true, typical: false, basic: false },
  { feature: "Invoicing & Payroll", us: true, typical: "addon", basic: false },
  { feature: "AI Care Plan Drafting", us: true, typical: false, basic: false },
  { feature: "Training Matrix & Certificates", us: true, typical: "addon", basic: false },
  { feature: "Family Portal", us: true, typical: false, basic: false },
];

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <FAQJsonLd items={faqs} />

      {/* ─── HERO ─── */}
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-800 to-teal-900 py-16 sm:py-24 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-40 right-1/4 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl animate-float-slow" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <AnimateOnScroll animation="fade-down">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-teal-300 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/10">
                  <Sparkles className="w-4 h-4" />
                  Built for UK domiciliary care agencies
                </div>
              </AnimateOnScroll>
              <AnimateOnScroll animation="slide-left" delay={100}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
                  Care Management<br />
                  <span className="text-gradient">Made Simple</span>
                </h1>
              </AnimateOnScroll>
              <AnimateOnScroll animation="slide-left" delay={200}>
                <p className="text-lg text-slate-300 max-w-lg mb-8">
                  All-in-one software for scheduling, care logging, MAR charts, GPS tracking,
                  compliance and invoicing — with a built-in Virtual Care Inspector. CIW &amp; CQC ready. From £99/month.
                </p>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Link href="/signup" className="px-8 py-3.5 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/30 text-lg animate-pulse-glow">
                    Start Free 7-Day Trial
                  </Link>
                  <Link href="/features" className="px-8 py-3.5 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 text-lg backdrop-blur">
                    See All Features <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <p className="text-sm text-slate-500">No credit card required &middot; Free 7-day trial &middot; Cancel anytime</p>
              </AnimateOnScroll>
            </div>

            <div className="hidden lg:block relative">
              <AnimateOnScroll animation="slide-right" delay={200}>
                <div className="relative">
                  <div className="animate-float-slow">
                    <BrowserMockup className="w-full max-w-lg"><DashboardScreen /></BrowserMockup>
                  </div>
                  <div className="absolute -bottom-8 -right-4 animate-float-delayed z-10">
                    <PhoneMockup className="shadow-2xl"><PhoneScreenRota /></PhoneMockup>
                  </div>
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <AnimateOnScroll key={i} delay={i * 100} animation="scale">
                <div className="text-center group">
                  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-200 transition-colors icon-hover-spin">
                    <stat.icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <p className="text-3xl font-bold text-teal-600">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── App Screenshots Showcase ─── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">See CareCallAI in action</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">From the manager&apos;s dashboard to the carer&apos;s phone — everything your team needs, beautifully designed and easy to use.</p>
            </div>
          </AnimateOnScroll>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            <AnimateOnScroll animation="slide-left" delay={0}>
              <div className="animate-float"><PhoneMockup title="MAR Chart"><PhoneScreenMAR /></PhoneMockup></div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="scale" delay={150}>
              <div className="animate-float-delayed"><PhoneMockup title="Care Log" className="lg:scale-110 lg:-mt-8"><PhoneScreenCareLog /></PhoneMockup></div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="slide-right" delay={300}>
              <div className="animate-float-slow"><PhoneMockup title="Today's Visits"><PhoneScreenRota /></PhoneMockup></div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── Features grid ─── */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Everything your care agency needs</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">From scheduling shifts to logging medications, CareCallAI replaces paper forms, spreadsheets and disconnected tools with one powerful platform.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.href} {...feature} delay={i * 80} />
            ))}
          </div>
          <AnimateOnScroll delay={600}>
            <div className="text-center mt-10">
              <Link href="/features" className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 text-lg">
                View all features <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ─── Desktop Screens Showcase ─── */}
      <section className="py-16 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Powerful desktop views for managers</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Full visibility across your entire operation — staff compliance, training matrix, invoicing and real-time compliance scoring, all from one dashboard.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimateOnScroll animation="slide-left" delay={0}>
              <div>
                <BrowserMockup title="Staff Management — CareCallAI" className="w-full"><StaffManagementScreen /></BrowserMockup>
                <p className="text-center text-sm font-medium text-slate-600 mt-3">Staff overview with DBS status and training compliance</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="slide-right" delay={150}>
              <div>
                <BrowserMockup title="Training Matrix — CareCallAI" className="w-full"><TrainingScreen /></BrowserMockup>
                <p className="text-center text-sm font-medium text-slate-600 mt-3">Training matrix tracking completion across all courses</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="slide-left" delay={300}>
              <div>
                <BrowserMockup title="Invoicing & Payroll — CareCallAI" className="w-full"><InvoicingScreen /></BrowserMockup>
                <p className="text-center text-sm font-medium text-slate-600 mt-3">Invoice councils and private clients directly</p>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="slide-right" delay={450}>
              <div>
                <BrowserMockup title="Virtual Care Inspector — CareCallAI" className="w-full"><ComplianceScreen /></BrowserMockup>
                <p className="text-center text-sm font-medium text-slate-600 mt-3">Live compliance scoring with automated gap detection</p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── GPS Check-In & QR Code ─── */}
      <section className="py-16 sm:py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="slide-left">
              <div>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                  <MapPin className="w-4 h-4" />
                  Smart Location Features
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">GPS Check-In, QR Codes<br />& Live Tracking</h2>
                <p className="text-slate-600 mb-6">
                  Carers check in and out of every call with GPS-verified location. Scan a QR code at
                  the client&apos;s home or care plan for instant check-in. Managers see live locations and
                  mileage is logged automatically for fuel expense claims.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: MapPin, title: "GPS Check-In / Check-Out", desc: "Automatic timestamp and location capture at every visit" },
                    { icon: QrCode, title: "QR Code Scanning", desc: "Scan a code at the client's home to instantly check in to a call" },
                    { icon: Globe, title: "Live Staff Tracking", desc: "See where all your carers are in real time on a map" },
                    { icon: Receipt, title: "Automatic Mileage & Fuel", desc: "Journey distances logged for fuel expense claims — no manual entry" },
                  ].map((item, i) => (
                    <AnimateOnScroll key={i} delay={i * 100} animation="slide-left">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white card-hover border border-slate-100">
                        <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <item.icon className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    </AnimateOnScroll>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="slide-right" delay={200}>
              <div className="flex justify-center gap-6">
                <div className="animate-float"><PhoneMockup title="Check In"><PhoneScreenCheckIn /></PhoneMockup></div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── Mobile Incident & Care Logging ─── */}
      <section className="py-16 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="slide-left" delay={0}>
              <div className="flex justify-center gap-6">
                <div className="animate-float"><PhoneMockup title="Care Log"><PhoneScreenCareLog /></PhoneMockup></div>
                <div className="animate-float-delayed hidden sm:block"><PhoneMockup title="Incident"><PhoneScreenIncident /></PhoneMockup></div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="slide-right" delay={200}>
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                  <ClipboardList className="w-4 h-4" />
                  Real-Time Reporting
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Care Logs & Incident<br />Reporting from Mobile</h2>
                <p className="text-slate-600 mb-6">
                  Carers log every visit detail from their phone — tasks completed, fluid intake, mood and wellbeing notes.
                  Incidents are reported immediately with type, severity and description. Managers get notified in real time.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: ClipboardList, title: "Digital Care Logs", desc: "Task checklists, notes and timestamps — no more paper forms" },
                    { icon: AlertTriangle, title: "Instant Incident Reporting", desc: "Report incidents from the field. Managers notified immediately" },
                    { icon: Heart, title: "Wellbeing Tracking", desc: "Record mood, appetite, skin condition and observations at every visit" },
                    { icon: Activity, title: "Real-Time Visibility", desc: "Managers and families see care activity as it happens" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 card-hover border border-slate-100">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── VIRTUAL CARE INSPECTOR — HERO SHOWCASE ─── */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl animate-float-slow" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <AnimateOnScroll animation="fade-down">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur text-emerald-300 text-sm font-medium px-6 py-2 rounded-full mb-6 border border-emerald-400/30 animate-pulse-glow">
                <ShieldCheck className="w-5 h-5" />
                Enterprise Feature — Only Available in CareCallAI
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Virtual Care<br /><span className="text-gradient">Inspector</span>
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                The UK&apos;s first automated compliance inspection engine for domiciliary care.
                One click runs the same checks a CIW or CQC inspector performs — across every staff record,
                care plan, MAR chart and incident report in your system. Instantly.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16">
            <AnimateOnScroll animation="slide-left">
              <div className="animate-float-slow">
                <BrowserMockup title="Virtual Care Inspector — CareCallAI" className="w-full"><ComplianceScreen /></BrowserMockup>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll animation="slide-right" delay={200}>
              <div className="space-y-6">
                {[
                  { icon: ShieldCheck, title: "50+ Automated Checks", desc: "Covers 8 inspection categories: staff compliance, supervisions, training, service users, medication, care delivery, incidents and governance.", color: "bg-teal-500/20", iconColor: "text-teal-400" },
                  { icon: FileSearch, title: "Instant Gap Detection", desc: "Flags missing DBS checks, expired training, overdue care plan reviews, MAR chart gaps, no staff ID, missing references and more.", color: "bg-amber-500/20", iconColor: "text-amber-400" },
                  { icon: BarChart3, title: "Live Compliance Scoring", desc: "Real-time score per category with overall CIW/CQC rating — Excellent, Good, Adequate or Poor — so you always know where you stand.", color: "bg-blue-500/20", iconColor: "text-blue-400" },
                  { icon: FileText, title: "Regulation-Mapped Findings", desc: "Every finding mapped to its specific regulation (CIW RISCA Reg 29, CQC HSCA Reg 19, etc.) with severity level so you know exactly what to fix.", color: "bg-purple-500/20", iconColor: "text-purple-400" },
                ].map((item, i) => (
                  <AnimateOnScroll key={i} delay={i * 120} animation="slide-right">
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors">
                      <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{item.title}</h4>
                        <p className="text-sm text-slate-400 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  </AnimateOnScroll>
                ))}
              </div>
            </AnimateOnScroll>
          </div>

          {/* ROI / Enterprise selling points */}
          <AnimateOnScroll animation="fade-up" delay={400}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: CircleDollarSign, value: "£5,000+", label: "Average savings per year", desc: "Avoid inspection failures, reduce admin hours and eliminate paper-based systems", color: "from-emerald-500/20 to-teal-500/20" },
                { icon: Clock, value: "10+ hours", label: "Saved every month", desc: "No more manual compliance audits — the Virtual Inspector runs in seconds, not days", color: "from-blue-500/20 to-cyan-500/20" },
                { icon: BadgeCheck, value: "100%", label: "Inspection readiness", desc: "Know your compliance score at all times. Fix gaps before inspectors find them", color: "from-purple-500/20 to-pink-500/20" },
              ].map((item, i) => (
                <div key={i} className={`bg-gradient-to-br ${item.color} backdrop-blur rounded-2xl p-6 border border-white/10 text-center`}>
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-3xl font-black text-white">{item.value}</p>
                  <p className="text-sm font-semibold text-emerald-300 mt-1">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-2">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={500}>
            <div className="text-center mt-12">
              <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 text-white font-bold text-lg rounded-xl hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/30 animate-pulse-glow">
                Start Free Trial — See Your Compliance Score <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-slate-500 mt-3">No credit card required &middot; Full access for 7 days</p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ─── Bilingual Compliance — Welsh & English ─── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="slide-left">
              <div>
                <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                  <Languages className="w-4 h-4" />
                  Bilingual — Cymraeg / English
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                  Built in Wales.<br />Built for Wales.
                </h2>
                <p className="text-lg text-red-700 font-medium mb-4">Wedi&apos;i adeiladu yng Nghymru. Wedi&apos;i adeiladu ar gyfer Cymru.</p>
                <p className="text-slate-600 mb-6">
                  CareCallAI is the only care management platform with full bilingual Welsh/English compliance support.
                  All CIW regulations, RISCA guidance, compliance forms and Virtual Inspector findings are available
                  in both languages — meeting the Welsh Language Standards that CIW requires.
                </p>
                <div className="space-y-3">
                  {[
                    { title: "CIW RISCA Regulations", desc: "All 60+ regulations with full Welsh translations and bilingual guidance", titleCy: "Rheoliadau RISCA AGC" },
                    { title: "Compliance Forms", desc: "Pre-populated CIW filing forms in Welsh and English", titleCy: "Ffurflenni Cydymffurfio" },
                    { title: "Inspector Findings", desc: "Virtual Inspector results available in both languages", titleCy: "Canfyddiadau'r Arolygwr" },
                    { title: "Staff & Service User Records", desc: "Welsh language support throughout the entire platform", titleCy: "Cofnodion Staff a Defnyddwyr" },
                  ].map((item, i) => (
                    <AnimateOnScroll key={i} delay={i * 100} animation="slide-left">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 card-hover">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
                          <p className="text-[11px] text-red-600 font-medium">{item.titleCy}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    </AnimateOnScroll>
                  ))}
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="slide-right" delay={200}>
              <div className="space-y-6">
                {/* CIW Badge */}
                <div className="bg-gradient-to-br from-red-50 to-white rounded-2xl p-8 border border-red-200 text-center">
                  <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-10 h-10 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">CIW Compliant</h3>
                  <p className="text-sm text-slate-600 mt-1">Care Inspectorate Wales</p>
                  <p className="text-xs text-red-600 mt-1">Arolygiaeth Gofal Cymru</p>
                  <p className="text-xs text-slate-500 mt-3">RISCA 2016 &middot; Regulations 21-80</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {["Staff Files", "Supervisions", "Training", "Care Plans", "MAR Charts", "Incidents"].map((tag) => (
                      <span key={tag} className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
                {/* CQC Badge */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 border border-blue-200 text-center">
                  <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">CQC Compliant</h3>
                  <p className="text-sm text-slate-600 mt-1">Care Quality Commission</p>
                  <p className="text-xs text-slate-500 mt-3">HSCA 2008 &middot; Regulations 9-20</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {["Safe", "Effective", "Caring", "Responsive", "Well-led"].map((tag) => (
                      <span key={tag} className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── Competitor Comparison ─── */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
                <BarChart3 className="w-4 h-4" />
                Feature Comparison
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Why agencies choose CareCallAI</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Most care software covers the basics. CareCallAI is the only platform that combines daily operations with automated compliance inspection and bilingual Welsh support.</p>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll animation="fade-up" delay={200}>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 gap-0 border-b border-slate-200 bg-slate-50">
                <div className="p-4 font-semibold text-slate-700 text-sm">Feature</div>
                <div className="p-4 text-center">
                  <p className="font-bold text-teal-600 text-sm">CareCallAI</p>
                  <p className="text-[10px] text-slate-500">From £99/mo</p>
                </div>
                <div className="p-4 text-center">
                  <p className="font-semibold text-slate-600 text-sm">Typical Care Software</p>
                  <p className="text-[10px] text-slate-500">£100-300/mo</p>
                </div>
                <div className="p-4 text-center">
                  <p className="font-semibold text-slate-400 text-sm">Basic / Paper</p>
                  <p className="text-[10px] text-slate-400">Variable</p>
                </div>
              </div>
              {/* Rows */}
              {comparisonFeatures.map((row, i) => (
                <div key={i} className={`grid grid-cols-4 gap-0 border-b border-slate-100 last:border-0 ${i % 2 === 0 ? "" : "bg-slate-50/50"}`}>
                  <div className="p-3 text-sm text-slate-700 font-medium">{row.feature}</div>
                  <div className="p-3 flex justify-center">
                    <CheckCircle className="w-5 h-5 text-teal-500" />
                  </div>
                  <div className="p-3 flex justify-center">
                    {row.typical === true && <CheckCircle className="w-5 h-5 text-slate-400" />}
                    {row.typical === "addon" && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Add-on</span>}
                    {row.typical === false && <X className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="p-3 flex justify-center">
                    {row.basic === true && <CheckCircle className="w-5 h-5 text-slate-300" />}
                    {row.basic === false && <X className="w-5 h-5 text-slate-200" />}
                  </div>
                </div>
              ))}
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll delay={400}>
            <div className="text-center mt-8">
              <p className="text-sm text-slate-500 mb-4">CareCallAI includes all 15 features as standard — no add-ons, no hidden costs</p>
              <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Up and running in a day</h2>
              <p className="text-slate-600">Getting started with CareCallAI is straightforward. No complex setup, no IT team required.</p>
            </div>
          </AnimateOnScroll>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <AnimateOnScroll key={i} delay={i * 150} animation={i % 2 === 0 ? "slide-left" : "slide-right"}>
                <div className="flex items-start gap-6 bg-slate-50 rounded-2xl p-6 card-hover">
                  <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-teal-600/20">
                    <step.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">Step {step.number}</span>
                    <h3 className="text-lg font-semibold text-slate-900 mt-1">{step.title}</h3>
                    <p className="text-slate-600 mt-1">{step.description}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing preview ─── */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
              <p className="text-slate-600">Plans that grow with your agency. Save 20% with annual billing.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "99", users: "Up to 15 staff", highlight: false, features: ["Scheduling & Rota", "Care Logging", "Staff Management", "GPS Check-In", "Mobile App"] },
              { name: "Professional", price: "199", users: "Up to 30 staff", highlight: true, features: ["Everything in Starter", "eMAR Charts", "Invoicing & Payroll", "Training Matrix", "AI Assistant"] },
              { name: "Enterprise", price: "349", users: "Unlimited staff", highlight: false, features: ["Everything in Professional", "Virtual Care Inspector", "CIW/CQC Compliance Suite", "Bilingual Compliance", "Priority Support"] },
            ].map((tier, i) => (
              <AnimateOnScroll key={tier.name} delay={i * 120} animation="scale">
                <div className={`bg-white rounded-2xl p-6 border text-center card-hover ${tier.highlight ? "border-teal-500 shadow-xl ring-2 ring-teal-500" : "border-slate-200 shadow-sm"}`}>
                  {tier.highlight && <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full mb-3">Most Popular</span>}
                  <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                  <p className="mt-3"><span className="text-4xl font-bold text-slate-900">£{tier.price}</span><span className="text-slate-500">/mo</span></p>
                  <p className="text-sm text-slate-500 mt-1 mb-4">{tier.users}</p>
                  <div className="text-left space-y-2 mb-6">
                    {tier.features.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                        <span className="text-sm text-slate-600">{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/pricing" className="block text-center py-2.5 rounded-xl font-semibold text-sm bg-teal-600 text-white hover:bg-teal-700 transition-colors">See Plan Details</Link>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
          <AnimateOnScroll delay={400}>
            <div className="text-center mt-8">
              <Link href="/pricing" className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700">See full pricing & compare plans <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ─── CareCallAI Home — Beta Programme ─── */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-teal-50 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll animation="zoom">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4 animate-bounce-gentle">
              <Building2 className="w-4 h-4" />
              Beta Programme — Limited Places
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">CareCallAI <span className="text-blue-600">Home</span></h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-6">
              Everything in CareCallAI, tailored for residential care homes. Join our Beta programme and get
              full access to the entire platform throughout development — help shape the final product and
              receive <strong className="text-blue-700">6 months free</strong> once completed.
            </p>
            <Link href="/beta" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
              Register Interest <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-slate-500 mt-3">Full access &middot; Shape the product &middot; 6 months free on completion</p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll><div className="text-center mb-12"><h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Trusted by care agencies across the UK</h2></div></AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "CareCallAI replaced three separate systems for us. Scheduling, care logs and MAR charts all in one place. Our carers love the mobile app.", name: "Sarah T.", role: "Registered Manager", agency: "Home Care Wales" },
              { quote: "The Virtual Care Inspector saved us during our last CIW inspection. We could show live compliance scores and a clean audit trail instantly.", name: "James M.", role: "Director", agency: "Premier Care Services" },
              { quote: "We switched from paper MAR charts and haven't looked back. Medication errors have dropped and our audit trail is bulletproof.", name: "Lisa R.", role: "Care Coordinator", agency: "Compassionate Care Ltd" },
            ].map((t, i) => (
              <AnimateOnScroll key={i} delay={i * 120} animation="scale">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full flex flex-col card-hover">
                  <div className="flex gap-1 mb-4">{[...Array(5)].map((_, j) => (<Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />))}</div>
                  <p className="text-slate-700 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}, {t.agency}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll><h2 className="text-3xl sm:text-4xl font-bold text-slate-900 text-center mb-10">Frequently Asked Questions</h2></AnimateOnScroll>
          <FAQ items={faqs} />
        </div>
      </section>

      <CTABanner />
    </>
  );
}

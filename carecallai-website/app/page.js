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
} from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeatureCard from "@/components/FeatureCard";
import CTABanner from "@/components/CTABanner";
import FAQ from "@/components/FAQ";
import PhoneMockup, { PhoneScreenRota, PhoneScreenMAR, PhoneScreenCheckIn } from "@/components/PhoneMockup";
import BrowserMockup, { DashboardScreen, ComplianceScreen } from "@/components/BrowserMockup";
import { OrganizationJsonLd, SoftwareApplicationJsonLd, FAQJsonLd } from "@/components/SEO/JsonLd";

const features = [
  { icon: Calendar, title: "Scheduling & Rota", description: "Multi-area rotas, shift patterns, one-off calls and drag-and-drop scheduling for your entire team.", href: "/features/scheduling" },
  { icon: ClipboardList, title: "Care Logging", description: "Digital care logs with timestamps, evidence and real-time visibility for managers and families.", href: "/features/care-logging" },
  { icon: Pill, title: "Medication / MAR Charts", description: "Electronic MAR charts with PRN support, refused/destroyed tracking and full audit trails.", href: "/features/medication-management" },
  { icon: Users, title: "Staff Management", description: "Leave requests, training tracking, DBS expiry alerts, expenses and emergency contacts in one place.", href: "/features/staff-management" },
  { icon: ShieldCheck, title: "Compliance & Auditing", description: "CIW and CQC compliant. Automatic audit trails, incident reporting and inspection-ready reports.", href: "/features/compliance" },
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
  { question: "Is CareCallAI compliant with CIW and CQC?", answer: "Yes. CareCallAI is built specifically for UK domiciliary care agencies and includes all the features required for CIW (Wales) and CQC (England) compliance, including care logging, medication management, incident reporting and audit trails." },
  { question: "How long does it take to set up?", answer: "Most agencies are fully set up within a day. You can import your existing staff and client data, and our team is available to help with onboarding if needed." },
  { question: "Can my carers use it on their phones?", answer: "Yes. CareCallAI has native iOS and Android apps that carers use to view their rota, log care visits, complete MAR charts and report incidents — all from their phone." },
  { question: "Is there a free trial?", answer: "Yes. We offer a free 14-day trial on all plans with no credit card required. You get full access to every feature during the trial." },
  { question: "How does pricing work?", answer: "CareCallAI is priced per month based on your team size. Plans start from £79/month for up to 15 users. Annual billing saves 20%. See our pricing page for full details." },
  { question: "Does it connect to my accounting software?", answer: "Yes. CareCallAI integrates with QuickBooks, Sage and Xero for seamless invoice and payroll export. You can also invoice councils and private clients directly from the platform." },
];

const stats = [
  { value: "500+", label: "Care visits logged daily", icon: ClipboardList },
  { value: "99.9%", label: "Uptime reliability", icon: Zap },
  { value: "30s", label: "Average setup time per carer", icon: Clock },
  { value: "4.8/5", label: "User satisfaction rating", icon: Star },
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
                  Home Care<br />Management<br />
                  <span className="text-gradient">Made Simple</span>
                </h1>
              </AnimateOnScroll>
              <AnimateOnScroll animation="slide-left" delay={200}>
                <p className="text-lg text-slate-300 max-w-lg mb-8">
                  All-in-one software for scheduling, care logging, MAR charts, GPS tracking,
                  compliance and invoicing. CIW & CQC ready. From £79/month.
                </p>
              </AnimateOnScroll>
              <AnimateOnScroll animation="fade-up" delay={300}>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Link href="/signup" className="px-8 py-3.5 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/30 text-lg animate-pulse-glow">
                    Start Free 14-Day Trial
                  </Link>
                  <Link href="/features" className="px-8 py-3.5 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all flex items-center gap-2 text-lg backdrop-blur">
                    See All Features <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <p className="text-sm text-slate-500">No credit card required &middot; Free 14-day trial &middot; Cancel anytime</p>
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

      {/* ─── App Screenshots ─── */}
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
              <div className="animate-float-delayed"><PhoneMockup title="Check In" className="lg:scale-110 lg:-mt-8"><PhoneScreenCheckIn /></PhoneMockup></div>
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

      {/* ─── GPS Check-In & QR Code ─── */}
      <section className="py-16 sm:py-24 bg-white overflow-hidden">
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
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 card-hover">
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
              <div className="flex justify-center">
                <div className="animate-float"><PhoneMockup title="Check In"><PhoneScreenCheckIn /></PhoneMockup></div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── Virtual Care Inspector ─── */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-slate-900 to-teal-900 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="slide-left">
              <div className="flex justify-center"><div className="animate-float-slow">
                <BrowserMockup title="Virtual Care Inspector — CareCallAI" className="max-w-lg"><ComplianceScreen /></BrowserMockup>
              </div></div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="slide-right" delay={200}>
              <div>
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur text-emerald-300 text-sm font-medium px-4 py-1.5 rounded-full mb-4 border border-emerald-400/30">
                  <ShieldCheck className="w-4 h-4" />
                  Live Feature
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Virtual Care Inspector</h2>
                <p className="text-slate-300 mb-6">
                  One click runs a full compliance audit across every record in your system — staff DBS checks, supervision cycles, training certificates, care plans, MAR charts, incident reports and governance filings. The same checks CIW and CQC inspectors perform, automated and instant.
                </p>
                <div className="space-y-3">
                  {[
                    { icon: ShieldCheck, title: "50+ automated checks", desc: "Covers 8 inspection categories: staff compliance, supervisions, training, service users, medication, care delivery, incidents and governance" },
                    { icon: FileSearch, title: "Instant gap detection", desc: "Flags missing DBS checks, expired training, overdue care plan reviews, MAR chart gaps, unresolved incidents and unfiled governance reports" },
                    { icon: BarChart3, title: "Live compliance scoring", desc: "Real-time score per category with overall CIW/CQC rating — Excellent, Good, Adequate or Poor — so you always know where you stand" },
                    { icon: Lock, title: "Inspection-ready reports", desc: "Every finding mapped to its regulation (CIW RISCA / CQC HSCA) with severity level and detail — fix issues before an inspector finds them" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 backdrop-blur border border-white/10">
                      <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-teal-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link href="/signup" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-teal-500 text-white font-semibold rounded-xl hover:bg-teal-400 transition-colors">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimateOnScroll>
          </div>
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
              <p className="text-slate-600">40% cheaper than Connecteam. Plans that grow with your agency. Save 20% with annual billing.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "49", users: "Up to 15 users", highlight: false },
              { name: "Professional", price: "99", users: "Up to 50 users", highlight: true },
              { name: "Enterprise", price: "199", users: "Up to 150 users", highlight: false },
            ].map((tier, i) => (
              <AnimateOnScroll key={tier.name} delay={i * 120} animation="scale">
                <div className={`bg-white rounded-2xl p-6 border text-center card-hover ${tier.highlight ? "border-teal-500 shadow-xl ring-2 ring-teal-500" : "border-slate-200 shadow-sm"}`}>
                  {tier.highlight && <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full mb-3">Most Popular</span>}
                  <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                  <p className="mt-3"><span className="text-4xl font-bold text-slate-900">£{tier.price}</span><span className="text-slate-500">/mo</span></p>
                  <p className="text-sm text-slate-500 mt-1 mb-4">{tier.users}</p>
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

      {/* ─── Compliance badges ─── */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll animation="zoom">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Built for UK compliance</h2>
            <p className="text-slate-600 mb-8">CareCallAI meets the requirements of both CIW (Wales) and CQC (England) for domiciliary care record-keeping and audit trails.</p>
          </AnimateOnScroll>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <AnimateOnScroll delay={0} animation="slide-left">
              <Link href="/compliance/ciw" className="flex items-center gap-3 bg-slate-50 rounded-xl px-6 py-4 border border-slate-200 hover:border-teal-300 transition-all card-hover">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-teal-600" /></div>
                <div className="text-left"><p className="font-semibold text-slate-900">CIW Compliant</p><p className="text-xs text-slate-500">Care Inspectorate Wales</p></div>
              </Link>
            </AnimateOnScroll>
            <AnimateOnScroll delay={150} animation="slide-right">
              <Link href="/compliance/cqc" className="flex items-center gap-3 bg-slate-50 rounded-xl px-6 py-4 border border-slate-200 hover:border-teal-300 transition-all card-hover">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center"><ShieldCheck className="w-6 h-6 text-teal-600" /></div>
                <div className="text-left"><p className="font-semibold text-slate-900">CQC Compliant</p><p className="text-xs text-slate-500">Care Quality Commission</p></div>
              </Link>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* ─── Coming Soon: CareCallAI Home ─── */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-teal-50 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll animation="zoom">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4 animate-bounce-gentle">
              <Building2 className="w-4 h-4" />Coming Soon
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">CareCallAI <span className="text-blue-600">Home</span></h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-6">Everything in CareCallAI, tailored for residential care homes and on-site care providers. Shift handovers, resident management, room tracking and facility compliance — all in one platform.</p>
            <Link href="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20">
              Register Interest <ArrowRight className="w-4 h-4" />
            </Link>
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
              { quote: "The GPS check-in feature means we know exactly when carers arrive and leave. The mileage logging has saved us hours on fuel expenses.", name: "James M.", role: "Director", agency: "Premier Care Services" },
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

import Link from "next/link";
import { Home, ClipboardList, Pill, Calendar, ShieldCheck, Smartphone, MapPin, Users, CheckCircle } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd, FAQJsonLd, SoftwareApplicationJsonLd } from "@/components/SEO/JsonLd";
import BrowserMockup, { DashboardScreen, ComplianceScreen } from "@/components/BrowserMockup";
import PhoneMockup, { PhoneScreenCareLog, PhoneScreenMAR, PhoneScreenRota, PhoneScreenCheckIn } from "@/components/PhoneMockup";

export const metadata = {
  title: "Domiciliary Care Software — All-in-One Platform",
  description:
    "Purpose-built domiciliary care software for UK home care agencies. Scheduling, care logging, eMAR, GPS tracking, compliance management and mobile app. CIW & CQC compliant. Free trial.",
  keywords: [
    "domiciliary care software",
    "domiciliary care software UK",
    "home care agency software",
    "domiciliary care management system",
    "dom care software",
  ],
  alternates: { canonical: "https://www.carecallai.co.uk/domiciliary-care-software" },
  openGraph: {
    title: "Domiciliary Care Software — CareCallAI",
    description: "Purpose-built domiciliary care software for UK home care agencies. All features in one platform.",
  },
};

const features = [
  { icon: Calendar, title: "Scheduling & Rota", desc: "Multi-area rotas, shift patterns, drag-and-drop scheduling. Carers see their schedule on the mobile app.", href: "/features/scheduling" },
  { icon: ClipboardList, title: "Digital Care Logging", desc: "Real-time care logs with timestamps, evidence photos and GPS verification. Managers see everything live.", href: "/features/care-logging" },
  { icon: Pill, title: "Electronic MAR Charts", desc: "Full eMAR with PRN support, refused/destroyed tracking and complete audit trails for CIW and CQC.", href: "/features/medication-management" },
  { icon: MapPin, title: "GPS Check-In & Tracking", desc: "Carers check in and out of visits with GPS. Live location tracking and automatic mileage calculation.", href: "/features/gps-tracking" },
  { icon: ShieldCheck, title: "Compliance Management", desc: "50+ automated inspection checks, live CIW/CQC scoring and inspection-ready reports at the click of a button.", href: "/features/compliance" },
  { icon: Smartphone, title: "Mobile App", desc: "Native iOS and Android app for carers — care logging, MAR charts, rota and client details on the go.", href: "/features/mobile-app" },
  { icon: Users, title: "Staff Management", desc: "DBS expiry alerts, training tracking, leave requests, expenses and 12-weekly supervision scheduling.", href: "/features/staff-management" },
  { icon: Home, title: "Family Portal", desc: "Families can see care logs, medication records and visit times in real-time. Builds trust and transparency.", href: "/features" },
];

const faqs = [
  { question: "What is domiciliary care software?", answer: "Domiciliary care software is a digital platform that helps home care agencies manage their daily operations — scheduling visits, logging care, managing medication (eMAR), tracking staff with GPS, and staying compliant with CIW or CQC regulations. It replaces paper-based systems with a single digital solution." },
  { question: "Is CareCallAI suitable for small domiciliary care agencies?", answer: "Yes. CareCallAI plans start from just £99/month and scale with your team. Whether you have 5 carers or 500, every feature is included — no per-user fees, no hidden add-ons." },
  { question: "Does CareCallAI work with CIW and CQC?", answer: "Yes. CareCallAI has dedicated CIW and CQC compliance modules with pre-populated regulation forms, automated inspection checks, and inspection-ready reports. It is the only platform offering built-in compliance for both regulators." },
  { question: "Can carers use it on their phones?", answer: "Yes. CareCallAI has native iOS and Android apps. Carers can view their rota, log care notes, complete MAR charts, and check in/out of visits with GPS — all from their phone." },
  { question: "How does CareCallAI compare to other domiciliary care software?", answer: "CareCallAI is up to 50% cheaper than competitors like Birdie, CarePlanner and Log my Care, while offering more features. It is the only platform with built-in CIW compliance, clinical assessments (Waterlow, MUST, NEWS2), and AI-powered care plan drafting in one system." },
];

export default function DomiciliaryCareSoftwarePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Domiciliary Care Software" }]} />
      <SoftwareApplicationJsonLd />
      <FAQJsonLd items={faqs} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-4">Purpose-Built for Home Care</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6">
              Domiciliary Care Software
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
              The all-in-one platform built for UK domiciliary care agencies. Manage scheduling, care logging, eMAR, GPS tracking, compliance and your entire team from one system. CIW and CQC compliant.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/demo" className="px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                Get Started
              </Link>
              <Link href="/pricing" className="px-8 py-3.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                View Pricing
              </Link>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll delay={200}>
            <div className="mt-12 max-w-4xl mx-auto" style={{ perspective: "1200px" }}>
              <div style={{ transform: "rotateX(2deg) rotateY(-1deg)" }}>
                <BrowserMockup title="app.carecallai.co.uk — Dashboard">
                  <DashboardScreen />
                </BrowserMockup>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Why domiciliary care agencies choose CareCallAI */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">
              Why Domiciliary Care Agencies Choose CareCallAI
            </h2>
            <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
              Replace spreadsheets, paper MAR charts and disconnected tools with one powerful platform designed specifically for home care.
            </p>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <AnimateOnScroll key={f.title} delay={i * 50}>
                <Link href={f.href} className="block p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all group h-full">
                  <f.icon className="w-8 h-8 text-teal-600 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600">{f.desc}</p>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* See It In Action — alternating mockups */}
      <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">
              See It In Action
            </h2>
            <p className="text-slate-600 text-center max-w-2xl mx-auto mb-14">
              Every screen built for care professionals. Here&apos;s what your team will use every day.
            </p>
          </AnimateOnScroll>

          {/* Row 1: Rota / Scheduling — phone left, text right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-20">
            <AnimateOnScroll>
              <div className="flex justify-center">
                <PhoneMockup title="Today's Visits">
                  <PhoneScreenRota />
                </PhoneMockup>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100}>
              <div>
                <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Scheduling & Rota</span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-4">
                  Your team&apos;s schedule, always in their pocket
                </h3>
                <p className="text-slate-600 mb-4">
                  Carers see their daily visits, client details and GPS check-in status on their phone. Managers build rotas with drag-and-drop, shift patterns and multi-area support.
                </p>
                <ul className="space-y-2">
                  {["Live visit status — completed, in-progress, pending", "GPS check-in with location verification", "Automatic shift pattern deployment", "Staff can claim available shifts"].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Row 2: Care Logging — text left, phone right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-20">
            <AnimateOnScroll className="order-2 md:order-1">
              <div>
                <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Digital Care Logging</span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-4">
                  Real-time care notes with GPS evidence
                </h3>
                <p className="text-slate-600 mb-4">
                  Carers log care tasks, notes and observations from their phone. Every entry is timestamped, GPS-verified and instantly visible to managers — no more chasing paper logs.
                </p>
                <ul className="space-y-2">
                  {["Task checklists with one-tap completion", "GPS-verified check-in and check-out times", "Photo evidence and mood tracking", "Managers see logs in real-time"].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100} className="order-1 md:order-2">
              <div className="flex justify-center">
                <PhoneMockup title="Care Log">
                  <PhoneScreenCareLog />
                </PhoneMockup>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Row 3: eMAR — phone left, text right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-20">
            <AnimateOnScroll>
              <div className="flex justify-center">
                <PhoneMockup title="MAR Chart">
                  <PhoneScreenMAR />
                </PhoneMockup>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100}>
              <div>
                <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Electronic MAR Charts</span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-4">
                  Medication management that inspectors love
                </h3>
                <p className="text-slate-600 mb-4">
                  Full eMAR with PRN support, refused/destroyed tracking and complete audit trails. Carers record medication on their phone. Managers get instant alerts for missed doses.
                </p>
                <ul className="space-y-2">
                  {["Given, refused, destroyed and PRN tracking", "Staff initials and timestamps on every entry", "Complete audit trail for CIW and CQC", "Missed dose alerts to managers"].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Row 4: GPS Check-In — text left, phone right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-20">
            <AnimateOnScroll className="order-2 md:order-1">
              <div>
                <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">GPS Tracking & Check-In</span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-4">
                  Know exactly where your team is
                </h3>
                <p className="text-slate-600 mb-4">
                  Carers check in at client addresses with one tap. GPS verifies they&apos;re at the right location. Managers see live positions, visit durations and automatic mileage calculations.
                </p>
                <ul className="space-y-2">
                  {["One-tap GPS check-in at client address", "Live staff location map for managers", "Automatic mileage and travel time tracking", "Visit duration recording for invoicing"].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100} className="order-1 md:order-2">
              <div className="flex justify-center">
                <PhoneMockup title="Check In">
                  <PhoneScreenCheckIn />
                </PhoneMockup>
              </div>
            </AnimateOnScroll>
          </div>

          {/* Row 5: Compliance — browser mockup full width */}
          <AnimateOnScroll>
            <div className="text-center mb-8">
              <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Compliance Management</span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 mb-4">
                Inspection-ready at the click of a button
              </h3>
              <p className="text-slate-600 max-w-2xl mx-auto">
                50+ automated checks across CIW and CQC regulations. Live compliance scoring, flagged issues and inspection-ready reports — no last-minute scrambling.
              </p>
            </div>
          </AnimateOnScroll>
          <AnimateOnScroll delay={100}>
            <div className="max-w-3xl mx-auto">
              <BrowserMockup title="app.carecallai.co.uk — Compliance">
                <ComplianceScreen />
              </BrowserMockup>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
              Built for the Way Domiciliary Care Actually Works
            </h2>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { title: "No per-user fees", desc: "Flat monthly pricing. Add unlimited carers without extra charges. Plans from £99/month." },
              { title: "Up to 50% cheaper", desc: "CareCallAI costs significantly less than Birdie, CarePlanner and Log my Care — with more features included." },
              { title: "Welsh & English support", desc: "Built in Wales. The only platform with native CIW compliance alongside CQC. Welsh and English language support." },
              { title: "Go live in days, not months", desc: "Simple setup wizard, CSV data import, and a support team that will help you get started." },
              { title: "Clinical assessments built in", desc: "Waterlow, MUST, NEWS2, Falls Risk, Abbey Pain, Barthel Index and SALT — all included at no extra cost." },
              { title: "AI-powered documentation", desc: "AI assistant drafts care plans, risk assessments and compliance documentation. Save hours of admin time." },
            ].map((b, i) => (
              <AnimateOnScroll key={b.title} delay={i * 50}>
                <div className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{b.title}</h3>
                    <p className="text-sm text-slate-600">{b.desc}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Domiciliary Care Software FAQ
            </h2>
          </AnimateOnScroll>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <AnimateOnScroll key={i} delay={i * 50}>
                <div className="border border-slate-200 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                  <p className="text-sm text-slate-600">{faq.answer}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}

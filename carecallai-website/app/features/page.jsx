import Link from "next/link";
import {
  Calendar,
  ClipboardList,
  Pill,
  Users,
  ShieldCheck,
  Receipt,
  Smartphone,
  Bot,
  MapPin,
  ArrowRight,
} from "lucide-react";
import FeatureCard from "@/components/FeatureCard";
import CTABanner from "@/components/CTABanner";
import BetaPromo from "@/components/BetaPromo";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Home Care Software Features — Scheduling, eMAR, GPS & More",
  description:
    "Explore all CareCallAI features: scheduling, care logging, MAR charts, staff management, compliance, invoicing, mobile app and AI assistant.",
  keywords: [
    "care software features",
    "home care management features",
    "domiciliary care software features",
  ],
  alternates: { canonical: "https://www.carecallai.co.uk/features" },
  openGraph: {
    title: "Features — CareCallAI",
    description: "Scheduling, care logging, MAR charts, compliance, invoicing, mobile app & AI — all in one platform from £99/mo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features — CareCallAI",
    description: "Scheduling, care logging, MAR charts, compliance, invoicing, mobile app & AI — all in one platform from £99/mo.",
  },
};

const allFeatures = [
  {
    icon: Calendar,
    title: "Scheduling & Rota",
    description:
      "Multi-area rota management with shift patterns, base templates, drag-and-drop scheduling, one-off calls and deploy-in-one-click functionality.",
    href: "/features/scheduling",
  },
  {
    icon: ClipboardList,
    title: "Care Logging",
    description:
      "Digital care logs with real-time timestamps, medication prompts, evidence capture and full audit trail. Replaces paper-based daily notes.",
    href: "/features/care-logging",
  },
  {
    icon: Pill,
    title: "Medication / MAR Charts",
    description:
      "Electronic MAR charts with PRN, pill pouch, refused and destroyed tracking. Dose, frequency and time-of-day visibility. Full audit trail.",
    href: "/features/medication-management",
  },
  {
    icon: MapPin,
    title: "GPS Check-In & Tracking",
    description:
      "GPS-verified check-in and check-out, QR code scanning, live staff tracking on a real-time map and automatic mileage logging for fuel expense claims.",
    href: "/features/gps-tracking",
  },
  {
    icon: Users,
    title: "Staff Management",
    description:
      "Leave requests with approval workflow, training tracking with expiry alerts, DBS monitoring, expenses, emergency contacts and staff profiles.",
    href: "/features/staff-management",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Auditing",
    description:
      "Built for CIW and CQC. Incident reporting, risk assessments, care plan management, automatic audit trails and inspection-ready reports.",
    href: "/features/compliance",
  },
  {
    icon: Receipt,
    title: "Invoicing & Payroll",
    description:
      "Bill councils and private clients from logged visits, calculate staff payroll from shifts, and sync to QuickBooks, Sage or Xero automatically.",
    href: "/features/invoicing-payroll",
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description:
      "Native iOS and Android app for care workers. View rota, log care visits, complete MAR charts, report incidents and receive push notifications.",
    href: "/features/mobile-app",
  },
  {
    icon: Bot,
    title: "AI Assistant",
    description:
      "AI-powered care assistant that helps with care plan drafting, risk assessments, communication logs and compliance documentation.",
    href: "/features/ai-assistant",
  },
];

const faqs = [
  { question: "What features does CareCallAI include?", answer: "CareCallAI includes 9 core modules: scheduling & rota, care logging, electronic MAR charts, GPS check-in & tracking, staff management, compliance & auditing (CIW + CQC), invoicing & payroll, mobile app, and an AI assistant. Every feature is included in all plans with no add-on fees." },
  { question: "Is there a mobile app for carers?", answer: "Yes. CareCallAI has native iOS and Android apps. Carers can view their rota, log care notes, complete MAR charts, check in/out of visits with GPS, and report incidents — all from their phone." },
  { question: "Does CareCallAI include clinical assessments?", answer: "Yes. CareCallAI includes 7 clinical assessments: Waterlow (pressure ulcer risk), MUST (malnutrition), NEWS2 (early warning), Falls Risk, Abbey Pain Scale, Barthel Index (independence) and SALT (swallowing). Scores are calculated automatically." },
  { question: "Can I manage multiple care areas?", answer: "Yes. CareCallAI supports unlimited rota areas (e.g. Denbigh, Llangollen, North, South). Each area has its own shift types, call types, base templates and assigned staff." },
  { question: "Is CareCallAI compliant with CIW and CQC?", answer: "Yes. CareCallAI has dedicated CIW and CQC compliance modules with pre-populated regulation forms, 50+ automated inspection checks, RISCA Reg 36 supervision tracking, and inspection-ready reports." },
  { question: "How much does CareCallAI cost?", answer: "Plans start from £99/month with no per-user fees. Every plan includes all features. A full demo is available so you can see everything before subscribing." },
];

export default function FeaturesPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Features" },
        ]}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-16">
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
                Home Care Management Software Features
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                From scheduling to compliance, CareCallAI replaces spreadsheets, paper forms and
                disconnected tools with one powerful platform.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {allFeatures.map((feature, i) => (
              <AnimateOnScroll key={feature.href} delay={i * 80}>
                <Link href={feature.href} className="block group">
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 h-full flex gap-4">
                    <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-teal-200 transition-colors">
                      <feature.icon className="w-7 h-7 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                        {feature.title}
                        <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Link>
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
              Care Software Features FAQ
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

      <FAQJsonLd items={faqs} />
      <BetaPromo />
      <CTABanner />
    </>
  );
}

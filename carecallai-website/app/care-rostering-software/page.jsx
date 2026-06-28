import Link from "next/link";
import { Calendar, Users, Clock, MapPin, Smartphone, ArrowRight, CheckCircle, Repeat, LayoutGrid } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd, FAQJsonLd, SoftwareApplicationJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Care Rostering Software — Staff Rota Management",
  description:
    "Care rostering software for UK domiciliary care and care home agencies. Multi-area rotas, shift patterns, drag-and-drop scheduling, mobile app access. From £99/month.",
  keywords: [
    "care rostering software",
    "care staff rota software",
    "care staff scheduling software",
    "home care rostering",
    "care rota management software",
    "staff rostering software care",
  ],
  alternates: { canonical: "https://www.carecallai.co.uk/care-rostering-software" },
  openGraph: {
    title: "Care Rostering Software — CareCallAI",
    description: "Multi-area care rostering and staff scheduling software. Shift patterns, templates, mobile access.",
  },
};

const capabilities = [
  { icon: LayoutGrid, title: "Multi-Area Rotas", desc: "Manage separate rotas for different geographic areas. Each area has its own shift types, call types and staff." },
  { icon: Repeat, title: "Shift Patterns", desc: "Create reusable patterns (e.g. 2 weeks on, 1 off). Auto-generate rotas from patterns with one click." },
  { icon: Calendar, title: "Base Templates", desc: "Save your ideal week as a template. Deploy it across any date range instantly. Edit exceptions as needed." },
  { icon: Clock, title: "One-Off Calls", desc: "Add single impromptu visits without affecting the recurring schedule. Perfect for hospital discharges and emergency cover." },
  { icon: MapPin, title: "GPS Check-In/Out", desc: "Carers clock in and out with GPS verification. Know exactly when visits start and end." },
  { icon: Smartphone, title: "Mobile Rota Access", desc: "Carers see their schedule on the CareCallAI app. Push notifications for any changes or new assignments." },
];

const faqs = [
  { question: "What is care rostering software?", answer: "Care rostering software is a digital tool that helps care agencies create, manage and publish staff rotas. It automates shift allocation, handles multi-area scheduling, supports recurring patterns, and gives carers mobile access to their schedule. It replaces paper rotas and spreadsheets." },
  { question: "Can I manage rotas for multiple areas?", answer: "Yes. CareCallAI supports unlimited rota areas (e.g. North, South, Denbigh, Llangollen). Each area has its own shift types, call types, base templates and assigned staff. Changes in one area never affect another." },
  { question: "How do shift patterns work?", answer: "You create a pattern template (e.g. Week 1: Mon-Fri mornings, Week 2: Tue-Sat evenings) and assign it to a staff member. CareCallAI auto-generates the rota from that pattern for any date range. You can then fine-tune individual shifts." },
  { question: "Can carers see their rota on their phone?", answer: "Yes. Carers download the CareCallAI app (iOS & Android) and see their shifts, client details and any changes in real-time. They receive push notifications when their rota is updated." },
  { question: "Does it handle overnight and split shifts?", answer: "Yes. Shifts can span midnight (e.g. 22:00-06:00) and are displayed correctly. You can also create split shifts (e.g. 07:00-12:00 and 17:00-21:00) as separate entries on the same day." },
];

export default function CareRosteringSoftwarePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Care Rostering Software" }]} />
      <SoftwareApplicationJsonLd />
      <FAQJsonLd items={faqs} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-4">Staff Scheduling Made Easy</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6">
              Care Rostering Software
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
              Build multi-area rotas in minutes, not hours. Shift patterns, base templates, drag-and-drop scheduling and mobile app access for carers. Part of the CareCallAI all-in-one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/demo" className="px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                Get Started
              </Link>
              <Link href="/features/scheduling" className="px-8 py-3.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                See Full Scheduling Features
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
              Rostering Features Built for Care
            </h2>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((c, i) => (
              <AnimateOnScroll key={c.title} delay={i * 50}>
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 h-full">
                  <c.icon className="w-8 h-8 text-teal-600 mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-2">{c.title}</h3>
                  <p className="text-sm text-slate-600">{c.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
              How Care Rostering Works in CareCallAI
            </h2>
          </AnimateOnScroll>
          <div className="space-y-8">
            {[
              { step: "1", title: "Set up your rota areas", desc: "Create geographic areas (e.g. Denbigh, Llangollen). Define shift types and call types for each area. Assign staff to their areas." },
              { step: "2", title: "Build shift patterns or templates", desc: "Create recurring patterns for regular staff or build an ideal week template. CareCallAI generates the rota automatically from your setup." },
              { step: "3", title: "Review, adjust and publish", desc: "Fine-tune the generated rota with drag-and-drop. Add one-off calls for new clients. Publish — carers see their schedule instantly on the app." },
            ].map((s, i) => (
              <AnimateOnScroll key={i} delay={i * 100}>
                <div className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                    <p className="text-sm text-slate-600">{s.desc}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* More than rostering */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              More Than Just Rostering
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-8">
              CareCallAI rostering is part of a complete care management platform. Every plan also includes care logging, eMAR, compliance, invoicing, GPS tracking, family portal and AI assistant.
            </p>
            <Link href="/features" className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:underline">
              See all features <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Care Rostering Software FAQ
            </h2>
          </AnimateOnScroll>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <AnimateOnScroll key={i} delay={i * 50}>
                <div className="border border-slate-200 rounded-xl p-6 bg-white">
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

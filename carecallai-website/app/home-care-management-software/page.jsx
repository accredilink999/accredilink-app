import Link from "next/link";
import { BarChart3, Calendar, ClipboardList, Pill, ShieldCheck, Smartphone, MapPin, Users, Bot, Receipt, ArrowRight, CheckCircle, Star } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd, FAQJsonLd, SoftwareApplicationJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Home Care Management Software — UK's All-in-One Platform",
  description:
    "Home care management software for UK care agencies. Scheduling, care logging, eMAR, staff management, GPS tracking, CIW & CQC compliance, invoicing and mobile app. From £99/month.",
  keywords: [
    "home care management software",
    "home care management software UK",
    "home care software",
    "care management system",
    "home care agency management software",
  ],
  alternates: { canonical: "https://carecallai.co.uk/home-care-management-software" },
  openGraph: {
    title: "Home Care Management Software — CareCallAI",
    description: "UK's all-in-one home care management software. Every feature your care agency needs from £99/month.",
  },
};

const modules = [
  { icon: Calendar, title: "Scheduling & Rota", desc: "Multi-area rotas, shift patterns, base templates, drag-and-drop." },
  { icon: ClipboardList, title: "Care Logging", desc: "Digital care notes with timestamps, evidence and GPS." },
  { icon: Pill, title: "eMAR Charts", desc: "Electronic MAR with PRN, refused/destroyed tracking, full audit." },
  { icon: MapPin, title: "GPS Tracking", desc: "Check-in/out verification, live tracking, mileage calculation." },
  { icon: Users, title: "Staff Management", desc: "DBS alerts, training matrix, leave, expenses, supervisions." },
  { icon: ShieldCheck, title: "Compliance", desc: "CIW & CQC modules, 50+ automated checks, inspection reports." },
  { icon: Receipt, title: "Invoicing & Payroll", desc: "Invoice councils and private clients. QuickBooks, Sage, Xero." },
  { icon: Smartphone, title: "Mobile App", desc: "Native iOS & Android for carers. Rota, logs, MAR on the go." },
  { icon: Bot, title: "AI Assistant", desc: "AI-drafted care plans, risk assessments and documentation." },
  { icon: BarChart3, title: "Dashboards & Reports", desc: "KPIs, compliance scores, visit stats, staff performance." },
];

const faqs = [
  { question: "What is home care management software?", answer: "Home care management software is a digital platform that centralises all the operations of a domiciliary care agency — from scheduling staff rotas and logging care visits, to managing medications, tracking compliance, invoicing and communicating with families. It replaces paper records, spreadsheets and multiple disconnected systems with a single solution." },
  { question: "How much does CareCallAI cost?", answer: "CareCallAI plans start from £99/month with no per-user fees. Every plan includes all features — scheduling, care logging, eMAR, compliance, mobile app, GPS tracking and more. There is a 30-day free trial with no card required." },
  { question: "Can I switch from another provider?", answer: "Yes. CareCallAI supports CSV data import for clients, staff and care plans. Our support team will help you migrate. Most agencies are fully switched over within a week." },
  { question: "Is it suitable for agencies of all sizes?", answer: "Yes. CareCallAI scales from single-person agencies to large multi-branch operations. The same platform works whether you have 5 carers or 500." },
  { question: "Does it include CIW and CQC compliance?", answer: "Yes. CareCallAI is the only platform with dedicated CIW (Wales) and CQC (England) compliance modules. Pre-populated regulation forms, automated inspection checks, RISCA Reg 36 supervision tracking and inspection-ready reports are all included." },
];

export default function HomeCareManagementSoftwarePage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Home Care Management Software" }]} />
      <SoftwareApplicationJsonLd />
      <FAQJsonLd items={faqs} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-4">All-in-One Platform</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6">
              Home Care Management Software
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-4">
              Everything your home care agency needs in one platform. Scheduling, care logging, eMAR, compliance, invoicing, mobile app and AI — from £99/month with no per-user fees.
            </p>
            <div className="flex items-center justify-center gap-1 mb-8">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="w-5 h-5 text-amber-400 fill-amber-400" />
              ))}
              <span className="ml-2 text-sm text-slate-600">Rated 4.8/5 by UK care agencies</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/demo" className="px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                Start Free Trial
              </Link>
              <Link href="/pricing" className="px-8 py-3.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                View Pricing — From £99/mo
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Modules */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">
              10 Modules. One Platform. One Price.
            </h2>
            <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
              No add-ons, no per-user fees, no hidden costs. Every CareCallAI plan includes all 10 modules.
            </p>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {modules.map((m, i) => (
              <AnimateOnScroll key={m.title} delay={i * 30}>
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 text-center h-full">
                  <m.icon className="w-7 h-7 text-teal-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{m.title}</h3>
                  <p className="text-xs text-slate-600">{m.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">
              How CareCallAI Compares
            </h2>
            <p className="text-slate-600 text-center max-w-2xl mx-auto mb-8">
              More features, lower price, built-in CIW and CQC compliance.
            </p>
          </AnimateOnScroll>
          <AnimateOnScroll>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-teal-600 text-white">
                    <th className="text-left p-3 rounded-tl-lg">Feature</th>
                    <th className="p-3">CareCallAI</th>
                    <th className="p-3">Typical Competitor</th>
                    <th className="p-3 rounded-tr-lg">Basic Tools</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Scheduling & Rota", true, true, true],
                    ["Digital Care Logging", true, true, true],
                    ["eMAR Charts", true, true, false],
                    ["GPS Check-In", true, true, false],
                    ["CIW Compliance Module", true, false, false],
                    ["CQC Compliance Module", true, "Partial", false],
                    ["Clinical Assessments (NEWS2, Waterlow)", true, false, false],
                    ["AI Care Plan Drafting", true, false, false],
                    ["Invoicing & Payroll", true, "Add-on", false],
                    ["Family Portal", true, "Add-on", false],
                    ["No Per-User Fees", true, false, true],
                    ["Price from", "£99/mo", "£200+/mo", "£50/mo"],
                  ].map(([feature, us, comp, basic], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="p-3 font-medium text-slate-900">{feature}</td>
                      <td className="p-3 text-center">{us === true ? <CheckCircle className="w-5 h-5 text-teal-500 mx-auto" /> : <span className="text-teal-600 font-semibold">{us}</span>}</td>
                      <td className="p-3 text-center">{comp === true ? <CheckCircle className="w-5 h-5 text-slate-400 mx-auto" /> : comp === false ? <span className="text-slate-300">—</span> : <span className="text-slate-500 text-xs">{comp}</span>}</td>
                      <td className="p-3 text-center">{basic === true ? <CheckCircle className="w-5 h-5 text-slate-400 mx-auto" /> : basic === false ? <span className="text-slate-300">—</span> : <span className="text-slate-500 text-xs">{basic}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AnimateOnScroll>
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            {[
              { href: "/comparisons/vs-birdie", label: "vs Birdie" },
              { href: "/comparisons/vs-careplanner", label: "vs CarePlanner" },
              { href: "/comparisons/vs-connecteam", label: "vs Connecteam" },
              { href: "/comparisons/vs-log-my-care", label: "vs Log my Care" },
            ].map(c => (
              <Link key={c.href} href={c.href} className="text-sm text-teal-600 hover:underline font-medium">
                Compare {c.label} →
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Home Care Management Software FAQ
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

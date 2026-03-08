import Link from "next/link";
import { ClipboardList, Bot, ShieldCheck, Stethoscope, FileText, Users, ArrowRight, CheckCircle } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd, FAQJsonLd, SoftwareApplicationJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Digital Care Planning Software — AI-Powered",
  description:
    "Digital care planning software with AI-powered care plan drafting, clinical assessments, risk assessments and real-time care logging. CIW & CQC compliant. Built for UK care agencies.",
  keywords: [
    "digital care planning software",
    "care planning software UK",
    "electronic care plans",
    "digital care records",
    "AI care plan software",
    "care plan management system",
  ],
  alternates: { canonical: "https://carecallai.co.uk/digital-care-planning" },
  openGraph: {
    title: "Digital Care Planning Software — CareCallAI",
    description: "AI-powered digital care planning with clinical assessments. Built for UK care agencies.",
  },
};

const features = [
  { icon: Bot, title: "AI Care Plan Drafting", desc: "CareCallAI's AI assistant generates person-centred care plans from assessment data. Review, edit and approve — cutting hours of admin to minutes." },
  { icon: ClipboardList, title: "Real-Time Care Logging", desc: "Carers record care notes digitally during each visit. Timestamped, GPS-verified, with photo evidence. Managers see updates live." },
  { icon: Stethoscope, title: "Clinical Assessments", desc: "Built-in Waterlow, MUST, NEWS2, Falls Risk, Abbey Pain Scale, Barthel Index and SALT assessments. Scores calculated automatically." },
  { icon: ShieldCheck, title: "Risk Assessments", desc: "Digital risk assessments linked to care plans. AI-assisted drafting with compliance-ready formatting for CIW and CQC inspections." },
  { icon: FileText, title: "Compliance Documentation", desc: "Every care record is audit-ready. Pre-populated regulation forms, automated inspection checks and exportable reports." },
  { icon: Users, title: "Family Visibility", desc: "Families view care logs, medication records and assessment results through the family portal. Builds trust and transparency." },
];

const faqs = [
  { question: "What is digital care planning software?", answer: "Digital care planning software replaces paper-based care plans with electronic records. It allows care agencies to create, update and share care plans digitally, with real-time access for carers, managers and families. Modern platforms like CareCallAI add AI drafting, clinical assessments and compliance tracking." },
  { question: "How does AI care plan drafting work?", answer: "CareCallAI's AI assistant takes information from assessments, client profiles and care notes, then generates a structured, person-centred care plan draft. The manager reviews and edits the draft before approving it. This reduces care plan creation time from hours to minutes." },
  { question: "What clinical assessments are included?", answer: "CareCallAI includes 7 clinical assessments: Waterlow (pressure ulcer risk), MUST (malnutrition), NEWS2 (early warning), Falls Risk, Abbey Pain Scale, Barthel Index (independence) and SALT (swallowing). Scores are calculated automatically and tracked over time." },
  { question: "Are digital care plans accepted by CIW and CQC?", answer: "Yes. Both CIW and CQC accept and encourage digital care records. CareCallAI's care plans are formatted to meet regulatory requirements, with full audit trails showing when records were created, updated and by whom." },
  { question: "Can carers update care plans on their phone?", answer: "Carers can log care notes and complete assessments on the mobile app during visits. Care plan changes are managed by senior carers or managers through the web dashboard to maintain clinical governance." },
];

export default function DigitalCarePlanningPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Digital Care Planning" }]} />
      <SoftwareApplicationJsonLd />
      <FAQJsonLd items={faqs} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <p className="text-sm font-semibold text-teal-600 uppercase tracking-wider mb-4">AI-Powered Care Planning</p>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6">
              Digital Care Planning Software
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
              Create person-centred care plans in minutes with AI assistance. Built-in clinical assessments, real-time care logging and compliance-ready documentation for CIW and CQC.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/demo" className="px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                Start Free Trial
              </Link>
              <Link href="/features/ai-assistant" className="px-8 py-3.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                See AI Features
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
              Digital Care Planning Features
            </h2>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <AnimateOnScroll key={f.title} delay={i * 50}>
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 h-full">
                  <f.icon className="w-8 h-8 text-teal-600 mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600">{f.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Why Go Digital with Care Planning?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { stat: "80%", label: "Less time writing care plans with AI drafting" },
              { stat: "100%", label: "Audit trail on every record for inspections" },
              { stat: "7", label: "Clinical assessments built in at no extra cost" },
              { stat: "24/7", label: "Real-time access for managers and families" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl font-bold mb-1">{s.stat}</p>
                <p className="text-sm text-teal-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Digital Care Planning FAQ
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

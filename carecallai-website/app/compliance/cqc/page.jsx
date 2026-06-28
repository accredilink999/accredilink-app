import Link from "next/link";
import { ShieldCheck, Check, Heart, Zap, Users, Eye, HandHeart } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import CTABanner from "@/components/CTABanner";
import BetaPromo from "@/components/BetaPromo";
import FAQ from "@/components/FAQ";
import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "CQC Compliance — Care Quality Commission",
  description:
    "How CareCallAI meets CQC requirements across all five key lines of enquiry. Safe, Effective, Caring, Responsive, Well-led.",
  keywords: ["CQC compliant care software", "Care Quality Commission software", "CQC key lines of enquiry software"],
  alternates: { canonical: "https://www.carecallai.co.uk/compliance/cqc" },
  openGraph: {
    title: "CQC Compliance — CareCallAI",
    description: "Covers all five CQC key lines of enquiry: Safe, Effective, Caring, Responsive, Well-led. Built-in compliance from £99/mo.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CQC Compliance — CareCallAI",
    description: "Covers all five CQC key lines of enquiry: Safe, Effective, Caring, Responsive, Well-led. Built-in compliance from £99/mo.",
  },
};

const kloes = [
  {
    icon: ShieldCheck,
    title: "Safe",
    description: "Is the service safe?",
    points: [
      "Incident and accident reporting with real-time manager notifications",
      "Medication management with complete MAR chart audit trail",
      "Staff training and DBS monitoring with expiry alerts",
      "Risk assessments with review date tracking",
    ],
  },
  {
    icon: Zap,
    title: "Effective",
    description: "Is the service effective?",
    points: [
      "Person-centred care plans with regular review scheduling",
      "Care logs capturing outcomes and observations",
      "Staff training tracking ensures competency",
      "Multi-disciplinary communication logging",
    ],
  },
  {
    icon: Heart,
    title: "Caring",
    description: "Is the service caring?",
    points: [
      "Detailed care logs showing personalised care delivery",
      "Communication records with families and advocates",
      "Mood and wellbeing tracking per visit",
      "Client preferences recorded in care plans",
    ],
  },
  {
    icon: Eye,
    title: "Responsive",
    description: "Is the service responsive to people's needs?",
    points: [
      "Real-time schedule changes and one-off call support",
      "Incident follow-up tracking and action plans",
      "Care plan amendments with version history",
      "Complaints and feedback recording",
    ],
  },
  {
    icon: HandHeart,
    title: "Well-led",
    description: "Is the service well-led?",
    points: [
      "Management dashboard with real-time visibility",
      "Compliance reports for governance meetings",
      "Staff supervision and appraisal tracking",
      "Quality monitoring across all service areas",
    ],
  },
];

const faqs = [
  {
    question: "Does CareCallAI cover all five CQC key lines of enquiry?",
    answer: "Yes. CareCallAI provides features that directly support evidence for all five KLOEs: Safe, Effective, Caring, Responsive and Well-led.",
  },
  {
    question: "Can I generate reports for CQC inspections?",
    answer: "Yes. You can generate detailed reports per client, per carer or across the whole service. Reports include care logs, medication records, incidents, training records and more.",
  },
  {
    question: "How does CareCallAI help with the 'Safe' KLOE?",
    answer: "Through incident reporting, medication management (MAR charts), staff training tracking, DBS monitoring and risk assessments — all with immutable audit trails.",
  },
  {
    question: "Is CareCallAI suitable for domiciliary care registered with CQC?",
    answer: "Yes. CareCallAI is specifically designed for domiciliary care agencies. All features are built around the requirements of community-based care delivery.",
  },
];

export default function CQCCompliancePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Compliance", href: "/compliance/cqc" },
          { name: "CQC", href: "/compliance/cqc" },
        ]}
      />
      <FAQJsonLd items={faqs} />

      {/* Visible breadcrumb */}
      <nav className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-slate-500">
          <li><Link href="/" className="hover:text-teal-600 transition-colors">Home</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><span className="text-slate-400">Compliance</span></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-slate-900 font-medium">CQC</li>
        </ol>
      </nav>

      <section className="py-12 sm:py-20 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4" />
              Care Quality Commission
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
              CQC Compliant Care Software
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              CareCallAI supports all five CQC key lines of enquiry, helping your domiciliary care
              agency demonstrate outstanding care delivery at every inspection.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/compliance/ciw"
                className="px-8 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                See CIW Compliance
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-4">
              The Five Key Lines of Enquiry
            </h2>
            <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
              CQC assesses care services against five key questions. Here&apos;s how CareCallAI helps you
              evidence excellence in each area.
            </p>
          </AnimateOnScroll>
          <div className="space-y-6">
            {kloes.map((kloe, i) => (
              <AnimateOnScroll key={i} delay={i * 80}>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <kloe.icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-lg">{kloe.title}</h3>
                      <p className="text-sm text-teal-600 mb-3">{kloe.description}</p>
                      <ul className="space-y-2">
                        {kloe.points.map((point, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-slate-700">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
              CQC Compliance FAQ
            </h2>
          </AnimateOnScroll>
          <FAQ items={faqs} />
        </div>
      </section>

      <BetaPromo />
      <CTABanner
        title="Prepare for your next CQC inspection with confidence"
        subtitle="Get started today and see how CareCallAI makes compliance effortless."
      />
    </>
  );
}

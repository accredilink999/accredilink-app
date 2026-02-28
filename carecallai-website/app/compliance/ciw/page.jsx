import Link from "next/link";
import { ShieldCheck, Check, FileText, AlertTriangle, Users, Pill, ClipboardList } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import CTABanner from "@/components/CTABanner";
import BetaPromo from "@/components/BetaPromo";
import FAQ from "@/components/FAQ";
import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "CIW Compliance — Care Inspectorate Wales",
  description:
    "How CareCallAI meets CIW (Care Inspectorate Wales) requirements for domiciliary care agencies. Automated audit trails, care logging, medication records and incident reporting.",
  keywords: ["CIW compliant care software", "Care Inspectorate Wales software", "CIW domiciliary care requirements"],
};

const requirements = [
  {
    icon: ClipboardList,
    title: "Care & Support Records",
    requirement: "CIW requires comprehensive daily records of care provided to each individual.",
    solution: "CareCallAI's digital care logs record every visit with timestamps, tasks completed, observations and carer signatures — all instantly accessible.",
  },
  {
    icon: Pill,
    title: "Medication Records",
    requirement: "Accurate MAR charts showing all medication administration, refusals and errors.",
    solution: "Electronic MAR charts with Given/Refused/Destroyed tracking, PRN support, dose/frequency visibility and complete audit trail.",
  },
  {
    icon: AlertTriangle,
    title: "Incident Reporting",
    requirement: "All incidents, accidents and near-misses must be recorded and reported promptly.",
    solution: "Staff report incidents immediately from the mobile app. Managers are notified in real time, and all reports are timestamped and immutable.",
  },
  {
    icon: Users,
    title: "Staff Records",
    requirement: "Training records, DBS checks and supervision logs must be maintained for all staff.",
    solution: "Staff profiles track training completion, DBS dates, qualifications and compliance. Auto-alerts for renewals and expiries.",
  },
  {
    icon: FileText,
    title: "Care Plans",
    requirement: "Person-centred care plans must be regularly reviewed and updated.",
    solution: "Digital care plans with risk assessments, file attachments, expandable text fields and review date tracking.",
  },
  {
    icon: ShieldCheck,
    title: "Audit Trail",
    requirement: "All records must be accurate, contemporaneous and available for inspection.",
    solution: "Every action in CareCallAI is automatically timestamped and attributed. Records are immutable — nothing can be deleted or back-dated.",
  },
];

const faqs = [
  {
    question: "Does CareCallAI meet all CIW requirements for domiciliary care?",
    answer: "Yes. CareCallAI covers all key CIW requirements including care & support records, medication management, incident reporting, staff training records, care plans and audit trails.",
  },
  {
    question: "Can CIW inspectors access our records during an inspection?",
    answer: "Yes. You can generate comprehensive reports and give inspectors read-only access to any client's records, care logs, MAR charts and incident reports during an inspection.",
  },
  {
    question: "How quickly can I produce records for an inspection?",
    answer: "Instantly. All records are searchable and filterable. You can pull up any client's complete history in seconds — no more searching through paper files.",
  },
  {
    question: "Is CareCallAI suitable for Welsh-language care?",
    answer: "CareCallAI supports bilingual documentation. Care plans, logs and reports can include Welsh-language content alongside English.",
  },
];

export default function CIWCompliancePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Compliance" },
          { name: "CIW Compliance" },
        ]}
      />
      <FAQJsonLd items={faqs} />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <ShieldCheck className="w-4 h-4" />
              Care Inspectorate Wales
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
              CIW Compliant Care Software
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              CareCallAI is built from the ground up to meet CIW requirements for domiciliary care
              agencies in Wales. Every feature supports your compliance obligations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/compliance/cqc"
                className="px-8 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                See CQC Compliance
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
              How CareCallAI Meets CIW Requirements
            </h2>
          </AnimateOnScroll>
          <div className="space-y-6">
            {requirements.map((req, i) => (
              <AnimateOnScroll key={i} delay={i * 80}>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <req.icon className="w-6 h-6 text-teal-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg mb-2">{req.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-1">CIW Requirement</p>
                          <p className="text-sm text-slate-600">{req.requirement}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-teal-600 uppercase mb-1">How CareCallAI Delivers</p>
                          <p className="text-sm text-slate-700">{req.solution}</p>
                        </div>
                      </div>
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
              CIW Compliance FAQ
            </h2>
          </AnimateOnScroll>
          <FAQ items={faqs} />
        </div>
      </section>

      <BetaPromo />
      <CTABanner
        title="Ready for your next CIW inspection?"
        subtitle="Start your free trial and see how CareCallAI makes compliance effortless."
      />
    </>
  );
}

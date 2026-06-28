import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import ComparisonTable from "@/components/ComparisonTable";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "CareCallAI vs Birdie",
  description:
    "Compare CareCallAI and Birdie for home care agencies. Similar features, significantly lower pricing, Welsh-built with CIW expertise.",
  keywords: ["birdie care software alternative", "birdie vs carecallai", "cheaper alternative to birdie care"],
  alternates: { canonical: "https://www.carecallai.co.uk/comparisons/vs-birdie" },
  openGraph: {
    title: "CareCallAI vs Birdie — Feature Comparison",
    description: "Same features, significantly lower pricing. See how CareCallAI compares to Birdie for UK home care agencies.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareCallAI vs Birdie — Feature Comparison",
    description: "Same features, significantly lower pricing. See how CareCallAI compares to Birdie for UK home care agencies.",
  },
};

const features = [
  { feature: "Digital care plans", carecall: true, competitor: true },
  { feature: "Electronic MAR charts", carecall: true, competitor: true },
  { feature: "Care logging", carecall: true, competitor: true },
  { feature: "Incident reporting", carecall: true, competitor: true },
  { feature: "Staff scheduling / rota", carecall: true, competitor: true },
  { feature: "Mobile app", carecall: true, competitor: true },
  { feature: "CQC compliance", carecall: true, competitor: true },
  { feature: "CIW compliance (Wales)", carecall: true, competitor: "Limited" },
  { feature: "Multi-area rota management", carecall: true, competitor: "Limited" },
  { feature: "Shift patterns & templates", carecall: true, competitor: false },
  { feature: "Invoicing & payroll", carecall: true, competitor: false },
  { feature: "AI assistant", carecall: true, competitor: false },
  { feature: "Push notifications", carecall: true, competitor: true },
  { feature: "Leave management", carecall: true, competitor: "Basic" },
  { feature: "Training tracking", carecall: true, competitor: true },
  { feature: "Starting price", carecall: "£99/mo", competitor: "~£200/mo" },
];

export default function VsBirdiePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Comparisons" },
          { name: "CareCallAI vs Birdie" },
        ]}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
              CareCallAI vs Birdie
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Birdie is a well-known care platform — but it starts from £200/month. CareCallAI
              delivers the same core features from just £99/month, with deeper Welsh compliance support.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <ComparisonTable competitor="Birdie" features={features} />
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Why choose CareCallAI over Birdie?</h2>
            <div className="space-y-4 text-slate-600">
              <p>
                Birdie is a strong platform used by many care agencies in England. However, its pricing (from around £200/month) puts it out of reach for smaller agencies.
              </p>
              <p>
                CareCallAI offers comparable core features — care logging, MAR charts, scheduling, incident reporting — starting from <strong className="text-teal-600">£99/month</strong>. For agencies in Wales, CareCallAI also provides deeper CIW compliance support, built by a team that understands Welsh care regulation.
              </p>
              <p>
                Additionally, CareCallAI includes invoicing and payroll features that Birdie doesn&apos;t offer, plus an AI assistant for care plan drafting.
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Explore features */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Explore CareCallAI Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Scheduling & Rota", href: "/features/scheduling" },
                { name: "Care Logging", href: "/features/care-logging" },
                { name: "Medication / MAR Charts", href: "/features/medication-management" },
                { name: "CIW & CQC Compliance", href: "/features/compliance" },
                { name: "AI Assistant", href: "/features/ai-assistant" },
                { name: "Invoicing & Payroll", href: "/features/invoicing-payroll" },
              ].map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="flex items-center gap-2 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow transition-all group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-teal-600">{f.name}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 ml-auto" />
                </Link>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <CTABanner title="Get Birdie-level features at a fraction of the cost" />
    </>
  );
}

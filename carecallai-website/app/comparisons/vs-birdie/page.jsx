import AnimateOnScroll from "@/components/AnimateOnScroll";
import ComparisonTable from "@/components/ComparisonTable";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "CareCallAI vs Birdie",
  description:
    "Compare CareCallAI and Birdie for home care agencies. Similar features, significantly lower pricing, Welsh-built with CIW expertise.",
  keywords: ["birdie care software alternative", "birdie vs carecallai", "cheaper alternative to birdie care"],
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
  { feature: "Starting price", carecall: "£49/mo", competitor: "~£200/mo" },
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
              delivers the same core features from just £49/month, with deeper Welsh compliance support.
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
                CareCallAI offers comparable core features — care logging, MAR charts, scheduling, incident reporting — starting from <strong className="text-teal-600">£49/month</strong>. For agencies in Wales, CareCallAI also provides deeper CIW compliance support, built by a team that understands Welsh care regulation.
              </p>
              <p>
                Additionally, CareCallAI includes invoicing and payroll features that Birdie doesn&apos;t offer, plus an AI assistant for care plan drafting.
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <CTABanner title="Get Birdie-level features at a fraction of the cost" />
    </>
  );
}

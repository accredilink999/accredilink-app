import Link from "next/link";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import ComparisonTable from "@/components/ComparisonTable";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "CareCallAI vs Connecteam",
  description:
    "Compare CareCallAI and Connecteam for home care agencies. Purpose-built care features, 40% lower cost, CIW & CQC compliance included.",
  keywords: ["connecteam alternative care", "connecteam vs care software", "better than connecteam for home care"],
};

const features = [
  { feature: "Built for UK home care", carecall: true, competitor: false },
  { feature: "CIW compliance", carecall: true, competitor: false },
  { feature: "CQC compliance", carecall: true, competitor: false },
  { feature: "Electronic MAR charts", carecall: true, competitor: false },
  { feature: "Care plan management", carecall: true, competitor: false },
  { feature: "Incident reporting", carecall: true, competitor: "Basic" },
  { feature: "Staff scheduling", carecall: true, competitor: true },
  { feature: "Mobile app", carecall: true, competitor: true },
  { feature: "GPS time tracking", carecall: true, competitor: true },
  { feature: "Push notifications", carecall: true, competitor: true },
  { feature: "Leave management", carecall: true, competitor: true },
  { feature: "Training tracking", carecall: true, competitor: true },
  { feature: "Invoicing", carecall: true, competitor: false },
  { feature: "Payroll calculations", carecall: true, competitor: false },
  { feature: "AI care assistant", carecall: true, competitor: false },
  { feature: "Price (30 users)", carecall: "From £99/mo", competitor: "From ~£140/mo" },
  { feature: "Care-specific support", carecall: true, competitor: false },
];

export default function VsConnecteamPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Comparisons" },
          { name: "CareCallAI vs Connecteam" },
        ]}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
              CareCallAI vs Connecteam
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Connecteam is a general workforce management tool. CareCallAI is purpose-built for UK
              home care agencies — with MAR charts, care logging, CIW/CQC compliance and 40% lower
              pricing.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <ComparisonTable competitor="Connecteam" features={features} />
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Why care agencies choose CareCallAI over Connecteam</h2>
            <div className="space-y-4 text-slate-600">
              <p>
                <strong className="text-slate-900">Connecteam</strong> is a solid general-purpose employee management platform used across many industries. However, it was not designed for the specific needs of UK domiciliary care.
              </p>
              <p>
                <strong className="text-slate-900">CareCallAI</strong> is built exclusively for home care agencies. It includes electronic MAR charts, digital care plans, incident reporting, CIW/CQC compliance features and care-specific invoicing — none of which Connecteam offers.
              </p>
              <p>
                Connecteam charges per &quot;hub&quot; (Operations, Communications, HR) at $29-99/hub/month for 30 users. To get equivalent functionality, you&apos;d need all three hubs — costing around £140/month. CareCallAI&apos;s Professional plan gives you everything for <strong className="text-teal-600">£99/month</strong> — 40% less.
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <CTABanner
        title="Ready to switch from Connecteam?"
        subtitle="Start your free 14-day trial and see the difference purpose-built care software makes."
      />
    </>
  );
}

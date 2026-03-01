import AnimateOnScroll from "@/components/AnimateOnScroll";
import ComparisonTable from "@/components/ComparisonTable";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "CareCallAI vs CarePlanner",
  description:
    "Compare CareCallAI and CarePlanner for home care agencies. More features, better mobile experience, competitive pricing.",
  keywords: ["careplanner alternative", "careplanner vs carecallai", "care planner software comparison"],
  openGraph: {
    title: "CareCallAI vs CarePlanner — Feature Comparison",
    description: "More features, better mobile experience, competitive pricing. See how CareCallAI compares to CarePlanner.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareCallAI vs CarePlanner — Feature Comparison",
    description: "More features, better mobile experience, competitive pricing. See how CareCallAI compares to CarePlanner.",
  },
};

const features = [
  { feature: "Staff scheduling / rota", carecall: true, competitor: true },
  { feature: "Care logging", carecall: true, competitor: true },
  { feature: "Electronic MAR charts", carecall: true, competitor: "Limited" },
  { feature: "Mobile app (native)", carecall: true, competitor: "Web-based" },
  { feature: "CIW compliance", carecall: true, competitor: true },
  { feature: "CQC compliance", carecall: true, competitor: true },
  { feature: "Incident reporting", carecall: true, competitor: true },
  { feature: "Push notifications", carecall: true, competitor: false },
  { feature: "AI assistant", carecall: true, competitor: false },
  { feature: "Invoicing", carecall: true, competitor: true },
  { feature: "Payroll calculations", carecall: true, competitor: "Basic" },
  { feature: "Multi-area management", carecall: true, competitor: true },
  { feature: "Leave management", carecall: true, competitor: "Basic" },
  { feature: "Training tracking", carecall: true, competitor: "Basic" },
  { feature: "Starting price", carecall: "£99/mo", competitor: "~£99/mo" },
];

export default function VsCarePlannerPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Comparisons" },
          { name: "CareCallAI vs CarePlanner" },
        ]}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
              CareCallAI vs CarePlanner
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              CarePlanner is a solid scheduling tool, but CareCallAI goes further with native mobile apps,
              electronic MAR charts, AI assistance and push notifications.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <ComparisonTable competitor="CarePlanner" features={features} />
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Why choose CareCallAI over CarePlanner?</h2>
            <div className="space-y-4 text-slate-600">
              <p>
                CarePlanner is a well-established care scheduling platform used across the UK. It offers strong rota management and basic care logging.
              </p>
              <p>
                CareCallAI extends beyond scheduling with full electronic MAR charts, native iOS and Android apps (not just web-based), push notifications for real-time alerts, and an AI assistant that helps draft care plans.
              </p>
              <p>
                At <strong className="text-teal-600">£99/month</strong> versus CarePlanner&apos;s ~£99/month starting price, CareCallAI delivers more features at a lower cost.
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <CTABanner title="More features, lower price. Try CareCallAI free." />
    </>
  );
}

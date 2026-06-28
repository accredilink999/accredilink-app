import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import ComparisonTable from "@/components/ComparisonTable";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "CareCallAI vs Log my Care",
  description:
    "Compare CareCallAI and Log my Care for home care agencies. More complete solution with scheduling, invoicing and AI features.",
  keywords: ["log my care alternative", "log my care vs carecallai", "free care software comparison UK"],
  alternates: { canonical: "https://www.carecallai.co.uk/comparisons/vs-log-my-care" },
  openGraph: {
    title: "CareCallAI vs Log my Care — Feature Comparison",
    description: "More complete solution with scheduling, invoicing and AI. See how CareCallAI compares to Log my Care.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareCallAI vs Log my Care — Feature Comparison",
    description: "More complete solution with scheduling, invoicing and AI. See how CareCallAI compares to Log my Care.",
  },
};

const features = [
  { feature: "Care logging", carecall: true, competitor: true },
  { feature: "Electronic MAR charts", carecall: true, competitor: true },
  { feature: "Care plans", carecall: true, competitor: true },
  { feature: "Incident reporting", carecall: true, competitor: true },
  { feature: "Staff scheduling / rota", carecall: true, competitor: "Basic" },
  { feature: "Multi-area management", carecall: true, competitor: false },
  { feature: "Shift patterns & templates", carecall: true, competitor: false },
  { feature: "Mobile app (native)", carecall: true, competitor: true },
  { feature: "Push notifications", carecall: true, competitor: "Limited" },
  { feature: "CIW compliance", carecall: true, competitor: true },
  { feature: "CQC compliance", carecall: true, competitor: true },
  { feature: "Invoicing", carecall: true, competitor: false },
  { feature: "Payroll calculations", carecall: true, competitor: false },
  { feature: "AI assistant", carecall: true, competitor: false },
  { feature: "Leave management", carecall: true, competitor: false },
  { feature: "Training tracking", carecall: true, competitor: "Basic" },
  { feature: "Free tier", carecall: "Demo available", competitor: "Up to 10 users" },
  { feature: "Starting paid price", carecall: "£99/mo", competitor: "Contact sales" },
];

export default function VsLogMyCarePage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Comparisons" },
          { name: "CareCallAI vs Log my Care" },
        ]}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
              CareCallAI vs Log my Care
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Log my Care offers a free tier for very small providers, but CareCallAI is the complete
              solution for growing agencies — with full scheduling, invoicing, payroll and AI.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <ComparisonTable competitor="Log my Care" features={features} />
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">When to choose CareCallAI over Log my Care</h2>
            <div className="space-y-4 text-slate-600">
              <p>
                Log my Care is a solid option for very small care providers — their free tier covers up to 10 users and includes basic care logging and MAR charts.
              </p>
              <p>
                However, once your agency grows beyond a handful of staff, you need more: proper rota management with shift patterns, multi-area scheduling, invoicing, payroll, push notifications and AI assistance. That&apos;s where CareCallAI steps in.
              </p>
              <p>
                CareCallAI&apos;s <strong className="text-teal-600">£99/month Starter plan</strong> covers up to 15 users and includes features that Log my Care doesn&apos;t offer at any tier — like automated shift patterns, base templates and integrated invoicing.
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
                { name: "Invoicing & Payroll", href: "/features/invoicing-payroll" },
                { name: "AI Assistant", href: "/features/ai-assistant" },
                { name: "Staff Management", href: "/features/staff-management" },
                { name: "Mobile App", href: "/features/mobile-app" },
                { name: "CIW & CQC Compliance", href: "/features/compliance" },
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

      <CTABanner title="Outgrown your current software? Try CareCallAI free." />
    </>
  );
}

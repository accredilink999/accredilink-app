import PricingTable from "@/components/PricingTable";
import FAQ from "@/components/FAQ";
import CTABanner from "@/components/CTABanner";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Pricing",
  description:
    "CareCallAI pricing plans from £49/month. 40% cheaper than Connecteam. Free 14-day trial. Plans for care agencies of every size.",
  keywords: [
    "care management software pricing",
    "home care software cost",
    "cheapest care software UK",
    "domiciliary care software pricing",
  ],
};

const faqs = [
  {
    question: "Is there a free trial?",
    answer: "Yes. Every plan comes with a free 14-day trial. No credit card required — just sign up and start using CareCallAI immediately.",
  },
  {
    question: "What happens after the trial?",
    answer: "At the end of your trial, you can choose a plan and add your payment details. If you decide not to continue, your account is simply paused — no charges, no hassle.",
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing period. If you upgrade mid-cycle, you'll be charged the pro-rated difference.",
  },
  {
    question: "How does annual billing work?",
    answer: "Annual billing gives you a 20% discount — effectively 2 months free. You pay upfront for 12 months at the discounted rate.",
  },
  {
    question: "What counts as a 'user'?",
    answer: "A user is anyone with login access to CareCallAI — carers, managers, coordinators, admins. Service users (clients) are not counted.",
  },
  {
    question: "Do you offer discounts for larger agencies?",
    answer: "Yes. If you have more than 150 staff, contact us for a custom Enterprise or Compliance+ quote. We'll build a package that fits your needs and budget.",
  },
];

export default function PricingPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Pricing" },
        ]}
      />
      <FAQJsonLd items={faqs} />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
                Simple, transparent pricing
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                40% cheaper than Connecteam. No hidden fees. Every plan includes a free 14-day trial.
              </p>
            </div>
          </AnimateOnScroll>
          <PricingTable />
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
              Pricing FAQ
            </h2>
          </AnimateOnScroll>
          <FAQ items={faqs} />
        </div>
      </section>

      <CTABanner
        title="Not sure which plan is right for you?"
        subtitle="Book a demo and we'll help you choose the best plan for your agency."
        primaryText="Book a Demo"
        primaryHref="/contact"
        secondaryText="Start Free Trial"
        secondaryHref="/demo"
      />
    </>
  );
}

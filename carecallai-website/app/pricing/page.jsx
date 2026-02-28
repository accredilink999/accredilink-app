import PricingTable from "@/components/PricingTable";
import FAQ from "@/components/FAQ";
import CTABanner from "@/components/CTABanner";
import BetaPromo from "@/components/BetaPromo";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Pricing",
  description:
    "CareCallAI pricing plans from £99/month. Up to 50% cheaper than competitors. 7-day free trial. Plans for care agencies of every size.",
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
    answer: "Yes. Every plan comes with a 7-day free trial. You'll need to add a card at signup, but you won't be charged until the trial ends. Cancel anytime within the 7 days — no charge.",
  },
  {
    question: "What happens after the trial?",
    answer: "If you don't cancel within the 7-day trial, your chosen plan will automatically start billing. If you cancel before the trial ends, you won't be charged at all.",
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing period. If you upgrade mid-cycle, you'll be charged the pro-rated difference.",
  },
  {
    question: "How does annual billing work?",
    answer: "Annual billing gives you 2 months free. You pay upfront for 12 months at the discounted rate.",
  },
  {
    question: "What counts as a 'staff member'?",
    answer: "A staff member is anyone with login access to CareCallAI — carers, managers, coordinators, admins. Service users (clients) are not counted towards your staff limit.",
  },
  {
    question: "Do you offer discounts for larger agencies?",
    answer: "Our Enterprise plan includes unlimited staff. If you have specific requirements, contact us and we'll build a package that fits your needs.",
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
                Up to 50% cheaper than leading competitors. No hidden fees. Every plan includes a 7-day free trial.
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

      <BetaPromo />
      <CTABanner
        title="Not sure which plan is right for you?"
        subtitle="Book a demo and we'll help you choose the best plan for your agency."
        primaryText="Book a Demo"
        primaryHref="/contact"
        secondaryText="Start Free Trial"
        secondaryHref="/signup"
      />
    </>
  );
}

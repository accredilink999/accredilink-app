import PricingTable from "@/components/PricingTable";
import FAQ from "@/components/FAQ";
import CTABanner from "@/components/CTABanner";
import BetaPromo from "@/components/BetaPromo";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { BreadcrumbJsonLd, FAQJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Care Management Software Pricing — Plans From £99/mo",
  description:
    "CareCallAI pricing plans from £99/month. Up to 50% cheaper than competitors. Everything included, no contract required. Plans for care agencies of every size.",
  keywords: [
    "care management software pricing",
    "home care software cost",
    "cheapest care software UK",
    "domiciliary care software pricing",
  ],
  alternates: { canonical: "https://www.carecallai.co.uk/pricing" },
  openGraph: {
    title: "Pricing — From £99/mo | CareCallAI",
    description: "Care management software from £99/mo. Up to 50% cheaper than competitors. Everything included, no contract required.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — From £99/mo | CareCallAI",
    description: "Care management software from £99/mo. Up to 50% cheaper than competitors. Everything included, no contract required.",
  },
};

const faqs = [
  {
    question: "Can I try before I subscribe?",
    answer: "We offer a full interactive demo so you can see every feature before subscribing. Subscribe for £99/month — everything included, unlimited staff.",
  },
  {
    question: "What happens after the trial?",
    answer: "After 30 days, you'll need to choose a plan to continue using CareCallAI. If you don't subscribe, your account will be paused until you pick a plan. No charges are ever made without your consent.",
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: "CareCallAI",
            description: "All-in-one home care management software for UK domiciliary care agencies.",
            brand: { "@type": "Brand", name: "CareCallAI" },
            url: "https://www.carecallai.co.uk/pricing",
            offers: [
              {
                "@type": "Offer",
                name: "Starter",
                price: "99",
                priceCurrency: "GBP",
                priceValidUntil: "2026-12-31",
                availability: "https://schema.org/InStock",
                url: "https://www.carecallai.co.uk/pricing",
                description: "Up to 15 staff members. All features included.",
              },
              {
                "@type": "Offer",
                name: "Professional",
                price: "179",
                priceCurrency: "GBP",
                priceValidUntil: "2026-12-31",
                availability: "https://schema.org/InStock",
                url: "https://www.carecallai.co.uk/pricing",
                description: "Up to 50 staff members. All features included.",
              },
              {
                "@type": "Offer",
                name: "Enterprise",
                price: "299",
                priceCurrency: "GBP",
                priceValidUntil: "2026-12-31",
                availability: "https://schema.org/InStock",
                url: "https://www.carecallai.co.uk/pricing",
                description: "Unlimited staff members. All features included. Priority support.",
              },
            ],
          }),
        }}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
                Care Management Software Pricing
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Up to 50% cheaper than leading competitors. No hidden fees. £99/month, everything included — no contract required.
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
        secondaryText="Get Started"
        secondaryHref="/signup"
      />
    </>
  );
}

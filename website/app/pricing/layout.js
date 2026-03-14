export const metadata = {
  title: "CareCall AI Pricing — Plans From £49/mo",
  description: "Care management software pricing for Welsh & English agencies. Starter £49/mo, Professional £99/mo, Enterprise custom. 14-day free trial, no card required.",
  alternates: {
    canonical: "https://accredilinkcare.co.uk/pricing",
  },
  openGraph: {
    title: "CareCall AI Pricing — Plans From £49/mo",
    description: "Care management software for CIW & CQC compliance. Plans from £49/mo with 14-day free trial.",
    url: "https://accredilinkcare.co.uk/pricing",
  },
};

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "CareCall AI — Care Management Software",
  description: "All-in-one care management software for domiciliary care agencies. Staff rotas, care plans, eMAR, GPS tracking, CIW/CQC compliance.",
  brand: { "@type": "Organization", name: "Accredilink Community Response Taskforce" },
  offers: [
    {
      "@type": "Offer",
      name: "Starter",
      price: "49",
      priceCurrency: "GBP",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "49",
        priceCurrency: "GBP",
        billingDuration: "P1M",
      },
      description: "For small domiciliary care providers. Up to 10 staff.",
      url: "https://accredilinkcare.co.uk/pricing",
    },
    {
      "@type": "Offer",
      name: "Professional",
      price: "99",
      priceCurrency: "GBP",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "99",
        priceCurrency: "GBP",
        billingDuration: "P1M",
      },
      description: "Everything you need for CIW-compliant care management. Up to 50 staff.",
      url: "https://accredilinkcare.co.uk/pricing",
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      price: "0",
      priceCurrency: "GBP",
      description: "For larger organisations and care home groups. Unlimited staff. Custom pricing.",
      url: "https://accredilinkcare.co.uk/pricing",
    },
  ],
};

export default function PricingLayout({ children }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {children}
    </>
  );
}

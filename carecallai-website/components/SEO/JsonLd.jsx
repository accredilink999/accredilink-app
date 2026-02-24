export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CareCallAI",
    description: "All-in-one home care management software for UK domiciliary care agencies.",
    url: "https://carecallai.com",
    logo: "https://carecallai.com/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+44-1234-567890",
      contactType: "sales",
      areaServed: "GB",
      availableLanguage: ["English", "Welsh"],
    },
    sameAs: [],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CareCallAI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description: "Home care management software with scheduling, care logging, MAR charts, compliance tracking and mobile app.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "GBP",
      lowPrice: "49",
      highPrice: "299",
      offerCount: "4",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "50",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function FAQJsonLd({ items }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function BreadcrumbJsonLd({ items }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.href ? `https://carecallai.com${item.href}` : undefined,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function BlogPostJsonLd({ title, description, date, slug }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: date,
    author: { "@type": "Organization", name: "CareCallAI" },
    publisher: {
      "@type": "Organization",
      name: "CareCallAI",
      logo: { "@type": "ImageObject", url: "https://carecallai.com/logo.png" },
    },
    url: `https://carecallai.com/blog/${slug}`,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

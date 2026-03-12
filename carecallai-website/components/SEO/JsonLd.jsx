export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CareCallAI",
    description: "All-in-one home care management software for UK domiciliary care agencies.",
    url: "https://carecallai.co.uk",
    logo: "https://carecallai.co.uk/logo.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+44-1824-538688",
      contactType: "sales",
      areaServed: "GB",
      availableLanguage: ["English", "Welsh"],
    },
    sameAs: [
      "https://www.facebook.com/profile.php?id=61585016304011",
      "https://www.instagram.com/accredicare999",
      "https://www.linkedin.com/company/accredilink",
      "https://x.com/CareCallAI",
      "https://www.youtube.com/@CareCallAIGuru",
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://carecallai.co.uk/#website",
    name: "CareCallAI",
    url: "https://carecallai.co.uk",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://carecallai.co.uk/blog?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
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
    url: "https://carecallai.co.uk",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "GBP",
      lowPrice: "99",
      highPrice: "349",
      offerCount: "3",
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
  // Google requires "item" (URL) on all breadcrumb entries
  // Build cumulative paths: Home → /compliance → /compliance/ciw
  const slugPart = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let cumulativePath = "";
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => {
      let url;
      if (item.href) {
        url = `https://carecallai.co.uk${item.href}`;
        cumulativePath = item.href;
      } else {
        cumulativePath = cumulativePath + "/" + slugPart(item.name);
        url = `https://carecallai.co.uk${cumulativePath}`;
      }
      return {
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: url,
      };
    }),
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
    dateModified: date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://carecallai.co.uk/blog/${slug}`,
    },
    author: { "@type": "Organization", name: "CareCallAI" },
    publisher: {
      "@type": "Organization",
      name: "CareCallAI",
      logo: { "@type": "ImageObject", url: "https://carecallai.co.uk/logo.png" },
    },
    url: `https://carecallai.co.uk/blog/${slug}`,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

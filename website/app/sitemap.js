export default function sitemap() {
  const baseUrl = 'https://accredilinkcare.co.uk';

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/services`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/areas`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/careers`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/compliance`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/meet-the-team`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Legal pages
  const legalPages = [
    'privacy-policy', 'terms', 'accessibility', 'cookie-policy',
  ].map(slug => ({
    url: `${baseUrl}/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'yearly',
    priority: 0.3,
  }));

  // Service pages
  const services = [
    'domiciliary-care', 'respite-care', 'sit-in-services',
    'emergency-response', 'social-care', 'palliative-care', 'training',
    'event-medical-services',
  ];
  const servicePages = services.map(s => ({
    url: `${baseUrl}/services/${s}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // Location pages (county + town)
  const locations = [
    'denbighshire', 'conwy', 'wrexham', 'denbigh', 'rhyl', 'ruthin',
    'prestatyn', 'colwyn-bay', 'llandudno', 'abergele', 'wrexham-town', 'llangollen',
    'st-asaph', 'corwen',
  ];
  const locationPages = locations.map(l => ({
    url: `${baseUrl}/areas/${l}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // SEO service+location pages (high priority for local ranking)
  const seoPages = [
    // County-level service pages
    { url: `${baseUrl}/areas/denbighshire/emergency-home-care`, priority: 0.9 },
    { url: `${baseUrl}/areas/denbighshire/respite-care-at-home`, priority: 0.9 },
    { url: `${baseUrl}/areas/denbighshire/hospital-discharge-care`, priority: 0.9 },
    // Town authority pages
    { url: `${baseUrl}/areas/denbigh/home-care`, priority: 0.9 },
    { url: `${baseUrl}/areas/llangollen/home-care`, priority: 0.9 },
    // Service+town pages - Denbigh
    { url: `${baseUrl}/areas/denbigh/dementia-care`, priority: 0.85 },
    { url: `${baseUrl}/areas/denbigh/overnight-care`, priority: 0.85 },
    // Service+town pages - Llangollen
    { url: `${baseUrl}/areas/llangollen/dementia-care`, priority: 0.85 },
    { url: `${baseUrl}/areas/llangollen/overnight-care`, priority: 0.85 },
  ].map(p => ({
    ...p,
    lastModified: new Date(),
    changeFrequency: 'weekly',
  }));

  // Blog posts
  const blogSlugs = [
    'how-to-arrange-domiciliary-care-in-wales',
    'understanding-care-funding-in-wales',
    'signs-elderly-parent-needs-care',
    'what-is-respite-care',
    'hospital-discharge-care-wales',
    'dementia-care-at-home-tips',
    'home-care-denbighshire-guide',
    'how-much-does-home-care-cost-wales',
    'how-to-get-carers-assessment-wales',
    'care-home-vs-home-care',
  ];
  const blogPages = blogSlugs.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...legalPages, ...servicePages, ...locationPages, ...seoPages, ...blogPages];
}

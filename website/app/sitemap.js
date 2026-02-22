export default function sitemap() {
  const baseUrl = 'https://accredilinkcare.co.uk'; // Update when domain is live

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

  // Location pages
  const locations = [
    'denbighshire', 'conwy', 'wrexham', 'denbigh', 'rhyl', 'ruthin',
    'prestatyn', 'colwyn-bay', 'llandudno', 'abergele', 'wrexham-town', 'llangollen',
  ];
  const locationPages = locations.map(l => ({
    url: `${baseUrl}/areas/${l}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // SEO service+location pages (high priority for local ranking)
  const seoPages = [
    // Primary authority page
    { url: `${baseUrl}/areas/denbighshire/emergency-home-care`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    // Town authority pages
    { url: `${baseUrl}/areas/denbigh/home-care`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/areas/llangollen/home-care`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    // Service+town pages - Denbigh
    { url: `${baseUrl}/areas/denbigh/dementia-care`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/areas/denbigh/overnight-care`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    // Service+town pages - Llangollen
    { url: `${baseUrl}/areas/llangollen/dementia-care`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/areas/llangollen/overnight-care`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.85 },
  ];

  // Blog posts
  const blogSlugs = [
    'how-to-arrange-domiciliary-care-in-wales',
    'understanding-care-funding-in-wales',
    'signs-elderly-parent-needs-care',
    'what-is-respite-care',
    'hospital-discharge-care-wales',
    'dementia-care-at-home-tips',
    'home-care-denbighshire-guide',
  ];
  const blogPages = blogSlugs.map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...servicePages, ...locationPages, ...seoPages, ...blogPages];
}

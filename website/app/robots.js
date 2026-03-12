export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/login', '/signup', '/ciw-compliance', '/safeguarding', '/funding-guidance'],
      },
    ],
    sitemap: 'https://accredilinkcare.co.uk/sitemap.xml',
  };
}

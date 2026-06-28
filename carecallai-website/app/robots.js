export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/forgot-password", "/onboarding", "/admin"],
      },
    ],
    sitemap: "https://www.carecallai.co.uk/sitemap.xml",
  };
}

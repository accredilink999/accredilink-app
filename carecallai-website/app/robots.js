export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/forgot-password", "/onboarding", "/admin"],
      },
    ],
    sitemap: "https://carecallai.co.uk/sitemap.xml",
  };
}

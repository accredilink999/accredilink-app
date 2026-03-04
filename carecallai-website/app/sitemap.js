import { getAllSlugs } from "@/lib/blog";

const BASE_URL = "https://carecallai.co.uk";

export default async function sitemap() {
  const blogSlugs = await getAllSlugs();

  const staticPages = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/features`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/features/scheduling`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/features/care-logging`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/features/medication-management`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/features/staff-management`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/features/compliance`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/features/invoicing-payroll`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/features/mobile-app`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/features/ai-assistant`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/features/gps-tracking`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/signup`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/compliance/ciw`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/compliance/cqc`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/comparisons/vs-connecteam`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/comparisons/vs-birdie`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/comparisons/vs-careplanner`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/comparisons/vs-log-my-care`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/beta`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/demo`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/login`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogPages = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages];
}

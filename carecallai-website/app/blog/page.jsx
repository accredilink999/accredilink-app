import { getAllPosts } from "@/lib/blog";
import BlogCard from "@/components/BlogCard";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const revalidate = 3600; // Revalidate every hour

export const metadata = {
  title: "Blog",
  description:
    "Expert guides, tips and news for UK domiciliary care agencies. Scheduling, compliance, MAR charts, staff management and more.",
  keywords: ["care management blog", "home care tips UK", "domiciliary care guides"],
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog" },
        ]}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
                CareCallAI Blog
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Expert guides, tips and best practices for running a UK domiciliary care agency.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <AnimateOnScroll key={post.slug} delay={i * 100}>
                <BlogCard post={post} />
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="Ready to simplify your care agency?"
        subtitle="Start your free 7-day trial today."
      />
    </>
  );
}

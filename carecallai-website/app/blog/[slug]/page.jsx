import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Tag, Calendar } from "lucide-react";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd, BlogPostJsonLd } from "@/components/SEO/JsonLd";

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    keywords: [post.category.toLowerCase(), "care software", "home care UK"],
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
    },
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Simple markdown-like rendering: split by ## for headings, paragraphs for text
  const renderContent = (content) => {
    const lines = content.trim().split("\n");
    const elements = [];
    let currentParagraph = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ").trim();
        if (text) {
          elements.push(
            <p key={elements.length} className="text-slate-600 leading-relaxed mb-4">
              {text.split(/(\*\*.*?\*\*)/).map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={i} className="text-slate-900">{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </p>
          );
        }
        currentParagraph = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("## ")) {
        flushParagraph();
        elements.push(
          <h2 key={elements.length} className="text-xl font-bold text-slate-900 mt-8 mb-4">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith("- ")) {
        flushParagraph();
        elements.push(
          <li key={elements.length} className="text-slate-600 ml-4 mb-2 list-disc">
            {trimmed.slice(2).split(/(\*\*.*?\*\*)/).map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return <strong key={i} className="text-slate-900">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </li>
        );
      } else if (trimmed.startsWith("| ")) {
        // Skip table rows in simple renderer
        flushParagraph();
      } else if (trimmed === "") {
        flushParagraph();
      } else {
        currentParagraph.push(trimmed);
      }
    }
    flushParagraph();
    return elements;
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Blog", href: "/blog" },
          { name: post.title },
        ]}
      />
      <BlogPostJsonLd
        title={post.title}
        description={post.description}
        date={post.date}
        slug={post.slug}
      />

      <article className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar className="w-3 h-3" />
              {new Date(post.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-slate-500 mb-8">{post.description}</p>

          <div className="border-t border-slate-200 pt-8">
            {renderContent(post.content)}
          </div>

          <div className="mt-12 p-6 bg-teal-50 rounded-2xl border border-teal-200">
            <h3 className="font-semibold text-slate-900 mb-2">Try CareCallAI for your agency</h3>
            <p className="text-sm text-slate-600 mb-4">
              Start your free 7-day trial today. No credit card required.
            </p>
            <Link
              href="/signup"
              className="inline-block px-6 py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors text-sm"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </article>

      <CTABanner />
    </>
  );
}

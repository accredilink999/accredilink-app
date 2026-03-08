import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock, Tag, Calendar } from "lucide-react";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd, BlogPostJsonLd } from "@/components/SEO/JsonLd";

const relatedResources = [
  { name: "Care Rostering Software", href: "/care-rostering-software", keywords: ["rota", "roster", "scheduling", "shift"] },
  { name: "Digital Care Planning", href: "/digital-care-planning", keywords: ["care plan", "assessment", "clinical"] },
  { name: "Domiciliary Care Software", href: "/domiciliary-care-software", keywords: ["domiciliary", "home care", "homecare"] },
  { name: "Home Care Management Software", href: "/home-care-management-software", keywords: ["management", "agency", "software"] },
  { name: "Care Agency Software Wales", href: "/care-agency-software-wales", keywords: ["wales", "ciw", "welsh", "risca"] },
  { name: "Scheduling & Rota", href: "/features/scheduling", keywords: ["rota", "schedule", "shift", "roster"] },
  { name: "Medication / MAR Charts", href: "/features/medication-management", keywords: ["medication", "mar", "emar", "prescri"] },
  { name: "Care Logging", href: "/features/care-logging", keywords: ["care log", "daily notes", "record"] },
  { name: "GPS Tracking", href: "/features/gps-tracking", keywords: ["gps", "tracking", "check-in", "location"] },
  { name: "Compliance & Auditing", href: "/features/compliance", keywords: ["compliance", "audit", "ciw", "cqc", "inspection"] },
  { name: "Staff Management", href: "/features/staff-management", keywords: ["staff", "hr", "training", "dbs"] },
  { name: "Free Staff Training", href: "/training", keywords: ["training", "cpd", "certificate", "course", "learning"] },
];

function getRelevantResources(post) {
  const text = `${post.title} ${post.description} ${post.category}`.toLowerCase();
  const matched = relatedResources.filter((r) =>
    r.keywords.some((kw) => text.includes(kw))
  );
  // Always show at least 3, max 4
  if (matched.length >= 3) return matched.slice(0, 4);
  // Fallback: add generic ones
  const fallbacks = relatedResources.filter((r) => !matched.includes(r));
  return [...matched, ...fallbacks].slice(0, 4);
}

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.description,
    keywords: [post.category.toLowerCase(), "care software", "home care UK", ...(post.seoKeywords || [])],
    alternates: { canonical: `https://carecallai.co.uk/blog/${slug}` },
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
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  // Enhanced markdown renderer
  const renderContent = (content) => {
    const lines = content.trim().split("\n");
    const elements = [];
    let currentParagraph = [];
    let inList = false;
    let listItems = [];
    let listType = 'ul'; // 'ul' or 'ol'

    const renderInline = (text) => {
      // Handle **bold**, [links](url), and plain text
      return text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/).map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-slate-900">{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          return (
            <a key={i} href={linkMatch[2]} className="text-teal-600 hover:text-teal-700 underline" target={linkMatch[2].startsWith('http') ? '_blank' : undefined} rel={linkMatch[2].startsWith('http') ? 'noopener noreferrer' : undefined}>
              {linkMatch[1]}
            </a>
          );
        }
        return part;
      });
    };

    const flushList = () => {
      if (listItems.length > 0) {
        const ListTag = listType === 'ol' ? 'ol' : 'ul';
        const listClass = listType === 'ol' ? 'list-decimal' : 'list-disc';
        elements.push(
          <ListTag key={elements.length} className={`${listClass} ml-6 mb-4 space-y-2`}>
            {listItems.map((item, i) => (
              <li key={i} className="text-slate-600">{renderInline(item)}</li>
            ))}
          </ListTag>
        );
        listItems = [];
        inList = false;
      }
    };

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ").trim();
        if (text) {
          elements.push(
            <p key={elements.length} className="text-slate-600 leading-relaxed mb-4">
              {renderInline(text)}
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
        flushList();
        elements.push(
          <h2 key={elements.length} className="text-xl font-bold text-slate-900 mt-8 mb-4">
            {trimmed.slice(3)}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        flushParagraph();
        flushList();
        elements.push(
          <h3 key={elements.length} className="text-lg font-semibold text-slate-900 mt-6 mb-3">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith("> ")) {
        flushParagraph();
        flushList();
        elements.push(
          <blockquote key={elements.length} className="border-l-4 border-teal-400 pl-4 py-2 my-4 text-slate-600 italic bg-teal-50/50 rounded-r">
            {renderInline(trimmed.slice(2))}
          </blockquote>
        );
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        flushParagraph();
        if (!inList || listType !== 'ul') {
          flushList();
          inList = true;
          listType = 'ul';
        }
        listItems.push(trimmed.slice(2));
      } else if (/^\d+\.\s/.test(trimmed)) {
        flushParagraph();
        if (!inList || listType !== 'ol') {
          flushList();
          inList = true;
          listType = 'ol';
        }
        listItems.push(trimmed.replace(/^\d+\.\s/, ''));
      } else if (trimmed.startsWith("| ")) {
        // Skip table rows in simple renderer
        flushParagraph();
        flushList();
      } else if (trimmed === "") {
        flushParagraph();
        flushList();
      } else {
        currentParagraph.push(trimmed);
      }
    }
    flushParagraph();
    flushList();
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

          {/* Related Resources */}
          <div className="mt-10">
            <h3 className="font-semibold text-slate-900 mb-4">Related Resources</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getRelevantResources(post).map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow transition-all group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-teal-600">{r.name}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </article>

      <CTABanner />
    </>
  );
}

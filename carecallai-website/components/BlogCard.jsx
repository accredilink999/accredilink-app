import Link from "next/link";
import { ArrowRight, Clock, Tag } from "lucide-react";

export default function BlogCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="block group">
      <article className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 overflow-hidden h-full flex flex-col">
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-teal-50 text-teal-700 text-xs font-medium rounded-full">
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {post.readTime}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-teal-600 transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed flex-1">
            {post.description}
          </p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-teal-600 group-hover:text-teal-700">
            Read more <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </article>
    </Link>
  );
}

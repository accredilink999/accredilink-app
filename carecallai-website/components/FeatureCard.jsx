import Link from "next/link";
import AnimateOnScroll from "./AnimateOnScroll";

export default function FeatureCard({ icon: Icon, title, description, href, delay = 0 }) {
  return (
    <AnimateOnScroll delay={delay}>
      <Link href={href} className="block group">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 h-full">
          <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
            <Icon className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        </div>
      </Link>
    </AnimateOnScroll>
  );
}

import Link from "next/link";

export default function CTABanner({
  title = "Ready to transform your care agency?",
  subtitle = "Start your free 30-day trial today. No credit card required.",
  primaryText = "Start Free Trial",
  primaryHref = "/demo",
  secondaryText = "Book a Demo",
  secondaryHref = "/contact",
}) {
  return (
    <section className="bg-teal-600 py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-teal-100 text-lg mb-8">{subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={primaryHref}
            className="px-8 py-3 bg-white text-teal-700 font-semibold rounded-lg hover:bg-teal-50 transition-colors shadow-lg"
          >
            {primaryText}
          </Link>
          {secondaryText && (
            <Link
              href={secondaryHref}
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              {secondaryText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

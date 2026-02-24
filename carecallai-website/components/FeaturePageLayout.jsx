import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import AnimateOnScroll from "./AnimateOnScroll";
import CTABanner from "./CTABanner";
import FAQ from "./FAQ";
import { BreadcrumbJsonLd, FAQJsonLd } from "./SEO/JsonLd";

export default function FeaturePageLayout({
  icon: Icon,
  title,
  subtitle,
  description,
  benefits,
  howItWorks,
  relatedFeatures,
  faqs,
  breadcrumbs,
}) {
  return (
    <>
      <BreadcrumbJsonLd items={breadcrumbs} />
      {faqs && <FAQJsonLd items={faqs} />}

      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Icon className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
              {title}
            </h1>
            <p className="text-lg text-teal-700 font-medium mb-4">{subtitle}</p>
            <p className="text-slate-600 max-w-2xl mx-auto mb-8">{description}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/demo"
                className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
              >
                Start Free Trial
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-3 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Benefits */}
      {benefits && (
        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <AnimateOnScroll>
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
                Key Benefits
              </h2>
            </AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((b, i) => (
                <AnimateOnScroll key={i} delay={i * 100}>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
                    <Check className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">{b.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{b.description}</p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      {howItWorks && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4">
            <AnimateOnScroll>
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
                How It Works
              </h2>
            </AnimateOnScroll>
            <div className="space-y-8">
              {howItWorks.map((step, i) => (
                <AnimateOnScroll key={i} delay={i * 150}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{step.title}</h3>
                      <p className="text-slate-600 text-sm mt-1">{step.description}</p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faqs && faqs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4">
            <AnimateOnScroll>
              <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
                Frequently Asked Questions
              </h2>
            </AnimateOnScroll>
            <FAQ items={faqs} />
          </div>
        </section>
      )}

      {/* Related Features */}
      {relatedFeatures && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Related Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedFeatures.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="flex items-center gap-2 p-4 bg-white rounded-xl border border-slate-200 hover:border-teal-300 hover:shadow transition-all group"
                >
                  <span className="text-sm font-medium text-slate-700 group-hover:text-teal-600">
                    {f.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 ml-auto" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <CTABanner />
    </>
  );
}

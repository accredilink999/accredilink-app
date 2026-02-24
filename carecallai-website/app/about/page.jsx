import { Heart, Shield, Zap, Users, Target, Globe } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "About Us",
  description:
    "CareCallAI is built by care professionals, for care professionals. Our mission is to make home care management simple, compliant and affordable for every UK agency.",
};

const values = [
  {
    icon: Heart,
    title: "Care First",
    description: "Every feature we build starts with one question: does this help carers deliver better care?",
  },
  {
    icon: Shield,
    title: "Compliance Built In",
    description: "We don't bolt compliance on as an afterthought. It's woven into every part of the platform.",
  },
  {
    icon: Zap,
    title: "Simple by Design",
    description: "Care workers shouldn't need IT training. If it isn't intuitive, it doesn't ship.",
  },
  {
    icon: Users,
    title: "Welsh Roots",
    description: "Founded in Wales, built for the UK. We understand CIW and CQC because we've lived it.",
  },
  {
    icon: Target,
    title: "Affordable Always",
    description: "Care agencies operate on tight margins. Our pricing reflects that — 40% cheaper than the big names.",
  },
  {
    icon: Globe,
    title: "Always Improving",
    description: "We ship updates every week based on real feedback from real care agencies across the UK.",
  },
];

export default function AboutPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "About" },
        ]}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6">
              Built by care professionals,
              <br />
              <span className="text-teal-600">for care professionals</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              CareCallAI was born out of frustration with expensive, complicated care software that
              didn&apos;t work for small and medium agencies. We set out to build something better —
              simpler, cheaper, and designed for the way UK care agencies actually work.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
              Our Values
            </h2>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <AnimateOnScroll key={i} delay={i * 100}>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full">
                  <v.icon className="w-8 h-8 text-teal-600 mb-4" />
                  <h3 className="font-semibold text-slate-900 mb-2">{v.title}</h3>
                  <p className="text-sm text-slate-600">{v.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Story</h2>
              <div className="prose prose-slate max-w-none space-y-4 text-slate-600">
                <p>
                  CareCallAI started when our founders — experienced care professionals and
                  technologists in Wales — saw first-hand how much time care agencies waste on
                  paper-based systems, spreadsheets and disconnected tools.
                </p>
                <p>
                  Existing software was either too expensive for small agencies, too complex for
                  frontline carers, or built for a US market that doesn&apos;t understand CIW or CQC.
                  We wanted to change that.
                </p>
                <p>
                  Today, CareCallAI serves domiciliary care agencies across Wales and England,
                  helping them schedule visits, log care, manage medications, track compliance and
                  keep their teams connected — all from one platform, on any device.
                </p>
                <p>
                  We&apos;re proud to be based in Wales and to be building software that makes a real
                  difference to care workers and the people they look after.
                </p>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      <CTABanner
        title="Want to learn more?"
        subtitle="Book a demo or start your free trial today."
      />
    </>
  );
}

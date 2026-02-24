import Link from "next/link";
import {
  Calendar,
  ClipboardList,
  Pill,
  Users,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Star,
  CheckCircle,
  Building2,
  Sparkles,
} from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import FeatureCard from "@/components/FeatureCard";
import CTABanner from "@/components/CTABanner";
import FAQ from "@/components/FAQ";
import { OrganizationJsonLd, SoftwareApplicationJsonLd, FAQJsonLd } from "@/components/SEO/JsonLd";

const features = [
  {
    icon: Calendar,
    title: "Scheduling & Rota",
    description: "Multi-area rotas, shift patterns, one-off calls and drag-and-drop scheduling for your entire team.",
    href: "/features/scheduling",
  },
  {
    icon: ClipboardList,
    title: "Care Logging",
    description: "Digital care logs with timestamps, evidence and real-time visibility for managers and families.",
    href: "/features/care-logging",
  },
  {
    icon: Pill,
    title: "Medication / MAR Charts",
    description: "Electronic MAR charts with PRN support, refused/destroyed tracking and full audit trails.",
    href: "/features/medication-management",
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Leave requests, training tracking, DBS expiry alerts, expenses and emergency contacts in one place.",
    href: "/features/staff-management",
  },
  {
    icon: ShieldCheck,
    title: "Compliance & Auditing",
    description: "CIW and CQC compliant. Automatic audit trails, incident reporting and inspection-ready reports.",
    href: "/features/compliance",
  },
  {
    icon: Smartphone,
    title: "Mobile App",
    description: "Native iOS and Android app for carers — care logging, MAR charts and rota access on the go.",
    href: "/features/mobile-app",
  },
];

const steps = [
  {
    number: "1",
    title: "Sign up in minutes",
    description: "Create your account, add your staff and clients. Import existing data or start fresh.",
  },
  {
    number: "2",
    title: "Set up your rota",
    description: "Create shift patterns, assign carers to areas and build your weekly schedule with templates.",
  },
  {
    number: "3",
    title: "Go live",
    description: "Your team downloads the mobile app and starts logging care visits, medications and incidents in real time.",
  },
];

const faqs = [
  {
    question: "Is CareCallAI compliant with CIW and CQC?",
    answer: "Yes. CareCallAI is built specifically for UK domiciliary care agencies and includes all the features required for CIW (Wales) and CQC (England) compliance, including care logging, medication management, incident reporting and audit trails.",
  },
  {
    question: "How long does it take to set up?",
    answer: "Most agencies are fully set up within a day. You can import your existing staff and client data, and our team is available to help with onboarding if needed.",
  },
  {
    question: "Can my carers use it on their phones?",
    answer: "Yes. CareCallAI has native iOS and Android apps that carers use to view their rota, log care visits, complete MAR charts and report incidents — all from their phone.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes. We offer a free 14-day trial on all plans with no credit card required. You get full access to every feature during the trial.",
  },
  {
    question: "How does pricing work?",
    answer: "CareCallAI is priced per month based on your team size. Plans start from £49/month for up to 15 users. Annual billing saves 20%. See our pricing page for full details.",
  },
  {
    question: "Can I switch plans later?",
    answer: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing period.",
  },
];

const stats = [
  { value: "500+", label: "Care visits logged daily" },
  { value: "99.9%", label: "Uptime reliability" },
  { value: "30s", label: "Average setup time per carer" },
  { value: "4.8/5", label: "User satisfaction rating" },
];

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
      <FAQJsonLd items={faqs} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 via-white to-white py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              Built for UK domiciliary care agencies
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Home Care Management
              <br />
              <span className="text-teal-600">Made Simple</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10">
              All-in-one software for scheduling, care logging, MAR charts, staff management and
              compliance. CIW & CQC ready. From £49/month.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                href="/demo"
                className="px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 text-lg"
              >
                Start Free 14-Day Trial
              </Link>
              <Link
                href="/features"
                className="px-8 py-3.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-lg"
              >
                See All Features <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <p className="text-sm text-slate-500">
              No credit card required &middot; Free 14-day trial &middot; Cancel anytime
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <AnimateOnScroll key={i} delay={i * 100}>
                <div className="text-center">
                  <p className="text-3xl font-bold text-teal-600">{stat.value}</p>
                  <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Everything your care agency needs
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                From scheduling shifts to logging medications, CareCallAI replaces paper forms,
                spreadsheets and disconnected tools with one powerful platform.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.href} {...feature} delay={i * 100} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700"
            >
              View all features <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Up and running in a day
              </h2>
              <p className="text-slate-600">
                Getting started with CareCallAI is straightforward. No complex setup, no IT team required.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <AnimateOnScroll key={i} delay={i * 150}>
                <div className="flex items-start gap-6 bg-slate-50 rounded-2xl p-6">
                  <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {step.number}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-slate-600 mt-1">{step.description}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-slate-600">
                40% cheaper than Connecteam. Plans that grow with your agency.
              </p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "49", users: "Up to 15 users", highlight: false },
              { name: "Professional", price: "99", users: "Up to 50 users", highlight: true },
              { name: "Enterprise", price: "199", users: "Up to 150 users", highlight: false },
            ].map((tier, i) => (
              <AnimateOnScroll key={tier.name} delay={i * 100}>
                <div
                  className={`bg-white rounded-2xl p-6 border text-center ${
                    tier.highlight
                      ? "border-teal-500 shadow-xl ring-2 ring-teal-500"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  {tier.highlight && (
                    <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-xs font-semibold rounded-full mb-3">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                  <p className="mt-3">
                    <span className="text-4xl font-bold text-slate-900">£{tier.price}</span>
                    <span className="text-slate-500">/mo</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-1">{tier.users}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700"
            >
              See full pricing & compare plans <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Compliance badges */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Built for UK compliance
            </h2>
            <p className="text-slate-600 mb-8">
              CareCallAI meets the requirements of both CIW (Wales) and CQC (England) for
              domiciliary care record-keeping and audit trails.
            </p>
          </AnimateOnScroll>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <AnimateOnScroll delay={0}>
              <Link
                href="/compliance/ciw"
                className="flex items-center gap-3 bg-slate-50 rounded-xl px-6 py-4 border border-slate-200 hover:border-teal-300 transition-colors"
              >
                <ShieldCheck className="w-8 h-8 text-teal-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">CIW Compliant</p>
                  <p className="text-xs text-slate-500">Care Inspectorate Wales</p>
                </div>
              </Link>
            </AnimateOnScroll>
            <AnimateOnScroll delay={100}>
              <Link
                href="/compliance/cqc"
                className="flex items-center gap-3 bg-slate-50 rounded-xl px-6 py-4 border border-slate-200 hover:border-teal-300 transition-colors"
              >
                <ShieldCheck className="w-8 h-8 text-teal-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">CQC Compliant</p>
                  <p className="text-xs text-slate-500">Care Quality Commission</p>
                </div>
              </Link>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Coming Soon: CareCallAI Home */}
      <section className="py-16 bg-gradient-to-r from-blue-50 to-teal-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-4">
              <Building2 className="w-4 h-4" />
              Coming Soon
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              CareCallAI <span className="text-blue-600">Home</span>
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-6">
              Everything in CareCallAI, tailored for residential care homes and on-site care providers.
              Shift handovers, resident management, room tracking and facility compliance — all in one platform.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Register Interest <ArrowRight className="w-4 h-4" />
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Trusted by care agencies across the UK
              </h2>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "CareCallAI replaced three separate systems for us. Scheduling, care logs and MAR charts all in one place. Our carers love the mobile app.",
                name: "Sarah T.",
                role: "Registered Manager",
                agency: "Home Care Wales",
              },
              {
                quote: "The CIW compliance features saved us hours of prep before our last inspection. Everything the inspector needed was right there.",
                name: "James M.",
                role: "Director",
                agency: "Premier Care Services",
              },
              {
                quote: "We switched from paper MAR charts and haven't looked back. Medication errors have dropped and our audit trail is bulletproof.",
                name: "Lisa R.",
                role: "Care Coordinator",
                agency: "Compassionate Care Ltd",
              },
            ].map((t, i) => (
              <AnimateOnScroll key={i} delay={i * 100}>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {t.role}, {t.agency}
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-3xl font-bold text-slate-900 text-center mb-10">
              Frequently Asked Questions
            </h2>
          </AnimateOnScroll>
          <FAQ items={faqs} />
        </div>
      </section>

      <CTABanner />
    </>
  );
}

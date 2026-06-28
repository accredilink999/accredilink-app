import Link from "next/link";
import { CheckCircle, ArrowRight } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Get Started with CareCallAI — £99/month, Everything Included",
  description:
    "Get started with CareCallAI today. £99/month, everything included. Full access to scheduling, care logging, MAR charts and compliance features. Cancel anytime.",
  alternates: { canonical: "https://www.carecallai.co.uk/demo" },
  openGraph: {
    title: "Get Started — CareCallAI",
    description: "Get started with CareCallAI. £99/month, everything included. Full access to all care management features. Cancel anytime.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get Started — CareCallAI",
    description: "Get started with CareCallAI. £99/month, everything included. Full access to all care management features. Cancel anytime.",
  },
};

const trialBenefits = [
  "Full access to all features from day one",
  "Everything included — no hidden costs",
  "Import your existing staff and client data",
  "Mobile app access for your whole team",
  "Cancel anytime — no questions asked",
  "Personal onboarding support",
];

export default function DemoPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Get Started" },
        ]}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Left: Info */}
            <AnimateOnScroll>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  Get started with CareCallAI
                </h1>
                <p className="text-lg text-slate-600 mb-8">
                  See how CareCallAI can simplify your scheduling, care logging and compliance —
                  £99/month, everything included.
                </p>
                <ul className="space-y-3 mb-8">
                  {trialBenefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                      <span className="text-slate-700">{b}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-teal-600 font-medium hover:underline">
                    Log in here
                  </Link>
                </p>
              </div>
            </AnimateOnScroll>

            {/* Right: Form */}
            <AnimateOnScroll delay={200}>
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-lg">
                <h3 className="font-semibold text-slate-900 mb-2">
                  Create your account
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Fill in your details and we&apos;ll set up your account.
                </p>
                <ContactForm />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}

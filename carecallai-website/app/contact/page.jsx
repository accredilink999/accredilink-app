import { Phone, Mail, MapPin, Clock } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import { BreadcrumbJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Contact Us — Book a Demo or Get Support",
  description:
    "Get in touch with CareCallAI. Book a demo, ask about pricing, or get support. We're based in Wales and available Monday to Friday.",
  alternates: { canonical: "https://carecallai.co.uk/contact" },
  openGraph: {
    title: "Contact Us — CareCallAI",
    description: "Book a demo, ask about pricing, or get support. Based in Wales, available Monday to Friday.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us — CareCallAI",
    description: "Book a demo, ask about pricing, or get support. Based in Wales, available Monday to Friday.",
  },
};

export default function ContactPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", href: "/" },
          { name: "Contact" },
        ]}
      />

      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white">
        <div className="max-w-6xl mx-auto px-4">
          <AnimateOnScroll>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-4">
                Get in touch
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Have a question about CareCallAI? Want to book a demo? We&apos;d love to hear from you.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <AnimateOnScroll>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-4">Contact Details</h3>
                  <div className="space-y-4">
                    <a
                      href="tel:+441824538688"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-teal-600 transition-colors"
                    >
                      <Phone className="w-5 h-5 text-teal-600" />
                      01824 538 688
                    </a>
                    <a
                      href="mailto:hello@carecallai.co.uk"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-teal-600 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-teal-600" />
                      hello@carecallai.co.uk
                    </a>
                    <a
                      href="mailto:support@carecallai.co.uk"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-teal-600 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-teal-600" />
                      support@carecallai.co.uk
                    </a>
                    <a
                      href="mailto:billing@carecallai.co.uk"
                      className="flex items-center gap-3 text-sm text-slate-600 hover:text-teal-600 transition-colors"
                    >
                      <Mail className="w-5 h-5 text-teal-600" />
                      billing@carecallai.co.uk
                    </a>
                    <p className="flex items-center gap-3 text-sm text-slate-600">
                      <MapPin className="w-5 h-5 text-teal-600" />
                      Wales, United Kingdom
                    </p>
                    <p className="flex items-center gap-3 text-sm text-slate-600">
                      <Clock className="w-5 h-5 text-teal-600" />
                      Mon–Fri, 9am–5pm
                    </p>
                  </div>
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll delay={100}>
                <div className="bg-teal-50 rounded-2xl p-6 border border-teal-200">
                  <h3 className="font-semibold text-slate-900 mb-2">Book a Demo</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Want to see CareCallAI in action? Fill in the form and we&apos;ll arrange a
                    personalised walkthrough for your team.
                  </p>
                </div>
              </AnimateOnScroll>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <AnimateOnScroll delay={200}>
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-900 mb-6">Send us a message</h3>
                  <ContactForm />
                </div>
              </AnimateOnScroll>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

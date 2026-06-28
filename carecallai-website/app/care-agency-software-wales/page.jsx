import Link from "next/link";
import { ShieldCheck, MapPin, Languages, Calendar, ClipboardList, Pill, Smartphone, CheckCircle, ArrowRight } from "lucide-react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import CTABanner from "@/components/CTABanner";
import { BreadcrumbJsonLd, FAQJsonLd, SoftwareApplicationJsonLd } from "@/components/SEO/JsonLd";

export const metadata = {
  title: "Care Agency Software Wales — CIW Compliant",
  description:
    "Care agency software built in Wales for Welsh care providers. CIW compliant with RISCA regulations, Welsh language support, and pre-populated CIW inspection forms. Used by agencies across Denbighshire, Conwy and Wrexham.",
  keywords: [
    "care agency software Wales",
    "CIW compliant software",
    "care software Wales",
    "domiciliary care software Wales",
    "RISCA compliant care software",
    "Welsh care management software",
  ],
  alternates: { canonical: "https://www.carecallai.co.uk/care-agency-software-wales" },
  openGraph: {
    title: "Care Agency Software Wales — CareCallAI",
    description: "Built in Wales, for Wales. CIW compliant care management software with Welsh language support.",
  },
};

const ciwFeatures = [
  { title: "Pre-Populated CIW Forms", desc: "Regulation filing forms pre-filled from your data. Submit inspection evidence in minutes, not days." },
  { title: "RISCA Reg 36 Supervision", desc: "Automatic 12-weekly supervision tracking for all staff. Alerts when supervisions are due. Full audit trail." },
  { title: "50+ Automated Checks", desc: "CareCallAI continuously checks your compliance status. Live scoring dashboard shows exactly where you stand." },
  { title: "Inspection-Ready Reports", desc: "One-click reports covering all CIW inspection areas. Evidence of care quality, staffing and governance." },
  { title: "Safeguarding Reporting", desc: "Digital safeguarding incident reporting with investigation workflows and outcome tracking." },
  { title: "Staff Training Matrix", desc: "Track mandatory training, DBS expiry dates and qualifications. Alerts before anything lapses." },
];

const faqs = [
  { question: "Is CareCallAI built in Wales?", answer: "Yes. CareCallAI is developed by Accredilink, a Welsh company based in Denbigh, North Wales. The platform is built specifically for the Welsh care sector while also supporting CQC-regulated providers in England." },
  { question: "Does it support CIW compliance?", answer: "Yes. CareCallAI has a dedicated CIW compliance module with pre-populated regulation forms, RISCA Reg 36 supervision tracking, automated inspection checks and inspection-ready reports. It is the only care management platform with built-in CIW compliance." },
  { question: "Is Welsh language supported?", answer: "Yes. CareCallAI supports Welsh and English speaking staff and clients. The system is designed for bilingual care delivery as required under the Welsh Language Standards." },
  { question: "Which areas of Wales do you cover?", answer: "CareCallAI is used by care agencies across Wales including Denbighshire, Conwy, Wrexham, Flintshire, Gwynedd and beyond. As a cloud-based platform, it works anywhere in Wales (and England)." },
  { question: "Can I use it for CQC compliance too?", answer: "Yes. CareCallAI has both CIW and CQC compliance modules. If your agency operates across Wales and England, you can manage compliance for both regulators from one system." },
  { question: "How is CareCallAI different from English-made care software?", answer: "Most care software is built for CQC in England and treats CIW as an afterthought. CareCallAI is built in Wales with CIW compliance as a core feature — pre-populated CIW forms, RISCA regulation tracking and Welsh language support are included from day one, not bolted on." },
];

export default function CareAgencySoftwareWalesPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", href: "/" }, { name: "Care Agency Software Wales" }]} />
      <SoftwareApplicationJsonLd />
      <FAQJsonLd items={faqs} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <AnimateOnScroll>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium mb-6">
              <ShieldCheck className="w-4 h-4" />
              CIW Compliant — Built in Wales
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 mb-6">
              Care Agency Software for Wales
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto mb-8">
              The only care management platform built in Wales with native CIW compliance. Pre-populated regulation forms, RISCA supervision tracking, Welsh language support and every feature your agency needs — from £99/month.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/demo" className="px-8 py-3.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                Get Started
              </Link>
              <Link href="/compliance/ciw" className="px-8 py-3.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                See CIW Compliance Features
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Why Welsh agencies choose CareCallAI */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">
              Built in Wales, for Welsh Care Agencies
            </h2>
            <p className="text-slate-600 text-center max-w-2xl mx-auto mb-12">
              Most care software is designed for CQC in England. CareCallAI puts CIW compliance first because that is what Welsh agencies actually need.
            </p>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ciwFeatures.map((f, i) => (
              <AnimateOnScroll key={f.title} delay={i * 50}>
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 h-full">
                  <CheckCircle className="w-6 h-6 text-teal-500 mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600">{f.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Full platform */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-4">
              Complete Care Management Platform
            </h2>
            <p className="text-slate-600 text-center max-w-2xl mx-auto mb-10">
              CIW compliance is just one part of CareCallAI. Every plan includes the full platform.
            </p>
          </AnimateOnScroll>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: Calendar, label: "Scheduling & Rota" },
              { icon: ClipboardList, label: "Care Logging" },
              { icon: Pill, label: "eMAR Charts" },
              { icon: MapPin, label: "GPS Tracking" },
              { icon: Smartphone, label: "Mobile App" },
              { icon: Languages, label: "Welsh & English" },
              { icon: ShieldCheck, label: "CIW + CQC" },
              { icon: CheckCircle, label: "Clinical Assessments" },
            ].map((item, i) => (
              <AnimateOnScroll key={item.label} delay={i * 30}>
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                  <item.icon className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-900">{item.label}</span>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/features" className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:underline">
              See all features <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-16 bg-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Used by Care Agencies Across Wales</h2>
          <p className="text-teal-100 mb-8">CareCallAI is cloud-based and works anywhere. Welsh agencies using the platform include providers in:</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Denbighshire", "Conwy", "Wrexham", "Flintshire", "Gwynedd", "Anglesey", "Ceredigion", "Powys", "Carmarthenshire", "Swansea", "Cardiff", "Newport"].map(area => (
              <span key={area} className="px-4 py-2 bg-white/15 rounded-full text-sm font-medium">{area}</span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <AnimateOnScroll>
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
              Care Software Wales FAQ
            </h2>
          </AnimateOnScroll>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <AnimateOnScroll key={i} delay={i * 50}>
                <div className="border border-slate-200 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                  <p className="text-sm text-slate-600">{faq.answer}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}

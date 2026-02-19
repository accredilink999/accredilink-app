import Link from 'next/link';
import AnimateOnScroll from '@/components/AnimateOnScroll';

export const metadata = {
  title: 'Apps That Care | Software Built by Carers, for Carers',
  description: 'Innovative care technology developed by experienced carers. Our flagship app CareCall AI is transforming how domiciliary care agencies manage staff, shifts, and compliance across Wales.',
};

const values = [
  {
    title: 'Built by Carers',
    description: 'Our developers are experienced care professionals who understand the daily challenges of delivering domiciliary care. Every feature is born from real-world experience on the frontline.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    title: 'CIW Compliant by Design',
    description: 'Every app we build is designed around Care Inspectorate Wales requirements from day one. Incident reporting, care documentation, training tracking — compliance is baked in, not bolted on.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    title: 'Made in Wales',
    description: 'Proudly developed in Denbighshire by Accredilink Community Response Taskforce. We understand the Welsh care landscape, local authority requirements, and the communities we serve.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    title: 'Constantly Evolving',
    description: 'Our apps are never finished. We listen to care teams, respond to regulatory changes, and continuously add features that make a real difference to care delivery.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
];

const comingSoon = [
  {
    name: 'CareConnect Family',
    description: 'Keep families informed with real-time updates on their loved ones\u2019 care visits, medications, and wellbeing.',
    status: 'In Development',
    icon: '👨\u200D👩\u200D👧\u200D👦',
  },
  {
    name: 'CareLearn LMS',
    description: 'A standalone learning management system for care training, CPD tracking, and certification management.',
    status: 'Planning',
    icon: '📚',
  },
  {
    name: 'CareAudit',
    description: 'Automated compliance auditing tool that prepares your organisation for CIW inspections with real-time readiness scoring.',
    status: 'Planning',
    icon: '📋',
  },
];

export default function AppsThatCarePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-welsh-red rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-welsh-green rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-sm mb-8">
                <svg className="w-4 h-4 text-welsh-green" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                By Accredilink Community Response Taskforce
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6">
                Apps That <span className="bg-gradient-to-r from-welsh-red via-amber-400 to-welsh-green bg-clip-text text-transparent">Care</span>
              </h1>
              <p className="text-xl sm:text-2xl text-slate-300 mb-4 font-light">
                Built by Carers. Designed for Care.
              </p>
              <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                We&apos;re not just a care company — we&apos;re care technology innovators. Our apps are crafted by people who&apos;ve walked the floors, delivered the care, and understood what the sector truly needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/apps-that-care/carecall-ai"
                  className="px-8 py-4 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors text-base"
                >
                  Explore CareCall AI
                </Link>
                <Link
                  href="/contact"
                  className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base"
                >
                  Book a Demo
                </Link>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Our Mission */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">Our Mission</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                The care sector deserves technology that truly understands its needs. Too many care apps are built by developers who&apos;ve never set foot in a service user&apos;s home. We&apos;re different. Our team includes experienced carers, emergency responders, and care coordinators who build the tools they wish they&apos;d had.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, i) => (
              <AnimateOnScroll key={value.title} animation="fade-up" delay={i * 100}>
                <div className="flex items-start gap-5 p-6 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">
                  <div className={`w-14 h-14 rounded-xl ${value.bg} ${value.color} flex items-center justify-center flex-shrink-0`}>
                    {value.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg mb-2">{value.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{value.description}</p>
                  </div>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Flagship Product */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-welsh-red/10 text-welsh-red text-sm font-medium mb-4">
                Flagship Product
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">CareCall AI</h2>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="fade-up" delay={100}>
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Screenshot placeholder */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 lg:p-12 flex items-center justify-center min-h-[300px] lg:min-h-[400px]">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-10 h-10 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold text-white mb-2">CareCall AI</p>
                    <p className="text-slate-400 text-sm">All-in-One Care Management Platform</p>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    The Complete Staff Management & Care Operations Platform
                  </h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    CareCall AI is our flagship application — a comprehensive, all-in-one platform that transforms how domiciliary care agencies manage their operations. From real-time GPS tracking and intelligent rota management to integrated care documentation and CIW compliance tools, everything your care team needs is in one place.
                  </p>
                  <ul className="space-y-3 mb-8">
                    {[
                      'Real-time GPS control room with live staff tracking',
                      'Integrated care logs with mood, nutrition & hygiene tracking',
                      'Incident & safeguarding reporting built for CIW',
                      'AI-powered training academy with course builder',
                      'Advanced analytics and reporting dashboards',
                      'Mobile app for carers — works offline',
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-slate-700">
                        <svg className="w-5 h-5 text-welsh-green flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/apps-that-care/carecall-ai"
                      className="px-6 py-3 bg-welsh-red text-white font-semibold rounded-lg hover:bg-welsh-red-light transition-colors text-sm text-center"
                    >
                      Learn More
                    </Link>
                    <Link
                      href="/contact"
                      className="px-6 py-3 bg-welsh-green text-white font-semibold rounded-lg hover:bg-welsh-green-light transition-colors text-sm text-center"
                    >
                      Request a Demo
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Coming Soon */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Coming Soon</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                CareCall AI is just the beginning. We&apos;re developing a suite of purpose-built apps for the care sector.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {comingSoon.map((app, i) => (
              <AnimateOnScroll key={app.name} animation="fade-up" delay={i * 100}>
                <div className="relative bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="absolute top-4 right-4">
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      {app.status}
                    </span>
                  </div>
                  <span className="text-4xl mb-4 block">{app.icon}</span>
                  <h3 className="font-semibold text-slate-900 text-lg mb-2">{app.name}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{app.description}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-welsh-red to-rose-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll animation="fade-up">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Ready to Transform Your Care Operations?
            </h2>
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Join care agencies across Wales who are already using CareCall AI to deliver better care, stay compliant, and empower their teams.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link
                href="/contact"
                className="px-8 py-4 bg-white text-welsh-red font-semibold rounded-xl hover:bg-slate-100 transition-colors text-base"
              >
                Request a Free Demo
              </Link>
              <Link
                href="/apps-that-care/carecall-ai"
                className="px-8 py-4 bg-white/10 backdrop-blur border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors text-base"
              >
                Explore CareCall AI
              </Link>
            </div>
            <p className="text-sm text-white/60">
              Or email{' '}
              <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-white/90 font-medium hover:underline">
                enquiries@accredilinkcare.co.uk
              </a>
            </p>
          </AnimateOnScroll>
        </div>
      </section>
    </main>
  );
}

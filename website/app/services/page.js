import Link from 'next/link';
import Image from 'next/image';
import AnimateOnScroll from '@/components/AnimateOnScroll';

export const metadata = {
  title: 'Our Services',
  description: 'Domiciliary care, emergency response, respite, palliative care, sit-in services, social care, and training across Denbighshire, Conwy and Wrexham.',
};

const services = [
  {
    title: 'Domiciliary Care',
    description: 'Personal care, medication support, and daily living assistance delivered in the comfort of your own home by our trained carers.',
    href: '/services/domiciliary-care',
    gradient: 'from-red-500 to-rose-600',
    bgLight: 'bg-red-50',
    textColor: 'text-red-600',
    borderHover: 'hover:border-red-300',
    image: '/images/domiciliary-care.jpg',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    stats: '500+ clients supported',
  },
  {
    title: 'Respite Care',
    description: 'Short-term relief for family carers. We step in so you can take a break, knowing your loved one is in safe, caring hands.',
    href: '/services/respite-care',
    gradient: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50',
    textColor: 'text-pink-600',
    borderHover: 'hover:border-pink-300',
    image: '/images/respite-care.jpg',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    stats: 'Flexible scheduling',
  },
  {
    title: 'Sit-in Services',
    description: 'Companionship and supervision for your loved one while you attend appointments, run errands, or simply take some time for yourself.',
    href: '/services/sit-in-services',
    gradient: 'from-purple-500 to-violet-600',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderHover: 'hover:border-purple-300',
    image: '/images/sit-in-services.jpg',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    stats: 'From 2-hour visits',
  },
  {
    title: 'Emergency Response',
    description: 'Rapid response care with our own trained emergency care responders, available around the clock for urgent situations.',
    href: '/services/emergency-response',
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderHover: 'hover:border-amber-300',
    image: '/images/emergency-response.jpg',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    stats: '24/7 availability',
  },
  {
    title: 'Social Care',
    description: 'Community-based support to help individuals maintain independence, build social connections, and improve overall wellbeing.',
    href: '/services/social-care',
    gradient: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderHover: 'hover:border-blue-300',
    image: '/images/social-care.jpg',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    stats: 'Community focused',
  },
  {
    title: 'Palliative Care',
    description: 'Compassionate end-of-life support ensuring dignity, comfort, and peace for patients and their families during the most difficult times.',
    href: '/services/palliative-care',
    gradient: 'from-emerald-500 to-green-600',
    bgLight: 'bg-green-50',
    textColor: 'text-green-600',
    borderHover: 'hover:border-green-300',
    image: '/images/palliative-care.jpg',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    stats: 'Dignity-centred care',
  },
  {
    title: 'Training',
    description: 'Professional care training and pre-hospital emergency care courses for individuals, carers, and organisations.',
    href: '/services/training',
    gradient: 'from-teal-500 to-cyan-600',
    bgLight: 'bg-teal-50',
    textColor: 'text-teal-600',
    borderHover: 'hover:border-teal-300',
    image: '/images/training.jpg',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    stats: 'Accredited courses',
  },
  {
    title: 'Event Medical Services',
    description: 'Professional medical cover for community events, festivals, sporting fixtures, and public gatherings with qualified pre-hospital emergency care responders.',
    href: '/services/event-medical-services',
    gradient: 'from-rose-500 to-red-700',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-600',
    borderHover: 'hover:border-rose-300',
    image: '/images/event-medical.jpg',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 0v4m0-4h4m-4 0H8" />
      </svg>
    ),
    stats: 'Community events',
  },
];

const stats = [
  { value: '8', label: 'Care Services', suffix: '+' },
  { value: '3', label: 'Counties Covered', suffix: '' },
  { value: '24/7', label: 'Emergency Response', suffix: '' },
  { value: '100', label: 'CIW Compliant', suffix: '%' },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero - Vibrant gradient header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-welsh-red via-amber-400 via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(185,28,28,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(22,101,52,0.2),transparent_50%)]" />
        {/* Floating decorative circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-welsh-red/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-welsh-green/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <AnimateOnScroll animation="fade-in-down" delay={0}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90 mb-6 border border-white/10">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  CIW Regulated &mdash; Trusted across North Wales
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-in-up" delay={200}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Our{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-green-400">
                    Services
                  </span>
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-in-up" delay={400}>
                <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
                  We offer a comprehensive range of care, support, and training services
                  across Denbighshire, Conwy, and Wrexham &mdash; tailored to your individual needs.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-in-up" delay={600}>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-welsh-red to-red-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-500 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5"
                  >
                    Get a Free Assessment
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <a
                    href="tel:01onal"
                    className="inline-flex items-center justify-center px-6 py-3.5 bg-white/10 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 border border-white/20"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call Us Today
                  </a>
                </div>
              </AnimateOnScroll>
            </div>

            <AnimateOnScroll animation="scale-in" delay={300} className="hidden lg:block">
              <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                <Image src="/images/services-overview.jpg" alt="Our care services" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative -mt-8 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <AnimateOnScroll key={stat.label} animation="scale-in" delay={i * 150}>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-welsh-red to-welsh-green">
                      {stat.value}{stat.suffix}
                    </div>
                    <div className="text-sm text-slate-600 mt-1 font-medium">{stat.label}</div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services - Alternating Feature Cards */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-white via-slate-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-in-up">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <p className="text-sm font-semibold text-welsh-red uppercase tracking-wider mb-3">What We Offer</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
                Comprehensive Care &{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-welsh-red to-welsh-green">
                  Support Services
                </span>
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Click any service to explore how we can help you or your loved ones.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="space-y-8">
            {services.map((service, index) => (
              <AnimateOnScroll
                key={service.href}
                animation={index % 2 === 0 ? 'slide-in-left' : 'slide-in-right'}
                delay={100}
              >
                <Link
                  href={service.href}
                  className={`group block rounded-3xl overflow-hidden border border-slate-200 ${service.borderHover} bg-white card-interactive`}
                >
                  <div className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-stretch`}>
                    {/* Image side */}
                    <div className="relative w-full md:w-2/5 h-56 md:h-auto min-h-[280px] overflow-hidden">
                      <Image
                        src={service.image}
                        alt={service.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-${index % 2 === 0 ? 'r' : 'l'} from-transparent to-white/10`} />
                      {/* Floating badge */}
                      <div className="absolute top-4 left-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${service.gradient} shadow-lg`}>
                          {service.stats}
                        </span>
                      </div>
                    </div>

                    {/* Content side */}
                    <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
                      <div className={`w-14 h-14 rounded-2xl ${service.bgLight} ${service.textColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                        {service.icon}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-welsh-red group-hover:to-welsh-green transition-all duration-300">
                        {service.title}
                      </h3>
                      <p className="text-base text-slate-600 leading-relaxed mb-6">{service.description}</p>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${service.gradient} group-hover:shadow-lg transition-all duration-300`}>
                          Explore Service
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links Grid - colourful compact cards */}
      <section className="py-16 sm:py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(185,28,28,0.1),transparent_70%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-in-up">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Quick Access</h2>
              <p className="mt-3 text-slate-400">Jump directly to any service</p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((service, i) => (
              <AnimateOnScroll key={service.href + '-quick'} animation="scale-in" delay={i * 80}>
                <Link
                  href={service.href}
                  className="group relative overflow-hidden rounded-2xl p-6 bg-white/5 border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.gradient} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {service.icon}
                  </div>
                  <h3 className="font-semibold text-white text-sm sm:text-base group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                    {service.title}
                  </h3>
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-white mt-2 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </AnimateOnScroll>
            ))}

            {/* Extra card - Contact */}
            <AnimateOnScroll animation="scale-in" delay={services.length * 80}>
              <Link
                href="/contact"
                className="group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-welsh-red/20 to-welsh-green/20 border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-welsh-red to-welsh-green text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg animate-pulse-glow">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white text-sm sm:text-base">Get in Touch</h3>
                <p className="text-xs text-slate-400 mt-1">Free assessment</p>
              </Link>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-welsh-red to-welsh-green" />
        <div className="absolute inset-0 bg-[url('/images/services-overview.jpg')] bg-cover bg-center opacity-10" />
        {/* Animated floating shapes */}
        <div className="absolute top-10 left-20 w-32 h-32 border-2 border-white/20 rounded-full animate-float" />
        <div className="absolute bottom-10 right-20 w-20 h-20 border-2 border-white/10 rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-lg rotate-45 animate-float" style={{ animationDelay: '2s' }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimateOnScroll animation="scale-in">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Discuss Your Care Needs?
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              We offer free, no-obligation assessments. Our team is here to help you find
              the right care solution for you and your family.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-welsh-red font-bold rounded-xl hover:bg-slate-50 transition-all duration-300 text-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Contact Us Today
                <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/compliance"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-300 text-lg border border-white/30"
              >
                Our Standards
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>
    </>
  );
}

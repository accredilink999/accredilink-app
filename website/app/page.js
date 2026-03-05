import Link from 'next/link';
import Image from 'next/image';
import AnimateOnScroll from '@/components/AnimateOnScroll';

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://accredilinkcare.co.uk/#website",
  name: "Accredilink Community Response Taskforce",
  url: "https://accredilinkcare.co.uk",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://accredilinkcare.co.uk/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const services = [
  {
    title: 'Domiciliary Care',
    description: 'Personal care, medication support, and daily living assistance in the comfort of your own home.',
    href: '/services/domiciliary-care',
    image: '/images/domiciliary-care.jpg',
    gradient: 'from-red-500 to-rose-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: 'Respite Care',
    description: 'Short-term relief for family carers, giving you a well-deserved break while your loved one is cared for.',
    href: '/services/respite-care',
    image: '/images/respite-care.jpg',
    gradient: 'from-pink-500 to-rose-500',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: 'Emergency Response',
    description: 'Rapid response care with our own trained emergency care responders available around the clock.',
    href: '/services/emergency-response',
    image: '/images/emergency-response.jpg',
    gradient: 'from-amber-500 to-orange-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Palliative Care',
    description: 'Compassionate end-of-life support, ensuring dignity and comfort for patients and their families.',
    href: '/services/palliative-care',
    image: '/images/palliative-care.jpg',
    gradient: 'from-emerald-500 to-green-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
  {
    title: 'Sit-in Services',
    description: 'Companionship and supervision so family carers can take time for appointments, errands, or rest.',
    href: '/services/sit-in-services',
    image: '/images/sitin-services.jpg',
    gradient: 'from-purple-500 to-violet-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    title: 'Training',
    description: 'Professional care training and pre-hospital emergency care courses for individuals and organisations.',
    href: '/services/training',
    image: '/images/training.jpg',
    gradient: 'from-teal-500 to-cyan-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Event Medical Services',
    description: 'Professional medical cover for community events, festivals, and sporting fixtures across North Wales.',
    href: '/services/event-medical-services',
    image: '/images/event-medical.jpg',
    gradient: 'from-rose-500 to-red-700',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 0v4m0-4h4m-4 0H8" />
      </svg>
    ),
  },
];

const strengths = [
  {
    title: 'Emergency Care Responders',
    description: 'We have our own qualified emergency care responders on shift, providing rapid response when it matters most.',
    gradient: 'from-amber-500 to-orange-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    title: 'CIW Regulated',
    description: 'Fully registered and regulated by Care Inspectorate Wales, meeting the highest standards of care delivery.',
    gradient: 'from-welsh-red to-red-500',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
  {
    title: 'Local Welsh Team',
    description: 'A dedicated team rooted in the communities of Denbighshire, Conwy, and Wrexham — we know and care about our area.',
    gradient: 'from-welsh-green to-emerald-500',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Trained & Qualified Staff',
    description: 'Every carer is fully trained, DBS checked, and supported with ongoing professional development including emergency care skills.',
    gradient: 'from-blue-500 to-indigo-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Welsh-inspired accent bars */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-welsh-red via-amber-400 via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(185,28,28,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(22,101,52,0.15),transparent_50%)]" />
        {/* Floating decorative blurs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-welsh-red/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-welsh-green/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <AnimateOnScroll animation="fade-in-down" delay={0}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-sm text-white/80 mb-6">
                  <svg className="w-4 h-4 text-welsh-green-light" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
                  </svg>
                  Regulated by Care Inspectorate Wales
                </div>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-in-up" delay={200}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                  Compassionate Care,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-green-400">
                    Right at Home
                  </span>
                </h1>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-in-up" delay={400}>
                <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl">
                  Professional domiciliary care, emergency response, and specialist support services
                  across Denbighshire, Conwy, and Wrexham. As a not-for-profit organisation, every penny goes back into the care we deliver.
                </p>
              </AnimateOnScroll>

              <AnimateOnScroll animation="fade-in-up" delay={600}>
                <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-welsh-red to-red-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-500 transition-all duration-300 text-base hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5"
                  >
                    Get in Touch
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center px-6 py-3.5 bg-white/10 backdrop-blur text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 text-base border border-white/20"
                  >
                    Our Services
                  </Link>
                </div>
              </AnimateOnScroll>
            </div>

            <AnimateOnScroll animation="scale-in" delay={300}>
              <div className="relative h-56 sm:h-72 lg:h-96 rounded-2xl overflow-hidden shadow-2xl mt-8 lg:mt-0">
                <Image src="/images/hero-home.jpg" alt="Compassionate care services in North Wales" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Registered Providers & Not For Profit */}
      <section className="py-10 sm:py-14 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-in-up">
            <div className="text-center mb-8">
              <p className="text-sm font-semibold text-welsh-red uppercase tracking-wider mb-2">Not-For-Profit Organisation</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Trusted & Registered Provider</h2>
              <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
                As a not-for-profit organisation, every penny goes back into delivering quality care for our community. We are proud to be a registered provider for:
              </p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { src: '/images/denbighshire-logo.svg', alt: 'Denbighshire County Council', name: 'Denbighshire County Council', isImg: true },
              { src: '/images/nhs-logo.png', alt: 'NHS Wales', name: 'NHS Wales', isImg: false },
              { src: '/images/bcuhb-logo.png', alt: 'Betsi Cadwaladr University Health Board', name: 'Betsi Cadwaladr University Health Board', isImg: false },
            ].map((provider, i) => (
              <AnimateOnScroll key={provider.name} animation="scale-in" delay={i * 150}>
                <div className="flex flex-col items-center p-6 bg-slate-50 rounded-2xl border border-slate-200 card-interactive cursor-default">
                  <div className="relative w-48 h-16 mb-4">
                    {provider.isImg ? (
                      <img src={provider.src} alt={provider.alt} className="w-full h-full object-contain" />
                    ) : (
                      <Image src={provider.src} alt={provider.alt} fill className="object-contain" />
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 text-center">{provider.name}</h3>
                  <p className="text-sm text-slate-500 text-center mt-1">Registered Care Provider</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold text-welsh-red uppercase tracking-wider mb-3">What We Offer</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Our Services</h2>
              <p className="mt-4 text-lg text-slate-600">
                From daily domiciliary care to emergency response — we provide a comprehensive range
                of care and support services.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => (
              <AnimateOnScroll key={service.href} animation="fade-in-up" delay={i * 100}>
                <Link
                  href={service.href}
                  className="group rounded-2xl border border-slate-200 hover:border-transparent bg-white card-interactive relative overflow-hidden flex flex-col"
                >
                  {/* Image */}
                  <div className="relative h-40 sm:h-44 overflow-hidden">
                    <Image src={service.image} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {/* Icon badge */}
                    <div className={`absolute bottom-3 left-4 w-10 h-10 rounded-lg bg-gradient-to-br ${service.gradient} text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      {service.icon}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-welsh-red group-hover:to-welsh-green transition-all duration-300">{service.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">{service.description}</p>
                    <div className="mt-3 flex items-center gap-1 text-sm font-medium text-welsh-red opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      Learn more
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 sm:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <p className="text-sm font-semibold text-welsh-green uppercase tracking-wider mb-3">Why Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Why Choose Accredilink?</h2>
              <p className="mt-4 text-lg text-slate-600">
                More than just a care provider — we are a community response taskforce with specialist capabilities.
              </p>
            </div>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
              {strengths.map((item, i) => (
                <AnimateOnScroll key={item.title} animation={i % 2 === 0 ? 'slide-in-left' : 'slide-in-right'} delay={i * 150}>
                  <div className="flex gap-4 p-6 bg-white rounded-2xl border border-slate-200 card-interactive relative overflow-hidden group">
                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.gradient} transform scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-top`} />
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
            <AnimateOnScroll animation="scale-in" delay={300} className="lg:col-span-2">
              <div className="relative h-56 sm:h-64 lg:h-80 rounded-2xl overflow-hidden shadow-xl mt-6 lg:mt-0">
                <Image src="/images/why-choose-us.jpg" alt="Professional care team" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Coverage Banner */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/welsh-landscape.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-welsh-green/90 to-welsh-green-light/90" />
        </div>
        {/* Floating shapes */}
        <div className="absolute top-10 right-20 w-24 h-24 border-2 border-white/20 rounded-full animate-float" />
        <div className="absolute bottom-10 left-20 w-16 h-16 border-2 border-white/10 rounded-full animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <AnimateOnScroll animation="fade-in-up">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Serving Our Community</h2>
            <p className="text-lg text-green-100 max-w-2xl mx-auto mb-8">
              We provide care services across Denbighshire, Conwy, and Wrexham.
              Whether you need regular domiciliary care or emergency response, our local team is ready.
            </p>
          </AnimateOnScroll>
          <div className="flex flex-wrap justify-center gap-4">
            {['Denbighshire', 'Conwy', 'Wrexham'].map((area, i) => (
              <AnimateOnScroll key={area} animation="scale-in" delay={i * 150}>
                <Link href={`/areas/${area.toLowerCase()}`} className="px-6 py-3 bg-white/20 backdrop-blur rounded-full text-sm font-medium hover:bg-white/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
                  {area}
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
          <AnimateOnScroll animation="fade-in-up" delay={500}>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center mt-8 px-6 py-3 bg-white text-welsh-green font-semibold rounded-xl hover:bg-green-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Contact Us Today
            </Link>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Latest Guides & Resources */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-sm font-semibold text-welsh-red uppercase tracking-wider mb-3">Resources</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">Helpful Guides</h2>
              <p className="mt-4 text-lg text-slate-600">Free advice and information to help you navigate care options in North Wales.</p>
            </div>
          </AnimateOnScroll>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { href: '/blog/how-to-arrange-domiciliary-care-in-wales', title: 'How to Arrange Domiciliary Care in Wales', desc: 'Complete guide to setting up home care — assessments, funding, and choosing a provider.' },
              { href: '/blog/understanding-care-funding-in-wales', title: 'Understanding Care Funding in Wales', desc: 'Local authority funding, direct payments, Attendance Allowance and NHS CHC explained.' },
              { href: '/blog/what-is-respite-care', title: 'What Is Respite Care?', desc: 'How respite care works, who it\'s for, and how to arrange it in Denbighshire.' },
              { href: '/areas/denbighshire/respite-care-at-home', title: 'Respite Care at Home in Denbighshire', desc: 'In-home respite services across Denbighshire — flexible support for family carers.' },
              { href: '/areas/denbighshire/hospital-discharge-care', title: 'Hospital Discharge Care', desc: 'Safe transition home from hospital with professional domiciliary care support.' },
              { href: '/blog/home-care-denbighshire-guide', title: 'Home Care in Denbighshire Guide', desc: 'Everything you need to know about arranging home care locally.' },
            ].map((item, i) => (
              <AnimateOnScroll key={item.href} animation="fade-in-up" delay={i * 100}>
                <Link href={item.href} className="block p-5 rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all group">
                  <h3 className="font-semibold text-slate-900 group-hover:text-welsh-red transition-colors mb-2 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </Link>
              </AnimateOnScroll>
            ))}
          </div>
          <AnimateOnScroll animation="fade-in-up" delay={300}>
            <div className="text-center mt-8">
              <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm font-medium text-welsh-red hover:underline">
                View all guides
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Trustpilot */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimateOnScroll animation="fade-in-up">
            <div className="text-center">
              <a
                href="https://www.trustpilot.com/review/accredilinkcare.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-6 py-4 hover:shadow-lg hover:border-[#00B67A] transition-all group"
              >
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#00B67A]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                    </svg>
                  ))}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-[#00B67A] transition-colors">Review us on Trustpilot</p>
                  <p className="text-xs text-slate-500">Share your experience with Accredilink</p>
                </div>
                <svg className="w-4 h-4 text-slate-400 group-hover:text-[#00B67A] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimateOnScroll animation="slide-in-left">
              <div className="relative h-48 sm:h-56 lg:h-64 rounded-2xl overflow-hidden shadow-xl mb-8 lg:mb-0">
                <Image src="/images/testimonial.jpg" alt="Happy families we support" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent" />
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll animation="slide-in-right">
              <div className="text-center lg:text-left">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  Need Care Support?
                </h2>
                <p className="text-lg text-slate-600 mb-6 max-w-2xl mx-auto lg:mx-0">
                  Get in touch to discuss your care needs. We offer free, no-obligation assessments
                  and can tailor our services to suit you and your family.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-welsh-red to-red-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-red-500/25 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Get in Touch
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-welsh-red/30 hover:bg-red-50/50 transition-all duration-300"
                  >
                    View All Services
                  </Link>
                </div>
                <p className="text-sm text-slate-500 text-center lg:text-left">
                  Or email us at{' '}
                  <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-welsh-red font-medium hover:underline">
                    enquiries@accredilinkcare.co.uk
                  </a>
                </p>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </>
  );
}

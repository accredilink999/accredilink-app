import Link from 'next/link';
import Image from 'next/image';

export default function ServicePageLayout({ title, description, features, whoIsItFor, icon, imageSrc, ourApproach, standardsItems, personalChoiceContent, slug }) {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: title,
    description: description,
    provider: {
      "@type": "HomeHealthCareService",
      "@id": "https://accredilinkcare.co.uk/#localbusiness",
      name: "Accredilink Community Response Taskforce",
    },
    areaServed: [
      { "@type": "County", name: "Denbighshire" },
      { "@type": "County", name: "Conwy" },
      { "@type": "County", name: "Wrexham" },
    ],
    ...(slug ? { url: `https://accredilinkcare.co.uk/services/${slug}` } : {}),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://accredilinkcare.co.uk" },
      { "@type": "ListItem", position: 2, name: "Services", item: "https://accredilinkcare.co.uk/services" },
      { "@type": "ListItem", position: 3, name: title, ...(slug ? { item: `https://accredilinkcare.co.uk/services/${slug}` } : {}) },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {/* Breadcrumb nav */}
      <nav aria-label="Breadcrumb" className="bg-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500">
            <li><Link href="/" className="hover:text-welsh-red transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link href="/services" className="hover:text-welsh-red transition-colors">Services</Link></li>
            <li>/</li>
            <li className="text-slate-700 font-medium">{title}</li>
          </ol>
        </div>
      </nav>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(185,28,28,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <Link href="/services" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Services
          </Link>
          <div className="flex items-start gap-4">
            {icon && (
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center text-white flex-shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">{title}</h1>
              <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Image */}
      {imageSrc && (
        <section className="py-8 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-lg">
              <Image src={imageSrc} alt={title} fill className="object-cover" />
            </div>
          </div>
        </section>
      )}

      {/* Our Approach */}
      {ourApproach && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Our Approach</h2>
            <div className="max-w-4xl">
              {ourApproach.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-lg text-slate-600 leading-relaxed mb-4 last:mb-0">{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* What's Included */}
      <section className={`py-16 sm:py-20 ${ourApproach ? 'bg-slate-50' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">What We Provide</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                <svg className="w-5 h-5 text-welsh-green mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Your Choices, Your Care */}
      {personalChoiceContent && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-welsh-green/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Your Choices, Your Care</h2>
                </div>
                {personalChoiceContent.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-lg text-slate-600 leading-relaxed mb-4 last:mb-0">{paragraph}</p>
                ))}
              </div>
              <div className="flex items-center justify-center">
                <div className="w-full max-w-xs p-6 rounded-2xl bg-gradient-to-br from-welsh-green/5 to-welsh-green/10 border border-welsh-green/20">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-welsh-green/10 flex items-center justify-center">
                      <svg className="w-8 h-8 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-welsh-green">Person-Centred</p>
                    <p className="text-xs text-slate-500 mt-1">Every care plan is built around the individual</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Standards & Compliance */}
      {standardsItems && standardsItems.length > 0 && (
        <section className="py-16 sm:py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-welsh-red/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-welsh-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Standards & Compliance</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {standardsItems.map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Who Is It For */}
      {whoIsItFor && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Who Is This For?</h2>
                {whoIsItFor.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-lg text-slate-600 leading-relaxed mb-4 last:mb-0">{paragraph}</p>
                ))}
              </div>
              {icon && (
                <div className="flex justify-center lg:justify-end">
                  <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-3xl bg-gradient-to-br from-welsh-red/10 via-white to-welsh-green/10 border border-slate-200 shadow-sm flex items-center justify-center">
                    <div className="text-welsh-red w-20 h-20 sm:w-24 sm:h-24 [&>svg]:w-full [&>svg]:h-full">
                      {icon}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Interested in {title}?
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Get in touch for a free, no-obligation discussion about how we can help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import Link from 'next/link';
import Image from 'next/image';

export default function LocationPageLayout({
  name,
  county,
  description,
  challenges,
  localInfo,
  services,
  nearbyAreas,
}) {
  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/welsh-landscape.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90" />
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <Link href="/areas" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Areas
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Care Services in {name}
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">{description}</p>
          {county && (
            <p className="mt-2 text-sm text-slate-400">
              Part of our {county} coverage area
            </p>
          )}
        </div>
      </section>

      {/* Local Care Challenges */}
      {challenges && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              Care Needs in {name}
            </h2>
            <div className="prose prose-slate max-w-3xl">
              <p className="text-slate-600 leading-relaxed">{challenges}</p>
            </div>
          </div>
        </section>
      )}

      {/* Services Available */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
            Services We Provide in {name}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(services || [
              { name: 'Domiciliary Care', href: '/services/domiciliary-care' },
              { name: 'Respite Care', href: '/services/respite-care' },
              { name: 'Sit-in Services', href: '/services/sit-in-services' },
              { name: 'Emergency Response', href: '/services/emergency-response' },
              { name: 'Social Care', href: '/services/social-care' },
              { name: 'Palliative Care', href: '/services/palliative-care' },
            ]).map(service => (
              <Link
                key={service.href}
                href={service.href}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all"
              >
                <svg className="w-5 h-5 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-700 font-medium">{service.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Local Info */}
      {localInfo && (
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Local Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {localInfo.hospital && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-2">Local Hospital</h3>
                  <p className="text-sm text-slate-600">{localInfo.hospital}</p>
                </div>
              )}
              {localInfo.gp && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-2">GP Practices</h3>
                  <p className="text-sm text-slate-600">{localInfo.gp}</p>
                </div>
              )}
              {localInfo.council && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-2">Local Authority</h3>
                  <p className="text-sm text-slate-600">{localInfo.council}</p>
                </div>
              )}
              {localInfo.funding && (
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <h3 className="font-semibold text-slate-900 mb-2">Care Funding</h3>
                  <p className="text-sm text-slate-600">{localInfo.funding}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Nearby Areas */}
      {nearbyAreas && nearbyAreas.length > 0 && (
        <section className="py-12 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="font-semibold text-slate-900 mb-4">We also cover nearby areas:</h3>
            <div className="flex flex-wrap gap-2">
              {nearbyAreas.map(area => (
                <Link
                  key={area.href}
                  href={area.href}
                  className="px-4 py-2 bg-white rounded-full border border-slate-200 text-sm text-slate-600 hover:border-welsh-red/30 hover:text-welsh-red transition-colors"
                >
                  {area.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Schema section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Frequently Asked Questions — {name}
          </h2>
          <div className="space-y-4">
            <details className="group p-4 bg-slate-50 rounded-xl border border-slate-200">
              <summary className="font-medium text-slate-900 cursor-pointer">
                Do you provide care in {name}?
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Yes, we provide a full range of care services in {name} and the surrounding area, including
                domiciliary care, respite care, emergency response, and more. Contact us to discuss your needs.
              </p>
            </details>
            <details className="group p-4 bg-slate-50 rounded-xl border border-slate-200">
              <summary className="font-medium text-slate-900 cursor-pointer">
                How do I arrange care in {name}?
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Simply contact us by phone or through our website. We'll arrange a free, no-obligation
                assessment to understand your needs and create a personalised care plan.
              </p>
            </details>
            <details className="group p-4 bg-slate-50 rounded-xl border border-slate-200">
              <summary className="font-medium text-slate-900 cursor-pointer">
                Can I get funded care in {name}?
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Care funding may be available through your local authority. We can help guide you through the
                assessment process. Visit our <Link href="/compliance#funding" className="text-welsh-red hover:underline">funding guidance</Link> page for more details.
              </p>
            </details>
            <details className="group p-4 bg-slate-50 rounded-xl border border-slate-200">
              <summary className="font-medium text-slate-900 cursor-pointer">
                Do you offer emergency care in {name}?
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Yes, we have our own trained emergency care responders who can provide rapid response in {name} and across our coverage area.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-welsh-red to-welsh-red-light text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Need Care in {name}?
          </h2>
          <p className="text-lg text-red-100 mb-8">
            Contact us today for a free, no-obligation assessment. We're local, we're CIW regulated, and we're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-welsh-red font-semibold rounded-xl hover:bg-red-50 transition-colors">
              Get in Touch
            </Link>
            <a href="tel:01745000000" className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors">
              Call 01745 000 000
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

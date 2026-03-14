import Link from 'next/link';

export const metadata = {
  title: 'Home Care in Denbigh | Local Carers You Can Trust',
  description: 'Professional home care in Denbigh from your local CIW-regulated provider. Personal care, dementia support & emergency response. Call 01824 538688.',
  alternates: {
    canonical: "https://accredilinkcare.co.uk/areas/denbigh/home-care",
  },
};

export default function HomeCareInDenbigh() {
  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Accredilink Community Response Taskforce',
    description: 'Professional home care services in Denbigh and surrounding villages. CIW regulated domiciliary care, dementia care, overnight care, hospital discharge care, and emergency response.',
    url: 'https://accredilinkcare.co.uk/areas/denbigh/home-care',
    telephone: '01824 538688',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'The Hummingbird, 27-29 High St',
      addressLocality: 'Denbigh',
      addressRegion: 'Denbighshire',
      postalCode: 'LL16 3HY',
      addressCountry: 'GB',
    },
    areaServed: {
      '@type': 'Place',
      name: 'Denbigh',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    priceRange: '$$',
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What home care services are available in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Accredilink provides a full range of home care services in Denbigh including domiciliary care (personal care, medication, meals), dementia care, overnight care (waking night and sleep-in), respite care, emergency response, palliative care, and hospital discharge support. All services are CIW regulated and delivered by locally based carers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Accredilink actually based in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Accredilink Community Response Taskforce is based at The Hummingbird, 27-29 High Street, Denbigh LL16 3HY. We are a truly local provider — our office is in the heart of the town, and many of our carers live in and around Denbigh and the Vale of Clwyd.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you cover villages around Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We serve Denbigh and all surrounding villages including Henllan, Llanrhaeadr, Bodfari, Trefnant, Llandyrnog, St Asaph, and communities throughout the Vale of Clwyd. Our local knowledge means we can reach even the most rural properties reliably.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I get council-funded home care through Accredilink in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We work with Denbighshire County Council and accept council-funded care packages. You can also arrange care privately or use a combination of both. Contact Denbighshire Social Services for a needs assessment, or call us on 01824 538688 and we can guide you through the process.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you have Welsh-speaking carers in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We are committed to the Active Offer under the More Than Just Words framework, meaning we proactively offer care in Welsh. Many of our Denbigh-based carers are fluent Welsh speakers, ensuring individuals who prefer to communicate in Welsh can receive care in their first language.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I arrange home care in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Call us on 01824 538688. We will discuss your needs, arrange an assessment (usually at your home), and build a care plan tailored to you. We can often start care within days — or on the same day in an emergency. There is no minimum care package.',
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-welsh-red" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          <span className="inline-block px-3 py-1 bg-welsh-red/20 text-welsh-red-light text-sm font-semibold rounded-full mb-4 border border-welsh-red/30">
            Your Local Care Provider
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Home Care in Denbigh
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-8">
            Professional, compassionate home care from a team based right here on Denbigh High Street. We are your neighbours, and we look after Denbigh like it is our own family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="tel:01824538688"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors text-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              01824 538688
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Truly Local */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">A Truly Local Home Care Provider in Denbigh</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Accredilink Community Response Taskforce is not a distant agency sending carers from miles away. We are based at The Hummingbird, 27-29 High Street &mdash; right in the centre of Denbigh. When you look out of your window in the morning and see one of our carers walking up the street, chances are they live just a few roads away. That matters, because local carers understand Denbigh in a way that outsiders cannot.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We know the steep lanes around Denbigh Castle and the winding roads through the Vale of Clwyd. We know which properties are tricky to find on dark winter evenings and which of the villages around Denbigh can be cut off in bad weather. Most importantly, we know the people. Many of our carers have grown up in Denbighshire. They share the same community, the same values, and often the same language as the people they look after.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Being local also means being accountable. You can walk into our office on the High Street and speak to the team face to face. If you have a concern, you are not calling a distant call centre &mdash; you are speaking to people who live and work in your town. That kind of accessibility and trust is something we take seriously.
            </p>
          </div>
        </div>
      </section>

      {/* Services Available */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Home Care Services Available in Denbigh</h2>
          <p className="text-slate-600 text-lg mb-8">
            We provide a comprehensive range of care services in Denbigh, all delivered by CIW-regulated carers who are trained, vetted, and registered with Social Care Wales. Whether you need a single daily visit or round-the-clock support, we build your care package around your needs.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Domiciliary Care',
                desc: 'Regular visits for personal care, medication management, meal preparation, and daily living support. The foundation of most home care packages in Denbigh.',
                link: '/services/domiciliary-care',
                linkText: 'domiciliary care',
              },
              {
                title: 'Dementia Care',
                desc: 'Specialist person-centred support for people living with Alzheimer\'s, vascular dementia, and other cognitive conditions. Trained carers who understand the unique challenges of dementia.',
                link: '/areas/denbigh/dementia-care',
                linkText: 'dementia care in Denbigh',
              },
              {
                title: 'Overnight Care',
                desc: 'Waking night and sleep-in care for those who need support during the night &mdash; whether for falls risk, dementia wandering, medication, or simply peace of mind.',
                link: '/areas/denbigh/overnight-care',
                linkText: 'overnight care in Denbigh',
              },
              {
                title: 'Respite Care',
                desc: 'Planned or short-notice cover for family carers who need a break. We step in so you can rest, knowing your loved one is in safe, professional hands.',
                link: '/services/respite-care',
                linkText: 'respite care',
              },
              {
                title: 'Emergency Response',
                desc: 'Same-day urgent care from PHEC-qualified emergency responders. Falls, hospital discharge, carer breakdown &mdash; we respond when the unexpected happens.',
                link: '/services/emergency-response',
                linkText: 'emergency response',
              },
              {
                title: 'Palliative Care',
                desc: 'Compassionate end-of-life care at home, working alongside district nurses and the palliative care team to ensure comfort and dignity in the final stage of life.',
                link: '/services/palliative-care',
                linkText: 'palliative care',
              },
              {
                title: 'Hospital Discharge Care',
                desc: 'Fast-track care packages to get your loved one home safely from Glan Clwyd Hospital or Denbigh Infirmary, with support from the very first day.',
                link: '/areas/denbighshire/emergency-home-care',
                linkText: 'emergency home care in Denbighshire',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600 mb-3">{item.desc}</p>
                <Link href={item.link} className="text-welsh-red hover:text-welsh-red-light font-medium text-sm inline-flex items-center gap-1">
                  Learn more about {item.linkText}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Knowledge */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Local Knowledge That Makes a Difference</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Denbigh sits at the heart of the Vale of Clwyd, surrounded by rolling farmland, scattered villages, and the dramatic Clwydian Range. It is a beautiful place to live &mdash; but the rural nature of the area creates real challenges when it comes to accessing care. Many older residents live in isolated properties along narrow country lanes, far from the nearest shops, GP surgery, or pharmacy.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our local knowledge extends to the health and social care infrastructure that Denbigh families rely on. We work closely with Denbigh Medical Practice (Bryn Heulog) and Llangwyfan Surgery for medication queries and GP liaison. Denbigh Infirmary, located within the town, provides outpatient and community health services &mdash; and Glan Clwyd Hospital in Bodelwyddan, the main district general hospital, is just a fifteen-minute drive away. When someone is discharged from Glan Clwyd and needs urgent care at home, our team can meet them there.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We also understand the council pathways. Denbighshire County Council Social Services is responsible for adult social care assessments and funding in the area. Whether you are applying for council-funded care, arranging a direct payment, or paying privately, we can guide you through the process and ensure your care starts without unnecessary delay.
            </p>
          </div>
        </div>
      </section>

      {/* Villages Served */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Villages and Communities We Serve Around Denbigh</h2>
          <p className="text-slate-600 text-lg mb-8">
            Our service extends well beyond Denbigh town centre. We provide regular home care visits to residents in the surrounding villages and rural communities, including:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              'Henllan',
              'Llanrhaeadr',
              'Bodfari',
              'Trefnant',
              'Llandyrnog',
              'St Asaph (Llanelwy)',
              'Tremeirchion',
              'Groesffordd Marli',
              'Prion & Saron',
              'Nantglyn',
              'Bylchau',
              'Vale of Clwyd villages',
            ].map((village) => (
              <div key={village} className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-sm border border-slate-100">
                <svg className="w-5 h-5 text-welsh-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-slate-700 font-medium">{village}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 leading-relaxed">
            Rural isolation is a genuine concern for older residents in these communities. Having a care provider who knows the area &mdash; who will not get lost on the way to a farm in Nantglyn or struggle to find a cottage in Bodfari &mdash; makes all the difference to reliability and continuity. Our carers drive these roads every day.
          </p>
        </div>
      </section>

      {/* Welsh Language & Funding */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Welsh Language Carers in Denbigh</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Denbigh has a strong Welsh-speaking community, and many older residents &mdash; particularly those living with dementia or cognitive decline &mdash; feel most comfortable communicating in Welsh. Under the Active Offer (More Than Just Words), we proactively offer care in Welsh without the individual having to request it.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We actively recruit Welsh-speaking carers from the local area. When matching a carer to an individual in Denbigh, language is one of the factors we consider, because being understood in your own language is not a luxury &mdash; it is a fundamental part of receiving good care.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Council-Funded and Private Care</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We accept both council-funded and privately arranged care packages in Denbigh. If you believe you or a family member may be eligible for funded care, the first step is to contact Denbighshire County Council Social Services for a care needs assessment. If the assessment identifies eligible needs, the council may fund part or all of the care.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Many families choose a combination: council funding for assessed needs, topped up with privately arranged additional visits. Others prefer to arrange all their care privately for maximum flexibility. Whatever your situation, call us on 01824 538688 and we will help you understand the options available to you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Accredilink */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Why Denbigh Families Choose Accredilink</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: 'Based on Denbigh High Street', desc: 'Not an outsider — we are your local care provider, with our office at The Hummingbird, 27-29 High Street.' },
              { title: 'CIW Regulated', desc: 'Registered with Care Inspectorate Wales. Every visit meets national standards for safety, quality, and dignity.' },
              { title: 'PHEC-Trained Emergency Team', desc: 'The only provider in Denbigh with Pre-Hospital Emergency Care qualified responders on shift for urgent situations.' },
              { title: 'Welsh-Speaking Carers', desc: 'Active Offer commitment — care in Welsh without having to ask. We recruit locally and match carers by language preference.' },
              { title: 'Continuity of Care', desc: 'Consistent carers who know you by name, understand your routine, and build a genuine relationship over time.' },
              { title: 'No Minimum Package', desc: 'From a single morning visit to 24-hour overnight care, we build packages around your needs, not ours.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <svg className="w-6 h-6 text-welsh-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Other Areas */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Explore Our Care Services Nearby</h2>
          <p className="text-slate-600 text-lg mb-8">
            We provide home care across Denbighshire and beyond. If you are looking for care in a nearby town, visit our dedicated pages:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/areas/llangollen/home-care" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
              <span className="font-bold text-slate-900">Home Care in Llangollen</span>
              <span className="block text-sm text-slate-500 mt-1">Dee Valley &amp; surrounding areas</span>
            </Link>
            <Link href="/areas/llangollen/dementia-care" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
              <span className="font-bold text-slate-900">Dementia Care in Llangollen</span>
              <span className="block text-sm text-slate-500 mt-1">Specialist dementia support</span>
            </Link>
            <Link href="/areas/denbighshire/emergency-home-care" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
              <span className="font-bold text-slate-900">Emergency Home Care</span>
              <span className="block text-sm text-slate-500 mt-1">Same-day care across Denbighshire</span>
            </Link>
            <Link href="/areas/llangollen/overnight-care" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
              <span className="font-bold text-slate-900">Overnight Care in Llangollen</span>
              <span className="block text-sm text-slate-500 mt-1">Waking night &amp; sleep-in</span>
            </Link>
            <Link href="/areas" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
              <span className="font-bold text-slate-900">All Areas We Cover</span>
              <span className="block text-sm text-slate-500 mt-1">Full service coverage map</span>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions About Home Care in Denbigh</h2>
          <div className="space-y-4">
            {[
              {
                q: 'What home care services are available in Denbigh?',
                a: 'Accredilink provides a full range of home care services in Denbigh including domiciliary care (personal care, medication, meals), dementia care, overnight care (waking night and sleep-in), respite care, emergency response, palliative care, and hospital discharge support. All services are CIW regulated and delivered by locally based carers.',
              },
              {
                q: 'Is Accredilink actually based in Denbigh?',
                a: 'Yes. Accredilink Community Response Taskforce is based at The Hummingbird, 27-29 High Street, Denbigh LL16 3HY. We are a truly local provider — our office is in the heart of the town, and many of our carers live in and around Denbigh and the Vale of Clwyd.',
              },
              {
                q: 'Do you cover villages around Denbigh?',
                a: 'Yes. We serve Denbigh and all surrounding villages including Henllan, Llanrhaeadr, Bodfari, Trefnant, Llandyrnog, St Asaph, and communities throughout the Vale of Clwyd. Our local knowledge means we can reach even the most rural properties reliably.',
              },
              {
                q: 'Can I get council-funded home care through Accredilink in Denbigh?',
                a: 'Yes. We work with Denbighshire County Council and accept council-funded care packages. You can also arrange care privately or use a combination of both. Contact Denbighshire Social Services for a needs assessment, or call us on 01824 538688 and we can guide you through the process.',
              },
              {
                q: 'Do you have Welsh-speaking carers in Denbigh?',
                a: 'Yes. We are committed to the Active Offer under the More Than Just Words framework, meaning we proactively offer care in Welsh. Many of our Denbigh-based carers are fluent Welsh speakers, ensuring individuals who prefer to communicate in Welsh can receive care in their first language.',
              },
              {
                q: 'How do I arrange home care in Denbigh?',
                a: 'Call us on 01824 538688. We will discuss your needs, arrange an assessment (usually at your home), and build a care plan tailored to you. We can often start care within days — or on the same day in an emergency. There is no minimum care package.',
              },
            ].map((item, i) => (
              <details key={i} className="group bg-white rounded-xl border border-slate-200">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-slate-900 font-semibold hover:text-welsh-red transition-colors">
                  <span>{item.q}</span>
                  <svg className="w-5 h-5 flex-shrink-0 ml-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-6 pb-4 text-slate-600 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-welsh-red" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Looking for Home Care in Denbigh?</h2>
          <p className="text-slate-300 text-lg mb-8">
            Whether you need a daily visit, specialist dementia support, or emergency care at short notice, our team is here for you. Call us today for a friendly, no-obligation conversation about your care needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:01824538688"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-welsh-red text-white font-bold rounded-xl hover:bg-welsh-red-light transition-colors text-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              Call 01824 538688
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Contact Us Online
            </Link>
          </div>
          <p className="text-slate-400 text-sm mt-6">
            Accredilink Community Response Taskforce &mdash; The Hummingbird, 27-29 High St, Denbigh LL16 3HY
          </p>
        </div>
      </section>
    </>
  );
}

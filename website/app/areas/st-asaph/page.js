import LocationPageLayout from '@/components/LocationPageLayout';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Home Care in St Asaph | Care Services St Asaph, Denbighshire | Accredilink',
  description:
    'Professional home care and care services in St Asaph (Llanelwy), Denbighshire. CIW regulated domiciliary care, respite, and emergency response. Near Glan Clwyd Hospital. Call 01824 538688.',
  keywords:
    'home care St Asaph, care services St Asaph, domiciliary care St Asaph, carers St Asaph Denbighshire, Llanelwy care',
  openGraph: {
    title: 'Home Care in St Asaph | Accredilink Community Response Taskforce',
    description:
      'CIW regulated home care and domiciliary care services in St Asaph and surrounding areas. Local carers, Welsh language care available.',
    url: 'https://accredilinkcare.co.uk/areas/st-asaph',
    type: 'website',
  },
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/areas/st-asaph',
  },
};

export default function StAsaphPage() {
  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Accredilink Community Response Taskforce — St Asaph',
    description:
      'Professional home care and domiciliary care services in St Asaph (Llanelwy), Denbighshire. CIW regulated local care provider.',
    url: 'https://accredilinkcare.co.uk/areas/st-asaph',
    telephone: '01824 538688',
    email: 'enquiries@accredilinkcare.co.uk',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'The Hummingbird, 27-29 High St',
      addressLocality: 'Denbigh',
      addressRegion: 'Denbighshire',
      postalCode: 'LL16 3HY',
      addressCountry: 'GB',
    },
    areaServed: {
      '@type': 'City',
      name: 'St Asaph',
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: 'Denbighshire',
      },
    },
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do you provide home care in St Asaph?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Accredilink provides a full range of home care services in St Asaph (Llanelwy) and the surrounding area, including domiciliary care, respite care, emergency response, and palliative care. We are CIW regulated and based nearby in Denbigh. Call 01824 538688.',
        },
      },
      {
        '@type': 'Question',
        name: 'How close is your nearest office to St Asaph?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our base at The Hummingbird on Denbigh High Street is approximately 10 minutes from St Asaph by car. Glan Clwyd Hospital in neighbouring Bodelwyddan is even closer, and we regularly support patients being discharged from there back to their homes in St Asaph.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can you help after discharge from Glan Clwyd Hospital?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely. Glan Clwyd Hospital is just minutes from St Asaph. We work closely with Betsi Cadwaladr University Health Board to facilitate safe hospital discharges, providing same-day care packages so patients can return home safely rather than remaining in hospital unnecessarily.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do your carers speak Welsh in St Asaph?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. St Asaph (Llanelwy) has a Welsh-speaking community and we actively recruit Welsh-speaking carers. Under the Active Offer framework, we proactively offer care in Welsh without the individual having to request it.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdLocalBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      {/* Hero Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/welsh-landscape.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90" />
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          <Link
            href="/areas"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Areas
          </Link>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Home Care in St Asaph
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
            Professional care services in Britain&apos;s smallest city. Domiciliary care, respite,
            and emergency response in St Asaph (Llanelwy) and the surrounding Vale of Clwyd.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Part of our <Link href="/areas/denbighshire" className="text-slate-300 hover:text-white underline">Denbighshire</Link> coverage area
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
            >
              Arrange Care in St Asaph
            </Link>
            <a
              href="tel:01824538688"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call 01824 538688
            </a>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            About Our Care Services in St Asaph
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              St Asaph (Llanelwy) holds the distinction of being one of the smallest cities in
              Britain, but its community is close-knit, proud, and rich in history. Home to the
              beautiful St Asaph Cathedral and situated at the confluence of the rivers Elwy and
              Clwyd, this is a place where people have deep roots and strong connections to their
              neighbours.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Accredilink Community Response Taskforce provides professional home care services in
              St Asaph and the surrounding area. As a not-for-profit organisation regulated by Care
              Inspectorate Wales (CIW), we deliver person-centred care that enables people to stay
              safely in their own homes for as long as possible. Our team is based just 10 minutes
              away in Denbigh, meaning we can respond quickly and maintain reliable, consistent care
              visits.
            </p>
            <p className="text-slate-600 leading-relaxed">
              One of the significant advantages for residents of St Asaph is the proximity to Glan
              Clwyd Hospital in nearby Bodelwyddan. This district general hospital is just a few
              minutes&apos; drive away, and we work closely with hospital discharge teams to ensure
              that patients returning home to St Asaph have the care they need from the moment they
              walk through their front door. Whether it is a planned discharge or an urgent same-day
              return, we can arrange appropriate{' '}
              <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">
                domiciliary care
              </Link>{' '}
              quickly and seamlessly.
            </p>
          </div>
        </div>
      </section>

      {/* Local Care Challenges */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Care Needs in St Asaph and Surrounding Communities
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              St Asaph has a growing older population, with many residents over 65 living
              independently in the city and surrounding villages. While the city itself is compact
              and well-served by local amenities, the surrounding rural areas &mdash; including
              Trefnant, Tremeirchion, Cwm, and Bodelwyddan &mdash; present the usual challenges of
              rural North Wales: limited public transport, distance from services, and the risk of
              social isolation for older people living alone.
            </p>
            <p className="text-slate-600 leading-relaxed">
              The proximity to Glan Clwyd Hospital means St Asaph is a natural location for people
              recovering from hospital stays. Post-discharge care is a critical need, as patients
              often return home needing support with personal care, medication management, mobility,
              and meal preparation while they regain their strength. Without proper care in place,
              the risk of readmission increases significantly.
            </p>
            <p className="text-slate-600 leading-relaxed">
              St Asaph also has a notable Welsh-speaking population. The Cathedral and the North
              Wales Music Festival are central to the city&apos;s identity, and the Welsh language is
              part of everyday life for many families. Our carers can deliver care in Welsh as part
              of the Active Offer, ensuring older residents feel comfortable and understood during
              every visit.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Flooding has been a recurring concern in St Asaph, particularly following the
              devastating floods of 2012. For older and vulnerable residents, severe weather events
              can create sudden care needs &mdash; from emergency evacuation support to managing
              medication and personal care when normal routines are disrupted. Our{' '}
              <Link href="/services/emergency-response" className="text-welsh-red hover:text-welsh-red-light font-medium">
                emergency response
              </Link>{' '}
              service is designed to handle exactly these situations.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Services We Provide in St Asaph
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-3xl">
            We offer a full range of CIW regulated home care services in St Asaph and the
            surrounding area, delivered by trained, locally-based carers registered with Social Care
            Wales.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Domiciliary Care',
                href: '/services/domiciliary-care',
                desc: 'Regular home care visits for personal care, medication support, and daily living assistance.',
              },
              {
                name: 'Respite Care',
                href: '/services/respite-care',
                desc: 'Planned breaks for family carers, with professional cover so your loved one is in safe hands.',
              },
              {
                name: 'Sit-in Services',
                href: '/services/sit-in-services',
                desc: 'Companionship and supervision at home while family carers attend appointments or take a break.',
              },
              {
                name: 'Emergency Response',
                href: '/services/emergency-response',
                desc: 'Rapid response to falls, hospital discharge, carer breakdown, and other urgent care situations.',
              },
              {
                name: 'Social Care',
                href: '/services/social-care',
                desc: 'Support with social engagement, community access, and activities to combat loneliness.',
              },
              {
                name: 'Palliative Care',
                href: '/services/palliative-care',
                desc: 'Compassionate end-of-life care at home, working alongside NHS palliative care teams.',
              },
            ].map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className="flex flex-col gap-2 p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-welsh-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-900 font-semibold">{service.name}</span>
                </div>
                <p className="text-sm text-slate-600">{service.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Hospital Discharge Support */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Hospital Discharge Support Near Glan Clwyd Hospital
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Glan Clwyd Hospital in Bodelwyddan is the main district general hospital serving
              Denbighshire, and it is just minutes from St Asaph. Many St Asaph residents are
              treated at Glan Clwyd, and coming home after a hospital stay is a critical transition
              point where the right care makes all the difference.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We work directly with Betsi Cadwaladr University Health Board discharge teams to
              arrange care packages for patients returning home. This might include help with
              personal care and washing, medication management, meal preparation, mobility support,
              and welfare checks. For patients who need more intensive support, we can provide
              multiple daily visits or even overnight care during the initial recovery period.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our proximity to both the hospital and St Asaph means we can respond to discharge
              referrals rapidly &mdash; often on the same day. This helps free hospital beds and
              ensures patients are not kept waiting in hospital for a care package to be arranged.
              Learn more about our{' '}
              <Link href="/areas/denbighshire/hospital-discharge-care" className="text-welsh-red hover:text-welsh-red-light font-medium">
                hospital discharge care in Denbighshire
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Local */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Why Choose Accredilink for Care in St Asaph?
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Minutes Away',
                desc: 'Based in Denbigh, our office is approximately 10 minutes from St Asaph. We can respond quickly to new referrals, changes in need, and emergencies.',
              },
              {
                title: 'CIW Regulated',
                desc: 'Registered with and regulated by Care Inspectorate Wales. All care meets the standards of the Regulation and Inspection of Social Care (Wales) Act 2016.',
              },
              {
                title: 'Not-for-Profit',
                desc: 'As a not-for-profit organisation, every pound is reinvested into care quality, staff training, and community services. We exist to serve, not to profit.',
              },
              {
                title: 'Welsh Language Care',
                desc: 'We proactively offer care in Welsh under the Active Offer framework. Our Welsh-speaking carers ensure first-language Welsh speakers are comfortable and understood.',
              },
              {
                title: 'Consistent Carers',
                desc: 'We assign a small, regular team of carers to each individual so you see familiar, trusted faces at every visit. Continuity is at the heart of what we do.',
              },
              {
                title: 'PHEC-Trained Responders',
                desc: 'Our emergency responders hold Pre-Hospital Emergency Care qualifications alongside their care training, providing a rapid response capability unique in the area.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Info */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Local Information for St Asaph
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-white rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Nearest Hospital</h3>
              <p className="text-sm text-slate-600">
                Glan Clwyd Hospital in Bodelwyddan is just minutes from St Asaph, providing full
                A&amp;E, surgical, and medical services. This is the main district general hospital
                for Denbighshire and one of the closest hospitals to any town in our coverage area.
                We frequently support patients transitioning from Glan Clwyd back to their homes in
                St Asaph.
              </p>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">GP Practices</h3>
              <p className="text-sm text-slate-600">
                The Elwy Valley Surgery in St Asaph provides primary care for the city and
                surrounding area. Additional GP services are available in nearby Denbigh (Denbigh
                Medical Practice) and along the coast in Rhyl and Prestatyn. We coordinate with GP
                practices to ensure care plans align with medical guidance.
              </p>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Local Authority</h3>
              <p className="text-sm text-slate-600">
                Denbighshire County Council is the local authority for St Asaph. The council&apos;s
                adult social care team handles care needs assessments and funding decisions. St Asaph
                sits within the Denbighshire local authority boundary, and residents can access all
                county council social services.
              </p>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Care Funding</h3>
              <p className="text-sm text-slate-600">
                Funded care may be available through Denbighshire County Council following a care
                needs assessment. The Welsh Government caps weekly charges for non-residential care.
                We help families navigate the funding process and can direct you to the right
                contacts. See our{' '}
                <Link href="/funding-guidance" className="text-welsh-red hover:underline">
                  funding guidance
                </Link>{' '}
                page for more information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Frequently Asked Questions &mdash; Care in St Asaph
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Do you provide home care in St Asaph?',
                a: 'Yes. Accredilink provides a full range of home care services in St Asaph (Llanelwy) and the surrounding area, including domiciliary care, respite care, emergency response, and palliative care. We are CIW regulated and based nearby in Denbigh. Call 01824 538688.',
              },
              {
                q: 'How close is your nearest office to St Asaph?',
                a: 'Our base at The Hummingbird on Denbigh High Street is approximately 10 minutes from St Asaph by car. Glan Clwyd Hospital in neighbouring Bodelwyddan is even closer, and we regularly support patients being discharged from there.',
              },
              {
                q: 'Can you help after discharge from Glan Clwyd Hospital?',
                a: 'Absolutely. Glan Clwyd Hospital is just minutes from St Asaph. We work closely with Betsi Cadwaladr University Health Board to facilitate safe hospital discharges, providing same-day care packages so patients can return home safely.',
              },
              {
                q: 'Do your carers speak Welsh in St Asaph?',
                a: 'Yes. St Asaph (Llanelwy) has a Welsh-speaking community and we actively recruit Welsh-speaking carers. Under the Active Offer framework, we proactively offer care in Welsh without the individual having to request it.',
              },
              {
                q: 'What areas around St Asaph do you cover?',
                a: 'We cover St Asaph and surrounding communities including Trefnant, Tremeirchion, Cwm, Bodelwyddan, and the wider Vale of Clwyd. We also serve nearby towns including Denbigh, Rhyl, Abergele, and Prestatyn.',
              },
            ].map((item, i) => (
              <details key={i} className="group bg-slate-50 rounded-xl border border-slate-200">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-slate-900 font-semibold hover:text-welsh-red transition-colors">
                  <span>{item.q}</span>
                  <svg className="w-5 h-5 flex-shrink-0 ml-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-slate-600 leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Areas */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-semibold text-slate-900 mb-4">
            We also cover nearby areas:
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Denbigh', href: '/areas/denbigh' },
              { name: 'Rhyl', href: '/areas/rhyl' },
              { name: 'Abergele', href: '/areas/abergele' },
              { name: 'Prestatyn', href: '/areas/prestatyn' },
              { name: 'Ruthin', href: '/areas/ruthin' },
              { name: 'Colwyn Bay', href: '/areas/colwyn-bay' },
            ].map((area) => (
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

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-welsh-red to-welsh-red-light text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Need Home Care in St Asaph?
          </h2>
          <p className="text-lg text-red-100 mb-8">
            Contact us today for a free, no-obligation care assessment. We are local, CIW regulated,
            and just minutes from St Asaph and Glan Clwyd Hospital.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-white text-welsh-red font-semibold rounded-xl hover:bg-red-50 transition-colors"
            >
              Get in Touch
            </Link>
            <a
              href="tel:01824538688"
              className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Call 01824 538688
            </a>
          </div>
          <p className="text-red-200 text-sm mt-6">
            Accredilink Community Response Taskforce &mdash; The Hummingbird, 27-29 High St, Denbigh LL16 3HY
          </p>
        </div>
      </section>
    </>
  );
}

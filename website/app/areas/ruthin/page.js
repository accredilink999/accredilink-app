import LocationPageLayout from '@/components/LocationPageLayout';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Home Care in Ruthin | Domiciliary Care Ruthin, Denbighshire | Accredilink',
  description:
    'Professional home care and domiciliary care services in Ruthin, Denbighshire. CIW regulated, local carers, respite care, emergency response. Serving Ruthin and the Vale of Clwyd. Call 01824 538688.',
  keywords:
    'home care Ruthin, care services Ruthin, domiciliary care Ruthin, home care Denbighshire, carers Ruthin, respite care Ruthin',
  openGraph: {
    title: 'Home Care in Ruthin | Accredilink Community Response Taskforce',
    description:
      'CIW regulated home care, domiciliary care, and respite services in Ruthin and the Vale of Clwyd. Local carers who know your community.',
    url: 'https://accredilinkcare.co.uk/areas/ruthin',
    type: 'website',
  },
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/areas/ruthin',
  },
};

export default function RuthinPage() {
  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Accredilink Community Response Taskforce — Ruthin',
    description:
      'Professional home care and domiciliary care services in Ruthin, Denbighshire. CIW regulated local care provider serving Ruthin and the Vale of Clwyd.',
    url: 'https://accredilinkcare.co.uk/areas/ruthin',
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
      name: 'Ruthin',
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
        name: 'Do you provide home care in Ruthin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Accredilink Community Response Taskforce provides a full range of home care services in Ruthin and the surrounding Vale of Clwyd. We are CIW regulated and our carers are registered with Social Care Wales. Call 01824 538688 to arrange care.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I arrange domiciliary care in Ruthin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Contact us by phone on 01824 538688 or through our website. We will arrange a free, no-obligation assessment at your home in Ruthin to understand your needs and create a personalised care plan. We can often start care within days of your initial enquiry.',
        },
      },
      {
        '@type': 'Question',
        name: 'What care services are available in Ruthin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We provide domiciliary care, personal care, respite care, sit-in services, emergency response, social care, and palliative care in Ruthin. Our services range from short daily visits to complex 24-hour care packages, all delivered by trained local carers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I get funded care in Ruthin through the council?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Care funding may be available through Denbighshire County Council. You can request a care needs assessment from Denbighshire Social Services. If eligible, the council may fund some or all of your care. The Welsh Government sets a maximum weekly charge for non-residential care. We can guide you through this process.',
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
            Home Care in Ruthin
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
            Professional domiciliary care, respite, and emergency response services in the historic
            market town of Ruthin (Rhuthun) and across the surrounding Vale of Clwyd countryside.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Part of our <Link href="/areas/denbighshire" className="text-slate-300 hover:text-white underline">Denbighshire</Link> coverage area
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
            >
              Arrange Care in Ruthin
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

      {/* Introduction / About Care in Ruthin */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            About Our Care Services in Ruthin
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Ruthin is one of Denbighshire&apos;s most beautiful and historic market towns, nestled
              in the heart of the Vale of Clwyd. With its medieval castle ruins, timber-framed
              buildings, and vibrant community, it is a wonderful place to live. However, for older
              residents and those living with long-term health conditions, accessing the right care
              at the right time can be a real challenge &mdash; particularly for those in the
              scattered villages and farming communities that surround the town.
            </p>
            <p className="text-slate-600 leading-relaxed">
              At Accredilink Community Response Taskforce, we provide professional home care
              services in Ruthin and the surrounding area. As a not-for-profit organisation
              regulated by Care Inspectorate Wales (CIW), we are committed to delivering high-quality,
              person-centred care that enables people to remain safely and comfortably in their own
              homes. Our carers are local, trained, and registered with Social Care Wales.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Whether you need regular domiciliary care visits, short-term respite care to give a
              family carer a break, emergency response when a crisis occurs, or specialist support
              such as palliative care or dementia care, our team in Ruthin is here to help. We work
              closely with Ruthin Community Hospital, local GP practices, and Denbighshire County
              Council to ensure that every care package is coordinated and responsive to changing
              needs.
            </p>
          </div>
        </div>
      </section>

      {/* Local Care Challenges */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Care Needs in Ruthin and the Vale of Clwyd
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Like many rural Welsh towns, Ruthin has an ageing population. Census data shows that a
              significant proportion of residents in the Ruthin ward are over 65, and this
              demographic is growing. Many older people in the area live alone, in properties spread
              across the countryside where public transport is limited and the nearest shops or
              health services may be several miles away.
            </p>
            <p className="text-slate-600 leading-relaxed">
              These rural challenges create specific care needs. Isolation is a significant concern
              &mdash; older people living alone in remote locations can go days without seeing
              another person. Regular care visits provide not only practical support with personal
              care, medication, and meals, but also vital social contact and a safety check. For
              families who live at a distance from their elderly relatives in Ruthin, knowing that a
              trained carer is visiting daily provides enormous peace of mind.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Winter weather can make conditions particularly difficult in the Vale of Clwyd.
              Flooding along the River Clwyd, icy rural lanes, and snowfall on higher ground can all
              affect access. Our local team knows these roads well and plans routes accordingly,
              ensuring that care visits are maintained even in challenging weather conditions.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Ruthin also has a strong Welsh-speaking community. Many older residents have Welsh as
              their first language, and being cared for in their own language is important for
              dignity and comfort. Under the Active Offer framework (More Than Just Words), we
              proactively offer Welsh language care without the individual having to request it. We
              actively recruit Welsh-speaking carers to serve the Ruthin area.
            </p>
          </div>
        </div>
      </section>

      {/* Services Available */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Services We Provide in Ruthin
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-3xl">
            We offer a comprehensive range of home care services in Ruthin, tailored to each
            individual&apos;s needs. All services are CIW regulated and delivered by trained,
            Social Care Wales registered carers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Domiciliary Care',
                href: '/services/domiciliary-care',
                desc: 'Regular personal care visits in your own home, from morning calls to complex care packages.',
              },
              {
                name: 'Respite Care',
                href: '/services/respite-care',
                desc: 'Short-term care to give family carers a well-deserved break from their caring responsibilities.',
              },
              {
                name: 'Sit-in Services',
                href: '/services/sit-in-services',
                desc: 'Companionship and supervision while family carers attend appointments or take time out.',
              },
              {
                name: 'Emergency Response',
                href: '/services/emergency-response',
                desc: 'Rapid response when a care crisis occurs, including falls, hospital discharge, and carer breakdown.',
              },
              {
                name: 'Social Care',
                href: '/services/social-care',
                desc: 'Supporting social engagement, community access, and combating isolation in rural Ruthin.',
              },
              {
                name: 'Palliative Care',
                href: '/services/palliative-care',
                desc: 'Compassionate end-of-life care at home, working with district nurses and the palliative care team.',
              },
            ].map((service) => (
              <Link
                key={service.href}
                href={service.href}
                className="flex flex-col gap-2 p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-welsh-green flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-slate-900 font-semibold">{service.name}</span>
                </div>
                <p className="text-sm text-slate-600">{service.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose a Local Provider */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Why Choose a Local Care Provider in Ruthin?
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              When you need home care in Ruthin, choosing a provider that genuinely knows the area
              makes a significant difference. National care agencies often struggle to recruit and
              retain carers willing to travel into rural Denbighshire, leading to inconsistent
              staffing, late visits, and a lack of continuity.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Accredilink is based at The Hummingbird on Denbigh High Street, just 10 minutes from
              Ruthin town centre. We are a not-for-profit organisation, which means our focus is
              entirely on delivering quality care rather than generating profit. Our carers live
              locally, understand the geography of the Vale of Clwyd, and can navigate to even the
              most remote properties in the surrounding countryside with confidence.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 mt-8">
            {[
              {
                title: 'Consistent Carers',
                desc: 'We match you with a small, consistent team of carers so you see familiar faces at every visit. Continuity builds trust and means your carers understand your routines and preferences.',
              },
              {
                title: 'CIW Regulated',
                desc: 'We are registered with and regulated by Care Inspectorate Wales, meeting the standards set by the Regulation and Inspection of Social Care (Wales) Act 2016.',
              },
              {
                title: 'Welsh Language Care',
                desc: 'Many of our carers speak Welsh fluently. We offer care in Welsh as part of the Active Offer, ensuring first-language Welsh speakers in Ruthin receive care in the language they are most comfortable with.',
              },
              {
                title: 'Not-for-Profit',
                desc: 'As a not-for-profit organisation, every pound we receive is reinvested into care services, staff training, and community support. Your care funding goes directly towards the care you receive.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-100"
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Local Info */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Local Information for Ruthin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Local Hospital</h3>
              <p className="text-sm text-slate-600">
                Ruthin Community Hospital provides outpatient, rehabilitation, and minor injury
                services. For acute care, Glan Clwyd Hospital in Bodelwyddan is approximately 20
                minutes away by car. We support patients being discharged from both facilities back
                to their homes in the Ruthin area.
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">GP Practices</h3>
              <p className="text-sm text-slate-600">
                Ruthin Medical Partnership (Glasdir Surgery) is the main GP practice in the town,
                providing a wide range of primary care services. Nearby practices in Denbigh and
                Corwen also serve patients from the wider Ruthin area. We liaise directly with GP
                surgeries to coordinate care.
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Local Authority</h3>
              <p className="text-sm text-slate-600">
                Denbighshire County Council is the local authority for Ruthin, with County Hall
                located in the town centre. The council&apos;s Social Services department handles care
                needs assessments and funding decisions. Ruthin serves as the administrative centre
                of Denbighshire.
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Care Funding</h3>
              <p className="text-sm text-slate-600">
                You may be eligible for funded care through Denbighshire County Council. Contact
                Denbighshire Social Services to request a care needs assessment. The Welsh Government
                sets a maximum weekly charge for non-residential care services. Visit our{' '}
                <Link
                  href="/funding-guidance"
                  className="text-welsh-red hover:underline"
                >
                  funding guidance
                </Link>{' '}
                page for more details on how care is funded in Wales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Villages and Communities We Serve */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Villages and Communities Around Ruthin We Serve
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            Our care services extend beyond Ruthin town centre to the villages and rural communities
            throughout the Vale of Clwyd. We regularly provide care in:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              'Llanfair Dyffryn Clwyd',
              'Llanbedr Dyffryn Clwyd',
              'Pwllglas',
              'Rhewl',
              'Bontuchel',
              'Cyffylliog',
              'Llandyrnog',
              'Llangynhafal',
              'Llanynys',
              'Graigfechan',
              'Efenechtyd',
              'Clocaenog',
            ].map((village) => (
              <div
                key={village}
                className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-sm border border-slate-100"
              >
                <svg
                  className="w-5 h-5 text-welsh-green flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700 font-medium">{village}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 mt-6">
            If your village is not listed above, please contact us &mdash; we almost certainly cover
            your area. Our carers travel throughout the Vale of Clwyd and beyond to ensure no one
            goes without the care they need.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Frequently Asked Questions &mdash; Home Care in Ruthin
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Do you provide home care in Ruthin?',
                a: 'Yes. Accredilink Community Response Taskforce provides a full range of home care services in Ruthin and the surrounding Vale of Clwyd. We are CIW regulated and our carers are registered with Social Care Wales. Call 01824 538688 to arrange care.',
              },
              {
                q: 'How do I arrange domiciliary care in Ruthin?',
                a: 'Contact us by phone on 01824 538688 or through our website. We will arrange a free, no-obligation assessment at your home in Ruthin to understand your needs and create a personalised care plan. We can often start care within days of your initial enquiry.',
              },
              {
                q: 'What care services are available in Ruthin?',
                a: 'We provide domiciliary care, personal care, respite care, sit-in services, emergency response, social care, and palliative care in Ruthin. Our services range from short daily visits to complex 24-hour care packages, all delivered by trained local carers.',
              },
              {
                q: 'Can I get funded care in Ruthin through the council?',
                a: 'Care funding may be available through Denbighshire County Council. You can request a care needs assessment from Denbighshire Social Services. If eligible, the council may fund some or all of your care. The Welsh Government sets a maximum weekly charge for non-residential care. We can guide you through this process.',
              },
              {
                q: 'Do you offer emergency care in Ruthin?',
                a: 'Yes. Our PHEC-qualified emergency care responders can attend urgent situations in Ruthin and surrounding areas, including hospital discharge support, falls response, and carer breakdown cover. Call 01824 538688 for immediate assistance.',
              },
              {
                q: 'Can I receive care in Welsh in Ruthin?',
                a: 'Absolutely. Many of our carers speak Welsh fluently. Under the Active Offer framework, we proactively offer care in Welsh without you having to ask. This is particularly important for first-language Welsh speakers who feel more comfortable communicating in their mother tongue.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-slate-50 rounded-xl border border-slate-200"
              >
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-slate-900 font-semibold hover:text-welsh-red transition-colors">
                  <span>{item.q}</span>
                  <svg
                    className="w-5 h-5 flex-shrink-0 ml-4 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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
              { name: 'Corwen', href: '/areas/corwen' },
              { name: 'Llangollen', href: '/areas/llangollen' },
              { name: 'Wrexham', href: '/areas/wrexham-town' },
              { name: 'St Asaph', href: '/areas/st-asaph' },
              { name: 'Rhyl', href: '/areas/rhyl' },
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
            Need Home Care in Ruthin?
          </h2>
          <p className="text-lg text-red-100 mb-8">
            Contact us today for a free, no-obligation care assessment. We are local, we are CIW
            regulated, and we are a not-for-profit organisation dedicated to delivering outstanding
            care in the Ruthin area.
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

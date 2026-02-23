import LocationPageLayout from '@/components/LocationPageLayout';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Home Care in Corwen | Care Services Corwen, Denbighshire | Accredilink',
  description:
    'Professional home care and care services in Corwen, Denbighshire. CIW regulated domiciliary care, respite, and emergency response in rural Corwen and the Dee Valley. Call 01824 538688.',
  keywords:
    'home care Corwen, care services Corwen Denbighshire, domiciliary care Corwen, carers Corwen, Dee Valley care services',
  openGraph: {
    title: 'Home Care in Corwen | Accredilink Community Response Taskforce',
    description:
      'CIW regulated home care and domiciliary care services in Corwen and the Dee Valley. Local carers serving rural Denbighshire.',
    url: 'https://accredilinkcare.co.uk/areas/corwen',
    type: 'website',
  },
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/areas/corwen',
  },
};

export default function CorwenPage() {
  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Accredilink Community Response Taskforce — Corwen',
    description:
      'Professional home care and domiciliary care services in Corwen, Denbighshire. CIW regulated local care provider serving the Dee Valley and rural Denbighshire.',
    url: 'https://accredilinkcare.co.uk/areas/corwen',
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
      name: 'Corwen',
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
        name: 'Do you provide home care in Corwen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Accredilink Community Response Taskforce provides a full range of home care services in Corwen and the surrounding Dee Valley area. We are CIW regulated and our carers are registered with Social Care Wales. Call 01824 538688 to arrange care.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Corwen too remote for regular home care visits?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Not at all. We specifically serve rural communities across Denbighshire, including Corwen and the Dee Valley. Our carers are familiar with the area and plan routes to ensure reliable, consistent visits regardless of remoteness. We provide daily care visits to Corwen and surrounding villages.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the nearest hospital to Corwen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The nearest community hospital is Ruthin Community Hospital, approximately 30 minutes away. For acute services, Wrexham Maelor Hospital is around 35 minutes to the east, and Glan Clwyd Hospital in Bodelwyddan is approximately 40 minutes to the north. We support patients being discharged from all these hospitals.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I get care in Welsh in Corwen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely. Corwen is in a strongly Welsh-speaking area, and many of our carers speak Welsh fluently. We proactively offer care in Welsh under the Active Offer framework, which is especially important in the Dee Valley where Welsh is the first language for many older residents.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I arrange domiciliary care in Corwen?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Contact us by phone on 01824 538688 or through our website. We will arrange a free, no-obligation assessment at your home in Corwen. We can often start care within days. You may also be referred to us by Denbighshire Social Services, your GP, or a hospital discharge team.',
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
            Home Care in Corwen
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-300 max-w-2xl leading-relaxed">
            Professional domiciliary care, respite, and emergency response services in Corwen and
            across the Dee Valley. Bringing quality care to one of Denbighshire&apos;s most rural
            communities.
          </p>
          <p className="mt-2 text-sm text-slate-400">
            Part of our <Link href="/areas/denbighshire" className="text-slate-300 hover:text-white underline">Denbighshire</Link> coverage area
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
            >
              Arrange Care in Corwen
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
            About Our Care Services in Corwen
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Corwen is a small market town in the upper Dee Valley, in the far south of
              Denbighshire. Surrounded by the Berwyn Mountains and the rolling hills of rural North
              Wales, it is a place of outstanding natural beauty &mdash; but also one of the most
              geographically isolated communities in the county. For older residents and those living
              with long-term conditions, this remoteness creates real challenges when it comes to
              accessing care and support.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Accredilink Community Response Taskforce is committed to serving communities like
              Corwen that are often overlooked by larger care agencies. As a not-for-profit
              organisation regulated by Care Inspectorate Wales (CIW), we provide a full range of
              home care services to residents of Corwen and the surrounding villages. Our carers
              travel to Corwen and the Dee Valley daily, and we plan our rotas to ensure consistent,
              reliable visits regardless of the distance involved.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We understand that for many people in Corwen, the idea of moving to a care home in a
              distant town is deeply unappealing. People want to stay in their own homes, in the
              community they know, surrounded by the landscape and neighbours that give them comfort.
              That is exactly what our{' '}
              <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">
                domiciliary care
              </Link>{' '}
              service is designed to make possible &mdash; professional, person-centred care
              delivered in your own home, so you can remain where you belong.
            </p>
          </div>
        </div>
      </section>

      {/* Rural Challenges */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Care Challenges in Rural Corwen and the Dee Valley
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Corwen sits at the junction of the A5 and A494, a crossroads that has served
              travellers for centuries. Yet despite its road connections, the town is a significant
              distance from the main centres of population and healthcare in Denbighshire. The
              nearest acute hospital &mdash; either Wrexham Maelor to the east or Glan Clwyd to the
              north &mdash; is over 30 minutes away by car. Public transport is infrequent, and for
              the villages scattered across the Berwyn uplands, a bus service may run only once or
              twice a day.
            </p>
            <p className="text-slate-600 leading-relaxed">
              This isolation has a profound effect on older people. Many residents live alone in
              farmhouses and cottages where the nearest neighbour may be half a mile away. During
              winter, snow on the Berwyn passes and flooding in the Dee Valley can cut off
              communities for hours or even days. Without regular contact, older people are at
              increased risk of falls going unnoticed, medications being missed, and the creeping
              effects of loneliness and social isolation taking their toll on mental and physical
              health.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Regular domiciliary care visits address these challenges directly. A trained carer
              arriving at the same time each day provides not just practical support with personal
              care, medication, and meals, but also a vital welfare check and a moment of human
              connection. For families living at a distance from their elderly relatives in Corwen,
              knowing that a professional carer is visiting gives enormous peace of mind.
            </p>
            <p className="text-slate-600 leading-relaxed">
              The Welsh language is deeply embedded in the Corwen community. The town sits in one
              of the most strongly Welsh-speaking parts of Denbighshire, and for many older
              residents, Welsh is their first and most natural language. Being cared for in Welsh is
              not a luxury &mdash; it is essential for dignity, comfort, and effective communication.
              Under the Active Offer framework, we proactively provide Welsh language care without
              the individual having to ask.
            </p>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            Services We Provide in Corwen
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-3xl">
            We deliver a comprehensive range of CIW regulated home care services in Corwen and the
            Dee Valley, ensuring that rural communities receive the same quality of care as those
            in larger towns.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Domiciliary Care',
                href: '/services/domiciliary-care',
                desc: 'Regular home care visits for personal care, medication support, meal preparation, and daily living assistance.',
              },
              {
                name: 'Respite Care',
                href: '/services/respite-care',
                desc: 'Short-term care to give family carers in Corwen a well-deserved break from their caring responsibilities.',
              },
              {
                name: 'Sit-in Services',
                href: '/services/sit-in-services',
                desc: 'Companionship and supervision while family members attend appointments or take much-needed time for themselves.',
              },
              {
                name: 'Emergency Response',
                href: '/services/emergency-response',
                desc: 'Rapid response to urgent situations including falls, hospital discharge, sudden illness, and carer breakdown.',
              },
              {
                name: 'Social Care',
                href: '/services/social-care',
                desc: 'Combating isolation in rural Corwen through social engagement, community access, and meaningful activities.',
              },
              {
                name: 'Palliative Care',
                href: '/services/palliative-care',
                desc: 'Compassionate end-of-life care at home, allowing people to spend their final days in the community they love.',
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

      {/* Why It Matters in Rural Areas */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Why Home Care Matters in Rural Corwen
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              For many larger care agencies, serving rural areas like Corwen is simply not
              economically viable. The long travel distances between visits, the small population,
              and the challenge of recruiting carers willing to work in remote locations mean that
              national providers often cannot offer reliable service in the Dee Valley. This leaves
              vulnerable people without the care they need, or forces them to move away from their
              community into residential care many miles from home.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Accredilink takes a different approach. As a not-for-profit organisation, our purpose
              is to serve the communities of Denbighshire &mdash; all of them, including the most
              remote. We recruit carers who are willing and able to travel into the Dee Valley, and
              we build our rotas around efficient routes that allow us to serve Corwen, Cynwyd,
              Llandrillo, and surrounding villages without compromising on visit times or
              consistency.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 mt-8">
            {[
              {
                title: 'Consistent, Reliable Visits',
                desc: 'We do not cancel because of distance. Our carers plan their routes to ensure every visit happens on time, every day, regardless of weather or road conditions in the Dee Valley.',
              },
              {
                title: 'Local Knowledge',
                desc: 'Our team knows the roads, the villages, and the communities of the Dee Valley. We understand the geography and can navigate to even the most isolated properties with confidence.',
              },
              {
                title: 'Welsh Language Care',
                desc: 'In a strongly Welsh-speaking area like Corwen, language matters. Our Welsh-speaking carers deliver care in the language that feels most natural to each individual.',
              },
              {
                title: 'Emergency Coverage',
                desc: 'Our PHEC-qualified emergency responders can attend urgent situations in Corwen, providing falls response, hospital discharge support, and crisis care even in this remote area.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
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
            Local Information for Corwen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Nearest Hospitals</h3>
              <p className="text-sm text-slate-600">
                Corwen is relatively distant from acute hospital services. Ruthin Community Hospital
                (approximately 30 minutes) offers outpatient and rehabilitation services. For A&amp;E
                and acute care, Wrexham Maelor Hospital is around 35 minutes to the east, while Glan
                Clwyd Hospital in Bodelwyddan is approximately 40 minutes to the north. We support
                patients being discharged from all these facilities back to Corwen and the Dee
                Valley.
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">GP Practices</h3>
              <p className="text-sm text-slate-600">
                Corwen Health Centre serves the town and surrounding area. The practice provides a
                range of primary care services and is an important healthcare hub for the upper Dee
                Valley. Additional GP services are available in Llangollen and Bala. We coordinate
                with local GP practices to ensure care plans are aligned with medical guidance.
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Local Authority</h3>
              <p className="text-sm text-slate-600">
                Denbighshire County Council is the local authority for Corwen. The border with
                Gwynedd (to the west, including Bala) runs close to the town, but Corwen itself is
                within Denbighshire. Social services and care needs assessments are handled by
                Denbighshire&apos;s adult social care team.
              </p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">Care Funding</h3>
              <p className="text-sm text-slate-600">
                You may be eligible for funded care through Denbighshire County Council following a
                care needs assessment. The Welsh Government caps weekly charges for non-residential
                care. We help families navigate this process. Visit our{' '}
                <Link href="/funding-guidance" className="text-welsh-red hover:underline">
                  funding guidance
                </Link>{' '}
                page for details on care funding in Wales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Villages We Cover */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Villages and Communities Around Corwen We Serve
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            Our care services extend throughout the Dee Valley and surrounding uplands. We
            regularly provide care in these communities:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              'Cynwyd',
              'Llandrillo',
              'Carrog',
              'Glyndyfrdwy',
              'Gwyddelwern',
              'Betws Gwerfil Goch',
              'Melin-y-Wig',
              'Llangar',
              'Cerrigydrudion',
            ].map((village) => (
              <div
                key={village}
                className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-sm border border-slate-100"
              >
                <svg className="w-5 h-5 text-welsh-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700 font-medium">{village}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 mt-6">
            If your village is not listed, please contact us. We are committed to serving rural
            Denbighshire and will do our best to arrange care wherever you are in the Dee Valley and
            surrounding area.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            Frequently Asked Questions &mdash; Home Care in Corwen
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Do you provide home care in Corwen?',
                a: 'Yes. Accredilink provides a full range of home care services in Corwen and the surrounding Dee Valley, including domiciliary care, respite care, emergency response, and palliative care. Call 01824 538688 to discuss your needs.',
              },
              {
                q: 'Is Corwen too remote for regular home care visits?',
                a: 'Not at all. We specifically serve rural communities across Denbighshire. Our carers travel to Corwen and the Dee Valley daily, and we plan routes to ensure reliable, consistent visits regardless of remoteness.',
              },
              {
                q: 'What is the nearest hospital to Corwen?',
                a: 'Ruthin Community Hospital is approximately 30 minutes away. For acute care, Wrexham Maelor Hospital is around 35 minutes east and Glan Clwyd Hospital is about 40 minutes north. We support patients being discharged from all these hospitals.',
              },
              {
                q: 'Can I receive care in Welsh in Corwen?',
                a: 'Absolutely. Corwen is in a strongly Welsh-speaking area. Many of our carers speak Welsh fluently, and we proactively offer care in Welsh under the Active Offer framework. This is especially important for first-language Welsh speakers in the Dee Valley.',
              },
              {
                q: 'How do I arrange domiciliary care in Corwen?',
                a: 'Phone us on 01824 538688 or contact us through our website. We will arrange a free assessment at your home. You can also be referred to us by Denbighshire Social Services, your GP, or a hospital discharge team.',
              },
              {
                q: 'What happens if roads are blocked by snow or flooding?',
                a: 'We plan for adverse weather as part of our operational procedures. Our carers know the local roads and have contingency plans for when conditions are difficult. We prioritise the most vulnerable individuals and maintain communication with families if visits are affected.',
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
              { name: 'Llangollen', href: '/areas/llangollen' },
              { name: 'Ruthin', href: '/areas/ruthin' },
              { name: 'Denbigh', href: '/areas/denbigh' },
              { name: 'Wrexham', href: '/areas/wrexham-town' },
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
            Need Home Care in Corwen?
          </h2>
          <p className="text-lg text-red-100 mb-8">
            Contact us today for a free, no-obligation care assessment. We are committed to serving
            rural Denbighshire, and distance is never a barrier to the care we provide.
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

import Link from 'next/link';

export const metadata = {
  title: 'Overnight Care Denbigh | Waking Night & Sleep-In',
  description: 'Overnight home care in Denbigh — waking night and sleep-in support for safety and peace of mind. CIW regulated. Call Accredilink on 01824 538688.',
  alternates: {
    canonical: "https://accredilinkcare.co.uk/areas/denbigh/overnight-care",
  },
};

export default function OvernightCareInDenbigh() {
  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Accredilink Community Response Taskforce',
    description: 'Overnight home care in Denbigh including waking night care and sleep-in support. CIW regulated overnight care for falls risk, dementia, medication, and peace of mind.',
    url: 'https://accredilinkcare.co.uk/areas/denbigh/overnight-care',
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
        name: 'What is the difference between waking night care and sleep-in care in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Waking night care means a carer stays awake throughout the entire night, providing continuous monitoring and active support. This is suitable for people who need frequent assistance — for example, regular repositioning, medication rounds, or support with dementia-related wandering. Sleep-in care means a carer sleeps in the home overnight but is available to help if needed. This suits people who are generally settled at night but may need occasional assistance, such as help getting to the bathroom or reassurance after waking.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who needs overnight care at home in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Overnight care is beneficial for people at risk of falls during the night, individuals with dementia who may wander or become confused at night, those who need night-time medication administered at specific times, people receiving palliative or end-of-life care, and anyone who experiences anxiety or distress at night. It is also used to support family carers who are exhausted from providing night-time support themselves.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can overnight care in Denbigh be combined with daytime domiciliary care?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Many of our clients in Denbigh receive overnight care as part of a wider care package that includes daytime domiciliary care visits. This provides seamless support across the full 24-hour period. Overnight care can also be arranged as a standalone service if you only need night-time support.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does overnight care cost in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The cost depends on whether you need waking night care (which costs more, as the carer is active all night) or sleep-in care. Both are significantly cheaper than a hospital admission and can be more affordable than residential care when combined with daytime visits. Call 01824 538688 for a personalised quote based on your specific needs.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you have emergency responders available as overnight backup in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Accredilink maintains PHEC-qualified emergency responders on shift who can provide rapid backup to our overnight carers if a situation arises that requires additional support — such as a fall requiring safe lifting, or a medical emergency. Because we are based in Denbigh, our response times are fast.',
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
            Waking Night &amp; Sleep-In Support
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Overnight Care in Denbigh
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-8">
            Professional overnight support in your own home &mdash; whether you need a carer awake all night or simply available if needed. Safety and peace of mind for you and your family.
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

      {/* Two Types of Overnight Care */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Two Types of Overnight Care</h2>
          <p className="text-slate-600 text-lg mb-8">
            Night-time can be the most vulnerable and anxious period for someone who needs care. At Accredilink, we offer two distinct types of overnight support in Denbigh, each designed for different levels of need:
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-welsh-red/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-welsh-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Waking Night Care</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Your carer stays fully awake and alert throughout the entire night, typically from around 10pm to 7am. They actively monitor the individual, provide care as needed, and are immediately available at all times.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                <strong>Best for:</strong> People who need frequent assistance during the night &mdash; regular repositioning in bed, active dementia support for wandering or distress, night-time medication administered at specific intervals, continence care, or end-of-life comfort care.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Waking night care provides the highest level of overnight support and is essential for individuals whose needs cannot wait until they call for help.
              </p>
            </div>
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-welsh-green/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Sleep-In Care</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                Your carer sleeps in the home overnight, in a spare bedroom or suitable sleeping area. They are not actively awake, but they are right there in the house and can be called upon at any point during the night.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                <strong>Best for:</strong> People who are generally settled at night but may need occasional help &mdash; getting up to use the bathroom, reassurance if they wake and feel anxious, assistance after an occasional fall, or simply the comfort of knowing someone is nearby.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Sleep-in care offers peace of mind at a lower cost than waking night care, while still ensuring help is immediately accessible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who Needs Overnight Care */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Who Needs Overnight Care in Denbigh?</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Night-time presents specific challenges that daytime care visits alone cannot address. For many people in Denbigh and the surrounding Vale of Clwyd, overnight care is the missing piece that allows them to remain safely at home rather than moving into residential care. Common reasons families arrange overnight care include:
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 mt-8">
            {[
              {
                title: 'Falls Risk at Night',
                desc: 'Getting up in the dark to use the bathroom is one of the most dangerous moments in an older person\'s day. Disorientation, poor balance, medication effects, and unfamiliar darkness all increase the risk. A night carer provides safe assistance, preventing falls before they happen.',
              },
              {
                title: 'Dementia-Related Night-Time Behaviour',
                desc: 'People with dementia often experience increased confusion, agitation, and wandering at night — a pattern known as sundowning. Without support, they may leave the house, fall, or become severely distressed. Our trained dementia carers provide calm, reassuring support throughout the night.',
              },
              {
                title: 'Night-Time Medication',
                desc: 'Some medications need to be administered at specific times during the night, or at intervals that make it impossible for the person to manage alone. Waking night carers ensure medication schedules are followed precisely.',
              },
              {
                title: 'End-of-Life and Palliative Care',
                desc: 'In the final stages of life, needs can change hour by hour. Families providing palliative care at home often need overnight support to ensure their loved one is comfortable, pain is managed, and someone is there if the situation changes during the night.',
              },
              {
                title: 'Anxiety and Night-Time Distress',
                desc: 'Loneliness and fear at night can be overwhelming, particularly for people who have recently been bereaved, discharged from hospital, or experienced a frightening event. Simply knowing a trusted person is in the house can make the difference between a restful night and hours of anxiety.',
              },
              {
                title: 'Supporting Exhausted Family Carers',
                desc: 'Family carers who are getting up multiple times a night to help their loved one quickly become exhausted. Overnight care allows the family carer to sleep properly, preserving their health and ability to continue caring during the day.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works in Practice */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">How Overnight Care Works in Practice for Denbigh Families</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Arranging overnight care does not need to be complicated. Here is what families in Denbigh can expect when they choose Accredilink for overnight support:
            </p>
            <p className="text-slate-600 leading-relaxed">
              We begin with a thorough assessment of the individual&apos;s needs, paying particular attention to their night-time routine, any specific risks, and what level of overnight support &mdash; waking night or sleep-in &mdash; is most appropriate. We also take into account the layout of the home, as sleep-in care requires a suitable room for the carer.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Your overnight carer will typically arrive in the evening, help with the bedtime routine if needed, and then either remain awake (waking night) or settle in the spare room (sleep-in) for the duration of the night. In the morning, they assist with getting up, personal care, and breakfast before the daytime care team takes over &mdash; or before the individual continues their day independently.
            </p>
            <p className="text-slate-600 leading-relaxed">
              The handover between overnight and daytime carers is seamless. Detailed notes from the night shift are shared with the day team, ensuring everyone is aware of how the night went, any concerns, and anything that needs follow-up. This continuity is one of the benefits of having all your care &mdash; daytime <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> and overnight support &mdash; provided by the same organisation.
            </p>
          </div>
        </div>
      </section>

      {/* Standalone or Combined */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Part of a Wider Care Package</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                For many people in Denbigh, overnight care is one element of a comprehensive care package. Combined with daytime <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> visits, it provides round-the-clock coverage that keeps someone safely at home.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                For those with more advanced needs, overnight care can bridge the gap between regular visiting care and round-the-clock support. If you currently receive daytime visits but are struggling at night, adding overnight support may be the step that prevents a move to residential care.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We also pair overnight care with specialist services such as <Link href="/areas/denbigh/dementia-care" className="text-welsh-red hover:text-welsh-red-light font-medium">dementia care in Denbigh</Link> and <Link href="/services/palliative-care" className="text-welsh-red hover:text-welsh-red-light font-medium">palliative care</Link>, ensuring that the night carer has the training and expertise to meet the individual&apos;s specific condition.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Supporting Independence in the Vale of Clwyd</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                The purpose of overnight care is to support independence, not to replace it. Many of the people we support in Denbigh manage well during the day with minimal assistance. It is the nights that create risk &mdash; the fall on the way to the bathroom, the confusion on waking at 3am, the medication that needs to be given at 2am.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                By addressing these specific night-time vulnerabilities, overnight care allows people to continue living in their own homes in the Vale of Clwyd. It keeps them out of hospital &mdash; avoiding unnecessary admissions to Glan Clwyd that result from night-time falls or incidents &mdash; and delays or prevents the need for residential care.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Our <Link href="/services/emergency-response" className="text-welsh-red hover:text-welsh-red-light font-medium">emergency response</Link> team provides additional backup, with PHEC-qualified responders available if a situation during the night exceeds what the overnight carer can manage alone. This layered approach to night-time safety is unique to Accredilink in the Denbigh area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions About Overnight Care in Denbigh</h2>
          <div className="space-y-4">
            {[
              {
                q: 'What is the difference between waking night care and sleep-in care in Denbigh?',
                a: 'Waking night care means a carer stays awake throughout the entire night, providing continuous monitoring and active support. This is suitable for people who need frequent assistance — for example, regular repositioning, medication rounds, or support with dementia-related wandering. Sleep-in care means a carer sleeps in the home overnight but is available to help if needed. This suits people who are generally settled at night but may need occasional assistance.',
              },
              {
                q: 'Who needs overnight care at home in Denbigh?',
                a: 'Overnight care is beneficial for people at risk of falls during the night, individuals with dementia who may wander or become confused, those who need night-time medication at specific times, people receiving palliative or end-of-life care, and anyone who experiences anxiety or distress at night. It is also used to support family carers who are exhausted from providing night-time support.',
              },
              {
                q: 'Can overnight care in Denbigh be combined with daytime domiciliary care?',
                a: 'Yes. Many of our clients in Denbigh receive overnight care as part of a wider care package that includes daytime domiciliary care visits. This provides seamless support across the full 24-hour period. Overnight care can also be arranged as a standalone service if you only need night-time support.',
              },
              {
                q: 'How much does overnight care cost in Denbigh?',
                a: 'The cost depends on whether you need waking night care (which costs more, as the carer is active all night) or sleep-in care. Both are significantly cheaper than a hospital admission and can be more affordable than residential care when combined with daytime visits. Call 01824 538688 for a personalised quote based on your specific needs.',
              },
              {
                q: 'Do you have emergency responders available as overnight backup in Denbigh?',
                a: 'Yes. Accredilink maintains PHEC-qualified emergency responders on shift who can provide rapid backup to our overnight carers if a situation arises that requires additional support — such as a fall requiring safe lifting, or a medical emergency. Because we are based in Denbigh, our response times are fast.',
              },
            ].map((item, i) => (
              <details key={i} className="group bg-slate-50 rounded-xl border border-slate-200">
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

      {/* Related Pages */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Related Care Services in Denbigh</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/areas/denbigh/home-care" className="block bg-white rounded-xl p-5 hover:shadow-md transition-all border border-slate-200">
              <span className="font-bold text-slate-900">Home Care in Denbigh</span>
              <span className="block text-sm text-slate-500 mt-1">Full range of home care services</span>
            </Link>
            <Link href="/areas/denbigh/dementia-care" className="block bg-white rounded-xl p-5 hover:shadow-md transition-all border border-slate-200">
              <span className="font-bold text-slate-900">Dementia Care in Denbigh</span>
              <span className="block text-sm text-slate-500 mt-1">Specialist dementia support</span>
            </Link>
            <Link href="/areas/llangollen/overnight-care" className="block bg-white rounded-xl p-5 hover:shadow-md transition-all border border-slate-200">
              <span className="font-bold text-slate-900">Overnight Care in Llangollen</span>
              <span className="block text-sm text-slate-500 mt-1">Dee Valley overnight support</span>
            </Link>
            <Link href="/areas/denbighshire/emergency-home-care" className="block bg-white rounded-xl p-5 hover:shadow-md transition-all border border-slate-200">
              <span className="font-bold text-slate-900">Emergency Home Care</span>
              <span className="block text-sm text-slate-500 mt-1">Same-day urgent care</span>
            </Link>
            <Link href="/areas" className="block bg-white rounded-xl p-5 hover:shadow-md transition-all border border-slate-200">
              <span className="font-bold text-slate-900">Areas We Cover</span>
              <span className="block text-sm text-slate-500 mt-1">Full service coverage</span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-welsh-red" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Need Overnight Care in Denbigh?</h2>
          <p className="text-slate-300 text-lg mb-8">
            Whether you need waking night care for complex needs or sleep-in support for peace of mind, our team is here to help. Call us for a friendly, no-obligation conversation about overnight care options for your family.
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

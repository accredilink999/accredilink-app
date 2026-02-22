import Link from 'next/link';

export const metadata = {
  title: 'Overnight Care Llangollen | Night Care Dee Valley',
  description: 'Overnight home care in Llangollen — waking night and sleep-in care for safety and peace of mind in the Dee Valley. Call 01824 538688.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://accredilink.co.uk/#organization',
      name: 'Accredilink Community Response Taskforce',
      alternateName: 'Accredilink CRT',
      url: 'https://accredilink.co.uk/areas/llangollen/overnight-care',
      telephone: '01824 538688',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'The Hummingbird, 27-29 High St',
        addressLocality: 'Denbigh',
        postalCode: 'LL16 3HY',
        addressCountry: 'GB',
      },
      areaServed: [
        { '@type': 'Place', name: 'Llangollen' },
        { '@type': 'Place', name: 'Dee Valley' },
        { '@type': 'Place', name: 'Corwen' },
        { '@type': 'Place', name: 'Glyndyfrdwy' },
        { '@type': 'Place', name: 'Trevor' },
        { '@type': 'Place', name: 'Froncysyllte' },
        { '@type': 'Place', name: 'Chirk' },
      ],
      description: 'Overnight home care in Llangollen and the Dee Valley — waking night and sleep-in care services providing safety, comfort, and peace of mind. CIW regulated.',
      priceRange: '$$',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the difference between waking night care and sleep-in care?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Waking night care means a carer stays awake throughout the night, actively monitoring and providing regular support — ideal for people who need frequent assistance, have dementia-related wandering, or require regular repositioning. Sleep-in care means a carer sleeps in the home and is available to respond if needed during the night — suited to those who mainly sleep through but may need occasional help.',
          },
        },
        {
          '@type': 'Question',
          name: 'Who needs overnight care in Llangollen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Overnight care benefits people at risk of falls, those with dementia who wander or become confused at night, individuals needing regular medication or repositioning, those receiving end-of-life care, and anyone who feels anxious or unsafe being alone at night — particularly in isolated Dee Valley properties.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can overnight care be combined with daytime visits?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Overnight care works well alongside daytime domiciliary care visits, forming a comprehensive 24-hour care package. This is a common arrangement for people in the Dee Valley who need support throughout the day and reassurance at night.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does overnight care work in a rural Dee Valley home?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our overnight carer arrives at your home in the evening and remains until morning. They bring everything they need for the night. For rural Dee Valley properties, having a carer present overnight is especially important given the distance from hospitals and emergency services.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is overnight care in Llangollen funded by the council?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Overnight care may be funded wholly or partly by Denbighshire County Council following a care needs assessment. It can also be arranged and funded privately. Call us on 01824 538688 to discuss your options.',
          },
        },
      ],
    },
  ],
};

export default function LlangollenOvernightCare() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(185,28,28,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <nav className="mb-6 text-sm text-slate-400">
            <Link href="/areas" className="hover:text-white transition-colors">Areas We Cover</Link>
            <span className="mx-2">/</span>
            <Link href="/areas/llangollen" className="hover:text-white transition-colors">Llangollen</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Overnight Care</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Overnight Care in Llangollen</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Waking night and sleep-in care for safety, comfort, and peace of mind in Llangollen and the Dee Valley. A trained carer present through the hours of darkness.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center px-6 py-3 bg-welsh-red text-white font-semibold rounded-lg hover:bg-welsh-red-light transition-colors">
              Arrange Overnight Care
            </Link>
            <a href="tel:01824538688" className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-slate-900 transition-colors">
              Call 01824 538688
            </a>
          </div>
        </div>
      </section>

      {/* Two Types of Overnight Care */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Two Types of Overnight Care</h2>
          <p className="text-slate-600 mb-10 max-w-2xl leading-relaxed">
            Night-time is often the most vulnerable period for people who need care at home. In the quiet, isolated properties of the Dee Valley, the darkness can bring anxiety, confusion, and risk. Accredilink provides two types of overnight care, each designed for different levels of need.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
              <div className="w-12 h-12 bg-welsh-red/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-welsh-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Waking Night Care</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Your carer stays fully awake throughout the night, actively monitoring and providing support as needed. This is the right choice when the person requires frequent or unpredictable assistance during the night.
              </p>
              <p className="text-slate-600 font-medium mb-2">Recommended for:</p>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li className="flex gap-2"><span className="text-welsh-red">&#8226;</span> Dementia with night-time wandering or confusion</li>
                <li className="flex gap-2"><span className="text-welsh-red">&#8226;</span> Regular repositioning for pressure area care</li>
                <li className="flex gap-2"><span className="text-welsh-red">&#8226;</span> Frequent toileting or continence support</li>
                <li className="flex gap-2"><span className="text-welsh-red">&#8226;</span> End-of-life care requiring continuous monitoring</li>
                <li className="flex gap-2"><span className="text-welsh-red">&#8226;</span> Medication administration at set times through the night</li>
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
              <div className="w-12 h-12 bg-welsh-green/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Sleep-in Care</h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                Your carer sleeps in your home overnight and is available to respond if you need help. This provides reassurance and a safety net without the cost of a full waking night, and is suitable when needs are less frequent but unpredictable.
              </p>
              <p className="text-slate-600 font-medium mb-2">Recommended for:</p>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li className="flex gap-2"><span className="text-welsh-green">&#8226;</span> Falls risk — someone nearby if you fall during the night</li>
                <li className="flex gap-2"><span className="text-welsh-green">&#8226;</span> Night-time anxiety or fear of being alone</li>
                <li className="flex gap-2"><span className="text-welsh-green">&#8226;</span> Occasional toileting assistance</li>
                <li className="flex gap-2"><span className="text-welsh-green">&#8226;</span> General reassurance for vulnerable individuals</li>
                <li className="flex gap-2"><span className="text-welsh-green">&#8226;</span> Recovery after hospital discharge or illness</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Overnight Care Matters in Rural Llangollen */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Why Overnight Care is Vital in the Dee Valley</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Night-time presents particular risks for vulnerable people living in rural areas. In Llangollen and the Dee Valley, those risks are amplified by geography. Many homes are isolated, set back from main roads, down unlit lanes. If someone falls at two in the morning in a cottage above Glyndyfrdwy, they may not be found for hours. If a person with dementia leaves their home in the darkness, the terrain around the River Dee, the canal towpath, and the steep hillsides beneath Dinas Bran presents serious danger.
              </p>
              <p>
                The distance from emergency services compounds the problem. Wrexham Maelor Hospital's accident and emergency department is at least twenty minutes from Llangollen in good conditions — far longer from the western reaches of the valley near Carrog and Corwen. Ambulance response times to rural Dee Valley addresses can be significantly longer than in urban areas. At night, with reduced traffic, response may be marginally faster, but for someone lying on the floor after a fall, every minute feels like an hour.
              </p>
              <p>
                Having a trained carer present overnight fundamentally changes this equation. A fall is responded to immediately. Confusion and distress are met with a calm, familiar voice. Medication is given on time. Doors are monitored. And if a situation does require emergency services, the carer can call for help immediately, provide first aid, and ensure the person is safe until help arrives.
              </p>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                For family carers living with or near their loved one in the Dee Valley, the night-time burden is often the hardest part. Interrupted sleep, night after night, takes a devastating toll on physical and mental health. Many families reach a breaking point not because daytime care is unmanageable, but because they simply cannot cope with another night of broken sleep, of listening for sounds, of worrying about what might happen between midnight and dawn.
              </p>
              <p>
                Overnight care addresses this directly. Whether as a waking night where the carer handles all night-time needs, or as a sleep-in where they are simply present and available, the family carer can finally sleep. This is not a luxury — it is often the thing that makes the difference between a family being able to continue caring at home and feeling forced to consider residential care.
              </p>
              <p>
                We have supported many families in Llangollen, Trevor, Froncysyllte, and the surrounding villages who were at that exact point. Adding overnight care to their existing daytime <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> package was the intervention that allowed them to keep their loved one at home — where everyone wanted them to be.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Phone CTA */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Struggling With Night-time Care in the Dee Valley?</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            You do not have to do the nights alone. Call our team for a free conversation about overnight care options in Llangollen and the Dee Valley.
          </p>
          <a href="tel:01824538688" className="inline-flex items-center px-8 py-4 bg-welsh-red text-white text-xl font-bold rounded-lg hover:bg-welsh-red-light transition-colors">
            01824 538688
          </a>
        </div>
      </section>

      {/* How It Works & Care Packages */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">How Overnight Care Works in Practice</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Our overnight carer arrives at your home in the evening — typically between 8pm and 10pm, depending on your routine — and remains until morning, usually between 7am and 8am. Before the first night, we carry out a thorough assessment of your home and your needs, including any specific night-time risks, routines, and preferences.
                </p>
                <p>
                  For waking night care, the carer remains awake throughout and carries out regular checks, assists with personal care, administers medication, and responds to any needs as they arise. They will keep a detailed record of the night for continuity with daytime carers and for your family's information.
                </p>
                <p>
                  For sleep-in care, the carer settles in a designated bedroom and is available to respond if called or if they hear that you need assistance. They are there if you need them, but they are not conducting active checks throughout the night — making this a less intrusive and more affordable option for those whose night-time needs are occasional rather than constant.
                </p>
                <p>
                  In both cases, the carer is fully trained, DBS checked, and registered with Social Care Wales. They know your care plan, your home, and your preferences. And they have direct access to Accredilink's <Link href="/services/emergency-response" className="text-welsh-red hover:text-welsh-red-light font-medium">emergency response</Link> team if a situation escalates beyond routine care.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Part of a Complete Care Package</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Overnight care rarely exists in isolation. Most people who need support at night also need help during the day. We design care packages that combine overnight care with daytime <Link href="/areas/llangollen/home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">home care in Llangollen</Link> to provide seamless, round-the-clock support without the need for residential care.
                </p>
                <p>
                  A typical combined package might include morning and evening domiciliary care visits for personal care and meals, a lunchtime welfare check, and either waking night or sleep-in overnight care. This gives the individual comprehensive support while remaining in their own home in the Dee Valley.
                </p>
                <p>
                  For those who need even more intensive support, overnight care can be extended to more frequent waking nights or combined with additional daytime visits for round-the-clock care. We work with families to find the right level of care and to adjust it as needs change — always with the goal of keeping the person safely at home for as long as possible.
                </p>
                <p>
                  Overnight care can also be arranged on a standalone basis — perhaps for a few nights a week to give a family carer regular respite, or for a short period following hospital discharge to ensure a safe recovery. We are flexible and responsive. If you need us for one night or every night, we will accommodate your situation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Response Backup */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Emergency Response Backup — When It Matters Most</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                One of the most significant advantages of choosing Accredilink for overnight care in the Dee Valley is our integrated <Link href="/services/emergency-response" className="text-welsh-red hover:text-welsh-red-light font-medium">emergency response</Link> capability. We are not a standard domiciliary care agency. We have our own team of emergency care responders trained in pre-hospital emergency care, available on shift around the clock.
              </p>
              <p>
                If your overnight carer encounters a situation that goes beyond routine care — a serious fall with a suspected injury, a sudden deterioration in health, chest pain, breathing difficulty, or any other medical emergency — they can immediately escalate to our emergency response team. Our responders can attend, assess the situation, provide first aid and basic life support, and coordinate with the Welsh Ambulance Service.
              </p>
              <p>
                In the Dee Valley, where Wrexham Maelor Hospital is twenty minutes or more away and ambulance response times to rural addresses can be lengthy, this capability is not a nice-to-have — it is a genuine safety net. Families choosing overnight care with Accredilink in Llangollen can be confident that their loved one is protected not just by a care worker, but by an organisation with the clinical capability to respond when seconds count.
              </p>
              <p>
                This is the same level of backup provided to our <Link href="/areas/llangollen/dementia-care" className="text-welsh-red hover:text-welsh-red-light font-medium">dementia care in Llangollen</Link> clients and everyone receiving <Link href="/areas/llangollen/home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">home care in Llangollen</Link> from our team. It is what makes Accredilink different.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Peace of Mind for Families */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Peace of Mind for Families Near and Far</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Many of the families we work with in the Dee Valley do not live locally themselves. Adult children may be in Chester, Wrexham, Liverpool, Manchester, or further afield, while their parent lives in a cottage in Llangollen or one of the surrounding villages. The worry of knowing that Mum or Dad is alone at night, in a rural property, with significant care needs, is a burden that affects the whole family.
              </p>
              <p>
                Overnight care provides the answer. Knowing that a trained, trusted carer is in the home — that they will respond if your parent calls out, that they will check the doors are locked, that they will notice if something is wrong — allows you to sleep at night too. It is peace of mind that no amount of phone calls and daytime visits can replicate.
              </p>
              <p>
                We keep families informed with clear, concise records of each night. If there are any concerns, we communicate them promptly. And if you want to speak to us about how your loved one is doing, our office team is always available. We understand that trusting someone to be in your parent's home through the night is a significant step, and we treat that trust with the seriousness it deserves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions About Overnight Care in Llangollen</h2>
          <div className="space-y-4 max-w-3xl">
            {[
              {
                q: 'What is the difference between waking night care and sleep-in care?',
                a: 'Waking night care means a carer stays awake throughout the night, actively monitoring and providing regular support. This is ideal for people who need frequent assistance, have dementia-related wandering, or require regular repositioning. Sleep-in care means a carer sleeps in the home and is available to respond when needed — suited to those who mainly sleep through but may need occasional help during the night.',
              },
              {
                q: 'Who needs overnight care in Llangollen?',
                a: 'Overnight care benefits people at risk of falls, those with dementia who wander or become confused at night, individuals needing regular medication or repositioning, those receiving end-of-life care, people recovering from hospital discharge, and anyone who feels anxious or unsafe being alone at night. It is particularly important in isolated Dee Valley properties far from emergency services.',
              },
              {
                q: 'Can overnight care be combined with daytime care visits?',
                a: 'Yes, and this is a very common arrangement. Overnight care works well alongside daytime domiciliary care visits, forming a comprehensive 24-hour care package. This combination allows people in the Dee Valley to remain at home with round-the-clock support as an alternative to residential care.',
              },
              {
                q: 'How does overnight care work in a rural Dee Valley home?',
                a: 'Our overnight carer arrives at your home in the evening and remains until morning. They bring everything they need for the night. For rural Dee Valley properties, we ensure our carers know the route to your home and are familiar with any access considerations. Having a carer present overnight is especially important given the distance from hospitals and the limited emergency service response times in this area.',
              },
              {
                q: 'Is overnight care in Llangollen funded by the council?',
                a: 'Overnight care may be funded wholly or partly by Denbighshire County Council following a care needs assessment by Social Services. It can also be arranged and funded privately, or as a combination of both. Call us on 01824 538688 and we will help you understand the options available for your specific circumstances.',
              },
            ].map((faq) => (
              <details key={faq.q} className="bg-slate-50 rounded-xl border border-slate-200">
                <summary className="px-6 py-4 cursor-pointer font-semibold text-slate-900 hover:text-welsh-red transition-colors">
                  {faq.q}
                </summary>
                <div className="px-6 pb-4 text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Related Llangollen Care Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/areas/llangollen/home-care" className="block bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Home Care</h3>
              <p className="text-slate-500 text-sm">Complete home care services in the Dee Valley</p>
            </Link>
            <Link href="/areas/llangollen/dementia-care" className="block bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Dementia Care</h3>
              <p className="text-slate-500 text-sm">Specialist dementia support at home in Llangollen</p>
            </Link>
            <Link href="/services/emergency-response" className="block bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Emergency Response</h3>
              <p className="text-slate-500 text-sm">Trained responders for urgent care situations</p>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/areas" className="text-welsh-red hover:text-welsh-red-light font-medium">Areas we cover</Link>
            <span className="text-slate-300">|</span>
            <Link href="/areas/denbigh/home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">Home care in Denbigh</Link>
            <span className="text-slate-300">|</span>
            <Link href="/services/respite-care" className="text-welsh-red hover:text-welsh-red-light font-medium">Respite care</Link>
            <span className="text-slate-300">|</span>
            <Link href="/services/palliative-care" className="text-welsh-red hover:text-welsh-red-light font-medium">Palliative care</Link>
            <span className="text-slate-300">|</span>
            <Link href="/areas/denbighshire/emergency-home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">Emergency home care in Denbighshire</Link>
            <span className="text-slate-300">|</span>
            <Link href="/contact" className="text-welsh-red hover:text-welsh-red-light font-medium">Contact us</Link>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-welsh-red to-welsh-red-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Arrange Overnight Care in Llangollen Today</h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto leading-relaxed">
            Whether you need waking night care, sleep-in support, or simply want to explore your options, our team is here to help. Every conversation is free, confidential, and without obligation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/contact" className="inline-flex items-center px-8 py-4 bg-white text-welsh-red font-bold rounded-lg hover:bg-slate-100 transition-colors">
              Contact Us Online
            </Link>
            <a href="tel:01824538688" className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-welsh-red transition-colors">
              Call 01824 538688
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

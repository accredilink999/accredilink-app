import Link from 'next/link';

export const metadata = {
  title: 'Home Care in Llangollen | Dee Valley Care',
  description: 'Trusted home care in Llangollen and the Dee Valley. CIW-regulated carers providing personal care, dementia & emergency support. Call 01824 538688.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://accredilink.co.uk/#organization',
      name: 'Accredilink Community Response Taskforce',
      alternateName: 'Accredilink CRT',
      url: 'https://accredilink.co.uk/areas/llangollen/home-care',
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
        { '@type': 'Place', name: 'Glyndyfrdwy' },
        { '@type': 'Place', name: 'Carrog' },
        { '@type': 'Place', name: 'Corwen' },
        { '@type': 'Place', name: 'Trevor' },
        { '@type': 'Place', name: 'Froncysyllte' },
        { '@type': 'Place', name: 'Chirk' },
      ],
      description: 'CIW-regulated home care services in Llangollen and the Dee Valley, including domiciliary care, dementia care, overnight care, hospital discharge care, and emergency response.',
      priceRange: '$$',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What home care services are available in Llangollen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Accredilink CRT provides a full range of home care services in Llangollen and the Dee Valley, including domiciliary care, dementia care, overnight care, respite care, emergency response, palliative care, and hospital discharge support. All services are CIW regulated.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do you provide home care in the villages around Llangollen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes, we cover Llangollen and the entire Dee Valley including Glyndyfrdwy, Carrog, Corwen, Trevor, Froncysyllte, and Chirk. Our carers know the rural roads and scattered communities of the valley.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I get Welsh-speaking carers in Llangollen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. We actively recruit Welsh-speaking carers and provide care through the Active Offer under the More Than Just Words framework. This is particularly important in the Dee Valley where many older residents are Welsh first-language speakers.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is home care in Llangollen funded by the council?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Home care in Llangollen may be funded wholly or partly by Denbighshire County Council following a care needs assessment by Social Services. We also support private clients who arrange and fund their own care.',
          },
        },
        {
          '@type': 'Question',
          name: 'How quickly can home care start in Llangollen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'We aim to begin care as quickly as possible. For urgent situations, including hospital discharge, our emergency response team can provide same-day support. Planned care packages typically start within a few days of assessment.',
          },
        },
        {
          '@type': 'Question',
          name: 'What makes Accredilink different from other care providers in Llangollen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Accredilink CRT is truly local — based in Denbighshire with carers who know the Dee Valley roads and communities. We also have our own trained emergency care responders on shift, providing a level of rapid response that other domiciliary care providers cannot offer.',
          },
        },
      ],
    },
  ],
};

export default function LlangollenHomeCare() {
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
            <span className="text-white">Home Care</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Home Care in Llangollen</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Trusted, CIW-regulated home care for Llangollen and the Dee Valley. Local carers who know your community, your roads, and your language.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center px-6 py-3 bg-welsh-red text-white font-semibold rounded-lg hover:bg-welsh-red-light transition-colors">
              Arrange a Free Assessment
            </Link>
            <a href="tel:01824538688" className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-slate-900 transition-colors">
              Call 01824 538688
            </a>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Truly Local Care for the Dee Valley</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Llangollen sits at the heart of one of the most beautiful valleys in North Wales, where the River Dee winds beneath the ruins of Dinas Bran and the world-famous Pontcysyllte Aqueduct carries the Llangollen Canal high above the valley floor. It is a place of deep community ties, rich culture, and a fierce sense of belonging. For the older residents of Llangollen and the Dee Valley, home is more than an address — it is a lifetime of memories, neighbours, and connection to the Welsh landscape.
              </p>
              <p>
                Accredilink Community Response Taskforce provides professional, CIW-regulated <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> across Llangollen and the entire Dee Valley. Our carers are local people who understand the area intimately — from the narrow stretches of the A5 through the valley to the isolated farms and cottages that sit above Glyndyfrdwy and Carrog. We know these communities because we are part of them.
              </p>
              <p>
                Whether you need a daily visit to help with personal care, specialist <Link href="/areas/llangollen/dementia-care" className="text-welsh-red hover:text-welsh-red-light font-medium">dementia care in Llangollen</Link>, or <Link href="/areas/llangollen/overnight-care" className="text-welsh-red hover:text-welsh-red-light font-medium">overnight care in Llangollen</Link> for safety and reassurance, our team is here to help you stay where you belong — at home, in the community you love.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rural Care Challenges */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Understanding Rural Care in the Dee Valley</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Providing home care in Llangollen and the Dee Valley comes with challenges that many larger, city-based agencies simply do not understand. The communities here are scattered across a wide valley — from the riverside homes in Llangollen town itself, up through the villages of Trevor and Froncysyllte near the aqueduct, westward along the A5 through Glyndyfrdwy and Carrog, and out to Corwen at the head of the valley. The A542 Horseshoe Pass road connects Llangollen to Ruthin but is steep, winding, and treacherous in winter.
              </p>
              <p>
                Many of the properties we visit are older stone-built homes set back from main roads, sometimes down single-track lanes. Some have limited mobile phone signal and unreliable broadband. For older people living in these settings, a reliable care provider is not a luxury — it is a lifeline. Late or missed visits are not just inconvenient; in a rural valley where the nearest neighbour may be half a mile away, they can be genuinely dangerous.
              </p>
              <p>
                Our team is built for this environment. We plan routes carefully, allow for seasonal road conditions, and ensure our carers have the local knowledge to reach every property safely and on time. When the weather closes in and the valley roads become difficult, our clients can rely on us to still be there.
              </p>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                The Dee Valley also sits at a considerable distance from major healthcare facilities. Wrexham Maelor Hospital, the nearest accident and emergency department, is at least twenty minutes from Llangollen in good conditions — longer from the western villages. Chirk Community Hospital provides some local services, and Llangollen Health Centre offers GP and community nursing, but for anything urgent, people must travel.
              </p>
              <p>
                This is exactly why having a home care provider with <Link href="/services/emergency-response" className="text-welsh-red hover:text-welsh-red-light font-medium">emergency response</Link> capability matters so much in this area. Accredilink is not a standard domiciliary care agency. We have our own trained emergency care responders who can attend urgent situations quickly, provide immediate first aid, and stabilise a situation while awaiting ambulance services. For families with a loved one living in the Dee Valley, this gives genuine peace of mind.
              </p>
              <p>
                We also work closely with Denbighshire County Council Social Services, Betsi Cadwaladr University Health Board, and local GP surgeries to ensure our care is coordinated and responsive. If your needs change, we adapt — quickly and without fuss.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Available */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Home Care Services in Llangollen</h2>
          <p className="text-slate-600 mb-10 max-w-2xl">
            We offer a comprehensive range of home care services across Llangollen and the Dee Valley, all regulated by Care Inspectorate Wales.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Domiciliary Care', desc: 'Daily personal care visits — washing, dressing, medication, meals, and companionship tailored to your routine.', href: '/services/domiciliary-care', link: 'domiciliary care' },
              { title: 'Dementia Care', desc: 'Specialist support for Alzheimer\'s, vascular dementia, and other cognitive conditions, keeping people safe and comfortable at home.', href: '/areas/llangollen/dementia-care', link: 'dementia care in Llangollen' },
              { title: 'Overnight Care', desc: 'Waking night and sleep-in care for falls risk, dementia wandering, medication rounds, and end-of-life support.', href: '/areas/llangollen/overnight-care', link: 'overnight care in Llangollen' },
              { title: 'Respite Care', desc: 'Planned breaks for family carers — we step in so you can rest, knowing your loved one is in safe hands.', href: '/services/respite-care', link: 'respite care' },
              { title: 'Emergency Response', desc: 'Trained responders available for urgent situations — falls, sudden illness, or carer absence. Vital in the rural Dee Valley.', href: '/services/emergency-response', link: 'emergency response' },
              { title: 'Palliative Care', desc: 'Compassionate end-of-life care at home, working alongside district nurses and specialist palliative teams.', href: '/services/palliative-care', link: 'palliative care' },
              { title: 'Hospital Discharge Care', desc: 'Rapid support to help you return home safely from Wrexham Maelor or Chirk Community Hospital.', href: '/services/domiciliary-care', link: 'domiciliary care' },
              { title: 'Companionship Visits', desc: 'Social visits to reduce isolation — conversation, outings, and meaningful engagement for those living alone in the valley.', href: '/services/domiciliary-care', link: 'domiciliary care' },
            ].map((service) => (
              <div key={service.title} className="bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 transition-colors">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{service.title}</h3>
                <p className="text-slate-600 text-sm mb-4">{service.desc}</p>
                <Link href={service.href} className="text-welsh-red hover:text-welsh-red-light text-sm font-medium">
                  Learn more &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Phone CTA */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Speak to Our Llangollen Care Team Today</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            Whether you need care for yourself or a loved one in the Dee Valley, we are here to help. Call us for a free, no-obligation conversation about your needs.
          </p>
          <a href="tel:01824538688" className="inline-flex items-center px-8 py-4 bg-welsh-red text-white text-xl font-bold rounded-lg hover:bg-welsh-red-light transition-colors">
            01824 538688
          </a>
        </div>
      </section>

      {/* Villages Served */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Villages and Communities We Serve</h2>
          <p className="text-slate-600 mb-8 max-w-2xl">
            Our home care service covers Llangollen town and the surrounding Dee Valley communities. Our carers travel to you — wherever you are in the valley.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              'Llangollen', 'Glyndyfrdwy', 'Carrog', 'Corwen',
              'Trevor', 'Froncysyllte', 'Chirk', 'Cefn Mawr',
              'Acrefair', 'Rhosllanerchrugog', 'Pontcysyllte', 'Llantysilio',
            ].map((village) => (
              <div key={village} className="bg-slate-50 rounded-lg p-4 text-center">
                <span className="text-slate-700 font-medium">{village}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Welsh Language & Local Knowledge */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Welsh Language Carers and the Active Offer</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  The Dee Valley is home to many Welsh-speaking families and individuals for whom Cymraeg is their first and most comfortable language. This matters enormously in care, particularly for older people and those living with dementia, who may revert to their first language and find it distressing to be cared for only in English.
                </p>
                <p>
                  Accredilink is committed to the Active Offer under the More Than Just Words framework. We actively recruit Welsh-speaking carers across our service area and match them with Welsh-speaking clients in Llangollen and the Dee Valley wherever possible. We do not wait for someone to ask for Welsh language care — we offer it proactively, because it is the right thing to do.
                </p>
                <p>
                  For families in the valley, knowing that their mother or father will be greeted in Welsh, spoken to in the language they dream in, and cared for with cultural sensitivity is not a small thing. It is the foundation of dignified, person-centred care.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Funding Your Care</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Home care in Llangollen can be arranged privately or funded through Denbighshire County Council. If you believe you or a family member may need care at home, the first step is usually to contact Denbighshire Social Services to request a care needs assessment. This assessment is free and will determine what level of support is needed and whether council funding is available.
                </p>
                <p>
                  Many people in the Dee Valley are eligible for some level of funded care, particularly following a hospital stay or if they have significant health conditions. We work with both council-funded and privately-funded clients, and we can guide you through the process of accessing the support you are entitled to.
                </p>
                <p>
                  If you are funding care privately, there are no minimum package requirements. Whether you need a single daily visit or comprehensive <Link href="/areas/llangollen/overnight-care" className="text-welsh-red hover:text-welsh-red-light font-medium">overnight care in Llangollen</Link>, we will build a package around your needs and your budget.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions About Home Care in Llangollen</h2>
          <div className="space-y-4 max-w-3xl">
            {[
              {
                q: 'What home care services are available in Llangollen?',
                a: 'Accredilink CRT provides a full range of home care services in Llangollen and the Dee Valley, including domiciliary care, dementia care, overnight care, respite care, emergency response, palliative care, and hospital discharge support. All services are regulated by Care Inspectorate Wales.',
              },
              {
                q: 'Do you provide home care in the villages around Llangollen?',
                a: 'Yes. We cover Llangollen town and the entire Dee Valley corridor, including Glyndyfrdwy, Carrog, Corwen, Trevor, Froncysyllte, Chirk, Cefn Mawr, and Pontcysyllte. Our carers know the rural roads and plan their routes to reach every property reliably.',
              },
              {
                q: 'Can I get Welsh-speaking carers in Llangollen?',
                a: 'Yes. We actively recruit Welsh-speaking carers and provide care through the Active Offer under the More Than Just Words framework. This is especially important in the Dee Valley where many older residents are Welsh first-language speakers. We match Welsh-speaking carers with clients wherever possible.',
              },
              {
                q: 'Is home care in Llangollen funded by the council?',
                a: 'Home care in Llangollen may be funded wholly or partly by Denbighshire County Council following a care needs assessment by Social Services. We also support private clients who arrange and fund their own care. Contact Denbighshire Social Services or call us on 01824 538688 and we will help guide you through the process.',
              },
              {
                q: 'How quickly can home care start in Llangollen?',
                a: 'We aim to begin care as quickly as possible. For urgent situations such as hospital discharge from Wrexham Maelor, our emergency response team can provide same-day support. Planned care packages typically start within a few days of completing an initial assessment.',
              },
              {
                q: 'What makes Accredilink different from other care providers in Llangollen?',
                a: 'Accredilink CRT is a truly local, CIW-regulated provider based in Denbighshire. Our carers know the Dee Valley roads and communities. Uniquely, we also have trained emergency care responders on shift, providing rapid response capability that standard domiciliary care providers cannot match — vital in a rural area like the Dee Valley.',
              },
            ].map((faq) => (
              <details key={faq.q} className="bg-slate-50 rounded-xl">
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
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Explore Our Llangollen Care Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/areas/llangollen/dementia-care" className="block bg-white rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Dementia Care</h3>
              <p className="text-slate-500 text-sm">Specialist dementia support at home in Llangollen</p>
            </Link>
            <Link href="/areas/llangollen/overnight-care" className="block bg-white rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Overnight Care</h3>
              <p className="text-slate-500 text-sm">Waking night and sleep-in care for peace of mind</p>
            </Link>
            <Link href="/areas/denbigh/home-care" className="block bg-white rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Home Care in Denbigh</h3>
              <p className="text-slate-500 text-sm">Care services in our home town of Denbigh</p>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/areas" className="text-welsh-red hover:text-welsh-red-light font-medium">Areas we cover</Link>
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
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Ready to Arrange Home Care in Llangollen?</h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto leading-relaxed">
            Whether you are looking for daily visits, overnight support, or emergency cover in the Dee Valley, our team is ready to help. Every conversation is free, confidential, and without obligation.
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

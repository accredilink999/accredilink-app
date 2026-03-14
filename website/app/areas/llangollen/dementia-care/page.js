import Link from 'next/link';

export const metadata = {
  title: 'Dementia Care Llangollen | Home Support Dee Valley',
  description: 'Specialist dementia care at home in Llangollen and the Dee Valley. Trained local carers, Welsh language support. CIW regulated. Call 01824 538688.',
  alternates: {
    canonical: "https://accredilinkcare.co.uk/areas/llangollen/dementia-care",
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': 'https://accredilink.co.uk/#organization',
      name: 'Accredilink Community Response Taskforce',
      alternateName: 'Accredilink CRT',
      url: 'https://accredilink.co.uk/areas/llangollen/dementia-care',
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
      ],
      description: 'Specialist dementia care at home in Llangollen and the Dee Valley. CIW-regulated, trained local carers with Welsh language support.',
      priceRange: '$$',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Can someone with dementia stay at home in Llangollen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. With the right support, many people with dementia can continue living safely at home in Llangollen and the Dee Valley. Accredilink CRT provides specialist dementia care visits, overnight care, and round-the-clock support to make this possible, even in the more rural parts of the valley.',
          },
        },
        {
          '@type': 'Question',
          name: 'What types of dementia do your carers support?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our carers are trained to support people living with all types of dementia, including Alzheimer\'s disease, vascular dementia, Lewy body dementia, frontotemporal dementia, and mixed dementia. Each person\'s care plan is tailored to their specific diagnosis and needs.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do you have Welsh-speaking dementia carers in the Dee Valley?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. We actively recruit Welsh-speaking carers and prioritise matching them with Welsh-speaking clients. This is especially important in dementia care, as people often revert to their first language as the condition progresses. Being cared for in Welsh can significantly reduce confusion and distress.',
          },
        },
        {
          '@type': 'Question',
          name: 'What does dementia care at home include?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Our dementia care includes personal care, medication management, safety monitoring, maintaining daily routines, companionship, meal preparation, night care, and support with memory and orientation. We also provide respite care for family carers and work closely with local health services.',
          },
        },
        {
          '@type': 'Question',
          name: 'How do I arrange dementia care in Llangollen?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Call us on 01824 538688 for a free, confidential conversation. We will discuss your loved one\'s needs and arrange an initial assessment at home. You can also contact Denbighshire County Council Social Services for a formal care needs assessment, which may result in funded support.',
          },
        },
      ],
    },
  ],
};

export default function LlangollenDementiaCare() {
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
            <span className="text-white">Dementia Care</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Dementia Care in Llangollen</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Specialist dementia care at home in Llangollen and the Dee Valley. Trained, compassionate carers helping your loved one stay safe and comfortable in the place they know best.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/contact" className="inline-flex items-center px-6 py-3 bg-welsh-red text-white font-semibold rounded-lg hover:bg-welsh-red-light transition-colors">
              Arrange Dementia Care
            </Link>
            <a href="tel:01824538688" className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-slate-900 transition-colors">
              Call 01824 538688
            </a>
          </div>
        </div>
      </section>

      {/* Why Home Matters */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Why Staying at Home Matters for Dementia</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                For someone living with dementia, familiar surroundings are far more than a comfort — they are a vital part of how the person navigates their day. The view from the kitchen window over the Dee Valley, the creak of the third stair, the neighbour who waves every morning, the sound of the river below the Chain Bridge — these sensory anchors help maintain orientation, reduce confusion, and preserve a sense of self that the condition slowly erodes.
              </p>
              <p>
                Moving a person with dementia into residential care, away from the home they have known for decades, can accelerate cognitive decline and cause profound distress. Research consistently shows that people with dementia fare better, for longer, when they remain in familiar environments with consistent, person-centred support. In Llangollen and the Dee Valley, where many older residents have lived in the same home for a lifetime, this is especially true.
              </p>
              <p>
                Accredilink Community Response Taskforce provides specialist dementia care at home across Llangollen, Corwen, Glyndyfrdwy, Trevor, Froncysyllte, and the wider Dee Valley. Our goal is straightforward: to help your loved one stay in their home, in their community, for as long as it is safe and appropriate to do so. We work alongside families, local health services, and social care teams to make this possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Rural Isolation */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Dementia and Rural Isolation in the Dee Valley</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                The Dee Valley is strikingly beautiful, but for a person living with dementia, its rurality creates serious risks. Many homes in the valley are isolated — set back from main roads, down single-track lanes, sometimes without close neighbours. If a person with dementia becomes confused and leaves their home, the terrain is unforgiving: steep hillsides, the River Dee, canal towpaths, and roads without pavements.
              </p>
              <p>
                Public transport in the Dee Valley is extremely limited, and the nearest memory clinic and specialist dementia services are based in Wrexham or further afield. Attending appointments, accessing day centres, and maintaining social connections all become more difficult the further into the valley someone lives. For family carers who may be juggling work and their own health, the isolation can be overwhelming.
              </p>
              <p>
                This is precisely why home-based dementia care is so important in this area. Rather than expecting people to travel to services, we bring expert care to them — in their own home, on their own terms. Our carers visit regularly, maintain routines, and provide the consistent presence that helps a person with dementia feel safe and grounded.
              </p>
            </div>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                We also provide vital support to family carers across the Dee Valley. Caring for someone with dementia is physically and emotionally exhausting, and when you are doing it in a rural setting with limited support networks, burnout is a real risk. Our <Link href="/services/respite-care" className="text-welsh-red hover:text-welsh-red-light font-medium">respite care</Link> gives family carers planned breaks — whether for a few hours, a full day, or longer — knowing that their loved one is in safe, trained hands.
              </p>
              <p>
                For families who need more comprehensive support, our <Link href="/areas/llangollen/overnight-care" className="text-welsh-red hover:text-welsh-red-light font-medium">overnight care in Llangollen</Link> offers waking night and sleep-in options specifically designed for dementia-related needs such as wandering, confusion, and night-time anxiety — providing round-the-clock reassurance and safety.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Types of Dementia */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Types of Dementia We Support</h2>
          <p className="text-slate-600 mb-10 max-w-2xl">
            Dementia is not a single condition. Our carers are trained to understand and respond to the specific challenges of each type.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Alzheimer's Disease", desc: 'The most common form of dementia. We support with memory aids, consistent routines, gentle prompting, and maintaining familiar daily patterns in the person\'s own home.' },
              { title: 'Vascular Dementia', desc: 'Often following a stroke, vascular dementia can cause sudden changes in ability. Our carers adapt quickly and work closely with NHS community teams to ensure coordinated support.' },
              { title: 'Lewy Body Dementia', desc: 'This condition can cause visual hallucinations, fluctuating alertness, and movement difficulties. Our carers are trained to respond calmly and provide reassurance during distressing episodes.' },
              { title: 'Frontotemporal Dementia', desc: 'Affecting personality and behaviour, this type requires carers who understand that challenging behaviour is a symptom, not a choice. We approach every situation with patience and empathy.' },
              { title: 'Mixed Dementia', desc: 'Many people live with more than one type of dementia simultaneously. Our care plans account for the full picture of each person\'s condition and adapt as needs change.' },
              { title: 'Young Onset Dementia', desc: 'Dementia can affect people under 65. We provide age-appropriate support that recognises the unique challenges faced by younger people and their families.' },
            ].map((type) => (
              <div key={type.title} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{type.title}</h3>
                <p className="text-slate-600 text-sm">{type.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Dementia Care Includes */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">What Our Dementia Care Includes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            {[
              { title: 'Personal Care', desc: 'Sensitive support with washing, bathing, dressing, and grooming — maintaining dignity at every stage of the condition.' },
              { title: 'Medication Management', desc: 'Prompting and administering medication at the right times, monitoring side effects, and liaising with GPs and pharmacists.' },
              { title: 'Safety and Home Environment', desc: 'Assessing and reducing risks in the home — trip hazards, cooker safety, door security, and wandering prevention measures.' },
              { title: 'Routine and Structure', desc: 'Maintaining consistent daily routines that provide comfort and orientation. The same carer, the same times, the same approach.' },
              { title: 'Companionship and Engagement', desc: 'Meaningful conversation, reminiscence, activities, and gentle stimulation to maintain cognitive function and reduce social isolation.' },
              { title: 'Meal Preparation', desc: 'Preparing nutritious meals tailored to preferences and dietary needs, and supporting with eating and drinking where required.' },
              { title: 'Night Care', desc: 'Waking night or sleep-in care for those who wander, become confused, or feel anxious during the night. A trained presence throughout the hours of darkness.' },
              { title: 'Family Support and Communication', desc: 'Regular updates to family members, guidance on managing dementia at home, and honest conversations about changing needs.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="flex-shrink-0 w-2 bg-welsh-red rounded-full" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Phone CTA */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Worried About a Loved One With Dementia in Llangollen?</h2>
          <p className="text-slate-300 mb-6 max-w-xl mx-auto">
            You do not have to manage this alone. Call our team for a free, compassionate conversation about the support available in the Dee Valley.
          </p>
          <a href="tel:01824538688" className="inline-flex items-center px-8 py-4 bg-welsh-red text-white text-xl font-bold rounded-lg hover:bg-welsh-red-light transition-colors">
            01824 538688
          </a>
        </div>
      </section>

      {/* Training and Welsh Language */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Trained, Registered Dementia Carers</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Every carer who provides dementia support with Accredilink is registered with Social Care Wales and has completed specialist dementia training beyond the standard All Wales Induction Framework. Our team members are Dementia Friends and many have completed additional qualifications in dementia care, including understanding challenging behaviour, communication techniques, and end-of-life dementia support.
                </p>
                <p>
                  We invest in ongoing professional development because dementia care is not static — best practice evolves, new research emerges, and every person we support teaches us something. Our carers attend regular supervision, team training, and scenario-based learning to stay at the forefront of dementia care practice.
                </p>
                <p>
                  We work closely with Llangollen Health Centre, local community mental health teams, and memory assessment services to ensure our care is clinically informed and aligned with the person's wider healthcare plan.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Welsh Language Dementia Care</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  When dementia progresses, people very commonly revert to their first language. For Welsh speakers in the Dee Valley — and there are many — this means that being cared for in English alone can cause confusion, distress, and a feeling of being fundamentally misunderstood. A person who has spoken English fluently for sixty years may, in the later stages of dementia, only truly understand and respond to Welsh.
                </p>
                <p>
                  This is not a minor consideration. It goes to the heart of person-centred care. Accredilink is fully committed to the Active Offer under the More Than Just Words framework. We actively recruit Welsh-speaking carers and prioritise matching them with Welsh-speaking dementia clients in Llangollen and across the Dee Valley.
                </p>
                <p>
                  When a carer greets someone in Welsh, uses familiar Welsh phrases, sings a Welsh hymn, or simply chats in the language that person has spoken since childhood, the effect can be remarkable — reduced agitation, improved engagement, and a sense of calm and recognition that English alone cannot provide.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Avoiding Residential Care */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">An Alternative to Residential Care</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Many families in Llangollen and the Dee Valley face a difficult moment when they feel they can no longer manage a loved one's dementia at home. The assumption is often that residential care is the only option. In many cases, it is not. With the right package of home-based dementia care — from daily <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> visits through to comprehensive <Link href="/areas/llangollen/overnight-care" className="text-welsh-red hover:text-welsh-red-light font-medium">overnight care in Llangollen</Link> — people can remain in their own home safely and with dignity.
              </p>
              <p>
                Home-based dementia care allows the person to keep their routines, their possessions, their garden, their view of the valley, and their connection to the community. It is almost always less disruptive and often more affordable than residential care. And with Accredilink's <Link href="/services/emergency-response" className="text-welsh-red hover:text-welsh-red-light font-medium">emergency response</Link> capability, families have the added reassurance that trained responders are available if something goes wrong — particularly important when Wrexham Maelor Hospital is twenty minutes or more away.
              </p>
              <p>
                We are honest with families about what is achievable. If a person's needs become such that home care is no longer safe or appropriate, we will tell you. But in our experience, with the right support in place, many people with dementia can remain at home far longer than families expect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions About Dementia Care in Llangollen</h2>
          <div className="space-y-4 max-w-3xl">
            {[
              {
                q: 'Can someone with dementia stay at home in Llangollen?',
                a: 'Yes. With the right support, many people with dementia can continue living safely at home in Llangollen and the Dee Valley. We provide specialist dementia care visits, overnight care, and round-the-clock support to make this possible, even in the more rural parts of the valley.',
              },
              {
                q: 'What types of dementia do your carers support?',
                a: 'Our carers are trained to support all types of dementia, including Alzheimer\'s disease, vascular dementia, Lewy body dementia, frontotemporal dementia, and mixed dementia. Each person\'s care plan is individually tailored to their specific diagnosis and changing needs.',
              },
              {
                q: 'Do you have Welsh-speaking dementia carers in the Dee Valley?',
                a: 'Yes. We actively recruit Welsh-speaking carers and prioritise matching them with Welsh-speaking clients. This is especially vital in dementia care, as people often revert to their first language as the condition progresses. Being cared for in Welsh can significantly reduce confusion and distress for Dee Valley residents.',
              },
              {
                q: 'What does dementia care at home include?',
                a: 'Our dementia care includes personal care, medication management, safety monitoring, maintaining daily routines, companionship and meaningful engagement, meal preparation, night care, and ongoing communication with families and health professionals. Every care plan is built around the individual.',
              },
              {
                q: 'How do I arrange dementia care in Llangollen?',
                a: 'Call us on 01824 538688 for a free, confidential conversation about your loved one\'s needs. We will arrange an initial assessment at home, with no obligation. You can also contact Denbighshire County Council Social Services for a formal care needs assessment, which may result in funded support.',
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
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Related Care Services in Llangollen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/areas/llangollen/home-care" className="block bg-white rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Home Care</h3>
              <p className="text-slate-500 text-sm">Full home care services in Llangollen and the Dee Valley</p>
            </Link>
            <Link href="/areas/llangollen/overnight-care" className="block bg-white rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Overnight Care</h3>
              <p className="text-slate-500 text-sm">Night care for wandering, confusion, and anxiety</p>
            </Link>
            <Link href="/services/respite-care" className="block bg-white rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-semibold text-slate-900 mb-1">Respite Care</h3>
              <p className="text-slate-500 text-sm">Planned breaks for dementia family carers</p>
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link href="/areas" className="text-welsh-red hover:text-welsh-red-light font-medium">Areas we cover</Link>
            <span className="text-slate-300">|</span>
            <Link href="/areas/denbigh/home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">Home care in Denbigh</Link>
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
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Arrange Dementia Care in Llangollen Today</h2>
          <p className="text-white/90 mb-8 max-w-xl mx-auto leading-relaxed">
            If someone you love is living with dementia in the Dee Valley, we can help them stay safely at home. Call us for a free, compassionate conversation about the support available.
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

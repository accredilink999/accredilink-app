import Link from 'next/link';

export const metadata = {
  title: 'Dementia Care Denbigh | Specialist Home Support',
  description: 'Expert dementia care at home in Denbigh. Person-centred support from trained local carers. CIW regulated. Call Accredilink on 01824 538688.',
  alternates: {
    canonical: "https://accredilinkcare.co.uk/areas/denbigh/dementia-care",
  },
};

export default function DementiaCareInDenbigh() {
  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Accredilink Community Response Taskforce',
    description: 'Specialist dementia care at home in Denbigh. Person-centred support from trained local carers for Alzheimer\'s, vascular dementia, Lewy body, and frontotemporal dementia.',
    url: 'https://accredilinkcare.co.uk/areas/denbigh/dementia-care',
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
        name: 'What types of dementia do you support in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We support people living with all types of dementia in Denbigh, including Alzheimer\'s disease, vascular dementia, Lewy body dementia, frontotemporal dementia, and mixed dementia. Our carers receive specialist training for each condition and tailor their approach to the individual\'s specific needs and stage of progression.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can dementia care at home in Denbigh replace residential care?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'In many cases, yes. With the right support — from regular domiciliary visits to round-the-clock overnight care — people with dementia can continue living safely and comfortably in their own home in Denbigh. Familiar surroundings, established routines, and known neighbours can all help reduce confusion and anxiety. We assess each situation individually to ensure home care is safe and appropriate.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are your dementia carers in Denbigh specially trained?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. All our carers who deliver dementia care are Dementia Friends and have completed specialist dementia training. They are registered with Social Care Wales and undertake ongoing CPD (continuing professional development) including advanced dementia care techniques, communication strategies, and behaviour management.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do you offer Welsh-language dementia care in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Under the Active Offer framework, we proactively offer care in Welsh. This is particularly important for people with dementia, who often revert to their first language as the condition progresses. Many of our Denbigh-based carers are fluent Welsh speakers.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can you provide respite care for family carers of someone with dementia in Denbigh?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Absolutely. Caring for a loved one with dementia is physically and emotionally demanding. We offer planned respite care — from a few hours a week to longer breaks — so family carers can rest and recharge. We also provide emergency respite when a carer becomes ill or is unable to continue at short notice. Call 01824 538688 to discuss respite options.',
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
            Specialist Dementia Support
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Dementia Care in Denbigh
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-8">
            Person-centred dementia care at home from trained local carers who understand Denbigh and its community. Helping your loved one live well with dementia in the place they know best.
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

      {/* What is Person-Centred Dementia Care */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Person-Centred Dementia Care at Home in Denbigh</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              A diagnosis of dementia changes everything for a family. But it does not have to mean giving up the home, the routines, or the community connections that bring comfort and meaning. At Accredilink Community Response Taskforce, we believe that people living with dementia in Denbigh deserve to stay in their own home for as long as it is safe and appropriate &mdash; surrounded by the familiar sights, sounds, and people that help anchor their sense of self.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our dementia care is built around the individual. We take time to understand who the person was before dementia, what their interests are, what routines matter to them, and what makes them feel safe. This information forms the foundation of a care plan that is genuinely personal &mdash; not a generic checklist of tasks, but a plan that reflects the individual&apos;s life, their preferences, and their dignity.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Based at The Hummingbird on Denbigh High Street, our team knows this town and the surrounding Vale of Clwyd intimately. When we support someone with dementia in Denbigh, we understand the landmarks they might mention, the streets they used to walk, and the community they are part of. That local connection helps us provide care that is not just clinically competent, but genuinely meaningful.
            </p>
          </div>
        </div>
      </section>

      {/* Types of Dementia */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Types of Dementia We Support</h2>
          <p className="text-slate-600 text-lg mb-8">
            Dementia is not a single condition &mdash; it is an umbrella term for a range of progressive neurological disorders. Each type presents differently and requires a tailored approach. Our carers are trained to understand and respond to:
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Alzheimer's Disease",
                desc: "The most common form of dementia, affecting memory, thinking, and behaviour. Our carers use memory aids, consistent routines, and gentle prompting to support people through the stages of Alzheimer's.",
              },
              {
                title: 'Vascular Dementia',
                desc: 'Caused by reduced blood flow to the brain, often following a stroke. Symptoms can fluctuate day to day. We adapt our approach to match how the person is feeling on each visit, providing flexibility within a consistent framework.',
              },
              {
                title: 'Lewy Body Dementia',
                desc: 'Can cause visual hallucinations, movement difficulties, and fluctuating alertness. Our carers are trained to respond calmly and reassuringly to hallucinations and to support mobility safely.',
              },
              {
                title: 'Frontotemporal Dementia',
                desc: 'Affects personality, behaviour, and language, often at a younger age. We work closely with families to understand changes in behaviour and provide consistent, patient support that respects the person\'s dignity.',
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

      {/* What Dementia Care Includes */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">What Dementia Care at Home Includes</h2>
          <p className="text-slate-600 text-lg mb-8">
            Our dementia care service in Denbigh covers every aspect of daily life that the individual needs help with, while always encouraging independence and maintaining dignity. A typical care plan may include:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              'Personal care — washing, bathing, dressing, and grooming with patience and sensitivity',
              'Medication prompting and administration, ensuring prescriptions are followed correctly',
              'Home safety — removing hazards, managing door security, monitoring wandering risk',
              'Maintaining familiar routines that provide structure and reduce anxiety',
              'Companionship and meaningful engagement — conversation, reminiscence, simple activities',
              'Meal preparation with attention to nutrition and familiar foods the person enjoys',
              'Night care for those who wake, wander, or become distressed during the night',
              'Escorting to appointments, shops, or familiar places in and around Denbigh',
              'Communication with family — regular updates so you know how your loved one is doing',
              'Liaison with GPs, memory clinics, and health professionals on the person\'s behalf',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-slate-50 rounded-lg p-4">
                <svg className="w-5 h-5 text-welsh-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-slate-600">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 leading-relaxed mt-6">
            This can be delivered as part of a regular <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> package, or combined with <Link href="/areas/denbigh/overnight-care" className="text-welsh-red hover:text-welsh-red-light font-medium">overnight care in Denbigh</Link> for those with more advanced needs.
          </p>
        </div>
      </section>

      {/* Staff Training */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Trained, Specialist Dementia Carers</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Good dementia care requires more than general care training. It demands specialist knowledge, patience, and an ability to adapt moment by moment to the person&apos;s changing needs and emotional state. Every carer at Accredilink who delivers dementia care has completed specialist training that goes well beyond the basic requirements.
            </p>
            <p className="text-slate-600 leading-relaxed">
              All of our carers are Dementia Friends and are registered with Social Care Wales. They complete ongoing continuing professional development (CPD) that includes advanced dementia care techniques, communication strategies for people with cognitive impairment, understanding and responding to behavioural changes, and supporting people at different stages of the condition.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We match carers to individuals based on personality, skills, and language. For someone living with dementia in Denbigh, consistency matters enormously &mdash; seeing the same familiar face, hearing the same voice, and following the same routines reduces confusion and builds trust. We prioritise continuity of care so that your loved one sees carers they know and feel comfortable with at every visit.
            </p>
          </div>
        </div>
      </section>

      {/* Working with Local Services */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Working with Denbigh Health Services</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Dementia care does not happen in isolation. We work alongside the health and social care services that support people with dementia in Denbigh and across Denbighshire. This includes close liaison with Denbigh Medical Practice (Bryn Heulog) for medication reviews and GP appointments, memory assessment services run by Betsi Cadwaladr University Health Board, community mental health teams, and district nursing.
            </p>
            <p className="text-slate-600 leading-relaxed">
              When a change in behaviour or health is noticed during our care visits, we communicate promptly with the relevant professionals. Early intervention can prevent a crisis, avoid unnecessary hospital admissions to Glan Clwyd Hospital, and keep the person safely at home. Our carers are trained to observe and report changes &mdash; subtle shifts in mood, appetite, sleep patterns, or cognition that a family member visiting less frequently might not notice.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We also work with Denbighshire County Council Social Services for care needs reviews, funding assessments, and transitions between levels of care. If someone&apos;s dementia progresses and they need more support, we can increase the care package seamlessly &mdash; from additional <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> visits to round-the-clock <Link href="/areas/denbigh/overnight-care" className="text-welsh-red hover:text-welsh-red-light font-medium">overnight care in Denbigh</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* Staying at Home & Family Support */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Staying at Home in Denbigh</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                There is strong evidence that people with dementia benefit from remaining in familiar surroundings. The home they have lived in for decades, the view from their window, the route to the corner shop, the neighbour who waves hello &mdash; these things provide a sense of continuity and identity that a move to residential care can disrupt.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                In Denbigh, where many people have lived their entire lives in the same community, this connection to place is especially strong. Our dementia care service is designed to preserve that connection, keeping people in their Vale of Clwyd homes where they are surrounded by everything that is familiar and comforting.
              </p>
              <p className="text-slate-600 leading-relaxed">
                With the right level of support &mdash; whether that is a few visits a day, <Link href="/areas/denbigh/overnight-care" className="text-welsh-red hover:text-welsh-red-light font-medium">overnight care in Denbigh</Link>, or round-the-clock support &mdash; many people with dementia can remain safely at home far longer than families expect.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Support for Family Carers</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Caring for a loved one with dementia is one of the most demanding roles anyone can take on. The emotional toll, the physical exhaustion, the grief of watching someone you love change &mdash; it takes an immense amount of strength. If you are caring for someone with dementia in Denbigh, you do not have to do it alone.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                We offer <Link href="/services/respite-care" className="text-welsh-red hover:text-welsh-red-light font-medium">respite care</Link> to give you a break &mdash; from a few hours a week so you can attend appointments, meet friends, or simply rest, through to longer breaks of days or weeks. We also provide emergency respite when a family carer becomes ill or reaches breaking point and needs immediate help.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Our team is always available to talk through concerns, share guidance, and help you navigate the challenges of dementia care. You are not just a client &mdash; you are a partner in your loved one&apos;s care, and we treat you with the same compassion and respect.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Welsh Language Dementia Care */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Welsh Language Dementia Care (Active Offer)</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Language takes on a critical importance in dementia care. As the condition progresses, many Welsh speakers in Denbigh revert to their first language &mdash; the language of their childhood, their emotions, and their deepest memories. A person who has spoken English fluently for decades may, as dementia advances, find themselves only able to communicate comfortably in Welsh.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Under the Active Offer framework (More Than Just Words), Accredilink proactively offers care in Welsh. We do not wait for the individual or their family to ask &mdash; we make it clear from the start that Welsh-language care is available. For someone with dementia, being cared for in their mother tongue can reduce confusion, ease anxiety, and help them feel understood and safe.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We actively recruit Welsh-speaking carers from the Denbigh area and prioritise Welsh language skills when matching carers to individuals who need this provision. This commitment to Welsh-language dementia care is not a marketing claim &mdash; it is a fundamental part of how we deliver person-centred care in a bilingual community.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions About Dementia Care in Denbigh</h2>
          <div className="space-y-4">
            {[
              {
                q: 'What types of dementia do you support in Denbigh?',
                a: 'We support people living with all types of dementia in Denbigh, including Alzheimer\'s disease, vascular dementia, Lewy body dementia, frontotemporal dementia, and mixed dementia. Our carers receive specialist training for each condition and tailor their approach to the individual\'s specific needs and stage of progression.',
              },
              {
                q: 'Can dementia care at home in Denbigh replace residential care?',
                a: 'In many cases, yes. With the right support — from regular domiciliary visits to round-the-clock overnight care — people with dementia can continue living safely and comfortably in their own home in Denbigh. Familiar surroundings, established routines, and known neighbours can all help reduce confusion and anxiety. We assess each situation individually to ensure home care is safe and appropriate.',
              },
              {
                q: 'Are your dementia carers in Denbigh specially trained?',
                a: 'Yes. All our carers who deliver dementia care are Dementia Friends and have completed specialist dementia training. They are registered with Social Care Wales and undertake ongoing CPD including advanced dementia care techniques, communication strategies, and behaviour management.',
              },
              {
                q: 'Do you offer Welsh-language dementia care in Denbigh?',
                a: 'Yes. Under the Active Offer framework, we proactively offer care in Welsh. This is particularly important for people with dementia, who often revert to their first language as the condition progresses. Many of our Denbigh-based carers are fluent Welsh speakers.',
              },
              {
                q: 'Can you provide respite care for family carers of someone with dementia in Denbigh?',
                a: 'Absolutely. Caring for a loved one with dementia is physically and emotionally demanding. We offer planned respite care — from a few hours a week to longer breaks — so family carers can rest and recharge. We also provide emergency respite when a carer becomes ill or is unable to continue at short notice. Call 01824 538688 to discuss respite options.',
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

      {/* Related Services */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Related Dementia Care Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/areas/denbigh/home-care" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
              <span className="font-bold text-slate-900">Home Care in Denbigh</span>
              <span className="block text-sm text-slate-500 mt-1">Full range of home care services</span>
            </Link>
            <Link href="/areas/denbigh/overnight-care" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
              <span className="font-bold text-slate-900">Overnight Care in Denbigh</span>
              <span className="block text-sm text-slate-500 mt-1">Waking night &amp; sleep-in</span>
            </Link>
            <Link href="/areas/llangollen/dementia-care" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
              <span className="font-bold text-slate-900">Dementia Care in Llangollen</span>
              <span className="block text-sm text-slate-500 mt-1">Dee Valley dementia support</span>
            </Link>
            <Link href="/areas/denbighshire/emergency-home-care" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
              <span className="font-bold text-slate-900">Emergency Home Care</span>
              <span className="block text-sm text-slate-500 mt-1">Same-day urgent care</span>
            </Link>
            <Link href="/areas" className="block bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200">
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
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Need Dementia Care at Home in Denbigh?</h2>
          <p className="text-slate-300 text-lg mb-8">
            If someone you love has been diagnosed with dementia, let us help. Our specialist carers in Denbigh provide compassionate, person-centred support that keeps your loved one safe, comfortable, and connected to their community.
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

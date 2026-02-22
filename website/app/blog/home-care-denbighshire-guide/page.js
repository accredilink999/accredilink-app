import Link from 'next/link';

export const metadata = {
  title: 'The Complete Guide to Home Care in Denbighshire',
  description: 'Everything families need to know about arranging home care in Denbighshire. Services, funding, CIW standards & how to choose a local care provider.',
  openGraph: {
    title: 'The Complete Guide to Home Care in Denbighshire | Accredilink CRT',
    description: 'Everything families need to know about arranging home care in Denbighshire. Services, funding, CIW standards & how to choose a local care provider.',
    type: 'article',
    locale: 'en_GB',
    publishedTime: '2026-02-22T00:00:00Z',
    authors: ['Accredilink Community Response Taskforce'],
  },
};

export default function HomeCareGuide() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: 'The Complete Guide to Home Care in Denbighshire',
        description: 'Everything families need to know about arranging home care in Denbighshire, North Wales. Covers services, funding options, CIW regulation, and how to choose the right local care provider.',
        author: {
          '@type': 'Organization',
          name: 'Accredilink Community Response Taskforce',
          url: 'https://accredilinkcare.co.uk',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Accredilink Community Response Taskforce',
          url: 'https://accredilinkcare.co.uk',
        },
        datePublished: '2026-02-22',
        dateModified: '2026-02-22',
        mainEntityOfPage: 'https://accredilinkcare.co.uk/blog/home-care-denbighshire-guide',
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How much does home care cost in Denbighshire?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Home care costs in Denbighshire vary depending on the level of support needed. Denbighshire County Council may fund care following a needs assessment under the Social Services and Well-being (Wales) Act 2014. Private care rates depend on the hours, complexity, and type of care required. Contact Accredilink on 01824 538688 for a free, no-obligation discussion.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the difference between domiciliary care and residential care?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Domiciliary care is professional care delivered in your own home, allowing you to remain in familiar surroundings. Residential care involves moving into a care home. Many families in Denbighshire prefer domiciliary care because it preserves independence, maintains community connections, and is often more cost-effective.',
            },
          },
          {
            '@type': 'Question',
            name: 'Is home care in Denbighshire regulated?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. All domiciliary care providers in Wales must be registered with and regulated by Care Inspectorate Wales (CIW) under the Regulation and Inspection of Social Care (Wales) Act 2016. Accredilink CRT is fully CIW registered and subject to regular inspections.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can I get emergency home care in Denbighshire?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Accredilink CRT provides emergency home care across Denbighshire, including same-day response for urgent situations such as hospital discharge, falls, carer breakdown, and sudden illness. Our emergency responders are PHEC qualified. Call 01824 538688.',
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Blog
          </Link>
          <span className="inline-block px-3 py-1 bg-welsh-red/20 text-welsh-red rounded-full text-sm font-medium mb-4">Guide</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            The Complete Guide to Home Care in Denbighshire
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Everything families in Denbighshire need to know about arranging professional care at home &mdash; from understanding your options to choosing the right local provider.
          </p>
          <p className="mt-4 text-sm text-slate-400">Published 22 February 2026 &middot; By Accredilink CRT</p>
        </div>
      </section>

      {/* Article Body */}
      <article className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-slate prose-lg max-w-none">

          <p className="text-xl text-slate-700 leading-relaxed">
            When a family member needs care, the decisions can feel overwhelming. Should they stay at home or move into a care home? How do you arrange it? Who pays? And how do you know you are choosing the right provider?
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            This guide is written specifically for families in Denbighshire &mdash; covering Denbigh, Llangollen, Ruthin, Rhyl, Prestatyn, St Asaph, Corwen, and the surrounding rural communities of the Vale of Clwyd and Dee Valley. It explains the types of home care available, how care is regulated in Wales, your funding options, and what to look for in a local care provider.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">What Is Home Care?</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Home care &mdash; also called <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> &mdash; is professional care and support delivered in your own home. Rather than moving into a residential care home, you receive visits from trained carers who help with the tasks you need support with, while you continue living in familiar surroundings.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            For many older people in Denbighshire, staying at home means staying close to the community they know &mdash; their neighbours in Denbigh, their walks along the Llangollen Canal, their local chapel or church. Home care makes this possible, even when health or mobility starts to decline.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Types of Home Care Available in Denbighshire</h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-6">
            Home care is not one-size-fits-all. Depending on your needs, you might require one or more of the following:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose mb-8">
            <Link href="/services/domiciliary-care" className="block p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-bold text-slate-900 mb-1">Domiciliary Care</h3>
              <p className="text-sm text-slate-600">Personal care, medication, meals, and daily living support during regular visits.</p>
            </Link>
            <Link href="/areas/denbigh/dementia-care" className="block p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-bold text-slate-900 mb-1">Dementia Care</h3>
              <p className="text-sm text-slate-600">Specialist support for people living with Alzheimer&apos;s and other forms of dementia.</p>
            </Link>
            <Link href="/areas/denbigh/overnight-care" className="block p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-bold text-slate-900 mb-1">Overnight Care</h3>
              <p className="text-sm text-slate-600">Waking night or sleep-in care for safety, falls prevention, and peace of mind.</p>
            </Link>
            <Link href="/services/respite-care" className="block p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-bold text-slate-900 mb-1">Respite Care</h3>
              <p className="text-sm text-slate-600">Short-term care to give family carers a well-deserved break.</p>
            </Link>
            <Link href="/areas/denbighshire/emergency-home-care" className="block p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-bold text-slate-900 mb-1">Emergency Home Care</h3>
              <p className="text-sm text-slate-600">Same-day urgent care for falls, hospital discharge, and sudden illness.</p>
            </Link>
            <Link href="/services/palliative-care" className="block p-5 bg-slate-50 rounded-xl border border-slate-200 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="font-bold text-slate-900 mb-1">Palliative Care</h3>
              <p className="text-sm text-slate-600">Compassionate end-of-life support delivered with dignity at home.</p>
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">How Home Care Is Regulated in Wales</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            In Wales, all domiciliary care providers must be registered with <strong>Care Inspectorate Wales (CIW)</strong> under the Regulation and Inspection of Social Care (Wales) Act 2016. This means they are subject to regular inspections, must employ registered and qualified care workers, and must meet national standards for the quality and safety of care.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            When choosing a home care provider in Denbighshire, always check that they are CIW registered. You can verify this on the <a href="https://www.careinspectorate.wales" target="_blank" rel="noopener noreferrer" className="text-welsh-red hover:text-welsh-red-light font-medium">CIW website</a>. All carers should also be registered with <strong>Social Care Wales</strong> and hold relevant qualifications.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            Accredilink CRT is fully CIW registered and regulated. Our care is delivered in line with the Social Services and Well-being (Wales) Act 2014, which places the individual at the centre of their care and focuses on achieving personal wellbeing outcomes.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Funding Home Care in Denbighshire</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Care funding in Denbighshire is managed by <strong>Denbighshire County Council Social Services</strong>. To find out if you are eligible for funded care, you need to request a care needs assessment. This is a free process and is your right under Welsh law.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            Following the assessment, the council will determine what level of support is needed and whether funding is available. In Wales, the maximum weekly charge for non-residential care is currently capped, meaning there is a limit on what you will be asked to contribute.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            If you are arranging care privately, there are no minimum package requirements. Whether you need a single morning visit or comprehensive overnight support, a good provider will build a package around your needs and budget. Visit our <Link href="/funding-guidance" className="text-welsh-red hover:text-welsh-red-light font-medium">funding guidance page</Link> for more details.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Why Local Matters: Choosing a Denbighshire Care Provider</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Denbighshire is a county of contrasts &mdash; from the busy coastal towns of Rhyl and Prestatyn to the quiet rural communities of the Vale of Clwyd and the Dee Valley around Llangollen. A care provider who truly knows this area understands the challenges: the narrow lanes leading to isolated farmhouses, the limited public transport, the distances between communities, and the importance of Welsh language provision.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            Accredilink CRT is based in the heart of Denbigh, at The Hummingbird on High Street. Our carers live and work in the communities they serve. They know the roads, they know the local GP practices and hospitals, and they understand the culture and character of Denbighshire. When you call us, you are speaking to someone local &mdash; not a national call centre.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">What Makes Accredilink Different</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Most domiciliary care providers offer planned, routine visits. Accredilink does too &mdash; but we also maintain something unique: a team of <strong>trained emergency care responders</strong> who hold qualifications in pre-hospital emergency care (PHEC). This means we can respond to urgent situations &mdash; falls, sudden illness, hospital discharge at short notice &mdash; with staff who combine care skills with emergency first aid capability.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            We work in partnership with <strong>Betsi Cadwaladr University Health Board</strong>, <strong>Glan Clwyd Hospital</strong>, <strong>Denbighshire County Council</strong>, and local GP practices to provide joined-up care. We offer <Link href="/areas/denbigh/home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">home care in Denbigh</Link>, <Link href="/areas/llangollen/home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">home care in Llangollen</Link>, and across the whole of Denbighshire, Conwy, and Wrexham.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">Welsh Language Care</h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Under the <strong>More Than Just Words</strong> framework (the Active Offer), Welsh-speaking individuals in Denbighshire have the right to receive care in their preferred language without having to ask. This is particularly important for people living with dementia, who may revert to their first language as their condition progresses.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            Accredilink actively recruits Welsh-speaking carers across our coverage area. If Welsh language care is important to you or your family member, we will match a Welsh-speaking carer wherever possible.
          </p>

          <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">How to Arrange Home Care</h2>
          <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4 my-8">
            <div className="p-5 bg-welsh-red/5 rounded-xl border border-welsh-red/10 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-welsh-red/10 flex items-center justify-center text-welsh-red font-bold">1</div>
              <h3 className="font-bold text-slate-900 mb-1">Call Us</h3>
              <p className="text-sm text-slate-600">Ring 01824 538688 or <Link href="/contact" className="text-welsh-red hover:text-welsh-red-light font-medium">contact us online</Link>.</p>
            </div>
            <div className="p-5 bg-welsh-red/5 rounded-xl border border-welsh-red/10 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-welsh-red/10 flex items-center justify-center text-welsh-red font-bold">2</div>
              <h3 className="font-bold text-slate-900 mb-1">Free Assessment</h3>
              <p className="text-sm text-slate-600">We visit, listen, and build a personalised care plan around your needs.</p>
            </div>
            <div className="p-5 bg-welsh-red/5 rounded-xl border border-welsh-red/10 text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-welsh-red/10 flex items-center justify-center text-welsh-red font-bold">3</div>
              <h3 className="font-bold text-slate-900 mb-1">Care Begins</h3>
              <p className="text-sm text-slate-600">Matched carers start delivering support &mdash; often within days.</p>
            </div>
          </div>
        </div>
      </article>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <summary className="font-semibold text-slate-900 cursor-pointer">How much does home care cost in Denbighshire?</summary>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Costs vary depending on the level of support. Denbighshire County Council may fund care following a needs assessment. The weekly charge for non-residential care is capped in Wales. Private care rates depend on hours and complexity. Contact us on 01824 538688 for a free, no-obligation discussion.
              </p>
            </details>
            <details className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <summary className="font-semibold text-slate-900 cursor-pointer">What is the difference between domiciliary care and residential care?</summary>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Domiciliary care is delivered in your own home &mdash; you stay where you are and receive visits from trained carers. Residential care involves moving into a care home. Many families in Denbighshire prefer domiciliary care because it preserves independence and maintains community connections.
              </p>
            </details>
            <details className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <summary className="font-semibold text-slate-900 cursor-pointer">Is home care regulated in Wales?</summary>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Yes. All providers must be registered with Care Inspectorate Wales (CIW). Carers must be registered with Social Care Wales. Accredilink CRT is fully CIW registered and inspected.
              </p>
            </details>
            <details className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <summary className="font-semibold text-slate-900 cursor-pointer">Can I get emergency home care in Denbighshire?</summary>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Yes. Accredilink provides <Link href="/areas/denbighshire/emergency-home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">emergency home care across Denbighshire</Link>, including same-day response for hospital discharge, falls, carer breakdown, and sudden illness. Call 01824 538688.
              </p>
            </details>
            <details className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <summary className="font-semibold text-slate-900 cursor-pointer">Do you provide Welsh language care?</summary>
              <p className="mt-3 text-slate-600 leading-relaxed">
                Yes. Under the Active Offer (More Than Just Words), we provide care in Welsh without you having to ask. We actively recruit Welsh-speaking carers, particularly important for <Link href="/areas/denbigh/dementia-care" className="text-welsh-red hover:text-welsh-red-light font-medium">dementia care in Denbigh</Link> and the Dee Valley.
              </p>
            </details>
            <details className="group p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <summary className="font-semibold text-slate-900 cursor-pointer">What areas do you cover?</summary>
              <p className="mt-3 text-slate-600 leading-relaxed">
                We cover all of Denbighshire (Denbigh, Llangollen, Ruthin, Rhyl, Prestatyn, St Asaph, Corwen, Bodelwyddan), plus Conwy and Wrexham. See our <Link href="/areas" className="text-welsh-red hover:text-welsh-red-light font-medium">areas we cover</Link> page for full details.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-welsh-red to-welsh-red-light text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Arrange Home Care in Denbighshire?</h2>
          <p className="text-lg text-red-100 mb-8">
            Call us today for a free, no-obligation conversation. We are local, we are CIW regulated, and we are here to help your family.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:01824538688" className="inline-flex items-center justify-center px-8 py-4 bg-white text-welsh-red font-bold rounded-xl hover:bg-red-50 transition-colors text-lg">
              Call 01824 538688
            </a>
            <Link href="/contact" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-lg">
              Contact Us Online
            </Link>
          </div>
          <p className="mt-6 text-sm text-red-200">
            Accredilink CRT &middot; The Hummingbird, 27-29 High St, Denbigh LL16 3HY
          </p>
        </div>
      </section>
    </>
  );
}

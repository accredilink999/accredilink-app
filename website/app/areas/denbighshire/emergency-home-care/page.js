import Link from 'next/link';

export const metadata = {
  title: 'Emergency Home Care Denbighshire | Same-Day Care',
  description: 'Need urgent home care in Denbighshire? Accredilink provides same-day emergency care across Denbigh, Llangollen & all of Denbighshire. Call 01824 538688.',
  alternates: {
    canonical: "https://accredilinkcare.co.uk/areas/denbighshire/emergency-home-care",
  },
};

export default function EmergencyHomeCareDenbighshire() {
  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Accredilink Community Response Taskforce',
    description: 'Same-day emergency home care services across Denbighshire, including Denbigh, Llangollen, Ruthin, Rhyl, Prestatyn, St Asaph, Corwen, and the Vale of Clwyd.',
    url: 'https://accredilinkcare.co.uk/areas/denbighshire/emergency-home-care',
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
      '@type': 'AdministrativeArea',
      name: 'Denbighshire',
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
        name: 'What is emergency home care in Denbighshire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Emergency home care is urgent, same-day or next-day care delivered in your own home when an unexpected crisis arises. This includes hospital discharge support, falls response, carer breakdown cover, sudden illness, and end-of-life care. Accredilink provides emergency home care across all of Denbighshire from our base in Denbigh.',
        },
      },
      {
        '@type': 'Question',
        name: 'How quickly can Accredilink start emergency care in Denbighshire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We can often begin emergency care on the same day you contact us. Our trained emergency responders are on shift across Denbighshire, meaning we can carry out a rapid assessment and start delivering care within hours. Call 01824 538688 for immediate assistance.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which areas of Denbighshire do you cover for emergency home care?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We cover the whole of Denbighshire including Denbigh, Llangollen, Ruthin, Rhyl, Prestatyn, St Asaph, Corwen, Bodelwyddan, the Vale of Clwyd, and the Dee Valley. Our team knows these communities well and can reach rural locations quickly.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Accredilink regulated by CIW for emergency home care?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Accredilink Community Response Taskforce is fully registered with and regulated by Care Inspectorate Wales (CIW). All emergency care we deliver meets the same high standards as our planned domiciliary care, in line with the Regulation and Inspection of Social Care (Wales) Act 2016.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can you provide emergency care after hospital discharge from Glan Clwyd?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We work closely with Betsi Cadwaladr University Health Board and Glan Clwyd Hospital to facilitate safe hospital discharges. If your loved one is being discharged and needs care at home urgently, we can often arrange same-day support so they do not have to wait in hospital any longer than necessary.',
        },
      },
      {
        '@type': 'Question',
        name: 'What qualifications do your emergency care responders hold?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our emergency responders hold Pre-Hospital Emergency Care (PHEC) qualifications alongside their domiciliary care training and Social Care Wales registration. They are trained in basic life support, falls assessment, safe lifting, and immediate first aid, giving them a dual skill set unique in the Denbighshire care sector.',
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
            Same-Day Emergency Care
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Emergency Home Care in Denbighshire
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-8">
            When a care crisis happens, you need a provider who can respond immediately. Accredilink delivers same-day emergency home care across Denbighshire, from the Vale of Clwyd to the Dee Valley.
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
              Contact Us Online
            </Link>
          </div>
        </div>
      </section>

      {/* What is Emergency Home Care */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">What Is Emergency Home Care?</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Emergency home care is urgent, unplanned care delivered in your own home when a sudden crisis makes it impossible to manage without professional support. Unlike planned <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> visits that are scheduled days or weeks in advance, emergency home care responds to the unexpected &mdash; situations where waiting simply is not an option.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Across Denbighshire, families face urgent care situations every day. A parent is discharged from Glan Clwyd Hospital late on a Friday afternoon with no care package in place. An elderly husband who provides round-the-clock care for his wife is taken ill himself. A fall at home leaves someone unable to manage their personal care without help. These are the moments when having a local, responsive care provider makes all the difference.
            </p>
            <p className="text-slate-600 leading-relaxed">
              At Accredilink Community Response Taskforce, we have built our service specifically to handle these situations. Based at The Hummingbird on Denbigh High Street, we maintain a team of trained emergency care responders on shift who are ready to attend urgent situations across the county &mdash; from Rhyl and Prestatyn on the coast to Corwen and Llangollen in the Dee Valley.
            </p>
          </div>
        </div>
      </section>

      {/* When Families Need Emergency Care */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">When Families in Denbighshire Need Emergency Care</h2>
          <p className="text-slate-600 text-lg mb-8">
            Care crises rarely come with advance warning. Here are the most common situations where Denbighshire families turn to our emergency home care service:
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Hospital Discharge',
                desc: 'When your loved one is ready to leave Glan Clwyd Hospital, Denbigh Infirmary, or Ruthin Community Hospital but has no care package in place, we provide same-day support so they can come home safely rather than occupying a hospital bed.',
              },
              {
                title: 'Falls at Home',
                desc: 'A fall can leave someone unable to get up, manage personal care, or feel safe at home alone. Our responders attend quickly, assess the situation, help with safe lifting, and put immediate care in place while longer-term arrangements are made.',
              },
              {
                title: 'Carer Breakdown',
                desc: 'When a family carer becomes ill, is injured, or is simply overwhelmed and cannot continue, we step in at short notice to provide cover &mdash; ensuring the person they care for is not left without support.',
              },
              {
                title: 'Sudden Illness or Deterioration',
                desc: 'A rapid decline in health can mean someone who was managing independently yesterday cannot cope today. We provide urgent personal care, medication support, and welfare checks while the situation is assessed.',
              },
              {
                title: 'End-of-Life Emergencies',
                desc: 'When someone receiving palliative care at home deteriorates suddenly, families need immediate additional support. We work alongside district nurses and the palliative care team to provide urgent comfort care. Learn more about our dedicated palliative care service.',
              },
              {
                title: 'Care Provider Failure',
                desc: 'If an existing care provider has let you down &mdash; missed visits, withdrawn services, or closed &mdash; we can step in urgently to maintain continuity of care for vulnerable individuals across Denbighshire.',
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

      {/* PHEC Trained Team */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">PHEC-Qualified Emergency Responders: What Sets Us Apart</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Most domiciliary care providers in Denbighshire offer planned, routine visits. They cannot respond to emergencies because they do not have the staffing model, the training, or the infrastructure to do so. Accredilink is fundamentally different.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our emergency responders hold Pre-Hospital Emergency Care (PHEC) qualifications alongside their domiciliary care training and Social Care Wales registration. This dual skill set is unique in North Wales. When one of our responders arrives at your home, they can assess the situation, deliver immediate first aid or basic life support if needed, and then provide the personal care, medication management, and practical support the individual requires &mdash; all in a single visit from a single, highly trained professional.
            </p>
            <p className="text-slate-600 leading-relaxed">
              This means fewer handoffs between services, faster resolution, and a calmer experience for the individual and their family. It also means we can keep people safely at home who might otherwise face an unnecessary ambulance call or hospital admission &mdash; easing pressure on the NHS while delivering better outcomes for the person.
            </p>
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Areas We Cover Across Denbighshire</h2>
          <p className="text-slate-600 text-lg mb-8">
            Our emergency home care service covers the full extent of Denbighshire (Sir Ddinbych). Based centrally in Denbigh, we can reach communities throughout the county quickly and reliably, including:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              'Denbigh (Dinbych)',
              'Llangollen',
              'Ruthin (Rhuthun)',
              'Rhyl (Y Rhyl)',
              'Prestatyn',
              'St Asaph (Llanelwy)',
              'Corwen',
              'Bodelwyddan',
              'Vale of Clwyd',
              'Dee Valley',
              'Henllan & Trefnant',
              'Llandyrnog & Llanrhaeadr',
            ].map((area) => (
              <div key={area} className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-sm border border-slate-100">
                <svg className="w-5 h-5 text-welsh-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-slate-700 font-medium">{area}</span>
              </div>
            ))}
          </div>
          <p className="text-slate-600 leading-relaxed">
            Whether you need <Link href="/areas/denbigh/home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">home care in Denbigh</Link> or <Link href="/areas/llangollen/home-care" className="text-welsh-red hover:text-welsh-red-light font-medium">home care in Llangollen</Link>, our local knowledge means we understand the geography, the road conditions, and the communities we serve. Rural Denbighshire can feel isolated &mdash; our service ensures that help is always within reach, no matter how remote the location.
          </p>
          <p className="text-slate-600 leading-relaxed mt-4">
            Explore all the <Link href="/areas" className="text-welsh-red hover:text-welsh-red-light font-medium">areas we cover</Link> for a full breakdown of our service reach.
          </p>
        </div>
      </section>

      {/* Partnership Working */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Working with Local Health and Social Care Partners</h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Emergency home care does not operate in isolation. Effective urgent response requires strong partnerships with the health and social care organisations that serve Denbighshire. Accredilink maintains close working relationships with:
            </p>
            <ul className="space-y-3 my-6">
              {[
                'Betsi Cadwaladr University Health Board (BCUHB) — the NHS health board responsible for North Wales, including hospital services, community health teams, and district nursing.',
                'Glan Clwyd Hospital, Bodelwyddan — the main district general hospital for Denbighshire, where we facilitate urgent hospital discharges and receive referrals for emergency community care.',
                'Denbighshire County Council Social Services — the local authority responsible for adult social care assessments, care planning, and commissioning. Their emergency duty team refers to us when urgent home care is needed outside normal hours.',
                'Welsh Ambulance Service — we coordinate with ambulance crews to provide follow-up care after non-conveyance decisions, keeping people safely at home when a hospital visit is not clinically necessary.',
                'GP practices across Denbighshire — including Denbigh Medical Practice, Llangwyfan Surgery, and surgeries in Ruthin, Rhyl, St Asaph, and Llangollen.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-600">
                  <svg className="w-5 h-5 text-welsh-red flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-slate-600 leading-relaxed">
              These partnerships mean referrals are seamless, information is shared appropriately, and the care we provide fits within the wider support network around each individual. When you call us for <Link href="/services/emergency-response" className="text-welsh-red hover:text-welsh-red-light font-medium">emergency response</Link>, you are accessing a service that is integrated with the NHS and local authority systems that serve Denbighshire.
            </p>
          </div>
        </div>
      </section>

      {/* CIW & Welsh Language */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">CIW Regulated Emergency Care</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Accredilink Community Response Taskforce is registered with and regulated by Care Inspectorate Wales (CIW). Every emergency care visit we deliver meets the same rigorous standards as our planned <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link>, in full compliance with the Regulation and Inspection of Social Care (Wales) Act 2016.
              </p>
              <p className="text-slate-600 leading-relaxed">
                All of our care workers are registered with Social Care Wales, hold relevant qualifications, and undergo enhanced DBS checks. In an emergency, you can trust that the person arriving at your door is fully trained, vetted, and accountable to the highest regulatory standards in Welsh social care.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Welsh Language Care (Active Offer)</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                In Denbighshire, the Welsh language is part of daily life for many families &mdash; particularly among older people who may have Welsh as their first language. Under the Active Offer framework (More Than Just Words), we proactively offer care in Welsh without the individual having to ask.
              </p>
              <p className="text-slate-600 leading-relaxed">
                This matters enormously during an emergency, when people are frightened, confused, or in pain. Being spoken to in their own language by a carer who understands their culture brings comfort and clarity at the moment it is needed most. We actively recruit Welsh-speaking carers across the county to maintain this commitment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Arrange Emergency Care */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">How to Arrange Emergency Home Care in Denbighshire</h2>
          <p className="text-slate-600 text-lg mb-8">
            Arranging emergency care with Accredilink is straightforward, even in a crisis. Here is how it works:
          </p>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Call Us',
                desc: 'Phone 01824 538688 and tell us what has happened. Our team will listen, ask the right questions, and assess the urgency of the situation. If you are a hospital discharge coordinator, social worker, or GP, we have a dedicated referral pathway to expedite the process.',
              },
              {
                step: '2',
                title: 'Rapid Assessment',
                desc: 'We carry out a rapid assessment of the individual\'s needs &mdash; either over the phone or with a short visit to the home, depending on the situation. This allows us to understand what care is needed and match the right responder to the task.',
              },
              {
                step: '3',
                title: 'Care Starts Same Day',
                desc: 'In most cases, we can have a trained emergency responder at the person\'s home on the same day. Care begins immediately, with a focus on safety, dignity, and stabilising the situation. We then work with the individual, their family, and any involved professionals to plan ongoing support.',
              },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-5 bg-slate-50 rounded-xl p-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-welsh-red flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{item.step}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-600 leading-relaxed mt-8">
            Once the immediate emergency is resolved, we can transition seamlessly into ongoing care &mdash; whether that means regular <Link href="/services/domiciliary-care" className="text-welsh-red hover:text-welsh-red-light font-medium">domiciliary care</Link> visits, <Link href="/services/respite-care" className="text-welsh-red hover:text-welsh-red-light font-medium">respite care</Link> for exhausted family carers, or specialist support such as <Link href="/areas/denbigh/dementia-care" className="text-welsh-red hover:text-welsh-red-light font-medium">dementia care in Denbigh</Link> or <Link href="/areas/denbigh/overnight-care" className="text-welsh-red hover:text-welsh-red-light font-medium">overnight care in Denbigh</Link>.
          </p>
        </div>
      </section>

      {/* Town Links */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Emergency Care in Your Local Town</h2>
          <p className="text-slate-600 text-lg mb-8">
            We provide tailored care services in communities right across Denbighshire. Visit our dedicated town pages for more information about what is available near you:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/areas/denbigh/home-care" className="block bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Home Care in Denbigh</h3>
              <p className="text-slate-600 text-sm">Personal care, dementia support, and emergency response from our Denbigh High Street base.</p>
            </Link>
            <Link href="/areas/llangollen/home-care" className="block bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Home Care in Llangollen</h3>
              <p className="text-slate-600 text-sm">Domiciliary care, overnight care, and emergency support across Llangollen and the Dee Valley.</p>
            </Link>
            <Link href="/areas/denbigh/dementia-care" className="block bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Dementia Care in Denbigh</h3>
              <p className="text-slate-600 text-sm">Person-centred specialist dementia support from trained local carers in the Vale of Clwyd.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Frequently Asked Questions About Emergency Home Care in Denbighshire</h2>
          <div className="space-y-4">
            {[
              {
                q: 'What is emergency home care in Denbighshire?',
                a: 'Emergency home care is urgent, same-day or next-day care delivered in your own home when an unexpected crisis arises. This includes hospital discharge support, falls response, carer breakdown cover, sudden illness, and end-of-life care. Accredilink provides emergency home care across all of Denbighshire from our base in Denbigh.',
              },
              {
                q: 'How quickly can Accredilink start emergency care in Denbighshire?',
                a: 'We can often begin emergency care on the same day you contact us. Our trained emergency responders are on shift across Denbighshire, meaning we can carry out a rapid assessment and start delivering care within hours. Call 01824 538688 for immediate assistance.',
              },
              {
                q: 'Which areas of Denbighshire do you cover for emergency home care?',
                a: 'We cover the whole of Denbighshire including Denbigh, Llangollen, Ruthin, Rhyl, Prestatyn, St Asaph, Corwen, Bodelwyddan, the Vale of Clwyd, and the Dee Valley. Our team knows these communities well and can reach rural locations quickly.',
              },
              {
                q: 'Is Accredilink regulated by CIW for emergency home care?',
                a: 'Yes. Accredilink Community Response Taskforce is fully registered with and regulated by Care Inspectorate Wales (CIW). All emergency care we deliver meets the same high standards as our planned domiciliary care, in line with the Regulation and Inspection of Social Care (Wales) Act 2016.',
              },
              {
                q: 'Can you provide emergency care after hospital discharge from Glan Clwyd?',
                a: 'Yes. We work closely with Betsi Cadwaladr University Health Board and Glan Clwyd Hospital to facilitate safe hospital discharges. If your loved one is being discharged and needs care at home urgently, we can often arrange same-day support so they do not have to wait in hospital any longer than necessary.',
              },
              {
                q: 'What qualifications do your emergency care responders hold?',
                a: 'Our emergency responders hold Pre-Hospital Emergency Care (PHEC) qualifications alongside their domiciliary care training and Social Care Wales registration. They are trained in basic life support, falls assessment, safe lifting, and immediate first aid, giving them a dual skill set unique in the Denbighshire care sector.',
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

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-welsh-red" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Need Emergency Home Care in Denbighshire Right Now?</h2>
          <p className="text-slate-300 text-lg mb-8">
            Do not wait. Call our team and we will arrange same-day emergency care for your loved one. We are here around the clock for families across Denbighshire.
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
              Contact Us
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

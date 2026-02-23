import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Respite Care at Home in Denbighshire | Relief for Family Carers | Accredilink',
  description:
    'Respite care at home in Denbighshire from Accredilink. Give family carers a break with professional in-home respite support across Denbigh, Ruthin, Llangollen, Rhyl & all of Denbighshire. CIW regulated. Call 01824 538688.',
  keywords:
    'respite care at home Denbighshire, respite care Denbighshire, in-home respite care North Wales, carer break Denbighshire, sit-in service Denbighshire',
  openGraph: {
    title: 'Respite Care at Home in Denbighshire | Accredilink',
    description:
      'Professional respite care at home across Denbighshire. CIW regulated relief for family carers, delivered by trained local carers.',
    url: 'https://accredilinkcare.co.uk/areas/denbighshire/respite-care-at-home',
    type: 'website',
  },
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/areas/denbighshire/respite-care-at-home',
  },
};

export default function RespiteCareAtHomeDenbighshire() {
  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Accredilink Community Response Taskforce',
    description:
      'Respite care at home across Denbighshire. Professional in-home respite support for family carers, CIW regulated.',
    url: 'https://accredilinkcare.co.uk/areas/denbighshire/respite-care-at-home',
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
      '@type': 'AdministrativeArea',
      name: 'Denbighshire',
    },
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is respite care at home?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Respite care at home is professional care delivered in the individual\'s own home to give their regular family carer a temporary break. Instead of the person moving into a care home for respite, a trained carer comes to them. This allows the person being cared for to stay in familiar surroundings while their family carer takes time to rest, attend appointments, go on holiday, or simply recharge.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long can respite care at home last in Denbighshire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Respite care at home through Accredilink can be arranged for as little as a few hours (sit-in service) or for extended periods of days or weeks. The length of respite depends entirely on the family\'s needs. Some carers need a few hours each week for regular appointments, while others need a week or more of cover for a holiday or medical treatment.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is respite care at home available across all of Denbighshire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Accredilink provides respite care at home across the whole of Denbighshire, including Denbigh, Ruthin, Llangollen, Rhyl, Prestatyn, St Asaph, Corwen, and all surrounding villages. We cover urban areas along the coast and rural communities in the Vale of Clwyd and Dee Valley.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I get funded respite care at home in Denbighshire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Funded respite care may be available through Denbighshire County Council following a carer\'s assessment. Under the Social Services and Well-being (Wales) Act 2014, carers have a right to an assessment of their own needs. If the assessment identifies a need for respite, the council may fund or contribute towards respite care at home. The Welsh Government also caps weekly charges for non-residential care.',
        },
      },
      {
        '@type': 'Question',
        name: 'How quickly can you arrange respite care at home in Denbighshire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'For planned respite, we recommend contacting us as early as possible so we can match the right carer and ensure continuity. However, we also offer emergency respite for situations where a carer falls ill or faces an unexpected crisis. In urgent cases, we can often arrange respite care on the same day. Call 01824 538688.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the difference between respite care and sit-in services?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Respite care at home typically involves the professional carer taking over all aspects of the care role for a defined period, which may include personal care, medication, meals, and overnight support. Sit-in services are shorter visits (usually a few hours) where a carer provides companionship and supervision while the family carer goes out. Both are forms of respite, and Accredilink provides both across Denbighshire.',
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          <div className="flex flex-wrap gap-2 mb-4">
            <Link href="/areas/denbighshire" className="inline-block px-3 py-1 bg-white/10 text-slate-300 text-sm rounded-full hover:bg-white/20 transition-colors">
              Denbighshire
            </Link>
            <span className="inline-block px-3 py-1 bg-welsh-red/20 text-welsh-red-light text-sm font-semibold rounded-full border border-welsh-red/30">
              Respite Care
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Respite Care at Home in Denbighshire
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-8">
            Professional in-home respite care for family carers across Denbighshire. Give yourself
            a break while your loved one stays safely in their own home, cared for by trained,
            CIW regulated carers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="tel:01824538688"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors text-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
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

      {/* What Is Respite Care at Home */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            What Is Respite Care at Home?
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Respite care at home is professional care delivered in the individual&apos;s own
              home, designed to give their regular family carer a temporary break from caring
              responsibilities. Unlike residential respite, where the person moves into a care
              home for a short stay, respite care at home means they remain in the comfort and
              familiarity of their own surroundings &mdash; in their own bed, with their own
              belongings, in the community they know.
            </p>
            <p className="text-slate-600 leading-relaxed">
              For the person being cared for, this makes an enormous difference. Moving to an
              unfamiliar environment, even for a few days, can be distressing &mdash; particularly
              for people living with dementia or cognitive impairment. Changes in routine, unfamiliar
              faces, and a strange building can increase confusion and anxiety. Respite care at home
              eliminates these disruptions entirely. The person stays where they are most comfortable,
              while a trained professional carer steps in to provide the support their family member
              usually gives.
            </p>
            <p className="text-slate-600 leading-relaxed">
              For the family carer, respite at home provides the breathing space they desperately
              need. Across Denbighshire, thousands of unpaid carers provide round-the-clock support
              for elderly parents, partners living with disabilities, or family members with
              long-term health conditions. The physical and emotional toll of caring without breaks
              can lead to burnout, depression, and deterioration of the carer&apos;s own health.
              Regular respite care helps prevent this by giving carers time to rest, attend their own
              medical appointments, see friends, or simply spend a few hours doing something for
              themselves.
            </p>
            <p className="text-slate-600 leading-relaxed">
              To learn more about respite care in general, read our detailed guide on{' '}
              <Link href="/blog/what-is-respite-care" className="text-welsh-red hover:text-welsh-red-light font-medium">
                what is respite care
              </Link>{' '}
              or explore our{' '}
              <Link href="/services/respite-care" className="text-welsh-red hover:text-welsh-red-light font-medium">
                respite care service
              </Link>{' '}
              page.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits for Family Carers */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Benefits of Respite Care at Home for Family Carers in Denbighshire
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            Family carers across Denbighshire give so much of themselves. Respite care at home
            provides essential relief while ensuring continuity of care for your loved one.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Prevent Carer Burnout',
                desc: 'Caring without breaks leads to exhaustion, stress, and health problems. Regular respite gives you time to recover physically and emotionally, making you a better carer when you return.',
              },
              {
                title: 'Your Loved One Stays Home',
                desc: 'No upheaval, no unfamiliar surroundings. Your family member remains in their own home with their routines, belongings, and sense of security intact. This is especially important for those with dementia.',
              },
              {
                title: 'Attend Your Own Health Appointments',
                desc: 'Carers often neglect their own health because they cannot leave the person they care for. Respite care gives you the freedom to attend GP appointments, hospital visits, and health screenings.',
              },
              {
                title: 'Maintain Relationships and Social Life',
                desc: 'Caring can be isolating. Respite gives you time to see friends, visit family, pursue hobbies, or simply enjoy a few hours of normality that keep you connected to the world beyond caring.',
              },
              {
                title: 'Take a Proper Holiday',
                desc: 'Extended respite care at home means you can take a holiday knowing your loved one is in safe, professional hands. We can provide care for days or weeks to cover your absence.',
              },
              {
                title: 'Peace of Mind',
                desc: 'Knowing that a trained, CIW regulated carer is looking after your family member allows you to truly switch off and recharge. Our carers follow the care plan you know works best.',
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

      {/* How Accredilink Provides Respite Care */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            How Accredilink Provides Respite Care at Home in Denbighshire
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Accredilink Community Response Taskforce provides flexible, person-centred respite care
              at home across the whole of Denbighshire. Whether you need a few hours of{' '}
              <Link href="/services/sit-in-services" className="text-welsh-red hover:text-welsh-red-light font-medium">
                sit-in services
              </Link>{' '}
              each week or full-time cover for an extended period, we tailor our respite support to
              fit your family&apos;s needs.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Our approach begins with a thorough assessment. We visit the home, meet the person
              being cared for and the family carer, and take time to understand the daily routines,
              preferences, medical needs, and any particular challenges. This information forms the
              basis of a detailed care plan that our respite carers follow, ensuring consistency and
              continuity even when the usual carer is not present.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We match each individual with a carer who has the right skills, experience, and
              personality for the role. Where possible, we introduce the respite carer before the
              first session so that both the person being cared for and the family carer feel
              comfortable with the arrangement. This introductory visit is particularly important
              for people living with dementia, where trust and familiarity take time to build.
            </p>
          </div>

          <h3 className="text-xl font-bold text-slate-900 mt-10 mb-4">
            Types of Respite Care We Offer
          </h3>
          <div className="space-y-4">
            {[
              {
                title: 'Hourly Sit-in Respite',
                desc: 'A carer visits for a few hours while you go out. Ideal for regular appointments, shopping trips, or simply a walk and a coffee. Available from as little as 2 hours.',
              },
              {
                title: 'Day Respite',
                desc: 'Full-day care covering personal care, meals, medication, and companionship. Gives you a complete day to rest, attend to your own needs, or visit family and friends.',
              },
              {
                title: 'Overnight Respite',
                desc: 'A carer stays through the night, managing any night-time needs such as toileting, repositioning, medication, or simply being present for reassurance. Invaluable for carers who are exhausted from disrupted sleep.',
              },
              {
                title: 'Extended Respite (Days or Weeks)',
                desc: 'For holidays, medical treatment, or recovery from illness, we provide continuous care in the home for as long as needed. Our carers cover all aspects of the care role, following your established routines.',
              },
              {
                title: 'Emergency Respite',
                desc: 'When a carer falls ill, is hospitalised, or faces an unexpected crisis, we can arrange urgent respite care &mdash; often on the same day. Call 01824 538688 for immediate help.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Area */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Respite Care at Home Across Denbighshire
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            We provide respite care at home across the full extent of Denbighshire, including:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { name: 'Denbigh', href: '/areas/denbigh' },
              { name: 'Ruthin', href: '/areas/ruthin' },
              { name: 'Llangollen', href: '/areas/llangollen' },
              { name: 'Rhyl', href: '/areas/rhyl' },
              { name: 'Prestatyn', href: '/areas/prestatyn' },
              { name: 'St Asaph', href: '/areas/st-asaph' },
              { name: 'Corwen', href: '/areas/corwen' },
              { name: 'Abergele', href: '/areas/abergele' },
              { name: 'Colwyn Bay', href: '/areas/colwyn-bay' },
            ].map((area) => (
              <Link
                key={area.href}
                href={area.href}
                className="flex items-center gap-2 bg-white rounded-lg px-4 py-3 shadow-sm border border-slate-100 hover:border-welsh-red/30 transition-colors"
              >
                <svg className="w-5 h-5 text-welsh-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700 font-medium">{area.name}</span>
              </Link>
            ))}
          </div>
          <p className="text-slate-600 leading-relaxed">
            Whether you live in the coastal towns along the north Denbighshire coast, the historic
            market towns of the Vale of Clwyd, or the rural communities of the Dee Valley, we can
            arrange respite care at home for your family. Our carers travel throughout Denbighshire,
            and we never refuse a referral because of location.
          </p>
        </div>
      </section>

      {/* Funding */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Funding Respite Care at Home in Denbighshire
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Respite care at home in Denbighshire can be funded in several ways. Many families are
              not aware that they may be entitled to financial support from Denbighshire County
              Council or the Welsh Government.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Under the Social Services and Well-being (Wales) Act 2014, carers have a legal right
              to an assessment of their own needs. If this carer&apos;s assessment identifies that
              you need regular breaks from caring, Denbighshire Social Services may fund or
              contribute towards respite care at home. The assessment is free, and you can request
              one by contacting Denbighshire Single Point of Access (SPoA).
            </p>
            <p className="text-slate-600 leading-relaxed">
              The Welsh Government caps weekly charges for non-residential social care, meaning there
              is a limit to what you can be asked to pay even if you are assessed as being able to
              contribute towards costs. Some individuals may receive fully funded care depending on
              their financial circumstances and assessed needs.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Additionally, if the person being cared for receives Attendance Allowance, Personal
              Independence Payment (PIP), or similar disability benefits, these funds can be used
              to pay for private respite care at home. Direct Payments from the local authority can
              also be used to purchase respite services from providers like Accredilink.
            </p>
            <p className="text-slate-600 leading-relaxed">
              We are happy to discuss funding options with you and can point you towards the right
              contacts. Visit our{' '}
              <Link href="/funding-guidance" className="text-welsh-red hover:text-welsh-red-light font-medium">
                funding guidance
              </Link>{' '}
              page or call us on 01824 538688 for advice.
            </p>
          </div>
        </div>
      </section>

      {/* CIW and Quality */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                CIW Regulated Respite Care
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                All respite care at home provided by Accredilink meets the standards set by Care
                Inspectorate Wales (CIW) under the Regulation and Inspection of Social Care (Wales)
                Act 2016. Our carers are registered with Social Care Wales, hold relevant
                qualifications, and undergo enhanced DBS checks.
              </p>
              <p className="text-slate-600 leading-relaxed">
                When you arrange respite care through Accredilink, you can trust that the person
                caring for your loved one is fully trained, vetted, and subject to regulatory
                oversight. This is the peace of mind that CIW regulation provides.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                A Not-for-Profit Approach
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Accredilink Community Response Taskforce is a not-for-profit organisation. This
                means we do not have shareholders expecting returns or profit targets to meet. Every
                pound we receive is reinvested into care services, carer training, and supporting the
                communities of Denbighshire.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Our not-for-profit status means our focus is entirely on quality. When you choose
                Accredilink for respite care at home, you are choosing a provider whose only
                motivation is delivering the best possible care for your family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Arrange */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            How to Arrange Respite Care at Home in Denbighshire
          </h2>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Get in Touch',
                desc: 'Call us on 01824 538688 or contact us through our website. Tell us about your situation and what kind of respite support you need. There is no obligation at this stage.',
              },
              {
                step: '2',
                title: 'Free Assessment',
                desc: 'We visit the home to meet the person being cared for and the family carer. We take time to understand daily routines, care needs, preferences, and any medical requirements. This assessment is free.',
              },
              {
                step: '3',
                title: 'Care Plan and Carer Matching',
                desc: 'We create a detailed care plan and match the individual with an appropriate respite carer. Where possible, we arrange an introductory visit so everyone feels comfortable before respite begins.',
              },
              {
                step: '4',
                title: 'Respite Begins',
                desc: 'Your respite carer arrives at the agreed time and follows the care plan. You are free to take your break, knowing your loved one is in safe, professional hands. We provide feedback after each session.',
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
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Related Care Services in Denbighshire
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            Respite care at home often works alongside other services we provide. Explore these
            related options:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/services/respite-care" className="block bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Respite Care Service</h3>
              <p className="text-slate-600 text-sm">Full details of our respite care service, including what it includes and who it is for.</p>
            </Link>
            <Link href="/services/sit-in-services" className="block bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Sit-in Services</h3>
              <p className="text-slate-600 text-sm">Short-term companionship and supervision while you take a break. From just 2 hours.</p>
            </Link>
            <Link href="/services/domiciliary-care" className="block bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Domiciliary Care</h3>
              <p className="text-slate-600 text-sm">Regular home care visits for ongoing support with personal care, medication, and daily living.</p>
            </Link>
            <Link href="/blog/what-is-respite-care" className="block bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">What Is Respite Care? (Blog)</h3>
              <p className="text-slate-600 text-sm">Our comprehensive guide explaining everything you need to know about respite care.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
            Frequently Asked Questions About Respite Care at Home in Denbighshire
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'What is respite care at home?',
                a: 'Respite care at home is professional care delivered in the individual\'s own home to give their regular family carer a temporary break. Instead of the person moving into a care home for respite, a trained carer comes to them. This allows the person to stay in familiar surroundings while their family carer takes time to rest, attend appointments, or recharge.',
              },
              {
                q: 'How long can respite care at home last in Denbighshire?',
                a: 'Respite care can be arranged for as little as a few hours (sit-in service) or for extended periods of days or weeks. The length depends entirely on the family\'s needs. Some carers need a few hours each week, while others need weeks of cover for a holiday or medical treatment.',
              },
              {
                q: 'Is respite care at home available across all of Denbighshire?',
                a: 'Yes. We provide respite care at home across the whole of Denbighshire, including Denbigh, Ruthin, Llangollen, Rhyl, Prestatyn, St Asaph, Corwen, and all surrounding villages.',
              },
              {
                q: 'Can I get funded respite care at home in Denbighshire?',
                a: 'Funded respite care may be available through Denbighshire County Council following a carer\'s assessment. Under the Social Services and Well-being (Wales) Act 2014, carers have a right to an assessment of their own needs. If respite is identified as a need, the council may fund or contribute towards it.',
              },
              {
                q: 'How quickly can you arrange respite care at home?',
                a: 'For planned respite, we recommend contacting us as early as possible. However, we also offer emergency respite for urgent situations where a carer falls ill or faces a crisis. In urgent cases, we can often arrange same-day respite. Call 01824 538688.',
              },
              {
                q: 'What is the difference between respite care and sit-in services?',
                a: 'Respite care at home typically involves the carer taking over all aspects of the care role for a defined period, including personal care, medication, meals, and overnight support. Sit-in services are shorter visits (usually a few hours) providing companionship and supervision. Both are forms of respite, and we provide both across Denbighshire.',
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

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Arrange Respite Care at Home in Denbighshire?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            You deserve a break, and your loved one deserves to stay in the comfort of their own
            home. Contact us today to discuss respite care at home &mdash; we are here to help
            families across Denbighshire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:01824538688"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-welsh-red text-white font-bold rounded-xl hover:bg-welsh-red-light transition-colors text-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
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

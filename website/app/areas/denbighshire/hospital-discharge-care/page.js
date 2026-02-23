import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Hospital Discharge Care in Denbighshire | Safe Transition Home | Accredilink',
  description:
    'Hospital discharge care in Denbighshire from Accredilink. Safe transition home from Glan Clwyd Hospital and Wrexham Maelor. Reablement support, personal care, and medication management. CIW regulated. Call 01824 538688.',
  keywords:
    'hospital discharge care Denbighshire, hospital discharge support Denbighshire, Glan Clwyd Hospital discharge, reablement care Denbighshire, after hospital care North Wales',
  openGraph: {
    title: 'Hospital Discharge Care in Denbighshire | Accredilink',
    description:
      'Professional hospital discharge care across Denbighshire. CIW regulated support for safe transition from hospital to home.',
    url: 'https://accredilinkcare.co.uk/areas/denbighshire/hospital-discharge-care',
    type: 'website',
  },
  alternates: {
    canonical: 'https://accredilinkcare.co.uk/areas/denbighshire/hospital-discharge-care',
  },
};

export default function HospitalDischargeCare() {
  const jsonLdLocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Accredilink Community Response Taskforce',
    description:
      'Hospital discharge care across Denbighshire. Professional support for safe transition from hospital to home, including reablement, personal care, and medication management.',
    url: 'https://accredilinkcare.co.uk/areas/denbighshire/hospital-discharge-care',
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
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
  };

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is hospital discharge care?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hospital discharge care is professional support provided in the home after a patient is discharged from hospital. It covers the critical transition period when someone returns home following surgery, illness, or injury and needs help with personal care, medication management, mobility, meal preparation, and general wellbeing while they recover. The goal is to ensure a safe, supported return home that reduces the risk of readmission.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can you arrange hospital discharge care on the same day in Denbighshire?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Accredilink has the capacity to arrange same-day hospital discharge care across Denbighshire. We work closely with Betsi Cadwaladr University Health Board and hospital discharge teams at Glan Clwyd Hospital and other local hospitals to facilitate rapid discharges. If your loved one is being discharged and needs care at home, call us on 01824 538688 as early as possible.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which hospitals do you support discharges from?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We primarily support discharges from Glan Clwyd Hospital in Bodelwyddan (the main district general hospital for Denbighshire), Wrexham Maelor Hospital, Ruthin Community Hospital, and Denbigh Infirmary. We can also support discharges from hospitals further afield where the patient is returning to an address in Denbighshire.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does hospital discharge care include?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hospital discharge care from Accredilink typically includes: personal care (washing, dressing, toileting), medication prompting and management, meal preparation and assistance with eating, mobility support and falls prevention, welfare checks, companionship, light housekeeping, and coordination with GP practices and community health teams. The exact package depends on individual needs and is tailored following a rapid assessment.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is hospital discharge care funded by the NHS or council?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Hospital discharge care may be funded in several ways. In Wales, intermediate care and reablement services following hospital discharge can be provided free for a limited period under the NHS Continuing Healthcare framework or through the local authority. Denbighshire County Council may fund care following a needs assessment. In some cases, Betsi Cadwaladr University Health Board commissions discharge care directly. We can help you understand the funding options available.',
        },
      },
      {
        '@type': 'Question',
        name: 'How long does hospital discharge care last?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The duration depends on the individual\'s recovery. Some people need intensive support for just a few days while they regain confidence and mobility. Others may need several weeks of regular visits. In some cases, hospital discharge care transitions into ongoing domiciliary care if the individual\'s needs are long-term. We review care plans regularly and adjust the level of support as recovery progresses.',
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
              Hospital Discharge
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
            Hospital Discharge Care in Denbighshire
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mb-8">
            Safe, supported transition from hospital to home. Accredilink provides professional
            hospital discharge care across Denbighshire, helping patients return home with the care
            they need from day one.
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

      {/* What Is Hospital Discharge Care */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            What Is Hospital Discharge Care?
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Hospital discharge care is professional support provided in the home after a patient
              leaves hospital. The period immediately following discharge is one of the most
              vulnerable times for any patient &mdash; they may be physically weakened, managing new
              medications, dealing with surgical wounds, or simply struggling to cope with daily
              tasks that were previously straightforward. Without proper support, the risk of falls,
              medication errors, complications, and readmission is significantly higher.
            </p>
            <p className="text-slate-600 leading-relaxed">
              In Denbighshire, hospital discharge care is particularly important because of the
              geography of the area. Patients may be discharged from Glan Clwyd Hospital in
              Bodelwyddan, Wrexham Maelor Hospital, or one of the community hospitals, and return
              to homes that are miles from the nearest services. Without a care package in place,
              they face the prospect of being alone at home, unable to manage independently, with
              no one to check on them.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Accredilink Community Response Taskforce provides hospital discharge care across the
              whole of Denbighshire. We work directly with hospital discharge teams, social workers,
              and GPs to ensure that care is in place from the moment a patient walks through their
              front door. Our goal is simple: to make the transition from hospital to home as safe,
              smooth, and comfortable as possible.
            </p>
            <p className="text-slate-600 leading-relaxed">
              For more information about our broader approach to hospital discharge and the wider
              context in Wales, read our blog post on{' '}
              <Link href="/blog/hospital-discharge-care-wales" className="text-welsh-red hover:text-welsh-red-light font-medium">
                hospital discharge care in Wales
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* What Discharge Care Involves */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            What Hospital Discharge Care Involves
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            Every hospital discharge care package is tailored to the individual, but here are the
            most common elements of the support we provide:
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Personal Care',
                desc: 'Assistance with washing, bathing, dressing, and toileting. After surgery or illness, these basic tasks can become difficult or impossible without help. Our carers provide dignified, professional support.',
              },
              {
                title: 'Medication Management',
                desc: 'Patients often leave hospital with new medications and changed dosages. Our carers provide medication prompting, ensure prescriptions are collected, and monitor for any adverse effects.',
              },
              {
                title: 'Meal Preparation',
                desc: 'Proper nutrition is vital for recovery. We prepare meals according to dietary requirements, help with eating if needed, and ensure patients are well-hydrated throughout the day.',
              },
              {
                title: 'Mobility Support',
                desc: 'Reduced mobility after a hospital stay increases the risk of falls. Our carers assist with safe transfers, walking, and navigating the home, while encouraging gentle activity as part of recovery.',
              },
              {
                title: 'Welfare Checks',
                desc: 'Regular visits to check on overall wellbeing, monitor recovery, and identify any concerns early. We escalate to healthcare professionals if we observe signs of complications or deterioration.',
              },
              {
                title: 'Companionship',
                desc: 'The days after a hospital discharge can be frightening and lonely. Having a caring, familiar face visit regularly provides reassurance, reduces anxiety, and supports mental wellbeing during recovery.',
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

      {/* Working with NHS Teams */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Working with NHS and Hospital Teams in Denbighshire
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Effective hospital discharge care requires seamless coordination between the hospital,
              the care provider, and community health services. Accredilink maintains strong working
              relationships with the key organisations involved in hospital discharges across
              Denbighshire:
            </p>
          </div>
          <div className="space-y-4 mt-6">
            {[
              {
                title: 'Betsi Cadwaladr University Health Board (BCUHB)',
                desc: 'BCUHB is the NHS health board responsible for hospital and community health services across North Wales. We receive referrals from their discharge coordinators and work within their discharge pathways to ensure patients leave hospital with appropriate care in place.',
              },
              {
                title: 'Glan Clwyd Hospital, Bodelwyddan',
                desc: 'The main district general hospital for Denbighshire. We work closely with the hospital\'s discharge team, ward managers, and social work staff to arrange care packages for patients returning to homes across the county. Our proximity (just 15 minutes from our base) allows rapid response to discharge referrals.',
              },
              {
                title: 'Wrexham Maelor Hospital',
                desc: 'Serving the southern parts of Denbighshire and the Wrexham area, Wrexham Maelor is another key hospital for discharge referrals. We support patients from Llangollen, Corwen, and the Dee Valley who are treated at Wrexham Maelor.',
              },
              {
                title: 'Community Health Teams',
                desc: 'We coordinate with district nurses, community physiotherapists, occupational therapists, and the community mental health team to ensure that our discharge care aligns with the wider clinical plan for each patient.',
              },
              {
                title: 'Denbighshire County Council Social Services',
                desc: 'The local authority\'s social services team is often involved in arranging and funding post-discharge care. We receive referrals from social workers and the Single Point of Access (SPoA) team, and work alongside them to review and adjust care as recovery progresses.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reablement Support */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Reablement Support After Hospital Discharge
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Reablement is a specific approach to post-discharge care that focuses on helping
              individuals regain as much independence as possible after a hospital stay. Rather
              than simply doing things for the person, reablement care involves working with them
              to rebuild skills, confidence, and strength so that they can return to managing as
              independently as they did before their hospital admission.
            </p>
            <p className="text-slate-600 leading-relaxed">
              In Wales, reablement has become a central part of the health and social care strategy.
              The Social Services and Well-being (Wales) Act 2014 emphasises prevention and early
              intervention, and reablement is a key tool for achieving these goals. By providing
              intensive, time-limited support after discharge, reablement reduces long-term care
              dependency and delivers better outcomes for the individual.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Accredilink&apos;s approach to hospital discharge care incorporates reablement
              principles. Our carers do not simply take over &mdash; they encourage, support, and
              gently challenge individuals to do things for themselves where it is safe to do so.
              This might mean assisting with meal preparation rather than doing all the cooking,
              standing by while someone washes themselves rather than doing it for them, or walking
              alongside someone to rebuild their confidence with mobility rather than using a
              wheelchair unnecessarily.
            </p>
            <p className="text-slate-600 leading-relaxed">
              This approach is always balanced with safety and dignity. We never push someone beyond
              what is comfortable or appropriate, and our carers are trained to recognise when full
              assistance is needed rather than encouragement. The goal is progress, not pressure.
            </p>
          </div>
        </div>
      </section>

      {/* The Discharge Process */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            How We Arrange Hospital Discharge Care in Denbighshire
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            Whether the referral comes from a hospital discharge team, a social worker, a GP, or
            the family directly, we follow a clear process to get care in place quickly:
          </p>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Referral Received',
                desc: 'We receive the referral by phone, email, or through the local authority. This may come from a hospital ward, a discharge coordinator, a social worker, a GP, or the family themselves. We gather essential information about the patient, their discharge date, and their care needs.',
              },
              {
                step: '2',
                title: 'Rapid Assessment',
                desc: 'We carry out a rapid assessment &mdash; either at the hospital before discharge or at the patient\'s home as soon as they arrive. This assessment covers personal care needs, medication requirements, mobility, nutrition, home safety, and any specific risks or clinical concerns.',
              },
              {
                step: '3',
                title: 'Care Plan Created',
                desc: 'Based on the assessment, we create a detailed, personalised care plan. This plan specifies what care is needed, when visits will take place, what each visit will involve, and how we will coordinate with other professionals involved in the patient\'s care.',
              },
              {
                step: '4',
                title: 'Carer Assigned',
                desc: 'We match the patient with an appropriate carer based on skills, experience, location, and compatibility. For hospital discharge care, we prioritise carers with experience in post-surgical recovery, medication management, and reablement.',
              },
              {
                step: '5',
                title: 'Care Begins',
                desc: 'Care starts from the day of discharge &mdash; or the same day for urgent referrals. Our carer arrives at the home, implements the care plan, and ensures the patient is safe, comfortable, and supported. We provide regular updates to the family and referring professionals.',
              },
              {
                step: '6',
                title: 'Review and Adjust',
                desc: 'We review the care plan regularly as the patient recovers. As independence returns, we may reduce the frequency of visits or the level of support. If needs increase, we escalate and adjust. The aim is always to support the best possible recovery.',
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

      {/* Preventing Readmission */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Preventing Hospital Readmission in Denbighshire
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Hospital readmission is a significant problem across the NHS, and Denbighshire is no
              exception. Nationally, around one in six patients over 65 is readmitted to hospital
              within 30 days of discharge. The reasons are often preventable &mdash; falls, medication
              errors, poor nutrition, infections, and deterioration that goes unnoticed because no
              one is checking.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Proper hospital discharge care directly addresses these risk factors. Our carers are
              trained to monitor recovery, identify warning signs, and escalate concerns to
              healthcare professionals before a situation becomes a crisis. By ensuring medication
              is taken correctly, nutrition is maintained, mobility is supported, and any
              complications are caught early, we help keep people safely at home and out of hospital.
            </p>
            <p className="text-slate-600 leading-relaxed">
              This is not just better for the patient &mdash; it is better for the whole health and
              social care system. Every avoidable readmission costs the NHS thousands of pounds and
              occupies a hospital bed that could be used by someone else. By investing in proper
              discharge care, Denbighshire can reduce pressure on Glan Clwyd Hospital and improve
              outcomes for patients at the same time.
            </p>
          </div>
        </div>
      </section>

      {/* Coverage and Regulation */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Coverage Across Denbighshire
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                We provide hospital discharge care to patients returning to any address in
                Denbighshire, including:
              </p>
              <div className="space-y-2">
                {[
                  'Denbigh & Vale of Clwyd',
                  'Ruthin & surrounding villages',
                  'Llangollen & the Dee Valley',
                  'Rhyl & Prestatyn',
                  'St Asaph & Bodelwyddan',
                  'Corwen & upper Dee Valley',
                  'All rural villages and hamlets',
                ].map((area) => (
                  <div key={area} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-welsh-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-slate-700">{area}</span>
                  </div>
                ))}
              </div>
              <p className="text-slate-600 mt-4">
                View all the{' '}
                <Link href="/areas" className="text-welsh-red hover:text-welsh-red-light font-medium">
                  areas we cover
                </Link>{' '}
                for more details.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                CIW Regulated and Trusted
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Accredilink Community Response Taskforce is registered with and regulated by Care
                Inspectorate Wales (CIW). All hospital discharge care we provide meets the standards
                of the Regulation and Inspection of Social Care (Wales) Act 2016.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                Our carers are registered with Social Care Wales, hold relevant qualifications, and
                undergo enhanced DBS checks. When a carer arrives at your home after hospital
                discharge, you can trust they are fully trained, vetted, and accountable to the
                highest regulatory standards in Welsh social care.
              </p>
              <p className="text-slate-600 leading-relaxed">
                As a not-for-profit organisation, our sole focus is on delivering quality care. We
                reinvest everything back into our services and the communities we serve.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Funding */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Funding Hospital Discharge Care in Denbighshire
          </h2>
          <div className="prose prose-lg prose-slate max-w-none">
            <p className="text-slate-600 leading-relaxed">
              Hospital discharge care in Denbighshire can be funded through several routes,
              depending on the patient&apos;s circumstances and the nature of the discharge:
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 mt-6">
            {[
              {
                title: 'NHS-Funded Intermediate Care',
                desc: 'In Wales, intermediate care and reablement services following hospital discharge can be provided free for a time-limited period. This is often arranged by the hospital or health board as part of the discharge plan.',
              },
              {
                title: 'Local Authority Funded Care',
                desc: 'Denbighshire County Council may fund ongoing care following a needs assessment. If the hospital refers you to social services, a social worker will assess your needs and may arrange funded care.',
              },
              {
                title: 'NHS Continuing Healthcare (CHC)',
                desc: 'For patients with complex, ongoing health needs, NHS Continuing Healthcare may cover the full cost of care. CHC assessment is carried out by the health board and is separate from local authority funding.',
              },
              {
                title: 'Private and Self-Funding',
                desc: 'Families can arrange hospital discharge care directly with Accredilink on a private basis. This is often the fastest option, as there is no waiting for funding approval. We provide transparent pricing with no hidden costs.',
              },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-600 mt-6">
            Navigating care funding can be confusing, especially when you are also dealing with the
            stress of a hospital discharge. We are happy to help you understand the options and
            point you to the right contacts. Visit our{' '}
            <Link href="/funding-guidance" className="text-welsh-red hover:text-welsh-red-light font-medium">
              funding guidance
            </Link>{' '}
            page or call us on 01824 538688.
          </p>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
            Related Care Services
          </h2>
          <p className="text-slate-600 text-lg mb-8">
            Hospital discharge care often leads into other services as needs evolve. Explore these
            related options:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/services/domiciliary-care" className="block bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Domiciliary Care</h3>
              <p className="text-slate-600 text-sm">When short-term discharge care transitions into ongoing home care, our domiciliary care service provides continuity.</p>
            </Link>
            <Link href="/areas/denbighshire/respite-care-at-home" className="block bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Respite Care at Home</h3>
              <p className="text-slate-600 text-sm">If a family carer is providing post-discharge support, respite care gives them essential breaks.</p>
            </Link>
            <Link href="/areas/denbighshire/emergency-home-care" className="block bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Emergency Home Care</h3>
              <p className="text-slate-600 text-sm">For urgent, same-day discharge situations where care must start immediately.</p>
            </Link>
            <Link href="/blog/hospital-discharge-care-wales" className="block bg-slate-50 rounded-xl p-6 border border-slate-100 hover:border-welsh-red/30 hover:shadow-md transition-all">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Hospital Discharge Care in Wales (Blog)</h3>
              <p className="text-slate-600 text-sm">Our comprehensive guide to understanding hospital discharge care across Wales.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">
            Frequently Asked Questions About Hospital Discharge Care in Denbighshire
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'What is hospital discharge care?',
                a: 'Hospital discharge care is professional support provided in the home after a patient is discharged from hospital. It covers the critical transition period, including help with personal care, medication, meals, mobility, and welfare checks while the person recovers.',
              },
              {
                q: 'Can you arrange hospital discharge care on the same day?',
                a: 'Yes. We can often arrange same-day hospital discharge care across Denbighshire. We work closely with Betsi Cadwaladr University Health Board and hospital discharge teams to facilitate rapid discharges. Call 01824 538688 as early as possible.',
              },
              {
                q: 'Which hospitals do you support discharges from?',
                a: 'We primarily support discharges from Glan Clwyd Hospital (Bodelwyddan), Wrexham Maelor Hospital, Ruthin Community Hospital, and Denbigh Infirmary. We can also support discharges from hospitals further afield where the patient returns to Denbighshire.',
              },
              {
                q: 'What does hospital discharge care include?',
                a: 'Our discharge care typically includes personal care, medication management, meal preparation, mobility support, welfare checks, companionship, and coordination with healthcare professionals. The exact package is tailored to individual needs.',
              },
              {
                q: 'Is hospital discharge care funded by the NHS or council?',
                a: 'It may be. In Wales, intermediate care and reablement after discharge can be provided free for a limited period. Denbighshire County Council may also fund care following a needs assessment. NHS Continuing Healthcare may cover costs for those with complex health needs. Private self-funding is also an option.',
              },
              {
                q: 'How long does hospital discharge care last?',
                a: 'Duration depends on recovery. Some people need intensive support for a few days, while others may need several weeks. In some cases, discharge care transitions into ongoing domiciliary care. We review and adjust care plans regularly as recovery progresses.',
              },
            ].map((item, i) => (
              <details key={i} className="group bg-white rounded-xl border border-slate-200">
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
            Need Hospital Discharge Care in Denbighshire?
          </h2>
          <p className="text-slate-300 text-lg mb-8">
            Whether you are a patient, a family member, or a healthcare professional arranging
            discharge, we are ready to help. Contact us to arrange hospital discharge care &mdash;
            we can often start on the same day.
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

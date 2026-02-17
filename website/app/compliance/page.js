import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Compliance, Safeguarding & Funding | Standards We Work To',
  description: 'CIW registration, safeguarding procedures, Welsh legislation compliance, care funding guidance, staff registration, data protection, and quality assurance at Accredilink.',
};

const sections = [
  { id: 'ciw', label: 'CIW Registration' },
  { id: 'legislation', label: 'Welsh Legislation' },
  { id: 'safeguarding', label: 'Safeguarding' },
  { id: 'staff', label: 'Staff & Training' },
  { id: 'quality', label: 'Quality Assurance' },
  { id: 'funding', label: 'Funding Guidance' },
  { id: 'data', label: 'Data Protection' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'welsh-language', label: 'Welsh Language' },
];

function CheckItem({ children }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100">
      <svg className="w-5 h-5 text-welsh-green mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      <span className="text-slate-700">{children}</span>
    </div>
  );
}

function FundingCard({ number, title, children }) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-8 h-8 rounded-full bg-welsh-red/10 text-welsh-red text-sm font-bold flex items-center justify-center">{number}</span>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      </div>
      <div className="text-slate-600 leading-relaxed">{children}</div>
    </div>
  );
}

export default function CompliancePage() {
  return (
    <>
      {/* Hero Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/compliance-hero.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-slate-900/90" />
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
              Compliance, Safeguarding & Funding
            </h1>
            <p className="mt-4 text-lg text-slate-300 leading-relaxed">
              Transparency and accountability are at the heart of everything we do. This page explains the regulations we work within,
              how we protect the people we support, the standards our staff are held to, and how care can be funded in Wales.
            </p>
          </div>
        </div>
      </section>

      {/* Section Navigation */}
      <section className="sticky top-24 sm:top-28 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto gap-1 py-3 scrollbar-hide">
            {sections.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-welsh-red hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CIW REGISTRATION ========== */}
      <section id="ciw" className="py-16 sm:py-20 bg-white scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-welsh-green/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-welsh-green" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Care Inspectorate Wales (CIW)</h2>
              </div>
              <p className="text-lg text-slate-600 leading-relaxed mb-4">
                <strong>Care Inspectorate Wales (CIW)</strong> is the independent regulator of social care and childcare in Wales.
                CIW registers, inspects, and takes action to improve the quality and safety of care services. All domiciliary care
                agencies in Wales must be registered with CIW and comply with the <strong>Regulation and Inspection of Social Care
                (Wales) Act 2016</strong>.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                Accredilink Community Response Taskforce is fully registered with CIW. Our Responsible Individual and registered
                manager are assessed as fit and proper persons to operate a care service. Our CIW inspection reports are publicly
                available — we are transparent about our performance and committed to continuous improvement.
              </p>
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">What CIW Registration Means for You</h3>
              <CheckItem>Our service is independently inspected to ensure quality and safety standards</CheckItem>
              <CheckItem>Our Responsible Individual and registered manager are assessed as fit and proper persons</CheckItem>
              <CheckItem>All our care staff are registered (or registering) with Social Care Wales</CheckItem>
              <CheckItem>We follow the National Minimum Standards for Domiciliary Care Agencies in Wales</CheckItem>
              <CheckItem>We maintain comprehensive care plans, risk assessments, and records</CheckItem>
              <CheckItem>We have robust complaints and safeguarding procedures</CheckItem>
              <CheckItem>We comply with Welsh Government guidance on care delivery</CheckItem>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WELSH LEGISLATION ========== */}
      <section id="legislation" className="py-16 sm:py-20 bg-slate-50 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-welsh-red/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-welsh-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Welsh Legislation We Work Within</h2>
          </div>
          <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden shadow-lg mb-10">
            <Image src="/images/compliance-documents.jpg" alt="Legal compliance" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Social Services and Well-being (Wales) Act 2014</h3>
              <p className="text-slate-600 leading-relaxed">
                The primary legislation governing social care in Wales. It places individuals at the centre of their care,
                promotes wellbeing, gives people a stronger voice and control over their support, and ensures preventative
                services are prioritised. Our care planning, assessments, and delivery are all built around this Act.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Regulation and Inspection of Social Care (Wales) Act 2016</h3>
              <p className="text-slate-600 leading-relaxed">
                This Act governs how care services are registered, regulated, and inspected in Wales. It requires providers
                to have a Responsible Individual, registered manager, and registered workforce. It gives CIW the power to
                inspect services and take enforcement action where standards are not met.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Well-being of Future Generations (Wales) Act 2015</h3>
              <p className="text-slate-600 leading-relaxed">
                This Act requires public bodies in Wales to think about the long-term impact of their decisions. Our services
                contribute to its goals of a healthier, more equal, more resilient, and more cohesive Wales — supporting
                individuals to participate in their communities and live independently.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Mental Capacity Act 2005</h3>
              <p className="text-slate-600 leading-relaxed">
                We work within the Mental Capacity Act and the Deprivation of Liberty Safeguards (DoLS). We always assume
                capacity, support individuals to make their own decisions where possible, and follow the best interests
                process when someone lacks capacity for a specific decision.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Health and Safety at Work Act 1974</h3>
              <p className="text-slate-600 leading-relaxed">
                We have a legal duty to ensure the health, safety, and welfare of our staff and the people they support.
                This includes risk assessments for every care environment, safe working practices, manual handling procedures,
                COSHH compliance, and incident reporting.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Equality Act 2010</h3>
              <p className="text-slate-600 leading-relaxed">
                We are committed to treating every individual with dignity and respect regardless of age, disability,
                gender, race, religion, sexual orientation, or any other protected characteristic. We make reasonable
                adjustments to ensure our services are accessible to everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SAFEGUARDING ========== */}
      <section id="safeguarding" className="py-16 sm:py-20 bg-white scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-welsh-red/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-welsh-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Safeguarding</h2>
              </div>
              <p className="text-lg text-slate-600 leading-relaxed mb-4">
                Safeguarding is everyone&apos;s responsibility. Accredilink Community Response Taskforce is committed to
                safeguarding and promoting the welfare of all individuals we support. We recognise that everyone has
                the right to live free from abuse, neglect, and exploitation.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                Our safeguarding procedures are designed to protect vulnerable adults and to ensure that concerns are
                identified and acted upon promptly. We follow the <strong>Wales Safeguarding Procedures</strong> and work
                closely with local authority safeguarding teams in Denbighshire, Conwy, and Wrexham.
              </p>
              <div className="space-y-3">
                <CheckItem>All staff undergo enhanced DBS checks before starting work</CheckItem>
                <CheckItem>Comprehensive safeguarding training is mandatory and refreshed annually</CheckItem>
                <CheckItem>Designated Safeguarding Lead oversees all safeguarding matters</CheckItem>
                <CheckItem>Clear reporting procedures ensure concerns are escalated immediately</CheckItem>
                <CheckItem>Close working with local authority safeguarding teams</CheckItem>
                <CheckItem>Regular supervision and spot checks ensure ongoing compliance</CheckItem>
                <CheckItem>Whistleblowing policies protect staff who raise legitimate concerns</CheckItem>
              </div>
            </div>
            <div>
              <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden shadow-lg mb-6">
                <Image src="/images/compliance-care.jpg" alt="Protecting vulnerable people" fill className="object-cover" />
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Recognising Abuse</h3>
                <p className="text-slate-600 mb-4">We train our staff to recognise all forms of abuse, including:</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Physical abuse', 'Emotional abuse', 'Financial abuse', 'Sexual abuse', 'Neglect', 'Self-neglect', 'Domestic abuse', 'Modern slavery'].map(type => (
                    <span key={type} className="text-sm px-3 py-2 bg-red-50 text-welsh-red rounded-lg text-center">{type}</span>
                  ))}
                </div>
              </div>
              <div className="p-5 bg-red-50 rounded-xl border border-red-200">
                <h3 className="font-semibold text-slate-900 mb-2">Report a Safeguarding Concern</h3>
                <p className="text-sm text-slate-600 mb-3">
                  If you have a concern about someone we support or the conduct of any of our staff, contact us immediately:
                </p>
                <p className="text-sm"><strong>Phone:</strong> 01745 000 000</p>
                <p className="text-sm"><strong>Email:</strong> safeguarding@accredilinkcare.co.uk</p>
                <p className="mt-3 text-xs text-slate-500">
                  You can also contact your local authority safeguarding team directly, or call the police if someone is in immediate danger.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STAFF & TRAINING ========== */}
      <section id="staff" className="py-16 sm:py-20 bg-slate-50 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-welsh-green/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Staff Registration & Training</h2>
          </div>
          <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden shadow-lg mb-10">
            <Image src="/images/compliance-training.jpg" alt="Emergency care training" fill className="object-cover" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Social Care Wales Registration</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                All of our care workers are registered (or actively registering) with <strong>Social Care Wales</strong> — the
                workforce regulator for social care in Wales. This means our staff meet professional standards, complete required
                qualifications, and are held accountable to a code of professional practice.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Registration with Social Care Wales ensures that every care worker has been checked for fitness to practise,
                holds the required qualifications, and maintains their professional development. It provides an additional
                layer of protection for the people we support.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Training & Qualifications</h3>
              <div className="space-y-3">
                <CheckItem>All Wales Induction Framework completed before unsupervised care</CheckItem>
                <CheckItem>QCF Level 2/3 Health and Social Care qualifications</CheckItem>
                <CheckItem>Mandatory training in safeguarding, moving and handling, first aid, and infection control</CheckItem>
                <CheckItem>Pre-hospital emergency care (PHEC) qualifications for emergency responders</CheckItem>
                <CheckItem>Specialist training in dementia care, mental health, and palliative care</CheckItem>
                <CheckItem>Monthly supervision and annual appraisals for all staff</CheckItem>
                <CheckItem>Continuous professional development (CPD) to maintain Social Care Wales registration</CheckItem>
                <CheckItem>Regular refresher training and competency assessments</CheckItem>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== QUALITY ASSURANCE ========== */}
      <section id="quality" className="py-16 sm:py-20 bg-white scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-welsh-green/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Quality Assurance</h2>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-3xl">
            Beyond regulatory compliance, we operate our own internal quality assurance programme to ensure our care
            consistently meets the highest standards. We believe that good enough is never good enough.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Unannounced Spot Checks', desc: 'Regular unannounced visits to observe care delivery in practice, ensuring carers follow care plans and maintain professional standards at all times.' },
              { title: 'Staff Supervision', desc: 'Monthly one-to-one supervision sessions for all care staff, covering performance, wellbeing, training needs, and any concerns about the people they support.' },
              { title: 'Care Plan Reviews', desc: 'Regular reviews of all care plans with the individual and their family. Plans are updated whenever circumstances change, ensuring care remains relevant and effective.' },
              { title: 'Satisfaction Surveys', desc: 'Regular feedback surveys for clients, families, and referring professionals. Results are analysed and acted upon to drive continuous improvement.' },
              { title: 'Incident Analysis', desc: 'All incidents, near-misses, and complaints are logged, investigated, and reviewed. We use lessons learned to prevent recurrence and improve practice.' },
              { title: 'Technology & Monitoring', desc: 'Modern care management technology enables real-time monitoring of visits, digital care records, and electronic medication management for improved accuracy and accountability.' },
            ].map((item, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FUNDING GUIDANCE ========== */}
      <section id="funding" className="py-16 sm:py-20 bg-slate-50 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-welsh-red/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-welsh-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Care Funding Guidance</h2>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-3xl">
            Understanding how to pay for care can be confusing. There are several ways to fund domiciliary care in Wales,
            and many people don&apos;t realise they may be eligible for financial support.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FundingCard number="1" title="Local Authority Funded Care">
              <p className="mb-3">
                Your local authority (Denbighshire, Conwy, or Wrexham) can carry out a <strong>social care needs assessment</strong> to
                determine if you&apos;re eligible for funded care.
              </p>
              <ul className="space-y-1 text-sm">
                <li>&#8226; Anyone can request an assessment — no GP referral needed</li>
                <li>&#8226; The assessment is free and looks at your care and support needs</li>
                <li>&#8226; A financial assessment determines your contribution</li>
                <li>&#8226; In Wales, the maximum weekly charge is capped (currently &pound;100/week)</li>
              </ul>
            </FundingCard>

            <FundingCard number="2" title="Direct Payments">
              <p>
                If assessed as eligible for local authority-funded care, you can request a <strong>direct payment</strong> —
                money paid directly to you to arrange your own care. This gives you more choice and control over who provides
                your care and when. You can use direct payments to pay for our services.
              </p>
            </FundingCard>

            <FundingCard number="3" title="NHS Continuing Healthcare (CHC)">
              <p className="mb-2">
                If you have a <strong>primary health need</strong>, you may qualify for NHS Continuing Healthcare —
                fully funded by the NHS, covering all your care costs.
              </p>
              <p className="text-sm text-slate-500">
                CHC is assessed by a multi-disciplinary team. Your GP, hospital discharge coordinator, or social worker can initiate the process.
              </p>
            </FundingCard>

            <FundingCard number="4" title="Attendance Allowance">
              <p className="mb-2">
                If you&apos;re over 65 and need help with personal care or supervision, you may be eligible for <strong>Attendance
                Allowance</strong> from the DWP — worth up to &pound;108.55 per week (2024/25 rate).
              </p>
              <p className="text-sm text-slate-500">
                Non-means-tested, tax-free, and doesn&apos;t affect other benefits. Apply directly to the DWP.
              </p>
            </FundingCard>

            <FundingCard number="5" title="Self-Funding (Private)">
              <p>
                If you prefer to arrange and pay for care privately, we offer competitive rates with transparent pricing. There&apos;s
                no waiting list for self-funded care — we can often begin within 24-48 hours. Many families choose this route
                for flexibility and speed.
              </p>
            </FundingCard>

            <FundingCard number="6" title="Carers&apos; Support">
              <p>
                If you are an unpaid carer, you have a legal right to a <strong>carer&apos;s assessment</strong> under the Social Services
                and Well-being (Wales) Act 2014. This can lead to support services including respite care, sit-in services,
                and financial assistance to help you in your caring role.
              </p>
            </FundingCard>
          </div>
          <div className="mt-8 p-6 bg-green-50 rounded-2xl border border-green-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Need Help With Funding?</h3>
            <p className="text-slate-600 leading-relaxed mb-4">
              We understand that navigating care funding can be overwhelming. Our team can help guide you through the process,
              explain your options, and support you in accessing any funding you may be entitled to.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-welsh-green text-white font-semibold rounded-xl hover:bg-welsh-green-light transition-colors"
            >
              Contact Us for Guidance
            </Link>
          </div>
        </div>
      </section>

      {/* ========== DATA PROTECTION ========== */}
      <section id="data" className="py-16 sm:py-20 bg-white scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Data Protection & Confidentiality</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <p className="text-slate-600 leading-relaxed mb-4">
                We take data protection seriously. Accredilink is registered with the <strong>Information Commissioner&apos;s Office
                (ICO)</strong> and fully complies with the <strong>UK General Data Protection Regulation (UK GDPR)</strong> and the
                <strong> Data Protection Act 2018</strong>.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                All personal information — including care records, health data, and contact details — is stored securely,
                accessed only by authorised staff, and used solely for the purpose of delivering care. We never share
                personal information with third parties without consent, unless required by law or for safeguarding purposes.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Our staff receive data protection training as part of their induction and annual refresher programme.
                We have a Data Protection Officer and clear policies on information governance, subject access requests,
                data breaches, and records retention.
              </p>
            </div>
            <div className="space-y-3">
              <CheckItem>Registered with the Information Commissioner&apos;s Office (ICO)</CheckItem>
              <CheckItem>UK GDPR and Data Protection Act 2018 compliant</CheckItem>
              <CheckItem>Secure electronic and paper record keeping</CheckItem>
              <CheckItem>Staff trained in data protection and confidentiality</CheckItem>
              <CheckItem>Clear subject access request (SAR) procedures</CheckItem>
              <CheckItem>Data breach reporting and response protocol</CheckItem>
              <CheckItem>Records retention and secure disposal policies</CheckItem>
              <CheckItem>Privacy notices provided to all service users</CheckItem>
            </div>
          </div>
        </div>
      </section>

      {/* ========== COMPLAINTS ========== */}
      <section id="complaints" className="py-16 sm:py-20 bg-slate-50 scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-welsh-red/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-welsh-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Complaints Procedure</h2>
          </div>
          <div className="max-w-3xl">
            <p className="text-slate-600 leading-relaxed mb-6">
              We welcome feedback — including complaints. If something has gone wrong or you are unhappy with any aspect of
              our service, we want to know so we can put it right and learn from it.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200">
                <span className="w-8 h-8 rounded-full bg-welsh-red text-white text-sm font-bold flex items-center justify-center flex-shrink-0">1</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Raise the Issue</h3>
                  <p className="text-sm text-slate-600">Speak to your carer, their supervisor, or contact our office directly by phone or email. Many concerns can be resolved quickly and informally.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200">
                <span className="w-8 h-8 rounded-full bg-welsh-red text-white text-sm font-bold flex items-center justify-center flex-shrink-0">2</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Formal Complaint</h3>
                  <p className="text-sm text-slate-600">If you wish to make a formal complaint, we will acknowledge it within 2 working days and aim to provide a full written response within 20 working days.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-5 bg-white rounded-xl border border-slate-200">
                <span className="w-8 h-8 rounded-full bg-welsh-red text-white text-sm font-bold flex items-center justify-center flex-shrink-0">3</span>
                <div>
                  <h3 className="font-semibold text-slate-900">Escalation</h3>
                  <p className="text-sm text-slate-600">If you are not satisfied with our response, you can escalate your complaint to the Public Services Ombudsman for Wales or contact Care Inspectorate Wales directly.</p>
                </div>
              </div>
            </div>
            <div className="p-5 bg-white rounded-xl border border-slate-200">
              <p className="font-medium text-slate-900 mb-2">Contact us about a complaint:</p>
              <p className="text-sm text-slate-600"><strong>Phone:</strong> 01745 000 000</p>
              <p className="text-sm text-slate-600"><strong>Email:</strong> complaints@accredilinkcare.co.uk</p>
              <p className="text-sm text-slate-600"><strong>Write to:</strong> Accredilink CRT, [Office Address], Denbighshire</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== WELSH LANGUAGE ========== */}
      <section id="welsh-language" className="py-16 sm:py-20 bg-white scroll-mt-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-welsh-red/10 flex items-center justify-center">
              <span className="text-welsh-red font-bold text-lg">Cy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Welsh Language Commitment</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <p className="text-slate-600 leading-relaxed mb-4">
                We are proud to serve communities across Denbighshire, Conwy, and Wrexham where the Welsh language is spoken
                widely. We are committed to the <strong>Active Offer</strong> under the Welsh Government&apos;s <strong>More Than
                Just Words</strong> strategic framework — meaning we offer Welsh language services without people having to ask.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                For many Welsh speakers — particularly older people, those living with dementia, and individuals in distress —
                receiving care in their first language is not a luxury, it is a necessity. Communicating in Welsh can reduce
                anxiety, improve understanding, and make care feel more personal and natural.
              </p>
              <p className="text-slate-600 leading-relaxed">
                We actively recruit Welsh-speaking staff and identify Welsh language skills during our assessment process so
                that we can match Welsh-speaking carers with individuals who prefer to communicate in Welsh.
              </p>
            </div>
            <div className="space-y-3">
              <CheckItem>Active Offer of Welsh language services</CheckItem>
              <CheckItem>Welsh-speaking carers available across our coverage area</CheckItem>
              <CheckItem>Language preferences recorded in every care plan</CheckItem>
              <CheckItem>Welsh language skills identified during recruitment</CheckItem>
              <CheckItem>Bilingual signage and communication where appropriate</CheckItem>
              <CheckItem>Compliance with More Than Just Words framework</CheckItem>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Questions About Our Standards?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            We are always happy to discuss our compliance, safeguarding procedures, or funding options. Get in touch for a confidential conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-white/20 text-white font-semibold rounded-xl hover:border-white/40 hover:bg-white/5 transition-colors"
            >
              View Our Services
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

import Link from 'next/link';

export const metadata = {
  title: 'Frequently Asked Questions',
  description: 'Common questions about domiciliary care, funding, emergency response, and our services in Denbighshire, Conwy and Wrexham.',
};

const faqs = [
  {
    category: 'About Our Services',
    questions: [
      {
        q: 'What services do you provide?',
        a: 'We provide domiciliary care (personal care at home), respite care, sit-in services, emergency response, social care, palliative care, and professional training in care and pre-hospital emergency care.',
      },
      {
        q: 'What areas do you cover?',
        a: 'We cover Denbighshire, Conwy, and Wrexham in North Wales. This includes towns like Denbigh, Rhyl, Prestatyn, Ruthin, Colwyn Bay, Llandudno, Abergele, Wrexham, Llangollen, and all surrounding rural areas.',
      },
      {
        q: 'Are you regulated?',
        a: 'Yes. We are fully registered with and regulated by Care Inspectorate Wales (CIW), the independent regulator of social care in Wales. Our registration ensures we meet the standards required by the Regulation and Inspection of Social Care (Wales) Act 2016.',
      },
      {
        q: 'What makes you different from other care providers?',
        a: 'We have our own trained emergency care responders on shift — staff with pre-hospital emergency care skills who can respond rapidly to urgent situations. We also offer training services, meaning our carers are among the best-trained in the sector.',
      },
      {
        q: 'Do you provide care in Welsh?',
        a: 'Yes. We are a Welsh company and we support the Welsh language. Where possible, we match Welsh-speaking carers with Welsh-speaking clients. We operate in accordance with the Active Offer principle.',
      },
    ],
  },
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I arrange care for myself or a family member?',
        a: 'Simply contact us by phone (01745 000 000) or through our contact form. We will arrange a free, no-obligation assessment to understand your needs and create a personalised care plan.',
      },
      {
        q: 'How quickly can care start?',
        a: 'In many cases, we can begin care within 24-48 hours of an assessment. For emergency situations, our rapid response team may be able to help even sooner.',
      },
      {
        q: 'Can I choose my carer?',
        a: 'We carefully match carers with clients based on personality, skills, and needs. While we cannot guarantee a specific carer at all times, we aim for consistency and will always try to accommodate preferences.',
      },
      {
        q: 'What happens during an assessment?',
        a: 'One of our team will visit you (or your family member) at home. We discuss your needs, preferences, daily routines, and any health conditions. From this, we create a personalised care plan. There is no charge and no obligation.',
      },
    ],
  },
  {
    category: 'Costs & Funding',
    questions: [
      {
        q: 'How much does domiciliary care cost?',
        a: 'Costs depend on the type and frequency of care needed. We provide transparent pricing and will discuss costs openly during the assessment. Contact us for a personalised quote.',
      },
      {
        q: 'Can the local authority pay for my care?',
        a: 'You may be eligible for funded or partially-funded care through your local authority (Denbighshire, Conwy, or Wrexham). This is determined by a social care needs assessment. We can help guide you through the process. See our funding guidance page for more details.',
      },
      {
        q: 'What about NHS Continuing Healthcare (CHC)?',
        a: 'If you have a primary health need, you may qualify for NHS Continuing Healthcare funding, which covers the full cost of care. Your GP, hospital discharge team, or local authority can refer you for a CHC assessment.',
      },
      {
        q: 'Do you accept direct payments?',
        a: 'Yes. If you receive a direct payment from your local authority, you can use it to pay for our services. We can help you set this up.',
      },
    ],
  },
  {
    category: 'Emergency Response',
    questions: [
      {
        q: 'What is your emergency response service?',
        a: 'We have trained emergency care responders on shift who can respond rapidly to urgent care situations — falls, sudden illness, welfare checks, urgent personal care, and hospital discharge support.',
      },
      {
        q: 'How quickly can you respond in an emergency?',
        a: 'Response times depend on location and availability, but we aim to respond as quickly as possible. Our responders cover Denbighshire, Conwy, and Wrexham.',
      },
      {
        q: 'Is your emergency service available 24/7?',
        a: 'We provide emergency response outside of normal care hours. Contact us to discuss availability for your area.',
      },
    ],
  },
];

export default function FAQPage() {
  // Generate FAQ schema
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.flatMap(cat => cat.questions.map(q => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.a,
      },
    }))),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Frequently Asked Questions</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Find answers to common questions about our care services, costs, and how to get started.
          </p>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqs.map(category => (
            <div key={category.category} className="mb-12">
              <h2 className="text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
                {category.category}
              </h2>
              <div className="space-y-3">
                {category.questions.map((faq, i) => (
                  <details key={i} className="group p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <summary className="font-medium text-slate-900 cursor-pointer">
                      {faq.q}
                    </summary>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <p className="text-slate-600 mb-4">
              Can't find what you're looking for? We're happy to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

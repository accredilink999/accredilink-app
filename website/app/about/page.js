import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'About Us',
  description: 'Learn about Accredilink Community Response Taskforce — a Welsh care provider regulated by Care Inspectorate Wales, serving Denbighshire, Conwy and Wrexham.',
};

const values = [
  {
    title: 'Compassion',
    description: 'Every person we support is treated with genuine warmth, empathy, and kindness. Care is personal — and we never forget that.',
    borderColor: 'border-l-welsh-red',
  },
  {
    title: 'Professionalism',
    description: 'Our staff are fully trained, DBS checked, and supported with ongoing professional development. We hold ourselves to the highest standards.',
    borderColor: 'border-l-welsh-green',
  },
  {
    title: 'Community',
    description: 'We are rooted in the communities of North Wales. We know the people, the places, and what matters here. This is our home too.',
    borderColor: 'border-l-amber-500',
  },
  {
    title: 'Responsiveness',
    description: 'With our own emergency care responders on shift, we can act quickly when it matters most. We don\'t just provide care — we respond.',
    borderColor: 'border-l-blue-500',
  },
  {
    title: 'Dignity',
    description: 'Everyone deserves to be treated with respect and dignity, regardless of their circumstances. This principle is at the heart of everything we do.',
    borderColor: 'border-l-purple-500',
  },
  {
    title: 'Excellence',
    description: 'We are committed to continuous improvement — in our care delivery, our training, and our service. Good enough is never enough.',
    borderColor: 'border-l-teal-500',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(185,28,28,0.15),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">About Us</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Accredilink Community Response Taskforce — a care provider built on Welsh values, serving our local communities.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">Who We Are</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Accredilink Community Response Taskforce is a <strong>not-for-profit</strong> care provider based in Denbighshire, North Wales.
                  We deliver a wide range of care and support services across Denbighshire, Conwy, and Wrexham —
                  from daily domiciliary care to emergency response and professional training.
                  As a not-for-profit organisation, every penny we receive goes directly back into the care we provide and the communities we serve.
                </p>
                <p>
                  What makes us different is our integrated approach. We don't just provide routine care — we have
                  our own qualified emergency care responders on shift, trained in pre-hospital emergency care.
                  This means when something goes wrong, our team has the skills to respond immediately and effectively.
                </p>
                <p>
                  We are fully registered and regulated by <strong>Care Inspectorate Wales (CIW)</strong>,
                  and we are committed to meeting and exceeding the standards set out in the Regulation and
                  Inspection of Social Care (Wales) Act 2016.
                </p>
                <p>
                  Our team is local. We live in the communities we serve, and we understand the unique needs
                  of people in rural and semi-rural Wales. Whether it's navigating country lanes to reach a
                  remote farmhouse or providing Welsh-language care, we are equipped and committed.
                </p>
              </div>
            </div>
            <div className="relative h-56 sm:h-72 lg:h-96 rounded-2xl overflow-hidden">
              <Image src="/images/about-team.jpg" alt="Our dedicated care team" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-welsh-red to-welsh-red-light text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-red-100 max-w-3xl mx-auto leading-relaxed">
            To deliver compassionate, professional, and responsive care that empowers individuals to live
            with dignity and independence in their own homes and communities — while equipping our workforce
            and others with the skills to make a real difference.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 bg-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-welsh-red/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-welsh-green/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 text-center">Our Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map(value => (
              <div key={value.title} className={`p-6 bg-white rounded-2xl border border-slate-200 border-l-4 ${value.borderColor}`}>
                <h3 className="font-semibold text-slate-900 mb-2">{value.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CIW */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-welsh-green" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Care Inspectorate Wales</h2>
              <p className="text-slate-600 leading-relaxed max-w-2xl">
                We are registered with and regulated by Care Inspectorate Wales (CIW), the independent
                regulator of social care and childcare in Wales. CIW inspects our services to ensure they
                meet the quality and safety standards that people in Wales deserve. Our registration means
                you can trust that our care meets the requirements of the Regulation and Inspection of
                Social Care (Wales) Act 2016.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Want to Know More?</h2>
          <p className="text-lg text-slate-600 mb-8">
            We&apos;d love to talk to you about how we can help. Get in touch for an informal chat.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/contact" className="inline-flex items-center justify-center px-6 py-3.5 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors">
              Contact Us
            </Link>
            <Link href="/careers" className="inline-flex items-center justify-center px-6 py-3.5 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-slate-300 hover:bg-white transition-colors">
              Join Our Team
            </Link>
          </div>
          <p className="text-sm text-slate-500">
            Email us at{' '}
            <a href="mailto:info@accredilinkcare.co.uk" className="text-welsh-red font-medium hover:underline">info@accredilinkcare.co.uk</a>
            {' '}for general information or{' '}
            <a href="mailto:enquiries@accredilinkcare.co.uk" className="text-welsh-red font-medium hover:underline">enquiries@accredilinkcare.co.uk</a>
            {' '}to discuss care needs.
          </p>
        </div>
      </section>
    </>
  );
}

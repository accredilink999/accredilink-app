import Link from 'next/link';

export const metadata = {
  title: 'CIW Compliance | Care Inspectorate Wales Registration',
  description: 'Accredilink is registered with and regulated by Care Inspectorate Wales (CIW). Learn about our compliance and quality standards.',
};

export default function CIWCompliancePage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-welsh-green-light" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">CIW Compliance</h1>
              <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
                We are registered with and regulated by Care Inspectorate Wales — the independent regulator of social care in Wales.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 text-slate-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">What is CIW?</h2>
              <p>
                <strong>Care Inspectorate Wales (CIW)</strong> is the independent regulator of social care and
                childcare in Wales. CIW registers, inspects, and takes action to improve the quality and safety
                of care services. All domiciliary care agencies in Wales must be registered with CIW and comply
                with the <strong>Regulation and Inspection of Social Care (Wales) Act 2016</strong>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">What CIW Registration Means for You</h2>
              <div className="space-y-3">
                {[
                  'Our service is independently inspected to ensure quality and safety standards',
                  'Our Responsible Individual and registered manager are assessed as fit and proper persons',
                  'All our care staff are registered (or registering) with Social Care Wales',
                  'We follow the National Minimum Standards for Domiciliary Care Agencies in Wales',
                  'We maintain comprehensive care plans, risk assessments, and records',
                  'We have robust complaints and safeguarding procedures',
                  'CIW inspection reports are publicly available — we are transparent about our performance',
                  'We comply with Welsh Government guidance on care delivery',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <svg className="w-5 h-5 text-welsh-green mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Social Care Wales Registration</h2>
              <p>
                In addition to our agency registration with CIW, our care workers are registered (or actively
                registering) with <strong>Social Care Wales</strong> — the workforce regulator. This means
                our staff meet professional standards, complete required training, and are held accountable
                to a code of practice.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Quality Assurance</h2>
              <p className="mb-4">
                Beyond regulatory compliance, we operate our own internal quality assurance programme:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-welsh-red font-bold">&#8226;</span>
                  Regular unannounced spot checks on care delivery
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-welsh-red font-bold">&#8226;</span>
                  Monthly supervision for all care staff
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-welsh-red font-bold">&#8226;</span>
                  Annual reviews of all care plans
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-welsh-red font-bold">&#8226;</span>
                  Client and family satisfaction surveys
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-welsh-red font-bold">&#8226;</span>
                  Ongoing professional development and training
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-welsh-red font-bold">&#8226;</span>
                  Modern technology for real-time care monitoring and reporting
                </li>
              </ul>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <p className="text-slate-600 mb-4">
                You can verify our registration and view inspection reports on the CIW website.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-welsh-red text-white font-semibold rounded-xl hover:bg-welsh-red-light transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

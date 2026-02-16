import Link from 'next/link';

export const metadata = {
  title: 'Care Funding Guidance | How to Fund Domiciliary Care in Wales',
  description: 'Guide to funding domiciliary care in Wales. Local authority funding, direct payments, NHS Continuing Healthcare, Attendance Allowance, and self-funding options.',
};

export default function FundingGuidancePage() {
  return (
    <>
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Care Funding Guidance</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Understanding how to pay for care can be confusing. This guide explains the main funding options
            available in Wales.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro */}
          <div className="mb-12">
            <p className="text-lg text-slate-600 leading-relaxed">
              There are several ways to fund domiciliary care in Wales. Many people don't realise they may
              be eligible for financial support. Below we explain the main options — but please contact us
              if you need help navigating the process. We're always happy to guide families through it.
            </p>
          </div>

          {/* Local Authority Funding */}
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">1. Local Authority Funded Care</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Your local authority (Denbighshire, Conwy, or Wrexham County Borough Council) can carry out
              a <strong>social care needs assessment</strong> to determine if you're eligible for funded care.
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-welsh-green mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>Anyone can request an assessment — you don't need a GP referral</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-welsh-green mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>The assessment is free and looks at your care and support needs</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-welsh-green mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>A financial assessment determines how much you contribute towards the cost</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-4 h-4 text-welsh-green mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>In Wales, the maximum weekly charge for non-residential care is capped (currently &pound;100/week)</span>
              </li>
            </ul>
          </div>

          {/* Direct Payments */}
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">2. Direct Payments</h2>
            <p className="text-slate-600 leading-relaxed">
              If you're assessed as eligible for local authority-funded care, you can request a <strong>direct payment</strong> —
              money paid directly to you to arrange your own care. This gives you more choice and control over
              who provides your care and when. You can use direct payments to pay for our services.
            </p>
          </div>

          {/* NHS CHC */}
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">3. NHS Continuing Healthcare (CHC)</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              If you have a <strong>primary health need</strong> (as opposed to a social care need), you may qualify
              for NHS Continuing Healthcare. This is fully funded by the NHS and covers all your care costs.
            </p>
            <p className="text-sm text-slate-500">
              CHC is assessed by a multi-disciplinary team. Your GP, hospital discharge coordinator, or
              social worker can initiate the process.
            </p>
          </div>

          {/* Attendance Allowance */}
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. Attendance Allowance</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              If you're over 65 and need help with personal care or supervision, you may be eligible for
              <strong> Attendance Allowance</strong> from the DWP. This is a non-means-tested benefit worth
              up to &pound;108.55 per week (2024/25 rate) and can be used towards care costs.
            </p>
            <p className="text-sm text-slate-500">
              Attendance Allowance doesn't affect your other benefits and is tax-free. Apply directly to the DWP.
            </p>
          </div>

          {/* Self-funding */}
          <div className="mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Self-Funding</h2>
            <p className="text-slate-600 leading-relaxed">
              If you prefer to arrange and pay for care privately, we offer competitive rates with transparent
              pricing. Many families choose to self-fund for flexibility and speed. There's no waiting list for
              self-funded care — we can often begin within 24-48 hours.
            </p>
          </div>

          {/* Help */}
          <div className="mt-12 p-6 bg-green-50 rounded-2xl border border-green-200">
            <h2 className="text-lg font-bold text-slate-900 mb-3">Need Help With Funding?</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We understand that navigating care funding can be overwhelming. Our team can help guide you through
              the process, explain your options, and support you in accessing any funding you may be entitled to.
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
    </>
  );
}

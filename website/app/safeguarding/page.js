import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Safeguarding Policy',
  description: 'Our safeguarding commitment. How Accredilink protects vulnerable adults and children across Denbighshire, Conwy and Wrexham.',
};

export default function SafeguardingPage() {
  return (
    <>
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/images/safeguarding.jpg" alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90" />
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-welsh-red via-white to-welsh-green" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">Safeguarding</h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Safeguarding is everyone's responsibility. We are committed to protecting the people we support.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8 text-slate-600 leading-relaxed">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Commitment</h2>
              <p>
                Accredilink Community Response Taskforce is committed to safeguarding and promoting the welfare
                of all individuals we support. We recognise that everyone has the right to live free from abuse,
                neglect, and exploitation. Our safeguarding procedures are designed to protect vulnerable adults
                and to ensure that concerns are identified and acted upon promptly.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">What We Do</h2>
              <div className="space-y-3">
                {[
                  'All staff undergo enhanced DBS (Disclosure and Barring Service) checks before starting work',
                  'Comprehensive safeguarding training is mandatory for every member of staff and refreshed annually',
                  'We have a designated Safeguarding Lead responsible for overseeing all safeguarding matters',
                  'Clear reporting procedures ensure that any concerns are escalated immediately',
                  'We work closely with local authority safeguarding teams in Denbighshire, Conwy, and Wrexham',
                  'Regular supervision and spot checks ensure ongoing compliance and quality',
                  'Whistleblowing policies protect staff who raise legitimate safeguarding concerns',
                  'We comply with the Social Services and Well-being (Wales) Act 2014 and associated guidance',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <svg className="w-5 h-5 text-welsh-green mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Recognising Abuse</h2>
              <p className="mb-4">
                We train our staff to recognise all forms of abuse, including:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {['Physical abuse', 'Emotional/psychological abuse', 'Financial abuse', 'Sexual abuse', 'Neglect', 'Self-neglect', 'Domestic abuse', 'Modern slavery'].map(type => (
                  <span key={type} className="text-sm px-3 py-2 bg-red-50 text-welsh-red rounded-lg">{type}</span>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">How to Raise a Concern</h2>
              <p className="mb-4">
                If you have a safeguarding concern about someone we support — or about the conduct of any of our staff — please contact us immediately:
              </p>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="font-medium text-slate-900 mb-2">Report a safeguarding concern:</p>
                <p className="text-sm">Phone: <strong>01745 000 000</strong></p>
                <p className="text-sm">Email: <strong>safeguarding@accredilink.co.uk</strong></p>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                You can also contact your local authority safeguarding team directly, or call the police if someone is in immediate danger.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

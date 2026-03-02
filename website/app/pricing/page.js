'use client';

import Link from 'next/link';

const plans = [
  {
    name: 'Starter',
    price: '£49',
    period: '/month',
    description: 'For small domiciliary care providers getting started.',
    staff: 'Up to 10 staff',
    features: [
      'Staff rota & shift management',
      'Service user care plans (EN/CY)',
      'Daily care logging',
      'eMAR medication tracking',
      'Mobile app (iOS & Android)',
      'CIW compliance dashboard',
      'Email support',
    ],
    cta: 'Start Free Trial',
    ctaHref: 'https://carecallai-website.vercel.app/signup',
    highlight: false,
  },
  {
    name: 'Professional',
    price: '£99',
    period: '/month',
    description: 'Everything you need for CIW-compliant care management.',
    staff: 'Up to 50 staff',
    features: [
      'Everything in Starter, plus:',
      'AI-powered care plan generation',
      'AI course builder & training matrix',
      'Staff supervision tracking (Reg 36)',
      'Invoicing & payroll',
      'Family portal access',
      'Safeguarding incident reporting',
      'Welsh language bilingual support',
      'Priority email & phone support',
    ],
    cta: 'Start Free Trial',
    ctaHref: 'https://carecallai-website.vercel.app/signup',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For larger organisations and care home groups.',
    staff: 'Unlimited staff',
    features: [
      'Everything in Professional, plus:',
      'Multi-site management',
      'Custom integrations & API access',
      'Dedicated account manager',
      'On-site training & setup',
      'Custom compliance reporting',
      'SLA & uptime guarantees',
      'Priority phone & video support',
    ],
    cta: 'Contact Us',
    ctaHref: '/contact',
    highlight: false,
  },
];

const comparisonFeatures = [
  { name: 'Staff rota management', starter: true, professional: true, enterprise: true },
  { name: 'Care plans (EN/CY bilingual)', starter: true, professional: true, enterprise: true },
  { name: 'Daily care logging', starter: true, professional: true, enterprise: true },
  { name: 'eMAR medication tracking', starter: true, professional: true, enterprise: true },
  { name: 'Mobile app (iOS & Android)', starter: true, professional: true, enterprise: true },
  { name: 'CIW compliance dashboard', starter: true, professional: true, enterprise: true },
  { name: 'AI care plan generation', starter: false, professional: true, enterprise: true },
  { name: 'AI training course builder', starter: false, professional: true, enterprise: true },
  { name: 'Staff supervision tracking', starter: false, professional: true, enterprise: true },
  { name: 'Invoicing & payroll', starter: false, professional: true, enterprise: true },
  { name: 'Family portal', starter: false, professional: true, enterprise: true },
  { name: 'Safeguarding reporting', starter: false, professional: true, enterprise: true },
  { name: 'Multi-site management', starter: false, professional: false, enterprise: true },
  { name: 'Custom integrations / API', starter: false, professional: false, enterprise: true },
  { name: 'Dedicated account manager', starter: false, professional: false, enterprise: true },
  { name: 'Staff limit', starter: '10', professional: '50', enterprise: 'Unlimited' },
];

function Check() {
  return (
    <svg className="w-5 h-5 text-welsh-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function Cross() {
  return (
    <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-50 to-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-3 py-1 text-xs font-semibold text-welsh-green bg-green-50 rounded-full mb-4">
            14-Day Free Trial — No Card Required
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Built for Welsh and English care providers. CIW & CQC compliance included in every plan.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="-mt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.highlight
                    ? 'border-welsh-green shadow-xl ring-2 ring-welsh-green/20'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-welsh-green text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-slate-500">{plan.period}</span>
                  <p className="text-sm text-slate-500 mt-1">{plan.staff}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      {f.startsWith('Everything') ? (
                        <span className="text-welsh-green font-medium">{f}</span>
                      ) : (
                        <>
                          <Check />
                          <span>{f}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.ctaHref}
                  className={`block text-center py-2.5 px-4 rounded-lg font-medium transition-colors ${
                    plan.highlight
                      ? 'bg-welsh-green text-white hover:bg-welsh-green-light'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 pr-4 font-medium text-slate-900">Feature</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-900">Starter</th>
                  <th className="text-center py-3 px-4 font-medium text-welsh-green">Professional</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((f) => (
                  <tr key={f.name} className="border-b border-slate-100">
                    <td className="py-3 pr-4 text-slate-700">{f.name}</td>
                    {['starter', 'professional', 'enterprise'].map((tier) => (
                      <td key={tier} className="text-center py-3 px-4">
                        {typeof f[tier] === 'boolean' ? (
                          f[tier] ? <div className="flex justify-center"><Check /></div> : <div className="flex justify-center"><Cross /></div>
                        ) : (
                          <span className="text-slate-700 font-medium">{f[tier]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">Ready to transform your care management?</h2>
          <p className="mt-3 text-slate-600">
            Start your 14-day free trial today. No credit card required. Full access to all features.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://carecallai-website.vercel.app/signup"
              className="inline-flex items-center justify-center px-6 py-3 bg-welsh-green text-white font-medium rounded-lg hover:bg-welsh-green-light transition-colors"
            >
              Start Free Trial
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

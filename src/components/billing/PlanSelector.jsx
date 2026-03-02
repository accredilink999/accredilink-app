import { useState } from 'react';
import { invokeFunction } from '@/api/functions';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Loader2, Check, Sparkles, Building2 } from 'lucide-react';

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: { monthly: 99, annual: 79 },
    staff: 'Up to 15 staff',
    extraUser: '£5/user after',
    icon: Check,
    color: 'blue',
    features: [
      'Welsh & English bilingual',
      'Rota & scheduling',
      'Care logging & daily notes',
      'Mobile app (iOS, Android, PWA)',
      'Staff management & HR',
      'Service user profiles',
      'Basic invoicing',
      'Push notifications',
      'Email support',
    ],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: { monthly: 199, annual: 159 },
    staff: 'Up to 30 staff',
    extraUser: '£3/user after',
    icon: Sparkles,
    color: 'teal',
    popular: true,
    features: [
      'Everything in Starter, plus:',
      'Staff training & course management',
      'Medication / eMAR charts',
      'Full rota with shift patterns',
      'AI Assistant',
      'Family portal',
      'GPS check-in & tracking',
      'Full invoicing',
      'Email + chat support',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 349, annual: 279 },
    staff: 'Unlimited staff',
    extraUser: null,
    icon: Building2,
    color: 'purple',
    features: [
      'Everything in Professional, plus:',
      'CIW/CQC compliance suite',
      'Welsh Language Standards compliant',
      '12-weekly supervision tracking',
      'Full payroll & expenses',
      'Multi-area scheduling',
      'Training matrix & certificates',
      'Audit logs & reports',
      'Priority phone support',
      'Dedicated onboarding',
    ],
  },
];

export default function PlanSelector() {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [annual, setAnnual] = useState(false);
  const orgId = getCurrentOrgId();

  const handleSelect = async (planKey) => {
    setLoading(planKey);
    setError(null);
    try {
      const result = await invokeFunction('create-checkout-session', {
        plan: planKey,
        organizationId: orgId,
        billing: annual ? 'annual' : 'monthly',
      });

      if (result.url) {
        window.location.href = result.url;
      } else {
        setError(result.message || result.error || 'Failed to start checkout');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">CC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Choose your plan
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Start with a 7-day free trial. Your card won't be charged until the trial ends.
            Cancel anytime during the trial — no charge.
          </p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className={`text-sm font-medium ${!annual ? 'text-slate-900' : 'text-slate-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              annual ? 'bg-teal-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                annual ? 'translate-x-7' : 'translate-x-0.5'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${annual ? 'text-slate-900' : 'text-slate-500'}`}>
            Annual{' '}
            <span className="text-teal-600 text-xs font-semibold">2 months free</span>
          </span>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = annual ? plan.price.annual : plan.price.monthly;
            return (
              <div
                key={plan.key}
                className={`relative bg-white rounded-2xl border p-6 flex flex-col ${
                  plan.popular
                    ? 'border-teal-500 shadow-xl ring-2 ring-teal-500'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-teal-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  plan.color === 'teal' ? 'bg-teal-50' : plan.color === 'purple' ? 'bg-purple-50' : 'bg-blue-50'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    plan.color === 'teal' ? 'text-teal-600' : plan.color === 'purple' ? 'text-purple-600' : 'text-blue-600'
                  }`} />
                </div>

                <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold text-slate-900">£{price}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-sm text-slate-500 mb-1">{plan.staff}</p>
                {plan.extraUser && (
                  <p className="text-xs text-slate-400 mb-4">{plan.extraUser}</p>
                )}
                {!plan.extraUser && <p className="text-xs text-slate-400 mb-4">&nbsp;</p>}

                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(plan.key)}
                  disabled={!!loading}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {loading === plan.key ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting...
                    </span>
                  ) : (
                    'Start 7-Day Free Trial'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Secure payment via Stripe. Cancel anytime within 7 days — no charge.
          {annual
            ? ' After the trial, you\'ll be billed annually. Save 2 months compared to monthly.'
            : ' After the trial, your chosen plan auto-renews monthly.'}
        </p>
      </div>
    </div>
  );
}

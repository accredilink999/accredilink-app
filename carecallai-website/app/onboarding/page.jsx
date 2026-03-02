'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.carecallai.co.uk';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const PLANS = [
  {
    key: 'starter',
    name: 'Starter',
    price: { monthly: 99, annual: 79 },
    staff: 'Up to 15 staff',
    extraUser: '£5/user after',
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

export default function OnboardingPage() {
  const [step, setStep] = useState('loading'); // loading, plan, error
  const [user, setUser] = useState(null);
  const [orgId, setOrgId] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);
  const [annual, setAnnual] = useState(false);

  // On mount: read tokens from hash, set session, create org if needed
  useEffect(() => {
    const init = async () => {
      try {
        // Parse tokens from URL hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const at = params.get('access_token');
        const rt = params.get('refresh_token');

        if (!at || !rt) {
          setError('No authentication tokens found. Please log in again.');
          setStep('error');
          return;
        }

        setAccessToken(at);

        // Clear hash from URL
        window.history.replaceState(null, '', window.location.pathname);

        // Set the session
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token: at,
          refresh_token: rt,
        });

        if (sessionErr || !sessionData.user) {
          setError('Session expired. Please log in again.');
          setStep('error');
          return;
        }

        const currentUser = sessionData.user;
        setUser(currentUser);

        // Call edge function to set up organization (bypasses RLS)
        const setupRes = await fetch(`${SUPABASE_URL}/functions/v1/setup-organization`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${at}`,
          },
          body: JSON.stringify({}),
        });

        const setupData = await setupRes.json();

        if (!setupRes.ok || !setupData.organizationId) {
          throw new Error(setupData.error || 'Failed to set up organization');
        }

        setOrgId(setupData.organizationId);
        setStep('plan');
      } catch (err) {
        console.error('Onboarding init error:', err);
        setError(err.message || 'Something went wrong. Please try again.');
        setStep('error');
      }
    };

    init();
  }, []);

  const handleSelectPlan = async (planKey) => {
    setLoading(planKey);
    setError(null);

    try {
      // Call create-checkout-session edge function directly
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          plan: planKey,
          organizationId: orgId,
          billing: annual ? 'annual' : 'monthly',
        }),
      });

      const result = await res.json();

      if (result.url) {
        window.location.href = result.url;
      } else if (result.message) {
        setError(result.message);
      } else {
        setError(result.error || 'Failed to create checkout session. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  // Loading state
  if (step === 'loading') {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white min-h-[60vh]">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">CC</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-slate-600">Setting up your account...</span>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (step === 'error') {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white min-h-[60vh]">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-500 mb-6">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </section>
    );
  }

  // Plan selection
  return (
    <section className="py-12 sm:py-20 bg-gradient-to-b from-teal-50 to-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">CC</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            Welcome{user?.user_metadata?.company_name ? `, ${user.user_metadata.company_name}` : ''}!
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Choose your plan to get started. Every plan includes a 7-day free trial.
            Your card won&apos;t be charged until the trial ends. Cancel anytime.
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
                  <svg className={`w-5 h-5 ${
                    plan.color === 'teal' ? 'text-teal-600' : plan.color === 'purple' ? 'text-purple-600' : 'text-blue-600'
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {plan.color === 'teal' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    ) : plan.color === 'purple' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    )}
                  </svg>
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
                      <svg className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.key)}
                  disabled={!!loading}
                  className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${
                    plan.popular
                      ? 'bg-teal-600 text-white hover:bg-teal-700'
                      : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {loading === plan.key ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Redirecting to checkout...
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

        <div className="text-center mt-4">
          <Link
            href={`${APP_URL}/`}
            className="text-sm text-slate-400 hover:text-slate-600 underline"
          >
            Skip for now — go to dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

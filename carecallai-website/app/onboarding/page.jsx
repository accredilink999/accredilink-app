'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function OnboardingPage() {
  const [step, setStep] = useState('loading'); // loading | checkout | error
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Parse tokens from URL hash (from signup email confirmation)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const at = params.get('access_token');
        const rt = params.get('refresh_token');

        if (!at || !rt) {
          setError('No authentication tokens found. Please log in again.');
          setStep('error');
          return;
        }

        window.history.replaceState(null, '', window.location.pathname);

        // Set the Supabase session so it persists through the Stripe redirect
        const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
          access_token: at,
          refresh_token: rt,
        });

        if (sessionErr || !sessionData.user) {
          setError('Session expired. Please log in again.');
          setStep('error');
          return;
        }

        // Create the organisation (pending payment)
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
          throw new Error(setupData.error || 'Failed to set up organisation');
        }

        // Now redirect to Stripe checkout — payment required before accessing the app
        const checkoutRes = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${at}`,
          },
          body: JSON.stringify({
            plan: 'starter',
            organizationId: setupData.organizationId,
            billing: 'monthly',
          }),
        });

        const checkoutData = await checkoutRes.json();

        if (!checkoutRes.ok || !checkoutData.url) {
          throw new Error(checkoutData.error || 'Failed to create payment session');
        }

        // Go to Stripe — success_url will bring them back to /onboarding/success
        window.location.href = checkoutData.url;

      } catch (err) {
        console.error('Onboarding error:', err);
        setError(err.message || 'Something went wrong. Please try again.');
        setStep('error');
      }
    };

    init();
  }, []);

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
          <Link href="/login" className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors">
            Back to Login
          </Link>
        </div>
      </section>
    );
  }

  // Loading / redirecting to Stripe
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white min-h-[60vh]">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">CC</span>
        </div>
        <div className="flex items-center justify-center gap-2 mb-3">
          <svg className="w-5 h-5 animate-spin text-teal-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-slate-600">Setting up your account...</span>
        </div>
        <p className="text-sm text-slate-400">You&apos;ll be redirected to secure payment in a moment.</p>
      </div>
    </section>
  );
}

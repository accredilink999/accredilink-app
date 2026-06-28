'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.carecallai.co.uk';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function OnboardingPage() {
  const [step, setStep] = useState('loading'); // loading, success, error
  const [user, setUser] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [error, setError] = useState(null);
  const [authTokens, setAuthTokens] = useState(null);

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

        setUser(sessionData.user);
        setAuthTokens({ at, rt });

        // Call edge function to set up organization
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

        setInviteCode(setupData.inviteCode || null);
        setStep('success');

        // Auto-redirect to app after 4 seconds — pass tokens so app picks up correct session
        setTimeout(() => {
          window.location.href = `${APP_URL}/login#access_token=${at}&refresh_token=${rt}&type=signup`;
        }, 4000);
      } catch (err) {
        console.error('Onboarding init error:', err);
        setError(err.message || 'Something went wrong. Please try again.');
        setStep('error');
      }
    };

    init();
  }, []);

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

  // Success — trial activated, redirect to app
  const companyName = user?.user_metadata?.company_name;

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white min-h-[60vh]">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          You&apos;re all set!
        </h1>

        <p className="text-slate-500 mb-2">
          {companyName
            ? `Welcome, ${companyName}! `
            : 'Welcome! '}
          All features are unlocked. £99/month — everything included.
        </p>

        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-6 mt-4">
          <p className="text-teal-800 text-sm font-medium mb-1">What you get:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-left">
            {[
              'Rota & scheduling',
              'eMAR medication',
              'Care logging',
              'Clinical Suite',
              'Mobile app',
              'CIW/CQC compliance',
              'AI Assistant',
              'Family portal',
            ].map((f) => (
              <p key={f} className="text-teal-700 text-xs flex items-center gap-1">
                <svg className="w-3 h-3 text-teal-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
                {f}
              </p>
            ))}
          </div>
        </div>

        {inviteCode && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-slate-500 mb-1">Your staff invite code:</p>
            <p className="text-lg font-mono font-bold text-slate-900 tracking-widest">{inviteCode}</p>
            <p className="text-xs text-slate-400 mt-1">Share this with your team so they can join</p>
          </div>
        )}

        <a
          href={authTokens ? `${APP_URL}/login#access_token=${authTokens.at}&refresh_token=${authTokens.rt}&type=signup` : APP_URL}
          className="inline-flex items-center justify-center w-full max-w-xs px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors mb-3"
        >
          Go to Dashboard
        </a>

        <p className="text-xs text-slate-400">
          Redirecting automatically in a few seconds...
        </p>

        <div className="mt-6">
          <Link
            href="/pricing"
            className="text-sm text-slate-400 hover:text-slate-600 underline"
          >
            View pricing plans for after your trial
          </Link>
        </div>
      </div>
    </section>
  );
}

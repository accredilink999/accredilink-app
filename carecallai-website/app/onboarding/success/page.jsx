'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.carecallai.co.uk';

export default function PaymentSuccessPage() {
  const [appLink, setAppLink] = useState(APP_URL);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Get the current Supabase session (persisted from /onboarding before Stripe redirect)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token && session?.refresh_token) {
        const link = `${APP_URL}/login#access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=signup`;
        setAppLink(link);
        // Auto-redirect after 3 seconds
        setTimeout(() => { window.location.href = link; }, 3000);
      } else {
        // No session — just send to app login
        setAppLink(`${APP_URL}/login`);
        setTimeout(() => { window.location.href = `${APP_URL}/login`; }, 3000);
      }
      setReady(true);
    });
  }, []);

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white min-h-[60vh]">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Payment confirmed!</h1>
        <p className="text-slate-500 mb-2">
          Welcome to CareCall AI. Your subscription is active.
        </p>
        <p className="text-slate-500 mb-8 text-sm">
          £99/month — everything included. Cancel anytime.
        </p>

        <a
          href={appLink}
          className="inline-flex items-center justify-center w-full max-w-xs px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors mb-3"
        >
          Go to Dashboard
          <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>

        <p className="text-xs text-slate-400">Redirecting automatically in a few seconds...</p>

        <div className="mt-10 bg-white rounded-xl border border-slate-200 p-6 text-left">
          <h2 className="font-semibold text-slate-900 mb-3">What happens next?</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold mt-0.5">1.</span>
              You&apos;ll be taken straight to your dashboard
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold mt-0.5">2.</span>
              Add your staff members and service users
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold mt-0.5">3.</span>
              Set up your rota and start logging care
            </li>
            <li className="flex items-start gap-2">
              <span className="text-teal-600 font-bold mt-0.5">4.</span>
              Explore compliance tools, eMAR, radio and AI features
            </li>
          </ul>
        </div>

        <p className="text-xs text-slate-400 mt-6">
          Need help?{' '}
          <Link href="/contact" className="text-teal-600 hover:underline">Contact support</Link>
        </p>
      </div>
    </section>
  );
}

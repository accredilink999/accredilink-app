'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SubscribePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [status, setStatus] = useState(''); // '' | 'sending' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, organisation }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
      } else {
        setErrorMsg(data.error || 'Something went wrong');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">You&apos;re subscribed!</h1>
          <p className="text-slate-600 mb-6">
            Thank you for subscribing to CareCallAI updates. We&apos;ll keep you informed about new features, compliance tips, and care sector insights.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-500 transition-colors"
          >
            Visit CareCallAI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="CareCallAI"
            className="w-16 h-16 rounded-xl mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Stay Updated</h1>
          <p className="text-slate-600 text-sm">
            Subscribe to receive product updates, compliance tips, and care sector insights from CareCallAI.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
          <div className="mb-4">
            <label htmlFor="sub-email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email address *
            </label>
            <input
              id="sub-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="sub-name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Your name
            </label>
            <input
              id="sub-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name (optional)"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="sub-org" className="block text-sm font-medium text-slate-700 mb-1.5">
              Organisation
            </label>
            <input
              id="sub-org"
              type="text"
              value={organisation}
              onChange={(e) => setOrganisation(e.target.value)}
              placeholder="Care agency or company (optional)"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full px-4 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-500 transition-colors text-sm disabled:opacity-50"
          >
            {status === 'sending' ? 'Subscribing...' : 'Subscribe to Updates'}
          </button>

          <p className="text-xs text-slate-400 text-center mt-4">
            We respect your privacy. Unsubscribe at any time.
            <br />
            <Link href="/privacy" className="text-teal-600 hover:underline">Privacy Policy</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

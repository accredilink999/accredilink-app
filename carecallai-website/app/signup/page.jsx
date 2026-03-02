'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://carecallai.co.uk';

export default function SignupPage() {
  const [mode, setMode] = useState('owner'); // 'owner' = new company, 'staff' = join existing
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    if (mode === 'owner' && !companyName.trim()) {
      setError('Please enter your company name.');
      setLoading(false);
      return;
    }

    if (mode === 'staff' && !inviteCode.trim()) {
      setError('Please enter the invite code from your manager.');
      setLoading(false);
      return;
    }

    try {
      const metadata = { full_name: fullName.trim() };
      if (mode === 'owner') {
        metadata.company_name = companyName.trim();
      } else {
        metadata.invite_code = inviteCode.trim().toUpperCase();
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${SITE_URL}/onboarding`,
        },
      });

      if (authError) throw authError;

      if (data.user && !data.session) {
        // Email confirmation required — show "check email" screen
        setSuccess(true);
        return;
      }

      if (data.session) {
        // Auto-confirmed — go straight to onboarding (plan selection)
        const { access_token, refresh_token } = data.session;
        window.location.href = `${SITE_URL}/onboarding#access_token=${access_token}&refresh_token=${refresh_token}`;
        return;
      }

      setSuccess(true);
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('This email is already registered. Please log in instead.');
      } else {
        setError(err.message || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white min-h-[60vh]">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Check your email</h1>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">
              We&apos;ve sent a confirmation link to <strong className="text-slate-700">{email}</strong>. Click the link to activate your account.
            </p>
          </div>
          <div className="text-center space-y-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full max-w-xs px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go to Login
            </Link>
            <p className="text-xs text-slate-400">
              Didn&apos;t receive an email? Check your spam folder.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-teal-50 to-white min-h-[60vh]">
      <div className="max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">CC</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {mode === 'owner' ? 'Start your free trial' : 'Join your team'}
          </h1>
          <p className="text-slate-500 mt-1">
            {mode === 'owner'
              ? '7-day free trial. Cancel anytime.'
              : 'Enter the invite code your manager gave you.'}
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('owner'); setError(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'owner'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            New Company
          </button>
          <button
            type="button"
            onClick={() => { setMode('staff'); setError(null); }}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === 'staff'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Join Existing Team
          </button>
        </div>

        <form onSubmit={handleSignup} className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              required
              autoFocus
              autoComplete="name"
            />
          </div>

          {mode === 'owner' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Sunrise Domiciliary Care"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                required
                autoComplete="organization"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Invite code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. A1B2C3D4"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-center text-lg tracking-widest font-mono uppercase"
                required
                maxLength={12}
              />
              <p className="text-xs text-slate-400 mt-1">Ask your manager for this code</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourcompany.co.uk"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none pr-10"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                {mode === 'owner' ? 'Creating account...' : 'Joining team...'}
              </span>
            ) : mode === 'owner' ? 'Start Free Trial' : 'Create Account & Join Team'}
          </button>

          <p className="text-xs text-center text-slate-400">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-slate-500 hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-slate-500 hover:underline">Privacy Policy</Link>.
          </p>
        </form>

        <div className="text-center mt-6 space-y-3">
          <p className="text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-teal-600 hover:underline">
              Sign in
            </Link>
          </p>
          {mode === 'owner' && (
            <div className="flex items-center gap-3 justify-center text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                7-day free trial
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Card required
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Cancel anytime
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

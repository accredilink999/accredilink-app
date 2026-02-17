'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

function RegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('No invite token provided.');
      setLoading(false);
      return;
    }
    fetch(`/api/admin/register?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvite(data.invite);
        } else {
          setError(data.error || 'Invalid or expired invite link.');
        }
      })
      .catch(() => setError('Failed to validate invite link.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#B91C1C] rounded-full" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Account Created</h2>
        <p className="text-sm text-slate-500 mb-6">
          Your account has been set up successfully. You can now sign in with your email and password.
        </p>
        <Link
          href="/admin"
          className="inline-flex px-6 py-3 bg-[#B91C1C] text-white font-semibold rounded-lg hover:bg-[#DC2626] transition-colors text-sm"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Invalid Invite</h2>
        <p className="text-sm text-slate-500 mb-6">{error}</p>
        <Link
          href="/admin"
          className="inline-flex px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors text-sm"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (!invite) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-500">Setting up account for</p>
        <p className="text-sm font-medium text-slate-900">{invite.email}</p>
      </div>

      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/50 focus:border-[#B91C1C]"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/50 focus:border-[#B91C1C]"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter your password"
          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/50 focus:border-[#B91C1C]"
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-3 bg-[#B91C1C] text-white font-semibold rounded-lg hover:bg-[#DC2626] transition-colors text-sm disabled:opacity-50"
      >
        {submitting ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/images/logo.png"
            alt="Accredilink Logo"
            width={80}
            height={80}
            className="w-20 h-20 rounded-xl object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-slate-400 text-sm mt-1">Accredilink Admin Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Suspense fallback={
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-[#B91C1C] rounded-full" />
            </div>
          }>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

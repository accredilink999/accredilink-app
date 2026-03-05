'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const emailAccounts = [
  { address: 'info@accredilinkcare.co.uk', label: 'General Info', icon: '📧' },
  { address: 'careers@accredilinkcare.co.uk', label: 'Careers', icon: '💼' },
  { address: 'safeguarding@accredilinkcare.co.uk', label: 'Safeguarding', icon: '🛡' },
  { address: 'complaints@accredilinkcare.co.uk', label: 'Complaints', icon: '📋' },
  { address: 'enquiries@accredilinkcare.co.uk', label: 'Enquiries', icon: '📩' },
];

export default function AdminPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginMode, setLoginMode] = useState('owner');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  // Users state
  const [adminUsers, setAdminUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(null);

  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    const userStr = sessionStorage.getItem('admin_user');
    if (token) {
      setIsLoggedIn(true);
      if (userStr) {
        try { setCurrentUser(JSON.parse(userStr)); } catch { /* ignore */ }
      }
    }
    setCheckingSession(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    const token = sessionStorage.getItem('admin_token');
    if (!token) return;
    setUsersLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAdminUsers(data.users);
    } catch { /* ignore */ }
    setUsersLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn && currentUser?.role === 'owner') {
      fetchUsers();
    }
  }, [isLoggedIn, currentUser, fetchUsers]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const body = loginMode === 'owner'
      ? { password }
      : { email, password };

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem('admin_token', data.token);
        sessionStorage.setItem('admin_user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setPassword('');
        setEmail('');
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAdminUsers([]);
  };

  const handleInvite = async () => {
    setInviteError('');
    setInviteUrl('');
    setInviteSuccess('');
    setCopied(false);

    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteError('Please enter a valid email address.');
      return;
    }

    setInviteLoading(true);
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: 'manager' }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteUrl(data.inviteUrl);
        setInviteSuccess(`Invite created for ${data.email}`);
        setInviteEmail('');
      } else {
        setInviteError(data.error || 'Failed to create invite.');
      }
    } catch {
      setInviteError('Failed to create invite.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleRemoveUser = async (userEmail) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ email: userEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setAdminUsers((prev) => prev.filter((u) => u.email !== userEmail));
      }
    } catch { /* ignore */ }
    setRemoveConfirm(null);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin w-8 h-8 border-4 border-slate-300 border-t-welsh-red rounded-full" />
      </div>
    );
  }

  if (!isLoggedIn) {
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
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
            <p className="text-slate-400 text-sm mt-1">Accredilink Community Response Taskforce</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Login mode tabs */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => { setLoginMode('owner'); setError(''); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  loginMode === 'owner'
                    ? 'text-[#B91C1C] border-b-2 border-[#B91C1C] bg-red-50/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => { setLoginMode('admin'); setError(''); }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  loginMode === 'admin'
                    ? 'text-[#B91C1C] border-b-2 border-[#B91C1C] bg-red-50/50'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Admin
              </button>
            </div>

            <form onSubmit={handleLogin} className="p-8">
              {loginMode === 'admin' && (
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/50 focus:border-[#B91C1C]"
                  />
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  {loginMode === 'owner' ? 'Owner Password' : 'Password'}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={loginMode === 'owner' ? 'Enter owner password' : 'Enter your password'}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/50 focus:border-[#B91C1C]"
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-[#B91C1C] text-white font-semibold rounded-lg hover:bg-[#DC2626] transition-colors text-sm disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.role === 'owner';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Accredilink Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg object-contain"
            />
            <div>
              <h1 className="font-bold text-lg">Admin Portal</h1>
              <p className="text-xs text-slate-400">Accredilink Community Response Taskforce</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="hidden sm:block text-right">
                <p className="text-sm text-white">{currentUser.name}</p>
                <p className="text-xs text-slate-400 capitalize">{currentUser.role}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Access */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Staff Web App */}
          <a
            href="https://care-call-ai-clone.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-green-300 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Staff Web App</h3>
                <p className="text-sm text-slate-500">Care call management system</p>
              </div>
              <svg className="w-5 h-5 text-slate-400 ml-auto group-hover:text-green-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>

          {/* Website */}
          <a
            href="https://www.accredilinkcare.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-lg">Public Website</h3>
                <p className="text-sm text-slate-500">www.accredilinkcare.co.uk</p>
              </div>
              <svg className="w-5 h-5 text-slate-400 ml-auto group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </a>
        </div>

        {/* Email Accounts */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Email Accounts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {emailAccounts.map((acct) => (
              <a
                key={acct.address}
                href="https://mail.ionos.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-red-300 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{acct.icon}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 text-sm">{acct.label}</p>
                    <p className="text-xs text-slate-500 truncate">{acct.address}</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-300 ml-auto mt-1 group-hover:text-red-500 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">All email links open Ionos Webmail. Log in with the relevant email address and password.</p>
        </div>

        {/* Social Media Hub */}
        <div className="mb-8">
          <a
            href="/admin/social"
            className="group block bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-6 hover:shadow-lg hover:border-purple-300 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl group-hover:bg-purple-200 transition-colors">
                📱
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 text-lg">Social Media Hub</h3>
                <p className="text-sm text-slate-500">AI content generator, post scheduling & management for both brands</p>
              </div>
              <svg className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>

        {/* Admin Tools */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-400 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 19.5h20L12 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Vercel Dashboard</p>
                  <p className="text-xs text-slate-500">Deployments & hosting</p>
                </div>
              </div>
            </a>

            <a
              href="https://github.com/accredilink999/accredilink-app"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-400 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">GitHub Repository</p>
                  <p className="text-xs text-slate-500">Source code</p>
                </div>
              </div>
            </a>

            <a
              href="https://login.ionos.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-400 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Ionos Dashboard</p>
                  <p className="text-xs text-slate-500">Domain & email management</p>
                </div>
              </div>
            </a>

            <a
              href="https://businessapp.b2b.trustpilot.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-slate-400 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#00B67A] flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-slate-900 text-sm">Trustpilot Business</p>
                  <p className="text-xs text-slate-500">Reviews & reputation</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* Owner-only: Invite Manager */}
        {isOwner && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Invite Manager</h2>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-sm text-slate-500 mb-4">
                Generate an invite link and share it with a manager. They&apos;ll set up their own password to access this portal.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="manager@example.com"
                  className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/50 focus:border-[#B91C1C]"
                />
                <button
                  onClick={handleInvite}
                  disabled={inviteLoading}
                  className="px-6 py-3 bg-[#B91C1C] text-white font-semibold rounded-lg hover:bg-[#DC2626] transition-colors text-sm disabled:opacity-50 whitespace-nowrap"
                >
                  {inviteLoading ? 'Creating...' : 'Generate Invite Link'}
                </button>
              </div>

              {inviteError && (
                <p className="text-red-600 text-sm mt-3 bg-red-50 p-3 rounded-lg">{inviteError}</p>
              )}

              {inviteUrl && (
                <div className="mt-4">
                  {inviteSuccess && (
                    <p className="text-green-700 text-sm mb-2 font-medium">{inviteSuccess}</p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteUrl}
                      className="flex-1 px-4 py-3 rounded-lg border border-slate-300 text-slate-700 text-sm bg-slate-50 font-mono"
                    />
                    <button
                      onClick={handleCopy}
                      className={`px-6 py-3 font-semibold rounded-lg text-sm transition-colors whitespace-nowrap ${
                        copied
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">This link expires in 7 days. Share it via WhatsApp, email, or message.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Owner-only: Admin Users */}
        {isOwner && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Users</h2>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {usersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-6 h-6 border-3 border-slate-300 border-t-[#B91C1C] rounded-full" />
                </div>
              ) : adminUsers.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-slate-500">No managers invited yet.</p>
                  <p className="text-xs text-slate-400 mt-1">Use the invite section above to add managers.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {adminUsers.map((user) => (
                    <div key={user.email} className="flex items-center justify-between px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Added {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {user.invitedBy && ` by ${user.invitedBy}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">
                          {user.role}
                        </span>
                        {removeConfirm === user.email ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRemoveUser(user.email)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setRemoveConfirm(null)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setRemoveConfirm(user.email)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';

const PLAN_COLORS = {
  trial: 'bg-yellow-100 text-yellow-800',
  starter: 'bg-blue-100 text-blue-800',
  professional: 'bg-teal-100 text-teal-800',
  enterprise: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PLAN_LABELS = {
  trial: 'Trial',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  cancelled: 'Cancelled',
};

async function apiCall(action, params = {}) {
  const token = sessionStorage.getItem('admin_token');
  const res = await fetch('/api/platform-admin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export default function PlatformAdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Data
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrg, setExpandedOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Action states
  const [confirmKill, setConfirmKill] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Check session
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token));
        if (payload.role === 'platform_admin' && Date.now() - payload.ts < 86400000) {
          setIsLoggedIn(true);
        }
      } catch { /* invalid token */ }
    }
    setCheckingSession(false);
  }, []);

  // Load data when logged in
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, orgsRes] = await Promise.all([
        apiCall('stats'),
        apiCall('list-orgs'),
      ]);
      setStats(statsRes.stats);
      setOrgs(orgsRes.orgs || []);
    } catch (err) {
      console.error('Load error:', err);
      if (err.message.includes('401') || err.message.includes('expired')) {
        handleLogout();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isLoggedIn) loadData();
  }, [isLoggedIn, loadData]);

  // Load members when org expanded
  useEffect(() => {
    if (!expandedOrg) { setMembers([]); return; }
    setMembersLoading(true);
    apiCall('list-org-members', { organizationId: expandedOrg })
      .then(res => setMembers(res.members || []))
      .catch(() => setMembers([]))
      .finally(() => setMembersLoading(false));
  }, [expandedOrg]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('admin_token', data.token);
        setIsLoggedIn(true);
        setPassword('');
      } else {
        setLoginError(data.error || 'Invalid password');
      }
    } catch {
      setLoginError('Something went wrong');
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_token');
    setIsLoggedIn(false);
    setStats(null);
    setOrgs([]);
  };

  const handleToggleActive = async (orgId, newActive) => {
    setActionLoading(orgId);
    try {
      await apiCall('toggle-org-active', { organizationId: orgId, isActive: newActive });
      await loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setActionLoading(null);
    setConfirmKill(null);
  };

  const handleChangePlan = async (orgId, plan) => {
    setActionLoading(orgId);
    try {
      await apiCall('update-org-plan', {
        organizationId: orgId,
        plan,
        isActive: plan !== 'cancelled',
      });
      await loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setActionLoading(null);
  };

  const handleDeleteOrg = async (orgId) => {
    setActionLoading(orgId);
    try {
      await apiCall('delete-org', { organizationId: orgId });
      setExpandedOrg(null);
      await loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setActionLoading(null);
    setConfirmDelete(null);
  };

  // ─── Loading splash ───
  if (checkingSession) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Login ───
  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Platform Admin</h1>
            <p className="text-slate-400 text-sm mt-1">CareCall AI — Organisation Management</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                />
              </div>

              {loginError && (
                <p className="text-red-600 text-sm mb-4 bg-red-50 p-3 rounded-lg">{loginError}</p>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full px-4 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors text-sm disabled:opacity-50"
              >
                {loginLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─── Dashboard ───
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">CareCall AI — Platform Admin</h1>
              <p className="text-xs text-slate-400">Organisation & Subscription Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded border border-slate-600 hover:border-slate-400 transition-colors"
            >
              ↻ Refresh
            </button>
            <button
              onClick={handleLogout}
              className="text-xs text-red-300 hover:text-red-100 px-3 py-1.5 rounded border border-red-800 hover:border-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Links */}
        <div className="mb-6 flex flex-wrap gap-3">
          <a
            href="/admin/customers"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl px-5 py-3 hover:shadow-md hover:border-green-300 transition-all group"
          >
            <span className="text-xl">👥</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm group-hover:text-green-700 transition-colors">Customer Management</p>
              <p className="text-xs text-slate-500">Manage signups, send welcome & update emails</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-green-600 transition-colors ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="/admin/campaigns"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-xl px-5 py-3 hover:shadow-md hover:border-teal-300 transition-all group"
          >
            <span className="text-xl">📧</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm group-hover:text-teal-700 transition-colors">Email Campaigns</p>
              <p className="text-xs text-slate-500">AI-powered marketing to CIW & CQC providers</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="/admin/youtube"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl px-5 py-3 hover:shadow-md hover:border-red-300 transition-all group"
          >
            <span className="text-xl">🎬</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm group-hover:text-red-700 transition-colors">YouTube Scripts</p>
              <p className="text-xs text-slate-500">AI video scripts & HeyGen avatar generation</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="/admin/harvester"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl px-5 py-3 hover:shadow-md hover:border-purple-300 transition-all group"
          >
            <span className="text-xl">🔍</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">Contact Harvester</p>
              <p className="text-xs text-slate-500">CQC & CIW provider search, email enrichment</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="/admin/training"
            className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl px-5 py-3 hover:shadow-md hover:border-amber-300 transition-all group"
          >
            <span className="text-xl">🎓</span>
            <div>
              <p className="font-semibold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">Training Courses</p>
              <p className="text-xs text-slate-500">Manage courses, questions & free certificates</p>
            </div>
            <svg className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total Orgs', value: stats.total, color: 'text-slate-900' },
              { label: 'Active', value: stats.active, color: 'text-green-600' },
              { label: 'On Trial', value: stats.trial, color: 'text-yellow-600' },
              { label: 'Paid', value: stats.paid, color: 'text-teal-600' },
              { label: 'Cancelled', value: stats.cancelled, color: 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl shadow-sm border p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-6 h-6 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading organisations...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && orgs.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <p className="text-sm text-slate-500">No organisations found.</p>
          </div>
        )}

        {/* Org list */}
        <div className="space-y-3">
          {orgs.map((org) => {
            const isExpanded = expandedOrg === org.id;
            const trialEnd = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
            const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400000)) : null;
            const isActive = org.is_active;
            const isLoading = actionLoading === org.id;

            return (
              <div key={org.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${!isActive ? 'opacity-70 border-red-200' : ''}`}>
                {/* Row */}
                <div
                  className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-teal-50' : 'bg-red-50'}`}>
                    <svg className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 truncate">{org.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[org.plan] || PLAN_COLORS.trial}`}>
                        {PLAN_LABELS[org.plan] || org.plan}
                      </span>
                      {!isActive && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">INACTIVE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                      <span>{org.member_count} member{org.member_count !== 1 ? 's' : ''}</span>
                      {trialEnd && org.plan === 'trial' && (
                        <span>Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left</span>
                      )}
                      <span>Created: {new Date(org.created_at).toLocaleDateString('en-GB')}</span>
                    </div>
                  </div>

                  <svg className={`w-5 h-5 text-slate-400 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4">
                    <div className="grid sm:grid-cols-2 gap-4 mb-4">
                      {/* Details */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Details</h4>
                        <div className="text-xs text-slate-600 space-y-1">
                          <p><span className="font-medium">ID:</span> <span className="font-mono">{org.id}</span></p>
                          <p><span className="font-medium">Slug:</span> {org.slug}</p>
                          <p><span className="font-medium">Plan:</span> {PLAN_LABELS[org.plan] || org.plan}</p>
                          <p><span className="font-medium">Active:</span> {isActive ? 'Yes' : 'No'}</p>
                          {org.stripe_customer_id && <p><span className="font-medium">Stripe Customer:</span> <span className="font-mono">{org.stripe_customer_id}</span></p>}
                          {org.stripe_subscription_id && <p><span className="font-medium">Stripe Sub:</span> <span className="font-mono">{org.stripe_subscription_id}</span></p>}
                          {trialEnd && <p><span className="font-medium">Trial Ends:</span> {trialEnd.toLocaleDateString('en-GB')} {trialEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>}
                          {org.invite_code && <p><span className="font-medium">Invite Code:</span> <span className="font-mono font-bold">{org.invite_code}</span></p>}
                        </div>
                      </div>

                      {/* Members */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Members</h4>
                        {membersLoading ? (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <div className="w-3 h-3 border-2 border-slate-300 border-t-teal-600 rounded-full animate-spin" /> Loading...
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {members.map((m) => (
                              <div key={m.id} className="flex items-center gap-2 text-xs bg-white rounded-lg p-2 border">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  m.role === 'owner' ? 'bg-yellow-100 text-yellow-700' :
                                  m.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  {(m.profile?.full_name || m.profile?.email || '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-800 truncate">{m.profile?.full_name || 'Unknown'}</p>
                                  <p className="text-slate-400 truncate">{m.profile?.email}</p>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium shrink-0">
                                  {m.role}
                                </span>
                              </div>
                            ))}
                            {members.length === 0 && <p className="text-xs text-slate-400">No members</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200">
                      {/* Plan dropdown */}
                      <select
                        className="text-xs border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                        value={org.plan || 'trial'}
                        onChange={(e) => handleChangePlan(org.id, e.target.value)}
                        disabled={isLoading}
                      >
                        <option value="trial">Trial</option>
                        <option value="starter">Starter</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      {/* Killswitch */}
                      {confirmKill === org.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-600 font-medium">{isActive ? 'Kill access?' : 'Restore?'}</span>
                          <button
                            onClick={() => handleToggleActive(org.id, !isActive)}
                            disabled={isLoading}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {isLoading ? '...' : 'Confirm'}
                          </button>
                          <button onClick={() => setConfirmKill(null)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-100">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmKill(org.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {isActive ? '⚡ Kill Access' : '✓ Restore Access'}
                        </button>
                      )}

                      {/* Delete */}
                      {confirmDelete === org.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-600 font-medium">Delete forever?</span>
                          <button
                            onClick={() => handleDeleteOrg(org.id)}
                            disabled={isLoading}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {isLoading ? '...' : 'Delete'}
                          </button>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-100">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(org.id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          🗑 Delete Org
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

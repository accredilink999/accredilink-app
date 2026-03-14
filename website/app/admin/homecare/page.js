'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomecareAdmin() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState(0);
  const [toast, setToast] = useState('');

  // Data
  const [enquiries, setEnquiries] = useState([]);
  const [reviews, setReviews] = useState(null);
  const [reviewScore, setReviewScore] = useState(null);
  const [connections, setConnections] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState({ enquiries: false, reviews: false, jobs: false, connections: false, score: false });
  const [error, setError] = useState('');

  // Reviews sub-tab
  const [reviewSubTab, setReviewSubTab] = useState('overview');
  const [reviewFilter, setReviewFilter] = useState('all');

  // Invite form
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Relationship types from API
  const [relationshipTypes, setRelationshipTypes] = useState([]);

  // Enquiry detail
  const [expandedEnquiry, setExpandedEnquiry] = useState(null);
  const [enquiryFilter, setEnquiryFilter] = useState('all');

  // Job form
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobType, setJobType] = useState('full-time');
  const [savingJob, setSavingJob] = useState(false);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function getToken() {
    return sessionStorage.getItem('admin_token');
  }

  async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  // Auth check
  useEffect(() => {
    try {
      const token = sessionStorage.getItem('admin_token');
      if (!token) { setChecking(false); return; }
      const payload = JSON.parse(atob(token));
      if ((payload.role === 'owner' || payload.role === 'manager') && payload.ts) {
        setIsLoggedIn(true);
      }
    } catch { /* invalid */ }
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn && !checking) router.push('/admin');
  }, [isLoggedIn, checking, router]);

  // Load data
  useEffect(() => {
    if (isLoggedIn) {
      loadEnquiries();
      loadReviews();
      loadJobs();
    }
  }, [isLoggedIn]);

  async function loadEnquiries() {
    setLoading(l => ({ ...l, enquiries: true }));
    try {
      const res = await apiFetch('/api/homecare?type=enquiries');
      const list = res.data?.data || res.data || [];
      setEnquiries(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Load enquiries:', err);
      setError('Failed to load enquiries: ' + err.message);
    }
    setLoading(l => ({ ...l, enquiries: false }));
  }

  async function loadReviews() {
    setLoading(l => ({ ...l, reviews: true, score: true, connections: true }));
    try {
      const [revRes, scoreRes, connRes] = await Promise.all([
        apiFetch('/api/homecare?type=reviews').catch(() => ({ data: null })),
        apiFetch('/api/homecare?type=review_score').catch(() => ({ data: null })),
        apiFetch('/api/homecare?type=review_connections').catch(() => ({ data: null })),
      ]);
      setReviews(revRes.data);
      setReviewScore(scoreRes.data);
      const connList = connRes.data?.data || connRes.data || [];
      const connArr = Array.isArray(connList) ? connList : [];
      // The connections endpoint returns relationship TYPE definitions (rc_id + rc_name)
      // Store these as relationship types for the invite form dropdown
      if (connArr.length > 0 && connArr[0]?.rc_name) {
        setRelationshipTypes(connArr);
        setConnections([]); // These aren't actual people connections
      } else {
        setConnections(connArr);
      }
    } catch (err) {
      console.error('Load reviews:', err);
    }
    setLoading(l => ({ ...l, reviews: false, score: false, connections: false }));
  }

  async function sendReviewInvite() {
    if (!inviteName || !inviteEmail) return;
    setSendingInvite(true);
    try {
      await apiFetch('/api/homecare', {
        method: 'POST',
        body: JSON.stringify({
          action: 'invite_review',
          name: inviteName,
          email: inviteEmail,
          relationship: inviteRelationship,
        }),
      });
      showToast('Review invitation sent to ' + inviteName);
      setInviteName('');
      setInviteEmail('');
      setInviteRelationship('');
      loadReviews(); // refresh connections
    } catch (err) {
      showToast('Error: ' + err.message);
    }
    setSendingInvite(false);
  }

  async function loadJobs() {
    setLoading(l => ({ ...l, jobs: true }));
    try {
      const res = await apiFetch('/api/homecare?type=jobs');
      const list = res.data?.data || res.data || [];
      setJobs(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Load jobs:', err);
    }
    setLoading(l => ({ ...l, jobs: false }));
  }

  function resetJobForm() {
    setJobTitle(''); setJobDescription(''); setJobLocation('');
    setJobSalary(''); setJobType('full-time'); setEditingJob(null);
  }

  async function saveJob() {
    setSavingJob(true);
    try {
      if (editingJob) {
        await apiFetch('/api/homecare', {
          method: 'PUT',
          body: JSON.stringify({
            jobid: editingJob.id || editingJob.jobid,
            title: jobTitle,
            description: jobDescription,
            location: jobLocation,
            salary: jobSalary,
            type: jobType,
          }),
        });
        showToast('Job updated');
      } else {
        await apiFetch('/api/homecare', {
          method: 'POST',
          body: JSON.stringify({
            action: 'post_job',
            title: jobTitle,
            description: jobDescription,
            location: jobLocation,
            salary: jobSalary,
            type: jobType,
          }),
        });
        showToast('Job posted');
      }
      setShowJobForm(false);
      resetJobForm();
      loadJobs();
    } catch (err) {
      showToast('Error: ' + err.message);
    }
    setSavingJob(false);
  }

  async function closeJob(jobid) {
    if (!confirm('Close this job listing?')) return;
    try {
      await apiFetch('/api/homecare', {
        method: 'POST',
        body: JSON.stringify({ action: 'close_job', jobid }),
      });
      showToast('Job closed');
      loadJobs();
    } catch (err) {
      showToast('Error: ' + err.message);
    }
  }

  function copyText(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied`);
    }).catch(() => showToast('Copy failed'));
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!isLoggedIn) return null;

  const tabs = ['Dashboard', 'Enquiries', 'Reviews', 'Jobs'];

  // Filtered enquiries
  const filteredEnquiries = enquiryFilter === 'all'
    ? enquiries
    : enquiries.filter(e => (e.category?.name || '').toLowerCase().includes(enquiryFilter.toLowerCase()));

  // Stats
  const totalEnquiries = enquiries.length;
  const overallScore = reviewScore?.score || reviewScore?.averageScore || reviews?.score || reviews?.averageScore || reviews?.rating || null;
  const activeJobs = jobs.filter(j => !j.closed && j.status !== 'closed').length;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <a href="/admin" className="text-slate-400 hover:text-white text-sm">&larr; Admin</a>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center">
              <span className="text-xl">🏠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Homecare.co.uk</h1>
              <p className="text-xs text-slate-400">Manage enquiries, reviews & job listings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-fade-in">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex gap-0">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === i
                  ? 'border-orange-500 text-orange-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
            <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">&times;</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* ===== TAB 0: DASHBOARD ===== */}
        {tab === 0 && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-slate-900">{loading.enquiries ? '...' : totalEnquiries}</p>
                <p className="text-sm text-slate-500">Enquiries</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-slate-900">
                  {loading.reviews ? '...' : overallScore ? `${overallScore}` : 'N/A'}
                </p>
                <p className="text-sm text-slate-500">Review Score</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-3xl font-bold text-slate-900">{loading.jobs ? '...' : activeJobs}</p>
                <p className="text-sm text-slate-500">Active Jobs</p>
              </div>
            </div>

            {/* Recent Enquiries */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">Recent Enquiries</h3>
                <button onClick={() => setTab(1)} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                  View all &rarr;
                </button>
              </div>
              {loading.enquiries ? (
                <div className="flex justify-center py-6"><div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full" /></div>
              ) : enquiries.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No enquiries yet. They will appear here when received via homecare.co.uk.</p>
              ) : (
                <div className="space-y-2">
                  {enquiries.slice(0, 5).map((enq, i) => (
                    <div key={enq.id || i} className="flex items-center justify-between border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{enq.firstName} {enq.surname}</p>
                        <p className="text-xs text-slate-500">{enq.category?.name || 'Enquiry'} &middot; {enq.date || 'N/A'}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium shrink-0">
                        {enq.category?.name || 'General'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { setTab(3); setShowJobForm(true); resetJobForm(); }}
                className="bg-white rounded-xl shadow-sm border p-5 text-left hover:shadow-md hover:border-orange-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-orange-700">Post a New Job</p>
                    <p className="text-xs text-slate-500">Recruit new staff via homecare.co.uk</p>
                  </div>
                </div>
              </button>
              <a
                href="https://www.homecare.co.uk/memberarea/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white rounded-xl shadow-sm border p-5 text-left hover:shadow-md hover:border-orange-200 transition-all group block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 group-hover:text-orange-700">Homecare.co.uk Control Panel</p>
                    <p className="text-xs text-slate-500">Open your profile &amp; settings</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        )}

        {/* ===== TAB 1: ENQUIRIES ===== */}
        {tab === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Enquiries</h2>
              <div className="flex items-center gap-2">
                <select
                  value={enquiryFilter}
                  onChange={(e) => setEnquiryFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Categories</option>
                  <option value="care">Care Enquiry</option>
                  <option value="general">General Enquiry</option>
                  <option value="brochure">Brochure Request</option>
                  <option value="job">Job Enquiry</option>
                  <option value="home visit">Home Visit</option>
                  <option value="video call">Video Call</option>
                </select>
                <button
                  onClick={loadEnquiries}
                  disabled={loading.enquiries}
                  className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {loading.enquiries ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {loading.enquiries ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full" /></div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-400">No enquiries found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEnquiries.map((enq, i) => {
                  const isExpanded = expandedEnquiry === (enq.id || i);
                  return (
                    <div key={enq.id || i} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                      <button
                        onClick={() => setExpandedEnquiry(isExpanded ? null : (enq.id || i))}
                        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-slate-900">
                              {enq.isAnonymised ? 'Anonymous' : `${enq.firstName || ''} ${enq.surname || ''}`}
                            </p>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                              {enq.category?.name || 'General'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {enq.date || 'N/A'} &middot; {enq.town || enq.postcode || 'No location'}
                          </p>
                        </div>
                        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-4 border-t border-slate-100 pt-3 space-y-3">
                          {enq.content && (
                            <div>
                              <label className="text-xs font-medium text-slate-500 block mb-1">Message</label>
                              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{enq.content}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            {enq.telephone && (
                              <div>
                                <label className="text-xs font-medium text-slate-500 block mb-1">Phone</label>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-slate-700">{enq.telephone}</p>
                                  <button onClick={() => copyText(enq.telephone, 'Phone')} className="text-xs text-orange-600 hover:text-orange-700">Copy</button>
                                </div>
                              </div>
                            )}
                            {(enq.from || enq.to) && (
                              <div>
                                <label className="text-xs font-medium text-slate-500 block mb-1">Email</label>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm text-slate-700 truncate">{enq.from || enq.to}</p>
                                  <button onClick={() => copyText(enq.from || enq.to, 'Email')} className="text-xs text-orange-600 hover:text-orange-700">Copy</button>
                                </div>
                              </div>
                            )}
                          </div>
                          {(enq.address1 || enq.town || enq.postcode) && (
                            <div>
                              <label className="text-xs font-medium text-slate-500 block mb-1">Address</label>
                              <p className="text-sm text-slate-700">
                                {[enq.address1, enq.address2, enq.address3, enq.town, enq.postcode].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2 pt-2">
                            {enq.telephone && (
                              <a href={`tel:${enq.telephone}`} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                                Call
                              </a>
                            )}
                            {(enq.from || enq.to) && (
                              <a href={`mailto:${enq.from || enq.to}`} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                                Email
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== TAB 2: REVIEWS ===== */}
        {tab === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Reviews</h2>
              <button
                onClick={loadReviews}
                disabled={loading.reviews}
                className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {loading.reviews ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Review Sub-tabs */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'all', label: 'All Reviews' },
                { key: 'invite', label: 'Request Review' },
                { key: 'connections', label: 'Connections' },
              ].map(st => (
                <button
                  key={st.key}
                  onClick={() => setReviewSubTab(st.key)}
                  className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                    reviewSubTab === st.key
                      ? 'bg-white text-orange-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {loading.reviews ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full" /></div>
            ) : (
              <>
                {/* ---- OVERVIEW ---- */}
                {reviewSubTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Score Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <svg key={star} className={`w-8 h-8 ${(overallScore || 0) >= star ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                      </div>
                      <p className="text-4xl font-bold text-slate-900 mb-1">
                        {overallScore || 'N/A'}
                        {overallScore && <span className="text-lg text-slate-400 font-normal">/5</span>}
                      </p>
                      <p className="text-sm text-slate-500">Overall Review Score on homecare.co.uk</p>
                    </div>

                    {/* Stats Grid */}
                    {(() => {
                      const reviewList = reviews?.reviews || reviews?.data || [];
                      const totalReviews = Array.isArray(reviewList) ? reviewList.length : 0;
                      const starCounts = [5, 4, 3, 2, 1].map(s => ({
                        star: s,
                        count: Array.isArray(reviewList) ? reviewList.filter(r => Math.round(r.score || r.rating || 0) === s).length : 0,
                      }));
                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900">{totalReviews}</p>
                            <p className="text-xs text-slate-500">Total Reviews</p>
                          </div>
                          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{starCounts.find(s => s.star === 5)?.count || 0}</p>
                            <p className="text-xs text-slate-500">5-Star Reviews</p>
                          </div>
                          <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{relationshipTypes.length || connections.length}</p>
                            <p className="text-xs text-slate-500">Relationship Types</p>
                          </div>
                          <div className="bg-white rounded-xl shadow-sm border p-4 text-center cursor-pointer hover:border-orange-300 transition-colors" onClick={() => setReviewSubTab('invite')}>
                            <p className="text-2xl font-bold text-orange-600">+</p>
                            <p className="text-xs text-slate-500">Request Review</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Star Breakdown */}
                    {(() => {
                      const reviewList = reviews?.reviews || reviews?.data || [];
                      if (!Array.isArray(reviewList) || reviewList.length === 0) return null;
                      const total = reviewList.length;
                      return (
                        <div className="bg-white rounded-xl shadow-sm border p-5">
                          <h3 className="text-sm font-semibold text-slate-800 mb-3">Rating Breakdown</h3>
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map(star => {
                              const count = reviewList.filter(r => Math.round(r.score || r.rating || 0) === star).length;
                              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                              return (
                                <div key={star} className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-slate-600 w-12">{star} star</span>
                                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${star >= 4 ? 'bg-amber-400' : star === 3 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 w-16 text-right">{count} ({pct}%)</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Recent Reviews Preview */}
                    {(() => {
                      const reviewList = reviews?.reviews || reviews?.data || [];
                      if (!Array.isArray(reviewList) || reviewList.length === 0) return (
                        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                          <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          <p className="text-sm text-slate-400">No reviews yet. Send invitations to start collecting feedback.</p>
                          <button onClick={() => setReviewSubTab('invite')} className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                            Request a Review
                          </button>
                        </div>
                      );
                      return (
                        <div className="bg-white rounded-xl shadow-sm border p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-slate-800">Recent Reviews</h3>
                            <button onClick={() => setReviewSubTab('all')} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                              View all &rarr;
                            </button>
                          </div>
                          <div className="space-y-3">
                            {reviewList.slice(0, 3).map((review, i) => (
                              <div key={review.id || i} className="border border-slate-100 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <svg key={star} className={`w-3.5 h-3.5 ${(review.score || review.rating || 0) >= star ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <span className="text-[10px] text-slate-400">{review.date || ''}</span>
                                </div>
                                {review.title && <p className="text-xs font-semibold text-slate-900 mb-0.5">{review.title}</p>}
                                <p className="text-xs text-slate-600 line-clamp-2">{review.content || review.comment || review.text || ''}</p>
                                {review.author && <p className="text-[10px] text-slate-400 mt-1">— {review.author}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quick link */}
                    <div className="text-center">
                      <a
                        href="https://www.homecare.co.uk/memberarea/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Open homecare.co.uk Control Panel &rarr;
                      </a>
                    </div>
                  </div>
                )}

                {/* ---- ALL REVIEWS ---- */}
                {reviewSubTab === 'all' && (
                  <div className="space-y-4">
                    {/* Filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Filter:</span>
                      {['all', '5', '4', '3', '2', '1'].map(f => (
                        <button
                          key={f}
                          onClick={() => setReviewFilter(f)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            reviewFilter === f
                              ? 'bg-orange-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {f === 'all' ? 'All' : `${f} Star`}
                        </button>
                      ))}
                    </div>

                    {(() => {
                      const reviewList = reviews?.reviews || reviews?.data || [];
                      if (!Array.isArray(reviewList) || reviewList.length === 0) return (
                        <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                          <p className="text-sm text-slate-400">No reviews available.</p>
                        </div>
                      );
                      const filtered = reviewFilter === 'all'
                        ? reviewList
                        : reviewList.filter(r => Math.round(r.score || r.rating || 0) === parseInt(reviewFilter));
                      if (filtered.length === 0) return (
                        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                          <p className="text-sm text-slate-400">No {reviewFilter}-star reviews found.</p>
                        </div>
                      );
                      return (
                        <div className="space-y-3">
                          <p className="text-xs text-slate-500">{filtered.length} review{filtered.length !== 1 ? 's' : ''}</p>
                          {filtered.map((review, i) => (
                            <div key={review.id || i} className="bg-white rounded-xl shadow-sm border p-5">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map(star => (
                                      <svg key={star} className={`w-4 h-4 ${(review.score || review.rating || 0) >= star ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                      </svg>
                                    ))}
                                  </div>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                    (review.score || review.rating || 0) >= 4 ? 'bg-green-100 text-green-700' :
                                    (review.score || review.rating || 0) >= 3 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {review.score || review.rating || 0}/5
                                  </span>
                                </div>
                                <span className="text-xs text-slate-400">{review.date || ''}</span>
                              </div>
                              {review.title && <p className="text-sm font-semibold text-slate-900 mb-1">{review.title}</p>}
                              <p className="text-sm text-slate-600">{review.content || review.comment || review.text || ''}</p>
                              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                                {review.author && <p className="text-xs text-slate-400">— {review.author}</p>}
                                {review.relationship && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{review.relationship}</span>}
                              </div>
                              {review.reply && (
                                <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg p-3">
                                  <p className="text-[10px] font-semibold text-orange-700 mb-1">Your Response</p>
                                  <p className="text-xs text-slate-700">{review.reply}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ---- REQUEST REVIEW ---- */}
                {reviewSubTab === 'invite' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                      <h3 className="text-sm font-semibold text-slate-800 mb-1">Send Review Invitation</h3>
                      <p className="text-xs text-slate-500 mb-4">
                        Invite a client, family member, or professional to leave a review on your homecare.co.uk profile.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Full Name *</label>
                          <input
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g. Jane Smith"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Email Address *</label>
                          <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="e.g. jane.smith@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Relationship to Service User</label>
                          <select
                            value={inviteRelationship}
                            onChange={(e) => setInviteRelationship(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="">Select...</option>
                            {relationshipTypes.length > 0 ? (
                              relationshipTypes.map(rt => (
                                <option key={rt.rc_id} value={rt.rc_id}>
                                  {rt.rc_name}
                                </option>
                              ))
                            ) : (
                              <>
                                <option value="Service User">Service User</option>
                                <option value="Family Member">Family Member</option>
                                <option value="Friend">Friend</option>
                                <option value="Professional">Professional (e.g. Social Worker)</option>
                                <option value="Other">Other</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={() => { setInviteName(''); setInviteEmail(''); setInviteRelationship(''); }}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={sendReviewInvite}
                            disabled={!inviteName || !inviteEmail || sendingInvite}
                            className="px-6 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingInvite ? 'Sending...' : 'Send Invitation'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                      <h4 className="text-xs font-semibold text-amber-800 mb-2">Tips for Getting Great Reviews</h4>
                      <ul className="text-xs text-amber-700 space-y-1.5">
                        <li className="flex items-start gap-2">
                          <span className="shrink-0 mt-0.5">&#8226;</span>
                          <span>Send invitations shortly after a positive interaction or milestone</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="shrink-0 mt-0.5">&#8226;</span>
                          <span>Family members often provide the most detailed feedback</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="shrink-0 mt-0.5">&#8226;</span>
                          <span>Professional reviews from social workers or GPs add credibility</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="shrink-0 mt-0.5">&#8226;</span>
                          <span>Responding to all reviews (positive and negative) shows engagement</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* ---- CONNECTIONS / RELATIONSHIP TYPES ---- */}
                {reviewSubTab === 'connections' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">Relationship Types</h3>
                        <p className="text-xs text-slate-500">Available relationship categories for review invitations</p>
                      </div>
                      <button
                        onClick={() => setReviewSubTab('invite')}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-medium hover:bg-orange-700 transition-colors"
                      >
                        + Invite Reviewer
                      </button>
                    </div>

                    {loading.connections ? (
                      <div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full" /></div>
                    ) : relationshipTypes.length > 0 ? (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                          These are the {relationshipTypes.length} relationship categories available on homecare.co.uk. When sending a review invitation, select the appropriate relationship type.
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                            {[0, 1].map(col => (
                              <div key={col} className="divide-y divide-slate-50">
                                {relationshipTypes
                                  .slice(col * Math.ceil(relationshipTypes.length / 2), (col + 1) * Math.ceil(relationshipTypes.length / 2))
                                  .map(rt => (
                                    <div key={rt.rc_id} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                      <span className="text-sm text-slate-700">{rt.rc_name}</span>
                                      <span className="text-[10px] text-slate-400 font-mono">ID: {rt.rc_id}</span>
                                    </div>
                                  ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : connections.length > 0 ? (
                      <div className="space-y-2">
                        {connections.map((conn, i) => (
                          <div key={conn.id || i} className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                                <span className="text-sm font-bold text-orange-600">
                                  {(conn.name || conn.firstName || '?')[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-900">{conn.name || `${conn.firstName || ''} ${conn.surname || ''}`.trim() || 'Unknown'}</p>
                                <p className="text-xs text-slate-500">{conn.email || ''} {conn.relationship ? `· ${conn.relationship}` : ''}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {conn.hasReviewed || conn.reviewed ? (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Reviewed</span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Pending</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                        <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm text-slate-400 mb-3">No data available.</p>
                        <button onClick={() => setReviewSubTab('invite')} className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                          Send First Invitation
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== TAB 3: JOBS ===== */}
        {tab === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Job Listings</h2>
              <div className="flex gap-2">
                <button
                  onClick={loadJobs}
                  disabled={loading.jobs}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {loading.jobs ? 'Loading...' : 'Refresh'}
                </button>
                <button
                  onClick={() => { resetJobForm(); setShowJobForm(true); }}
                  className="px-4 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                >
                  + Post New Job
                </button>
              </div>
            </div>

            {/* Job Form Modal */}
            {showJobForm && (
              <div className="bg-white rounded-xl shadow-sm border p-5">
                <h3 className="text-sm font-semibold text-slate-800 mb-4">
                  {editingJob ? 'Edit Job' : 'Post New Job'}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Job Title *</label>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="e.g. Care Worker - Denbigh"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Description *</label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Describe the role, responsibilities, requirements..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Location</label>
                      <input
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g. Denbigh, North Wales"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Salary/Rate</label>
                      <input
                        value={jobSalary}
                        onChange={(e) => setJobSalary(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g. £12-£14/hr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Job Type</label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="full-time">Full Time</option>
                        <option value="part-time">Part Time</option>
                        <option value="flexible">Flexible</option>
                        <option value="temporary">Temporary</option>
                        <option value="contract">Contract</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => { setShowJobForm(false); resetJobForm(); }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveJob}
                      disabled={!jobTitle || !jobDescription || savingJob}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingJob ? 'Saving...' : editingJob ? 'Update Job' : 'Post Job'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Job List */}
            {loading.jobs ? (
              <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full" /></div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-slate-400">No job listings. Click &quot;Post New Job&quot; to create one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job, i) => {
                  const isClosed = job.closed || job.status === 'closed';
                  return (
                    <div key={job.id || job.jobid || i} className={`bg-white rounded-xl shadow-sm border p-5 ${isClosed ? 'opacity-60' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold text-slate-900">{job.title || 'Untitled Job'}</h4>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                              isClosed ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'
                            }`}>
                              {isClosed ? 'Closed' : 'Active'}
                            </span>
                          </div>
                          {job.location && <p className="text-xs text-slate-500 mb-1">{job.location}</p>}
                          {job.salary && <p className="text-xs text-slate-500 mb-1">{job.salary}</p>}
                          {job.description && <p className="text-sm text-slate-600 line-clamp-2 mt-1">{job.description}</p>}
                        </div>
                        {!isClosed && (
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setEditingJob(job);
                                setJobTitle(job.title || '');
                                setJobDescription(job.description || '');
                                setJobLocation(job.location || '');
                                setJobSalary(job.salary || '');
                                setJobType(job.type || 'full-time');
                                setShowJobForm(true);
                              }}
                              className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => closeJob(job.id || job.jobid)}
                              className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              Close
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

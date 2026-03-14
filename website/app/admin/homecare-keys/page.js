'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomecareApiKeys() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('keys');

  // API Key
  const [apiKey, setApiKey] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  // Connection status
  const [status, setStatus] = useState({
    enquiry: { connected: false, loading: true, count: null, error: null },
    reviews: { connected: false, loading: true, count: null, error: null },
    jobs: { connected: false, loading: true, count: null, error: null },
  });

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState('');

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

  // Test connections on load
  useEffect(() => {
    if (isLoggedIn) {
      testAllConnections();
      // Set webhook URL based on current origin
      setWebhookUrl(`${window.location.origin}/api/homecare/webhook`);
    }
  }, [isLoggedIn]);

  async function testConnection(type) {
    setStatus(s => ({ ...s, [type]: { ...s[type], loading: true, error: null } }));
    try {
      const apiType = type === 'enquiry' ? 'enquiries' : type;
      const res = await apiFetch(`/api/homecare?type=${apiType}`);
      const data = res.data;
      let count = null;
      if (Array.isArray(data)) count = data.length;
      else if (data?.data && Array.isArray(data.data)) count = data.data.length;
      else if (data?.total) count = data.total;
      setStatus(s => ({ ...s, [type]: { connected: true, loading: false, count, error: null } }));
    } catch (err) {
      setStatus(s => ({ ...s, [type]: { connected: false, loading: false, count: null, error: err.message } }));
    }
  }

  async function testAllConnections() {
    await Promise.all([
      testConnection('enquiry'),
      testConnection('reviews'),
      testConnection('jobs'),
    ]);
  }

  async function saveApiKey() {
    if (!newApiKey.trim()) return;
    setSavingKey(true);
    try {
      // Save to Vercel env var via API
      const res = await fetch('/api/homecare/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ action: 'update_key', key: newApiKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setApiKey(newApiKey.trim());
        setNewApiKey('');
        showToast('API key updated. Redeployment may be required for changes to take effect.');
        // Re-test connections
        setTimeout(() => testAllConnections(), 2000);
      } else {
        showToast(data.error || 'Failed to save API key');
      }
    } catch (err) {
      showToast('Error: ' + err.message);
    }
    setSavingKey(false);
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} copied`)).catch(() => showToast('Copy failed'));
  }

  function maskKey(key) {
    if (!key || key.length < 8) return key || '';
    return key.slice(0, 4) + '****' + key.slice(-4);
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!isLoggedIn) return null;

  const tabs = ['API Keys', 'Enquiry API', 'Jobs API', 'Webhooks'];

  const StatusDot = ({ status: s }) => (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${
      s.loading ? 'bg-slate-300 animate-pulse' :
      s.connected ? 'bg-green-500' : 'bg-red-500'
    }`} />
  );

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <a href="/admin" className="text-slate-400 hover:text-white text-sm">&larr; Admin</a>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Homecare.co.uk API Keys</h1>
              <p className="text-xs text-slate-400">Manage API credentials &amp; integrations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {toast}
        </div>
      )}

      {/* Connection Status Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="text-xs font-medium text-slate-500">API Status:</span>
          {[
            { key: 'enquiry', label: 'Enquiries' },
            { key: 'reviews', label: 'Reviews' },
            { key: 'jobs', label: 'Jobs' },
          ].map(api => (
            <div key={api.key} className="flex items-center gap-1.5">
              <StatusDot status={status[api.key]} />
              <span className="text-xs text-slate-600">{api.label}</span>
              {status[api.key].count !== null && (
                <span className="text-[10px] text-slate-400">({status[api.key].count})</span>
              )}
            </div>
          ))}
          <button
            onClick={testAllConnections}
            className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Test All
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex gap-0">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(t.toLowerCase().replace(/\s+/g, '_'))}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.toLowerCase().replace(/\s+/g, '_')
                  ? 'border-blue-500 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* ===== API KEYS TAB ===== */}
        {tab === 'api_keys' && (
          <div className="space-y-4">
            {/* Current Key */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Current API Key</h3>
              <p className="text-xs text-slate-500 mb-4">
                Your homecare.co.uk API key is used to authenticate all API requests. Find your key in the
                <a href="https://www.homecare.co.uk/memberarea/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 ml-1">
                  homecare.co.uk Control Panel &rarr;
                </a>
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">HOMECARE_API_KEY</p>
                    <p className="text-sm font-mono text-slate-800">
                      {apiKey ? (showKey ? apiKey : maskKey(apiKey)) : (
                        <span className="text-slate-400 italic">Set via environment variable</span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {apiKey && (
                      <>
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          {showKey ? 'Hide' : 'Show'}
                        </button>
                        <button
                          onClick={() => copyToClipboard(apiKey, 'API Key')}
                          className="text-xs px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Copy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Update Key */}
              <div className="border-t border-slate-200 pt-4">
                <label className="block text-xs font-medium text-slate-600 mb-2">Update API Key</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newApiKey}
                    onChange={(e) => setNewApiKey(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Paste your homecare.co.uk API key"
                  />
                  <button
                    onClick={saveApiKey}
                    disabled={!newApiKey.trim() || savingKey}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingKey ? 'Saving...' : 'Save Key'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Note: API key is stored as an environment variable. A redeployment may be needed for changes to fully apply.
                </p>
              </div>
            </div>

            {/* API Endpoints Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-3">Available API Endpoints</h3>
              <div className="space-y-3">
                {[
                  { method: 'GET', path: '/reviews/', desc: 'List all reviews', color: 'bg-green-100 text-green-700' },
                  { method: 'GET', path: '/reviews/scores', desc: 'Get review score', color: 'bg-green-100 text-green-700' },
                  { method: 'GET', path: '/reviews/connections', desc: 'List reviewer connections', color: 'bg-green-100 text-green-700' },
                  { method: 'GET', path: '/enquiry/', desc: 'List enquiries', color: 'bg-green-100 text-green-700' },
                  { method: 'GET', path: '/jobs/', desc: 'List job listings', color: 'bg-green-100 text-green-700' },
                  { method: 'POST', path: '/jobs/', desc: 'Create a job', color: 'bg-blue-100 text-blue-700' },
                  { method: 'PUT', path: '/jobs/{id}', desc: 'Update a job', color: 'bg-amber-100 text-amber-700' },
                  { method: 'POST', path: '/reviews/connections', desc: 'Send review invitation', color: 'bg-blue-100 text-blue-700' },
                ].map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${ep.color}`}>{ep.method}</span>
                    <code className="text-xs font-mono text-slate-700 flex-1">{ep.path}</code>
                    <span className="text-xs text-slate-500">{ep.desc}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-4">
                Base URL: https://api.homecare.co.uk/index.cfm
              </p>
            </div>
          </div>
        )}

        {/* ===== ENQUIRY API TAB ===== */}
        {tab === 'enquiry_api' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <StatusDot status={status.enquiry} />
                <h3 className="text-sm font-semibold text-slate-800">Enquiry API</h3>
                {status.enquiry.connected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Connected</span>
                )}
                {status.enquiry.error && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Error</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">
                The Enquiry API pulls new care enquiries submitted through your homecare.co.uk profile page. These appear in the Homecare admin section under &ldquo;Enquiries&rdquo;.
              </p>

              {/* Status detail */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Endpoint</span>
                  <code className="text-xs font-mono text-slate-700">GET /enquiry/?API_key=***</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Status</span>
                  <span className={`text-xs font-medium ${status.enquiry.connected ? 'text-green-600' : 'text-red-600'}`}>
                    {status.enquiry.loading ? 'Testing...' : status.enquiry.connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                {status.enquiry.count !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Enquiries Found</span>
                    <span className="text-xs font-medium text-slate-800">{status.enquiry.count}</span>
                  </div>
                )}
                {status.enquiry.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">{status.enquiry.error}</div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => testConnection('enquiry')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Test Connection
                </button>
                <a
                  href="https://support.homecare.co.uk/docs/enquiry-api-overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  API Docs
                </a>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 className="text-xs font-semibold text-blue-800 mb-2">How Enquiries Work</h4>
              <ul className="text-xs text-blue-700 space-y-1.5">
                <li>1. A potential client visits your homecare.co.uk profile</li>
                <li>2. They submit an enquiry (care request, brochure, home visit, etc.)</li>
                <li>3. The API pulls these enquiries into your CareCallAI admin panel</li>
                <li>4. You can view details, call, or email the enquirer directly</li>
              </ul>
            </div>
          </div>
        )}

        {/* ===== JOBS API TAB ===== */}
        {tab === 'jobs_api' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <StatusDot status={status.jobs} />
                <h3 className="text-sm font-semibold text-slate-800">Jobs API</h3>
                {status.jobs.connected && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Connected</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-4">
                The Jobs API allows you to post, edit, and close job listings on homecare.co.uk directly from your admin panel.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">List Jobs</span>
                  <code className="text-xs font-mono text-slate-700">GET /jobs/?API_key=***</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Post Job</span>
                  <code className="text-xs font-mono text-slate-700">POST /jobs/</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Edit Job</span>
                  <code className="text-xs font-mono text-slate-700">PUT /jobs/{'{id}'}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Close Job</span>
                  <code className="text-xs font-mono text-slate-700">POST /jobs/{'{id}'}/actions/close/</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600">Status</span>
                  <span className={`text-xs font-medium ${status.jobs.connected ? 'text-green-600' : 'text-red-600'}`}>
                    {status.jobs.loading ? 'Testing...' : status.jobs.connected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                {status.jobs.count !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Active Jobs</span>
                    <span className="text-xs font-medium text-slate-800">{status.jobs.count}</span>
                  </div>
                )}
                {status.jobs.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">{status.jobs.error}</div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => testConnection('jobs')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Test Connection
                </button>
                <a href="/admin/homecare" className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                  Manage Jobs
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ===== WEBHOOKS TAB ===== */}
        {tab === 'webhooks' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-sm font-semibold text-slate-800 mb-1">Webhook Configuration</h3>
              <p className="text-xs text-slate-500 mb-4">
                Webhooks allow homecare.co.uk to notify CareCallAI instantly when a new enquiry arrives, so you get email alerts in real-time.
              </p>

              {/* Webhook URL */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4">
                <label className="text-xs font-medium text-slate-600 block mb-2">Your Webhook URL</label>
                <div className="flex gap-2">
                  <code className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono text-slate-800 overflow-x-auto">
                    {webhookUrl}
                  </code>
                  <button
                    onClick={() => copyToClipboard(webhookUrl, 'Webhook URL')}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Paste this URL into your homecare.co.uk webhook settings.
                </p>
              </div>

              {/* Setup Instructions */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-semibold text-slate-700 mb-3">Setup Instructions</h4>
                <div className="space-y-3">
                  {[
                    { step: 1, text: 'Log in to your homecare.co.uk Member Area' },
                    { step: 2, text: 'Navigate to API & Integrations settings' },
                    { step: 3, text: 'Find the Webhooks section' },
                    { step: 4, text: 'Paste the webhook URL shown above' },
                    { step: 5, text: 'Select which events to forward (enquiries recommended)' },
                    { step: 6, text: 'Save and test the webhook' },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-700">{s.step}</span>
                      </div>
                      <p className="text-sm text-slate-600 pt-0.5">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* What happens */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h4 className="text-xs font-semibold text-green-800 mb-2">What Happens When a Webhook Fires</h4>
              <ul className="text-xs text-green-700 space-y-1.5">
                <li>1. A new enquiry is submitted on homecare.co.uk</li>
                <li>2. Homecare.co.uk sends the enquiry data to your webhook URL</li>
                <li>3. CareCallAI receives it and sends an email alert to info@accredilinkcare.co.uk</li>
                <li>4. The email contains the enquirer&apos;s name, phone, email, and message</li>
                <li>5. You can respond directly via the admin panel or by calling/emailing</li>
              </ul>
            </div>

            {/* Test */}
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">Test Webhook</h4>
              <p className="text-xs text-slate-500 mb-3">Send a test payload to verify the webhook is working correctly.</p>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(webhookUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        firstName: 'Test',
                        surname: 'Webhook',
                        category: { name: 'Test Enquiry' },
                        telephone: '07700 000000',
                        from: 'test@example.com',
                        content: 'This is a test webhook from the API Keys admin page.',
                        date: new Date().toISOString().split('T')[0],
                      }),
                    });
                    if (res.ok) {
                      showToast('Test webhook sent successfully! Check your email.');
                    } else {
                      showToast('Webhook returned status ' + res.status);
                    }
                  } catch (err) {
                    showToast('Error: ' + err.message);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                Send Test Webhook
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

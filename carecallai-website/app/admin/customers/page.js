'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const getToken = () => typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;

async function apiFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

// Welcome email HTML template
const WELCOME_EMAIL_HTML = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

<!-- Header -->
<tr><td style="background:#0d9488;padding:30px 40px;text-align:center;">
  <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Welcome to CareCallAI</h1>
  <p style="margin:8px 0 0;color:#ccfbf1;font-size:14px;">Your all-in-one care management platform</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:40px;">
  <p style="margin:0 0 20px;color:#1e293b;font-size:16px;line-height:1.6;">
    Hi <strong>{{CUSTOMER_NAME}}</strong>,
  </p>
  <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
    Thank you for signing up to CareCallAI! We're thrilled to have you on board and we want to make sure you get the most out of the platform from day one.
  </p>
  <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
    We know moving to a new system can feel overwhelming, so we'd love to help you get set up. Here's how we can support you:
  </p>

  <!-- Support Options -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
    <!-- Email -->
    <tr><td style="padding:12px 16px;background:#f0fdfa;border-radius:8px;margin-bottom:8px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;font-size:24px;">&#9993;</td>
        <td>
          <p style="margin:0;color:#0d9488;font-size:14px;font-weight:700;">Email Support</p>
          <p style="margin:4px 0 0;color:#475569;font-size:13px;line-height:1.5;">Drop us an email anytime at <a href="mailto:support@carecallai.co.uk" style="color:#0d9488;text-decoration:underline;">support@carecallai.co.uk</a> — we typically reply within a few hours.</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="height:10px;"></td></tr>

    <!-- Online Meeting -->
    <tr><td style="padding:12px 16px;background:#f0fdfa;border-radius:8px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;font-size:24px;">&#128187;</td>
        <td>
          <p style="margin:0;color:#0d9488;font-size:14px;font-weight:700;">Free Onboarding Call</p>
          <p style="margin:4px 0 0;color:#475569;font-size:13px;line-height:1.5;">Book a free 30-minute video call and we'll walk you through the system, set up your team, and answer any questions. Just reply to this email to arrange a time.</p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="height:10px;"></td></tr>

    <!-- WhatsApp -->
    <tr><td style="padding:12px 16px;background:#f0fdfa;border-radius:8px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:14px;vertical-align:top;font-size:24px;">&#128172;</td>
        <td>
          <p style="margin:0;color:#0d9488;font-size:14px;font-weight:700;">WhatsApp</p>
          <p style="margin:4px 0 0;color:#475569;font-size:13px;line-height:1.5;">Need a quick answer? Message us on WhatsApp at <a href="https://wa.me/447762533406?text=Hi%2C%20I%27ve%20just%20signed%20up%20for%20CareCallAI%20and%20would%20like%20some%20help%20getting%20set%20up" style="color:#0d9488;text-decoration:underline;">07762 533 406</a> for fast, friendly support.</p>
        </td>
      </tr></table>
    </td></tr>
  </table>

  <!-- CTA Button -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 30px;">
    <tr><td align="center">
      <a href="https://carecallai.co.uk/demo" style="display:inline-block;background:#0d9488;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;">
        Book Your Free Onboarding Call
      </a>
    </td></tr>
  </table>

  <!-- Quick Start Tips -->
  <p style="margin:0 0 14px;color:#1e293b;font-size:15px;font-weight:700;">Quick Start Tips:</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">
      &#10003;&nbsp;&nbsp;Add your staff members and set up their roles
    </td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">
      &#10003;&nbsp;&nbsp;Add your service users with their care plans
    </td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">
      &#10003;&nbsp;&nbsp;Create your first rota and deploy shift patterns
    </td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">
      &#10003;&nbsp;&nbsp;Download the mobile app for your care team
    </td></tr>
    <tr><td style="padding:6px 0;color:#475569;font-size:14px;line-height:1.5;">
      &#10003;&nbsp;&nbsp;Set up compliance tracking for CIW or CQC
    </td></tr>
  </table>

  <p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.7;">
    We're here to help every step of the way. Don't hesitate to reach out — no question is too small.
  </p>
  <p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">
    Warm regards,<br/>
    <strong style="color:#1e293b;">The CareCallAI Team</strong>
  </p>
</td></tr>

<!-- Footer -->
<tr><td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
  <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-align:center;">
    CareCallAI — The Hummingbird, 27-29 High St, Denbigh LL16 3HY
  </p>
  <p style="margin:0;color:#94a3b8;font-size:11px;text-align:center;">
    <a href="https://carecallai.co.uk" style="color:#0d9488;text-decoration:none;">carecallai.co.uk</a>&nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="mailto:support@carecallai.co.uk" style="color:#0d9488;text-decoration:none;">support@carecallai.co.uk</a>&nbsp;&nbsp;|&nbsp;&nbsp;
    <a href="https://wa.me/447762533406?text=Hi%2C%20I%27ve%20just%20signed%20up%20for%20CareCallAI%20and%20would%20like%20some%20help%20getting%20set%20up" style="color:#0d9488;text-decoration:none;">WhatsApp</a>
  </p>
  <p style="margin:8px 0 0;color:#94a3b8;font-size:11px;text-align:center;">
    <a href="{{UNSUBSCRIBE_LINK}}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

const WELCOME_EMAIL_SUBJECT = 'Welcome to CareCallAI — Let\'s Get You Set Up!';

const NEWSLETTER_TEMPLATES = {
  welcome: {
    name: 'Welcome & Onboarding',
    subject: WELCOME_EMAIL_SUBJECT,
    html: WELCOME_EMAIL_HTML,
    description: 'Send to new signups offering setup assistance via email, video call, or WhatsApp.',
  },
  feature_update: {
    name: 'Feature Update',
    subject: 'New in CareCallAI: {{FEATURE_NAME}}',
    html: null, // Generate via AI
    description: 'Notify customers about new features and improvements.',
  },
  tips: {
    name: 'Tips & Best Practices',
    subject: 'CareCallAI Tips: Get More from Your Platform',
    html: null,
    description: 'Share tips to help customers use CareCallAI more effectively.',
  },
};

const TABS = ['Customers', 'Send Email', 'Email Templates'];

export default function CustomersPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // Customer list
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', organisation: '', notes: '' });
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Send email
  const [selectedTemplate, setSelectedTemplate] = useState('welcome');
  const [sendTo, setSendTo] = useState('single');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendResult, setSendResult] = useState('');

  // Templates
  const [templatePreview, setTemplatePreview] = useState('welcome');
  const [copyMsg, setCopyMsg] = useState('');

  // Global
  const [error, setError] = useState('');

  // Auth check
  useEffect(() => {
    try {
      const token = sessionStorage.getItem('admin_token');
      if (!token) { router.push('/admin'); return; }
      const payload = JSON.parse(atob(token));
      if (payload.role !== 'platform_admin' || Date.now() - payload.ts > 86400000) {
        router.push('/admin'); return;
      }
      setIsLoggedIn(true);
    } catch { router.push('/admin'); }
    setChecking(false);
  }, [router]);

  // Load customers (uses email_contacts with tag 'customer')
  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (searchQuery) params.set('search', searchQuery);
      // We use the campaigns contacts API but filter by customer tag
      const data = await apiFetch(`/api/campaigns/contacts?${params.toString()}`);
      const allContacts = data.contacts || [];
      // Filter to only show customers (tagged as 'customer')
      const customerContacts = allContacts.filter(c =>
        c.tags && c.tags.includes('customer')
      );
      setCustomers(customerContacts);
    } catch (err) {
      setError('Failed to load customers: ' + err.message);
    }
    setCustomersLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    if (isLoggedIn && activeTab === 0) loadCustomers();
  }, [isLoggedIn, activeTab, loadCustomers]);

  // Add customer
  const handleAddCustomer = async () => {
    if (!addForm.email) return;
    setAddingCustomer(true);
    setError('');
    try {
      await apiFetch('/api/campaigns/contacts', {
        method: 'POST',
        body: JSON.stringify({
          email: addForm.email,
          name: addForm.name || null,
          organisation: addForm.organisation || null,
          tags: ['customer'],
          data_source: 'manual',
          metadata: addForm.notes ? { notes: addForm.notes } : {},
        }),
      });
      setAddForm({ name: '', email: '', organisation: '', notes: '' });
      setShowAddForm(false);
      loadCustomers();
    } catch (err) {
      setError('Failed to add customer: ' + err.message);
    }
    setAddingCustomer(false);
  };

  // Delete customer
  const handleDeleteCustomer = async (id) => {
    try {
      await apiFetch('/api/campaigns/contacts', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setConfirmDelete(null);
      loadCustomers();
    } catch (err) {
      setError('Failed to delete: ' + err.message);
    }
  };

  // Send email to customer
  const handleSendEmail = async () => {
    setSendingEmail(true);
    setSendResult('');
    setError('');

    try {
      const template = NEWSLETTER_TEMPLATES[selectedTemplate];
      if (!template || !template.html) {
        setError('This template has no HTML content yet. Use the Welcome template or create content in Email Campaigns.');
        setSendingEmail(false);
        return;
      }

      if (sendTo === 'single' && !selectedCustomerId) {
        setError('Please select a customer to send to.');
        setSendingEmail(false);
        return;
      }

      const recipients = sendTo === 'all'
        ? customers
        : customers.filter(c => c.id === selectedCustomerId);

      if (recipients.length === 0) {
        setError('No recipients found.');
        setSendingEmail(false);
        return;
      }

      let sentCount = 0;
      for (const customer of recipients) {
        const html = template.html
          .replace(/\{\{CUSTOMER_NAME\}\}/g, customer.name || 'there')
          .replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, '#');

        try {
          await apiFetch('/api/campaigns/send', {
            method: 'POST',
            body: JSON.stringify({
              campaign_id: 'direct_send',
              test_email: customer.email,
              subject: customSubject || template.subject,
              html,
            }),
          });
          sentCount++;
        } catch (err) {
          console.error(`Failed to send to ${customer.email}:`, err);
        }
      }

      setSendResult(`Successfully sent to ${sentCount} of ${recipients.length} customer(s)`);
    } catch (err) {
      setError('Send failed: ' + err.message);
    }
    setSendingEmail(false);
  };

  // Copy HTML
  const copyHtml = (html) => {
    navigator.clipboard.writeText(html).then(() => {
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(''), 2000);
    });
  };

  if (checking) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-slate-400 hover:text-white text-sm">&larr; Admin</a>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center text-xl">
                👥
              </div>
              <div>
                <h1 className="text-xl font-bold">Customer Management</h1>
                <p className="text-slate-400 text-sm">Manage signed-up customers & send newsletters</p>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500">{customers.length} customer{customers.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto">
          {TABS.map((tab, idx) => (
            <button key={tab} onClick={() => setActiveTab(idx)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === idx ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>{tab}</button>
          ))}
        </div>
      </div>

      {/* Error */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-3 text-lg">&times;</button>
          </div>
        )}

        {/* Tab 0: Customers */}
        {activeTab === 0 && (
          <div>
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers..."
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 w-64"
              />
              <button onClick={() => loadCustomers()} className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                Refresh
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                + Add Customer
              </button>
            </div>

            {/* Add form */}
            {showAddForm && (
              <div className="bg-white rounded-xl shadow-sm border p-5 mb-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-3">Add New Customer</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Name *</label>
                    <input type="text" value={addForm.name} onChange={(e) => setAddForm(p => ({...p, name: e.target.value}))}
                      placeholder="e.g. Jane Smith" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Email *</label>
                    <input type="email" value={addForm.email} onChange={(e) => setAddForm(p => ({...p, email: e.target.value}))}
                      placeholder="e.g. jane@careagency.co.uk" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Organisation</label>
                    <input type="text" value={addForm.organisation} onChange={(e) => setAddForm(p => ({...p, organisation: e.target.value}))}
                      placeholder="e.g. Sunrise Care Ltd" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Notes</label>
                    <input type="text" value={addForm.notes} onChange={(e) => setAddForm(p => ({...p, notes: e.target.value}))}
                      placeholder="e.g. Signed up 5 March, dom care Wales" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleAddCustomer} disabled={addingCustomer || !addForm.email}
                    className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors">
                    {addingCustomer ? 'Adding...' : 'Add Customer'}
                  </button>
                  <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Loading */}
            {customersLoading && (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <div className="w-6 h-6 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-500">Loading customers...</p>
              </div>
            )}

            {/* Customer list */}
            {!customersLoading && customers.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
                <p className="text-3xl mb-2">👥</p>
                <p className="text-sm text-slate-500 mb-1">No customers yet</p>
                <p className="text-xs text-slate-400">Click &quot;Add Customer&quot; to add your first signed-up customer</p>
              </div>
            )}

            {!customersLoading && customers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Organisation</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Added</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{c.name || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{c.email}</td>
                        <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{c.organisation || '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB') : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {confirmDelete === c.id ? (
                            <span className="flex items-center justify-end gap-1">
                              <span className="text-xs text-red-600">Delete?</span>
                              <button onClick={() => handleDeleteCustomer(c.id)} className="text-xs px-2 py-1 bg-red-600 text-white rounded">Yes</button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 border rounded">No</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDelete(c.id)} className="text-xs px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Send Email */}
        {activeTab === 1 && (
          <div className="max-w-2xl">
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-5">
              <h3 className="font-semibold text-slate-900">Send Email to Customers</h3>

              {/* Template selector */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Email Template</label>
                <select value={selectedTemplate} onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  setCustomSubject(NEWSLETTER_TEMPLATES[e.target.value]?.subject || '');
                }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                  {Object.entries(NEWSLETTER_TEMPLATES).map(([key, tmpl]) => (
                    <option key={key} value={key}>{tmpl.name} — {tmpl.description}</option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Subject Line</label>
                <input type="text" value={customSubject || NEWSLETTER_TEMPLATES[selectedTemplate]?.subject || ''}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50" />
              </div>

              {/* Recipients */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Send To</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="sendTo" value="single" checked={sendTo === 'single'}
                      onChange={() => setSendTo('single')} className="accent-teal-600" />
                    Single Customer
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="sendTo" value="all" checked={sendTo === 'all'}
                      onChange={() => setSendTo('all')} className="accent-teal-600" />
                    All Customers ({customers.length})
                  </label>
                </div>
              </div>

              {sendTo === 'single' && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Select Customer</label>
                  <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50">
                    <option value="">Choose a customer...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.email} — {c.email}</option>
                    ))}
                  </select>
                </div>
              )}

              {!NEWSLETTER_TEMPLATES[selectedTemplate]?.html && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-700">This template doesn&apos;t have HTML content yet. Use the Welcome template, or create email content in the Email Campaigns area.</p>
                </div>
              )}

              <button onClick={handleSendEmail} disabled={sendingEmail || !NEWSLETTER_TEMPLATES[selectedTemplate]?.html}
                className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors">
                {sendingEmail ? 'Sending...' : `Send ${selectedTemplate === 'welcome' ? 'Welcome' : ''} Email`}
              </button>

              {sendResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">{sendResult}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Templates */}
        {activeTab === 2 && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Template list */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 text-sm">Available Templates</h3>
                {Object.entries(NEWSLETTER_TEMPLATES).map(([key, tmpl]) => (
                  <button key={key} onClick={() => setTemplatePreview(key)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      templatePreview === key
                        ? 'border-teal-500 bg-teal-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}>
                    <p className="font-medium text-slate-900 text-sm">{tmpl.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{tmpl.description}</p>
                    <p className="text-xs text-slate-400 mt-1">Subject: {tmpl.subject}</p>
                    {!tmpl.html && <span className="inline-block mt-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">No HTML yet</span>}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 text-sm">Preview</h3>
                  {NEWSLETTER_TEMPLATES[templatePreview]?.html && (
                    <button onClick={() => copyHtml(NEWSLETTER_TEMPLATES[templatePreview].html)}
                      className="text-xs px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
                      {copyMsg || 'Copy HTML'}
                    </button>
                  )}
                </div>
                {NEWSLETTER_TEMPLATES[templatePreview]?.html ? (
                  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <iframe
                      srcDoc={NEWSLETTER_TEMPLATES[templatePreview].html
                        .replace(/\{\{CUSTOMER_NAME\}\}/g, 'Jane')
                        .replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, '#')}
                      className="w-full border-0"
                      style={{ height: '700px' }}
                      title="Email preview"
                    />
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border p-8 text-center">
                    <p className="text-sm text-slate-500">No preview available for this template yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Create email content in the Email Campaigns area.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

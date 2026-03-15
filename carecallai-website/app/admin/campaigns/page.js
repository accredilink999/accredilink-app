'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MARKETING_TEMPLATE_HTML, MARKETING_TEMPLATE_SUBJECT, MARKETING_TEMPLATE_PREVIEW, MARKETING_TEMPLATE_NAME } from '@/lib/marketingTemplate';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
}

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-amber-100 text-amber-700',
  sending: 'bg-blue-100 text-blue-700',
  sent: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const CONTACT_STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  unsubscribed: 'bg-amber-100 text-amber-700',
  bounced: 'bg-red-100 text-red-700',
};

const TOPIC_SUGGESTIONS = {
  product_launch: [
    'Introducing CareCallAI \u2014 All-in-One Care Management',
    'New: Clinical Assessments in CareCallAI',
    'CareCallAI Mobile App',
    'AI-Powered Virtual Care Inspector',
    'eMAR \u2014 Safer Medication Management',
  ],
  compliance_update: [
    'Preparing for CIW Inspection',
    'RISCA Reg 36: Staff Supervision',
    'CQC Key Lines of Enquiry',
    'New CIW Digital Records Guidance',
    'Safeguarding Audit Trails',
  ],
  newsletter: [
    'Monthly Care Tech Update',
    'Top 5 Ways to Reduce Paperwork',
    'Care Sector Digital Transformation',
    'Staff Retention Tips',
  ],
  promotional: [
    '14-Day Free Trial',
    'Switch from Paper \u2014 Free Migration',
    'CareCallAI vs. Multiple Systems',
  ],
};

const CAMPAIGN_TYPE_LABELS = {
  product_launch: 'Product Launch',
  compliance_update: 'Compliance Update',
  newsletter: 'Newsletter',
  promotional: 'Promotional',
};

const TABS = ['Campaigns', 'Create Campaign', 'AI Generator', 'Contacts', 'Templates', 'Send Results'];

const SEND_STATUS_COLORS = {
  queued: 'bg-slate-100 text-slate-700',
  sent: 'bg-blue-100 text-blue-700',
  opened: 'bg-green-100 text-green-700',
  clicked: 'bg-teal-100 text-teal-700',
  failed: 'bg-red-100 text-red-700',
};

export default function EmailCampaignsPage() {
  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  // Navigation
  const [activeTab, setActiveTab] = useState(0);

  // Campaigns tab
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignStatusFilter, setCampaignStatusFilter] = useState('all');
  const [confirmDeleteCampaign, setConfirmDeleteCampaign] = useState(null);
  const [confirmSendCampaign, setConfirmSendCampaign] = useState(null);
  const [sendingCampaign, setSendingCampaign] = useState(null);
  const [testEmailPrompt, setTestEmailPrompt] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');

  // Create/Edit Campaign tab
  const [editingCampaignId, setEditingCampaignId] = useState(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    preview_text: '',
    html_content: '',
    plain_text: '',
    regulator: 'all',
    provider_type: 'all',
    status: 'draft',
    scheduled_at: '',
  });
  const [audienceCount, setAudienceCount] = useState(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [campaignSaveMsg, setCampaignSaveMsg] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const previewRef = useRef(null);

  // AI Generator tab
  const [aiCampaignType, setAiCampaignType] = useState('product_launch');
  const [aiTargetAudience, setAiTargetAudience] = useState('all');
  const [aiTopic, setAiTopic] = useState('');
  const [aiAdditionalContext, setAiAdditionalContext] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');

  // Contacts tab
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsTotalCount, setContactsTotalCount] = useState(0);
  const [contactSearch, setContactSearch] = useState('');
  const [contactRegFilter, setContactRegFilter] = useState('all');
  const [contactStatusFilter, setContactStatusFilter] = useState('all');
  const [contactProviderFilter, setContactProviderFilter] = useState('all');
  const [contactPage, setContactPage] = useState(0);
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [csvDataSource, setCsvDataSource] = useState('csv_import');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ email: '', name: '', organisation: '', regulator: 'ciw', provider_type: 'domiciliary' });
  const [addingContact, setAddingContact] = useState(false);

  // Templates tab
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '', category: 'general', html_content: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templatePreviewId, setTemplatePreviewId] = useState(null);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState(null);

  // Send Results tab
  const [sendResultsCampaignId, setSendResultsCampaignId] = useState('');
  const [sendResults, setSendResults] = useState([]);
  const [sendResultsStats, setSendResultsStats] = useState(null);
  const [sendResultsLoading, setSendResultsLoading] = useState(false);
  const [sendResultsStatusFilter, setSendResultsStatusFilter] = useState('all');

  // Global
  const [error, setError] = useState('');

  // ---- Auth check ----
  useEffect(() => {
    const token = sessionStorage.getItem('admin_token');
    if (token) setIsLoggedIn(true);
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn && !checking) {
      window.location.href = '/admin';
    }
  }, [isLoggedIn, checking]);

  // ---- API helper ----
  async function apiFetch(url, options = {}) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  // ---- Load campaigns ----
  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/campaigns');
      setCampaigns(data.campaigns || data || []);
    } catch (err) {
      setError('Failed to load campaigns: ' + err.message);
    }
    setCampaignsLoading(false);
  }, []);

  // ---- Load contacts ----
  const loadContacts = useCallback(async () => {
    setContactsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (contactSearch) params.set('search', contactSearch);
      if (contactRegFilter !== 'all') params.set('regulator', contactRegFilter);
      if (contactStatusFilter !== 'all') params.set('status', contactStatusFilter);
      if (contactProviderFilter !== 'all') params.set('provider_type', contactProviderFilter);
      params.set('page', String(contactPage));
      params.set('limit', '50');
      const data = await apiFetch(`/api/campaigns/contacts?${params.toString()}`);
      setContacts(data.contacts || data || []);
      if (data.total !== undefined) setContactsTotalCount(data.total);
    } catch (err) {
      setError('Failed to load contacts: ' + err.message);
    }
    setContactsLoading(false);
  }, [contactSearch, contactRegFilter, contactStatusFilter, contactProviderFilter, contactPage]);

  // ---- Load contacts count ----
  const loadContactsCount = useCallback(async () => {
    try {
      const params = new URLSearchParams({ count_only: 'true' });
      if (contactRegFilter !== 'all') params.set('regulator', contactRegFilter);
      if (contactStatusFilter !== 'all') params.set('status', contactStatusFilter);
      if (contactProviderFilter !== 'all') params.set('provider_type', contactProviderFilter);
      if (contactSearch) params.set('search', contactSearch);
      const data = await apiFetch(`/api/campaigns/contacts?${params.toString()}`);
      setContactsTotalCount(data.count ?? data.total ?? 0);
    } catch (err) {
      // silent
    }
  }, [contactSearch, contactRegFilter, contactStatusFilter, contactProviderFilter]);

  // ---- Load templates ----
  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/campaigns/templates');
      setTemplates(data.templates || data || []);
    } catch (err) {
      setError('Failed to load templates: ' + err.message);
    }
    setTemplatesLoading(false);
  }, []);

  // ---- Audience count for create tab ----
  const loadAudienceCount = useCallback(async (regulator, provider_type) => {
    setAudienceLoading(true);
    try {
      const params = new URLSearchParams({ count_only: 'true' });
      if (regulator && regulator !== 'all') params.set('regulator', regulator);
      if (provider_type && provider_type !== 'all') params.set('provider_type', provider_type);
      const data = await apiFetch(`/api/campaigns/contacts?${params.toString()}`);
      setAudienceCount(data.count ?? data.total ?? 0);
    } catch (err) {
      setAudienceCount(null);
    }
    setAudienceLoading(false);
  }, []);

  // ---- Load send results ----
  const loadSendResults = useCallback(async (campaignId) => {
    if (!campaignId) { setSendResults([]); setSendResultsStats(null); return; }
    setSendResultsLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/campaigns/sends?campaign_id=${campaignId}`);
      setSendResults(data.sends || []);
      setSendResultsStats(data.stats || null);
    } catch (err) {
      setError('Failed to load send results: ' + err.message);
    }
    setSendResultsLoading(false);
  }, []);

  // ---- Data loading on tab change ----
  useEffect(() => {
    if (!isLoggedIn) return;
    if (activeTab === 0) loadCampaigns();
    if (activeTab === 3) { loadContacts(); loadContactsCount(); }
    if (activeTab === 4) loadTemplates();
    if (activeTab === 1) loadTemplates(); // for "Load Template" dropdown
    if (activeTab === 5) loadCampaigns(); // need campaign list for dropdown
  }, [activeTab, isLoggedIn, loadCampaigns, loadContacts, loadContactsCount, loadTemplates]);

  // ---- Reload contacts on filter/page change ----
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 3) return;
    loadContacts();
    loadContactsCount();
  }, [contactSearch, contactRegFilter, contactStatusFilter, contactProviderFilter, contactPage, isLoggedIn, activeTab, loadContacts, loadContactsCount]);

  // ---- Audience count when regulator/provider changes ----
  useEffect(() => {
    if (!isLoggedIn || activeTab !== 1) return;
    loadAudienceCount(campaignForm.regulator, campaignForm.provider_type);
  }, [campaignForm.regulator, campaignForm.provider_type, activeTab, isLoggedIn, loadAudienceCount]);

  // ---- Campaign CRUD ----
  async function saveCampaign(asScheduled) {
    setSavingCampaign(true);
    setCampaignSaveMsg('');
    try {
      const body = { ...campaignForm };
      if (asScheduled) {
        body.status = 'scheduled';
        if (!body.scheduled_at) {
          setCampaignSaveMsg('Please set a scheduled date/time.');
          setSavingCampaign(false);
          return;
        }
      } else {
        body.status = 'draft';
      }
      if (editingCampaignId) {
        await apiFetch('/api/campaigns', {
          method: 'PUT',
          body: JSON.stringify({ id: editingCampaignId, ...body }),
        });
        setCampaignSaveMsg('Campaign updated successfully.');
      } else {
        await apiFetch('/api/campaigns', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setCampaignSaveMsg('Campaign saved as ' + (asScheduled ? 'scheduled' : 'draft') + '.');
      }
      resetCampaignForm();
      loadCampaigns();
    } catch (err) {
      setCampaignSaveMsg('Error saving campaign: ' + err.message);
    }
    setSavingCampaign(false);
  }

  async function deleteCampaign(id) {
    try {
      await apiFetch('/api/campaigns', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setConfirmDeleteCampaign(null);
      loadCampaigns();
    } catch (err) {
      setError('Failed to delete campaign: ' + err.message);
    }
  }

  async function duplicateCampaign(campaign) {
    try {
      const body = {
        name: campaign.name + ' (Copy)',
        subject: campaign.subject,
        preview_text: campaign.preview_text || '',
        html_content: campaign.html_content || '',
        plain_text: campaign.plain_text || '',
        regulator: campaign.regulator || 'all',
        provider_type: campaign.provider_type || 'all',
        status: 'draft',
      };
      await apiFetch('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      loadCampaigns();
    } catch (err) {
      setError('Failed to duplicate campaign: ' + err.message);
    }
  }

  async function sendCampaign(id) {
    setSendingCampaign(id);
    setError('');
    try {
      // Step 1: Set up queued send records
      const setup = await apiFetch('/api/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({ campaign_id: id }),
      });
      const totalRecipients = setup.total_recipients || 0;

      // Step 2: Process batches from the frontend (avoids Vercel timeout)
      let totalSent = 0;
      let totalFailed = 0;
      let batchCount = 0;
      const MAX_BATCHES = 50;

      while (batchCount < MAX_BATCHES) {
        setError(`Sending batch ${batchCount + 1}... (${totalSent} sent, ${totalFailed} failed of ${totalRecipients})`);
        const result = await apiFetch('/api/campaigns/send', {
          method: 'POST',
          body: JSON.stringify({ campaign_id: id, batch_mode: true }),
        });
        totalSent += result.batch_sent || 0;
        totalFailed += result.batch_failed || 0;
        batchCount++;

        if (result.errors && result.errors.length > 0) {
          console.log('Batch errors:', result.errors);
        }

        if (result.done) {
          setError('');
          alert(`Campaign complete! ${result.total_sent || totalSent} delivered, ${totalFailed} failed.`);
          break;
        }

        // Small delay between batches
        await new Promise((r) => setTimeout(r, 300));
      }

      setConfirmSendCampaign(null);
      loadCampaigns();
    } catch (err) {
      setError('Failed to send campaign: ' + err.message);
    }
    setSendingCampaign(null);
  }

  async function sendTestEmail(campaignId, email) {
    setSendingCampaign(campaignId);
    try {
      await apiFetch('/api/campaigns/send', {
        method: 'POST',
        body: JSON.stringify({ campaign_id: campaignId, test_email: email }),
      });
      setTestEmailPrompt(null);
      setTestEmailAddress('');
      setError('');
      alert('Test email sent to ' + email);
    } catch (err) {
      setError('Failed to send test: ' + err.message);
    }
    setSendingCampaign(null);
  }

  function editCampaign(campaign) {
    setEditingCampaignId(campaign.id);
    setCampaignForm({
      name: campaign.name || '',
      subject: campaign.subject || '',
      preview_text: campaign.preview_text || '',
      html_content: campaign.html_content || '',
      plain_text: campaign.plain_text || '',
      regulator: campaign.regulator || 'all',
      provider_type: campaign.provider_type || 'all',
      status: campaign.status || 'draft',
      scheduled_at: campaign.scheduled_at || '',
    });
    setActiveTab(1);
  }

  function resetCampaignForm() {
    setEditingCampaignId(null);
    setCampaignForm({
      name: '',
      subject: '',
      preview_text: '',
      html_content: '',
      plain_text: '',
      regulator: 'all',
      provider_type: 'all',
      status: 'draft',
      scheduled_at: '',
    });
    setShowPreview(false);
    setSelectedTemplateId('');
  }

  // ---- Template CRUD ----
  async function saveTemplate() {
    setSavingTemplate(true);
    try {
      if (editingTemplateId) {
        await apiFetch('/api/campaigns/templates', {
          method: 'PUT',
          body: JSON.stringify({ id: editingTemplateId, ...templateForm }),
        });
      } else {
        await apiFetch('/api/campaigns/templates', {
          method: 'POST',
          body: JSON.stringify(templateForm),
        });
      }
      setShowCreateTemplate(false);
      setEditingTemplateId(null);
      setTemplateForm({ name: '', description: '', category: 'general', html_content: '' });
      loadTemplates();
    } catch (err) {
      setError('Failed to save template: ' + err.message);
    }
    setSavingTemplate(false);
  }

  async function deleteTemplate(id) {
    try {
      await apiFetch('/api/campaigns/templates', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setConfirmDeleteTemplate(null);
      loadTemplates();
    } catch (err) {
      setError('Failed to delete template: ' + err.message);
    }
  }

  function editTemplate(template) {
    setEditingTemplateId(template.id);
    setTemplateForm({
      name: template.name || '',
      description: template.description || '',
      category: template.category || 'general',
      html_content: template.html_content || '',
    });
    setShowCreateTemplate(true);
  }

  function useTemplateInCampaign(template) {
    setCampaignForm((prev) => ({ ...prev, html_content: template.html_content || '' }));
    setActiveTab(1);
  }

  // ---- AI Generator ----
  async function generateAiEmail() {
    setAiGenerating(true);
    setAiError('');
    setAiResult(null);
    try {
      const data = await apiFetch('/api/campaigns/generate', {
        method: 'POST',
        body: JSON.stringify({
          campaignType: aiCampaignType,
          topic: aiTopic,
          targetAudience: aiTargetAudience,
          additionalContext: aiAdditionalContext,
        }),
      });
      setAiResult(data);
    } catch (err) {
      setAiError('AI generation failed: ' + err.message);
    }
    setAiGenerating(false);
  }

  function useAiEmail() {
    if (!aiResult) return;
    setCampaignForm((prev) => ({
      ...prev,
      subject: aiResult.subject || '',
      preview_text: aiResult.previewText || '',
      html_content: aiResult.htmlContent || aiResult.html_content || '',
    }));
    setActiveTab(1);
  }

  function copyHtml() {
    if (!aiResult) return;
    const html = aiResult.htmlContent || aiResult.html_content || '';
    navigator.clipboard.writeText(html).then(() => {
      alert('HTML copied to clipboard');
    }).catch(() => {
      alert('Failed to copy HTML');
    });
  }

  // ---- CSV Import ----
  function handleCsvFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text !== 'string') return;
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length === 0) { setCsvPreview(null); return; }
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows = [];
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        rows.push(row);
      }
      setCsvPreview({ headers, rows, totalRows: lines.length - 1 });
    };
    reader.readAsText(file);
  }

  async function importCsv() {
    if (!csvFile || !csvPreview) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const contacts = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, idx) => { row[h] = vals[idx] || ''; });
        if (row.email) {
          contacts.push({
            email: row.email,
            name: row.name || row.contact_name || row.full_name || '',
            organisation: row.organisation || row.organization || row.company || '',
            regulator: row.regulator || 'ciw',
            provider_type: row.provider_type || row.type || 'domiciliary',
            data_source: csvDataSource,
          });
        }
      }
      if (contacts.length === 0) throw new Error('No valid contacts found in CSV (missing email column).');
      const data = await apiFetch('/api/campaigns/contacts', {
        method: 'POST',
        body: JSON.stringify({ contacts }),
      });
      setImportResult({ success: true, imported: data.imported ?? contacts.length, total: contacts.length, message: data.message || 'Import complete.' });
      setCsvFile(null);
      setCsvPreview(null);
      loadContacts();
      loadContactsCount();
    } catch (err) {
      setImportResult({ success: false, message: err.message });
    }
    setImporting(false);
  }

  // ---- Add single contact ----
  async function addSingleContact() {
    if (!newContact.email) return;
    setAddingContact(true);
    try {
      await apiFetch('/api/campaigns/contacts', {
        method: 'POST',
        body: JSON.stringify({ contacts: [{ ...newContact, data_source: 'manual' }] }),
      });
      setNewContact({ email: '', name: '', organisation: '', regulator: 'ciw', provider_type: 'domiciliary' });
      setShowAddContact(false);
      loadContacts();
      loadContactsCount();
    } catch (err) {
      setError('Failed to add contact: ' + err.message);
    }
    setAddingContact(false);
  }

  // ---- Load template into campaign form ----
  function loadTemplateIntoCampaign(templateId) {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tmpl = templates.find((t) => String(t.id) === String(templateId));
    if (tmpl) {
      setCampaignForm((prev) => ({ ...prev, html_content: tmpl.html_content || '' }));
    }
  }

  // ---- Preview HTML ----
  useEffect(() => {
    if (showPreview && previewRef.current) {
      const doc = previewRef.current.contentDocument || previewRef.current.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(campaignForm.html_content || '<p style="color:#999;text-align:center;padding:40px;">No HTML content to preview</p>');
        doc.close();
      }
    }
  }, [showPreview, campaignForm.html_content]);

  // ---- Filtered campaigns ----
  const filteredCampaigns = campaigns.filter((c) => {
    if (campaignStatusFilter === 'all') return true;
    return c.status === campaignStatusFilter;
  });

  // ---- Render helpers ----
  function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // ---- Loading / redirect ----
  if (checking) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  // ==========================
  //       TAB CONTENT
  // ==========================

  // ---- TAB 0: Campaigns ----
  function renderCampaignsTab() {
    return (
      <div>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm font-medium text-slate-600">Status:</label>
          {['all', 'draft', 'scheduled', 'sending', 'sent', 'failed'].map((s) => (
            <button
              key={s}
              onClick={() => setCampaignStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                campaignStatusFilter === s
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading */}
        {campaignsLoading && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-6 h-6 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading campaigns...</p>
          </div>
        )}

        {/* Empty */}
        {!campaignsLoading && filteredCampaigns.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-slate-500">No campaigns found.</p>
            <button onClick={() => { resetCampaignForm(); setActiveTab(1); }} className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium">
              Create your first campaign
            </button>
          </div>
        )}

        {/* Campaign cards */}
        <div className="space-y-3">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-slate-900 truncate">{campaign.name || 'Untitled'}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[campaign.status] || STATUS_COLORS.draft}`}>
                      {(campaign.status || 'draft').charAt(0).toUpperCase() + (campaign.status || 'draft').slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 truncate mb-2">{campaign.subject || 'No subject'}</p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {campaign.sent_count !== undefined && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        Sent: {campaign.sent_count || 0}
                      </span>
                    )}
                    {campaign.opened_count !== undefined && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" /></svg>
                        Opened: {campaign.opened_count || 0}
                      </span>
                    )}
                    {campaign.clicked_count !== undefined && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-teal-50 text-teal-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                        Clicked: {campaign.clicked_count || 0}
                      </span>
                    )}
                    {campaign.unsubscribed_count !== undefined && campaign.unsubscribed_count > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-50 text-red-700">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        Unsubs: {campaign.unsubscribed_count}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400">Created: {formatDate(campaign.created_at)}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => editCampaign(campaign)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => duplicateCampaign(campaign)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => setTestEmailPrompt(campaign.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors"
                  >
                    Send Test
                  </button>
                  <button
                    onClick={() => { setSendResultsCampaignId(campaign.id); loadSendResults(campaign.id); setActiveTab(5); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium transition-colors"
                  >
                    View Results
                  </button>
                  {campaign.status === 'draft' || campaign.status === 'scheduled' || campaign.status === 'sent' ? (
                    confirmSendCampaign === campaign.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-amber-600 font-medium">{campaign.status === 'sent' ? 'Send to new contacts?' : 'Send now?'}</span>
                        <button
                          onClick={() => sendCampaign(campaign.id)}
                          disabled={sendingCampaign === campaign.id}
                          className={`text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-50 font-medium ${campaign.status === 'sent' ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                        >
                          {sendingCampaign === campaign.id ? 'Sending...' : 'Confirm'}
                        </button>
                        <button onClick={() => setConfirmSendCampaign(null)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-50">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmSendCampaign(campaign.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg text-white font-medium transition-colors ${campaign.status === 'sent' ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                      >
                        {campaign.status === 'sent' ? 'Send to New Contacts' : 'Send'}
                      </button>
                    )
                  ) : null}
                  {confirmDeleteCampaign === campaign.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-red-600 font-medium">Delete?</span>
                      <button
                        onClick={() => deleteCampaign(campaign.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                      >
                        Yes
                      </button>
                      <button onClick={() => setConfirmDeleteCampaign(null)} className="text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-50">
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteCampaign(campaign.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Test email prompt */}
              {testEmailPrompt === campaign.id && (
                <div className="mt-3 pt-3 border-t flex flex-wrap items-center gap-2">
                  <input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                  />
                  <button
                    onClick={() => sendTestEmail(campaign.id, testEmailAddress)}
                    disabled={!testEmailAddress || sendingCampaign === campaign.id}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium"
                  >
                    {sendingCampaign === campaign.id ? 'Sending...' : 'Send Test'}
                  </button>
                  <button
                    onClick={() => { setTestEmailPrompt(null); setTestEmailAddress(''); }}
                    className="text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- TAB 1: Create Campaign ----
  function renderCreateCampaignTab() {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            {editingCampaignId ? 'Edit Campaign' : 'Create Campaign'}
          </h2>
          {editingCampaignId && (
            <button
              onClick={resetCampaignForm}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {campaignSaveMsg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${campaignSaveMsg.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {campaignSaveMsg}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
            <input
              type="text"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. March Newsletter"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject Line</label>
            <input
              type="text"
              value={campaignForm.subject}
              onChange={(e) => setCampaignForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="e.g. Simplify Your Care Management with CareCallAI"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          {/* Preview Text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Preview Text</label>
            <input
              type="text"
              value={campaignForm.preview_text}
              onChange={(e) => setCampaignForm((p) => ({ ...p, preview_text: e.target.value }))}
              placeholder="Short text shown in inbox before opening"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          {/* Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Regulator</label>
              <select
                value={campaignForm.regulator}
                onChange={(e) => setCampaignForm((p) => ({ ...p, regulator: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="all">All</option>
                <option value="ciw">CIW</option>
                <option value="cqc">CQC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Provider Type</label>
              <select
                value={campaignForm.provider_type}
                onChange={(e) => setCampaignForm((p) => ({ ...p, provider_type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="all">All</option>
                <option value="domiciliary">Domiciliary</option>
                <option value="care_home">Care Home</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2 w-full text-center">
                <p className="text-xs text-teal-600 font-medium">Audience Size</p>
                <p className="text-lg font-bold text-teal-700">
                  {audienceLoading ? (
                    <span className="inline-block w-4 h-4 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
                  ) : (
                    audienceCount !== null ? audienceCount.toLocaleString() : '-'
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Load Template */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Load Template</label>
            <select
              value={selectedTemplateId}
              onChange={(e) => loadTemplateIntoCampaign(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            >
              <option value="">-- Select a template --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}{t.category ? ` (${t.category})` : ''}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setCampaignForm((prev) => ({
                  ...prev,
                  name: prev.name || MARKETING_TEMPLATE_NAME,
                  subject: prev.subject || MARKETING_TEMPLATE_SUBJECT,
                  preview_text: prev.preview_text || MARKETING_TEMPLATE_PREVIEW,
                  html_content: MARKETING_TEMPLATE_HTML,
                }));
              }}
              className="mt-2 w-full px-3 py-2 bg-teal-50 border border-teal-200 text-teal-700 text-sm font-medium rounded-lg hover:bg-teal-100 transition-colors"
            >
              Load Built-in Marketing Blast Template
            </button>
          </div>

          {/* HTML Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">HTML Content</label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                {showPreview ? 'Hide Preview' : 'Preview'}
              </button>
            </div>
            <textarea
              value={campaignForm.html_content}
              onChange={(e) => setCampaignForm((p) => ({ ...p, html_content: e.target.value }))}
              rows={12}
              placeholder="<html>...</html>"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
            {showPreview && (
              <div className="mt-2 border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 border-b">Preview</div>
                <iframe
                  ref={previewRef}
                  title="Email Preview"
                  className="w-full bg-white"
                  style={{ height: '400px', border: 'none' }}
                  sandbox="allow-same-origin"
                />
              </div>
            )}
          </div>

          {/* Plain Text */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Plain Text Version</label>
            <textarea
              value={campaignForm.plain_text}
              onChange={(e) => setCampaignForm((p) => ({ ...p, plain_text: e.target.value }))}
              rows={6}
              placeholder="Plain text fallback for email clients that don't support HTML..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={campaignForm.scheduled_at}
              onChange={(e) => setCampaignForm((p) => ({ ...p, scheduled_at: e.target.value }))}
              className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => saveCampaign(false)}
              disabled={savingCampaign || !campaignForm.name}
              className="px-5 py-2.5 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {savingCampaign ? 'Saving...' : editingCampaignId ? 'Update Draft' : 'Save Draft'}
            </button>
            <button
              onClick={() => saveCampaign(true)}
              disabled={savingCampaign || !campaignForm.name || !campaignForm.scheduled_at}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {savingCampaign ? 'Saving...' : 'Schedule'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- TAB 2: AI Generator ----
  function renderAiGeneratorTab() {
    const suggestions = TOPIC_SUGGESTIONS[aiCampaignType] || [];

    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">AI Email Generator</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input panel */}
          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Type</label>
              <select
                value={aiCampaignType}
                onChange={(e) => { setAiCampaignType(e.target.value); setAiTopic(''); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                {Object.entries(CAMPAIGN_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
              <select
                value={aiTargetAudience}
                onChange={(e) => setAiTargetAudience(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="all">All Providers</option>
                <option value="ciw">CIW (Wales)</option>
                <option value="cqc">CQC (England)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
              <textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                rows={3}
                placeholder="What should the email be about?"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
              {suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-slate-500 mb-1.5">Suggestions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => setAiTopic(s)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          aiTopic === s
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400 hover:text-teal-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional Context (optional)</label>
              <textarea
                value={aiAdditionalContext}
                onChange={(e) => setAiAdditionalContext(e.target.value)}
                rows={3}
                placeholder="Any extra details, tone, or specific points to include..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>

            <button
              onClick={generateAiEmail}
              disabled={aiGenerating || !aiTopic}
              className="w-full px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {aiGenerating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Email
                </>
              )}
            </button>

            {aiError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{aiError}</div>
            )}
          </div>

          {/* Output panel */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            {!aiResult && !aiGenerating && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-sm text-slate-400">Select a topic and generate an email to see the result here.</p>
              </div>
            )}

            {aiGenerating && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">AI is writing your email...</p>
              </div>
            )}

            {aiResult && !aiGenerating && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
                  <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg p-3">{aiResult.subject}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Preview Text</label>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{aiResult.previewText || aiResult.preview_text || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">HTML Preview</label>
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <div
                      className="p-4 text-sm"
                      dangerouslySetInnerHTML={{ __html: aiResult.htmlContent || aiResult.html_content || '' }}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={useAiEmail}
                    className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                  >
                    Use This Email
                  </button>
                  <button
                    onClick={copyHtml}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                  >
                    Copy HTML
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---- TAB 3: Contacts ----
  function renderContactsTab() {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Contacts</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-semibold">
              {contactsTotalCount.toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => setShowAddContact(!showAddContact)}
            className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium transition-colors"
          >
            {showAddContact ? 'Cancel' : '+ Add Contact'}
          </button>
        </div>

        {/* Add single contact form */}
        {showAddContact && (
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Add Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <input
                type="email"
                placeholder="Email *"
                value={newContact.email}
                onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
              <input
                type="text"
                placeholder="Name"
                value={newContact.name}
                onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
              <input
                type="text"
                placeholder="Organisation"
                value={newContact.organisation}
                onChange={(e) => setNewContact((p) => ({ ...p, organisation: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
              <select
                value={newContact.regulator}
                onChange={(e) => setNewContact((p) => ({ ...p, regulator: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="ciw">CIW</option>
                <option value="cqc">CQC</option>
              </select>
              <select
                value={newContact.provider_type}
                onChange={(e) => setNewContact((p) => ({ ...p, provider_type: e.target.value }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="domiciliary">Domiciliary</option>
                <option value="care_home">Care Home</option>
              </select>
              <button
                onClick={addSingleContact}
                disabled={addingContact || !newContact.email}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {addingContact ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <input
                type="text"
                placeholder="Email, name, or organisation..."
                value={contactSearch}
                onChange={(e) => { setContactSearch(e.target.value); setContactPage(0); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Regulator</label>
              <select
                value={contactRegFilter}
                onChange={(e) => { setContactRegFilter(e.target.value); setContactPage(0); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="all">All</option>
                <option value="ciw">CIW</option>
                <option value="cqc">CQC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={contactStatusFilter}
                onChange={(e) => { setContactStatusFilter(e.target.value); setContactPage(0); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="bounced">Bounced</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Provider Type</label>
              <select
                value={contactProviderFilter}
                onChange={(e) => { setContactProviderFilter(e.target.value); setContactPage(0); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="all">All</option>
                <option value="domiciliary">Domiciliary</option>
                <option value="care_home">Care Home</option>
              </select>
            </div>
          </div>
        </div>

        {/* CSV Import */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">CSV Import</h3>
          <div className="flex flex-wrap items-end gap-3 mb-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-slate-500 mb-1">CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFile}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 file:cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data Source</label>
              <select
                value={csvDataSource}
                onChange={(e) => setCsvDataSource(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                <option value="csv_import">CSV Import</option>
                <option value="ciw_register">CIW Register</option>
                <option value="cqc_register">CQC Register</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <button
              onClick={importCsv}
              disabled={importing || !csvPreview}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {importing ? 'Importing...' : 'Import'}
            </button>
          </div>

          {/* CSV Preview */}
          {csvPreview && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-2">Preview ({csvPreview.totalRows} rows total, showing first {csvPreview.rows.length}):</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr>
                      {csvPreview.headers.map((h) => (
                        <th key={h} className="text-left px-2 py-1.5 bg-slate-50 border border-slate-200 font-medium text-slate-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.rows.map((row, i) => (
                      <tr key={i}>
                        {csvPreview.headers.map((h) => (
                          <td key={h} className="px-2 py-1.5 border border-slate-200 text-slate-700 truncate max-w-[200px]">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div className={`mt-3 p-3 rounded-lg text-sm ${importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {importResult.success ? (
                <span>Successfully imported {importResult.imported} of {importResult.total} contacts. {importResult.message}</span>
              ) : (
                <span>Import failed: {importResult.message}</span>
              )}
            </div>
          )}
        </div>

        {/* Contact Table */}
        {contactsLoading && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-6 h-6 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading contacts...</p>
          </div>
        )}

        {!contactsLoading && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden sm:table-cell">Organisation</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden md:table-cell">Regulator</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 hidden lg:table-cell">Imported</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">No contacts found.</td>
                    </tr>
                  ) : (
                    contacts.map((c) => (
                      <tr key={c.id || c.email} className="border-b hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-900 font-medium truncate max-w-[200px]">{c.email}</td>
                        <td className="px-4 py-3 text-slate-700 truncate max-w-[150px]">{c.name || '-'}</td>
                        <td className="px-4 py-3 text-slate-700 truncate max-w-[200px] hidden sm:table-cell">{c.organisation || '-'}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 uppercase">{c.regulator || '-'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${CONTACT_STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-600'}`}>
                            {(c.status || 'active').charAt(0).toUpperCase() + (c.status || 'active').slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{formatDate(c.created_at || c.imported_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {contacts.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
                <p className="text-xs text-slate-500">
                  Showing {contactPage * 50 + 1}-{Math.min((contactPage + 1) * 50, contactsTotalCount)} of {contactsTotalCount.toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setContactPage((p) => Math.max(0, p - 1))}
                    disabled={contactPage === 0}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setContactPage((p) => p + 1)}
                    disabled={contacts.length < 50}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- TAB 4: Templates ----
  function renderTemplatesTab() {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Templates</h2>
          <button
            onClick={() => {
              if (showCreateTemplate) {
                setShowCreateTemplate(false);
                setEditingTemplateId(null);
                setTemplateForm({ name: '', description: '', category: 'general', html_content: '' });
              } else {
                setShowCreateTemplate(true);
                setEditingTemplateId(null);
                setTemplateForm({ name: '', description: '', category: 'general', html_content: '' });
              }
            }}
            className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium transition-colors"
          >
            {showCreateTemplate ? 'Cancel' : '+ Create Template'}
          </button>
        </div>

        {/* Create / Edit Template Form */}
        {showCreateTemplate && (
          <div className="bg-white rounded-xl shadow-sm border p-5 mb-4 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">
              {editingTemplateId ? 'Edit Template' : 'New Template'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Template name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                <select
                  value={templateForm.category}
                  onChange={(e) => setTemplateForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                >
                  <option value="general">General</option>
                  <option value="product_launch">Product Launch</option>
                  <option value="compliance">Compliance</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="promotional">Promotional</option>
                  <option value="onboarding">Onboarding</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
              <input
                type="text"
                value={templateForm.description}
                onChange={(e) => setTemplateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this template"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">HTML Content</label>
              <textarea
                value={templateForm.html_content}
                onChange={(e) => setTemplateForm((p) => ({ ...p, html_content: e.target.value }))}
                rows={12}
                placeholder="<html>...</html>"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>
            <button
              onClick={saveTemplate}
              disabled={savingTemplate || !templateForm.name}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {savingTemplate ? 'Saving...' : editingTemplateId ? 'Update Template' : 'Save Template'}
            </button>
          </div>
        )}

        {/* Loading */}
        {templatesLoading && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-6 h-6 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading templates...</p>
          </div>
        )}

        {/* Empty */}
        {!templatesLoading && templates.length === 0 && !showCreateTemplate && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <p className="text-sm text-slate-500">No templates yet.</p>
          </div>
        )}

        {/* Template cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-xl shadow-sm border p-4 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate">{template.name}</h3>
                  {template.category && (
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                      {template.category}
                    </span>
                  )}
                </div>
              </div>
              {template.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{template.description}</p>
              )}

              {/* Template preview */}
              {templatePreviewId === template.id && (
                <div className="mb-3 border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-2 py-1 text-xs text-slate-500 border-b flex items-center justify-between">
                    <span>Preview</span>
                    <button onClick={() => setTemplatePreviewId(null)} className="text-slate-400 hover:text-slate-600">Close</button>
                  </div>
                  <div
                    className="p-3 text-xs max-h-[200px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: template.html_content || '<p style="color:#999">No content</p>' }}
                  />
                </div>
              )}

              <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t">
                <button
                  onClick={() => setTemplatePreviewId(templatePreviewId === template.id ? null : template.id)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors"
                >
                  {templatePreviewId === template.id ? 'Hide' : 'Preview'}
                </button>
                <button
                  onClick={() => editTemplate(template)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => useTemplateInCampaign(template)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium transition-colors"
                >
                  Use in Campaign
                </button>
                {confirmDeleteTemplate === template.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteTemplate(template.id)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDeleteTemplate(null)}
                      className="text-xs px-2.5 py-1 rounded-lg border hover:bg-slate-50"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteTemplate(template.id)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- TAB 5: Send Results ----
  function renderSendResultsTab() {
    const sentCampaigns = campaigns.filter((c) => ['sent', 'sending', 'draft'].includes(c.status));
    const filteredSends = sendResultsStatusFilter === 'all'
      ? sendResults
      : sendResults.filter((s) => s.status === sendResultsStatusFilter);

    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Send Results</h2>

        {/* Campaign selector */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Campaign</label>
          <select
            value={sendResultsCampaignId}
            onChange={(e) => { setSendResultsCampaignId(e.target.value); loadSendResults(e.target.value); setSendResultsStatusFilter('all'); }}
            className="w-full sm:w-96 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
          >
            <option value="">-- Choose a campaign --</option>
            {sentCampaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || 'Untitled'} ({c.status})
              </option>
            ))}
          </select>
        </div>

        {/* No campaign selected */}
        {!sendResultsCampaignId && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm text-slate-500">Select a campaign above to view send results.</p>
          </div>
        )}

        {/* Loading */}
        {sendResultsCampaignId && sendResultsLoading && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-6 h-6 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading results...</p>
          </div>
        )}

        {/* Stats summary */}
        {sendResultsCampaignId && !sendResultsLoading && sendResultsStats && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {[
                { label: 'Total', value: sendResultsStats.total, color: 'bg-slate-50 text-slate-900 border-slate-200' },
                { label: 'Queued', value: sendResultsStats.queued, color: 'bg-slate-50 text-slate-700 border-slate-200' },
                { label: 'Sent', value: sendResultsStats.sent, color: 'bg-blue-50 text-blue-700 border-blue-200' },
                { label: 'Opened', value: sendResultsStats.opened, color: 'bg-green-50 text-green-700 border-green-200' },
                { label: 'Clicked', value: sendResultsStats.clicked, color: 'bg-teal-50 text-teal-700 border-teal-200' },
                { label: 'Failed', value: sendResultsStats.failed, color: 'bg-red-50 text-red-700 border-red-200' },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl border p-3 text-center ${stat.color}`}>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs font-medium mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Open rate */}
            {sendResultsStats.total > 0 && sendResultsStats.queued < sendResultsStats.total && (
              <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div>
                    <span className="text-sm font-medium text-slate-600">Open Rate: </span>
                    <span className="text-lg font-bold text-green-600">
                      {sendResultsStats.total - sendResultsStats.queued > 0
                        ? Math.round(((sendResultsStats.opened + sendResultsStats.clicked) / (sendResultsStats.total - sendResultsStats.queued)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-600">Delivery Rate: </span>
                    <span className="text-lg font-bold text-blue-600">
                      {sendResultsStats.total > 0
                        ? Math.round(((sendResultsStats.sent + sendResultsStats.opened + sendResultsStats.clicked) / sendResultsStats.total) * 100)
                        : 0}%
                    </span>
                  </div>
                  {sendResultsStats.failed > 0 && (
                    <div>
                      <span className="text-sm font-medium text-slate-600">Failure Rate: </span>
                      <span className="text-lg font-bold text-red-600">
                        {Math.round((sendResultsStats.failed / sendResultsStats.total) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status filter */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <label className="text-sm font-medium text-slate-600">Filter:</label>
              {['all', 'queued', 'sent', 'opened', 'clicked', 'failed'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSendResultsStatusFilter(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    sendResultsStatusFilter === s
                      ? 'bg-teal-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {s !== 'all' && ` (${sendResultsStats[s] || 0})`}
                </button>
              ))}
            </div>

            {/* Results table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Sent At</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Opened At</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSends.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No results for this filter.
                        </td>
                      </tr>
                    )}
                    {filteredSends.map((send) => (
                      <tr key={send.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs break-all">{send.email}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEND_STATUS_COLORS[send.status] || 'bg-slate-100 text-slate-700'}`}>
                            {(send.status || 'unknown').charAt(0).toUpperCase() + (send.status || 'unknown').slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 hidden sm:table-cell">
                          {send.sent_at ? formatDate(send.sent_at) : '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                          {send.opened_at ? formatDate(send.opened_at) : '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-red-500 hidden lg:table-cell max-w-[200px] truncate">
                          {send.error_message || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredSends.length > 0 && (
                <div className="px-4 py-3 border-t bg-slate-50 text-xs text-slate-500">
                  Showing {filteredSends.length} of {sendResults.length} records
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ==========================
  //       MAIN RENDER
  // ==========================
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="w-10 h-10 rounded-lg bg-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">Email Campaigns</h1>
              <p className="text-xs text-slate-400">CareCall AI Marketing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto no-scrollbar">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(idx)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === idx
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 0 && renderCampaignsTab()}
        {activeTab === 1 && renderCreateCampaignTab()}
        {activeTab === 2 && renderAiGeneratorTab()}
        {activeTab === 3 && renderContactsTab()}
        {activeTab === 4 && renderTemplatesTab()}
        {activeTab === 5 && renderSendResultsTab()}
      </div>

      {/* Hide scrollbar utility */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}

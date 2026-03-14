'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

function getToken() {
  return typeof window !== 'undefined' ? sessionStorage.getItem('admin_token') : null;
}

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

const TABS = ['Scripts', 'AI Script Generator', 'Topic Library', 'Video Studio'];

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  generating_video: 'bg-blue-100 text-blue-700',
  video_ready: 'bg-amber-100 text-amber-700',
  published: 'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  draft: 'Draft',
  generating_video: 'Generating Video',
  video_ready: 'Video Ready',
  published: 'Published',
};

const VIDEO_TYPE_LABELS = {
  compliance_tutorial: 'Compliance Tutorial',
  feature_demo: 'Feature Demo',
  industry_tips: 'Industry Tips',
  training_content: 'Training Content',
  case_study: 'Case Study',
  news_update: 'News Update',
};

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'educational', label: 'Educational' },
];

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Care Providers' },
  { value: 'ciw', label: 'CIW (Wales)' },
  { value: 'cqc', label: 'CQC (England)' },
  { value: 'care_home', label: 'Care Homes' },
  { value: 'domiciliary', label: 'Domiciliary Care' },
];

const TOPIC_LIBRARY = {
  compliance: {
    label: 'Compliance & Regulation',
    emoji: '\u{1F4CB}',
    topics: [
      { title: 'How to Prepare for a CIW Inspection in 2026', videoType: 'compliance_tutorial', desc: 'Step-by-step CIW inspection preparation guide for domiciliary care agencies' },
      { title: 'RISCA Regulation 36: Staff Supervision Every 12 Weeks', videoType: 'compliance_tutorial', desc: 'Meeting the 12-weekly supervision requirement under RISCA' },
      { title: 'CQC Key Lines of Enquiry Explained', videoType: 'compliance_tutorial', desc: 'What CQC inspectors look for and how to prepare your evidence' },
      { title: 'Digital Care Records: What CIW & CQC Actually Require', videoType: 'compliance_tutorial', desc: 'Clarifying digital record-keeping requirements for compliance' },
      { title: 'Safeguarding Audit Trails: Building Better Evidence', videoType: 'compliance_tutorial', desc: 'Creating robust safeguarding documentation for inspections' },
    ],
  },
  features: {
    label: 'Feature Demos',
    emoji: '\u{1F5A5}\uFE0F',
    topics: [
      { title: 'CareCallAI in 5 Minutes: Full Platform Tour', videoType: 'feature_demo', desc: 'Quick overview of all CareCallAI features for new users' },
      { title: 'eMAR: Safer Medication Management Demo', videoType: 'feature_demo', desc: 'How electronic MAR charts eliminate paper errors' },
      { title: 'Clinical Assessments: Waterlow, MUST, NEWS2 Demo', videoType: 'feature_demo', desc: 'Running clinical assessments on mobile devices' },
      { title: 'Smart Rota & Scheduling Demo', videoType: 'feature_demo', desc: 'Pattern-based shift deployment and gap detection' },
      { title: 'Family Portal: Keeping Relatives Connected', videoType: 'feature_demo', desc: 'How families stay informed about their loved ones care' },
    ],
  },
  industry: {
    label: 'Industry & Trends',
    emoji: '\u{1F4C8}',
    topics: [
      { title: 'Digital Transformation in UK Care: 2026 State of Play', videoType: 'industry_tips', desc: 'Where the care sector stands with digital adoption' },
      { title: 'Staff Retention Crisis: 5 Practical Solutions', videoType: 'industry_tips', desc: 'Evidence-based strategies to reduce staff turnover' },
      { title: 'Paper vs Digital: The True Cost Comparison', videoType: 'industry_tips', desc: 'Breaking down hidden costs of paper-based records' },
      { title: 'AI in Care Management: What Actually Works', videoType: 'industry_tips', desc: 'Separating AI hype from practical care applications' },
    ],
  },
  training: {
    label: 'Training & Best Practice',
    emoji: '\u{1F393}',
    topics: [
      { title: 'Care Logging Best Practices for Domiciliary Staff', videoType: 'training_content', desc: 'How to write effective, compliant digital care logs' },
      { title: 'Understanding the Waterlow Pressure Risk Assessment', videoType: 'training_content', desc: 'Training guide for completing Waterlow assessments correctly' },
      { title: 'eMAR Training Guide for Care Staff', videoType: 'training_content', desc: 'Staff training on electronic medication administration' },
      { title: 'Incident Reporting: Getting It Right First Time', videoType: 'training_content', desc: 'How to complete incident reports accurately and promptly' },
    ],
  },
  case_studies: {
    label: 'Case Studies',
    emoji: '\u{1F3C6}',
    topics: [
      { title: 'From Paper to Digital: A Welsh Care Agency Story', videoType: 'case_study', desc: 'Real migration journey from paper to CareCallAI' },
      { title: 'How One Agency Saved 15 Hours Per Week', videoType: 'case_study', desc: 'Real time savings from digital care management' },
      { title: 'Passing CIW Inspection with Digital Records', videoType: 'case_study', desc: 'How digital records helped achieve a good rating' },
    ],
  },
};

export default function YouTubeScriptsPage() {
  const router = useRouter();

  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  // Navigation
  const [activeTab, setActiveTab] = useState(0);
  // Scripts tab
  const [scripts, setScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedScript, setExpandedScript] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingScript, setEditingScript] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  // AI Generator
  const [aiVideoType, setAiVideoType] = useState('compliance_tutorial');
  const [aiTopic, setAiTopic] = useState('');
  const [aiAudience, setAiAudience] = useState('all');
  const [aiDuration, setAiDuration] = useState(360);
  const [aiTone, setAiTone] = useState('professional');
  const [aiContext, setAiContext] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  // Video Import
  const [importScriptId, setImportScriptId] = useState('');
  const [importUploading, setImportUploading] = useState(false);
  const [importProgress, setImportProgress] = useState('');
  const [copiedField, setCopiedField] = useState('');
  // YouTube Publish
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState(null);
  const [publishPrivacy, setPublishPrivacy] = useState('private');
  // Global
  const [error, setError] = useState('');
  // Toast
  const [toast, setToast] = useState('');

  // ---- Auth check ----
  useEffect(() => {
    try {
      const token = sessionStorage.getItem('admin_token');
      if (!token) { setChecking(false); return; }
      const payload = JSON.parse(atob(token));
      if (payload.role === 'platform_admin' && Date.now() - payload.ts < 86400000) {
        setIsLoggedIn(true);
      }
    } catch { /* invalid token */ }
    setChecking(false);
  }, []);

  useEffect(() => {
    if (!isLoggedIn && !checking) {
      router.push('/admin');
    }
  }, [isLoggedIn, checking, router]);


  // ---- Load scripts ----
  const loadScripts = useCallback(async () => {
    setScriptsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (typeFilter !== 'all') params.set('video_type', typeFilter);
      const url = `/api/youtube${params.toString() ? '?' + params.toString() : ''}`;
      const data = await apiFetch(url);
      setScripts(data.scripts || data || []);
    } catch (err) {
      setError('Failed to load scripts: ' + err.message);
    }
    setScriptsLoading(false);
  }, [statusFilter, typeFilter]);

  // ---- Effects ----
  useEffect(() => {
    if (isLoggedIn && activeTab === 0) loadScripts();
  }, [activeTab, isLoggedIn, statusFilter, typeFilter, loadScripts]);

  // ---- Helper functions ----
  function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDuration(seconds) {
    if (!seconds || seconds <= 0) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  }

  function calculateTimestamps(script) {
    if (!script) return [];
    const timestamps = [];
    let currentTime = 0;

    if (script.hook) {
      timestamps.push({ time: currentTime, label: 'HOOK', text: script.hook, type: 'hook' });
      currentTime += script.hook_duration || 10;
    }

    if (script.sections && Array.isArray(script.sections)) {
      script.sections.forEach((section) => {
        timestamps.push({
          time: currentTime,
          label: section.title || 'Section',
          text: section.script || section.text || '',
          visual_notes: section.visualNotes || section.visual_notes || '',
          type: 'section',
        });
        currentTime += section.duration || 60;
      });
    }

    if (script.cta) {
      timestamps.push({ time: currentTime, label: 'CALL TO ACTION', text: script.cta, type: 'cta' });
      currentTime += script.cta_duration || 15;
    }

    if (script.outro) {
      timestamps.push({ time: currentTime, label: 'OUTRO', text: script.outro, type: 'outro' });
    }

    return timestamps;
  }

  function formatTimestamp(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function copyToClipboard(text, label) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setToast(`${label || 'Text'} copied to clipboard`);
      setCopiedField(label || '');
      setTimeout(() => { setToast(''); setCopiedField(''); }, 2500);
    }).catch(() => {
      setToast('Failed to copy');
      setTimeout(() => setToast(''), 2500);
    });
  }

  // ---- Script CRUD ----
  async function saveScript(scriptData) {
    try {
      const data = await apiFetch('/api/youtube', {
        method: 'POST',
        body: JSON.stringify(scriptData),
      });
      setSaveMsg('Script saved as draft successfully.');
      setTimeout(() => setSaveMsg(''), 3000);
      loadScripts();
      return data;
    } catch (err) {
      setError('Failed to save script: ' + err.message);
      return null;
    }
  }

  async function updateScript(id, updates) {
    setSavingEdit(true);
    try {
      await apiFetch('/api/youtube', {
        method: 'PUT',
        body: JSON.stringify({ id, ...updates }),
      });
      setEditingScript(null);
      setEditForm({});
      loadScripts();
    } catch (err) {
      setError('Failed to update script: ' + err.message);
    }
    setSavingEdit(false);
  }

  async function deleteScript(id) {
    try {
      await apiFetch('/api/youtube', {
        method: 'DELETE',
        body: JSON.stringify({ id }),
      });
      setConfirmDelete(null);
      loadScripts();
    } catch (err) {
      setError('Failed to delete script: ' + err.message);
    }
  }

  async function duplicateScript(script) {
    try {
      const body = {
        title: (script.title || 'Untitled') + ' (Copy)',
        youtube_title: script.youtube_title || '',
        video_type: script.video_type || 'compliance_tutorial',
        status: 'draft',
        estimated_duration: script.estimated_duration || 0,
        word_count: script.word_count || 0,
        hook: script.hook || '',
        hook_duration: script.hook_duration || 10,
        sections: script.sections || [],
        cta: script.cta || '',
        cta_duration: script.cta_duration || 15,
        outro: script.outro || '',
        thumbnail_text: script.thumbnail_text || '',
        tags: script.tags || [],
        youtube_description: script.youtube_description || '',
        full_script: script.full_script || '',
        notes: script.notes || '',
        target_audience: script.target_audience || 'all',
        tone: script.tone || 'professional',
      };
      await apiFetch('/api/youtube', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      loadScripts();
    } catch (err) {
      setError('Failed to duplicate script: ' + err.message);
    }
  }

  // ---- AI Generator ----
  async function generateScript() {
    setAiGenerating(true);
    setAiError('');
    setAiResult(null);
    try {
      const data = await apiFetch('/api/youtube/generate', {
        method: 'POST',
        body: JSON.stringify({
          videoType: aiVideoType,
          topic: aiTopic,
          targetAudience: aiAudience,
          targetDuration: aiDuration,
          tone: aiTone,
          additionalContext: aiContext,
        }),
      });
      setAiResult(data.generated || data);
    } catch (err) {
      setAiError('AI generation failed: ' + err.message);
    }
    setAiGenerating(false);
  }

  // ---- Topic Library helper ----
  function useTopic(topic) {
    setAiVideoType(topic.videoType || 'compliance_tutorial');
    setAiTopic(topic.title || '');
    setActiveTab(1);
  }

  // ---- Get AI suggestions based on video type ----
  function getTopicSuggestions(videoType) {
    const suggestions = [];
    Object.values(TOPIC_LIBRARY).forEach((category) => {
      category.topics.forEach((topic) => {
        if (topic.videoType === videoType) {
          suggestions.push(topic.title);
        }
      });
    });
    return suggestions.slice(0, 3);
  }

  // ---- Filtered scripts ----
  const filteredScripts = scripts.filter((s) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (s.title || '').toLowerCase().includes(q);
      const matchYtTitle = (s.youtube_title || '').toLowerCase().includes(q);
      if (!matchTitle && !matchYtTitle) return false;
    }
    return true;
  });

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
  //       TAB 0: SCRIPTS
  // ==========================
  function renderScriptsTab() {
    return (
      <div>
        {/* Status filter buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm font-medium text-slate-600">Status:</label>
          {[
            { key: 'all', label: 'All' },
            { key: 'draft', label: 'Draft' },
            { key: 'generating_video', label: 'Generating Video' },
            { key: 'video_ready', label: 'Video Ready' },
            { key: 'published', label: 'Published' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                statusFilter === s.key
                  ? 'bg-teal-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Video type filter + search */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            >
              <option value="all">All Video Types</option>
              {Object.entries(VIDEO_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Loading */}
        {scriptsLoading && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <div className="w-6 h-6 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-500">Loading scripts...</p>
          </div>
        )}

        {/* Empty state */}
        {!scriptsLoading && filteredScripts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <p className="text-sm text-slate-500">No scripts found.</p>
            <button
              onClick={() => setActiveTab(1)}
              className="mt-3 text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Generate your first script
            </button>
          </div>
        )}

        {/* Script cards */}
        <div className="space-y-3">
          {filteredScripts.map((script) => (
            <div key={script.id} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
              {/* Edit mode */}
              {editingScript === script.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Title</label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">YouTube Title</label>
                    <input
                      type="text"
                      value={editForm.youtube_title || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, youtube_title: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select
                      value={editForm.status || 'draft'}
                      onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                    >
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateScript(script.id, editForm)}
                      disabled={savingEdit}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
                    >
                      {savingEdit ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => { setEditingScript(null); setEditForm({}); }}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Display mode */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-slate-900 truncate">{script.title || 'Untitled'}</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">
                          {VIDEO_TYPE_LABELS[script.video_type] || script.video_type || 'Unknown'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[script.status] || STATUS_COLORS.draft}`}>
                          {STATUS_LABELS[script.status] || 'Draft'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-2">
                        {script.estimated_duration > 0 && (
                          <span>Duration: {formatDuration(script.estimated_duration)}</span>
                        )}
                        {script.word_count > 0 && (
                          <span>Words: {script.word_count.toLocaleString()}</span>
                        )}
                        <span>Created: {formatDate(script.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditingScript(script.id);
                          setEditForm({
                            title: script.title || '',
                            youtube_title: script.youtube_title || '',
                            status: script.status || 'draft',
                            notes: script.notes || '',
                          });
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => duplicateScript(script)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => copyToClipboard(script.full_script || '', 'Script')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors"
                      >
                        Copy Script
                      </button>
                      <button
                        onClick={() => {
                          setImportScriptId(String(script.id));
                          setActiveTab(3);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium transition-colors"
                      >
                        Video Studio
                      </button>
                      {confirmDelete === script.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-600 font-medium">Delete?</span>
                          <button
                            onClick={() => deleteScript(script.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs px-3 py-1.5 rounded-lg border hover:bg-slate-50"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(script.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expand / Collapse */}
                  <button
                    onClick={() => setExpandedScript(expandedScript === script.id ? null : script.id)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium mt-2"
                  >
                    {expandedScript === script.id ? 'Hide Details' : 'Show Details'}
                  </button>

                  {/* Expanded section */}
                  {expandedScript === script.id && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {script.youtube_title && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">YouTube Title</label>
                          <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg p-3">{script.youtube_title}</p>
                        </div>
                      )}

                      {script.hook && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Hook Preview</label>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{script.hook}</p>
                        </div>
                      )}

                      {script.sections && Array.isArray(script.sections) && script.sections.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Sections</label>
                          <div className="space-y-2">
                            {(() => {
                              let sectionTime = (script.hook_duration || 10);
                              return script.sections.map((section, idx) => {
                                const ts = formatTimestamp(sectionTime);
                                sectionTime += section.duration || 60;
                                return (
                                  <div key={idx} className="bg-slate-50 rounded-lg p-3">
                                    <p className="text-xs text-teal-600 font-mono">[{ts}]</p>
                                    <p className="text-sm font-medium text-slate-800">{section.title || `Section ${idx + 1}`}</p>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </div>
                      )}

                      {script.cta && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Call to Action</label>
                          <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{script.cta}</p>
                        </div>
                      )}

                      {/* Video player if video_url exists */}
                      {script.video_url && (
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Video</label>
                          <a
                            href={script.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium mb-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Watch Video
                          </a>
                          <video
                            src={script.video_url}
                            controls
                            className="w-full max-w-lg rounded-lg border border-slate-200"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================
  //   TAB 1: AI SCRIPT GENERATOR
  // ==========================
  function renderGeneratorTab() {
    const suggestions = getTopicSuggestions(aiVideoType);
    const timestamps = aiResult ? calculateTimestamps(aiResult) : [];

    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">AI Script Generator</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel: Input */}
          <div className="bg-white rounded-xl shadow-sm border p-5 space-y-4">
            {/* Video Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Video Type</label>
              <select
                value={aiVideoType}
                onChange={(e) => { setAiVideoType(e.target.value); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                {Object.entries(VIDEO_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
              <textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                rows={3}
                placeholder="What should the video be about?"
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

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Target Audience</label>
              <select
                value={aiAudience}
                onChange={(e) => setAiAudience(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Duration slider */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Duration: {Math.floor(aiDuration / 60)} minutes
              </label>
              <input
                type="range"
                min={180}
                max={600}
                step={30}
                value={aiDuration}
                onChange={(e) => setAiDuration(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>3 min</span>
                <span>10 min</span>
              </div>
            </div>

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
              <select
                value={aiTone}
                onChange={(e) => setAiTone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              >
                {TONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Additional Context (optional)</label>
              <textarea
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                rows={3}
                placeholder="Any extra details, specific points to cover, or style notes..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateScript}
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
                  Generate Script
                </>
              )}
            </button>

            {/* Error */}
            {aiError && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{aiError}</div>
            )}
          </div>

          {/* Right Panel: Output */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            {/* Placeholder */}
            {!aiResult && !aiGenerating && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                </svg>
                <p className="text-sm text-slate-400">Generate a script to see it here</p>
              </div>
            )}

            {/* Generating spinner */}
            {aiGenerating && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Generating your script...</p>
              </div>
            )}

            {/* Result */}
            {aiResult && !aiGenerating && (
              <div className="space-y-4 max-h-[80vh] overflow-y-auto">
                {/* YouTube Title */}
                {(aiResult.youtubeTitle || aiResult.youtube_title) && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <label className="block text-xs font-medium text-slate-500 mb-1">YouTube Title</label>
                    <p className="text-lg font-bold text-slate-900">{aiResult.youtubeTitle || aiResult.youtube_title}</p>
                  </div>
                )}

                {/* Thumbnail Text */}
                {(aiResult.thumbnailText || aiResult.thumbnail_text) && (
                  <div className="bg-slate-900 rounded-lg p-4 text-center">
                    <p className="text-white font-bold text-lg uppercase tracking-wide">{aiResult.thumbnailText || aiResult.thumbnail_text}</p>
                  </div>
                )}

                {/* Tags */}
                {aiResult.tags && Array.isArray(aiResult.tags) && aiResult.tags.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                      {aiResult.tags.map((tag, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Script Preview with timestamps */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Script Preview</label>
                  <div className="space-y-2">
                    {timestamps.map((ts, idx) => (
                      <div key={idx}>
                        {ts.type === 'hook' && (
                          <div className="bg-slate-100 rounded-lg p-3">
                            <p className="text-xs text-slate-500 font-mono mb-1">[{formatTimestamp(ts.time)}] {ts.label}</p>
                            <p className="text-sm text-slate-800">{ts.text}</p>
                          </div>
                        )}
                        {ts.type === 'section' && (
                          <div className="bg-white border border-slate-200 rounded-lg p-3">
                            <p className="text-xs text-teal-600 font-mono mb-1">[{formatTimestamp(ts.time)}]</p>
                            <p className="text-sm font-semibold text-slate-800 mb-1">{ts.label}</p>
                            <p className="text-sm text-slate-700">{ts.text}</p>
                            {ts.visual_notes && (
                              <div className="mt-2 border-l-2 border-teal-400 pl-3">
                                <p className="text-xs text-teal-600 font-medium">Visual Notes:</p>
                                <p className="text-xs text-slate-500">{ts.visual_notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                        {ts.type === 'cta' && (
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                            <p className="text-xs text-teal-600 font-mono mb-1">[{formatTimestamp(ts.time)}] {ts.label}</p>
                            <p className="text-sm text-slate-800">{ts.text}</p>
                          </div>
                        )}
                        {ts.type === 'outro' && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 font-mono mb-1">[{formatTimestamp(ts.time)}] {ts.label}</p>
                            <p className="text-sm text-slate-700">{ts.text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {timestamps.length === 0 && (aiResult.fullScript || aiResult.full_script) && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{aiResult.fullScript || aiResult.full_script}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* YouTube Description */}
                {(aiResult.youtubeDescription || aiResult.youtube_description) && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">YouTube Description</label>
                    <textarea
                      readOnly
                      value={aiResult.youtubeDescription || aiResult.youtube_description}
                      rows={6}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-slate-50 focus:outline-none"
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={async () => {
                      const data = await saveScript({
                        title: aiResult.title || aiTopic || 'Untitled Script',
                        youtube_title: aiResult.youtubeTitle || aiResult.youtube_title || '',
                        video_type: aiResult.video_type || aiVideoType,
                        status: 'draft',
                        estimated_duration: aiResult.estimatedDuration || aiResult.estimated_duration || aiDuration,
                        word_count: aiResult.wordCount || aiResult.word_count || 0,
                        hook: aiResult.hook || '',
                        sections: aiResult.sections || [],
                        cta: aiResult.cta || '',
                        outro: aiResult.outro || '',
                        thumbnail_text: aiResult.thumbnailText || aiResult.thumbnail_text || '',
                        tags: aiResult.tags || [],
                        youtube_description: aiResult.youtubeDescription || aiResult.youtube_description || '',
                        full_script: aiResult.fullScript || aiResult.full_script || '',
                        target_audience: aiAudience,
                        tone: aiTone,
                      });
                      if (data) {
                        setActiveTab(0);
                      }
                    }}
                    className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                  >
                    Save as Draft
                  </button>
                  <button
                    onClick={() => copyToClipboard(aiResult.fullScript || aiResult.full_script || '', 'Full script')}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Copy Full Script
                  </button>
                  <button
                    onClick={() => copyToClipboard(aiResult.youtubeDescription || aiResult.youtube_description || '', 'Description')}
                    className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Copy Description
                  </button>
                </div>

                {/* Save message */}
                {saveMsg && (
                  <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">{saveMsg}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================
  //   TAB 2: TOPIC LIBRARY
  // ==========================
  function renderTopicLibraryTab() {
    return (
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Topic Library</h2>
        <p className="text-sm text-slate-500 mb-6">Browse pre-built video topic ideas organised by category. Click &quot;Use This Topic&quot; to load it into the AI Script Generator.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.entries(TOPIC_LIBRARY).map(([key, category]) => (
            <div key={key} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{category.emoji}</span>
                <h3 className="text-base font-bold text-slate-900">{category.label}</h3>
              </div>
              <div className="space-y-3">
                {category.topics.map((topic, idx) => (
                  <div key={idx} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-slate-800 mb-0.5">{topic.title}</p>
                    <p className="text-xs text-slate-500 mb-2">{topic.desc}</p>
                    <button
                      onClick={() => useTopic(topic)}
                      className="text-xs px-3 py-1 rounded-lg border border-teal-300 text-teal-700 hover:bg-teal-50 font-medium transition-colors"
                    >
                      Use This Topic
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ==========================
  //   VIDEO IMPORT HELPERS
  // ==========================

  // Upload video file and link to script
  async function uploadVideo(file, scriptId) {
    setImportUploading(true);
    setImportProgress('Uploading video...');
    try {
      const formData = new FormData();
      formData.append('video', file);
      if (scriptId) formData.append('script_id', scriptId);

      const token = getToken();
      const res = await fetch('/api/youtube/upload', {
        method: 'POST',
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setImportProgress('Upload complete!');
      setToast('Video uploaded successfully!');
      setTimeout(() => setToast(''), 3000);
      loadScripts();
      return data;
    } catch (err) {
      setImportProgress('Error: ' + err.message);
      throw err;
    } finally {
      setImportUploading(false);
    }
  }

  // ---- Publish to YouTube ----
  async function publishToYouTube(scriptId) {
    setPublishing(true);
    setPublishResult(null);
    try {
      const data = await apiFetch('/api/youtube/publish', {
        method: 'POST',
        body: JSON.stringify({ script_id: scriptId, privacy: publishPrivacy }),
      });
      setPublishResult({ success: true, url: data.youtube_url });
      setToast('Video published to YouTube!');
      setTimeout(() => setToast(''), 4000);
      loadScripts();
    } catch (err) {
      setPublishResult({ success: false, error: err.message });
    } finally {
      setPublishing(false);
    }
  }

  // ==========================
  //   TAB 3: VIDEO STUDIO
  // ==========================
  function renderVideoStudioTab() {
    const completedScripts = scripts.filter((s) => s.video_url);
    const availableScripts = scripts.filter((s) => s.status !== 'published');
    const importScript = importScriptId ? scripts.find((s) => String(s.id) === String(importScriptId)) : null;

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Video Studio</h2>
          <a
            href="https://app.heygen.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open HeyGen
          </a>
        </div>

        {/* ===== IMPORT VIDEO ===== */}
        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6 space-y-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-800">Import Video</h3>
          </div>
          <p className="text-xs text-slate-500">Upload a video from HeyGen (or anywhere else) and link it to a script for YouTube metadata.</p>

          {/* Link to script */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Link to Script (optional)</label>
            <select
              value={importScriptId}
              onChange={(e) => setImportScriptId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500"
            >
              <option value="">-- No script (upload only) --</option>
              {availableScripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title || 'Untitled'} ({STATUS_LABELS[s.status] || 'Draft'})
                </option>
              ))}
            </select>
          </div>

          {/* Drop zone / upload */}
          <div
            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-teal-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById('videoFileInput')?.click()}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-teal-400', 'bg-teal-50'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50'); }}
            onDrop={async (e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50');
              const file = e.dataTransfer.files[0];
              if (file) await uploadVideo(file, importScriptId || null);
            }}
          >
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-slate-600">Drop video file here or click to browse</p>
            <p className="text-xs text-slate-400 mt-1">MP4, WebM, MOV up to 500MB</p>
          </div>
          <input
            id="videoFileInput"
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await uploadVideo(file, importScriptId || null);
              e.target.value = '';
            }}
          />

          {/* Upload progress */}
          {importUploading && (
            <div className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg">
              <div className="w-5 h-5 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin" />
              <span className="text-sm text-teal-700">{importProgress}</span>
            </div>
          )}
          {!importUploading && importProgress && (
            <p className="text-sm text-slate-600">{importProgress}</p>
          )}
        </div>

        {/* ===== YOUTUBE METADATA (when script selected) ===== */}
        {importScript && (
          <div className="bg-white rounded-xl shadow-sm border p-5 mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <h3 className="text-sm font-semibold text-slate-800">YouTube Metadata</h3>
              <span className="text-xs text-slate-500">Copy these into YouTube Studio when uploading</span>
            </div>

            {/* Title */}
            {importScript.youtube_title && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-500">Title</label>
                  <button
                    onClick={() => copyToClipboard(importScript.youtube_title, 'Title')}
                    className={`text-xs px-2 py-1 rounded font-medium transition-colors ${copiedField === 'Title' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {copiedField === 'Title' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-900 bg-slate-50 rounded-lg p-3">{importScript.youtube_title}</p>
              </div>
            )}

            {/* Description */}
            {importScript.youtube_description && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-500">Description</label>
                  <button
                    onClick={() => copyToClipboard(importScript.youtube_description, 'Description')}
                    className={`text-xs px-2 py-1 rounded font-medium transition-colors ${copiedField === 'Description' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {copiedField === 'Description' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea readOnly value={importScript.youtube_description} rows={5} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none" />
              </div>
            )}

            {/* Tags */}
            {importScript.tags && importScript.tags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-500">Tags</label>
                  <button
                    onClick={() => copyToClipboard(importScript.tags.join(', '), 'Tags')}
                    className={`text-xs px-2 py-1 rounded font-medium transition-colors ${copiedField === 'Tags' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {copiedField === 'Tags' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {importScript.tags.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 text-xs font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Thumbnail text */}
            {importScript.thumbnail_text && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-500">Thumbnail Text</label>
                  <button
                    onClick={() => copyToClipboard(importScript.thumbnail_text, 'Thumbnail')}
                    className={`text-xs px-2 py-1 rounded font-medium transition-colors ${copiedField === 'Thumbnail' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {copiedField === 'Thumbnail' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 text-center">
                  <p className="text-white font-bold text-lg uppercase tracking-wide">{importScript.thumbnail_text}</p>
                </div>
              </div>
            )}

            {/* Copy All button */}
            <button
              onClick={() => {
                const all = [
                  `TITLE:\n${importScript.youtube_title || importScript.title || ''}`,
                  `\nDESCRIPTION:\n${importScript.youtube_description || ''}`,
                  `\nTAGS:\n${(importScript.tags || []).join(', ')}`,
                  importScript.thumbnail_text ? `\nTHUMBNAIL TEXT:\n${importScript.thumbnail_text}` : '',
                ].join('\n');
                copyToClipboard(all, 'All metadata');
              }}
              className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${copiedField === 'All metadata' ? 'bg-green-600 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
            >
              {copiedField === 'All metadata' ? 'All Metadata Copied!' : 'Copy All Metadata'}
            </button>
          </div>
        )}

        {/* ===== PUBLISH TO YOUTUBE ===== */}
        {importScript && importScript.video_url && (
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.64 31.64 0 000 12a31.64 31.64 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.64 31.64 0 0024 12a31.64 31.64 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
              Publish to YouTube
            </h3>

            {importScript.youtube_video_id ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-green-800 mb-2">Already published to YouTube</p>
                <a
                  href={importScript.youtube_url || `https://www.youtube.com/watch?v=${importScript.youtube_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.64 31.64 0 000 12a31.64 31.64 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.64 31.64 0 0024 12a31.64 31.64 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                  View on YouTube
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Privacy Setting</label>
                  <select
                    value={publishPrivacy}
                    onChange={(e) => setPublishPrivacy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="private">Private (only you can see it)</option>
                    <option value="unlisted">Unlisted (anyone with the link)</option>
                    <option value="public">Public (visible to everyone)</option>
                  </select>
                </div>

                <button
                  onClick={() => publishToYouTube(importScript.id)}
                  disabled={publishing}
                  className="w-full px-4 py-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {publishing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Publishing to YouTube...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19 31.64 31.64 0 000 12a31.64 31.64 0 00.5 5.81 3.02 3.02 0 002.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14A31.64 31.64 0 0024 12a31.64 31.64 0 00-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
                      Publish to YouTube
                    </>
                  )}
                </button>

                {publishResult && !publishResult.success && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-700">{publishResult.error}</p>
                  </div>
                )}
                {publishResult && publishResult.success && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-medium text-green-800 mb-2">Published successfully!</p>
                    <a
                      href={publishResult.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-red-600 font-medium hover:underline"
                    >
                      View on YouTube &rarr;
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== VIDEO LIBRARY ===== */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Video Library</h3>
          {completedScripts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-slate-400">No videos yet. Create one in HeyGen and import it above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedScripts.map((script) => (
                <div key={script.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900">{script.title || 'Untitled'}</p>
                        {script.youtube_video_id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">Published</span>
                        )}
                      </div>
                      {script.youtube_title && (
                        <p className="text-xs text-slate-500 truncate">{script.youtube_title}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {script.youtube_video_id && (
                        <a
                          href={script.youtube_url || `https://www.youtube.com/watch?v=${script.youtube_video_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
                        >
                          YouTube
                        </a>
                      )}
                      <button
                        onClick={() => { setImportScriptId(String(script.id)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                      >
                        YouTube Metadata
                      </button>
                      <a
                        href={script.video_url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                  <video
                    src={script.video_url}
                    controls
                    className="w-full rounded-lg border border-slate-200"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================
  //       MAIN RENDER
  // ==========================
  return (
    <div className="fixed inset-0 z-[99999] bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-slate-900 text-white px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <a href="/admin" className="text-slate-400 hover:text-white text-sm">&larr; Admin</a>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">YouTube Scripts</h1>
              <p className="text-slate-400 text-sm">AI-powered video content for CareCallAI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => setActiveTab(idx)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === idx
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[999999] bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 0 && renderScriptsTab()}
        {activeTab === 1 && renderGeneratorTab()}
        {activeTab === 2 && renderTopicLibraryTab()}
        {activeTab === 3 && renderVideoStudioTab()}
      </div>

      {/* Utility styles */}
      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
